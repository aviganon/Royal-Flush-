"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Coins,
  ChevronLeft,
  Plus,
  Search,
  Spade,
  Heart,
  Diamond,
  Club,
  Loader2,
  RefreshCw,
  Gamepad2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getPokerSocketUrl } from "@/lib/poker/socket-url";
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
  smallBlind: number;
  bigBlind: number;
  buyIn: { min: number; max: number };
  players: { current: number; max: number };
  pot: number;
  status: "waiting" | "playing" | "full";
}

type ApiRoom = {
  id: string;
  gameType?: "holdem" | "omaha";
  playerCount: number;
  maxSeats: number;
  handNumber: number;
  pot: number;
  handFinished: boolean;
  smallBlind: number;
  bigBlind: number;
};

export type JoinTableBlinds = { smallBlind: number; bigBlind: number };

interface GameLobbyProps {
  onJoinTable: (
    roomId: string,
    gameType?: "holdem" | "omaha",
    buyIn?: number,
    blinds?: JoinTableBlinds,
  ) => void;
  /** פותח מחדש את חלון בחירת סוג המשחק (כמו בתפריט העליון) */
  onOpenGameSelector?: () => void;
}

const NEW_ROOM_BLIND_PRESETS = [
  { label: "$0.50/$1", smallBlind: 1, bigBlind: 2 },
  { label: "$1/$2", smallBlind: 2, bigBlind: 4 },
  { label: "$5/$10", smallBlind: 5, bigBlind: 10 },
  { label: "$25/$50", smallBlind: 25, bigBlind: 50 },
] as const;

function slugFromRoomName(name: string): string {
  const t = name.trim();
  if (!t) return "room";
  const s = t
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9א-ת\u0590-\u05FF-]/g, "")
    .slice(0, 28);
  return s || "room";
}

function roomDisplayName(id: string): string {
  return id.replace(/^room-/i, "חדר ").replace(/-/g, " ");
}

function apiRoomToTable(r: ApiRoom): Table {
  const full = r.playerCount >= r.maxSeats;
  const playing = !r.handFinished && (r.pot > 0 || r.handNumber > 0);
  const status: Table["status"] = full ? "full" : playing ? "playing" : "waiting";
  const minBuy = Math.max(80, r.bigBlind * 40);
  const maxBuy = Math.max(minBuy + 80, r.bigBlind * 800);
  const gt: "holdem" | "omaha" = r.gameType === "omaha" ? "omaha" : "holdem";
  return {
    id: r.id,
    name: roomDisplayName(r.id),
    gameType: gt,
    variant: gt === "omaha" ? "omaha" : "texas-holdem",
    blinds: `$${r.smallBlind}/$${r.bigBlind}`,
    smallBlind: r.smallBlind,
    bigBlind: r.bigBlind,
    buyIn: { min: minBuy, max: maxBuy },
    players: { current: r.playerCount, max: r.maxSeats },
    pot: r.pot,
    status,
  };
}

function clampBuyIn(min: number, max: number, v: number) {
  return Math.min(max, Math.max(min, v));
}

function LobbyGameIcon({ type }: { type: "holdem" | "omaha" }) {
  return type === "holdem" ? (
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
}

function LobbyRoomCard({
  table,
  index,
  onJoinTable,
  getStatusColor,
  getStatusText,
  getVariantName,
}: {
  table: Table;
  index: number;
  onJoinTable: GameLobbyProps["onJoinTable"];
  getStatusColor: (s: string) => string;
  getStatusText: (s: string) => string;
  getVariantName: (v?: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [buyIn, setBuyIn] = useState(() =>
    clampBuyIn(table.buyIn.min, table.buyIn.max, 2000),
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group relative"
    >
      <div className="glass-effect rounded-2xl p-6 border border-border hover:border-gold/40 transition-all duration-300 relative">
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={false}
          aria-hidden
        />

        <div className="relative z-[1] flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">{table.name}</h3>
            <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
              {table.id}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <LobbyGameIcon type={table.gameType} />
              <span className="text-sm text-muted-foreground">
                {getVariantName(table.variant)}
              </span>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
              table.status,
            )}`}
          >
            {getStatusText(table.status)}
          </span>
        </div>

        <div className="relative z-[1] grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
              <Coins className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">בליינדים</p>
              <p className="text-sm font-semibold text-foreground">{table.blinds}</p>
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

        <div className="relative z-[1] mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">טווח כניסה (צ&apos;יפים)</span>
            <span className="text-sm font-semibold text-gold">
              {table.buyIn.min} – {table.buyIn.max}
            </span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full gold-gradient"
              initial={{ width: 0 }}
              animate={{
                width: `${(table.players.current / Math.max(table.players.max, 1)) * 100}%`,
              }}
              transition={{ delay: index * 0.03 + 0.2, duration: 0.5 }}
            />
          </div>
        </div>

        <div className="relative z-[1] flex items-center justify-between mb-6 p-3 rounded-xl bg-muted/50">
          <span className="text-sm text-muted-foreground">פוט בשולחן</span>
          <span className="text-lg font-bold text-gold font-[family-name:var(--font-orbitron)]">
            {table.pot.toLocaleString()} צ&apos;יפים
          </span>
        </div>

        <div className="relative z-[1]">
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (next) {
                setBuyIn((prev) => clampBuyIn(table.buyIn.min, table.buyIn.max, prev));
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                type="button"
                className={`w-full ${
                  table.status === "full"
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-emerald text-foreground hover:bg-emerald-light"
                }`}
                disabled={table.status === "full"}
              >
                {table.status === "full" ? (
                  "שולחן מלא"
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 ml-2" />
                    הצטרף לחדר
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-border">
              <DialogHeader>
                <DialogTitle className="text-gold font-[family-name:var(--font-orbitron)]">
                  הצטרפות לחדר
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <h4 className="font-semibold mb-1">{table.name}</h4>
                  <p className="text-xs font-mono text-muted-foreground mb-2">{table.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {getVariantName(table.variant)} • {table.blinds}
                  </p>
                  <p className="text-sm font-medium text-emerald mt-3 [direction:rtl]">
                    חיבור לשולחן זה יהיה כ־
                    {table.gameType === "omaha" ? "אומהה (4 קלפים)" : "טקסס הולדם (2 קלפים)"}.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm text-muted-foreground">סכום כניסה</label>
                    <span className="text-xl font-bold text-gold font-[family-name:var(--font-orbitron)]">
                      {buyIn} צ&apos;יפים
                    </span>
                  </div>
                  <Slider
                    value={[buyIn]}
                    onValueChange={(v) =>
                      setBuyIn(clampBuyIn(table.buyIn.min, table.buyIn.max, v[0] ?? buyIn))
                    }
                    min={table.buyIn.min}
                    max={table.buyIn.max}
                    step={40}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>מינימום: {table.buyIn.min}</span>
                    <span>מקסימום: {table.buyIn.max}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full bg-emerald text-foreground hover:bg-emerald-light"
                  onClick={() => {
                    onJoinTable(table.id, table.gameType, buyIn, {
                      smallBlind: table.smallBlind,
                      bigBlind: table.bigBlind,
                    });
                    setOpen(false);
                  }}
                >
                  אישור והצטרפות
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </motion.div>
  );
}

export function GameLobby({ onJoinTable, onOpenGameSelector }: GameLobbyProps) {
  const [filter, setFilter] = useState<"all" | "holdem" | "omaha">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tables, setTables] = useState<Table[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [isLocalHost, setIsLocalHost] = useState(false);
  const [newRoomBuyIn, setNewRoomBuyIn] = useState([2000]);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomGame, setNewRoomGame] = useState<"holdem" | "omaha">("holdem");
  const [newRoomBlindIdx, setNewRoomBlindIdx] = useState(0);

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true);
    setRoomsError(null);
    try {
      const res = await fetch("/api/rooms", { cache: "no-store" });
      const json = (await res.json()) as { rooms?: ApiRoom[] };
      const raw = Array.isArray(json.rooms) ? json.rooms : [];
      const byId = new Map<string, Table>();
      for (const r of raw) {
        const t = apiRoomToTable(r);
        byId.set(t.id, t);
      }
      const mapped = [...byId.values()];
      setTables(mapped);
    } catch {
      setRoomsError("לא ניתן לטעון חדרים — ודאו ששרת הפוקר רץ");
      setTables([]);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
    const interval = setInterval(() => void loadRooms(), 5000);
    return () => clearInterval(interval);
  }, [loadRooms]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hostname;
    setIsLocalHost(h === "localhost" || h === "127.0.0.1");
  }, []);

  const filteredTables = tables.filter((table) => {
    if (filter !== "all" && table.gameType !== filter) return false;
    if (
      searchQuery &&
      !table.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !table.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
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

  const createRoomAndJoin = () => {
    const preset =
      NEW_ROOM_BLIND_PRESETS[newRoomBlindIdx] ?? NEW_ROOM_BLIND_PRESETS[0];
    const slug = slugFromRoomName(newRoomName);
    const id = `${slug}-${crypto.randomUUID().slice(0, 8)}`;
    onJoinTable(id, newRoomGame, newRoomBuyIn[0], {
      smallBlind: preset.smallBlind,
      bigBlind: preset.bigBlind,
    });
    setTimeout(() => void loadRooms(), 1500);
  };

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {isLocalHost && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-foreground leading-relaxed [direction:rtl]"
          >
            <p className="font-medium text-gold mb-1">הפעלה מקומית — שולחן רב־משתתפים</p>
            <p className="text-muted-foreground">
              רשימת החדרים והתפריט «שולחן פוקר» מתחברים לשרת Socket נפרד (
              <code className="text-gold break-all">{getPokerSocketUrl()}</code>
              ). מהטרמינל בתיקיית הפרויקט הריצו <code className="text-gold">npm run dev</code> (Next + Socket)
              — לא רק <code className="text-gold">next dev</code>. אחרי שהשרת רץ, לחצו «רענן חדרים» או רעננו את
              הדף.
            </p>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground font-[family-name:var(--font-orbitron)] mb-2">
              לובי <span className="text-gold animate-neon-pulse">המשחקים</span>
            </h1>

            {roomsError && (
              <p className="text-sm text-amber-500 mt-2">{roomsError}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenGameSelector && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenGameSelector}
                className="border-emerald/40 text-emerald hover:bg-emerald/10"
              >
                <Gamepad2 className="w-4 h-4 ml-2" />
                בחירת סוג משחק
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadRooms()}
              disabled={roomsLoading}
              className="border-border"
            >
              {roomsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="mr-2">רענן חדרים</span>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם או מזהה חדר…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-card border-border"
            />
          </div>

          <div className="flex flex-wrap gap-2">
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
                  חדר חדש
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-gold font-[family-name:var(--font-orbitron)]">
                    שולחן חדש
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-4">
                  <p className="text-sm text-muted-foreground text-right">
                    נוצר חדר עם מזהה ייחודי בשרת. שחקנים אחרים יכולים לחפש את מזהה החדר בלובי
                    או שתשתפו אותו איתם.
                  </p>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block text-right">
                      שם השולחן (אופציונלי)
                    </label>
                    <Input
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="למשל: חברים יום שלישי"
                      className="bg-muted border-border text-right"
                      maxLength={40}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block text-right">
                      סוג משחק
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={newRoomGame === "holdem" ? "default" : "outline"}
                        className={
                          newRoomGame === "holdem"
                            ? "flex-1 bg-gold text-charcoal hover:bg-gold-light"
                            : "flex-1 border-border"
                        }
                        onClick={() => setNewRoomGame("holdem")}
                      >
                        Texas Hold&apos;em
                      </Button>
                      <Button
                        type="button"
                        variant={newRoomGame === "omaha" ? "default" : "outline"}
                        className={
                          newRoomGame === "omaha"
                            ? "flex-1 bg-gold text-charcoal hover:bg-gold-light"
                            : "flex-1 border-border"
                        }
                        onClick={() => setNewRoomGame("omaha")}
                      >
                        Omaha
                      </Button>
                    </div>
                    {newRoomGame === "omaha" && (
                      <p className="text-xs text-muted-foreground mt-2 text-right">
                        אומהה (PLO): 4 קלפים ביד; בשודאון חייבים בדיוק 2 מהיד ו-3 מהבורד. מבנה הימורים כמו
                        Hold&apos;em (לא מוגבל לפוט בגרסה זו).
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block text-right">
                      בליינדים
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {NEW_ROOM_BLIND_PRESETS.map((p, idx) => (
                        <Button
                          key={p.label}
                          type="button"
                          size="sm"
                          variant={newRoomBlindIdx === idx ? "default" : "outline"}
                          className={
                            newRoomBlindIdx === idx
                              ? "bg-emerald text-foreground hover:bg-emerald-light"
                              : "border-border hover:border-gold/50"
                          }
                          onClick={() => setNewRoomBlindIdx(idx)}
                        >
                          {p.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block text-right">
                      כניסה (צ&apos;יפים)
                    </label>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gold font-bold">{newRoomBuyIn[0]}</span>
                    </div>
                    <Slider
                      value={newRoomBuyIn}
                      onValueChange={setNewRoomBuyIn}
                      min={80}
                      max={20000}
                      step={40}
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full bg-emerald text-foreground hover:bg-emerald-light"
                    onClick={createRoomAndJoin}
                  >
                    צור והצטרף
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {!roomsLoading && filteredTables.length === 0 && (
          <p className="text-muted-foreground text-center py-12 px-4 max-w-lg mx-auto leading-relaxed [direction:rtl]">
            {searchQuery.trim() || filter !== "all"
              ? filter === "omaha" && !searchQuery.trim()
                ? "אין חדרי אומהה פעילים כרגע."
                : "לא נמצאו חדרים לפי החיפוש או המסנן."
              : roomsError
                ? "הרשימה ריקה — לא התקבלו חדרים מהשרת."
                : "אין חדרים פעילים. הנתונים מגיעים בלבד משרת הפוקר; צרו חדר עם «חדר חדש» או ודאו ש־npm run dev (כולל Socket) רץ."}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTables.map((table, index) => (
              <LobbyRoomCard
                key={table.id}
                table={table}
                index={index}
                onJoinTable={onJoinTable}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                getVariantName={getVariantName}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
