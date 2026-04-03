import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyIdTokenFromHeader, getAdminDb } from "@/lib/firebase/admin";
import { DEFAULT_CHIPS } from "@/lib/firebase/user-profile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await verifyIdTokenFromHeader(request.headers.get("authorization"));
  if (!session) {
    return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "שרת ללא Firebase Admin — הגדר FIREBASE_SERVICE_ACCOUNT_JSON" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const displayName = typeof body.displayName === "string" ? body.displayName : undefined;
  const email = typeof body.email === "string" ? body.email : undefined;
  const photoURL = typeof body.photoURL === "string" ? body.photoURL : undefined;

  const ref = db.collection("users").doc(session.uid);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      displayName: displayName ?? "שחקן",
      email: email ?? null,
      photoURL: photoURL ?? null,
      chips: DEFAULT_CHIPS,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await ref.set(
      {
        displayName: displayName ?? snap.get("displayName") ?? "שחקן",
        email: email ?? snap.get("email") ?? null,
        photoURL: photoURL ?? snap.get("photoURL") ?? null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  return NextResponse.json({ ok: true });
}
