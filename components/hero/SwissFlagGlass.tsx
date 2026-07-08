"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useMotionSignal } from "@/components/motion/useMotionSignal";

/**
 * A beautiful, gently-rippling WebGL Swiss flag — a square red field with the
 * white cross, rendered as soft silk: cloth folds, a slow specular sheen, and
 * a subtle vignette. Ambient (never demands attention), and framed by the
 * caller's glass.
 *
 * Budget (the iOS-crash lessons): ONE small canvas, capped-resolution backing
 * store, 30fps, and it PAUSES whenever scrolled out of view (an
 * IntersectionObserver) — it lives at the bottom of the page, so it's idle
 * most of the time. Under reduced motion it draws a single still frame; if
 * WebGL is unavailable (e.g. Brave shields) it falls back to a crisp SVG flag.
 */

const RESOLUTION_SCALE = 0.5;
const FRAME_MS = 1000 / 30;

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;

const FRAG = `
  precision mediump float;
  uniform vec2 u_res;
  uniform float u_time;

  // The flat Swiss flag: red field with the white federal cross
  // (arm 6 : bar 7, centred with margin).
  vec3 swissFlag(vec2 uv){
    vec2 pc = uv - 0.5;
    float bw = 0.096;   // half bar thickness
    float al = 0.303;   // half arm length
    float aa = 1.4 / u_res.y;
    float horiz = smoothstep(bw + aa, bw - aa, abs(pc.y)) *
                  smoothstep(al + aa, al - aa, abs(pc.x));
    float vert  = smoothstep(bw + aa, bw - aa, abs(pc.x)) *
                  smoothstep(al + aa, al - aa, abs(pc.y));
    float crossM = clamp(horiz + vert, 0.0, 1.0);
    vec3 red   = vec3(0.851, 0.176, 0.153);
    vec3 white = vec3(0.975, 0.972, 0.965);
    return mix(red, white, crossM);
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / u_res;
    float t = u_time;
    vec2 p = uv - 0.5;
    float r = length(p);

    // Treat the tile as a slab of poured glass: a soft dome, tall in the
    // middle and falling to the rim. h ≈ surface height (1 centre → 0 edge).
    float dome = smoothstep(0.86, 0.05, r);
    float h = pow(dome, 0.5);

    // Dome normal (leans outward toward the rim) plus a slow liquid undulation
    // so the surface looks poured, not flat.
    vec2 slope = p * (1.0 - h) * 2.2;
    slope += 0.05 * vec2(sin(uv.y * 7.0 + t * 0.7), cos(uv.x * 6.0 - t * 0.6));
    vec3 N = normalize(vec3(slope, 0.85));

    // Refraction: light bends through the glass, so read the flag pulled toward
    // the centre (the lens magnifies the cross) and nudged along the normal.
    vec2 luv = mix(uv, vec2(0.5), 0.12 * h) - N.xy * 0.05 * (1.0 - h);
    vec3 col = swissFlag(luv);

    // Fresnel: grazing angles at the rim go pale and bright, like a bevel.
    float fres = pow(1.0 - h, 2.5);
    col = mix(col, vec3(0.93, 0.95, 0.98), fres * 0.4);

    // Moving key light → a crisp specular catch-light (the glossy glass glint).
    vec3 L = normalize(vec3(-0.45, 0.5 + 0.15 * sin(t * 0.3), 0.75));
    float spec = pow(max(dot(N, L), 0.0), 40.0);
    col += spec * 0.7;

    // A broad sheen band sweeping diagonally across the surface.
    float sweep = pow(max(sin((uv.x - uv.y) * 3.0 - t * 0.45), 0.0), 8.0);
    col += sweep * 0.14 * dome;

    // Soft top reflection — the sky caught in the glass.
    float gloss = smoothstep(0.55, 0.0, distance(uv, vec2(0.33, 0.72)));
    col += gloss * 0.16;

    // Gentle depth vignette.
    col *= 0.88 + 0.14 * dome;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function FlagFallback() {
  // Crisp static SVG Swiss flag for no-WebGL environments.
  return (
    <svg
      aria-hidden
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" fill="#d82b27" />
      <rect x="13" y="6" width="6" height="20" fill="#f8f6f2" />
      <rect x="6" y="13" width="20" height="6" fill="#f8f6f2" />
    </svg>
  );
}

export default function SwissFlagGlass({
  className = "",
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const motionSignal = useMotionSignal();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fail = () => queueMicrotask(() => setFailed(true));

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) {
      fail();
      return;
    }

    const reduceMotion = prefersReducedMotion();

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
      fail();
      return;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      fail();
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

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(
        2,
        Math.floor(canvas.clientWidth * dpr * RESOLUTION_SCALE),
      );
      const h = Math.max(
        2,
        Math.floor(canvas.clientHeight * dpr * RESOLUTION_SCALE),
      );
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
    };

    const start = performance.now();
    let raf = 0;
    let last = 0;
    let running = false;
    let visible = true;

    const draw = (nowSec: number) => {
      resize();
      gl.uniform1f(uTime, nowSec);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const loop = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      draw((now - start) / 1000);
    };
    const play = () => {
      if (running || reduceMotion || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Draw one frame immediately (also the still frame under reduced motion).
    draw(reduceMotion ? 4 : 0);
    if (!reduceMotion) play();

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible) play();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : play());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [motionSignal]);

  if (failed) {
    return (
      <div aria-hidden className={className}>
        <FlagFallback />
      </div>
    );
  }

  return (
    <canvas
      aria-hidden
      className={className}
      ref={canvasRef}
      style={{ display: "block" }}
    />
  );
}
