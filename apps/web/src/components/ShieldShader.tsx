'use client';
/**
 * ShieldShader — DD §6 compliant WebGL shield animation.
 *
 * Sourced from: stitched fronted/new/shader.html (ANIMATION_20)
 *
 * DD §6 fixes applied:
 *   1. Canvas sized from its container with devicePixelRatio capped at 2.
 *   2. Mouse uniform and mousemove listener removed.
 *   3. Output color is clamped; alpha is output as premultiplied so edges
 *      are not washed out on the dark surface-container well.
 *   4. Shader compile and link status checked; failures log to console.error
 *      and trigger the static fallback.
 *   5. Animation paused when the tab is hidden (document.visibilitychange)
 *      or the canvas is off-screen (IntersectionObserver).
 *   6. On unmount: animation frame cancelled, GL context released via
 *      WEBGL_lose_context extension, and all event listeners removed.
 *   7. Static filled `shield` Material Symbol (primary, 32px) overlaid.
 *
 * Fallback: static SVG shield with CSS pulse — shown when:
 *   - WebGL is unavailable
 *   - Shader compile or link fails
 *   - prefers-reduced-motion is active (render one frame, no loop)
 *
 * This component must be dynamic-imported with ssr:false so its code is
 * absent from every route bundle except the Analyzing view.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Icon } from './Icon';

// ── GLSL sources ────────────────────────────────────────────────────────────────

/**
 * Vertex shader: pass-through that maps the full-screen quad to tex coords.
 * Unchanged from the original; no mouse uniform is declared here.
 */
const VERTEX_SRC = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

/**
 * Fragment shader: pulsing shield-shaped SDF glow in the design-system
 * primary color (0.62, 0.81, 0.85 = CSS var --color-primary).
 *
 * Changes from the original (DD §6):
 *   - u_mouse uniform removed.
 *   - clamp() applied so glow never exceeds 1.0.
 *   - Alpha output is glow, not color.r, giving better pre-multiplied results
 *     combined with the context flag premultipliedAlpha:false.
 */
const FRAGMENT_SRC = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);

  // Pulsing shield SDF
  float pulse = 0.5 + 0.5 * sin(u_time * 2.0);
  float size  = 0.3 + 0.05 * pulse;

  float x = uv.x;
  float y = uv.y;
  float d = max(abs(x), abs(y * 1.2)) - size;
  d = mix(d, length(vec2(x, y + 0.1)) - size, 0.5);

  // Inner glow — clamped so it never exceeds 1 (DD §6)
  float glow = clamp(0.02 / (abs(d) + 0.01), 0.0, 1.0);

  // Primary color from the design system (float rgb 0.62 0.81 0.85, matching --color-primary)
  vec3 color = clamp(vec3(0.62, 0.81, 0.85) * glow, 0.0, 1.0);
  color *= 0.8 + 0.2 * sin(u_time + uv.y * 10.0);
  color  = clamp(color, 0.0, 1.0);

  // Output with straight alpha (premultipliedAlpha:false keeps edges crisp)
  gl_FragColor = vec4(color, glow);
}`;

// ── Helpers ─────────────────────────────────────────────────────────────────────

/** Compile a shader and check its status.  Returns null on failure. */
function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // DD §6: log failures
    console.error('[ShieldShader] compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** Link a WebGL program and check its status.  Returns null on failure. */
function linkProgram(
  gl: WebGLRenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
): WebGLProgram | null {
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    // DD §6: log failures
    console.error('[ShieldShader] link error:', gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

// ── Static Fallback ──────────────────────────────────────────────────────────────

/**
 * Shown when WebGL is unavailable, when the shader fails to compile/link,
 * or when prefers-reduced-motion is set (NFR-2).
 * Uses only theme tokens; no hex values.
 */
function ShieldFallback({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      aria-label="Shield animation unavailable"
      data-testid="shield-fallback"
    >
      {/*
       * Animated SVG shield using the design-system primary color token.
       * The animation-name matches the keyframe added to theme.css.
       * Under prefers-reduced-motion the animation is suppressed by the
       * motion-safe: variant so this element renders as a static icon.
       */}
      <div className="motion-safe:animate-[shield-pulse_2s_ease-in-out_infinite]">
        <Icon name="shield" filled size={64} className="text-primary" />
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────────

export interface ShieldShaderProps {
  /**
   * Optional Tailwind/CSS class for the host element.
   * The host is a 96×96 relative container; set sizing on the parent.
   */
  className?: string;
}

/**
 * ShieldShader renders a WebGL pulsing glow with a static shield icon overlay.
 * It must be loaded via next/dynamic with ssr:false so the shader code is not
 * included in any server bundle or other route's client bundle.
 */
export function ShieldShader({ className = '' }: ShieldShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Initialised lazily so we can call window.matchMedia synchronously
   * without triggering setState inside an effect (lint rule).
   * This component only renders client-side (ssr:false), so `window` is safe.
   *
   * DD §6 / NFR-2: under prefers-reduced-motion we show the static SVG
   * fallback immediately — no GL context, no RAF loop.
   */
  const [useFallback, setUseFallback] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    // If reduced-motion already triggered the fallback, nothing to do.
    if (useFallback) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Obtain GL context with premultipliedAlpha:false (DD §6) ───────────
    const gl = (
      canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }) ||
      canvas.getContext('experimental-webgl', {
        alpha: true,
        premultipliedAlpha: false,
      })
    ) as WebGLRenderingContext | null;

    if (!gl) {
      setUseFallback(true);
      return;
    }

    // ── Size the canvas from its container, DPR capped at 2 (DD §6) ──────
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function syncSize() {
      if (!canvas || !gl) return;
      const w = Math.max(canvas.clientWidth, 1);
      const h = Math.max(canvas.clientHeight, 1);
      const pw = Math.round(w * dpr);
      const ph = Math.round(h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
    }

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    // ── Compile shaders and link program (DD §6) ──────────────────────────
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!vs || !fs) {
      setUseFallback(true);
      return;
    }

    const prog = linkProgram(gl, vs, fs);
    if (!prog) {
      setUseFallback(true);
      return;
    }

    gl.useProgram(prog);

    // ── Full-screen quad ──────────────────────────────────────────────────
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const posLoc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    // No u_mouse — removed per DD §6.

    // ── Pause state ───────────────────────────────────────────────────────
    let paused = false;
    let rafId = 0;

    // ── Render loop ───────────────────────────────────────────────────────
    function render(t: number) {
      if (!gl) return;
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas!.width, canvas!.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!paused) {
        rafId = requestAnimationFrame(render);
      }
    }

    rafId = requestAnimationFrame(render);

    // ── Pause when tab is hidden (DD §6) ──────────────────────────────────
    function onVisibilityChange() {
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(rafId);
      } else {
        paused = false;
        rafId = requestAnimationFrame(render);
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    // ── Pause when off-screen (DD §6) ─────────────────────────────────────
    let intersectionObserver: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const isVisible = entries[0]?.isIntersecting ?? true;
          if (!isVisible && !paused) {
            paused = true;
            cancelAnimationFrame(rafId);
          } else if (isVisible && paused && !document.hidden) {
            paused = false;
            rafId = requestAnimationFrame(render);
          }
        },
        { threshold: 0 },
      );
      intersectionObserver.observe(canvas);
    }

    // ── Unmount cleanup (DD §6) ────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      // Release the GL context so the GPU resources are freed
      const ext = gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
    };
  }, [useFallback]); // runs once on mount, or when useFallback becomes true

  if (useFallback) {
    return <ShieldFallback className={`w-24 h-24 ${className}`} />;
  }

  return (
    /*
     * Relative container so the shield icon overlay positions correctly.
     * overflow-hidden keeps the canvas inside the circular well.
     */
    <div
      className={`relative inline-flex items-center justify-center w-24 h-24 overflow-hidden ${className}`}
      data-testid="shield-shader-container"
    >
      {/* WebGL canvas — fills the inner 96×96px square */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
        data-testid="shader-canvas"
      />

      {/* Static shield icon overlay — identity readable regardless of GPU (DD §6) */}
      <div className="relative z-10 pointer-events-none" aria-hidden="true">
        <Icon name="shield" filled size={32} className="text-primary" />
      </div>
    </div>
  );
}
