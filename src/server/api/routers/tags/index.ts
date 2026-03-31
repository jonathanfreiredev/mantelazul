import { createTRPCRouter, publicProcedure } from "../../trpc";

export const tagsRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.tag.findMany();
  }),
});
