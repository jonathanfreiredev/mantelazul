import { LEVEL_FRAME_MS } from "./recorder";

/**
 * Where each dot and bar of the recording goes.
 *
 * The row is a tape rolling right to left: the newest audio sits at the right edge and slides away
 * to the left, so the row is always full. Kept pure and free of canvas so the layout can be
 * reasoned about and tested without a browser.
 */

/** One dot or bar every this many CSS pixels. */
export const SLOT_PX = 3;

/** How much audio one dot or bar stands for. */
export const SLOT_MS = 200;

/** Anything quieter than this is a dot instead of a bar. */
export const DOT_THRESHOLD = 0.03;

/** How tall a bar gets for a given level; speech sits around 0.05 to 0.3. */
export const BAR_GAIN = 4;

export const MIN_BAR_PX = 3;

export interface WaveformSlot {
  /** Horizontal centre, in CSS pixels. */
  x: number;
  /** Height of the bar, or 0 when the slot is a dot. */
  height: number;
}

export function layoutWaveform({
  levels,
  width,
  height,
  scrollMs,
}: {
  /** Microphone levels, oldest first. */
  levels: number[];
  width: number;
  height: number;
  /** How far the tape has rolled: the age of the newest sample, in milliseconds. */
  scrollMs: number;
}): WaveformSlot[] {
  const slots = Math.max(1, Math.floor(width / SLOT_PX));
  const slotWidth = width / slots;
  const maxBarHeight = Math.max(MIN_BAR_PX, height - 4);
  const laid: WaveformSlot[] = [];

  for (let slot = 0; slot < slots; slot += 1) {
    // The rightmost slot ends at the newest sample.
    const endMs = scrollMs - (slots - 1 - slot) * SLOT_MS;
    const startMs = endMs - SLOT_MS;

    const from = Math.max(0, Math.floor(startMs / LEVEL_FRAME_MS));
    const to = Math.min(levels.length, Math.ceil(endMs / LEVEL_FRAME_MS));

    let peak = 0;
    for (let index = from; index < to; index += 1) {
      const level = levels[index];
      if (level !== undefined && level > peak) peak = level;
    }

    laid.push({
      x: slot * slotWidth + slotWidth / 2,
      height:
        peak < DOT_THRESHOLD
          ? 0
          : Math.min(
              maxBarHeight,
              Math.max(MIN_BAR_PX, peak * BAR_GAIN * maxBarHeight),
            ),
    });
  }

  return laid;
}
