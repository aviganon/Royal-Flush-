import { createServer } from "node:http";
import { Server } from "socket.io";
import { HoldemEngine } from "../lib/poker/holdem-engine";
import { verifyFirebaseIdToken } from "./firebase-verify";
import { syncChipsToFirestore } from "./chip-sync";

const PORT = Number(process.env.POKER_SOCKET_PORT) || 4000;
const CORS_ORIGIN = process.env.POKER_CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

type ClientMeta = {
  roomId: string;
  playerId: string;
  name: string;
};

const rooms = new Map<string, HoldemEngine>();

type TableVariant = "holdem" | "omaha";

function getRoom(
  id: string,
  initial?: { smallBlind: number; bigBlind: number; variant?: TableVariant },
): HoldemEngine {
  const existing = rooms.get(id);
  if (existing) return existing;

  let sb = initial?.smallBlind ?? 1;
  let bb = initial?.bigBlind ?? 2;
  sb = Math.max(1, Math.min(250, Math.floor(sb)));
  bb = Math.max(sb + 1, Math.min(500, Math.floor(bb)));

  const variant: TableVariant = initial?.variant === "omaha" ? "omaha" : "holdem";

  const r = new HoldemEngine({
    smallBlind: sb,
    bigBlind: bb,
    maxSeats: 9,
    turnSeconds: 30,
    variant,
    onHandSettled: ({ handNumber, results }) => {
      void syncChipsToFirestore(
        id,
        handNumber,
        results.map((x) => ({
          uid: x.id,
          chips: x.chips,
          delta: x.delta,
          won: x.won,
        })),
      );
    },
  });
  rooms.set(id, r);
  return r;
}

function broadcastRoom(io: Server, roomId: string) {
  const engine = rooms.get(roomId);
  if (!engine) return;
  const room = io.sockets.adapter.rooms.get(roomId);
  if (!room) return;
  for (const socketId of room) {
    const sock = io.sockets.sockets.get(socketId);
    const meta = sock?.data as ClientMeta | undefined;
    if (!sock || !meta?.playerId) continue;
    sock.emit("state", engine.toPublicView(meta.playerId));
  }
}

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] },
});

/** רק /rooms — לא לסגור תשובה לבקשות אחרות (socket.io) */
httpServer.prependListener("request", (req, res) => {
  if (req.method !== "GET") return;
  let pathname = "";
  try {
    pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
  } catch {
    return;
  }
  if (pathname !== "/rooms") return;

  const data = Array.from(rooms.entries()).map(([roomId, engine]) => ({
    id: roomId,
    gameType: engine.config.variant === "omaha" ? "omaha" : "holdem",
    playerCount: engine.seats.filter(Boolean).length,
    maxSeats: engine.seats.length,
    handNumber: engine.handNumber,
    pot: engine.pot,
    handFinished: engine.handFinished,
    smallBlind: engine.config.smallBlind,
    bigBlind: engine.config.bigBlind,
  }));
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify({ rooms: data }));
});

io.on("connection", (socket) => {
  socket.on(
    "join",
    (
      payload: {
        roomId: string;
        playerId: string;
        name: string;
        buyIn?: number;
        avatar?: string;
        idToken?: string;
        smallBlind?: number;
        bigBlind?: number;
        gameType?: "holdem" | "omaha";
      },
      ack?: (r: { ok: boolean; error?: string }) => void,
    ) => {
      const roomId = payload.roomId || "royal-holdem-1";
      const playerId = payload.playerId;
      const name = payload.name?.trim() || "שחקן";
      const buyIn = payload.buyIn ?? 2000;
      if (!playerId) {
        ack?.({ ok: false, error: "חסר מזהה שחקן" });
        return;
      }
      if (payload.idToken) {
        verifyFirebaseIdToken(payload.idToken, playerId).then((ok) => {
          if (!ok) {
            ack?.({ ok: false, error: "אסימון אימות לא תקין" });
            return;
          }
          finishJoin(socket, io, payload, roomId, playerId, name, buyIn, ack);
        });
        return;
      }
      finishJoin(socket, io, payload, roomId, playerId, name, buyIn, ack);
    },
  );

  socket.on(
    "rebuy",
    async (
      payload: { idToken: string },
      ack?: (r: { ok: boolean; error?: string; chips?: number }) => void,
    ) => {
      const meta = socket.data as ClientMeta;
      if (!meta?.roomId || !meta?.playerId) {
        ack?.({ ok: false, error: "לא מחובר לחדר" });
        return;
      }
      const engine = rooms.get(meta.roomId);
      if (!engine) {
        ack?.({ ok: false, error: "חדר לא נמצא" });
        return;
      }
      const seat = engine.seats.find((s) => s?.id === meta.playerId);
      if (!seat) {
        ack?.({ ok: false, error: "שחקן לא בשולחן" });
        return;
      }
      if (seat.chips >= 100) {
        ack?.({ ok: false, error: `יש לך ${seat.chips} צ'יפים` });
        return;
      }
      try {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
        const res = await fetch(`${appUrl}/api/poker/rebuy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${payload.idToken}`,
          },
        });
        const data = (await res.json()) as { ok?: boolean; added?: number; error?: string };
        if (!res.ok || !data.ok) {
          ack?.({ ok: false, error: data.error ?? "שגיאת rebuy" });
          return;
        }
        seat.chips += data.added ?? 10000;
        seat.folded = false;
        engine.tryStartHand();
        broadcastRoom(io, meta.roomId);
        ack?.({ ok: true, chips: seat.chips });
      } catch (err) {
        ack?.({ ok: false, error: (err as Error).message });
      }
    },
  );

  function finishJoin(
    socket: import("socket.io").Socket,
    io: Server,
    payload: {
      roomId?: string;
      playerId: string;
      name: string;
      buyIn?: number;
      avatar?: string;
      smallBlind?: number;
      bigBlind?: number;
      gameType?: "holdem" | "omaha";
    },
    roomId: string,
    playerId: string,
    name: string,
    buyIn: number,
    ack?: (r: { ok: boolean; error?: string }) => void,
  ) {
    void payload.roomId;
    const roomExists = rooms.has(roomId);
    const variant: TableVariant = payload.gameType === "omaha" ? "omaha" : "holdem";
    const engine = getRoom(
      roomId,
      roomExists
        ? undefined
        : {
            smallBlind: payload.smallBlind ?? 1,
            bigBlind: payload.bigBlind ?? 2,
            variant,
          },
    );
    const existing = engine.seats.find((p) => p?.id === playerId);
    if (!existing) {
      const res = engine.addPlayer(playerId, name, buyIn, payload.avatar ?? "🎭");
      if (!res.ok) {
        ack?.({ ok: false, error: res.error });
        return;
      }
    } else {
      existing.name = name;
    }
    for (const room of socket.rooms) {
      if (room !== socket.id) socket.leave(room);
    }
    socket.join(roomId);
    (socket.data as ClientMeta) = { roomId, playerId, name };
    engine.tryStartHand();
    ack?.({ ok: true });
    broadcastRoom(io, roomId);
  }

  socket.on("action", (payload: { kind: "fold" | "check" | "call" | "raise"; raiseTo?: number }) => {
    const meta = socket.data as ClientMeta;
    if (!meta?.roomId || !meta?.playerId) return;
    const engine = rooms.get(meta.roomId);
    if (!engine) return;
    const r = engine.act(meta.playerId, payload.kind, payload.raiseTo);
    if (!r.ok) {
      socket.emit("actionError", r.error);
      return;
    }
    engine.tryStartHand();
    broadcastRoom(io, meta.roomId);
  });

  socket.on("chat", (text: string) => {
    const meta = socket.data as ClientMeta;
    if (!meta?.roomId || !meta?.playerId) return;
    const engine = rooms.get(meta.roomId);
    if (!engine) return;
    const p = engine.seats.find((x) => x?.id === meta.playerId);
    const msg = text?.slice(0, 280) ?? "";
    if (!msg.trim()) return;
    engine.log(`${p?.name ?? meta.name}: ${msg}`);
    broadcastRoom(io, meta.roomId);
  });

  socket.on("disconnect", () => {
    const meta = socket.data as ClientMeta;
    if (!meta?.roomId || !meta?.playerId) return;
    const engine = rooms.get(meta.roomId);
    if (!engine) return;
    engine.removePlayer(meta.playerId);
    engine.tryStartHand();
    broadcastRoom(io, meta.roomId);
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [roomId, engine] of rooms) {
    if (engine.handFinished || engine.actionSeat < 0 || !engine.turnDeadline) continue;
    if (now < engine.turnDeadline) continue;
    engine.timeoutSeat(engine.actionSeat);
    engine.tryStartHand();
    broadcastRoom(io, roomId);
  }
}, 1000);

httpServer.listen(PORT, () => {
  console.log(`[poker] Socket.IO on :${PORT}`);
  if (process.env.NODE_ENV === "production" && !process.env.POKER_SERVER_SECRET?.trim()) {
    console.warn(
      "[poker] אזהרה: POKER_SERVER_SECRET חסר בייצור — סנכרון צ'יפים ל-Firestore לא יאומת / ייחסם ב-API",
    );
  }
});
