"use client";

import { motion } from "framer-motion";
import {
  User,
  KeyRound,
  Gamepad2,
  Save,
  Loader2,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Palette,
  ChevronRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import type { UserProfile } from "@/lib/firebase/user-profile";

interface UserSettingsProps {
  profile: UserProfile;
  getIdToken: () => Promise<string | null>;
  onProfileUpdated: () => Promise<void>;
}

const AVATAR_OPTIONS = [
  "🎭", "🃏", "🎰", "🦁", "🐯", "🦊", "🐺", "🦝",
  "🦈", "🦅", "🎩", "👑", "💎", "⚡", "🔥", "🌊",
  "🎯", "🏆", "💰", "🃏", "🎲", "🤠", "😎", "🥷",
];

const TABLE_THEMES = [
  { id: "default", label: "ירוק קלאסי", color: "#166534" },
  { id: "blue", label: "כחול ליל", color: "#1e3a5f" },
  { id: "red", label: "אדום מלכותי", color: "#7f1d1d" },
  { id: "purple", label: "סגול עמוק", color: "#4c1d95" },
];

const DEFAULT_BUYIN_OPTIONS = [500, 1000, 2000, 5000, 10000];

function useLocalSetting<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  const set = (v: T) => {
    setValue(v);
    if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(v));
  };
  return [value, set];
}

type Tab = "profile" | "game" | "account";

export function UserSettings({ profile, getIdToken, onProfileUpdated }: UserSettingsProps) {
  const [tab, setTab] = useState<Tab>("profile");

  /* ── Profile tab ── */
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [avatar, setAvatar] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("rf_avatar") ?? "🎭";
    return "🎭";
  });
  const [savingProfile, setSavingProfile] = useState(false);

  /* ── Game settings (localStorage) ── */
  const [sound, setSound] = useLocalSetting("rf_sound", true);
  const [notifications, setNotifications] = useLocalSetting("rf_notifications", true);
  const [tableTheme, setTableTheme] = useLocalSetting("rf_table_theme", "default");
  const [defaultBuyIn, setDefaultBuyIn] = useLocalSetting("rf_default_buyin", 2000);
  const [autoMuck, setAutoMuck] = useLocalSetting("rf_auto_muck", true);

  /* ── Account tab ── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const isEmailUser = useRef(false);
  useEffect(() => {
    const auth = getAuth();
    const methods = auth.currentUser?.providerData.map((p) => p.providerId) ?? [];
    isEmailUser.current = methods.includes("password");
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: displayName.trim(), avatar }),
      });
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? "שגיאה");
      localStorage.setItem("rf_avatar", avatar);
      await onProfileUpdated();
      toast.success("הפרופיל עודכן בהצלחה");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 6) { toast.error("סיסמה חייבת להכיל לפחות 6 תווים"); return; }
    if (newPassword !== confirmPassword) { toast.error("הסיסמאות אינן תואמות"); return; }
    setSavingPassword(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) { toast.error("לא ניתן לשנות סיסמה עבור חשבון Google"); return; }
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      toast.success("הסיסמה שונתה בהצלחה");
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("הסיסמה הנוכחית שגויה");
      } else {
        toast.error((e as Error).message);
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "profile", label: "פרופיל", icon: User },
    { id: "game", label: "הגדרות משחק", icon: Gamepad2 },
    { id: "account", label: "חשבון", icon: KeyRound },
  ];

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground font-[family-name:var(--font-orbitron)] mb-2">
            הגדרות <span className="text-gold animate-neon-pulse">חשבון</span>
          </h1>
          <p className="text-muted-foreground">עריכת פרופיל, משחק והגדרות אישיות</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-1 mb-6 bg-muted/30 p-1 rounded-xl border border-border"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-gold text-charcoal shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </motion.div>

        {/* ── Profile Tab ── */}
        {tab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Avatar */}
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-gold" /> אמוג'י / אווטאר
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gold/10 border-2 border-gold/40 flex items-center justify-center text-4xl">
                  {avatar}
                </div>
                <div>
                  <p className="font-medium text-foreground">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setAvatar(emoji)}
                    className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${
                      avatar === emoji
                        ? "bg-gold/20 border-2 border-gold ring-1 ring-gold/30"
                        : "bg-muted/50 border border-border hover:border-gold/30"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Name */}
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gold" /> שם תצוגה
              </h2>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                className="bg-muted border-border text-right text-base"
                placeholder="שם השחקן"
              />
              <p className="text-xs text-muted-foreground mt-2 text-right">
                השם שיוצג לשחקנים אחרים בשולחן
              </p>
            </div>

            <Button
              className="w-full bg-gold text-charcoal hover:bg-gold-light h-11"
              onClick={() => void saveProfile()}
              disabled={savingProfile || !displayName.trim()}
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <><Save className="w-4 h-4 ml-2" />שמור פרופיל</>
              )}
            </Button>
          </motion.div>
        )}

        {/* ── Game Settings Tab ── */}
        {tab === "game" && (
          <motion.div
            key="game"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Sound & Notifications */}
            <div className="glass-effect rounded-2xl p-6 border border-border space-y-4">
              <h2 className="text-lg font-semibold text-foreground mb-2">שמע והתראות</h2>

              {[
                {
                  label: "צלילי משחק",
                  desc: "צלילים בפעולות, הימורים וניצחון",
                  icon: sound ? Volume2 : VolumeX,
                  value: sound,
                  set: setSound,
                  color: "text-gold",
                },
                {
                  label: "התראות תור",
                  desc: "הודעה כשהגיע תורך לפעול",
                  icon: notifications ? Bell : BellOff,
                  value: notifications,
                  set: setNotifications,
                  color: "text-emerald",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => item.set(!item.value)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      item.value ? "bg-gold" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        item.value ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Default Buy-In */}
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-1">כניסה ברירת מחדל</h2>
              <p className="text-sm text-muted-foreground mb-4">
                כמות הצ'יפים שתוצע אוטומטית בהצטרפות לשולחן
              </p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_BUYIN_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setDefaultBuyIn(v)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      defaultBuyIn === v
                        ? "bg-gold text-charcoal border-gold"
                        : "bg-muted border-border text-muted-foreground hover:border-gold/40"
                    }`}
                  >
                    {v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Theme */}
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-1">עיצוב שולחן</h2>
              <p className="text-sm text-muted-foreground mb-4">צבע השולחן בזמן המשחק</p>
              <div className="grid grid-cols-2 gap-3">
                {TABLE_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTableTheme(t.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      tableTheme === t.id
                        ? "border-gold bg-gold/5"
                        : "border-border hover:border-gold/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: t.color }} />
                    <span className="text-sm font-medium text-foreground">{t.label}</span>
                    {tableTheme === t.id && <ChevronRight className="w-4 h-4 text-gold mr-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Muck */}
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">הסתר קלפים אחרי הפסד</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    קלפי הפסד לא יוצגו לשחקנים אחרים בשודאון
                  </p>
                </div>
                <button
                  onClick={() => setAutoMuck(!autoMuck)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${autoMuck ? "bg-gold" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoMuck ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              הגדרות המשחק נשמרות מקומית על המכשיר
            </p>
          </motion.div>
        )}

        {/* ── Account Tab ── */}
        {tab === "account" && (
          <motion.div
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Account Info */}
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">פרטי חשבון</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">אימייל</span>
                  <span className="text-foreground font-medium">{profile.email ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">יתרת צ'יפים</span>
                  <span className="text-gold font-bold font-[family-name:var(--font-orbitron)]">
                    {profile.chips.toLocaleString()} ✦
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">מזהה משתמש</span>
                  <span className="text-muted-foreground font-mono text-xs">{profile.uid.slice(0, 12)}…</span>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-gold" /> שינוי סיסמה
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {profile.email
                  ? "זמין רק למשתמשים שנרשמו עם אימייל וסיסמה"
                  : "לא זמין עבור כניסה עם Google"}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">סיסמה נוכחית</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••"
                    className="bg-muted border-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">סיסמה חדשה</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="מינימום 6 תווים"
                    className="bg-muted border-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">אימות סיסמה חדשה</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="חזור על הסיסמה"
                    className="bg-muted border-border"
                  />
                </div>
                <Button
                  className="w-full bg-gold text-charcoal hover:bg-gold-light"
                  onClick={() => void savePassword()}
                  disabled={
                    savingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                >
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "שנה סיסמה"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
