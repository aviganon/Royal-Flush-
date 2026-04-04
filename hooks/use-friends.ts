"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { toast } from "sonner";
import { getFirebaseDb } from "@/lib/firebase/client-app";
import { isOnline } from "./use-presence";

export interface FriendEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  lastSeen: Date | null;
  isOnline: boolean;
}

export interface FriendRequest {
  uid: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Date | null;
}

export function useFriends(uid: string | undefined, getIdToken: () => Promise<string | null>) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);

  // Track online state per friend for change detection (toast)
  const prevOnlineRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!uid) return;
    const db = getFirebaseDb();
    if (!db) return;

    const presenceUnsubs: Record<string, Unsubscribe> = {};
    const friendDataMap = new Map<string, Omit<FriendEntry, "lastSeen" | "isOnline">>();
    const presenceMap = new Map<string, Date | null>();

    const rebuild = () => {
      const list: FriendEntry[] = [];
      for (const [fuid, base] of friendDataMap.entries()) {
        const ls = presenceMap.get(fuid) ?? null;
        const online = isOnline(ls);
        list.push({ ...base, lastSeen: ls, isOnline: online });

        // Toast when friend comes online
        const wasOnline = prevOnlineRef.current[fuid];
        if (online && !wasOnline && wasOnline !== undefined) {
          toast(`🟢 ${base.displayName} מחובר/ת!`, { duration: 4000 });
        }
        prevOnlineRef.current[fuid] = online;
      }
      list.sort((a, b) => {
        if (a.isOnline === b.isOnline) return a.displayName.localeCompare(b.displayName);
        return a.isOnline ? -1 : 1;
      });
      setFriends(list);
      setOnlineCount(list.filter((f) => f.isOnline).length);
    };

    const subPresence = (fuid: string) => {
      if (presenceUnsubs[fuid]) return;
      presenceUnsubs[fuid] = onSnapshot(doc(db, "presence", fuid), (snap) => {
        const d = snap.data();
        const ls = d?.lastSeen?.toDate?.() ?? null;
        presenceMap.set(fuid, ls);
        rebuild();
      });
    };

    // Subscribe to friends list
    const unsubFriends = onSnapshot(
      collection(db, "users", uid, "friends"),
      (snap) => {
        const removed = new Set(friendDataMap.keys());
        snap.docs.forEach((d) => {
          removed.delete(d.id);
          friendDataMap.set(d.id, {
            uid: d.id,
            displayName: (d.data().displayName as string) ?? "שחקן",
            photoURL: (d.data().photoURL as string) ?? null,
          });
          subPresence(d.id);
        });
        removed.forEach((fuid) => {
          friendDataMap.delete(fuid);
          presenceMap.delete(fuid);
          presenceUnsubs[fuid]?.();
          delete presenceUnsubs[fuid];
          delete prevOnlineRef.current[fuid];
        });
        rebuild();
      },
    );

    // Subscribe to incoming friend requests
    const unsubReqs = onSnapshot(
      collection(db, "users", uid, "friendRequests"),
      (snap) => {
        const reqs = snap.docs.map((d) => ({
          uid: d.id,
          displayName: (d.data().displayName as string) ?? "שחקן",
          photoURL: (d.data().photoURL as string) ?? null,
          createdAt: d.data().createdAt?.toDate?.() ?? null,
        }));
        setRequests(reqs);
        setRequestCount(reqs.length);
        if (reqs.length > 0) {
          const prev = requestCount;
          if (reqs.length > prev && prev > 0) {
            toast(`🤝 ${reqs[reqs.length - 1]!.displayName} שלח/ה בקשת חברות!`, {
              duration: 5000,
            });
          }
        }
      },
    );

    return () => {
      unsubFriends();
      unsubReqs();
      Object.values(presenceUnsubs).forEach((u) => u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const sendRequest = useCallback(
    async (toUid: string) => {
      const token = await getIdToken();
      if (!token) return { ok: false, error: "לא מאומת" };
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toUid }),
      });
      return res.json() as Promise<{ ok?: boolean; error?: string; accepted?: boolean }>;
    },
    [getIdToken],
  );

  const respondRequest = useCallback(
    async (fromUid: string, action: "accept" | "reject") => {
      const token = await getIdToken();
      if (!token) return { ok: false };
      const res = await fetch(`/api/friends/${fromUid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      return res.json() as Promise<{ ok?: boolean }>;
    },
    [getIdToken],
  );

  const removeFriend = useCallback(
    async (friendUid: string) => {
      const token = await getIdToken();
      if (!token) return { ok: false };
      const res = await fetch(`/api/friends/${friendUid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json() as Promise<{ ok?: boolean }>;
    },
    [getIdToken],
  );

  const searchUsers = useCallback(
    async (q: string) => {
      if (q.length < 2) return [];
      const token = await getIdToken();
      if (!token) return [];
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { users?: SearchResult[] };
      return data.users ?? [];
    },
    [getIdToken],
  );

  return { friends, requests, requestCount, onlineCount, sendRequest, respondRequest, removeFriend, searchUsers };
}

export interface SearchResult {
  uid: string;
  displayName: string;
  photoURL: string | null;
  chips: number;
}
