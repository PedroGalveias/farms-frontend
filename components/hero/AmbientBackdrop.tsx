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

// Backing-store scale: 1/4 of CSS pixels in each axis (1/16 of the fragments).
const RESOLUTION_SCALE = 0.25;
const FRAME_MS = 1000 / 30;

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

    // Breathing: tiny orbit + radius pulse, minutes-long periods.
    vec2 d1 = 0.030 * vec2(sin(t*0.11), cos(t*0.09));
    vec2 d2 = 0.026 * vec2(cos(t*0.07 + 2.0), sin(t*0.10 + 1.0));
    vec2 d3 = 0.034 * vec2(sin(t*0.08 + 4.0), cos(t*0.06 + 3.0));
    float pulse = 1.0 + 0.05 * sin(t*0.13);

    vec3 green = mix(vec3(0.129,0.627,0.353), vec3(0.180,0.659,0.400), u_dark);
    vec3 lime  = vec3(0.588,0.745,0.275);
    vec3 blue  = vec3(0.353,0.588,0.824);

    // CSS y% is top-down; GL y is bottom-up → y = 1 - y%.
    float a1 = orb(px, vec2(0.06*w, 0.86) + d1, 0.75*pulse) * mix(0.26, 0.30, u_dark);
    float a2 = orb(px, vec2(0.96*w, 0.78) + d2, 0.64)        * mix(0.22, 0.18, u_dark);
    float a3 = orb(px, vec2(0.78*w, 0.04) + d3, 0.85*pulse) * mix(0.22, 0.26, u_dark);
    float a4 = orb(px, vec2(0.20*w, 0.12) - d1, 0.60)        * mix(0.14, 0.16, u_dark);
    float a5 = orb(px, vec2(0.50*w, 0.50) + d2, 0.53)        * mix(0.08, 0.10, u_dark);

    vec3 col = green*a1 + lime*a2 + green*a3 + blue*a4 + green*a5;
    float alpha = a1 + a2 + a3 + a4 + a5;

    // Faint caustic filaments drifting through the light — the "living" part.
    float c = sin((px.x + px.y) * 7.0 + 3.0*noise(px*1.8 + t*0.03) + t*0.10);
    float fil = pow(max(c, 0.0), 22.0) * mix(0.05, 0.035, u_dark);
    // Filaments only glow where there's already light, so the paper stays calm.
    fil *= smoothstep(0.02, 0.25, alpha);
    col += mix(vec3(0.55,0.95,0.68), vec3(0.75,0.92,0.5), uv.y) * fil;
    alpha += fil;

    // Premultiplied output over the page background.
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

export default function AmbientBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const motionSignal = useMotionSignal();

  useEffect(() => {
    if (
      !hasFinePointer(window) ||
      prefersReducedMotion() ||
      window.matchMedia("(prefers-reduced-transparency: reduce)").matches
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

    // The CSS orbs are off while the living layer runs.
    document.documentElement.classList.add("has-ambient");

    const resize = () => {
      const w = Math.max(
        160,
        Math.floor(canvas.clientWidth * RESOLUTION_SCALE),
      );
      const h = Math.max(
        160,
        Math.floor(canvas.clientHeight * RESOLUTION_SCALE),
      );
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
      gl.uniform1f(uDark, isDark() ? 1 : 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(loop);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      document.documentElement.classList.remove("has-ambient");
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [active]);

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
