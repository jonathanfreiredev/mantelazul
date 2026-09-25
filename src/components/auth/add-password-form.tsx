"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "~/trpc/react";
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

interface AddPasswordFormProps {
  onAdded: () => void;
}

/**
 * Gives a password to an account that signed up with a provider, so it can sign in either way.
 * Better Auth keeps the endpoint server-side only, hence the tRPC mutation.
 */
export function AddPasswordForm({ onAdded }: AddPasswordFormProps) {
  const t = useTranslations("AddPasswordForm");
  const tValidation = useTranslations("Validation");
  const utils = api.useUtils();

  const formSchema = useMemo(
    () =>
      z.object({
        newPassword: z.string().min(8, { message: tValidation("passwordMin") }),
        confirmPassword: z
          .string()
          .min(8, { message: tValidation("confirmPasswordMin") }),
      }),
    [tValidation],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const setPassword = api.users.setPassword.useMutation({
    async onSuccess() {
      form.reset();
      await utils.users.getLinkedAccounts.invalidate();
      toast.success(t("successTitle"), { position: "bottom-right" });
      onAdded();
    },
    onError(error) {
      toast.error(t("errorTitle"), {
        description: error.message,
        position: "bottom-right",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (data.newPassword !== data.confirmPassword) {
      toast.error(t("mismatchTitle"), {
        description: t("mismatchDescription"),
        position: "bottom-right",
      });
      return;
    }

    setPassword.mutate({ newPassword: data.newPassword });
  }

  return (
    <form id="form-add-password" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet className="mb-5 w-full">
        <FieldGroup>
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
                      autoComplete="new-password"
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
                    <FieldLabel htmlFor="confirmNewPassword">
                      {t("confirmPassword")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="confirmNewPassword"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
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
          form="form-add-password"
          disabled={setPassword.isPending}
        >
          {t("submit")}
        </Button>
      </Field>
    </form>
  );
}
