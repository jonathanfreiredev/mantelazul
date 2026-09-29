/**
 * DOM id of a step, which is also the fragment the structured data points at.
 *
 * Shared by the page and the JSON-LD so the two cannot drift apart: an anchor no element carries
 * would send Google to the top of the recipe instead of to the step it marked up.
 *
 * Takes the position in the steps array, so the first step is `step-1`.
 */
export function stepAnchorId(index: number): string {
  return `step-${index + 1}`;
}
