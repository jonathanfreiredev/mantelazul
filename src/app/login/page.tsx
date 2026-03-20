import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "~/components/login-form";
import { auth } from "~/server/better-auth";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const isLoggedIn = !!session?.session;

  if (isLoggedIn) {
    redirect("/");
  }

  return (
    <main className="">
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <LoginForm />
      </div>
    </main>
  );
}
