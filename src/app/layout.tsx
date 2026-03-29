import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Lora } from "next/font/google";

import { Header } from "~/components/header";
import { ThemeProvider } from "~/components/providers/theme-provider";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "sonner";
import { Footer } from "~/components/footer";

export const metadata: Metadata = {
  title: "Mantel Azul",
  description:
    "Full-stack recipe app with Next.js, tRPC, Prisma, and Tailwind.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const fontNext = Lora({
  subsets: ["latin"],
  variable: "--font-next",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fontNext.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
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
      </body>
    </html>
  );
}
