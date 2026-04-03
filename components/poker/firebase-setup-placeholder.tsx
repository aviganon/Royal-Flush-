"use client";

import { motion } from "framer-motion";
import { Spade } from "lucide-react";

export function FirebaseSetupPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full glass-effect rounded-3xl border border-gold/20 p-8 text-center space-y-4"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl gold-gradient flex items-center justify-center">
          <Spade className="w-8 h-8 text-charcoal" />
        </div>
        <h1 className="text-2xl font-bold text-gold font-[family-name:var(--font-orbitron)]">
          Firebase לא מוגדר
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed text-right">
          פרויקט Firebase צריך להיות מחובר: צור קובץ{" "}
          <code className="text-gold">.env.local</code> לפי{" "}
          <code className="text-gold">.env.local.example</code> (כולל{" "}
          <code className="text-gold">FIREBASE_SERVICE_ACCOUNT_JSON</code>). בפרויקט{" "}
          <code className="text-gold">royal-flush-32cbb</code> — הגדרות:{" "}
          <a
            href="https://console.firebase.google.com/project/royal-flush-32cbb/settings/general"
            className="text-gold underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Firebase Console
          </a>
          . אחר כך: <code className="text-gold">npm run firebase:deploy-rules</code>
        </p>
        <p className="text-xs text-muted-foreground text-right">
          ל-Stripe: מפתח סודי, Webhook ל-<code className="text-gold">/api/stripe/webhook</code>
          , ו-<code className="text-gold">NEXT_PUBLIC_APP_URL</code>.
        </p>
      </motion.div>
    </div>
  );
}
