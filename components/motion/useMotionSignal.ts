"use client";

import { useEffect, useState } from "react";
import { MOTION_EVENT } from "@/lib/motion";

/**
 * A dependency value that changes whenever the effective motion preference
 * might have changed — the OS media query flips or the in-app override is
 * toggled. Put it in an effect's dependency array so animation loops that
 * decide "animate or freeze" once at startup (GlassLight, the WebGL hero)
 * re-evaluate live instead of needing a reload.
 */
export function useMotionSignal(): number {
  const [signal, setSignal] = useState(0);

  useEffect(() => {
    const bump = () => setSignal((value) => value + 1);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", bump);
    window.addEventListener(MOTION_EVENT, bump);
    return () => {
      media.removeEventListener("change", bump);
      window.removeEventListener(MOTION_EVENT, bump);
    };
  }, []);

  return signal;
}
