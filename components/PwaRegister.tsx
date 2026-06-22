"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (production only — a SW in dev fights Turbopack's
 * HMR and serves stale assets). Renders nothing.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failure is non-fatal — the app works without offline.
      });
    };
    // Wait for load so SW registration doesn't compete with first paint.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
