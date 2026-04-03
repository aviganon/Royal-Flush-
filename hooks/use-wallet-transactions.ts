"use client";

import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client-app";

export type WalletTxRow = {
  id: string;
  type: string;
  amount: number;
  dateLabel: string;
};

export function useWalletTransactions(uid: string | undefined) {
  const [rows, setRows] = useState<WalletTxRow[]>([]);

  useEffect(() => {
    if (!uid) {
      setRows([]);
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setRows([]);
      return;
    }
    const q = query(
      collection(db, "users", uid, "transactions"),
      orderBy("createdAt", "desc"),
      limit(40),
    );
    return onSnapshot(
      q,
      (snap) => {
        setRows(
          snap.docs.map((d) => {
            const x = d.data();
            const ts = x.createdAt;
            let dateLabel = "";
            if (ts && typeof ts.toDate === "function") {
              dateLabel = ts.toDate().toLocaleString("he-IL");
            }
            return {
              id: d.id,
              type: (x.type as string) ?? "unknown",
              amount: typeof x.amount === "number" ? x.amount : 0,
              dateLabel,
            };
          }),
        );
      },
      () => setRows([]),
    );
  }, [uid]);

  return rows;
}
