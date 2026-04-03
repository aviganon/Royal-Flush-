import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminAuth, verifyIdTokenFromHeader } from "@/lib/firebase/admin";
import { DEFAULT_CHIPS } from "@/lib/firebase/user-profile";

export const runtime = "nodejs";

async function verifyAdmin(request: Request): Promise<{ uid: string } | null> {
  const adminUid = process.env.ADMIN_UID;
  if (!adminUid) return null;
  const session = await verifyIdTokenFromHeader(request.headers.get("authorization"));
  if (!session) return null;
  if (session.uid !== adminUid) return null;
  return session;
}

/** GET /api/admin/users — רשימת כל המשתמשים מ-Firestore */
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin לא מוגדר" }, { status: 503 });

  const snap = await db.collection("users").orderBy("createdAt", "desc").limit(200).get();

  const users = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      uid: doc.id,
      displayName: (d.displayName as string) ?? "שחקן",
      email: (d.email as string) ?? null,
      photoURL: (d.photoURL as string) ?? null,
      chips: typeof d.chips === "number" ? d.chips : 0,
      banned: (d.banned as boolean) ?? false,
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
    };
  });

  return NextResponse.json({ users });
}

/** POST /api/admin/users — יצירת משתמש חדש */
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const db = getAdminDb();
  const auth = getAdminAuth();
  if (!db || !auth) return NextResponse.json({ error: "Firebase Admin לא מוגדר" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const { email, password, displayName, chips } = body as {
    email?: string;
    password?: string;
    displayName?: string;
    chips?: number;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "אימייל וסיסמה נדרשים" }, { status: 400 });
  }

  const initialChips = typeof chips === "number" && chips >= 0 ? chips : DEFAULT_CHIPS;

  const userRecord = await auth.createUser({
    email,
    password,
    displayName: displayName || email.split("@")[0],
  });

  await db.collection("users").doc(userRecord.uid).set({
    displayName: userRecord.displayName ?? displayName ?? email.split("@")[0],
    email,
    photoURL: null,
    chips: initialChips,
    banned: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, uid: userRecord.uid });
}
