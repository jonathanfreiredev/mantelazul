"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Link, useRouter } from "~/i18n/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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

export const LoginForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const t = useTranslations("LoginForm");
  const tValidation = useTranslations("Validation");
  const router = useRouter();

  const formSchema = useMemo(
    () =>
      z.object({
        email: z.email({ message: tValidation("invalidEmail") }),
        password: z.string().min(8, { message: tValidation("passwordMin") }),
      }),
    [tValidation],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await authClient.signIn.email({
      ...data,
      rememberMe: true,
      fetchOptions: {
        onSuccess() {
          toast.success(t("successTitle"), {
            description: t("successDescription"),
            position: "bottom-right",
          });
          form.reset();

          router.replace("/");
          router.refresh();
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
        <CardContent>
          <form id="form-login" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldSet className="mb-5 w-full">
              <FieldGroup>
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

                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="off"
                        required
                      />
                      <FieldDescription>{t("passwordHint")}</FieldDescription>

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            <Field>
              <div className="mb-2 flex justify-end">
                <Button
                  variant="link"
                  onClick={() => {
                    form.reset();
                  }}
                  disabled={form.formState.isSubmitting}
                  asChild
                >
                  <Link href="/forgot-password">{t("forgotPassword")}</Link>
                </Button>
              </div>
            </Field>

            <Field>
              <Button
                type="submit"
                form="form-login"
                disabled={form.formState.isSubmitting}
              >
                {t("submit")}
              </Button>

              <FieldDescription className="text-center">
                {t("noAccount")}{" "}
                <Link href="/signup">
                  <Button
                    variant="link"
                    onClick={() => {
                      form.reset();
                    }}
                    disabled={form.formState.isSubmitting}
                  >
                    {t("signUp")}
                  </Button>
                </Link>
              </FieldDescription>
            </Field>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
