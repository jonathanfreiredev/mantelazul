import { getTranslations } from "next-intl/server";
import { LegalDocument } from "~/components/legal/legal-document";
import { readLegalDocument } from "~/lib/legal";
import { toLocale } from "~/lib/locales";

interface LegalPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LegalPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Legal" });

  return {
    title: t("privacyTitle"),
    description: t("privacyDescription"),
  };
}

export default async function PrivacyPage({ params }: LegalPageProps) {
  const { locale } = await params;
  const markdown = await readLegalDocument("privacy", toLocale(locale));

  return <LegalDocument markdown={markdown} />;
}
