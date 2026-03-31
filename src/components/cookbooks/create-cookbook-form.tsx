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
  DialogTrigger,
} from "../ui/dialog";
import { CookbookForm } from "./cookbook-form";

export const CreateCookbookForm = () => {
  const router = useRouter();

  const createCookbookMutation = api.cookbooks.create.useMutation();

  const form = useForm<z.infer<typeof cookbookSchema>>({
    resolver: zodResolver(cookbookSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(data: z.infer<typeof cookbookSchema>) {
    await createCookbookMutation.mutateAsync(data, {
      onSuccess: () => {
        toast.success("Cookbook created successfully", {
          position: "bottom-right",
        });
        router.refresh();
      },
      onError: (error) => {
        toast.error("Failed to create cookbook", {
          description: error.message,
          position: "bottom-right",
        });
      },
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Create a cookbook</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Cookbook</DialogTitle>
          <DialogDescription>
            {" "}
            Create a new cookbook to organize your recipes.
          </DialogDescription>
        </DialogHeader>

        <form id="form-create-cookbook" onSubmit={form.handleSubmit(onSubmit)}>
          <CookbookForm control={form.control} />

          <DialogClose asChild>
            <Button
              type="submit"
              form="form-create-cookbook"
              disabled={form.formState.isSubmitting}
            >
              Create Cookbook
            </Button>
          </DialogClose>
        </form>
      </DialogContent>
    </Dialog>
  );
};
