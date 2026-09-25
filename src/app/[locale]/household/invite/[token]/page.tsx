import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { InviteAcceptCard } from "~/components/household/invite-accept-card";
import { getSession } from "~/server/better-auth/server";

interface HouseholdInvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function HouseholdInvitePage({
  params,
}: HouseholdInvitePageProps) {
  const [{ token }, session] = await Promise.all([params, getSession()]);

  // The invitation is tied to an email, so the visitor has to be signed in first. The token
  // travels in `next` so signing in (or signing up) lands them back on this page.
  if (!session?.session) {
    const next = encodeURIComponent(`/household/invite/${token}`);
    redirect(`/login?next=${next}`);
  }

  const t = await getTranslations("Household");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10 md:py-16">
      <h1 className="text-2xl font-semibold">{t("acceptTitle")}</h1>

      <InviteAcceptCard token={token} />
    </div>
  );
}
