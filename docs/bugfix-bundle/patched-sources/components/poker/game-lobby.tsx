"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Coins,
  Clock,
  ChevronLeft,
  Plus,
  Filter,
  Search,
  Spade,
  Heart,
  Diamond,
  Club,
  Zap,
  Flame,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface Table {
  id: string;
  name: string;
  gameType: "holdem" | "omaha";
  variant?: "texas-holdem" | "omaha" | "omaha-hi-lo" | "short-deck" | "5-card-omaha";
  blinds: string;
  buyIn: { min: number; max: number };
  players: { current: number; max: number };
  pot: number;
  status: "waiting" | "playing" | "full";
  speed?: "normal" | "turbo" | "hyper";
}

interface GameLobbyProps {
  onJoinTable: (
    tableId: string,
    gameType?: "holdem" | "omaha",
    buyIn?: number,
  ) => void;
}

const tables: Table[] = [
  {
    id: "1",
    name: "שולחן המלכים",
    gameType: "holdem",
    variant: "texas-holdem",
    blinds: "$1/$2",
    buyIn: { min: 100, max: 500 },
    players: { current: 4, max: 9 },
    pot: 1250,
    status: "playing",
    speed: "normal",
  },
  {
    id: "2",
    name: "אומהה VIP",
    gameType: "omaha",
    variant: "omaha",
    blinds: "$5/$10",
    buyIn: { min: 500, max: 2000 },
    players: { current: 6, max: 6 },
    pot: 8500,
    status: "full",
    speed: "normal",
  },
  {
    id: "3",
    name: "מתחילים",
    gameType: "holdem",
    variant: "texas-holdem",
    blinds: "$0.50/$1",
    buyIn: { min: 50, max: 200 },
    players: { current: 2, max: 9 },
    pot: 320,
    status: "waiting",
    speed: "normal",
  },
  {
    id: "4",
    name: "High Stakes",
    gameType: "holdem",
    variant: "texas-holdem",
    blinds: "$25/$50",
    buyIn: { min: 2500, max: 10000 },
    players: { current: 5, max: 6 },
    pot: 45000,
    status: "playing",
    speed: "normal",
  },
  {
    id: "5",
    name: "אומהה היי-לואו",
    gameType: "omaha",
    variant: "omaha-hi-lo",
    blinds: "$2/$4",
    buyIn: { min: 200, max: 800 },
    players: { current: 3, max: 6 },
    pot: 1890,
    status: "waiting",
    speed: "normal",
  },
  {
    id: "6",
    name: "Turbo Tables",
    gameType: "holdem",
    variant: "texas-holdem",
    blinds: "$2/$4",
    buyIn: { min: 200, max: 800 },
    players: { current: 7, max: 9 },
    pot: 3200,
    status: "playing",
    speed: "turbo",
  },
  {
    id: "7",
    name: "שורט דק אקשן",
    gameType: "holdem",
    variant: "short-deck",
    blinds: "$5/$10",
    buyIn: { min: 500, max: 2000 },
    players: { current: 4, max: 6 },
    pot: 4500,
    status: "playing",
    speed: "turbo",
  },
  {
    id: "8",
    name: "5-Card PLO",
    gameType: "omaha",
    variant: "5-card-omaha",
    blinds: "$10/$20",
    buyIn: { min: 1000, max: 5000 },
    players: { current: 5, max: 6 },
    pot: 12000,
    status: "playing",
    speed: "normal",
  },
  {
    id: "9",
    name: "Hyper Turbo",
    gameType: "holdem",
    variant: "texas-holdem",
    blinds: "$1/$2",
    buyIn: { min: 100, max: 400 },
    players: { current: 8, max: 9 },
    pot: 2800,
    status: "playing",
    speed: "hyper",
  },
];

interface RoomStatus {
  id: string;
  playerCount: number;
  maxSeats: number;
  pot: number;
  handNumber: number;
  smallBlind: number;
  bigBlind: number;
}

export function GameLobby({ onJoinTable }: GameLobbyProps) {
  const [filter, setFilter] = useState<"all" | "holdem" | "omaha">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [buyInAmount, setBuyInAmount] = useState([200]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [liveRooms, setLiveRooms] = useState<RoomStatus[]>([]);

  // ── טעינת סטטוס חי מהשרת כל 5 שניות ──────────────────────────
  useEffect(() => {
    const fetchRooms = () => {
      fetch("/api/rooms")
        .then((r) => r.json())
        .then((d: { rooms?: RoomStatus[] }) => {
          if (d.rooms) setLiveRooms(d.rooms);
        })
        .catch(() => {});
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  // מיזוג: הנתונים הסטטיים + עדכונים חיים מהשרת
  const tablesWithLive: Table[] = tables.map((t) => {
    const live = liveRooms.find((r) => r.id === `table-${t.id}`);
    if (!live) return t;
    const isFull = live.playerCount >= live.maxSeats;
    return {
      ...t,
      players: { current: live.playerCount, max: live.maxSeats },
      pot: live.pot,
      status: isFull ? "full" : live.playerCount > 0 ? "playing" : "waiting",
    };
  });

  const filteredTables = tablesWithLive.filter((table) => {
    if (filter !== "all" && table.gameType !== filter) return false;
    if (
      searchQuery &&
      !table.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "text-emerald bg-emerald/20 border-emerald/40";
      case "playing":
        return "text-gold bg-gold/20 border-gold/40";
      case "full":
        return "text-destructive bg-destructive/20 border-destructive/40";
      default:
        return "";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "waiting":
        return "ממתין לשחקנים";
      case "playing":
        return "משחק פעיל";
      case "full":
        return "מלא";
      default:
        return "";
    }
  };

  const getVariantName = (variant?: string) => {
    switch (variant) {
      case "texas-holdem":
        return "Texas Hold'em";
      case "omaha":
        return "Pot Limit Omaha";
      case "omaha-hi-lo":
        return "Omaha Hi-Lo";
      case "short-deck":
        return "Short Deck 6+";
      case "5-card-omaha":
        return "5-Card PLO";
      default:
        return "Texas Hold'em";
    }
  };

  const getSpeedInfo = (speed?: string) => {
    switch (speed) {
      case "turbo":
        return { icon: Zap, text: "טורבו", color: "text-orange-500 bg-orange-500/20" };
      case "hyper":
        return { icon: Flame, text: "היפר", color: "text-red-500 bg-red-500/20" };
      default:
        return null;
    }
  };

  const GameIcon = ({ type }: { type: "holdem" | "omaha" }) =>
    type === "holdem" ? (
      <div className="flex gap-0.5">
        <Spade className="w-3 h-3 text-foreground" />
        <Heart className="w-3 h-3 text-destructive" />
      </div>
    ) : (
      <div className="flex gap-0.5">
        <Diamond className="w-3 h-3 text-destructive" />
        <Club className="w-3 h-3 text-foreground" />
        <Spade className="w-3 h-3 text-foreground" />
        <Heart className="w-3 h-3 text-destructive" />
      </div>
    );

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground font-[family-name:var(--font-orbitron)] mb-2">
            לובי{" "}
            <span className="text-gold animate-neon-pulse">המשחקים</span>
          </h1>
          <p className="text-muted-foreground">
            בחר שולחן והצטרף למשחק
          </p>
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="חיפוש שולחן..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-card border-border"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "holdem", "omaha"] as const).map((type) => (
              <Button
                key={type}
                variant={filter === type ? "default" : "outline"}
                onClick={() => setFilter(type)}
                className={
                  filter === type
                    ? "bg-gold text-charcoal hover:bg-gold-light"
                    : "border-border hover:border-gold/50"
                }
              >
                {type === "all"
                  ? "הכל"
                  : type === "holdem"
                  ? "Hold'em"
                  : "Omaha"}
              </Button>
            ))}

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-emerald text-emerald hover:bg-emerald/10"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  שולחן חדש
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect border-border">
                <DialogHeader>
                  <DialogTitle className="text-gold font-[family-name:var(--font-orbitron)]">
                    יצירת שולחן חדש
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      שם השולחן
                    </label>
                    <Input
                      placeholder="הכנס שם..."
                      className="bg-muted border-border"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      סוג משחק
                    </label>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 border-gold/50">
                        {"Texas Hold'em"}
                      </Button>
                      <Button variant="outline" className="flex-1 border-border">
                        Omaha
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      בליינדים
                    </label>
                    <div className="flex gap-2">
                      {["$0.50/$1", "$1/$2", "$5/$10", "$25/$50"].map((blind) => (
                        <Button
                          key={blind}
                          variant="outline"
                          size="sm"
                          className="border-border hover:border-gold/50"
                        >
                          {blind}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full bg-emerald text-foreground hover:bg-emerald-light">
                    צור שולחן
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTables.map((table, index) => (
              <motion.div
                key={table.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group relative"
              >
                <div className="glass-effect rounded-2xl p-6 border border-border hover:border-gold/40 transition-all duration-300">
                  {/* Glow Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  />

                  {/* Speed Badge */}
                  {table.speed && table.speed !== "normal" && (
                    <motion.div
                      className="absolute top-3 left-3"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {(() => {
                        const speedInfo = getSpeedInfo(table.speed);
                        if (!speedInfo) return null;
                        const SpeedIcon = speedInfo.icon;
                        return (
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${speedInfo.color}`}>
                            <SpeedIcon className="w-3 h-3" />
                            {speedInfo.text}
                          </span>
                        );
                      })()}
                    </motion.div>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        {table.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <GameIcon type={table.gameType} />
                        <span className="text-sm text-muted-foreground">
                          {getVariantName(table.variant)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        table.status
                      )}`}
                    >
                      {getStatusText(table.status)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                        <Coins className="w-4 h-4 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">בליינדים</p>
                        <p className="text-sm font-semibold text-foreground">
                          {table.blinds}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-emerald" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">שחקנים</p>
                        <p className="text-sm font-semibold text-foreground">
                          {table.players.current}/{table.players.max}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Buy-in Range */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        טווח כניסה
                      </span>
                      <span className="text-sm font-semibold text-gold">
                        ${table.buyIn.min} - ${table.buyIn.max}
                      </span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full gold-gradient"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            (table.players.current / table.players.max) * 100
                          }%`,
                        }}
                        transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Pot */}
                  <div className="flex items-center justify-between mb-6 p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">
                      קופה נוכחית
                    </span>
                    <motion.span
                      className="text-lg font-bold text-gold font-[family-name:var(--font-orbitron)]"
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ${table.pot.toLocaleString()}
                    </motion.span>
                  </div>

                  {/* Join Button */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className={`w-full ${
                          table.status === "full"
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-emerald text-foreground hover:bg-emerald-light"
                        }`}
                        disabled={table.status === "full"}
                        onClick={() => setSelectedTable(table)}
                      >
                        {table.status === "full" ? (
                          "שולחן מלא"
                        ) : (
                          <>
                            <ChevronLeft className="w-4 h-4 ml-2" />
                            הצטרף לשולחן
                          </>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-effect border-border">
                      <DialogHeader>
                        <DialogTitle className="text-gold font-[family-name:var(--font-orbitron)]">
                          הצטרפות לשולחן
                        </DialogTitle>
                      </DialogHeader>
                      
                        <div className="space-y-6 pt-4">
                          <div className="p-4 rounded-xl bg-muted/50 border border-border">
                            <h4 className="font-semibold mb-2">
                              {table.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {getVariantName(table.variant)}{" "}
                              • {table.blinds}
                            </p>
                            {table.speed && table.speed !== "normal" && (
                              <span className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium ${getSpeedInfo(table.speed)?.color}`}>
                                {(() => {
                                  const speedInfo = getSpeedInfo(table.speed);
                                  if (!speedInfo) return null;
                                  const SpeedIcon = speedInfo.icon;
                                  return (
                                    <>
                                      <SpeedIcon className="w-3 h-3" />
                                      {speedInfo.text}
                                    </>
                                  );
                                })()}
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <label className="text-sm text-muted-foreground">
                                סכום כניסה
                              </label>
                              <span className="text-xl font-bold text-gold font-[family-name:var(--font-orbitron)]">
                                ${buyInAmount[0]}
                              </span>
                            </div>
                            <Slider
                              value={buyInAmount}
                              onValueChange={setBuyInAmount}
                              min={table.buyIn.min}
                              max={table.buyIn.max}
                              step={10}
                              className="mb-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>מינימ��ם: ${table.buyIn.min}</span>
                              <span>מקסימום: ${table.buyIn.max}</span>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
                            <p className="text-sm text-gold text-center">
                              הסכום יינעל בקופה עד סיום המשחק
                            </p>
                          </div>

                          <Button
                            className="w-full bg-emerald text-foreground hover:bg-emerald-light"
                            onClick={() =>
                              onJoinTable(
                                table.id,
                                table.gameType,
                                table.buyIn.min,
                              )
                            }
                          >
                            אישור והצטרפות
                          </Button>
                        </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
