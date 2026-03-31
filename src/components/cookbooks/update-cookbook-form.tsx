"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cookbookSchema } from "~/server/api/routers/cookbooks/validation";
import { api } from "~/trpc/react";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { CookbookForm } from "./cookbook-form";
import type { Cookbook } from "generated/prisma/client";

interface UpdateCookbookFormProps {
  cookbook: Cookbook;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdateCookbookForm = ({
  cookbook,
  open,
  onOpenChange,
}: UpdateCookbookFormProps) => {
  const router = useRouter();

  const createCookbookMutation = api.cookbooks.update.useMutation();

  const form = useForm<z.infer<typeof cookbookSchema>>({
    resolver: zodResolver(cookbookSchema),
    defaultValues: {
      name: cookbook.name,
    },
  });

  async function onSubmit(data: z.infer<typeof cookbookSchema>) {
    await createCookbookMutation.mutateAsync(
      {
        id: cookbook.id,
        name: data.name,
      },
      {
        onSuccess: () => {
          toast.success("Cookbook updated successfully", {
            position: "bottom-right",
          });
          router.refresh();
        },
        onError: (error) => {
          toast.error("Failed to update cookbook", {
            description: error.message,
            position: "bottom-right",
          });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update cookbook</DialogTitle>
          <DialogDescription>
            Update the name of your cookbook to keep it organized.
          </DialogDescription>
        </DialogHeader>

        <form id="form-update-cookbook" onSubmit={form.handleSubmit(onSubmit)}>
          <CookbookForm control={form.control} />

          <DialogClose asChild>
            <Button
              type="submit"
              form="form-update-cookbook"
              disabled={form.formState.isSubmitting}
            >
              Update Cookbook
            </Button>
          </DialogClose>
        </form>
      </DialogContent>
    </Dialog>
  );
};
