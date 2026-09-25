"use client";

import { useEffect, useRef } from "react";
import { LEVEL_FRAME_MS } from "~/lib/voice/recorder";
import { layoutWaveform } from "~/lib/voice/waveform";

/** Dots alone show no motion, so a slow band of brightness travels through them. */
const SHIMMER_BANDS = 3;
const SHIMMER_PERIOD_MS = 2600;

interface VoiceWaveformProps {
  /** Microphone levels, oldest first. Read every frame, never through React state. */
  levels: { current: number[] };
  className?: string;
}

/**
 * The recording, drawn as the voice happens: quiet stretches are dots, speech is bars, and the
 * whole row rolls from right to left. See `layoutWaveform` for where everything goes.
 */
export function VoiceWaveform({ levels, className }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let lastCount = -1;
    let lastSampleAtMs = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (nowMs: number) => {
      context.clearRect(0, 0, width, height);

      if (width > 0 && height > 0) {
        const history = levels.current;
        const count = history.length;

        if (count !== lastCount) {
          lastCount = count;
          lastSampleAtMs = nowMs;
        }

        // Sliding between samples keeps the roll smooth instead of stepping every 50 ms.
        const sinceLastSample =
          count === 0
            ? 0
            : Math.min(LEVEL_FRAME_MS, nowMs - lastSampleAtMs);
        const scrollMs = count * LEVEL_FRAME_MS + sinceLastSample;

        const slots = layoutWaveform({ levels: history, width, height, scrollMs });

        // Follows the theme: the canvas carries the colour in its own class.
        context.fillStyle = getComputedStyle(canvas).color;

        const slotWidth = width / slots.length;
        const dotRadius = Math.min(1.6, slotWidth / 2);
        const barWidth = Math.max(1, slotWidth - 1.2);
        const centre = height / 2;
        const shimmerPhase = (nowMs / SHIMMER_PERIOD_MS) * Math.PI * 2;

        slots.forEach((slot, index) => {
          if (slot.height === 0) {
            const shimmer = reduceMotion
              ? 0.5
              : 0.5 +
                0.25 *
                  Math.sin(
                    (index / slots.length) *
                      Math.PI *
                      2 *
                      SHIMMER_BANDS +
                      shimmerPhase,
                  );

            context.globalAlpha = shimmer;
            context.beginPath();
            context.arc(slot.x, centre, dotRadius, 0, Math.PI * 2);
            context.fill();
            return;
          }

          context.globalAlpha = 1;
          context.beginPath();
          context.roundRect(
            slot.x - barWidth / 2,
            centre - slot.height / 2,
            barWidth,
            slot.height,
            barWidth / 2,
          );
          context.fill();
        });

        context.globalAlpha = 1;
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    animationFrame = window.requestAnimationFrame(draw);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [levels]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
