import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

/**
 * The marketing home page is gone for now: the recipe listing at `/{locale}/everything` is the
 * entry point. The redirect is temporary so the old page can come back without fighting caches.
 */
export default async function Home() {
  const locale = await getLocale();

  redirect(`/${locale}/everything`);
}
