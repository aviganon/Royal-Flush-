/**
 * קריאה ל-Next.js API אחרי כל יד — מעדכן chips ב-Firestore.
 * רץ בתהליך של שרת הפוקר (server/poker-server.ts).
 */

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
const SECRET = process.env.POKER_SERVER_SECRET || "";
const IS_PROD = process.env.NODE_ENV === "production";

export interface ChipResult {
  uid: string;
  chips: number;
  delta: number;
  won: boolean;
}

export async function syncChipsToFirestore(
  roomId: string,
  handNumber: number,
  results: ChipResult[],
): Promise<void> {
  const valid = results.filter(
    (r) => r.uid && r.uid.length > 10 && !r.uid.startsWith("guest"),
  );
  if (valid.length === 0) return;

  if (IS_PROD && !SECRET) {
    console.error("[chip-sync] חסר POKER_SERVER_SECRET בייצור — מדלג על סנכרון");
    return;
  }

  try {
    const res = await fetch(`${APP_URL}/api/poker/sync-chips`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-poker-secret": SECRET,
      },
      body: JSON.stringify({ roomId, handNumber, results: valid }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[chip-sync] HTTP ${res.status}: ${text}`);
    } else {
      const data = (await res.json()) as { updated?: number };
      console.log(
        `[chip-sync] יד #${handNumber} בחדר "${roomId}" — עודכנו ${data.updated ?? 0} שחקנים`,
      );
    }
  } catch (err) {
    console.error("[chip-sync] שגיאת רשת:", (err as Error).message);
  }
}
