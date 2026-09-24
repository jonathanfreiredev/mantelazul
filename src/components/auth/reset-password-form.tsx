"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
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
import { useRouter } from "~/i18n/navigation";

export const ResetPasswordForm = ({
  token,
  className,
  ...props
}: React.ComponentProps<"div"> & { token: string }) => {
  const t = useTranslations("ResetPasswordForm");
  const tValidation = useTranslations("Validation");
  const router = useRouter();

  const formSchema = useMemo(
    () =>
      z
        .object({
          password: z
            .string()
            .min(8, { message: tValidation("passwordMin") }),
          confirmPassword: z
            .string()
            .min(8, { message: tValidation("confirmPasswordMin") }),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: tValidation("passwordsDoNotMatch"),
        }),
    [tValidation],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const { confirmPassword, password } = data;

    if (password !== confirmPassword) {
      toast.error(t("mismatchTitle"), {
        description: t("mismatchDescription"),
        position: "bottom-right",
      });
      return;
    }

    await authClient.resetPassword({
      newPassword: password,
      token,
      fetchOptions: {
        async onSuccess() {
          toast.success(t("successTitle"), {
            position: "bottom-right",
          });
          form.reset();
          router.replace("/login");
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
          <form id="form-reset-password" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldSet className="mb-5 w-full">
              <FieldGroup>
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
              </FieldGroup>
            </FieldSet>

            <Field>
              <Button
                type="submit"
                form="form-reset-password"
                disabled={form.formState.isSubmitting}
              >
                {t("submit")}
              </Button>
            </Field>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
