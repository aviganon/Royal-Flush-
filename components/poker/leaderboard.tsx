"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Crown, TrendingUp, Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const leaderboardData = [
  {
    rank: 1,
    name: "מלך הפוקר",
    avatar: "👑",
    earnings: 125000,
    wins: 342,
    winRate: 68,
    streak: 12,
  },
  {
    rank: 2,
    name: "אלוף האומהה",
    avatar: "🎭",
    earnings: 98500,
    wins: 287,
    winRate: 62,
    streak: 8,
  },
  {
    rank: 3,
    name: "שחקן הזהב",
    avatar: "🌟",
    earnings: 87200,
    wins: 256,
    winRate: 59,
    streak: 5,
  },
  {
    rank: 4,
    name: "אתה",
    avatar: "🎯",
    earnings: 75800,
    wins: 198,
    winRate: 55,
    streak: 5,
    isCurrentUser: true,
  },
  {
    rank: 5,
    name: "כריש הקלפים",
    avatar: "🦈",
    earnings: 68400,
    wins: 189,
    winRate: 52,
    streak: 3,
  },
  {
    rank: 6,
    name: "מאסטר בלאף",
    avatar: "🎪",
    earnings: 54200,
    wins: 167,
    winRate: 48,
    streak: 0,
  },
  {
    rank: 7,
    name: "קינג ג'יימס",
    avatar: "👔",
    earnings: 49800,
    wins: 145,
    winRate: 46,
    streak: 2,
  },
  {
    rank: 8,
    name: "נסיכת הלילה",
    avatar: "🌙",
    earnings: 42100,
    wins: 132,
    winRate: 44,
    streak: 1,
  },
];

export function Leaderboard() {
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
          <span className="text-lg font-bold text-muted-foreground">
            #{rank}
          </span>
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

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground font-[family-name:var(--font-orbitron)] mb-2">
            טבלת{" "}
            <span className="text-gold animate-neon-pulse">המובילים</span>
          </h1>
          <p className="text-muted-foreground">השחקנים הטובים ביותר בפלטפורמה</p>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8 overflow-x-auto pb-2"
        >
          {["כללי", "השבוע", "החודש", "Hold'em", "Omaha"].map((filter, idx) => (
            <Button
              key={filter}
              variant={idx === 0 ? "default" : "outline"}
              className={
                idx === 0
                  ? "bg-gold text-charcoal hover:bg-gold-light whitespace-nowrap"
                  : "border-border hover:border-gold/50 whitespace-nowrap"
              }
            >
              {filter}
            </Button>
          ))}
        </motion.div>

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            leaderboardData[1],
            leaderboardData[0],
            leaderboardData[2],
          ].map((player, idx) => (
            <motion.div
              key={player.rank}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className={`relative p-4 lg:p-6 rounded-2xl glass-effect border text-center ${
                idx === 1 ? "border-yellow-400/40 -mt-4" : "border-border mt-4"
              }`}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              {idx === 1 && (
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown className="w-8 h-8 text-yellow-400" />
                </motion.div>
              )}

              <div className="text-3xl lg:text-4xl mb-2">{player.avatar}</div>
              <h3 className="font-semibold text-foreground text-sm lg:text-base mb-1 truncate">
                {player.name}
              </h3>
              <motion.p
                className="text-lg lg:text-xl font-bold text-gold font-[family-name:var(--font-orbitron)]"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
              >
                ${player.earnings.toLocaleString()}
              </motion.p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Trophy className="w-3 h-3 text-emerald" />
                <span className="text-xs text-emerald">{player.wins} wins</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          {leaderboardData.map((player, index) => (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className={`p-4 rounded-xl glass-effect border transition-all ${getRankBg(
                player.rank,
                player.isCurrentUser || false
              )}`}
              whileHover={{ x: -5, scale: 1.01 }}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-10 h-10 flex items-center justify-center">
                  {getRankIcon(player.rank)}
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-2xl">{player.avatar}</div>
                  <div className="min-w-0">
                    <p
                      className={`font-semibold truncate ${
                        player.isCurrentUser ? "text-gold" : "text-foreground"
                      }`}
                    >
                      {player.name}
                      {player.isCurrentUser && (
                        <span className="text-xs text-muted-foreground mr-2">
                          (אתה)
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {player.wins}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {player.winRate}%
                      </span>
                      {player.streak > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-orange-500">
                            <Flame className="w-3 h-3" />
                            {player.streak}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Earnings */}
                <div className="text-left">
                  <p
                    className={`text-lg font-bold font-[family-name:var(--font-orbitron)] ${
                      player.rank <= 3 ? "text-gold" : "text-foreground"
                    }`}
                  >
                    ${player.earnings.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-emerald">
                    <TrendingUp className="w-3 h-3" />
                    <span>+12%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Your Position Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 p-6 rounded-2xl glass-effect border border-gold/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                המיקום שלך בטבלה
              </p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gold font-[family-name:var(--font-orbitron)]">
                  #4
                </span>
                <div className="flex items-center gap-1 text-emerald">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">עלית 2 מקומות השבוע</span>
                </div>
              </div>
            </div>
            <Button className="bg-gold text-charcoal hover:bg-gold-light">
              צפה בסטטיסטיקות
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
