import { createServer } from "node:http";
import { Server } from "socket.io";
import { HoldemEngine } from "../lib/poker/holdem-engine";
import { verifyFirebaseIdToken } from "./firebase-verify";

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

function getRoom(id: string): HoldemEngine {
  let r = rooms.get(id);
  if (!r) {
    r = new HoldemEngine({
      smallBlind: 1,
      bigBlind: 2,
      maxSeats: 9,
      turnSeconds: 30,
    });
    rooms.set(id, r);
  }
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

  function finishJoin(
    socket: import("socket.io").Socket,
    io: Server,
    payload: {
      roomId?: string;
      playerId: string;
      name: string;
      buyIn?: number;
      avatar?: string;
    },
    roomId: string,
    playerId: string,
    name: string,
    buyIn: number,
    ack?: (r: { ok: boolean; error?: string }) => void,
  ) {
    void payload.roomId;
    const engine = getRoom(roomId);
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
});
