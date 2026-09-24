import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, toLocale, type Locale } from "~/lib/locales";

/**
 * Resolves the active UI locale for server-side callers that are not React components, such as
 * the agent's tools (which run inside the chat route). `next-intl` exposes the locale through
 * the `x-locale` header and the `NEXT_LOCALE` cookie; falls back to the default locale.
 */
export async function getRequestLocale(): Promise<Locale> {
  const headerList = await headers();
  const fromHeader = headerList.get("x-locale");

  if (fromHeader) return toLocale(fromHeader);

  const cookieStore = await cookies();

  return toLocale(cookieStore.get("NEXT_LOCALE")?.value ?? DEFAULT_LOCALE);
}
