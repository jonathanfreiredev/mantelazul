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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";

export const ChangePasswordForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const t = useTranslations("ChangePasswordForm");
  const tValidation = useTranslations("Validation");

  const formSchema = useMemo(
    () =>
      z.object({
        currentPassword: z
          .string()
          .min(8, { message: tValidation("passwordMin") }),
        newPassword: z
          .string()
          .min(8, { message: tValidation("passwordMin") }),
        confirmPassword: z
          .string()
          .min(8, { message: tValidation("confirmPasswordMin") }),
      }),
    [tValidation],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const { confirmPassword, ...resetData } = data;

    if (data.newPassword !== data.confirmPassword) {
      toast.error(t("mismatchTitle"), {
        description: t("mismatchDescription"),
        position: "bottom-right",
      });
      return;
    }

    await authClient.changePassword({
      ...resetData,
      revokeOtherSessions: true,
      fetchOptions: {
        async onSuccess() {
          form.reset();
          toast.success(t("successTitle"), {
            position: "bottom-right",
          });
          window.location.reload();
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
      <form id="form-change-password" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldSet className="mb-5 w-full">
          <FieldGroup>
            <Field>
              <Controller
                name="currentPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="currentPassword">
                      {t("currentPassword")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </Field>
            <Field>
              <Field className="grid grid-cols-2 gap-4">
                <Controller
                  name="newPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="newPassword">
                        {t("newPassword")}
                      </FieldLabel>
                      <Input
                        {...field}
                        id="newPassword"
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
            form="form-change-password"
            disabled={form.formState.isSubmitting}
          >
            {t("submit")}
          </Button>
        </Field>
      </form>
    </div>
  );
};
