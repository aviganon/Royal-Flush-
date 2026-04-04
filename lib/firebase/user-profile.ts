import type { User } from "firebase/auth";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "./client-app";

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  chips: number;
  role?: "admin" | "user";
  createdAt?: unknown;
};

const DEFAULT_CHIPS = 10_000;

export function subscribeUserProfile(
  uid: string,
  onData: (p: UserProfile | null) => void,
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) {
    onData(null);
    return null;
  }
  const ref = doc(db, "users", uid);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      onData(null);
      return;
    }
    const d = snap.data();
    onData({
      uid,
      displayName: (d.displayName as string) ?? "שחקן",
      email: (d.email as string) ?? null,
      photoURL: (d.photoURL as string) ?? null,
      chips: typeof d.chips === "number" ? d.chips : DEFAULT_CHIPS,
      role: (d.role as "admin" | "user") ?? "user",
      createdAt: d.createdAt,
    });
  });
}

export function profileFromAuthUser(user: User): Partial<UserProfile> {
  return {
    uid: user.uid,
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "שחקן",
    email: user.email,
    photoURL: user.photoURL,
  };
}

export { DEFAULT_CHIPS, serverTimestamp };
