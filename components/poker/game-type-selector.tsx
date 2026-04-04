"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Spade,
  Heart,
  Diamond,
  Club,
  Users,
  Clock,
  Zap,
  Crown,
  ChevronLeft,
  Star,
  Info,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type GameVariant =
  | "texas-holdem"
  | "omaha"
  | "omaha-hi-lo"
  | "short-deck"
  | "5-card-omaha"
  | "7-card-stud";

interface GameType {
  id: GameVariant;
  name: string;
  nameEn: string;
  description: string;
  cardsPerPlayer: number;
  communityCards: number;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgGlow: string;
  features: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  isPopular?: boolean;
  isNew?: boolean;
}

const gameTypes: GameType[] = [
  {
    id: "texas-holdem",
    name: "טקסס הולדם",
    nameEn: "Texas Hold'em",
    description: "המשחק הפופולרי ביותר בעולם - 2 קלפים לשחקן, 5 קלפים קהילתיים",
    cardsPerPlayer: 2,
    communityCards: 5,
    icon: (
      <div className="flex gap-0.5">
        <Spade className="w-5 h-5 text-foreground" />
        <Heart className="w-5 h-5 text-red-500" />
      </div>
    ),
    color: "text-gold",
    borderColor: "border-gold/40",
    bgGlow: "bg-gold/10",
    features: ["קל ללמוד", "אקשן מהיר", "הכי פופולרי"],
    difficulty: "beginner",
    isPopular: true,
  },
  {
    id: "omaha",
    name: "אומהה",
    nameEn: "Pot Limit Omaha",
    description: "4 קלפים לשחקן - חייבים להשתמש בדיוק ב-2 מהיד",
    cardsPerPlayer: 4,
    communityCards: 5,
    icon: (
      <div className="flex gap-0.5">
        <Diamond className="w-4 h-4 text-red-500" />
        <Club className="w-4 h-4 text-foreground" />
        <Spade className="w-4 h-4 text-foreground" />
        <Heart className="w-4 h-4 text-red-500" />
      </div>
    ),
    color: "text-emerald",
    borderColor: "border-emerald/40",
    bgGlow: "bg-emerald/10",
    features: ["יותר אקשן", "קומבינציות רבות", "הימורים גדולים"],
    difficulty: "intermediate",
    isPopular: true,
  },
  {
    id: "omaha-hi-lo",
    name: "אומהה היי-לואו",
    nameEn: "Omaha Hi-Lo",
    description: "הקופה מתחלקת בין היד הגבוהה והנמוכה ביותר",
    cardsPerPlayer: 4,
    communityCards: 5,
    icon: (
      <div className="flex items-center gap-1">
        <Crown className="w-4 h-4 text-gold" />
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-sm font-bold text-neon-cyan">Lo</span>
      </div>
    ),
    color: "text-neon-cyan",
    borderColor: "border-neon-cyan/40",
    bgGlow: "bg-neon-cyan/10",
    features: ["שני מנצחים", "אסטרטגיה מורכבת", "קופות גדולות"],
    difficulty: "advanced",
  },
  {
    id: "short-deck",
    name: "שורט דק",
    nameEn: "Short Deck (6+)",
    description: "חפיסה מקוצרת - ללא קלפים 2-5, יותר ידיים חזקות",
    cardsPerPlayer: 2,
    communityCards: 5,
    icon: (
      <div className="flex items-center">
        <Zap className="w-5 h-5 text-orange-500" />
      </div>
    ),
    color: "text-orange-500",
    borderColor: "border-orange-500/40",
    bgGlow: "bg-orange-500/10",
    features: ["36 קלפים", "פלאש מנצח פול האוס", "אקשן מטורף"],
    difficulty: "intermediate",
    isNew: true,
  },
  {
    id: "5-card-omaha",
    name: "אומהה 5 קלפים",
    nameEn: "5-Card PLO",
    description: "גרסה מורחבת של אומהה עם 5 קלפים ביד",
    cardsPerPlayer: 5,
    communityCards: 5,
    icon: (
      <div className="flex gap-0.5">
        <Heart className="w-3 h-3 text-red-500" />
        <Club className="w-3 h-3 text-foreground" />
        <Diamond className="w-3 h-3 text-red-500" />
        <Spade className="w-3 h-3 text-foreground" />
        <Heart className="w-3 h-3 text-red-500" />
      </div>
    ),
    color: "text-purple-400",
    borderColor: "border-purple-400/40",
    bgGlow: "bg-purple-400/10",
    features: ["קומבינציות אינסופיות", "סווינגים גדולים", "ריגושים"],
    difficulty: "advanced",
    isNew: true,
  },
  {
    id: "7-card-stud",
    name: "סטאד 7 קלפים",
    nameEn: "7-Card Stud",
    description: "הקלאסיקה - ללא קלפים קהילתיים, חלק מהקלפים גלויים",
    cardsPerPlayer: 7,
    communityCards: 0,
    icon: (
      <div className="flex items-center">
        <Star className="w-5 h-5 text-amber-400" />
      </div>
    ),
    color: "text-amber-400",
    borderColor: "border-amber-400/40",
    bgGlow: "bg-amber-400/10",
    features: ["סגנון קלאסי", "זיכרון חשוב", "ללא בליינדים"],
    difficulty: "advanced",
  },
];

interface GameTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (gameType: GameVariant) => void;
  selectedGame?: GameVariant;
}

// Floating cards animation component
const FloatingCards = () => {
  const cards = ["♠", "♥", "♦", "♣", "A", "K", "Q", "J"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className={`absolute text-2xl ${
            card === "♥" || card === "♦" ? "text-red-500" : "text-foreground"
          }`}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: "110%", 
            rotate: Math.random() * 360,
            opacity: 0 
          }}
          animate={{ 
            y: "-10%",
            rotate: Math.random() * 720 - 360,
            opacity: [0, 0.5, 0.5, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            delay: i * 0.8,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ left: `${10 + i * 12}%` }}
        >
          {card}
        </motion.div>
      ))}
    </div>
  );
};

export function GameTypeSelector({
  isOpen,
  onClose,
  onSelect,
  selectedGame,
}: GameTypeSelectorProps) {
  const [hoveredGame, setHoveredGame] = useState<GameVariant | null>(null);
  const [showInfo, setShowInfo] = useState<GameVariant | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<GameVariant | null>(null);

  // Selection sparkle effect
  useEffect(() => {
    if (selectedEffect) {
      const timer = setTimeout(() => setSelectedEffect(null), 600);
      return () => clearTimeout(timer);
    }
  }, [selectedEffect]);

  const handleSelect = (gameId: GameVariant) => {
    setSelectedEffect(gameId);
    setTimeout(() => onSelect(gameId), 300);
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return { text: "מתחילים", color: "text-emerald bg-emerald/20" };
      case "intermediate":
        return { text: "בינוני", color: "text-gold bg-gold/20" };
      case "advanced":
        return { text: "מתקדם", color: "text-destructive bg-destructive/20" };
      default:
        return { text: "", color: "" };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-effect border-border max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Floating background cards */}
        <FloatingCards />
        
        <DialogHeader className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DialogTitle className="text-2xl text-gold font-[family-name:var(--font-orbitron)] text-center flex items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6 text-gold" />
              </motion.div>
              בחר סוג משחק
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <Sparkles className="w-6 h-6 text-gold" />
              </motion.div>
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              בחר את סגנון הפוקר המועדף עליך
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 relative z-10">
          {gameTypes.map((game, index) => {
            const difficultyInfo = getDifficultyLabel(game.difficulty);

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
                onMouseEnter={() => setHoveredGame(game.id)}
                onMouseLeave={() => setHoveredGame(null)}
              >
                <motion.div
                  onClick={() => handleSelect(game.id)}
                  className={`w-full p-5 rounded-2xl glass-effect border transition-all duration-300 text-right relative overflow-hidden cursor-pointer ${
                    selectedGame === game.id
                      ? `${game.borderColor} ${game.bgGlow}`
                      : "border-border hover:border-gold/30"
                  }`}
                  whileHover={{ scale: 1.03, y: -6, rotateY: 3 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleSelect(game.id);
                    }
                  }}
                >
                  {/* Selection sparkle effect */}
                  <AnimatePresence>
                    {selectedEffect === game.id && (
                      <>
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-gold"
                            initial={{ 
                              x: "50%", 
                              y: "50%", 
                              scale: 0,
                              opacity: 1 
                            }}
                            animate={{ 
                              x: `${50 + (Math.random() - 0.5) * 150}%`,
                              y: `${50 + (Math.random() - 0.5) * 150}%`,
                              scale: [0, 1.5, 0],
                              opacity: [1, 1, 0]
                            }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                          />
                        ))}
                      </>
                    )}
                  </AnimatePresence>
                  
                  {/* Animated hover gradient */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    animate={hoveredGame === game.id ? {
                      background: [
                        "radial-gradient(circle at 0% 0%, rgba(212,175,55,0.1) 0%, transparent 50%)",
                        "radial-gradient(circle at 100% 100%, rgba(212,175,55,0.1) 0%, transparent 50%)",
                        "radial-gradient(circle at 0% 100%, rgba(212,175,55,0.1) 0%, transparent 50%)",
                        "radial-gradient(circle at 100% 0%, rgba(212,175,55,0.1) 0%, transparent 50%)",
                        "radial-gradient(circle at 0% 0%, rgba(212,175,55,0.1) 0%, transparent 50%)",
                      ],
                    } : {}}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {game.isPopular && (
                      <motion.span
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-gold/20 text-gold border border-gold/30"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        פופולרי
                      </motion.span>
                    )}
                    {game.isNew && (
                      <motion.span
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald/20 text-emerald border border-emerald/30"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        חדש
                      </motion.span>
                    )}
                  </div>

                  {/* Info Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInfo(showInfo === game.id ? null : game.id);
                    }}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/50 transition-colors"
                  >
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {/* Game Icon & Name */}
                  <div className="flex items-center gap-3 mb-3 mt-4 relative z-10">
                    <motion.div
                      className={`w-12 h-12 rounded-xl ${game.bgGlow} border ${game.borderColor} flex items-center justify-center relative overflow-hidden`}
                      animate={
                        hoveredGame === game.id
                          ? { rotate: [0, 8, -8, 5, -5, 0], scale: [1, 1.1, 1] }
                          : {}
                      }
                      transition={{ duration: 0.8 }}
                    >
                      {/* Shimmer effect */}
                      {hoveredGame === game.id && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                        />
                      )}
                      {game.icon}
                    </motion.div>
                    <div>
                      <h3 className={`font-bold ${game.color}`}>{game.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {game.nameEn}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                    {game.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{game.cardsPerPlayer} קלפים</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{game.communityCards} קהילתיים</span>
                    </div>
                  </div>

                  {/* Difficulty & Features */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyInfo.color}`}
                    >
                      {difficultyInfo.text}
                    </span>
                    <div className="flex gap-1">
                      {game.features.slice(0, 2).map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selectedGame === game.id && (
                    <motion.div
                      layoutId="selectedGame"
                      className={`absolute inset-0 rounded-2xl border-2 ${game.borderColor} pointer-events-none`}
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.div>

                {/* Info Tooltip */}
                <AnimatePresence>
                  {showInfo === game.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl glass-effect border border-border z-50"
                    >
                      <h4 className={`font-semibold ${game.color} mb-2`}>
                        איך משחקים?
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>
                          • כל שחקן מקבל {game.cardsPerPlayer} קלפים סגורים
                        </li>
                        {game.communityCards > 0 && (
                          <li>• {game.communityCards} קלפים קהילתיים על השולחן</li>
                        )}
                        {game.id === "omaha" && (
                          <li>• חייבים להשתמש בדיוק ב-2 קלפים מהיד</li>
                        )}
                        {game.id === "short-deck" && (
                          <li>• פלאש מנצח פול האוס (סדר ידיים שונה)</li>
                        )}
                      </ul>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {game.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-full text-xs ${game.bgGlow} ${game.color}`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <motion.div 
          className="flex gap-3 mt-6 pt-4 border-t border-border relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border hover:border-gold/50"
          >
            ביטול
          </Button>
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onClose}
              disabled={!selectedGame}
              className="w-full bg-emerald text-foreground hover:bg-emerald-light disabled:opacity-50 relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              />
              <ChevronLeft className="w-4 h-4 ml-2 relative z-10" />
              <span className="relative z-10">המשך לבחירת שולחן</span>
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
