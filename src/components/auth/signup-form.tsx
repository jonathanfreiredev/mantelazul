"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "~/i18n/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { verificationCallbackUrl } from "~/lib/email-verification";
import { cn } from "~/lib/utils";
import { authClient } from "~/server/better-auth/client";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";
import { OAuthError } from "./oauth-error";
import { ResendVerificationButton } from "./resend-verification-button";
import { SocialSignIn } from "./social-sign-in";

interface SignupFormProps extends React.ComponentProps<"div"> {
  /** Where to land after signing up, e.g. an invitation page. Defaults to the home page. */
  redirectTo?: string;
  /** Error code the provider callback sent back, if the sign-up was not completed. */
  authError?: string;
  /** Whether Google sign-in is configured. */
  googleEnabled?: boolean;
}

export function SignupForm({
  className,
  redirectTo,
  authError,
  googleEnabled,
  ...props
}: SignupFormProps) {
  const t = useTranslations("SignupForm");
  const tValidation = useTranslations("Validation");
  const locale = useLocale();

  // Set once the account is created: signing up no longer opens a session, so the form gives way
  // to "go confirm your address".
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, { message: tValidation("nameMin") }),
        email: z.email({ message: tValidation("invalidEmail") }),
        password: z.string().min(8, { message: tValidation("passwordMin") }),
        confirmPassword: z
          .string()
          .min(8, { message: tValidation("confirmPasswordMin") }),
      }),
    [tValidation],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const { confirmPassword, ...signupData } = data;

    if (data.password !== data.confirmPassword) {
      toast.error(t("mismatchTitle"), {
        description: t("mismatchDescription"),
        position: "bottom-right",
      });
      return;
    }

    await authClient.signUp.email({
      ...signupData,
      // Where the link in the verification email lands. The session does not exist yet, so the
      // verification is what brings the user in.
      callbackURL: verificationCallbackUrl(
        window.location.origin,
        locale,
        redirectTo,
      ),
      fetchOptions: {
        onSuccess() {
          form.reset();
          setSubmittedEmail(signupData.email);
        },
        onError(error) {
          toast.error(t("errorTitle"), {
            description: error.error.message,
            position: "bottom-right",
          });
        },
      },
    });
  }

  if (submittedEmail) {
    return (
      <div
        className={cn("flex w-full max-w-125 flex-col gap-6", className)}
        {...props}
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t("checkEmailTitle")}</CardTitle>
            <CardDescription>
              {t("checkEmailDescription", { email: submittedEmail })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ResendVerificationButton
              email={submittedEmail}
              redirectTo={redirectTo}
            />
            <FieldDescription>
              {t("alreadyHaveAccount")}{" "}
              <Link
                href={
                  redirectTo
                    ? `/login?next=${encodeURIComponent(redirectTo)}`
                    : "/login"
                }
                className="underline"
              >
                {t("logIn")}
              </Link>
            </FieldDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn("flex w-full max-w-125 flex-col gap-6", className)}
      {...props}
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <OAuthError code={authError} />
          <SocialSignIn redirectTo={redirectTo} enabled={googleEnabled} />
          <form id="form-signup" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldSet className="mb-5 w-full">
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="name">{t("name")}</FieldLabel>
                      <Input
                        {...field}
                        id="name"
                        type="text"
                        autoComplete="off"
                        placeholder="John Doe"
                        required
                      />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        autoComplete="off"
                        placeholder="joe@example.com"
                        required
                      />
                      <FieldDescription>{t("emailHint")}</FieldDescription>

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Field>
                  <Field className="grid grid-cols-2 gap-4">
                    <Controller
                      name="password"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="password">
                            {t("password")}
                          </FieldLabel>
                          <Input
                            {...field}
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="off"
                            required
                          />

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="confirmPassword"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="confirmPassword">
                            {t("confirmPassword")}
                          </FieldLabel>
                          <Input
                            {...field}
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="off"
                            required
                          />

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </Field>
                  <FieldDescription>{t("passwordHint")}</FieldDescription>
                </Field>
                <Field>
                  <Button
                    type="submit"
                    form="form-signup"
                    disabled={form.formState.isSubmitting}
                  >
                    {t("submit")}
                  </Button>
                </Field>
              </FieldGroup>
            </FieldSet>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
