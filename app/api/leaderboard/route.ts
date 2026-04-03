import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/**
 * GET /api/leaderboard
 * מחזיר את 20 השחקנים המובילים לפי chips.
 */
export async function GET() {
  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firebase Admin לא מוגדר" },
      { status: 503 },
    );
  }

  const snap = await db
    .collection("users")
    .orderBy("chips", "desc")
    .limit(20)
    .get();

  const players = snap.docs.map((doc, index) => {
    const d = doc.data();
    return {
      rank: index + 1,
      uid: doc.id,
      displayName: (d.displayName as string) ?? "שחקן",
      photoURL: (d.photoURL as string) ?? null,
      chips: typeof d.chips === "number" ? d.chips : 0,
    };
  });

  return NextResponse.json({ players });
}
