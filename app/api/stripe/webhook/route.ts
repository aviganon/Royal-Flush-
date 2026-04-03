import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whSecret) {
    return NextResponse.json({ error: "חסר Stripe" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "חסר חתימה" }, { status: 400 });
  }

  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch {
    return NextResponse.json({ error: "חתימה לא תקינה" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.metadata?.firebaseUid;
    const chipsRaw = session.metadata?.chipsToGrant;
    const chips = chipsRaw ? parseInt(chipsRaw, 10) : 0;
    if (uid && Number.isFinite(chips) && chips > 0) {
      const db = getAdminDb();
      if (db) {
        const dedupeRef = db.collection("stripe_webhook_events").doc(event.id);
        try {
          await db.runTransaction(async (tx) => {
            const dup = await tx.get(dedupeRef);
            if (dup.exists) return;

            const userRef = db.collection("users").doc(uid);
            const snap = await tx.get(userRef);
            const prev = snap.exists ? ((snap.get("chips") as number) ?? 0) : 0;

            tx.set(dedupeRef, {
              processedAt: FieldValue.serverTimestamp(),
              checkoutSessionId: session.id,
              uid,
              chips,
            });

            tx.set(
              userRef,
              {
                chips: prev + chips,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );

            const txRef = userRef.collection("transactions").doc();
            tx.set(txRef, {
              type: "deposit",
              amount: chips,
              currency: "chips",
              stripeSessionId: session.id,
              stripeEventId: event.id,
              createdAt: FieldValue.serverTimestamp(),
            });
          });
        } catch (e) {
          console.error("[stripe webhook] transaction failed:", e);
          return NextResponse.json({ error: "עיבוד נכשל" }, { status: 500 });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
