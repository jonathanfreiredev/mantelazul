import { redirect } from "next/navigation";
import { ProfileForm } from "~/components/auth/profile-form";
import { getSession } from "~/server/better-auth/server";

export default async function ProfilePage() {
  const session = await getSession();

  const isLoggedIn = !!session?.session;

  if (!isLoggedIn) {
    redirect("/");
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <ProfileForm
        user={{
          name: session?.user.name || "",
          email: session?.user.email || "",
        }}
      />
    </div>
  );
}
