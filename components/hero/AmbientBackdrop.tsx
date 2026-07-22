"use client";

import { useEffect, useRef, useState } from "react";
import { hasFinePointer } from "@/lib/platform";
import { prefersReducedMotion } from "@/lib/motion";
import { useMotionSignal } from "@/components/motion/useMotionSignal";

/**
 * The living backdrop — one quiet, sitewide WebGL layer that replaces BOTH the
 * static CSS ambient orbs (body::after) and the standalone WebGL hero: the
 * same five colour orbs, breathing slowly, with faint caustic filaments
 * drifting through them. Every frosted pane above refracts it, so the whole
 * UI reads as liquid glass without any per-pane cost.
 *
 * Performance budget (the crash hunt's lessons, applied):
 * - ONE WebGL context for the whole site, quarter-resolution backing store
 *   (it's ambience — soft IS the point) scaled up by the compositor;
 * - 30fps clock, paused while the tab is hidden;
 * - desktop fine-pointer only: touch devices keep the zero-cost CSS orbs;
 * - honours prefers-reduced-motion / the force-motion override (live), and
 *   prefers-reduced-transparency;
 * - if WebGL is unavailable (e.g. Brave shields), the CSS orbs simply stay.
 *
 * While active it sets `html.has-ambient`, which hides the CSS orbs; the
 * canvas mirrors body::after's geometry (overdrawn inset, --orb-y parallax
 * transform) so GlassLight's scroll parallax keeps working untouched.
 */

// Backing-store scale (design §3B). Quarter-res in each axis (1/16 of the
// fragments) is right for a phone, but the smooth radial falloff posterises
// into visible concentric rings when scaled up on a 27" display. Widen the
// backing store on large viewports — 0.34 ≈ 1.85× the fragments of 0.25, still
// a fraction of native ("soft is the point"), the fragment count stays bounded.
// Read at resize time (not module load — SSR has no window) so moving the
// window to a bigger display re-tiers. The §3A shader dither remains the
// primary de-banding fix; this is the belt-and-suspenders for wide displays.
const RESOLUTION_SCALE_BASE = 0.25;
const RESOLUTION_SCALE_WIDE = 0.34;
const WIDE_VIEWPORT_PX = 1600;
const resolutionScale = () =>
  typeof window !== "undefined" && window.innerWidth > WIDE_VIEWPORT_PX
    ? RESOLUTION_SCALE_WIDE
    : RESOLUTION_SCALE_BASE;
const FRAME_MS = 1000 / 30;

// Device tiering (§8): read the coarse capability signals ONCE. Low-end gets
// the CSS fallback only (never mounts the shader); mid/high run it. This is the
// static half of the safety net — the adaptive frame-time sampler in the loop
// is the dynamic half that catches a device the static check misjudged.
type DeviceTier = "low" | "mid" | "high";
function deviceTier(): DeviceTier {
  if (typeof navigator === "undefined") return "mid";
  const cores = navigator.hardwareConcurrency ?? 8;
  // deviceMemory is Chromium-only; treat "unknown" as adequate.
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (cores <= 3 || (mem != null && mem <= 2)) return "low";
  if (cores >= 8 && window.innerWidth > WIDE_VIEWPORT_PX) return "high";
  return "mid";
}

const VERT = `
  attribute vec2 p;
  void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`;

// The five orbs match app/globals.css body::after (positions, colours, and
// light/dark intensities) so switching between CSS fallback and WebGL is
// seamless; only the slow breathing + caustics are new.
const FRAG = `
  precision mediump float;
  uniform vec2 u_res;
  uniform float u_time;
  uniform float u_dark;
  // §8 uniforms — updates on the existing 30fps loop, no new draws.
  // u_pointer: smoothed cursor in aspect-true px space (x in 0..w, y in 0..1),
  //   centred at (0.5*w, 0.5) when idle. The orbs lean gently toward it.
  // u_scroll: decaying scroll velocity 0..1 — brightens/quickens the caustics
  //   so the light "breathes" as the page moves.
  uniform vec2 u_pointer;
  uniform float u_scroll;
  // u_quality: adaptive-quality knob 0..1 (1 = full). The frame-time sampler
  // thins the caustics first (cheapest visual to lose) before the JS side drops
  // resolution, so a struggling GPU degrades gracefully instead of stuttering.
  uniform float u_quality;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    float a=hash(i), b=hash(i+vec2(1.0,0.0)), c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
    vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }

  // Soft radial falloff like a CSS radial-gradient (fade out ~64%).
  float orb(vec2 px, vec2 c, float r){
    return smoothstep(0.64, 0.0, distance(px, c) / r);
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / u_res;      // 0..1, y up
    vec2 px = vec2(uv.x * (u_res.x / u_res.y), uv.y); // aspect-true, height=1
    float w = u_res.x / u_res.y;
    float t = u_time;

    // Breathing: a clearly perceptible slow orbit + radius pulse (the first
    // cut moved ~3% of the viewport over a minute — nobody could tell it was
    // alive). Still calm: full cycles take 30–90 seconds.
    vec2 d1 = 0.10 * vec2(sin(t*0.16), cos(t*0.12));
    vec2 d2 = 0.09 * vec2(cos(t*0.11 + 2.0), sin(t*0.15 + 1.0));
    vec2 d3 = 0.11 * vec2(sin(t*0.13 + 4.0), cos(t*0.09 + 3.0));
    float pulse = 1.0 + 0.10 * sin(t*0.18);

    // Pointer lean (§8): shift every orb a few percent toward the cursor so the
    // whole field tilts to follow it — the desktop analogue of liquid glass
    // leaning under a device tilt. Idle pointer sits at centre → zero lean.
    vec2 lean = (u_pointer - vec2(0.5*w, 0.5)) * 0.05;

    vec3 green = mix(vec3(0.129,0.627,0.353), vec3(0.180,0.659,0.400), u_dark);
    vec3 lime  = vec3(0.588,0.745,0.275);
    vec3 blue  = vec3(0.353,0.588,0.824);

    // Light mode runs noticeably hotter than dark: on the pale canvas the
    // original alphas washed out to near-invisible, while dark's tuning was
    // already right. CSS y% is top-down; GL y is bottom-up → y = 1 - y%.
    // Light-mode alphas raised ~15% (§2) so the green is present where content
    // sits, not just at the page edges; a5 (centre, under the content column)
    // gets the largest relative bump. Dark's second operand is unchanged.
    float a1 = orb(px, vec2(0.06*w, 0.86) + d1 + lean, 0.75*pulse) * mix(0.46, 0.30, u_dark);
    float a2 = orb(px, vec2(0.96*w, 0.78) + d2 + lean, 0.64)        * mix(0.39, 0.18, u_dark);
    float a3 = orb(px, vec2(0.78*w, 0.04) + d3 + lean, 0.85*pulse) * mix(0.41, 0.26, u_dark);
    float a4 = orb(px, vec2(0.20*w, 0.12) - d1 + lean, 0.60)        * mix(0.27, 0.16, u_dark);
    float a5 = orb(px, vec2(0.50*w, 0.50) + d2 + lean, 0.53)        * mix(0.20, 0.10, u_dark);

    vec3 col = green*a1 + lime*a2 + green*a3 + blue*a4 + green*a5;
    float alpha = a1 + a2 + a3 + a4 + a5;

    // Caustic light drifting across the WHOLE page — sunlight through water
    // on a wall. Two crossing band systems at different scales/speeds so it
    // reads organic; brighter inside the orbs, still present on bare paper.
    // Scroll-coupled (§8): a little extra phase drift and up to +70% brightness
    // while the page is moving, decaying back to rest — the caustics "breathe"
    // with scroll velocity. u_scroll is 0 at rest so the baseline is unchanged.
    float cs = u_scroll;
    float c1 = sin((px.x + px.y) * 6.0 + 3.5*noise(px*1.6 + t*0.05) + t*0.22 + cs*2.4);
    float c2 = sin((px.x - px.y*0.7) * 3.5 + 3.0*noise(px*1.1 - t*0.04) - t*0.15 - cs*1.8);
    float fil = pow(max(c1, 0.0), 14.0) * 0.6 + pow(max(c2, 0.0), 10.0) * 0.4;
    fil *= mix(0.17, 0.06, u_dark) * (1.0 + 0.7*cs);
    fil *= 0.45 + 0.55 * smoothstep(0.02, 0.25, alpha);
    fil *= u_quality; // adaptive: thin the caustics under GPU pressure.
    col += mix(vec3(0.55,0.95,0.68), vec3(0.75,0.92,0.5), uv.y) * fil;
    alpha += fil;

    // Ordered dither (§3A): a sub-1/255 animated hash breaks the 8-bit
    // quantisation boundary so the quarter-res radial falloff stops posterising
    // into concentric rings on large/dark displays. The + u_time makes it a
    // gentle temporal grain that reads as film noise, on-brand with body::before.
    float d = (hash(gl_FragCoord.xy + u_time) - 0.5) / 255.0;
    col += d;

    // Premultiplied output over the page background.
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

export default function AmbientBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  // Bumped on webglcontextrestored to force the drawing effect to re-initialise
  // the program on the same canvas after the GPU reclaims the context.
  const [generation, setGeneration] = useState(0);
  const motionSignal = useMotionSignal();

  useEffect(() => {
    if (
      !hasFinePointer(window) ||
      prefersReducedMotion() ||
      window.matchMedia("(prefers-reduced-transparency: reduce)").matches ||
      deviceTier() === "low"
    ) {
      return;
    }
    // Mount the canvas; the drawing effect below takes over once it exists.
    queueMicrotask(() => setActive(true));
    return () => queueMicrotask(() => setActive(false));
  }, [motionSignal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
    if (!gl) {
      // WebGL blocked/unavailable — leave the CSS orbs in place.
      queueMicrotask(() => setActive(false));
      return;
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      queueMicrotask(() => setActive(false));
      return;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      queueMicrotask(() => setActive(false));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uDark = gl.getUniformLocation(prog, "u_dark");
    const uPointer = gl.getUniformLocation(prog, "u_pointer");
    const uScroll = gl.getUniformLocation(prog, "u_scroll");
    const uQuality = gl.getUniformLocation(prog, "u_quality");

    // The CSS orbs are off while the living layer runs.
    document.documentElement.classList.add("has-ambient");

    // ── Adaptive quality (§8) ────────────────────────────────────────────────
    // Sample fps over ~1s windows. If it slips below budget, degrade gracefully:
    // thin the caustics first (u_quality), then drop the resolution scale a
    // notch (resMul) — never drop the whole layer, never stutter. Recover a step
    // at a time when headroom returns. High tier starts with full quality.
    let quality = 1; // → u_quality
    let resMul = 1; // multiplies resolutionScale()
    let winFrames = 0;
    let winStart = performance.now();

    // ── §8 reactive state (all fed as uniforms on the existing loop) ─────────
    // Pointer target in aspect-true px space; smoothed toward each frame. Idle
    // value is centre so a page with no pointer movement shows zero lean.
    const aspect = () => canvas.clientWidth / Math.max(1, canvas.clientHeight);
    let pTargetX = 0.5 * aspect();
    let pTargetY = 0.5;
    let pCurX = pTargetX;
    let pCurY = pTargetY;
    const onPointer = (e: PointerEvent) => {
      // Map against the canvas's OWN box — it's vertically overdrawn (top:-22%,
      // height:144%, mirroring body::after), so the shader's uv/px frame is
      // taller than the viewport. Using window.innerHeight here would desync the
      // lean from the cursor near the top/bottom edges. x scaled by aspect to
      // match the shader's px space.
      const rect = canvas.getBoundingClientRect();
      pTargetX = ((e.clientX - rect.left) / rect.width) * aspect();
      pTargetY = 1 - (e.clientY - rect.top) / rect.height;
    };
    // Scroll velocity 0..1, ramped on scroll and decayed each frame.
    let scrollVel = 0;
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const dy = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      scrollVel = Math.min(1, scrollVel + dy / 600);
    };
    // Theme cross-fade: u_dark is lerped, not hard-switched, so a theme/sun-cycle
    // flip reads as the room's light changing (~600ms) rather than a snap.
    let darkCur = document.documentElement.classList.contains("dark") ? 1 : 0;
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    const resize = () => {
      const scale = resolutionScale() * resMul;
      const w = Math.max(160, Math.floor(canvas.clientWidth * scale));
      const h = Math.max(160, Math.floor(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
    };

    const isDark = () => document.documentElement.classList.contains("dark");
    const start = performance.now();
    let raf = 0;
    let last = 0;
    let running = true;

    const loop = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return; // 30fps clock
      last = now;
      resize();
      gl.uniform1f(uTime, (now - start) / 1000);
      // Smooth the pointer toward its target (~frame-rate-independent enough at
      // the fixed 30fps clock); a gentle 0.12 factor trails the cursor softly.
      pCurX += (pTargetX - pCurX) * 0.12;
      pCurY += (pTargetY - pCurY) * 0.12;
      gl.uniform2f(uPointer, pCurX, pCurY);
      // Decay scroll velocity toward rest; ~0.85/frame settles in ~0.4s.
      scrollVel *= 0.85;
      gl.uniform1f(uScroll, scrollVel);
      // Lerp u_dark toward the live theme — 0.12/frame ≈ 600ms cross-fade.
      darkCur += ((isDark() ? 1 : 0) - darkCur) * 0.12;
      gl.uniform1f(uDark, darkCur);
      gl.uniform1f(uQuality, quality);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Adaptive-quality sampler: once per ~1s window, read effective fps and
      // step quality down (thin caustics → drop resolution) or back up.
      winFrames++;
      if (now - winStart >= 1000) {
        const fps = (winFrames * 1000) / (now - winStart);
        if (fps < 24) {
          if (quality > 0.4)
            quality = 0.4; // first: thin the caustics
          else if (resMul > 0.75) resMul = 0.75; // then: drop resolution
        } else if (fps > 50) {
          if (resMul < 1)
            resMul = 1; // recover a step at a time
          else if (quality < 1) quality = 1;
        }
        winFrames = 0;
        winStart = now;
      }
    };

    const play = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else play();
    };
    // Context hygiene (§8): mobile GPUs reclaim WebGL aggressively. On loss,
    // preventDefault (so the browser will fire a restore), halt the loop, and
    // drop `has-ambient` so the CSS orbs paint instantly — never a blank canvas.
    // On restore, bump `generation` to re-run this effect and rebuild on the
    // same canvas.
    const onLost = (e: Event) => {
      e.preventDefault();
      stop();
      document.documentElement.classList.remove("has-ambient");
    };
    const onRestored = () => setGeneration((g) => g + 1);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(loop);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.classList.remove("has-ambient");
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [active, generation]);

  if (!active) return null;

  return (
    <canvas
      aria-hidden
      className="ambient-backdrop pointer-events-none fixed inset-x-0 z-0"
      ref={canvasRef}
      style={{
        // Mirror body::after: overdraw top/bottom so GlassLight's scroll
        // parallax (--orb-y) never reveals a gap at the edges. A canvas is a
        // replaced element, so left/right/top/bottom don't stretch it —
        // explicit viewport-relative dimensions instead.
        top: "-22%",
        width: "100%",
        height: "144%",
        transform: "translate3d(0, calc(var(--orb-y, 0) * 1px), 0)",
        willChange: "transform",
      }}
    />
  );
}
