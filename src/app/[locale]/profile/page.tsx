import { redirect } from "next/navigation";
import { AccessAccountsCard } from "~/components/auth/access-accounts-card";
import { DeleteAccountCard } from "~/components/auth/delete-account-card";
import { ProfileForm } from "~/components/auth/profile-form";
import { googleSignInEnabled } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";

interface ProfilePageProps {
  /** Error code the provider callback sent back, if connecting an account failed. */
  searchParams: Promise<{ error?: string }>;
}

export default async function ProfilePage({
  searchParams,
}: ProfilePageProps) {
  const session = await getSession();

  const isLoggedIn = !!session?.session;

  if (!isLoggedIn) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center p-6 md:p-10">
      <div className="my-auto flex w-full max-w-125 flex-col gap-6">
        <ProfileForm
          user={{
            name: session?.user.name || "",
            email: session?.user.email || "",
          }}
        />
        <AccessAccountsCard
          googleEnabled={googleSignInEnabled}
          email={session?.user.email || ""}
          authError={error}
        />
        <DeleteAccountCard />
      </div>
    </div>
  );
}
