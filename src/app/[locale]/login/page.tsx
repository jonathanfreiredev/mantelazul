import { redirect } from "next/navigation";
import { LoginForm } from "~/components/auth/login-form";
import { getSession } from "~/server/better-auth/server";

export default async function LoginPage() {
  const session = await getSession();

  const isLoggedIn = !!session?.session;

  if (isLoggedIn) {
    redirect("/");
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <LoginForm />
    </div>
  );
}
