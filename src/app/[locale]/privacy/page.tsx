import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocument } from "~/components/legal/legal-document";
import { readLegalDocument } from "~/lib/legal";
import { toLocale } from "~/lib/locales";
import { buildPageMetadata } from "~/lib/seo/metadata";

interface LegalPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LegalPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Legal" });

  return buildPageMetadata({
    title: t("privacyTitle"),
    description: t("privacyDescription"),
    path: "/privacy",
    locale: toLocale(locale),
  });
}

export default async function PrivacyPage({ params }: LegalPageProps) {
  const { locale } = await params;
  const markdown = await readLegalDocument("privacy", toLocale(locale));

  return <LegalDocument markdown={markdown} />;
}
