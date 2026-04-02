"use client";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useRouter } from "next/navigation";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Confirm Password must be at least 8 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
  });

export const ResetPasswordForm = ({
  token,
  className,
  ...props
}: React.ComponentProps<"div"> & { token: string }) => {
  const router = useRouter();
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
      toast.error("Passwords do not match!", {
        description: "Please make sure your passwords match.",
        position: "bottom-right",
      });
      return;
    }

    await authClient.resetPassword({
      newPassword: password,
      token,
      fetchOptions: {
        async onSuccess() {
          toast.success("Password reset successfully!", {
            position: "bottom-right",
          });
          form.reset();
          router.replace("/login");
          router.refresh();
        },
        onError(error) {
          toast.error("Failed to reset password!", {
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
          <CardTitle className="text-xl">Reset password</CardTitle>
          <CardDescription>
            Enter your new password below to reset your password.
          </CardDescription>
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
                          <FieldLabel htmlFor="password">Password</FieldLabel>
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
                            Confirm Password
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
                  <FieldDescription>
                    Must be at least 8 characters long.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>

            <Field>
              <Button
                type="submit"
                form="form-reset-password"
                disabled={form.formState.isSubmitting}
              >
                Reset Password
              </Button>
            </Field>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
