import z from "zod";
import { createTRPCRouter, publicProcedure } from "../../trpc";

export const usersRouter = createTRPCRouter({
  getAuthor: publicProcedure
    .input(
      z.object({
        authorId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const author = await ctx.db.user.findUnique({
        where: { id: input.authorId },
        select: {
          id: true,
          name: true,
        },
      });

      if (!author) {
        throw new Error("Author not found");
      }

      return author;
    }),
});
