import { NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyIdTokenFromHeader } from "@/lib/firebase/admin";
import { getAppBaseUrl } from "@/lib/site";

export const runtime = "nodejs";

const PACKS_USD = [10, 25, 50, 100] as const;

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe לא מוגדר (STRIPE_SECRET_KEY)" },
      { status: 503 },
    );
  }

  const session = await verifyIdTokenFromHeader(request.headers.get("authorization"));
  if (!session) {
    return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const amountUsd = Number(body.amountUsd);
  if (!PACKS_USD.includes(amountUsd as (typeof PACKS_USD)[number])) {
    return NextResponse.json(
      { error: "סכום לא חוקי", allowed: PACKS_USD },
      { status: 400 },
    );
  }

  const appUrl = getAppBaseUrl();
  const stripe = new Stripe(secret);

  /** צ'יפים במשחק: $1 = 100 צ'יפים (ניתן לשנות) */
  const chipsToGrant = amountUsd * 100;

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: typeof body.email === "string" ? body.email : undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Royal Flush — ${chipsToGrant.toLocaleString()} צ'יפים`,
            description: "יתרה למשחק (לא מהווה הימור עם כסף אמיתי מחוץ למסגרת החוק המקומית)",
          },
          unit_amount: amountUsd * 100,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/?wallet=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/?wallet=cancel`,
    metadata: {
      firebaseUid: session.uid,
      chipsToGrant: String(chipsToGrant),
      amountUsd: String(amountUsd),
    },
  });

  return NextResponse.json({ url: checkout.url });
}
