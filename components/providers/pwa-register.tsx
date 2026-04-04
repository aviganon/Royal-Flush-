"use client";

import { useEffect } from "react";

/** Registers the service worker silently. Must be rendered inside a Client component tree. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[PWA] Service worker registered:", reg.scope);
      })
      .catch((err) => {
        console.warn("[PWA] SW registration failed:", err);
      });
  }, []);

  return null;
}
