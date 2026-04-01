import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "~/components/auth/forgot-password-form";
import { ResetPasswordForm } from "~/components/auth/reset-password-form";
import { getSession } from "~/server/better-auth/server";

interface ForgotPasswordPageProps {
  searchParams: {
    token?: string;
  };
}

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
