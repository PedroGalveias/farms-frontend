"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A self-contained WebGL "liquid glass" showcase for the hero — the premium
 * moment. A procedural on-brand scene (paper/ink base + drifting green light
 * orbs) is refracted through a slowly morphing glass height-field, with
 * chromatic aberration and specular highlights — the real Apple-style optics
 * that CSS `backdrop-filter` can't do, rendered here over a generated scene
 * (not the live DOM) so it works identically on Chromium, Gecko and WebKit.
 *
 * Progressive enhancement: if WebGL is unavailable or the user asks to reduce
 * transparency, it falls back to a static on-brand gradient. Under reduced
 * motion it renders a single frozen frame (still glassy, just not moving), and
 * it pauses entirely while scrolled out of view.
 */
export default function LiquidGlassShowcase({
  className = "",
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Defer the fallback flag so it doesn't set state synchronously during the
    // effect (which would trigger a cascading render).
    const fail = () => queueMicrotask(() => setFailed(true));

    if (window.matchMedia("(prefers-reduced-transparency: reduce)").matches) {
      fail();
      return;
    }

    const gl =
      canvas.getContext("webgl", { antialias: true, alpha: false }) ??
      canvas.getContext("experimental-webgl", { antialias: true });
    if (!(gl instanceof WebGLRenderingContext)) {
      fail();
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const vert = `
      attribute vec2 p;
      void main(){ gl_Position = vec4(p, 0.0, 1.0); }
    `;
    const frag = `
      precision highp float;
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

      // Procedural scene the glass refracts. Deliberately full of high-
      // frequency detail (light orbs + caustic filaments) so the refraction
      // and chromatic aberration are actually visible when it bends.
      vec3 scene(vec2 uv, float t){
        vec3 base = mix(vec3(0.93,0.95,0.91), vec3(0.045,0.055,0.065), u_dark);
        base = mix(base, base*vec3(0.88,1.04,0.92), uv.y*0.45);
        vec3 green = vec3(0.11,0.60,0.33);
        vec3 lime  = vec3(0.62,0.78,0.30);
        vec3 col = base;
        col += green*0.70*smoothstep(0.34,0.0,length(uv-vec2(0.32+0.09*sin(t*0.30),0.36+0.07*cos(t*0.24))));
        col += lime *0.48*smoothstep(0.26,0.0,length(uv-vec2(0.70+0.08*cos(t*0.21),0.68+0.09*sin(t*0.27))));
        col += green*0.52*smoothstep(0.30,0.0,length(uv-vec2(0.54+0.10*sin(t*0.18+1.0),0.24+0.06*cos(t*0.20))));
        // Caustic filaments — thin bright curved light lines (the hallmark of
        // glass/water) that warp dramatically under the refraction offset.
        float c = sin((uv.x+uv.y)*20.0 + 5.0*noise(uv*2.4 + t*0.25) + t*0.5);
        col += pow(max(c,0.0),6.0) * mix(vec3(0.45,0.92,0.6), vec3(0.7,0.88,0.4), uv.y) * 0.22;
        return col;
      }

      float height(vec2 uv, float t){
        float h = 0.0;
        h += 0.60*exp(-8.0 *length(uv-vec2(0.35+0.08*sin(t*0.50),0.40+0.06*cos(t*0.43))));
        h += 0.50*exp(-10.0*length(uv-vec2(0.66+0.07*cos(t*0.40),0.62+0.05*sin(t*0.47))));
        h += 0.40*exp(-9.0 *length(uv-vec2(0.50+0.10*sin(t*0.33+2.0),0.50+0.09*cos(t*0.37))));
        h += 0.15*noise(uv*4.0 + t*0.2);
        return h;
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / u_res;
        float t = u_time;
        float e = 1.6 / u_res.y;
        float hL = height(uv-vec2(e,0.0),t);
        float hR = height(uv+vec2(e,0.0),t);
        float hD = height(uv-vec2(0.0,e),t);
        float hU = height(uv+vec2(0.0,e),t);
        vec2 n = vec2(hL-hR, hD-hU);
        float refr = 0.15;
        // Wide per-channel offset = visible chromatic aberration at the edges.
        vec3 col;
        col.r = scene(uv + n*refr*1.16, t).r;
        col.g = scene(uv + n*refr*1.00, t).g;
        col.b = scene(uv + n*refr*0.84, t).b;
        // Specular: a tight glint plus a broad sheen.
        vec3 N = normalize(vec3(n*7.0, 1.0));
        vec3 L = normalize(vec3(0.35, 0.65, 0.8));
        float d = max(dot(N,L),0.0);
        col += (pow(d,64.0)*0.8 + pow(d,14.0)*0.12) * (1.0 - 0.4*u_dark);
        // Chromatic Fresnel rim where the slope is steep (the glass edge).
        float rim = smoothstep(0.05, 0.35, length(n)*9.0);
        col += rim * vec3(0.45,0.98,0.7) * 0.16;
        // Soft tonemap so highlights roll off instead of blowing to white.
        col = col / (col*0.32 + 0.82);
        col *= 1.0 - 0.20*length(uv-0.5);
        gl_FragColor = vec4(col, 1.0);
      }
    `;

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

    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
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
    // Full-screen triangle-strip quad.
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

    const isDark = () => document.documentElement.classList.contains("dark");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
    };

    const draw = (timeSec: number) => {
      resize();
      gl.uniform1f(uTime, timeSec);
      gl.uniform1f(uDark, isDark() ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    let raf = 0;
    let running = false;
    const start = performance.now();

    const loop = () => {
      draw(reduceMotion ? 6 : (performance.now() - start) / 1000);
      if (running && !reduceMotion) raf = requestAnimationFrame(loop);
    };
    const play = () => {
      if (running) return;
      running = true;
      if (reduceMotion) draw(6);
      else raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Pause when scrolled out of view.
    const io = new IntersectionObserver(
      (entries) => (entries[0]?.isIntersecting ? play() : stop()),
      { threshold: 0.01 },
    );
    io.observe(canvas);

    const ro = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(6);
    });
    ro.observe(canvas);

    // Repaint on theme flip (colours are a uniform).
    const mo = new MutationObserver(() => {
      if (reduceMotion || !running) draw(reduceMotion ? 6 : 0);
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  if (failed) {
    return (
      <div
        aria-hidden
        className={`relative overflow-hidden bg-tone ${className}`}
      >
        <div className="absolute inset-0 [background:radial-gradient(130%_120%_at_25%_-10%,rgba(33,160,90,0.18),transparent_60%),radial-gradient(120%_120%_at_90%_110%,rgba(150,190,70,0.14),transparent_55%)]" />
      </div>
    );
  }

  return (
    <div aria-hidden className={`glass relative overflow-hidden ${className}`}>
      <canvas className="absolute inset-0 h-full w-full" ref={canvasRef} />
    </div>
  );
}
