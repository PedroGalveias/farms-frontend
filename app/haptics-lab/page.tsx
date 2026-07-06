import type { Metadata } from "next";
import HapticsLab from "./HapticsLab";

// Internal diagnostic page — deliberately unlinked, English-only and noindex.
// iOS haptics cannot be exercised in any emulator or test runner; this page
// lets a physical device tell us which technique actually produces the tick,
// so lib/haptics.ts can adopt the winner.
export const metadata: Metadata = {
  title: "Haptics lab",
  robots: { index: false, follow: false },
};

export default function HapticsLabPage() {
  return <HapticsLab />;
}
