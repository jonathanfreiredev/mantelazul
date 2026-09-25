import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { safeInternalPath } from "~/lib/safe-redirect";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface VerifyEmailPageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

/**
 * Where the link in the verification email lands. On success Better Auth has already signed the
 * user in (`autoSignInAfterVerification`), so all that is left is pointing them at their
 * destination; on failure it redirects here with an `error` code.
 */
export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { error, next } = await searchParams;
  const t = await getTranslations("EmailVerification");
  const destination = safeInternalPath(next);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center p-6 md:p-10">
      <div className="my-auto flex w-full max-w-125 flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {error ? t("errorTitle") : t("verifiedTitle")}
            </CardTitle>
            <CardDescription>
              {error ? t("errorDescription") : t("verifiedDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {error ? (
              <Button asChild>
                <Link href="/login">{t("goToLogin")}</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href={destination ?? "/"}>{t("continue")}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
