import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server } from "socket.io";
import { HoldemEngine } from "./lib/poker/holdem-engine";
import { verifyFirebaseIdToken } from "./server/firebase-verify";
import { syncChipsToFirestore, type ChipResult } from "./server/chip-sync";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const CORS_ORIGIN = process.env.POKER_CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.NEXT_PUBLIC_APP_URL ?? "",
].filter(Boolean);

type ClientMeta = { roomId: string; playerId: string; name: string };
const chipsBefore = new Map<string, Map<string, number>>();
const rooms = new Map<string, HoldemEngine>();

function getRoom(id: string): HoldemEngine {
  let r = rooms.get(id);
  if (!r) {
    r = new HoldemEngine({ smallBlind: 1, bigBlind: 2, maxSeats: 9, turnSeconds: 30 });
    rooms.set(id, r);
  }
  return r;
}

function broadcastRoom(io: Server, roomId: string) {
  const engine = rooms.get(roomId);
  if (!engine) return;
  const room = io.sockets.adapter.rooms.get(roomId);
  if (!room) return;
  for (const sid of room) {
    const sock = io.sockets.sockets.get(sid);
    const meta = sock?.data as ClientMeta | undefined;
    if (!sock || !meta?.playerId) continue;
    sock.emit("state", engine.toPublicView(meta.playerId));
  }
}

function snapshotChipsBefore(roomId: string, engine: HoldemEngine) {
  const s = new Map<string, number>();
  for (const seat of engine.seats) if (seat) s.set(seat.id, seat.chips);
  chipsBefore.set(roomId, s);
}

function maybeSyncChips(roomId: string, engine: HoldemEngine) {
  if (!engine.handFinished) return;
  const before = chipsBefore.get(roomId);
  if (!before) return;
  const results: ChipResult[] = [];
  for (const seat of engine.seats) {
    if (!seat) continue;
    const prev = before.get(seat.id) ?? seat.chips;
    const delta = seat.chips - prev;
    results.push({ uid: seat.id, chips: seat.chips, delta, won: delta > 0 });
  }
  chipsBefore.delete(roomId);
  void syncChipsToFirestore(roomId, engine.handNumber, results);
}

function finishJoin(
  socket: import("socket.io").Socket,
  io: Server,
  payload: { roomId?: string; playerId: string; name: string; buyIn?: number; avatar?: string },
  roomId: string, playerId: string, name: string, buyIn: number,
  ack?: (r: { ok: boolean; error?: string }) => void,
) {
  void payload.roomId;
  const engine = getRoom(roomId);
  const existing = engine.seats.find((p) => p?.id === playerId);
  if (!existing) {
    const res = engine.addPlayer(playerId, name, buyIn, payload.avatar ?? "🎭");
    if (!res.ok) { ack?.({ ok: false, error: res.error }); return; }
  } else { existing.name = name; }
  for (const room of socket.rooms) if (room !== socket.id) socket.leave(room);
  socket.join(roomId);
  (socket.data as ClientMeta) = { roomId, playerId, name };
  if (!chipsBefore.has(roomId)) snapshotChipsBefore(roomId, engine);
  engine.tryStartHand();
  ack?.({ ok: true });
  broadcastRoom(io, roomId);
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    socket.on("join", (
      payload: { roomId: string; playerId: string; name: string; buyIn?: number; avatar?: string; idToken?: string },
      ack?: (r: { ok: boolean; error?: string }) => void,
    ) => {
      const roomId = payload.roomId || "royal-holdem-1";
      const playerId = payload.playerId;
      const name = payload.name?.trim() || "שחקן";
      const buyIn = payload.buyIn ?? 2000;
      if (!playerId) { ack?.({ ok: false, error: "חסר מזהה שחקן" }); return; }
      if (payload.idToken) {
        verifyFirebaseIdToken(payload.idToken, playerId).then((ok) => {
          if (!ok) { ack?.({ ok: false, error: "אסימון אימות לא תקין" }); return; }
          finishJoin(socket, io, payload, roomId, playerId, name, buyIn, ack);
        });
        return;
      }
      finishJoin(socket, io, payload, roomId, playerId, name, buyIn, ack);
    });

    socket.on("rebuy", async (
      payload: { idToken: string },
      ack?: (r: { ok: boolean; error?: string; chips?: number }) => void,
    ) => {
      const meta = socket.data as ClientMeta;
      if (!meta?.roomId || !meta?.playerId) { ack?.({ ok: false, error: "לא מחובר" }); return; }
      const engine = rooms.get(meta.roomId);
      if (!engine) { ack?.({ ok: false, error: "חדר לא נמצא" }); return; }
      const seat = engine.seats.find((s) => s?.id === meta.playerId);
      if (!seat) { ack?.({ ok: false, error: "שחקן לא בשולחן" }); return; }
      if (seat.chips >= 100) { ack?.({ ok: false, error: `יש לך ${seat.chips} צ'יפים` }); return; }
      try {
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
        const res = await fetch(`${appUrl}/api/poker/rebuy`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${payload.idToken}` },
        });
        const data = (await res.json()) as { ok?: boolean; added?: number; error?: string };
        if (!res.ok || !data.ok) { ack?.({ ok: false, error: data.error ?? "שגיאת rebuy" }); return; }
        seat.chips += data.added ?? 10000;
        seat.folded = false;
        engine.tryStartHand();
        broadcastRoom(io, meta.roomId);
        ack?.({ ok: true, chips: seat.chips });
      } catch (e) { ack?.({ ok: false, error: (e as Error).message }); }
    });

    socket.on("action", (payload: { kind: "fold" | "check" | "call" | "raise"; raiseTo?: number }) => {
      const meta = socket.data as ClientMeta;
      if (!meta?.roomId || !meta?.playerId) return;
      const engine = rooms.get(meta.roomId);
      if (!engine) return;
      const wasFinished = engine.handFinished;
      const r = engine.act(meta.playerId, payload.kind, payload.raiseTo);
      if (!r.ok) { socket.emit("actionError", r.error); return; }
      engine.tryStartHand();
      if (!wasFinished && engine.handFinished) maybeSyncChips(meta.roomId, engine);
      if (!engine.handFinished && !chipsBefore.has(meta.roomId)) snapshotChipsBefore(meta.roomId, engine);
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
      const wasFinished = engine.handFinished;
      engine.removePlayer(meta.playerId);
      engine.tryStartHand();
      if (!wasFinished && engine.handFinished) maybeSyncChips(meta.roomId, engine);
      broadcastRoom(io, meta.roomId);
    });
  });

  // /rooms endpoint for lobby
  httpServer.on("request", (req, res) => {
    if (req.url === "/api/socket-rooms" && req.method === "GET") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(JSON.stringify({
        rooms: Array.from(rooms.entries()).map(([id, e]) => ({
          id,
          playerCount: e.seats.filter(Boolean).length,
          maxSeats: e.seats.length,
          handNumber: e.handNumber,
          pot: e.pot,
          handFinished: e.handFinished,
          smallBlind: e.config.smallBlind,
          bigBlind: e.config.bigBlind,
        })),
      }));
    }
  });

  // Turn timeout loop
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, engine] of rooms) {
      if (engine.handFinished || engine.actionSeat < 0 || !engine.turnDeadline) continue;
      if (now < engine.turnDeadline) continue;
      const wasFinished = engine.handFinished;
      engine.timeoutSeat(engine.actionSeat);
      engine.tryStartHand();
      if (!wasFinished && engine.handFinished) maybeSyncChips(roomId, engine);
      if (!engine.handFinished && !chipsBefore.has(roomId)) snapshotChipsBefore(roomId, engine);
      broadcastRoom(io, roomId);
    }
  }, 1000);

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO path: /api/socket`);
  });
});
