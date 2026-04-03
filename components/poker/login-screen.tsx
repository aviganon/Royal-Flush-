"use client";

import { motion } from "framer-motion";
import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import {
  signInWithGoogle,
  signInWithFacebook,
  signUpWithEmail,
  signInWithEmail,
  sendResetEmail,
} from "@/lib/firebase/auth-actions";

export function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

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

  const FloatingCard = ({
    suit,
    value,
    delay,
    x,
    y,
  }: {
    suit: "spades" | "hearts" | "diamonds" | "clubs";
    value: string;
    delay: number;
    x: string;
    y: string;
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
        className="absolute w-16 h-24 rounded-xl bg-white shadow-2xl flex flex-col items-center justify-between p-2 cursor-pointer"
        style={{ left: x, top: y }}
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: 1,
          rotate: 0,
          y: [0, -20, 0],
        }}
        transition={{
          delay,
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{ scale: 1.2, opacity: 1, zIndex: 10 }}
      >
        <span
          className={`text-sm font-bold ${isRed ? "text-red-500" : "text-gray-900"}`}
        >
          {value}
        </span>
        <SuitIcon
          className={`w-6 h-6 ${isRed ? "text-red-500" : "text-gray-900"}`}
        />
        <span
          className={`text-sm font-bold rotate-180 ${isRed ? "text-red-500" : "text-gray-900"}`}
        >
          {value}
        </span>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal" />

      <div className="absolute inset-0 pointer-events-none">
        <FloatingCard suit="spades" value="A" delay={0} x="10%" y="15%" />
        <FloatingCard suit="hearts" value="K" delay={0.5} x="80%" y="10%" />
        <FloatingCard suit="diamonds" value="Q" delay={1} x="5%" y="60%" />
        <FloatingCard suit="clubs" value="J" delay={1.5} x="85%" y="55%" />
        <FloatingCard suit="hearts" value="10" delay={2} x="20%" y="80%" />
        <FloatingCard suit="spades" value="9" delay={2.5} x="75%" y="80%" />
      </div>

      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/10 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative w-full max-w-md"
      >
        <div className="glass-effect rounded-3xl p-8 border border-gold/20 shadow-2xl">
          <motion.div
            className="flex flex-col items-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <motion.div
              className="w-20 h-20 rounded-2xl gold-gradient flex items-center justify-center mb-4 shadow-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Spade className="w-10 h-10 text-charcoal" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gold font-[family-name:var(--font-orbitron)]">
              ROYAL FLUSH
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              התחברות מאובטחת — Google, Facebook או אימייל
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
              {isSignUp ? "יצירת חשבון" : "ברוכים הבאים"}
            </h2>

            {isSignUp && (
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="שם תצוגה"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-10 bg-muted border-border h-12 text-base"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="אימייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-10 bg-muted border-border h-12 text-base"
              />
            </div>

            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 pl-10 bg-muted border-border h-12 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-sm text-gold hover:underline"
                >
                  שכחת סיסמה?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="w-full h-12 bg-gold text-charcoal hover:bg-gold-light text-lg font-semibold"
            >
              {isSignUp ? "הרשמה" : "כניסה"}
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">או</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                className="h-12 border-border hover:border-gold/50"
                onClick={() =>
                  run(async () => {
                    await signInWithGoogle();
                  })
                }
              >
                <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                className="h-12 border-border hover:border-gold/50"
                onClick={() =>
                  run(async () => {
                    await signInWithFacebook();
                  })
                }
              >
                <svg
                  className="w-5 h-5 ml-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isSignUp ? "כבר יש לך חשבון?" : "עדיין אין לך חשבון?"}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-gold hover:underline mr-2 font-medium"
              >
                {isSignUp ? "התחבר" : "הרשם עכשיו"}
              </button>
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-4 mt-6 text-muted-foreground text-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span>Firebase Auth</span>
          </div>
          <span>•</span>
          <span>Stripe להפקדות</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
