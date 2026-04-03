"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Trophy, Medal, Crown, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

type ApiPlayer = {
  rank: number;
  uid: string;
  displayName: string;
  photoURL: string | null;
  chips: number;
};

function PlayerAvatar({ name, photoURL }: { name: string; photoURL: string | null }) {
  const initial = name.trim().slice(0, 1) || "?";
  if (photoURL) {
    return (
      <Image
        src={photoURL}
        alt=""
        width={40}
        height={40}
        className="rounded-full object-cover border border-border"
        unoptimized
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground border border-border">
      {initial}
    </div>
  );
}

export function Leaderboard({
  currentUserId,
  currentChips,
  currentDisplayName,
}: {
  currentUserId: string;
  currentChips: number;
  currentDisplayName: string;
}) {
  const [players, setPlayers] = useState<ApiPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const json = (await res.json()) as { players?: ApiPlayer[]; error?: string };
        if (!res.ok) {
          throw new Error(json.error ?? "טעינה נכשלה");
        }
        const list = Array.isArray(json.players) ? json.players : [];
        if (!cancelled) setPlayers(list);
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setPlayers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
        );
    }
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "border-gold/50 bg-gold/5";
    switch (rank) {
      case 1:
        return "border-yellow-400/30 bg-yellow-400/5";
      case 2:
        return "border-gray-400/30 bg-gray-400/5";
      case 3:
        return "border-amber-600/30 bg-amber-600/5";
      default:
        return "border-border";
    }
  };

  const top3 =
    players.length >= 3
      ? [players[1]!, players[0]!, players[2]!]
      : players.length === 2
        ? [players[1]!, players[0]!]
        : players.length === 1
          ? [players[0]!]
          : [];

  const myRow = players.find((p) => p.uid === currentUserId);

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground font-[family-name:var(--font-orbitron)] mb-2">
            טבלת <span className="text-gold animate-neon-pulse">המובילים</span>
          </h1>
          <p className="text-muted-foreground">
            דירוג לפי צ&apos;יפים ב-Firestore (עד 20 שחקנים)
          </p>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-gold" />
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && players.length === 0 && (
          <p className="text-muted-foreground text-center py-16">
            אין עדיין שחקנים בטבלה. אחרי שמסמכי המשתמשים יכללו שדה chips ב-Firestore הרשימה תתמלא.
          </p>
        )}

        {!loading && !error && top3.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`grid gap-4 mb-8 ${
              top3.length === 3 ? "grid-cols-3" : top3.length === 2 ? "grid-cols-2" : "grid-cols-1 max-w-xs mx-auto"
            }`}
          >
            {top3.map((player, idx) => (
              <motion.div
                key={player.uid}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + idx * 0.08 }}
                className={`relative p-4 lg:p-6 rounded-2xl glass-effect border text-center ${
                  top3.length === 3 && idx === 1 ? "border-yellow-400/40 -mt-4" : "border-border mt-4"
                }`}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                {top3.length === 3 && idx === 1 && (
                  <motion.div
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Crown className="w-8 h-8 text-yellow-400" />
                  </motion.div>
                )}
                <div className="flex justify-center mb-2">
                  <div className="text-2xl lg:text-3xl w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center">
                    <PlayerAvatar name={player.displayName} photoURL={player.photoURL} />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground text-sm lg:text-base mb-1 truncate px-1">
                  {player.displayName}
                </h3>
                <p className="text-lg lg:text-xl font-bold text-gold font-[family-name:var(--font-orbitron)]">
                  {player.chips.toLocaleString()} צ&apos;יפים
                </p>
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Trophy className="w-3 h-3" />
                  מקום #{player.rank}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && !error && players.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            {players.map((player, index) => (
              <motion.div
                key={player.uid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + index * 0.03 }}
                className={`p-4 rounded-xl glass-effect border transition-all ${getRankBg(
                  player.rank,
                  player.uid === currentUserId,
                )}`}
                whileHover={{ x: -5, scale: 1.01 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    {getRankIcon(player.rank)}
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <PlayerAvatar name={player.displayName} photoURL={player.photoURL} />
                    <div className="min-w-0">
                      <p
                        className={`font-semibold truncate ${
                          player.uid === currentUserId ? "text-gold" : "text-foreground"
                        }`}
                      >
                        {player.displayName}
                        {player.uid === currentUserId && (
                          <span className="text-xs text-muted-foreground mr-2">(אתה)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p
                      className={`text-lg font-bold font-[family-name:var(--font-orbitron)] ${
                        player.rank <= 3 ? "text-gold" : "text-foreground"
                      }`}
                    >
                      {player.chips.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">צ&apos;יפים</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-8 p-6 rounded-2xl glass-effect border border-gold/30"
          >
            <p className="text-sm text-muted-foreground mb-1">החשבון שלך</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">{currentDisplayName}</p>
                <p className="text-2xl font-bold text-gold font-[family-name:var(--font-orbitron)] mt-1">
                  {currentChips.toLocaleString()} צ&apos;יפים
                </p>
                {myRow ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    מקום בטבלה: <span className="text-gold font-semibold">#{myRow.rank}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    לא מופיעים בטופ 20 — הדירוג מבוסס על שדה chips ב-Firestore
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
