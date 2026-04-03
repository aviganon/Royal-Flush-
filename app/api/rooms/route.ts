import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/rooms
 * מחזיר סטטוס חי של כל החדרים מהשרת הפוקר.
 */
export async function GET() {
  const socketUrl =
    process.env.NEXT_PUBLIC_POKER_SOCKET_URL?.replace(/\/$/, "") ||
    "http://localhost:4000";

  try {
    const res = await fetch(`${socketUrl}/rooms`, {
      next: { revalidate: 3 },
    });

    if (!res.ok) {
      return NextResponse.json({ rooms: [] });
    }

    const data = (await res.json()) as { rooms: unknown[] };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ rooms: [] });
  }
}
