"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client-app";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  subscribeUserProfile,
  profileFromAuthUser,
  type UserProfile,
} from "@/lib/firebase/user-profile";

type FirebaseAuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
  getIdToken: () => Promise<string | null>;
  logout: () => Promise<void>;
  refreshBootstrap: () => Promise<void>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(
  null,
);

async function callBootstrap(user: User) {
  const token = await user.getIdToken();
  const p = profileFromAuthUser(user);
  await fetch("/api/auth/bootstrap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      displayName: p.displayName,
      email: p.email,
      photoURL: p.photoURL,
    }),
  });
}

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshBootstrap = useCallback(async () => {
    const auth = getFirebaseAuth();
    const u = auth?.currentUser;
    if (!u) return;
    await callBootstrap(u);
  }, []);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          await callBootstrap(u);
        } catch {
          /* bootstrap יכשל בלי Admin — הפרופיל יתעדכן כשיהיה */
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [configured]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const unsub = subscribeUserProfile(user.uid, (p) => {
      if (p) setProfile(p);
      else {
        const base = profileFromAuthUser(user);
        setProfile({
          uid: base.uid!,
          displayName: base.displayName ?? "שחקן",
          email: base.email ?? null,
          photoURL: base.photoURL ?? null,
          chips: 0,
        });
      }
    });
    return () => {
      unsub?.();
    };
  }, [user]);

  const getIdToken = useCallback(async () => {
    const auth = getFirebaseAuth();
    const u = auth?.currentUser;
    if (!u) return null;
    return u.getIdToken();
  }, []);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      configured,
      loading,
      user,
      profile,
      getIdToken,
      logout,
      refreshBootstrap,
    }),
    [configured, loading, user, profile, getIdToken, logout, refreshBootstrap],
  );

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) {
    throw new Error("useFirebaseAuth חייב להיות בתוך FirebaseAuthProvider");
  }
  return ctx;
}
