"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/command/events";

// The palette ships a sizeable search catalogue but starts closed. Loading it
// after the shared navigation has hydrated keeps browsing routes responsive;
// its own keyboard listener is attached as soon as the client-only chunk loads.
const CommandPalette = dynamic(() => import("./CommandPalette"), {
  ssr: false,
});

export default function LazyCommandPalette() {
  const [initiallyOpen, setInitiallyOpen] = useState(false);

  useEffect(() => {
    const openWhenReady = () => setInitiallyOpen(true);
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        openWhenReady();
      } else if (
        key === "/" &&
        !typing &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !document.querySelector("[data-slash-target]")
      ) {
        event.preventDefault();
        openWhenReady();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, openWhenReady);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, openWhenReady);
    };
  }, []);

  return <CommandPalette initiallyOpen={initiallyOpen} />;
}
