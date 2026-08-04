"use client";

import dynamic from "next/dynamic";

// Chrome the first paint does not need.
//
// Each of these was imported statically by the root layout, so it hydrated on
// every route — main-thread work before the page is interactive, for code that
// draws nothing until the user scrolls, goes offline, or presses a key.
//
// `ssr: false` has to live in a Client Component (the root layout is a Server
// Component), which is why this wrapper exists — same pattern as
// LazyAmbientBackdrop.
//
// The bar for being deferred here is: **renders nothing at rest**. Anything
// that can put pixels on the screen unprompted stays eager in the layout,
// because loading it late makes it pop in after first paint. Deferring
// MotionPrompt and BackToTop was measurable as a visual regression on the
// quick-search snapshot; they are deliberately not in this file. So are:
//   CustomCursor — `cursor: none` hangs off the class it applies, so loading it
//     late shows the system cursor first, the exact flash #180 fixed.
//   SkipLink — must be the first focusable element for keyboard users.

/** Renders null. Sets pointer-driven CSS variables, all of which have
 *  fallbacks in globals.css (`var(--glass-glint, 0)`), so the resting
 *  appearance is identical without it. */
const GlassLight = dynamic(() => import("@/components/motion/GlassLight"), {
  ssr: false,
});

/** Renders null unless there is an install prompt or a waiting worker. */
const PwaRegister = dynamic(() => import("@/components/PwaRegister"), {
  ssr: false,
});

/** `return null` while online. */
const OfflineChip = dynamic(() => import("@/components/OfflineChip"), {
  ssr: false,
});

/** Reporting only; renders null. */
const WebVitals = dynamic(() => import("@/components/WebVitals"), {
  ssr: false,
});

/** A closed <dialog> — no pixels until ⌘/ opens it. */
const KeyboardShortcuts = dynamic(
  () => import("@/components/command/KeyboardShortcuts"),
  { ssr: false },
);

export default function DeferredChrome() {
  return (
    <>
      <GlassLight />
      <PwaRegister />
      <OfflineChip />
      <WebVitals />
      <KeyboardShortcuts />
    </>
  );
}
