import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { HouseholdSettings } from "~/components/household/household-settings";
import { getSession } from "~/server/better-auth/server";

export default async function HouseholdPage() {
  const session = await getSession();

  if (!session?.session) {
    redirect("/");
  }

  const t = await getTranslations("Household");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 md:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </header>

      <HouseholdSettings currentUserId={session.user.id} />
    </div>
  );
}
