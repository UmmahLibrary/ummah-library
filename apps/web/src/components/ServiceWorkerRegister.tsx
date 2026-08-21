"use client";

import { useEffect } from "react";

/** Registers the offline service worker once, after load. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // In development the cache-first SW serves stale CSS/fonts, so edits (e.g. a
    // font swap) appear not to take effect. Never run it in dev — instead actively
    // unregister any existing SW and drop its caches so dev always serves fresh.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => void r.unregister()));
      // Only drop the service worker's own caches (sw.js's `ul-static-*`/`ul-pages-*`) —
      // not unrelated Cache API users like the offline audio downloads (`ul-audio-*`),
      // which would otherwise get silently wiped on every dev reload.
      if (typeof caches !== "undefined") {
        void caches
          .keys()
          .then((keys) =>
            keys
              .filter((k) => k.startsWith("ul-static-") || k.startsWith("ul-pages-"))
              .forEach((k) => void caches.delete(k)),
          );
      }
      return;
    }
    const register = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration failed — app still works online */
      });
    };
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
