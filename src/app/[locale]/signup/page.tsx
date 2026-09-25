import { redirect } from "next/navigation";
import { SignupForm } from "~/components/auth/signup-form";
import { safeInternalPath } from "~/lib/safe-redirect";
import { getSession } from "~/server/better-auth/server";

interface SignupPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const session = await getSession();

  const isLoggedIn = !!session?.session;

  if (isLoggedIn) {
    redirect("/");
  }

  const { next } = await searchParams;

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <SignupForm redirectTo={safeInternalPath(next)} />
    </div>
  );
}
