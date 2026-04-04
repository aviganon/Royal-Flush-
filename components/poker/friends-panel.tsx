"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  X,
  Search,
  UserPlus,
  Check,
  Trash2,
  Loader2,
  UserCheck,
  UserX,
  Wifi,
} from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useFriends, type SearchResult } from "@/hooks/use-friends";

interface FriendsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  getIdToken: () => Promise<string | null>;
}

type Tab = "online" | "all" | "requests" | "search";

function OnlineDot({ online }: { online: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {online && (
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
          animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
          online ? "bg-green-400" : "bg-muted-foreground/40"
        }`}
      />
    </span>
  );
}

function Avatar({ name, photoURL, size = "sm" }: { name: string; photoURL: string | null; size?: "sm" | "md" }) {
  const dim = size === "md" ? "w-10 h-10 text-base" : "w-8 h-8 text-sm";
  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoURL} alt={name} className={`${dim} rounded-full object-cover shrink-0`} />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center font-bold text-gold shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function FriendsPanel({ isOpen, onClose, uid, getIdToken }: FriendsPanelProps) {
  const [tab, setTab] = useState<Tab>("online");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { friends, requests, requestCount, onlineCount, sendRequest, respondRequest, removeFriend, searchUsers } =
    useFriends(uid, getIdToken);

  const onlineF = friends.filter((f) => f.isOnline);
  const allF = friends;

  const setPending = (id: string, v: boolean) =>
    setPendingActions((p) => { const s = new Set(p); v ? s.add(id) : s.delete(id); return s; });

  const handleSearch = (q: string) => {
    setSearchQ(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchUsers(q);
      setSearchResults(res);
      setSearching(false);
    }, 400);
  };

  const handleSendRequest = async (toUid: string, name: string) => {
    setPending(toUid, true);
    const res = await sendRequest(toUid);
    setPending(toUid, false);
    if (res.ok) {
      toast.success(res.accepted ? `✅ כבר חברים עם ${name}!` : `📨 בקשת חברות נשלחה ל-${name}`);
    } else {
      toast.error(res.error ?? "שגיאה");
    }
  };

  const handleRespond = async (fromUid: string, name: string, action: "accept" | "reject") => {
    setPending(fromUid + action, true);
    const res = await respondRequest(fromUid, action);
    setPending(fromUid + action, false);
    if (res.ok) {
      toast.success(action === "accept" ? `🤝 אישרת את ${name} כחבר/ה!` : `❌ דחית את הבקשה`);
    } else {
      toast.error("שגיאה בביצוע הפעולה");
    }
  };

  const handleRemove = async (friendUid: string, name: string) => {
    if (!confirm(`להסיר את ${name} מהחברים?`)) return;
    setPending("rm" + friendUid, true);
    await removeFriend(friendUid);
    setPending("rm" + friendUid, false);
    toast.success(`הוסר/ה ${name} מהחברים`);
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "online", label: "מחוברים", count: onlineCount },
    { id: "all", label: "כולם", count: allF.length },
    { id: "requests", label: "בקשות", count: requestCount },
    { id: "search", label: "חיפוש" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm glass-effect border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-bold text-gold font-[family-name:var(--font-orbitron)]">
                  חברים
                </h2>
                {onlineCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-medium"
                  >
                    {onlineCount} מחובר{onlineCount !== 1 ? "ים" : ""}
                  </motion.span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border shrink-0">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                    tab === t.id ? "text-gold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                      t.id === "requests" ? "bg-gold text-charcoal" : "bg-muted text-muted-foreground"
                    }`}>
                      {t.count}
                    </span>
                  )}
                  {tab === t.id && (
                    <motion.div
                      layoutId="friendsTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">

                {/* Online / All friends */}
                {(tab === "online" || tab === "all") && (
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 space-y-2"
                  >
                    {(tab === "online" ? onlineF : allF).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Wifi className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">
                          {tab === "online" ? "אין חברים מחוברים כרגע" : "עדיין אין חברים — חפש וצרף!"}
                        </p>
                      </div>
                    ) : (
                      (tab === "online" ? onlineF : allF).map((f) => (
                        <motion.div
                          key={f.uid}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="relative">
                            <Avatar name={f.displayName} photoURL={f.photoURL} size="md" />
                            <span className="absolute -bottom-0.5 -right-0.5">
                              <OnlineDot online={f.isOnline} />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{f.displayName}</p>
                            <p className={`text-xs ${f.isOnline ? "text-green-400" : "text-muted-foreground"}`}>
                              {f.isOnline ? "🟢 מחובר/ת" : f.lastSeen
                                ? `נראה/ה ${formatRelative(f.lastSeen)}`
                                : "לא נראה/ה"}
                            </p>
                          </div>
                          <button
                            onClick={() => void handleRemove(f.uid, f.displayName)}
                            disabled={pendingActions.has("rm" + f.uid)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          >
                            {pendingActions.has("rm" + f.uid)
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* Requests */}
                {tab === "requests" && (
                  <motion.div
                    key="requests"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 space-y-2"
                  >
                    {requests.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">אין בקשות חברות ממתינות</p>
                      </div>
                    ) : (
                      requests.map((r) => (
                        <motion.div
                          key={r.uid}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gold/5 border border-gold/20"
                        >
                          <Avatar name={r.displayName} photoURL={r.photoURL} size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{r.displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.createdAt ? formatRelative(r.createdAt) : ""}
                            </p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <motion.button
                              onClick={() => void handleRespond(r.uid, r.displayName, "accept")}
                              disabled={pendingActions.has(r.uid + "accept")}
                              className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-all"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {pendingActions.has(r.uid + "accept")
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <UserCheck className="w-4 h-4" />}
                            </motion.button>
                            <motion.button
                              onClick={() => void handleRespond(r.uid, r.displayName, "reject")}
                              disabled={pendingActions.has(r.uid + "reject")}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {pendingActions.has(r.uid + "reject")
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <UserX className="w-4 h-4" />}
                            </motion.button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* Search */}
                {tab === "search" && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4"
                  >
                    <div className="relative mb-4">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={searchQ}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="חפש לפי שם..."
                        className="pr-9 bg-muted/50 border-border [direction:rtl]"
                        autoFocus
                      />
                    </div>

                    {searching && (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gold" />
                      </div>
                    )}

                    <div className="space-y-2">
                      {!searching && searchQ.length >= 2 && searchResults.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">לא נמצאו משתמשים</p>
                      )}
                      {searchResults.map((u) => {
                        const isFriend = friends.some((f) => f.uid === u.uid);
                        const isPending = pendingActions.has(u.uid);
                        return (
                          <motion.div
                            key={u.uid}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <Avatar name={u.displayName} photoURL={u.photoURL} size="md" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{u.displayName}</p>
                              <p className="text-xs text-gold">{u.chips.toLocaleString()} ✦</p>
                            </div>
                            {isFriend ? (
                              <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2.5 py-1.5 rounded-lg border border-green-500/20">
                                <Check className="w-3 h-3" />
                                <span>חברים</span>
                              </div>
                            ) : (
                              <motion.button
                                onClick={() => void handleSendRequest(u.uid, u.displayName)}
                                disabled={isPending}
                                className="flex items-center gap-1.5 text-xs bg-gold/15 text-gold hover:bg-gold/25 px-3 py-1.5 rounded-lg border border-gold/30 transition-all font-medium"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {isPending
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <UserPlus className="w-3.5 h-3.5" />}
                                {isPending ? "שולח..." : "הוסף"}
                              </motion.button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-border shrink-0 text-center">
              <p className="text-xs text-muted-foreground/60">
                חברים מחוברים מסומנים ב-🟢 · נוכחות מתעדכנת כל דקה
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "לפני רגע";
  if (m < 60) return `לפני ${m} דקות`;
  const h = Math.floor(m / 60);
  if (h < 24) return `לפני ${h} שעות`;
  return `לפני ${Math.floor(h / 24)} ימים`;
}
