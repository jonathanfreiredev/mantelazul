import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Calendar } from "~/components/meal-plan/calendar";
import { todayIso } from "~/lib/dates";
import { getSession } from "~/server/better-auth/server";

export default async function CalendarPage() {
  const session = await getSession();

  if (!session?.session) {
    redirect("/");
  }

  const t = await getTranslations("Calendar");

  return (
    <div className="mx-auto flex w-full max-w-230 flex-col gap-6 px-4 py-6 md:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </header>

      <Calendar initialDate={todayIso()} />
    </div>
  );
}
