"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  CreditCard,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { WalletTxRow } from "@/hooks/use-wallet-transactions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WalletDashboardProps {
  balance: number;
  getIdToken: () => Promise<string | null>;
  userEmail?: string | null;
  txRows: WalletTxRow[];
}

const STRIPE_PACKS_USD = [10, 25, 50, 100] as const;

function txLabel(type: string): string {
  switch (type) {
    case "deposit":
      return "הפקדה (Stripe)";
    case "rebuy":
      return "טעינת צ'יפים (rebuy)";
    case "poker_win":
      return "רווח משולחן";
    case "poker_loss":
      return "הפסד משולחן";
    default:
      return type;
  }
}

export function WalletDashboard({
  balance,
  getIdToken,
  userEmail,
  txRows,
}: WalletDashboardProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);

  const startStripeCheckout = async (amountUsd: number) => {
    setCheckoutLoading(amountUsd);
    try {
      const token = await getIdToken();
      if (!token) {
        toast.error("לא מחובר");
        return;
      }
      const r = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amountUsd, email: userEmail ?? undefined }),
      });
      const data = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) {
        toast.error(data.error ?? "תשלום לא זמין");
        return;
      }
      if (data.url) window.location.href = data.url;
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleWithdraw = () => {
    toast.message(
      "משיכה אינה אוטומטית באפליקציה. פנו לתמיכה עם פרטי החשבון וציינו סכום מבוקש.",
    );
  };

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground font-[family-name:var(--font-orbitron)] mb-2">
            ארנק <span className="text-gold animate-neon-pulse">דיגיטלי</span>
          </h1>
          <p className="text-muted-foreground">
            יתרת צ&apos;יפים ופעולות אמיתיות מ-Firestore
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative overflow-hidden rounded-3xl p-6 lg:p-8 glass-effect border border-gold/20">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald/10 rounded-full blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Wallet className="w-6 h-6 text-charcoal" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground">יתרה כוללת</p>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald" />
                      <span className="text-xs text-emerald">מאובטח</span>
                    </div>
                  </div>
                </div>

                <motion.div
                  className="text-4xl lg:text-6xl font-bold text-gold font-[family-name:var(--font-orbitron)] mb-8"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  {balance.toLocaleString()}{" "}
                  <span className="text-2xl lg:text-3xl text-muted-foreground font-normal">
                    צ&apos;יפים
                  </span>
                </motion.div>

                <div className="flex flex-wrap gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald text-foreground hover:bg-emerald-light">
                        <ArrowDownLeft className="w-4 h-4 ml-2" />
                        הפקדה
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-effect border-border">
                      <DialogHeader>
                        <DialogTitle className="text-gold font-[family-name:var(--font-orbitron)]">
                          הפקדת כספים
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 pt-4">
                        <p className="text-sm text-muted-foreground text-right">
                          תשלום מאובטח דרך Stripe (כרטיס אשראי). $1 = 100 צ&apos;יפים
                          במשחק.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {STRIPE_PACKS_USD.map((usd) => (
                            <Button
                              key={usd}
                              variant="outline"
                              className="h-14 border-gold/40 text-gold"
                              disabled={checkoutLoading !== null}
                              onClick={() => void startStripeCheckout(usd)}
                            >
                              {checkoutLoading === usd ? "…" : `$${usd}`}
                            </Button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <CreditCard className="w-5 h-5 text-gold" />
                          <span className="text-sm text-muted-foreground">
                            Stripe · כרטיס אשראי
                          </span>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-gold text-gold hover:bg-gold/10"
                      >
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                        משיכה
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-effect border-border">
                      <DialogHeader>
                        <DialogTitle className="text-gold font-[family-name:var(--font-orbitron)]">
                          משיכת כספים
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 pt-4">
                        <div className="p-4 rounded-xl bg-muted/50 border border-border">
                          <p className="text-sm text-muted-foreground mb-1">
                            יתרת צ&apos;יפים
                          </p>
                          <p className="text-2xl font-bold text-gold font-[family-name:var(--font-orbitron)]">
                            {balance.toLocaleString()} צ&apos;יפים
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground text-right">
                          משיכת כסף אמיתי דורשת תהליך עמידה ברגולציה. נשמח לעזור בתמיכה.
                        </p>
                        <Button
                          className="w-full bg-gold text-charcoal hover:bg-gold-light"
                          onClick={handleWithdraw}
                        >
                          הוראות משיכה
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-gold" />
              <h2 className="text-xl font-bold text-foreground">
                היסטוריית פעולות
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {txRows.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                אין תנועות עדיין. הפקדות Stripe, rebuy וסנכרון משולחן יופיעו כאן.
              </p>
            ) : (
              txRows.map((tx, index) => {
                const label = txLabel(tx.type);
                const isDeposit = tx.type === "deposit" || tx.type === "rebuy";
                const isLoss = tx.type === "poker_loss" || tx.amount < 0;
                const signed = tx.amount >= 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString();
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="p-4 rounded-xl glass-effect border border-border hover:border-gold/20 transition-all"
                    whileHover={{ x: -5 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isDeposit ? "bg-gold/20" : isLoss ? "bg-destructive/15" : "bg-muted"
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownLeft className="w-5 h-5 text-gold" />
                          ) : (
                            <History className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{label}</p>
                          <p className="text-sm text-muted-foreground">
                            {tx.dateLabel || "—"}
                          </p>
                        </div>
                      </div>
                      <motion.span
                        className={`text-lg font-bold font-[family-name:var(--font-orbitron)] ${
                          isLoss ? "text-destructive" : "text-emerald"
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                      >
                        {signed} צ&apos;יפים
                      </motion.span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
