import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "~/components/auth/forgot-password-form";
import { ResetPasswordForm } from "~/components/auth/reset-password-form";
import { PRIVATE_PAGE_METADATA } from "~/lib/seo/metadata";
import { getSession } from "~/server/better-auth/server";

interface ForgotPasswordPageProps {
  searchParams: {
    token?: string;
  };
}

// Recovering an account is not something anyone should arrive at from a search result. The page
// is kept crawlable on purpose so this directive can be read.
export const metadata = PRIVATE_PAGE_METADATA;

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const [{ token }, session] = await Promise.all([searchParams, getSession()]);

  const isLoggedIn = !!session?.session;

  if (isLoggedIn) {
    redirect("/");
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      {token ? <ResetPasswordForm token={token} /> : <ForgotPasswordForm />}
    </div>
  );
}
