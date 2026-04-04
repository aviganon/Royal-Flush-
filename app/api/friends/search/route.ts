import { NextResponse } from "next/server";
import { getAdminDb, verifyIdTokenFromHeader } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/** GET /api/friends/search?q=... — חיפוש משתמשים לפי שם */
export async function GET(request: Request) {
  const session = await verifyIdTokenFromHeader(request.headers.get("authorization"));
  if (!session) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ users: [] });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin לא מוגדר" }, { status: 503 });

  // prefix search על displayName (case-sensitive)
  const snap = await db
    .collection("users")
    .where("displayName", ">=", q)
    .where("displayName", "<=", q + "\uf8ff")
    .limit(15)
    .get();

  const users = snap.docs
    .filter((d) => d.id !== session.uid)
    .map((d) => ({
      uid: d.id,
      displayName: (d.data().displayName as string) ?? "שחקן",
      photoURL: (d.data().photoURL as string) ?? null,
      chips: typeof d.data().chips === "number" ? (d.data().chips as number) : 0,
    }));

  return NextResponse.json({ users });
}
