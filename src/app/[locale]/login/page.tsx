import { redirect } from "next/navigation";
import { LoginForm } from "~/components/auth/login-form";
import { safeInternalPath } from "~/lib/safe-redirect";
import { PRIVATE_PAGE_METADATA } from "~/lib/seo/metadata";
import { googleSignInEnabled } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

// Signing in is not something anyone should arrive at from a search result. The page is kept
// crawlable on purpose so this directive can be read, and `robots.ts` stays out of its way.
export const metadata = PRIVATE_PAGE_METADATA;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  const isLoggedIn = !!session?.session;

  if (isLoggedIn) {
    redirect("/");
  }

  const { next, error } = await searchParams;

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <LoginForm
        redirectTo={safeInternalPath(next)}
        authError={error}
        googleEnabled={googleSignInEnabled}
      />
    </div>
  );
}
