import { redirect } from "next/navigation";
import { SignupForm } from "~/components/auth/signup-form";
import { safeInternalPath } from "~/lib/safe-redirect";
import { PRIVATE_PAGE_METADATA } from "~/lib/seo/metadata";
import { googleSignInEnabled } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";

interface SignupPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

// Signing up is not something anyone should arrive at from a search result. The page is kept
// crawlable on purpose so this directive can be read, and `robots.ts` stays out of its way.
export const metadata = PRIVATE_PAGE_METADATA;

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const session = await getSession();

  const isLoggedIn = !!session?.session;

  if (isLoggedIn) {
    redirect("/");
  }

  const { next, error } = await searchParams;

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <SignupForm
        redirectTo={safeInternalPath(next)}
        authError={error}
        googleEnabled={googleSignInEnabled}
      />
    </div>
  );
}
