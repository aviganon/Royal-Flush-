/**
 * כתובת Socket.IO — מיישרת localhost מול 127.0.0.1 כמו דף הדפדפן,
 * כדי שלא ייכשל החיבור כשהאפליקציה על 127.0.0.1 וה-env אומר localhost.
 */
export function getPokerSocketUrl(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_POKER_SOCKET_URL) ||
    "http://localhost:4000";
  const trimmed = raw.replace(/\/$/, "");
  if (typeof window === "undefined") return trimmed;
  try {
    const u = new URL(trimmed);
    const h = window.location.hostname;
    if (
      (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
      (h === "localhost" || h === "127.0.0.1")
    ) {
      u.hostname = h;
    }
    return u.toString();
  } catch {
    return trimmed;
  }
}
