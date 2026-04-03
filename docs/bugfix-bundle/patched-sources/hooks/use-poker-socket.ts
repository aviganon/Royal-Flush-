"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { TablePublicView } from "@/lib/poker/holdem-engine";
import { toast } from "sonner";

// In production, Socket.IO runs on same server via /api/socket path
// In development, it runs on a separate port 4000
const defaultUrl =
  typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? window.location.origin  // same origin in production
    : (typeof process !== "undefined"
        ? process.env.NEXT_PUBLIC_POKER_SOCKET_URL || "http://localhost:4000"
        : "http://localhost:4000");

const socketPath =
  typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? "/api/socket"  // combined server in production
    : undefined;     // default path in dev

export function usePokerSocket(opts: {
  roomId: string;
  playerId: string;
  playerName: string;
  buyIn?: number;
  enabled: boolean;
  getIdToken?: () => Promise<string | null>;
}) {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<TablePublicView | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const getIdTokenRef = useRef(opts.getIdToken);
  getIdTokenRef.current = opts.getIdToken;

  useEffect(() => {
    if (!opts.enabled || !opts.roomId || !opts.playerId) return;

    const socket = io(defaultUrl, {
      path: socketPath,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 8,
      reconnectionDelay: 800,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      void (async () => {
        const idToken = (await getIdTokenRef.current?.()) ?? undefined;
        socket.emit(
          "join",
          {
            roomId: opts.roomId,
            playerId: opts.playerId,
            name: opts.playerName,
            buyIn: opts.buyIn ?? 2000,
            idToken,
          },
          (ack: { ok: boolean; error?: string }) => {
            if (!ack?.ok && ack?.error) toast.error(ack.error);
          },
        );
      })();
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("state", (s: TablePublicView) => setState(s));
    socket.on("actionError", (msg: string) => toast.error(msg || "פעולה נדחתה"));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [opts.enabled, opts.roomId, opts.playerId, opts.playerName, opts.buyIn]);

  const sendAction = useCallback(
    (kind: "fold" | "check" | "call" | "raise", raiseTo?: number) => {
      socketRef.current?.emit("action", { kind, raiseTo });
    },
    [],
  );

  const sendChat = useCallback((text: string) => {
    socketRef.current?.emit("chat", text);
  }, []);

  /** Re-buy — שולח idToken לשרת, מקבל chips חדשים */
  const sendRebuy = useCallback(
    async (getIdToken: () => Promise<string | null>) => {
      const idToken = await getIdToken();
      if (!idToken) { toast.error("לא מחובר"); return; }
      socketRef.current?.emit(
        "rebuy",
        { idToken },
        (ack: { ok: boolean; error?: string; chips?: number }) => {
          if (ack?.ok) {
            toast.success(`Rebuy! יש לך ${(ack.chips ?? 0).toLocaleString()} צ'יפים 🎉`);
          } else {
            toast.error(ack?.error ?? "שגיאת rebuy");
          }
        },
      );
    },
    [],
  );

  return { connected, state, sendAction, sendChat, sendRebuy };
}
