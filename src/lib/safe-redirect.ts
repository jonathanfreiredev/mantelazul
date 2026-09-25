/**
 * Validates the `next` query parameter before redirecting to it. Only internal paths are allowed,
 * and never protocol-relative ones (`//evil.com`), so the parameter cannot be turned into an open
 * redirect.
 */
export function safeInternalPath(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;

  return value;
}
