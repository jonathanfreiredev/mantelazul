import { redirect } from "next/navigation";
import { DeleteAccountCard } from "~/components/auth/delete-account-card";
import { ProfileForm } from "~/components/auth/profile-form";
import { getSession } from "~/server/better-auth/server";

export default async function ProfilePage() {
  const session = await getSession();

  const isLoggedIn = !!session?.session;

  if (!isLoggedIn) {
    redirect("/");
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center p-6 md:p-10">
      <div className="my-auto flex w-full max-w-125 flex-col gap-6">
        <ProfileForm
          user={{
            name: session?.user.name || "",
            email: session?.user.email || "",
          }}
        />
        <DeleteAccountCard />
      </div>
    </div>
  );
}
