/**
 * כתובת האתר בייצור (תיעוד + דוגמה ל-.env).
 * בפועל ב-Vercel עדיף להסתמך על VERCEL_URL (נקבע אוטומטית) או על NEXT_PUBLIC_APP_URL.
 */
export const PRODUCTION_SITE_URL = "https://royal-flush-poker.vercel.app";

/**
 * בסיס URL לאפליקציה: ב-Vercel משתמש ב-VERCEL_URL; אחרת NEXT_PUBLIC_APP_URL; מקומי — localhost.
 */
export function getAppBaseUrl(): string {
  const v = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (v) {
    return v.startsWith("http") ? v : `https://${v}`;
  }
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (app) return app;
  return "http://localhost:3000";
}
