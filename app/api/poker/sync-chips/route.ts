import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { isProductionDeploy } from "@/lib/env";

export const runtime = "nodejs";

/**
 * POST /api/poker/sync-chips
 * קריאה מהשרת (poker-server.ts) אחרי כל יד — מעדכן chips ב-Firestore.
 * מאומת דרך POKER_SERVER_SECRET.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-poker-secret");
  const expectedSecret = process.env.POKER_SERVER_SECRET;
  const prod = isProductionDeploy();

  if (prod) {
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }
  } else if (expectedSecret) {
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }
  } else {
    console.warn("[sync-chips] POKER_SERVER_SECRET לא מוגדר — מאשר ללא אימות (רק פיתוח)");
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firebase Admin לא מוגדר" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));

  const results = body.results as
    | { uid: string; chips: number; delta: number; won: boolean }[]
    | undefined;

  if (!Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ error: "אין נתונים לעדכון" }, { status: 400 });
  }

  const batch = db.batch();

  for (const r of results) {
    if (!r.uid || typeof r.chips !== "number" || typeof r.delta !== "number") continue;
    if (!Number.isFinite(r.chips) || !Number.isFinite(r.delta) || r.chips < 0) continue;

    const userRef = db.collection("users").doc(r.uid);
    batch.set(
      userRef,
      {
        chips: r.chips,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    if (r.delta !== 0) {
      const txRef = userRef.collection("transactions").doc();
      batch.set(txRef, {
        type: r.won ? "poker_win" : "poker_loss",
        amount: r.delta,
        roomId: body.roomId ?? "unknown",
        handNumber: body.handNumber ?? 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();

  return NextResponse.json({ ok: true, updated: results.length });
}
