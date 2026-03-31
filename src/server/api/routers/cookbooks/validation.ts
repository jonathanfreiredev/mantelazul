import z from "zod";

export const cookbookSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
});
