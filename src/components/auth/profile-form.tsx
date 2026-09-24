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
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";
import { ChangePasswordForm } from "./change-password-form";

export const ProfileForm = ({
  user,
  className,
  ...props
}: React.ComponentProps<"div"> & { user: { name: string; email: string } }) => {
  const t = useTranslations("ProfileForm");
  const tValidation = useTranslations("Validation");

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, { message: tValidation("nameMin") }),
        email: z.email({ message: tValidation("invalidEmail") }),
      }),
    [tValidation],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await authClient.updateUser({
      name: data.name,
      fetchOptions: {
        async onSuccess() {
          await authClient.changeEmail({
            newEmail: data.email,
            fetchOptions: {
              onError(error) {
                if (error.error.message !== "Email is the same") {
                  toast.error(t("emailErrorTitle"), {
                    description: error.error.message,
                    position: "bottom-right",
                  });
                }
              },
            },
          });

          toast.success(t("successTitle"), {
            description: t("successDescription"),
            position: "bottom-right",
          });
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
          <form id="form-profile" onSubmit={form.handleSubmit(onSubmit)}>
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
              </FieldGroup>
            </FieldSet>

            <Field>
              <Button
                type="submit"
                form="form-profile"
                disabled={form.formState.isSubmitting}
              >
                {t("submit")}
              </Button>
            </Field>
          </form>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" disabled={form.formState.isSubmitting}>
                {t("changePassword")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("changePassword")}</DialogTitle>
                <DialogDescription>
                  {t("changePasswordDescription")}
                </DialogDescription>
              </DialogHeader>

              <ChangePasswordForm />
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
};
