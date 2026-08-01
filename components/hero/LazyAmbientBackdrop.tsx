"use client";

import dynamic from "next/dynamic";

// The WebGL shader is decorative and only activates on capable desktop
// devices. Keeping it out of the shared layout chunk avoids parsing its shader
// source on every phone visit, where the CSS ambience is the intended fallback.
const AmbientBackdrop = dynamic(() => import("./AmbientBackdrop"), {
  ssr: false,
});

export default function LazyAmbientBackdrop() {
  return <AmbientBackdrop />;
}
