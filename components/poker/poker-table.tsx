"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Timer,
  MessageCircle,
  History,
  Volume2,
  VolumeX,
  ChevronRight,
  WifiOff,
  Loader2,
} from "lucide-react";
import { usePokerSocket } from "@/hooks/use-poker-socket";
import { getPokerSocketUrl } from "@/lib/poker/socket-url";
import { getAvatarById } from "@/components/poker/avatar-selector";
import type { TablePublicView } from "@/lib/poker/holdem-engine";
import type { Card } from "@/lib/poker/types";

interface PokerTableProps {
  gameType: "holdem" | "omaha";
  onLeaveTable: () => void;
  roomId: string;
  playerId: string;
  playerName: string;
  buyIn?: number;
  getIdToken?: () => Promise<string | null>;
  tableConfig?: { smallBlind: number; bigBlind: number };
  avatarId?: string;
}

type SeatedPlayer = Extract<
  TablePublicView["players"][number],
  { empty: false }
>;

const suitSymbols = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

const suitColors = {
  spades: "text-foreground",
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-foreground",
};

function seatPosition(seat: number, maxSeats = 9) {
  const angle = (seat / maxSeats) * 2 * Math.PI - Math.PI / 2;
  const radiusX = 42;
  const radiusY = 35;
  return {
    x: 50 + radiusX * Math.cos(angle),
    y: 50 + radiusY * Math.sin(angle),
  };
}

export function PokerTable({
  gameType,
  onLeaveTable,
  roomId,
  playerId,
  playerName,
  buyIn = 2000,
  getIdToken,
  tableConfig,
  avatarId,
}: PokerTableProps) {
  const online = gameType === "holdem" || gameType === "omaha";
  const { connected, state, sendAction, sendChat, requestRebuy, rebuyPending } =
    usePokerSocket({
      roomId,
      playerId,
      playerName,
      buyIn,
      enabled: online,
      getIdToken,
      avatarId,
      tableConfig,
      gameType,
    });

  const [betAmount, setBetAmount] = useState([4]);
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const me = useMemo((): SeatedPlayer | null => {
    if (!state) return null;
    for (const p of state.players) {
      if (p.empty) continue;
      if (p.id === playerId) return p;
    }
    return null;
  }, [state, playerId]);

  const isMyTurn = !!me && me.isTurn && state && !state.handFinished;

  const timeLeft =
    state?.turnDeadline && isMyTurn
      ? Math.max(0, Math.ceil((state.turnDeadline - now) / 1000))
      : 0;

  useEffect(() => {
    if (!state || !me) return;
    const minTo = Math.min(
      state.currentMaxBet + state.minRaise,
      me.streetBet + me.chips,
    );
    const maxTo = me.streetBet + me.chips;
    const mid = Math.min(maxTo, Math.max(minTo, state.bigBlind * 2));
    setBetAmount([mid]);
  }, [state?.currentMaxBet, state?.minRaise, state?.handNumber, me]);

  const raiseRange = useMemo(() => {
    if (!state || !me) {
      return { min: 2, max: 1000 };
    }
    const minTo = Math.min(
      state.currentMaxBet + state.minRaise,
      me.streetBet + me.chips,
    );
    const maxTo = me.streetBet + me.chips;
    return { min: minTo, max: Math.max(minTo, maxTo) };
  }, [state, me]);

  const PlayingCard = ({
    card,
    index,
    isHidden: forceHidden,
    small = false,
  }: {
    card: Card;
    index: number;
    isHidden?: boolean;
    small?: boolean;
  }) => {
    const isHidden = forceHidden || card.value === "?";
    return (
      <motion.div
        initial={{ rotateY: 180, x: -100, opacity: 0 }}
        animate={{ rotateY: isHidden ? 180 : 0, x: 0, opacity: 1 }}
        transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
        className={`relative ${
          small ? "w-8 h-12 sm:w-10 sm:h-14" : "w-12 h-16 sm:w-14 sm:h-20"
        } rounded-lg shadow-lg transform-gpu cursor-pointer hover:scale-110 transition-transform`}
        style={{ perspective: "1000px" }}
        whileHover={{ y: -5 }}
      >
        {isHidden ? (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-700 flex items-center justify-center">
            <div className="w-full h-full rounded-lg bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(59,130,246,0.1)_5px,rgba(59,130,246,0.1)_10px)]" />
            <span className="absolute text-xl sm:text-2xl">🃏</span>
          </div>
        ) : (
          <div className="absolute inset-0 rounded-lg bg-white border border-gray-200 p-1 flex flex-col items-center justify-between">
            <span
              className={`text-xs sm:text-sm font-bold ${suitColors[card.suit]}`}
            >
              {card.value}
            </span>
            <span
              className={`text-lg sm:text-2xl ${suitColors[card.suit]}`}
            >
              {suitSymbols[card.suit]}
            </span>
            <span
              className={`text-xs sm:text-sm font-bold rotate-180 ${suitColors[card.suit]}`}
            >
              {card.value}
            </span>
          </div>
        )}
      </motion.div>
    );
  };

  if (!connected && online) {
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center gap-6 px-4">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
        <div className="text-center max-w-md">
          <p className="text-foreground font-semibold mb-2">מתחבר לשרת המשחק…</p>
          {isLocal ? (
            <div className="text-sm text-muted-foreground space-y-2 [direction:rtl]">
              <p>
                כתובת:{" "}
                <code className="text-gold break-all">{getPokerSocketUrl()}</code>
              </p>
              <p>
                ודאו ש-<code className="text-gold">npm run dev</code> רץ (Next + Socket)
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground [direction:rtl]">
              שרת המשחק בזמן אמת אינו פעיל כרגע. המשחק זמין מקומית בלבד.
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={onLeaveTable}>
          חזרה ללובי
        </Button>
      </div>
    );
  }

  if (!state && online) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
      </div>
    );
  }

  if (!state) return null;

  const seated = state.players.filter((p): p is SeatedPlayer => !p.empty);

  const toCall = state.toCall;
  const canCheck = toCall === 0;

  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    const t = chatDraft.trim();
    if (!t) return;
    sendChat(t);
    setChatDraft("");
  };

  return (
    <div className="min-h-screen pt-16 lg:pt-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal via-charcoal-light to-charcoal" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald/5 rounded-full blur-3xl" />

      {!connected && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/20 border border-destructive/40 text-sm">
          <WifiOff className="w-4 h-4" />
          נותק — מנסה להתחבר מחדש
        </div>
      )}

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 flex items-center justify-between px-4 py-2 glass-effect border-b border-border"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLeaveTable}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4 ml-1" />
            עזוב שולחן
          </Button>
          <div className="hidden sm:block h-6 w-px bg-border" />
          <div className="hidden sm:flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-sm text-muted-foreground">
              {state?.gameVariant === "omaha"
                ? "Pot-Limit Omaha"
                : "Texas Hold'em"}
            </span>
            <span className="text-sm text-gold">
              ${state.smallBlind}/${state.bigBlind}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              חדר {roomId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {me && me.chips < 100 && getIdToken && (
            <Button
              variant="secondary"
              size="sm"
              disabled={!connected || rebuyPending}
              onClick={() => void requestRebuy()}
              className="text-xs sm:text-sm shrink-0"
            >
              {rebuyPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "טעינת צ'יפים"
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            className={`${
              showHistory ? "text-gold" : "text-muted-foreground"
            } hover:text-foreground`}
          >
            <History className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChat(!showChat)}
            className={`${
              showChat ? "text-gold" : "text-muted-foreground"
            } hover:text-foreground`}
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {state.handFinished && seated.length < 2 && (
        <div className="relative z-10 text-center py-2 text-sm text-gold/90">
          מחכים לשני שחקנים לפחות כדי להתחיל יד
        </div>
      )}

      <div className="relative z-10 flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-180px)]">
        <div className="relative w-full max-w-4xl aspect-[16/10]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="absolute inset-[10%] rounded-[50%] poker-table-gradient border-8 border-amber-900/80 shadow-2xl"
            style={{
              boxShadow:
                "inset 0 0 100px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.5), 0 0 0 20px rgba(30,20,10,0.8)",
            }}
          >
            <div className="absolute inset-2 rounded-[50%] border border-emerald-light/20" />

            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-center">
                <motion.div
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gold font-[family-name:var(--font-orbitron)] mb-2"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ${state.pot.toLocaleString()}
                </motion.div>
                <div className="flex justify-center gap-1">
                  {[...Array(Math.min(5, Math.max(1, Math.floor(state.pot / 50))))].map(
                    (_, i) => (
                      <motion.div
                        key={i}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full gold-gradient shadow-lg"
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                        style={{
                          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                          marginTop: `-${i * 3}px`,
                        }}
                      />
                    ),
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute top-[35%] left-1/2 -translate-x-1/2 flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <AnimatePresence>
                {state.board.map((card, index) => (
                  <motion.div
                    key={`${state.handNumber}-${index}-${card.value}${card.suit}`}
                    initial={{ rotateY: 180, scale: 0 }}
                    animate={{ rotateY: 0, scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ delay: index * 0.15, type: "spring" }}
                  >
                    <PlayingCard card={card} index={index} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {seated.map((player) => {
            const pos = seatPosition(player.seat);
            const isSelf = player.id === playerId;
            const hole = "cards" in player ? player.cards : [];
            const svgAv = getAvatarById(player.avatar);
            return (
              <motion.div
                key={player.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: player.folded ? 0.35 : 1 }}
                transition={{ delay: player.seat * 0.05, type: "spring" }}
              >
                <div className="flex flex-col items-center gap-0.5 relative">

                  {/* שם שחקן — מעל האווטאר */}
                  <div className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold truncate max-w-[80px] sm:max-w-[96px] ${
                    isSelf
                      ? "bg-gold/20 text-gold border border-gold/40"
                      : "bg-black/50 text-white/90 border border-white/10"
                  }`}>
                    {player.name}{isSelf ? " ★" : ""}
                  </div>

                  {/* אווטאר */}
                  <motion.div
                    className="relative"
                    animate={
                      player.isTurn
                        ? { boxShadow: ["0 0 0 3px rgba(212,175,55,0.5)", "0 0 0 7px rgba(212,175,55,0.15)", "0 0 0 3px rgba(212,175,55,0.5)"] }
                        : {}
                    }
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ borderRadius: "9999px" }}
                  >
                    {/* Dealer chip */}
                    {player.isDealer && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold text-charcoal text-[9px] font-bold flex items-center justify-center z-20 shadow-lg"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        D
                      </motion.div>
                    )}

                    {svgAv ? (
                      <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden border-2 shadow-lg ${
                        player.isTurn ? "border-gold" : isSelf ? "border-gold/50" : "border-white/20"
                      }`} style={{ width: "clamp(40px,5vw,52px)", height: "clamp(40px,5vw,52px)" }}>
                        {svgAv.character}
                      </div>
                    ) : (
                      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-2xl border-2 shadow-lg bg-charcoal ${
                        player.isTurn ? "border-gold" : isSelf ? "border-gold/50" : "border-white/20"
                      }`}>
                        {player.avatar || "🎭"}
                      </div>
                    )}
                  </motion.div>

                  {/* צ'יפים — מתחת לאווטאר */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 border border-gold/25 shadow">
                    <div className="w-2.5 h-2.5 rounded-full gold-gradient shrink-0" />
                    <span className="text-[10px] sm:text-xs text-gold font-semibold font-[family-name:var(--font-orbitron)]">
                      {player.chips.toLocaleString()}
                    </span>
                  </div>

                  {/* קלפים */}
                  {hole.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hole.map((card, idx) => (
                        <PlayingCard key={idx} card={card} index={idx} small />
                      ))}
                    </div>
                  )}

                  {/* הימור ברחוב */}
                  {player.streetBet > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-charcoal-light border border-gold/30 whitespace-nowrap"
                    >
                      <div className="w-2.5 h-2.5 rounded-full gold-gradient" />
                      <span className="text-[10px] text-gold font-semibold">{player.streetBet}</span>
                    </motion.div>
                  )}

                  {/* טיימר תור */}
                  {player.isTurn && (
                    <motion.div
                      className="absolute -bottom-11 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-1 text-[10px] text-gold">
                        <Timer className="w-2.5 h-2.5" />
                        <span className="font-[family-name:var(--font-orbitron)]">{timeLeft}s</span>
                      </div>
                      <div className="w-14 h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gold"
                          animate={{ width: `${(timeLeft / 30) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-30"
      >
        {/* Blur backdrop */}
        <div className="absolute inset-0 bg-charcoal/80 backdrop-blur-xl border-t border-white/10" />

        <div className="relative max-w-3xl mx-auto px-4 py-3">

          {/* Slider row */}
          <AnimatePresence>
            {isMyTurn && !state.handFinished && raiseRange.min < raiseRange.max && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-3"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground font-medium">סכום רייז</span>
                  <motion.span
                    key={betAmount[0]}
                    initial={{ scale: 1.3, color: "#d4af37" }}
                    animate={{ scale: 1, color: "#d4af37" }}
                    className="text-xl font-bold text-gold font-[family-name:var(--font-orbitron)]"
                  >
                    ${betAmount[0].toLocaleString()}
                  </motion.span>
                  <div className="flex gap-1.5">
                    {[
                      { label: "½", value: Math.floor((raiseRange.min + raiseRange.max) / 2) },
                      { label: "¾", value: Math.floor(raiseRange.min + (raiseRange.max - raiseRange.min) * 0.75) },
                      { label: "מקס׳", value: raiseRange.max },
                    ].map((q) => (
                      <motion.button
                        key={q.label}
                        onClick={() => setBetAmount([Math.max(raiseRange.min, Math.min(raiseRange.max, q.value))])}
                        className="px-2 py-0.5 rounded text-xs border border-gold/30 text-gold/70 hover:border-gold hover:text-gold transition-colors bg-gold/5"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                      >
                        {q.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <Slider
                  value={betAmount}
                  onValueChange={setBetAmount}
                  min={raiseRange.min}
                  max={raiseRange.max}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground/60">מינ׳ ${raiseRange.min}</span>
                  <span className="text-[10px] text-muted-foreground/60">מקס׳ ${raiseRange.max.toLocaleString()}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex gap-2 sm:gap-3 justify-center">

            {/* פורש */}
            <motion.button
              onClick={() => sendAction("fold")}
              disabled={!isMyTurn || state.handFinished}
              className={`relative flex-1 max-w-[120px] flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl font-bold text-sm transition-all select-none
                ${isMyTurn && !state.handFinished
                  ? "bg-red-600/20 border-2 border-red-500/60 text-red-400 hover:bg-red-600/30 hover:border-red-400 cursor-pointer"
                  : "bg-muted/10 border-2 border-border/30 text-muted-foreground/30 cursor-not-allowed"
                }`}
              whileHover={isMyTurn && !state.handFinished ? { scale: 1.04, y: -2 } : {}}
              whileTap={isMyTurn && !state.handFinished ? { scale: 0.96 } : {}}
            >
              <span className="text-xl">🏳️</span>
              <span>פורש</span>
            </motion.button>

            {/* צ'ק / קול */}
            {canCheck ? (
              <motion.button
                onClick={() => sendAction("check")}
                disabled={!isMyTurn || state.handFinished}
                className={`relative flex-1 max-w-[140px] flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl font-bold text-sm transition-all select-none
                  ${isMyTurn && !state.handFinished
                    ? "bg-blue-500/20 border-2 border-blue-400/60 text-blue-300 hover:bg-blue-500/30 hover:border-blue-300 cursor-pointer"
                    : "bg-muted/10 border-2 border-border/30 text-muted-foreground/30 cursor-not-allowed"
                  }`}
                whileHover={isMyTurn && !state.handFinished ? { scale: 1.04, y: -2 } : {}}
                whileTap={isMyTurn && !state.handFinished ? { scale: 0.96 } : {}}
              >
                <span className="text-xl">✋</span>
                <span>צ׳ק</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={() => sendAction("call")}
                disabled={!isMyTurn || state.handFinished}
                className={`relative flex-1 max-w-[140px] flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl font-bold text-sm transition-all select-none
                  ${isMyTurn && !state.handFinished
                    ? "bg-gold/15 border-2 border-gold/60 text-gold hover:bg-gold/25 hover:border-gold cursor-pointer"
                    : "bg-muted/10 border-2 border-border/30 text-muted-foreground/30 cursor-not-allowed"
                  }`}
                whileHover={isMyTurn && !state.handFinished ? { scale: 1.04, y: -2 } : {}}
                whileTap={isMyTurn && !state.handFinished ? { scale: 0.96 } : {}}
              >
                <span className="text-xl">💰</span>
                <span>קול ${toCall}</span>
              </motion.button>
            )}

            {/* רייז */}
            <motion.button
              onClick={() => sendAction("raise", betAmount[0])}
              disabled={
                !isMyTurn ||
                state.handFinished ||
                betAmount[0] > raiseRange.max ||
                betAmount[0] < raiseRange.min ||
                raiseRange.min > raiseRange.max
              }
              className={`relative flex-1 max-w-[160px] flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl font-bold text-sm transition-all select-none
                ${isMyTurn && !state.handFinished && raiseRange.min <= raiseRange.max
                  ? "bg-emerald/20 border-2 border-emerald/70 text-emerald hover:bg-emerald/30 hover:border-emerald cursor-pointer"
                  : "bg-muted/10 border-2 border-border/30 text-muted-foreground/30 cursor-not-allowed"
                }`}
              whileHover={isMyTurn && !state.handFinished && raiseRange.min <= raiseRange.max ? { scale: 1.04, y: -2 } : {}}
              whileTap={isMyTurn && !state.handFinished && raiseRange.min <= raiseRange.max ? { scale: 0.96 } : {}}
            >
              {isMyTurn && !state.handFinished && raiseRange.min <= raiseRange.max && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-emerald/10"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              <span className="text-xl">📈</span>
              <span className="relative">רייז ${betAmount[0].toLocaleString()}</span>
            </motion.button>

            {/* אול אין */}
            <motion.button
              onClick={() => {
                setBetAmount([raiseRange.max]);
                sendAction("raise", raiseRange.max);
              }}
              disabled={!isMyTurn || state.handFinished || raiseRange.min > raiseRange.max}
              className={`relative flex-1 max-w-[120px] flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl font-bold text-sm transition-all select-none overflow-hidden
                ${isMyTurn && !state.handFinished && raiseRange.min <= raiseRange.max
                  ? "bg-purple-600/20 border-2 border-purple-500/70 text-purple-300 hover:bg-purple-600/35 hover:border-purple-400 cursor-pointer"
                  : "bg-muted/10 border-2 border-border/30 text-muted-foreground/30 cursor-not-allowed"
                }`}
              whileHover={isMyTurn && !state.handFinished && raiseRange.min <= raiseRange.max ? { scale: 1.06, y: -3 } : {}}
              whileTap={isMyTurn && !state.handFinished && raiseRange.min <= raiseRange.max ? { scale: 0.94 } : {}}
            >
              {isMyTurn && !state.handFinished && raiseRange.min <= raiseRange.max && (
                <>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute -inset-1 rounded-2xl border-2 border-purple-400/40"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </>
              )}
              <span className="text-xl relative">🚀</span>
              <span className="relative font-extrabold tracking-wide">ALL IN</span>
            </motion.button>

          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-20 left-0 bottom-40 w-72 glass-effect border-r border-border p-4 z-20"
          >
            <h3 className="text-lg font-semibold text-gold mb-4">צ&apos;אט</h3>
            <div className="space-y-3 h-[calc(100%-120px)] overflow-y-auto">
              {state.actionLog
                .filter((line) => line.includes(":"))
                .slice(-30)
                .map((line, i) => {
                  const idx = line.indexOf(":");
                  const name = line.slice(0, idx);
                  const msg = line.slice(idx + 1).trim();
                  return (
                    <div key={i} className="p-2 rounded-lg bg-muted/50">
                      <span className="text-xs text-gold">{name}:</span>
                      <p className="text-sm text-foreground">{msg}</p>
                    </div>
                  );
                })}
            </div>
            <form
              onSubmit={handleChatSend}
              className="absolute bottom-4 left-4 right-4"
            >
              <input
                type="text"
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="הודעה…"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed top-20 right-0 bottom-40 w-72 glass-effect border-l border-border p-4 z-20"
          >
            <h3 className="text-lg font-semibold text-gold mb-4">היסטוריה</h3>
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
              {state.actionLog.map((action, i) => (
                <div
                  key={i}
                  className="text-sm text-muted-foreground py-1 border-b border-border/50"
                >
                  {action}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
