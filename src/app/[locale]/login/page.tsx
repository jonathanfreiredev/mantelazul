import { redirect } from "next/navigation";
import { LoginForm } from "~/components/auth/login-form";
import { safeInternalPath } from "~/lib/safe-redirect";
import { getSession } from "~/server/better-auth/server";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  const isLoggedIn = !!session?.session;

  if (isLoggedIn) {
    redirect("/");
  }

  const { next } = await searchParams;

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <LoginForm redirectTo={safeInternalPath(next)} />
    </div>
  );
}
