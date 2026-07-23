"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The quick-search "nearest farm found" payoff (design §8 / §7) — a one-shot
 * GPU ripple burst that blooms out of the results header, plays ~1.2s, and
 * TEARS ITS CONTEXT DOWN. Ephemeral by construction: it mounts, runs a single
 * rAF pass, then calls `onDone` so the parent unmounts it — it never lingers to
 * compete with scrolling, and it is a SEPARATE short-lived context from the
 * ambient backdrop (the one persistent context), consistent with §8's rule that
 * this is the single bounded exception.
 *
 * Graceful by default: reduced-motion, no-WebGL (Brave shields, context limit)
 * or a failed compile resolve `onDone` immediately with no visual — the results
 * still appear, just without the flourish. Non-blocking and pointer-transparent.
 */
const DURATION_MS = 1200;

const VERT = `
  attribute vec2 p;
  void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`;

// Two green rings expanding from centre, brightest mid-flight, fading to zero.
const FRAG = `
  precision mediump float;
  uniform vec2 u_res;
  uniform float u_t;   // 0..1 progress
  uniform float u_dark;

  void main(){
    vec2 uv = gl_FragCoord.xy / u_res;
    float aspect = u_res.x / u_res.y;
    vec2 c = vec2(0.5 * aspect, 0.5);
    float d = distance(vec2(uv.x * aspect, uv.y), c);

    // Expanding wavefront; a couple of trailing rings via a phase offset.
    float front = u_t * 0.9;
    float ring1 = smoothstep(0.05, 0.0, abs(d - front));
    float ring2 = smoothstep(0.04, 0.0, abs(d - front * 0.62));
    float rings = ring1 + 0.6 * ring2;

    // Envelope: ramp in fast, fade out over the tail so nothing snaps off.
    float env = smoothstep(0.0, 0.12, u_t) * (1.0 - smoothstep(0.55, 1.0, u_t));

    vec3 green = mix(vec3(0.18, 0.72, 0.42), vec3(0.22, 0.80, 0.48), u_dark);
    float alpha = clamp(rings * env, 0.0, 1.0) * 0.55;
    gl_FragColor = vec4(green * alpha, alpha);
  }
`;

export default function NearestBurst({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // One-shot: mount → play once → onDone. `onDone` is captured at mount, which
  // is correct here — the parent passes a behaviourally-stable unmount callback.
  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onDone();
    };

    if (prefersReducedMotion()) {
      finish();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      finish();
      return;
    }
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
    if (!gl) {
      finish();
      return;
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = vs && fs ? gl.createProgram()! : null;
    if (!prog) {
      // Release whatever compiled; the canvas unmount frees the context.
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      finish();
      return;
    }
    gl.attachShader(prog, vs!);
    gl.attachShader(prog, fs!);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      gl.deleteShader(vs!);
      gl.deleteShader(fs!);
      finish();
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
    const uT = gl.getUniformLocation(prog, "u_t");
    const uDark = gl.getUniformLocation(prog, "u_dark");
    gl.uniform1f(
      uDark,
      document.documentElement.classList.contains("dark") ? 1 : 0,
    );

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
    gl.clearColor(0, 0, 0, 0);

    let raf = 0;
    const start = performance.now();
    // One shot: free the GL objects when done. The React unmount (onDone flips
    // showBurst off) drops the canvas, which releases the context itself — no
    // explicit loseContext(), which would log a noisy "WebGL context lost"
    // warning on a perfectly normal teardown.
    const teardown = () => {
      cancelAnimationFrame(raf);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
    const loop = (now: number) => {
      const t = (now - start) / DURATION_MS;
      if (t >= 1) {
        teardown();
        finish();
        return;
      }
      gl.uniform1f(uT, t);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      teardown();
      finish();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      ref={canvasRef}
    />
  );
}
