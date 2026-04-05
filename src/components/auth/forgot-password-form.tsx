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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";

const formSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }),
});

export const ForgotPasswordForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
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
          toast.success("Password reset email sent!", {
            position: "bottom-right",
          });
          form.reset();
        },
        onError(error) {
          toast.error("Failed to send password reset email!", {
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
          <CardTitle className="text-xl">Forgot password</CardTitle>
          <CardDescription>
            Enter your email address below to receive a password reset link.
          </CardDescription>
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
                        <FieldLabel htmlFor="email">Email</FieldLabel>
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
                Send reset link
              </Button>
            </Field>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
