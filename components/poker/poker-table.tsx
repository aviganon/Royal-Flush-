"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, memo } from "react";
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
  Gift,
} from "lucide-react";
import { usePokerSocket } from "@/hooks/use-poker-socket";
import { getPokerSocketUrl } from "@/lib/poker/socket-url";
import { getAvatarById } from "@/components/poker/avatar-selector";
import type { TablePublicView } from "@/lib/poker/holdem-engine";
import type { Card } from "@/lib/poker/types";

// ─── Module-level helpers ────────────────────────────────────────────────────

/** Professional dealer SVG character – purely decorative, no real-data deps */
const DealerCharacter = memo(function DealerCharacter() {
  return (
    <motion.div
      className="absolute top-[8%] left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 90 }}
    >
      <div className="flex flex-col items-center">
        <motion.div
          className="relative"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute -inset-3 rounded-full pointer-events-none"
            animate={{
              boxShadow: [
                "0 0 28px 8px rgba(212,175,55,0.18), 0 0 56px 18px rgba(16,185,129,0.08)",
                "0 0 40px 14px rgba(212,175,55,0.38), 0 0 76px 28px rgba(16,185,129,0.18)",
                "0 0 28px 8px rgba(212,175,55,0.18), 0 0 56px 18px rgba(16,185,129,0.08)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Dealer SVG */}
          <motion.svg
            viewBox="0 0 120 140"
            className="w-20 h-24 sm:w-24 sm:h-28 md:w-28 md:h-32 drop-shadow-2xl"
            style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.55))" }}
          >
            {/* Body / Suit */}
            <path d="M30 140 L35 95 Q60 85 85 95 L90 140" fill="url(#dealerSuit)" />
            <path d="M45 95 L60 105 L75 95" fill="#1a1a2e" stroke="#C9A227" strokeWidth="1" />
            {/* Bow tie */}
            <path d="M52 95 L60 100 L68 95 L64 100 L68 105 L60 100 L52 105 L56 100 Z" fill="#C9A227" />
            {/* Neck */}
            <ellipse cx="60" cy="88" rx="10" ry="8" fill="#E8C4A0" />
            {/* Head */}
            <ellipse cx="60" cy="55" rx="28" ry="32" fill="url(#dealerFace)" />
            {/* Hair */}
            <path d="M32 50 Q32 20 60 18 Q88 20 88 50 Q85 35 60 32 Q35 35 32 50" fill="#2C2C2C" />
            <path d="M35 48 Q40 40 55 38 Q45 42 38 48" fill="#3d3d3d" />
            <path d="M85 48 Q80 40 65 38 Q75 42 82 48" fill="#3d3d3d" />
            {/* Eyes */}
            <ellipse cx="48" cy="52" rx="6" ry="7" fill="white" />
            <ellipse cx="72" cy="52" rx="6" ry="7" fill="white" />
            <circle cx="48" cy="53" r="3.5" fill="#2C3E50" />
            <circle cx="72" cy="53" r="3.5" fill="#2C3E50" />
            <circle cx="49" cy="51" r="1.5" fill="white" />
            <circle cx="73" cy="51" r="1.5" fill="white" />
            {/* Eyebrows */}
            <path d="M40 44 Q48 41 54 44" stroke="#2C2C2C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M66 44 Q72 41 80 44" stroke="#2C2C2C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Nose */}
            <path d="M60 55 L58 65 Q60 68 62 65 L60 55" fill="#D4A574" />
            {/* Smile */}
            <path d="M48 72 Q60 80 72 72" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M50 73 Q60 78 70 73" fill="white" />
            {/* Cheek shadow */}
            <ellipse cx="42" cy="65" rx="5" ry="3" fill="#D4A574" opacity="0.3" />
            <ellipse cx="78" cy="65" rx="5" ry="3" fill="#D4A574" opacity="0.3" />
            {/* Rotating dealer chip */}
            <motion.circle
              cx="85" cy="100" r="8"
              fill="url(#dealerChip)" stroke="#C9A227" strokeWidth="2"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "85px 100px" }}
            />
            <text x="85" y="103" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">D</text>
            <defs>
              <linearGradient id="dealerSuit" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="#0f0f1a" />
              </linearGradient>
              <radialGradient id="dealerFace" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#F5DEB3" />
                <stop offset="100%" stopColor="#DEB887" />
              </radialGradient>
              <linearGradient id="dealerChip" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </motion.svg>

          {/* Floating suit symbols */}
          {(["♠", "♥", "♦", "♣"] as const).map((suit, i) => (
            <motion.span
              key={i}
              className={`absolute text-base font-bold select-none ${
                suit === "♥" || suit === "♦" ? "text-red-500" : "text-white"
              }`}
              style={{
                top: `${10 + i * 20}%`,
                left: i % 2 === 0 ? "-18px" : "calc(100% + 8px)",
              }}
              animate={{ y: [0, -10, 0], opacity: [0.3, 0.8, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
            >
              {suit}
            </motion.span>
          ))}
        </motion.div>

        {/* Tip the Dealer button */}
        <motion.button
          className="pointer-events-auto mt-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-700 to-emerald-600 text-white text-xs font-semibold border border-emerald-400/50 shadow-lg"
          whileHover={{ scale: 1.08, boxShadow: "0 0 22px rgba(16,185,129,0.45)" }}
          whileTap={{ scale: 0.94 }}
        >
          <span className="flex items-center gap-1.5">
            <Gift className="w-3 h-3" />
            Tip Dealer
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
});

const formatChips = (amount: number): string => {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
};

const CONFETTI_COLORS = ["#d4af37", "#10b981", "#ef4444", "#3b82f6", "#a855f7"];

const WinCelebration = memo(function WinCelebration() {
  const particles = useMemo(
    () =>
      [...Array(50)].map((_, i) => ({
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: `${(i * 7.3) % 100}%`,
        rotate: (i * 83) % 720,
        duration: 2.5 + (i % 5) * 0.3,
        delay: (i % 10) * 0.08,
      })),
    [],
  );
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: p.color, left: p.left }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: "100vh", opacity: 0, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
});

const AllInBanner = memo(function AllInBanner({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-6xl sm:text-8xl font-extrabold text-gold font-[family-name:var(--font-orbitron)] drop-shadow-2xl"
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: [0, 1.4, 1], rotate: [0, 8, 0] }}
        transition={{ duration: 0.7, type: "spring" }}
      >
        ALL IN!
      </motion.div>
    </motion.div>
  );
});

// ─── Module-level constants ──────────────────────────────────────────────────
const suitSymbolsMap = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
} as const;

const suitColorsMap = {
  spades: "text-foreground",
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-foreground",
} as const;

/**
 * PlayingCard — defined at MODULE level so React never unmounts/remounts
 * it on parent re-renders.  If defined inside PokerTable, every render
 * creates a new component type → all cards flip on every 500ms timer tick.
 */
const PlayingCard = memo(function PlayingCard({
  card,
  index,
  isHidden: forceHidden,
  size = "md",
}: {
  card: Card;
  index: number;
  isHidden?: boolean;
  /** sm = opponent hidden cards, md = board cards, lg = my hole cards */
  size?: "sm" | "md" | "lg";
}) {
  const isHidden = forceHidden || card.value === "?";

  const dims =
    size === "lg"
      ? "w-16 h-24 sm:w-20 sm:h-28"
      : size === "md"
      ? "w-13 h-18 sm:w-16 sm:h-22"
      : "w-8 h-12 sm:w-10 sm:h-14";

  const textSm =
    size === "lg"
      ? "text-base sm:text-lg font-extrabold"
      : size === "md"
      ? "text-sm sm:text-base font-bold"
      : "text-xs font-bold";

  const textCenter =
    size === "lg"
      ? "text-3xl sm:text-4xl"
      : size === "md"
      ? "text-xl sm:text-2xl"
      : "text-lg";

  return (
    <motion.div
      initial={{ rotateY: 180, x: -60, opacity: 0 }}
      animate={{ rotateY: isHidden ? 180 : 0, x: 0, opacity: 1 }}
      whileHover={size === "lg" ? { y: -8, scale: 1.06 } : undefined}
      transition={{ delay: index * 0.08, duration: 0.45, type: "spring", damping: 18 }}
      className={`relative ${dims} rounded-xl shadow-xl transform-gpu cursor-default select-none`}
      style={{ perspective: "1000px" }}
    >
      {isHidden ? (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-700 flex items-center justify-center">
          <div className="w-full h-full rounded-xl bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(59,130,246,0.1)_5px,rgba(59,130,246,0.1)_10px)]" />
          <span className={`absolute ${textCenter}`}>🃏</span>
        </div>
      ) : (
        <div
          className={`absolute inset-0 rounded-xl bg-white border ${
            size === "lg" ? "border-gray-300 shadow-lg p-1.5" : "border-gray-200 p-1"
          } flex flex-col items-center justify-between`}
        >
          <span className={`${textSm} ${suitColorsMap[card.suit]} self-start leading-none`}>
            {card.value}
            <span className="ml-0.5">{suitSymbolsMap[card.suit]}</span>
          </span>
          <span className={`${textCenter} ${suitColorsMap[card.suit]} font-bold`}>
            {suitSymbolsMap[card.suit]}
          </span>
          <span className={`${textSm} ${suitColorsMap[card.suit]} self-end leading-none rotate-180`}>
            {card.value}
            <span className="ml-0.5">{suitSymbolsMap[card.suit]}</span>
          </span>
        </div>
      )}
    </motion.div>
  );
});

/**
 * TurnTimer — isolated component so the 500ms tick re-renders only itself,
 * not the entire PokerTable.
 */
const TurnTimer = memo(function TurnTimer({
  deadline,
  total = 30,
}: {
  deadline: number;
  total?: number;
}) {
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
  );

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(t);
  }, [deadline]);

  const pct = Math.min(1, timeLeft / total) * 100;
  const color = timeLeft <= 5 ? "bg-red-500" : timeLeft <= 10 ? "bg-yellow-400" : "bg-gold";

  return (
    <motion.div
      className="flex flex-col items-center gap-0.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-1 text-[10px] text-gold">
        <Timer className="w-2.5 h-2.5" />
        <span className="font-[family-name:var(--font-orbitron)]">{timeLeft}s</span>
      </div>
      <div className="w-14 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </motion.div>
  );
});

/**
 * SvgTimer — circular progress ring drawn around the avatar.
 * Isolated so it ticks independently of the table.
 */
const SvgTimer = memo(function SvgTimer({
  deadline,
  total = 30,
  size = 60,
}: {
  deadline: number;
  total?: number;
  size?: number;
}) {
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
  );
  useEffect(() => {
    const t = setInterval(
      () => setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))),
      250,
    );
    return () => clearInterval(t);
  }, [deadline]);

  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(1, timeLeft / total) * circ;
  const stroke = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#eab308" : "#22c55e";

  return (
    <svg
      className="absolute -inset-2 pointer-events-none"
      width={size + 8}
      height={size + 8}
      style={{ top: -4, left: -4 }}
    >
      <circle
        cx={(size + 8) / 2}
        cy={(size + 8) / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={3.5}
      />
      <motion.circle
        cx={(size + 8) / 2}
        cy={(size + 8) / 2}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${(size + 8) / 2} ${(size + 8) / 2})`}
        animate={{ strokeDasharray: `${dash} ${circ}`, stroke }}
        transition={{ duration: 0.25 }}
      />
    </svg>
  );
});

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


/**
 * Maps a server seat number to (x%, y%) on the oval table.
 * Rotates so the current player (mySeat) always sits at the bottom center
 * (6 o'clock), leaving the top center free for the DealerCharacter.
 * With 9 seats the two nearest top seats land at ~17% height on either side
 * of center, so they never overlap the dealer SVG.
 */
function seatPosition(seat: number, maxSeats = 9, mySeat = 0) {
  // ((seat − mySeat) / maxSeats) × 2π gives relative offset;
  // + π/2 rotates the origin to bottom-center (y-axis positive = down).
  const angle = ((seat - mySeat) / maxSeats) * 2 * Math.PI + Math.PI / 2;
  // radiusY=30 (was 35) keeps bottom seats from going behind the action bar
  const radiusX = 42;
  const radiusY = 30;
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
  const [showWin, setShowWin] = useState(false);
  const [showAllIn, setShowAllIn] = useState(false);

  // Win celebration on hand finish
  const prevHandNumber = useMemo(() => state?.handNumber, [state?.handNumber]);
  useEffect(() => {
    if (state?.handFinished) {
      setShowWin(true);
      const t = setTimeout(() => setShowWin(false), 3500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.handFinished, prevHandNumber]);

  const me = useMemo((): SeatedPlayer | null => {
    if (!state) return null;
    for (const p of state.players) {
      if (p.empty) continue;
      if (p.id === playerId) return p;
    }
    return null;
  }, [state, playerId]);

  const isMyTurn = !!me && me.isTurn && state && !state.handFinished;

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
      {/* ── Futuristic premium background ── */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d1117] to-[#0a1628]" />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-0 left-0 w-[700px] h-[700px] rounded-full opacity-25 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.45) 0%, transparent 70%)", filter: "blur(80px)" }}
          animate={{ x: [-200, 80, -200], y: [-80, 180, -80] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[550px] h-[550px] rounded-full opacity-18 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.45) 0%, transparent 70%)", filter: "blur(60px)" }}
          animate={{ x: [80, -130, 80], y: [40, -80, 40] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "50px 50px" }}
        />

        {/* Floating particles */}
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${(i * 4.3) % 100}%`,
              top: `${(i * 7.1) % 100}%`,
              background: i % 3 === 0 ? "rgba(212,175,55,0.65)" : i % 3 === 1 ? "rgba(16,185,129,0.65)" : "rgba(255,255,255,0.4)",
            }}
            animate={{ y: [0, -28, 0], opacity: [0.2, 0.75, 0.2], scale: [1, 1.4, 1] }}
            transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: (i % 6) * 0.5, ease: "easeInOut" }}
          />
        ))}

        {/* Floating card symbols (subtle) */}
        {(["♠", "♥", "♦", "♣"] as const).map((suit, i) => (
          <motion.span
            key={i}
            className={`absolute text-6xl font-bold opacity-[0.025] select-none pointer-events-none ${suit === "♥" || suit === "♦" ? "text-red-500" : "text-white"}`}
            style={{ left: `${15 + i * 22}%`, top: `${20 + (i % 2) * 38}%` }}
            animate={{ y: [0, -18, 0], rotate: [0, 8, 0], opacity: [0.02, 0.045, 0.02] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, delay: i * 1.4 }}
          >
            {suit}
          </motion.span>
        ))}

        {/* Light beams */}
        <motion.div
          className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-emerald-500/18 via-emerald-500/5 to-transparent pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-gold/18 via-gold/5 to-transparent pointer-events-none"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-emerald-500/8 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-gold/8 to-transparent pointer-events-none" />
      </div>

      {/* Win celebration confetti */}
      <AnimatePresence>{showWin && <WinCelebration />}</AnimatePresence>
      {/* All-In banner */}
      <AnimatePresence>{showAllIn && <AllInBanner onDone={() => setShowAllIn(false)} />}</AnimatePresence>

      {/* Dealer character */}
      <DealerCharacter />

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

      {/* pb-32 leaves room for the fixed action bar (~80px) so the bottom seat is never hidden */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 pb-32 min-h-[calc(100vh-180px)]">
        <div className="relative w-full max-w-4xl aspect-[16/10]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="absolute inset-[8%] rounded-[50%]"
            style={{
              background: "linear-gradient(180deg, #8B7355 0%, #6B5344 20%, #4A3728 100%)",
              boxShadow:
                "inset 0 -20px 60px rgba(0,0,0,0.5), 0 30px 80px rgba(0,0,0,0.6), 0 0 0 8px #C9A227, 0 0 0 12px #8B6914, 0 0 0 16px rgba(0,0,0,0.3)",
            }}
          >
            {/* Felt interior */}
            <div
              className="absolute inset-4 rounded-[50%]"
              style={{
                background: "radial-gradient(ellipse at center, #1B5E20 0%, #145214 50%, #0D3D0D 100%)",
                boxShadow: "inset 0 0 100px rgba(0,0,0,0.4)",
              }}
            >
              <div className="absolute inset-6 rounded-[50%] border border-yellow-600/30" />
            </div>

            {/* Community Cards — upper half of felt */}
            <motion.div
              className="absolute top-[26%] left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <AnimatePresence>
                {state.board.map((card, index) => (
                  <motion.div
                    key={`${state.handNumber}-${index}-${card.value}${card.suit}`}
                    initial={{ rotateY: 180, scale: 0, y: -30 }}
                    animate={{ rotateY: 0, scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
                  >
                    <PlayingCard card={card} index={index} size="md" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pot — teal glowing box, lower half */}
            <motion.div
              className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-teal-800 via-teal-600 to-teal-800 border-2 border-teal-400 shadow-2xl"
                animate={{
                  boxShadow: [
                    "0 0 18px rgba(20,184,166,0.35)",
                    "0 0 36px rgba(20,184,166,0.55)",
                    "0 0 18px rgba(20,184,166,0.35)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span
                  key={state.pot}
                  className="text-lg sm:text-xl font-bold text-white font-[family-name:var(--font-orbitron)]"
                  initial={{ scale: 1.25 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {formatChips(state.pot)}
                </motion.span>
              </motion.div>
            </motion.div>
          </motion.div>

          {seated.map((player) => {
            const pos = seatPosition(player.seat, 9, me?.seat ?? 0);
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

                  {/* אווטאר + טיימר SVG */}
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                  >
                    {/* Glow ring on turn */}
                    {player.isTurn && (
                      <motion.div
                        className="absolute -inset-1 rounded-full"
                        animate={{
                          boxShadow: [
                            "0 0 18px 4px rgba(212,175,55,0.4)",
                            "0 0 36px 10px rgba(212,175,55,0.65)",
                            "0 0 18px 4px rgba(212,175,55,0.4)",
                          ],
                        }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                      />
                    )}

                    {/* Circular SVG timer */}
                    {player.isTurn && state.turnDeadline && (
                      <SvgTimer deadline={state.turnDeadline} size={isSelf ? 72 : 60} />
                    )}

                    {/* Dealer chip */}
                    {player.isDealer && (
                      <motion.div
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-gray-300 text-gray-800 text-[10px] font-bold flex items-center justify-center z-20 shadow-lg"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        D
                      </motion.div>
                    )}

                    {/* Avatar */}
                    <div
                      className={`rounded-full overflow-hidden flex items-center justify-center shadow-lg p-0.5 ${
                        player.isTurn
                          ? "bg-gradient-to-br from-yellow-400 via-gold to-yellow-600"
                          : !player.folded
                          ? "bg-gradient-to-br from-red-500 via-red-600 to-red-700"
                          : "bg-gradient-to-br from-gray-600 to-gray-700"
                      }`}
                      style={{ width: isSelf ? "clamp(52px,6vw,72px)" : "clamp(44px,5vw,60px)", height: isSelf ? "clamp(52px,6vw,72px)" : "clamp(44px,5vw,60px)" }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-charcoal flex items-center justify-center text-2xl">
                        {svgAv ? svgAv.character : (player.avatar || "🎭")}
                      </div>
                    </div>
                  </motion.div>

                  {/* צ'יפים — מתחת לאווטאר */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 border border-gold/25 shadow">
                    <div className="w-2.5 h-2.5 rounded-full gold-gradient shrink-0" />
                    <span className="text-[10px] sm:text-xs text-gold font-semibold font-[family-name:var(--font-orbitron)]">
                      {player.chips.toLocaleString()}
                    </span>
                  </div>

                  {/* קלפים — לשחקנים אחרים בלבד; שלי מוצגים גדול למטה */}
                  {hole.length > 0 && !isSelf && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hole.map((card, idx) => (
                        <PlayingCard
                          key={`${state?.handNumber ?? 0}-${card.value}${card.suit}`}
                          card={card}
                          index={idx}
                          size="sm"
                        />
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
                  {player.isTurn && state?.turnDeadline && (
                    <div className="absolute -bottom-11 left-1/2 -translate-x-1/2">
                      <TurnTimer deadline={state.turnDeadline} total={30} />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── קלפי השחקן (גדולים) ── */}
      {me && (() => {
        const myHole = "cards" in me ? (me.cards as Card[]) : [];
        return myHole.length > 0 ? (
          <motion.div
            className="fixed bottom-40 left-1/2 -translate-x-1/2 z-20 flex gap-2 sm:gap-3"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", damping: 18 }}
          >
            {myHole.map((card, idx) => (
              <PlayingCard
                key={`${state?.handNumber ?? 0}-${card.value}${card.suit}`}
                card={card}
                index={idx}
                size="lg"
              />
            ))}
          </motion.div>
        ) : null;
      })()}

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
                setShowAllIn(true);
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
