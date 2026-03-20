"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "~/lib/utils";
import { authClient } from "~/server/better-auth/client";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "./ui/field";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import type { Label } from "radix-ui";
import { ChangePasswordForm } from "./change-password-form";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.email({ message: "Please enter a valid email address" }),
});

export const ProfileForm = ({
  user,
  className,
  ...props
}: React.ComponentProps<"div"> & { user: { name: string; email: string } }) => {
  const [openedChangePassword, setOpenedChangePassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    // Do something with the form values.
    await authClient.updateUser({
      name: data.name,
      fetchOptions: {
        async onSuccess() {
          await authClient.changeEmail({
            newEmail: data.email,
            fetchOptions: {
              onError(error) {
                console.error(error);
                if (error.error.message !== "Email is the same") {
                  toast.error("Failed to update email!", {
                    description: error.error.message,
                    position: "bottom-right",
                  });
                }
              },
            },
          });

          toast.success("Profile updated successfully!", {
            description: "Your profile information has been updated.",
            position: "bottom-right",
          });
        },
        onError(error) {
          toast.error("Failed to update profile!", {
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
          <CardTitle className="text-xl">My Profile</CardTitle>
          <CardDescription>
            Update your profile information, such as your name and email.
          </CardDescription>
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
                      <FieldLabel htmlFor="name">Name</FieldLabel>
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
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="jonathan@example.com"
                        required
                      />
                      <FieldDescription>
                        Choose a unique email for your account.
                      </FieldDescription>

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
                Update Profile
              </Button>
            </Field>
          </form>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Dialog
            open={openedChangePassword}
            onOpenChange={setOpenedChangePassword}
          >
            <DialogTrigger asChild>
              <Button variant="link" disabled={form.formState.isSubmitting}>
                Change password
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Change password</DialogTitle>
                <DialogDescription>
                  Enter your new password below to change your password.
                </DialogDescription>
              </DialogHeader>

              <ChangePasswordForm
                handleClose={() => {
                  setOpenedChangePassword(false);
                  window.location.reload();
                }}
              />
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
};
