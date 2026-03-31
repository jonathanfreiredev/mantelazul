import type { Cookbook } from "generated/prisma/client";

export type CookbookDto = Cookbook & {
  images: string[];
};
