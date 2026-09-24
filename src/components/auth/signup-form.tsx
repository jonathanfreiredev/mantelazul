"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useRouter } from "~/i18n/navigation";
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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("SignupForm");
  const tValidation = useTranslations("Validation");
  const router = useRouter();

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
