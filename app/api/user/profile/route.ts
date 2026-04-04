import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminAuth, verifyIdTokenFromHeader } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/**
 * PATCH /api/user/profile
 * עדכון פרופיל המשתמש — שם תצוגה, אמוג'י, סיסמה
 */
export async function PATCH(request: Request) {
  const session = await verifyIdTokenFromHeader(request.headers.get("authorization"));
  if (!session) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });

  const db = getAdminDb();
  const auth = getAdminAuth();
  if (!db || !auth) return NextResponse.json({ error: "Firebase Admin לא מוגדר" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const { displayName, avatar, newPassword, currentPassword } = body as {
    displayName?: string;
    avatar?: string;
    newPassword?: string;
    currentPassword?: string;
  };

  void currentPassword; // אימות סיסמה נוכחית מתבצע בצד הלקוח

  const firestoreUpdate: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  const authUpdate: Record<string, unknown> = {};

  if (typeof displayName === "string" && displayName.trim()) {
    firestoreUpdate.displayName = displayName.trim();
    authUpdate.displayName = displayName.trim();
  }

  if (typeof avatar === "string" && avatar.trim()) {
    firestoreUpdate.avatar = avatar.trim();
  }

  if (typeof newPassword === "string" && newPassword.length >= 6) {
    authUpdate.password = newPassword;
  }

  await db.collection("users").doc(session.uid).set(firestoreUpdate, { merge: true });

  if (Object.keys(authUpdate).length > 0) {
    await auth.updateUser(session.uid, authUpdate);
  }

  return NextResponse.json({ ok: true });
}
