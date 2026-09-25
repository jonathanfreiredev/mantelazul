/**
 * URL the verification link lands on: the confirmation page, carrying the destination so the
 * button at the end of the flow returns the user where they were headed.
 */
export function verificationCallbackUrl(
  origin: string,
  locale: string,
  redirectTo?: string,
): string {
  const url = new URL(`/${locale}/verify-email`, origin);

  if (redirectTo) url.searchParams.set("next", redirectTo);

  return url.toString();
}
