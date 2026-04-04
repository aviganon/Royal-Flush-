import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminAuth, verifyIdTokenFromHeader } from "@/lib/firebase/admin";

export const runtime = "nodejs";

async function verifyAdmin(request: Request): Promise<{ uid: string } | null> {
  const session = await verifyIdTokenFromHeader(request.headers.get("authorization"));
  if (!session) return null;

  const adminUid = process.env.ADMIN_UID;
  if (adminUid && session.uid === adminUid) return session;

  const db = getAdminDb();
  if (db) {
    const snap = await db.collection("users").doc(session.uid).get();
    if (snap.exists && snap.data()?.role === "admin") return session;
  }
  return null;
}

/** PATCH /api/admin/users/[uid] — עדכון משתמש */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { uid } = await params;
  const db = getAdminDb();
  const auth = getAdminAuth();
  if (!db || !auth) return NextResponse.json({ error: "Firebase Admin לא מוגדר" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const { displayName, chips, chipsAdjust, banned, resetPassword } = body as {
    displayName?: string;
    chips?: number;
    chipsAdjust?: number;
    banned?: boolean;
    resetPassword?: string;
  };

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof displayName === "string") update.displayName = displayName;
  if (typeof chips === "number" && chips >= 0) update.chips = chips;
  if (typeof chipsAdjust === "number") update.chips = FieldValue.increment(chipsAdjust);
  if (typeof banned === "boolean") update.banned = banned;

  await db.collection("users").doc(uid).set(update, { merge: true });

  if (typeof banned === "boolean") {
    await auth.updateUser(uid, { disabled: banned });
  }

  if (typeof resetPassword === "string" && resetPassword.length >= 6) {
    await auth.updateUser(uid, { password: resetPassword });
  }

  if (typeof displayName === "string") {
    await auth.updateUser(uid, { displayName });
  }

  const txRef = db.collection("users").doc(uid).collection("transactions").doc();
  if (typeof chips === "number" || typeof chipsAdjust === "number") {
    const snap = await db.collection("users").doc(uid).get();
    const prevChips = typeof snap.data()?.chips === "number" ? (snap.data()!.chips as number) : 0;
    const finalChips = typeof chips === "number" ? chips : prevChips + (chipsAdjust ?? 0);
    await txRef.set({
      type: "admin_adjustment",
      amount: typeof chipsAdjust === "number" ? chipsAdjust : finalChips - prevChips,
      adminUid: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/users/[uid] — מחיקת משתמש */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { uid } = await params;

  if (uid === admin.uid) {
    return NextResponse.json({ error: "לא ניתן למחוק את הבעלים" }, { status: 400 });
  }

  const db = getAdminDb();
  const auth = getAdminAuth();
  if (!db || !auth) return NextResponse.json({ error: "Firebase Admin לא מוגדר" }, { status: 503 });

  const txSnap = await db.collection("users").doc(uid).collection("transactions").limit(200).get();
  const batch = db.batch();
  txSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(db.collection("users").doc(uid));
  await batch.commit();

  await auth.deleteUser(uid);

  return NextResponse.json({ ok: true });
}
