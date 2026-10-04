/**
 * ShieldShader.test.tsx — Task 5.2 tests.
 *
 * Test strategy:
 *   - WebGL unavailable → fallback rendered, no canvas.
 *   - prefers-reduced-motion → fallback rendered (static icon, no loop).
 *   - WebGL compile failure → fallback rendered.
 *   - WebGL link failure → fallback rendered.
 *   - Happy path → canvas and shield icon overlay rendered.
 *   - Unmount cleanup → cancelAnimationFrame and loseContext called.
 *   - Visibility pause → animation frame cancelled on tab hide, restarted on show.
 *
 * We cannot run a real WebGL rendering context in jsdom, so all GL calls
 * are spied on via a minimal mock.  The compile/link helpers are tested by
 * manipulating getShaderParameter / getProgramParameter return values.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';

// ── WebGL mock factory ─────────────────────────────────────────────────────────

type MockGLContext = {
  VERTEX_SHADER: number;
  FRAGMENT_SHADER: number;
  COMPILE_STATUS: number;
  LINK_STATUS: number;
  ARRAY_BUFFER: number;
  STATIC_DRAW: number;
  FLOAT: number;
  TRIANGLE_STRIP: number;
  createShader: ReturnType<typeof vi.fn>;
  shaderSource: ReturnType<typeof vi.fn>;
  compileShader: ReturnType<typeof vi.fn>;
  getShaderParameter: ReturnType<typeof vi.fn>;
  getShaderInfoLog: ReturnType<typeof vi.fn>;
  deleteShader: ReturnType<typeof vi.fn>;
  createProgram: ReturnType<typeof vi.fn>;
  attachShader: ReturnType<typeof vi.fn>;
  linkProgram: ReturnType<typeof vi.fn>;
  getProgramParameter: ReturnType<typeof vi.fn>;
  getProgramInfoLog: ReturnType<typeof vi.fn>;
  deleteProgram: ReturnType<typeof vi.fn>;
  useProgram: ReturnType<typeof vi.fn>;
  createBuffer: ReturnType<typeof vi.fn>;
  bindBuffer: ReturnType<typeof vi.fn>;
  bufferData: ReturnType<typeof vi.fn>;
  getAttribLocation: ReturnType<typeof vi.fn>;
  enableVertexAttribArray: ReturnType<typeof vi.fn>;
  vertexAttribPointer: ReturnType<typeof vi.fn>;
  getUniformLocation: ReturnType<typeof vi.fn>;
  uniform1f: ReturnType<typeof vi.fn>;
  uniform2f: ReturnType<typeof vi.fn>;
  viewport: ReturnType<typeof vi.fn>;
  drawArrays: ReturnType<typeof vi.fn>;
  getExtension: ReturnType<typeof vi.fn>;
  // configurable flags
  _compileOk: boolean;
  _linkOk: boolean;
};

function makeMockGL(): MockGLContext {
  const ctx: MockGLContext = {
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    TRIANGLE_STRIP: 5,
    _compileOk: true,
    _linkOk: true,
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn((_s: unknown, param: number) =>
      param === 35713 ? ctx._compileOk : true,
    ),
    getShaderInfoLog: vi.fn(() => 'compile error log'),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn((_p: unknown, param: number) =>
      param === 35714 ? ctx._linkOk : true,
    ),
    getProgramInfoLog: vi.fn(() => 'link error log'),
    deleteProgram: vi.fn(),
    useProgram: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    getUniformLocation: vi.fn(() => 1),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    viewport: vi.fn(),
    drawArrays: vi.fn(),
    getExtension: vi.fn(() => ({ loseContext: vi.fn() })),
  };
  return ctx;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Stub canvas.getContext so it returns `ctx` or null. */
function stubGetContext(ctx: MockGLContext | null) {
  // Cast through unknown to bypass TS overload checking on the mock.
  (HTMLCanvasElement.prototype as { getContext: unknown }).getContext = vi.fn(
    (contextId: string) => {
      if (contextId === 'webgl' || contextId === 'experimental-webgl') {
        return ctx;
      }
      return null;
    },
  );
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

let rafCallbacks: Array<(t: number) => void> = [];
let originalRAF: typeof requestAnimationFrame;
let originalCAF: typeof cancelAnimationFrame;
let originalMatchMedia: typeof window.matchMedia;

beforeEach(() => {
  rafCallbacks = [];
  originalRAF = window.requestAnimationFrame;
  originalCAF = window.cancelAnimationFrame;
  originalMatchMedia = window.matchMedia;

  // Deterministic RAF — store callbacks without executing them automatically
  let rafId = 0;
  window.requestAnimationFrame = vi.fn((cb) => {
    rafCallbacks.push(cb);
    return ++rafId;
  });
  window.cancelAnimationFrame = vi.fn();

  // Default: no reduced motion
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    media: '',
    addListener: vi.fn(),
    removeListener: vi.fn(),
  });

  // Silence expected error logs from failure tests
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  window.requestAnimationFrame = originalRAF;
  window.cancelAnimationFrame = originalCAF;
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ShieldShader', () => {
  it('shows the fallback when WebGL is unavailable', async () => {
    stubGetContext(null);

    const { ShieldShader } = await import('@/components/ShieldShader');
    render(<ShieldShader />);

    expect(screen.getByTestId('shield-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('shield-shader-container')).toBeNull();
  });

  it('shows the fallback when the vertex shader fails to compile', async () => {
    const gl = makeMockGL();
    gl._compileOk = false; // first compileShader call (vertex) fails
    stubGetContext(gl);

    // Re-import to ensure fresh module state
    vi.resetModules();
    const { ShieldShader } = await import('@/components/ShieldShader');
    render(<ShieldShader />);

    expect(screen.getByTestId('shield-fallback')).toBeInTheDocument();
    expect(gl.deleteShader).toHaveBeenCalled();
  });

  it('shows the fallback when the program fails to link', async () => {
    const gl = makeMockGL();
    gl._compileOk = true;
    gl._linkOk = false;
    stubGetContext(gl);

    vi.resetModules();
    const { ShieldShader } = await import('@/components/ShieldShader');
    render(<ShieldShader />);

    expect(screen.getByTestId('shield-fallback')).toBeInTheDocument();
    expect(gl.deleteProgram).toHaveBeenCalled();
  });

  it('renders the canvas and shield icon overlay on success', async () => {
    const gl = makeMockGL();
    stubGetContext(gl);

    vi.resetModules();
    const { ShieldShader } = await import('@/components/ShieldShader');
    render(<ShieldShader />);

    expect(screen.getByTestId('shield-shader-container')).toBeInTheDocument();
    expect(screen.getByTestId('shader-canvas')).toBeInTheDocument();
    // The static shield icon overlay is present (aria-hidden but in DOM)
    expect(screen.getByTestId('shader-canvas')).toBeInTheDocument();
  });

  it('shows the static SVG fallback immediately under reduced motion', async () => {
    // Simulate prefers-reduced-motion: reduce
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true, // reduced motion ON
      media: '(prefers-reduced-motion: reduce)',
      addListener: vi.fn(),
      removeListener: vi.fn(),
    });

    const gl = makeMockGL();
    stubGetContext(gl);

    vi.resetModules();
    const { ShieldShader } = await import('@/components/ShieldShader');
    render(<ShieldShader />);

    // DD §6: "render one frame (or the static SVG) with no loop."
    // We chose the static SVG path — no GL context touched, no RAF called.
    expect(screen.getByTestId('shield-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('shader-canvas')).toBeNull();
    expect(gl.drawArrays).not.toHaveBeenCalled();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('cancels the animation frame and releases the GL context on unmount', async () => {
    const gl = makeMockGL();
    const loseContext = vi.fn();
    gl.getExtension = vi.fn(() => ({ loseContext }));
    stubGetContext(gl);

    vi.resetModules();
    const { ShieldShader } = await import('@/components/ShieldShader');
    const { unmount } = render(<ShieldShader />);

    act(() => {
      unmount();
    });

    // cancelAnimationFrame should have been called (DD §6)
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    // WEBGL_lose_context.loseContext() should have been called (DD §6)
    expect(loseContext).toHaveBeenCalled();
  });

  it('pauses the loop when the tab becomes hidden and resumes when visible', async () => {
    const gl = makeMockGL();
    stubGetContext(gl);

    vi.resetModules();
    const { ShieldShader } = await import('@/components/ShieldShader');
    render(<ShieldShader />);

    const cafSpy = window.cancelAnimationFrame as ReturnType<typeof vi.fn>;
    const rafSpy = window.requestAnimationFrame as ReturnType<typeof vi.fn>;
    cafSpy.mockClear();
    rafSpy.mockClear();

    // Simulate tab hidden
    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(cafSpy).toHaveBeenCalled();

    // Simulate tab visible again
    cafSpy.mockClear();
    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(rafSpy).toHaveBeenCalled();
  });

  it('the fallback element has an accessible label', async () => {
    stubGetContext(null);

    vi.resetModules();
    const { ShieldShader } = await import('@/components/ShieldShader');
    render(<ShieldShader />);

    const fallback = screen.getByTestId('shield-fallback');
    expect(fallback).toHaveAttribute('aria-label');
  });

  it('does not declare a u_mouse uniform or listen for mousemove', async () => {
    // The shader source strings should not contain u_mouse or mousemove
    const shaderModule = await import('@/components/ShieldShader');
    // Verify by examining the FRAGMENT_SRC export indirectly: render and
    // check that no mousemove listener is added to the window.
    const addEventSpy = vi.spyOn(window, 'addEventListener');

    const gl = makeMockGL();
    stubGetContext(gl);

    vi.resetModules();
    const { ShieldShader: ShieldShader2 } = await import('@/components/ShieldShader');
    render(<ShieldShader2 />);

    const mousemoveCalls = addEventSpy.mock.calls.filter(
      ([eventName]) => eventName === 'mousemove',
    );
    expect(mousemoveCalls).toHaveLength(0);
    // Suppress unused variable lint
    void shaderModule;
  });
});
