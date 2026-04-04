"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { TablePublicView } from "@/lib/poker/holdem-engine";
import { getPokerSocketUrl } from "@/lib/poker/socket-url";
import { toast } from "sonner";

export function usePokerSocket(opts: {
  roomId: string;
  playerId: string;
  playerName: string;
  buyIn?: number;
  enabled: boolean;
  getIdToken?: () => Promise<string | null>;
  avatarId?: string;
  /** לחדר חדש בלבד — השרת מתעלם אם החדר כבר קיים */
  tableConfig?: { smallBlind: number; bigBlind: number };
  gameType?: "holdem" | "omaha";
}) {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<TablePublicView | null>(null);
  const [rebuyPending, setRebuyPending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const getIdTokenRef = useRef(opts.getIdToken);
  getIdTokenRef.current = opts.getIdToken;

  useEffect(() => {
    if (!opts.enabled || !opts.roomId || !opts.playerId) return;

    const url = getPokerSocketUrl();
    const socket = io(url, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 12,
      reconnectionDelay: 600,
      timeout: 15000,
    });
    socketRef.current = socket;

    let connectErrorToastSent = false;

    socket.on("connect", () => {
      connectErrorToastSent = false;
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
            avatar: opts.avatarId,
            smallBlind: opts.tableConfig?.smallBlind,
            bigBlind: opts.tableConfig?.bigBlind,
            gameType: opts.gameType ?? "holdem",
          },
          (ack: { ok: boolean; error?: string }) => {
            if (!ack?.ok && ack?.error) toast.error(ack.error);
          },
        );
      })();
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err: Error) => {
      console.error("[poker-socket]", url, err.message);
      if (!connectErrorToastSent) {
        connectErrorToastSent = true;
        toast.error(
          `לא ניתן להתחבר לשרת המשחק (${url}). ודאו שפורט 4000 רץ (npm run dev או npm run dev:socket).`,
          { duration: 8000 },
        );
      }
    });
    socket.on("state", (s: TablePublicView) => setState(s));
    socket.on("actionError", (msg: string) => toast.error(msg || "פעולה נדחתה"));

    return () => {
      socket.off("connect_error");
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [
    opts.enabled,
    opts.roomId,
    opts.playerId,
    opts.playerName,
    opts.buyIn,
    opts.avatarId,
    opts.tableConfig?.smallBlind,
    opts.tableConfig?.bigBlind,
    opts.gameType,
  ]);

  const sendAction = useCallback(
    (kind: "fold" | "check" | "call" | "raise", raiseTo?: number) => {
      socketRef.current?.emit("action", { kind, raiseTo });
    },
    [],
  );

  const sendChat = useCallback((text: string) => {
    socketRef.current?.emit("chat", text);
  }, []);

  const requestRebuy = useCallback(async (): Promise<boolean> => {
    const sock = socketRef.current;
    if (!sock?.connected) {
      toast.error("לא מחובר לשרת המשחק");
      return false;
    }
    const idToken = (await getIdTokenRef.current?.()) ?? null;
    if (!idToken) {
      toast.error("יש להתחבר מחדש");
      return false;
    }
    setRebuyPending(true);
    const ok = await new Promise<boolean>((resolve) => {
      sock.emit(
        "rebuy",
        { idToken },
        (ack: { ok?: boolean; error?: string }) => {
          if (ack?.ok) {
            toast.success("נטענו צ'יפים לשולחן");
            resolve(true);
          } else {
            toast.error(ack?.error ?? "לא ניתן לטעון כעת");
            resolve(false);
          }
        },
      );
    });
    setRebuyPending(false);
    return ok;
  }, []);

  return { connected, state, sendAction, sendChat, requestRebuy, rebuyPending };
}
