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

  void main(){
    vec2 uv = gl_FragCoord.xy / u_res;
    float t = u_time;

    // Gentle cloth ripple — displace the sampling point.
    vec2 wuv = uv;
    wuv.x += 0.012 * sin(uv.y * 9.0 + t * 1.15);
    wuv.y += 0.010 * sin(uv.x * 7.0 - t * 0.95);

    // Swiss cross (federal proportions ≈ arm 6 : bar 7, centred with margin).
    vec2 pc = wuv - 0.5;
    float bw = 0.096;   // half bar thickness
    float al = 0.303;   // half arm length
    float aa = 1.6 / u_res.y;
    float horiz = smoothstep(bw + aa, bw - aa, abs(pc.y)) *
                  smoothstep(al + aa, al - aa, abs(pc.x));
    float vert  = smoothstep(bw + aa, bw - aa, abs(pc.x)) *
                  smoothstep(al + aa, al - aa, abs(pc.y));
    float crossM = clamp(horiz + vert, 0.0, 1.0);

    vec3 red = vec3(0.851, 0.176, 0.153);
    vec3 white = vec3(0.975, 0.972, 0.965);
    vec3 col = mix(red, white, crossM);

    // Cloth folds — soft light/shade from the ripple.
    float fold = sin(uv.x * 10.0 + t * 1.1) * 0.5 + sin(uv.y * 8.0 - t * 0.9) * 0.5;
    col *= 1.0 + 0.07 * fold;

    // Slow specular sheen sweeping diagonally (the "silk/glass" highlight).
    float band = pow(max(sin((uv.x - uv.y) * 3.2 - t * 0.5), 0.0), 6.0);
    col += band * 0.1;

    // Soft vignette.
    float vig = smoothstep(1.15, 0.35, length(uv - 0.5) * 1.4);
    col *= 0.9 + 0.1 * vig;

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
