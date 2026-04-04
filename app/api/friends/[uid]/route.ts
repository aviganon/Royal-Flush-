import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, verifyIdTokenFromHeader } from "@/lib/firebase/admin";

export const runtime = "nodejs";

type Params = { params: Promise<{ uid: string }> };

/** PATCH /api/friends/[uid] — action: accept | reject */
export async function PATCH(request: Request, { params }: Params) {
  const session = await verifyIdTokenFromHeader(request.headers.get("authorization"));
  if (!session) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });

  const { uid: fromUid } = await params;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin לא מוגדר" }, { status: 503 });

  const { action } = (await request.json().catch(() => ({}))) as { action?: string };

  const reqRef = db.collection("users").doc(session.uid).collection("friendRequests").doc(fromUid);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) return NextResponse.json({ error: "הבקשה לא נמצאה" }, { status: 404 });

  if (action === "reject") {
    await reqRef.delete();
    return NextResponse.json({ ok: true });
  }

  if (action !== "accept") return NextResponse.json({ error: "פעולה לא ידועה" }, { status: 400 });

  const [myDoc, friendDoc] = await Promise.all([
    db.collection("users").doc(session.uid).get(),
    db.collection("users").doc(fromUid).get(),
  ]);
  const my = myDoc.data() ?? {};
  const fr = friendDoc.data() ?? {};

  const batch = db.batch();

  batch.set(
    db.collection("users").doc(session.uid).collection("friends").doc(fromUid),
    {
      displayName: (fr.displayName as string) ?? "שחקן",
      photoURL: (fr.photoURL as string) ?? null,
      acceptedAt: FieldValue.serverTimestamp(),
    },
  );
  batch.set(
    db.collection("users").doc(fromUid).collection("friends").doc(session.uid),
    {
      displayName: (my.displayName as string) ?? "שחקן",
      photoURL: (my.photoURL as string) ?? null,
      acceptedAt: FieldValue.serverTimestamp(),
    },
  );
  batch.delete(reqRef);

  await batch.commit();
  return NextResponse.json({ ok: true });
}

/** DELETE /api/friends/[uid] — הסר חבר */
export async function DELETE(request: Request, { params }: Params) {
  const session = await verifyIdTokenFromHeader(request.headers.get("authorization"));
  if (!session) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });

  const { uid: friendUid } = await params;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin לא מוגדר" }, { status: 503 });

  const batch = db.batch();
  batch.delete(db.collection("users").doc(session.uid).collection("friends").doc(friendUid));
  batch.delete(db.collection("users").doc(friendUid).collection("friends").doc(session.uid));
  await batch.commit();

  return NextResponse.json({ ok: true });
}
