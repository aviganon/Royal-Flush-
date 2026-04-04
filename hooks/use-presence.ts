"use client";

import { useEffect } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client-app";

const HEARTBEAT_MS = 45_000;

/**
 * מעדכן presence/{uid} כל 45 שניות כשהמשתמש מחובר.
 * מחובר = lastSeen לפני פחות מ-3 דקות.
 */
export function usePresence(uid: string | undefined) {
  useEffect(() => {
    if (!uid) return;
    const db = getFirebaseDb();
    if (!db) return;

    const ref = doc(db, "presence", uid);

    const beat = () =>
      void setDoc(ref, { uid, lastSeen: serverTimestamp() }, { merge: true });

    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [uid]);
}

export const ONLINE_THRESHOLD_MS = 3 * 60_000;

export function isOnline(lastSeen: Date | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - lastSeen.getTime() < ONLINE_THRESHOLD_MS;
}
