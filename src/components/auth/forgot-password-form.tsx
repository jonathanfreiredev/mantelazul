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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";

export const ForgotPasswordForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const t = useTranslations("ForgotPasswordForm");
  const tValidation = useTranslations("Validation");

  const formSchema = useMemo(
    () =>
      z.object({
        email: z.email({ message: tValidation("invalidEmail") }),
      }),
    [tValidation],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await authClient.requestPasswordReset({
      ...data,
      redirectTo:
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000/forgot-password"
          : "https://mantelazul.com/forgot-password",
      fetchOptions: {
        async onSuccess() {
          toast.success(t("successTitle"), {
            position: "bottom-right",
          });
          form.reset();
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
          <form id="form-reset-link" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldSet className="mb-5 w-full">
              <FieldGroup>
                <Field>
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

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>

            <Field>
              <Button
                type="submit"
                form="form-reset-link"
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
