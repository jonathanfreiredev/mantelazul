"use client";

import { useEffect, useState } from "react";

export interface VisualViewportMetrics {
  /** Visible height above the software keyboard, or null before the first measurement. */
  height: number | null;
  /**
   * How far the visual viewport is offset from the layout viewport. iOS Safari moves it when it
   * scrolls the page to reveal a focused field; a fixed panel has to follow it or it drifts out
   * of view.
   */
  offsetTop: number;
  /** Height covered by the software keyboard, or 0 when it is closed. */
  keyboardInset: number;
}

const INITIAL_METRICS: VisualViewportMetrics = {
  height: null,
  offsetTop: 0,
  keyboardInset: 0,
};

/**
 * Size of the area the user can actually see. On phones the software keyboard shrinks the visual
 * viewport but not the layout viewport, so `100dvh` and `position: fixed` keep their old size and
 * the composer ends up behind the keyboard. This measures the real visible box instead.
 *
 * Updates are throttled to one per frame because iOS fires resize and scroll continuously while
 * the keyboard animates, and every update re-renders the panel.
 */
export function useVisualViewport(enabled = true): VisualViewportMetrics {
  const [metrics, setMetrics] =
    useState<VisualViewportMetrics>(INITIAL_METRICS);

  useEffect(() => {
    if (!enabled) {
      setMetrics(INITIAL_METRICS);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setMetrics({
          height: viewport.height,
          offsetTop: viewport.offsetTop,
          keyboardInset: Math.max(
            0,
            window.innerHeight - viewport.offsetTop - viewport.height,
          ),
        });
      });
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);

    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [enabled]);

  return metrics;
}
