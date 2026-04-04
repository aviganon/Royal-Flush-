import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, verifyIdTokenFromHeader } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/** GET /api/friends — חברים + בקשות נכנסות */
export async function GET(request: Request) {
  const session = await verifyIdTokenFromHeader(request.headers.get("authorization"));
  if (!session) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin לא מוגדר" }, { status: 503 });

  const [friendsSnap, requestsSnap] = await Promise.all([
    db.collection("users").doc(session.uid).collection("friends").get(),
    db.collection("users").doc(session.uid).collection("friendRequests").get(),
  ]);

  const friends = friendsSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  const requests = requestsSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));

  return NextResponse.json({ friends, requests });
}

/** POST /api/friends — שליחת בקשת חברות */
export async function POST(request: Request) {
  const session = await verifyIdTokenFromHeader(request.headers.get("authorization"));
  if (!session) return NextResponse.json({ error: "לא מאומת" }, { status: 401 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin לא מוגדר" }, { status: 503 });

  const { toUid } = (await request.json().catch(() => ({}))) as { toUid?: string };
  if (!toUid || toUid === session.uid) {
    return NextResponse.json({ error: "UID לא תקין" }, { status: 400 });
  }

  // בדוק שלא כבר חברים
  const alreadyFriend = await db
    .collection("users").doc(session.uid).collection("friends").doc(toUid).get();
  if (alreadyFriend.exists) {
    return NextResponse.json({ error: "כבר חברים" }, { status: 400 });
  }

  // בדוק שהיעד קיים
  const targetUser = await db.collection("users").doc(toUid).get();
  if (!targetUser.exists) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  // בדוק שהבקשה לא קיימת כבר
  const existingReq = await db
    .collection("users").doc(toUid).collection("friendRequests").doc(session.uid).get();
  if (existingReq.exists) {
    return NextResponse.json({ error: "הבקשה כבר נשלחה" }, { status: 400 });
  }

  // בדוק אם הצד השני כבר שלח לנו בקשה → אז מאשרים ישירות
  const reverseReq = await db
    .collection("users").doc(session.uid).collection("friendRequests").doc(toUid).get();
  if (reverseReq.exists) {
    return acceptFriendship(db, session.uid, toUid);
  }

  // שמור את פרטי השולח
  const myDoc = await db.collection("users").doc(session.uid).get();
  const myData = myDoc.data() ?? {};

  await db
    .collection("users").doc(toUid).collection("friendRequests").doc(session.uid)
    .set({
      displayName: (myData.displayName as string) ?? "שחקן",
      photoURL: (myData.photoURL as string) ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

  return NextResponse.json({ ok: true });
}

async function acceptFriendship(
  db: FirebaseFirestore.Firestore,
  uid: string,
  friendUid: string,
) {
  const [myDoc, friendDoc] = await Promise.all([
    db.collection("users").doc(uid).get(),
    db.collection("users").doc(friendUid).get(),
  ]);
  const my = myDoc.data() ?? {};
  const fr = friendDoc.data() ?? {};

  const batch = db.batch();

  batch.set(db.collection("users").doc(uid).collection("friends").doc(friendUid), {
    displayName: (fr.displayName as string) ?? "שחקן",
    photoURL: (fr.photoURL as string) ?? null,
    acceptedAt: FieldValue.serverTimestamp(),
  });

  batch.set(db.collection("users").doc(friendUid).collection("friends").doc(uid), {
    displayName: (my.displayName as string) ?? "שחקן",
    photoURL: (my.photoURL as string) ?? null,
    acceptedAt: FieldValue.serverTimestamp(),
  });

  batch.delete(db.collection("users").doc(uid).collection("friendRequests").doc(friendUid));
  batch.delete(db.collection("users").doc(friendUid).collection("friendRequests").doc(uid));

  await batch.commit();
  return NextResponse.json({ ok: true, accepted: true });
}
