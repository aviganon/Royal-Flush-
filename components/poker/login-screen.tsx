"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Spade,
  Heart,
  Diamond,
  Club,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Crown,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  signInWithGoogle,
  signInWithFacebook,
  signUpWithEmail,
  signInWithEmail,
  sendResetEmail,
} from "@/lib/firebase/auth-actions";

// Particle component for magical floating effects
const Particle = ({ delay, duration }: { delay: number; duration: number }) => {
  const randomX = Math.random() * 100;
  const randomSize = Math.random() * 4 + 2;
  const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  return (
    <motion.div
      className="absolute rounded-full bg-gold/30"
      style={{
        width: randomSize,
        height: randomSize,
        left: `${randomX}%`,
        bottom: "-10px",
      }}
      initial={{ opacity: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [0, -(windowHeight + 100)],
        x: [0, Math.sin(randomX) * 50],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};

// Floating 3D Card Component
const Floating3DCard = ({
  suit,
  value,
  delay,
  x,
  y,
  rotation,
  scale = 1,
}: {
  suit: "spades" | "hearts" | "diamonds" | "clubs";
  value: string;
  delay: number;
  x: string;
  y: string;
  rotation?: number;
  scale?: number;
}) => {
  const suitIcons = {
    spades: Spade,
    hearts: Heart,
    diamonds: Diamond,
    clubs: Club,
  };
  const SuitIcon = suitIcons[suit];
  const isRed = suit === "hearts" || suit === "diamonds";

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{ left: x, top: y, scale }}
      initial={{ opacity: 0, scale: 0, rotateY: -180 }}
      animate={{
        opacity: 1,
        scale,
        rotateY: 0,
        y: [0, -30, 0],
        rotateZ: [rotation ?? 0, (rotation ?? 0) + 5, rotation ?? 0],
      }}
      transition={{
        opacity: { delay, duration: 0.8 },
        scale: { delay, duration: 0.8, type: "spring" },
        rotateY: { delay, duration: 1 },
        y: { delay: delay + 0.5, duration: 4, repeat: Infinity, ease: "easeInOut" },
        rotateZ: { delay: delay + 0.5, duration: 6, repeat: Infinity, ease: "easeInOut" },
      }}
      whileHover={{ scale: (scale ?? 1) * 1.3, rotateY: 15, rotateX: -10 }}
    >
      <div
        className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl bg-gradient-to-br from-white via-gray-50 to-gray-100 shadow-2xl flex flex-col items-center justify-between p-2 sm:p-3 border border-gray-200 relative overflow-hidden"
        style={{
          boxShadow: isRed
            ? "0 20px 60px rgba(239, 68, 68, 0.3), 0 0 30px rgba(239, 68, 68, 0.1)"
            : "0 20px 60px rgba(0, 0, 0, 0.3), 0 0 30px rgba(212, 175, 55, 0.2)",
        }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <span className={`text-base sm:text-lg font-bold ${isRed ? "text-red-500" : "text-gray-900"} self-start`}>
          {value}
        </span>
        <SuitIcon className={`w-8 h-8 sm:w-10 sm:h-10 ${isRed ? "text-red-500" : "text-gray-900"}`} />
        <span className={`text-base sm:text-lg font-bold rotate-180 ${isRed ? "text-red-500" : "text-gray-900"} self-end`}>
          {value}
        </span>
      </div>
    </motion.div>
  );
};

// Floating Chip Component
const FloatingChip = ({
  color,
  value,
  delay,
  x,
  y,
}: {
  color: string;
  value: string;
  delay: number;
  x: string;
  y: string;
}) => (
  <motion.div
    className="absolute"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, scale: 0, rotate: -180 }}
    animate={{
      opacity: [0.6, 0.9, 0.6],
      scale: 1,
      rotate: 0,
      y: [0, -20, 0],
    }}
    transition={{
      opacity: { delay: delay + 1, duration: 3, repeat: Infinity },
      scale: { delay, duration: 0.5, type: "spring" },
      rotate: { delay, duration: 0.8 },
      y: { delay: delay + 1, duration: 5, repeat: Infinity, ease: "easeInOut" },
    }}
    whileHover={{ scale: 1.2, rotate: 360 }}
  >
    <div
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${color} flex items-center justify-center border-4 border-dashed border-white/30 shadow-xl`}
    >
      <span className="text-white font-bold text-xs sm:text-sm">{value}</span>
    </div>
  </motion.div>
);

export function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "שגיאת התחברות";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error("אימייל וסיסמה (מינ׳ 6 תווים) נדרשים");
      return;
    }
    void run(async () => {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password, username.trim());
        toast.success("נרשמת בהצלחה");
      } else {
        await signInWithEmail(email.trim(), password);
      }
    });
  };

  const handleForgot = () => {
    if (!email.trim()) {
      toast.error("הזן אימייל לשחזור");
      return;
    }
    void run(async () => {
      await sendResetEmail(email.trim());
      toast.success("נשלח מייל לאיפוס סיסמה");
    });
  };

  // Welcome animation screen
  if (showWelcome) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-charcoal">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 30% 30%, rgba(212,175,55,0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 70% 70%, rgba(16,185,129,0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 30% 70%, rgba(212,175,55,0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 70% 30%, rgba(16,185,129,0.15) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring" }}
          >
            <motion.div
              className="w-32 h-32 rounded-3xl gold-gradient flex items-center justify-center shadow-2xl"
              animate={{
                boxShadow: [
                  "0 0 30px rgba(212,175,55,0.3), 0 0 60px rgba(212,175,55,0.2)",
                  "0 0 60px rgba(212,175,55,0.5), 0 0 100px rgba(212,175,55,0.3)",
                  "0 0 30px rgba(212,175,55,0.3), 0 0 60px rgba(212,175,55,0.2)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Crown className="w-16 h-16 text-charcoal" />
              </motion.div>
            </motion.div>

            {[Spade, Heart, Diamond, Club].map((Icon, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ top: "50%", left: "50%", x: 70 * Math.cos((i * Math.PI) / 2), y: 70 * Math.sin((i * Math.PI) / 2) }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: i * 0.25 }}
              >
                <Icon className={`w-6 h-6 ${i % 2 === 1 ? "text-red-500" : "text-gold"}`} />
              </motion.div>
            ))}
          </motion.div>

          <motion.h1
            className="mt-8 text-4xl sm:text-5xl font-bold text-gold font-[family-name:var(--font-orbitron)]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              textShadow: "0 0 20px rgba(212,175,55,0.5), 0 0 40px rgba(212,175,55,0.3)",
            }}
          >
            ROYAL FLUSH
          </motion.h1>

          <motion.div
            className="flex gap-2 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-gold"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Animated Dark Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal" />

      {/* Moving gradient orbs */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
          top: "-20%",
          right: "-20%",
        }}
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          bottom: "-10%",
          left: "-10%",
        }}
        animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <Particle key={i} delay={i * 0.5} duration={8 + Math.random() * 4} />
        ))}
      </div>

      {/* Floating 3D Cards */}
      <div className="absolute inset-0 pointer-events-auto">
        <Floating3DCard suit="spades" value="A" delay={0} x="5%" y="10%" rotation={-15} scale={0.9} />
        <Floating3DCard suit="hearts" value="K" delay={0.3} x="85%" y="5%" rotation={12} scale={0.85} />
        <Floating3DCard suit="diamonds" value="Q" delay={0.6} x="2%" y="65%" rotation={-8} scale={0.8} />
        <Floating3DCard suit="clubs" value="J" delay={0.9} x="88%" y="60%" rotation={10} scale={0.85} />
        <Floating3DCard suit="hearts" value="10" delay={1.2} x="15%" y="85%" rotation={-5} scale={0.75} />
        <Floating3DCard suit="spades" value="9" delay={1.5} x="80%" y="85%" rotation={8} scale={0.7} />
        <Floating3DCard suit="diamonds" value="A" delay={1.8} x="92%" y="30%" rotation={-12} scale={0.65} />
        <Floating3DCard suit="clubs" value="K" delay={2.1} x="8%" y="40%" rotation={15} scale={0.7} />
      </div>

      {/* Floating Chips */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingChip color="bg-gradient-to-br from-red-500 to-red-700" value="$5" delay={0.5} x="12%" y="25%" />
        <FloatingChip color="bg-gradient-to-br from-emerald-500 to-emerald-700" value="$25" delay={0.8} x="82%" y="40%" />
        <FloatingChip color="bg-gradient-to-br from-blue-500 to-blue-700" value="$50" delay={1.1} x="6%" y="80%" />
        <FloatingChip color="gold-gradient" value="$100" delay={1.4} x="90%" y="75%" />
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Glow behind card */}
        <motion.div
          className="absolute -inset-4 rounded-[2rem] opacity-50"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(16,185,129,0.2) 100%)",
            filter: "blur(30px)",
          }}
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <div className="glass-effect rounded-3xl p-6 sm:p-8 border border-gold/30 shadow-2xl relative overflow-hidden">
          {/* Animated border shimmer */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Logo */}
          <motion.div
            className="flex flex-col items-center mb-6 sm:mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          >
            <motion.div
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl gold-gradient flex items-center justify-center mb-4 shadow-lg"
              animate={{
                rotate: [0, 3, -3, 0],
                boxShadow: [
                  "0 10px 40px rgba(212,175,55,0.3)",
                  "0 10px 60px rgba(212,175,55,0.5)",
                  "0 10px 40px rgba(212,175,55,0.3)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-charcoal" />
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: i < 2 ? -8 : "auto",
                    bottom: i >= 2 ? -8 : "auto",
                    left: i % 2 === 0 ? -8 : "auto",
                    right: i % 2 === 1 ? -8 : "auto",
                  }}
                  animate={{ scale: [0, 1, 0], rotate: [0, 180, 360] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                >
                  <Sparkles className="w-4 h-4 text-gold" />
                </motion.div>
              ))}
            </motion.div>

            <motion.h1
              className="text-2xl sm:text-3xl font-bold text-gold font-[family-name:var(--font-orbitron)]"
              animate={{
                textShadow: [
                  "0 0 10px rgba(212,175,55,0.3)",
                  "0 0 20px rgba(212,175,55,0.5)",
                  "0 0 10px rgba(212,175,55,0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ROYAL FLUSH
            </motion.h1>
            <motion.p
              className="text-sm text-muted-foreground mt-1 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Star className="w-3 h-3 text-gold" />
              Premium Online Poker
              <Star className="w-3 h-3 text-gold" />
            </motion.p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? "signup" : "login"}
                initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 text-center flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5 text-gold" />
                  {isSignUp ? "יצירת חשבון חדש" : "ברוכים הבאים"}
                  <Zap className="w-5 h-5 text-gold" />
                </h2>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  className="relative"
                >
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="שם תצוגה"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pr-10 bg-muted/50 border-border/50 h-12 text-base focus:border-gold/50 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="relative group">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-gold transition-colors" />
              <Input
                type="email"
                placeholder="אימייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-10 bg-muted/50 border-border/50 h-12 text-base focus:border-gold/50 transition-all"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="relative group">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-gold transition-colors" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 pl-10 bg-muted/50 border-border/50 h-12 text-base focus:border-gold/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </motion.div>

            {!isSignUp && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-sm text-gold hover:underline hover:text-gold-light transition-colors"
                >
                  שכחת סיסמה?
                </button>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <Button
                type="submit"
                disabled={busy}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-gold to-gold-light text-charcoal hover:from-gold-light hover:to-gold text-base sm:text-lg font-semibold relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                {busy ? (
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <div className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" />
                    <span>מתחבר...</span>
                  </motion.div>
                ) : (
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    {isSignUp ? "הרשמה" : "כניסה למשחק"}
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card/80 text-muted-foreground">או התחבר עם</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="grid grid-cols-2 gap-3"
            >
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                className="h-12 border-border/50 hover:border-gold/50 hover:bg-gold/5 transition-all group"
                onClick={() => void run(async () => { await signInWithGoogle(); })}
              >
                <svg className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                className="h-12 border-border/50 hover:border-gold/50 hover:bg-gold/5 transition-all group"
                onClick={() => void run(async () => { await signInWithFacebook(); })}
              >
                <svg className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-6 text-center"
          >
            <p className="text-muted-foreground text-sm sm:text-base">
              {isSignUp ? "כבר יש לך חשבון?" : "עדיין אין לך חשבון?"}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-gold hover:underline hover:text-gold-light mr-2 font-medium transition-colors"
              >
                {isSignUp ? "התחבר" : "הרשם עכשיו"}
              </button>
            </p>
          </motion.div>
        </div>

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-center gap-4 sm:gap-6 mt-6 text-muted-foreground text-xs sm:text-sm"
        >
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span>SSL מאובטח</span>
          </div>
          <span className="text-border">|</span>
          <span>הגנת פרטיות 100%</span>
          <span className="text-border hidden sm:inline">|</span>
          <span className="hidden sm:inline">24/7 תמיכה</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
