/**
 * Text that comes from users or from the database is untrusted: it can carry newlines that fake a
 * new turn, control characters, or instructions aimed at the model. These helpers keep it in the
 * shape each field is supposed to have before it reaches a prompt.
 */

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** One line, no control characters, no leading or trailing whitespace. */
export function sanitizeInline(value: string, maxLength: number): string {
  return value
    .replace(CONTROL_CHARACTERS, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/</g, "‹")
    .replace(/>/g, "›")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Several lines allowed, but no control characters and a hard length cap. */
export function sanitizeMultiline(value: string, maxLength: number): string {
  return value
    .replace(CONTROL_CHARACTERS, "")
    .replace(/\r\n?/g, "\n")
    .replace(/</g, "‹")
    .replace(/>/g, "›")
    .trim()
    .slice(0, maxLength);
}

/** A dish name for the image model. It is a subject, not a place for instructions. */
export function sanitizeImageSubject(value: string): string {
  return sanitizeInline(value, 80);
}

/**
 * A style hint for the image model. Only letters, numbers, spaces, commas, apostrophes and hyphens
 * survive, so a hint cannot introduce a new sentence or a second subject.
 */
export function sanitizeImageStyle(value?: string): string | undefined {
  if (!value) return undefined;

  const cleaned = value
    .replace(/[^\p{L}\p{N} ,'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);

  return cleaned.length > 0 ? cleaned : undefined;
}
