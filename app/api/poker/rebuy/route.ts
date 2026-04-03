import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyIdTokenFromHeader, getAdminDb } from "@/lib/firebase/admin";
import { DEFAULT_CHIPS } from "@/lib/firebase/user-profile";

export const runtime = "nodejs";

const REBUY_AMOUNT = DEFAULT_CHIPS;
const MIN_CHIPS_FOR_REBUY = 100;

/**
 * POST /api/poker/rebuy
 * שחקן שנגמרו לו הצ'יפים מבקש rebuy.
 */
export async function POST(request: Request) {
  const session = await verifyIdTokenFromHeader(
    request.headers.get("authorization"),
  );
  if (!session) {
    return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firebase Admin לא מוגדר" },
      { status: 503 },
    );
  }

  const ref = db.collection("users").doc(session.uid);
  const snap = await ref.get();

  if (!snap.exists) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  const currentChips = (snap.data()?.chips as number) ?? 0;

  if (currentChips >= MIN_CHIPS_FOR_REBUY) {
    return NextResponse.json(
      {
        error: `יש לך ${currentChips} צ'יפים — rebuy זמין רק מתחת ל-${MIN_CHIPS_FOR_REBUY}`,
      },
      { status: 400 },
    );
  }

  await ref.set(
    {
      chips: FieldValue.increment(REBUY_AMOUNT),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const txRef = ref.collection("transactions").doc();
  await txRef.set({
    type: "rebuy",
    amount: REBUY_AMOUNT,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, added: REBUY_AMOUNT });
}
