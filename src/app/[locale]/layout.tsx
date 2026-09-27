import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Footer } from "~/components/footer";
import { Header } from "~/components/header";
import { ThemeProvider } from "~/components/providers/theme-provider";
import { routing } from "~/i18n/routing";
import { SITE_NAME, SITE_URL } from "~/lib/seo/site";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "sonner";

const fontNext = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-next",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom stays available: locking it out blocks pinch-to-zoom, which is a WCAG 1.4.4 failure.
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    // Every relative URL in the metadata of any page resolves against this.
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      // Sub-pages read as "Saffron and Parmesan Risotto · Mantel Azul".
      template: `%s · ${SITE_NAME}`,
    },
    description: t("description"),
    applicationName: SITE_NAME,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      ],
      apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
    },
    // Pages that build their own metadata replace these two wholesale, so they carry a full
    // Open Graph block of their own; these are the defaults for the ones that do not.
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={fontNext.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider>
          <TRPCReactProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster />
            </ThemeProvider>
          </TRPCReactProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
