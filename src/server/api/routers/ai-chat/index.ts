import z from "zod";
import type { MyAgentUIMessage } from "~/lib/agent";
import { loadChatMessages } from "~/lib/chat-history";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const aiChatRouter = createTRPCRouter({
  getMessages: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
      }),
    )
    .query(
      async ({
        ctx,
        input: { chatId },
      }): Promise<{ messages: MyAgentUIMessage[] }> => {
        const chat = await ctx.db.chat.findFirst({
          where: { id: chatId, userId: ctx.session.user.id },
        });

        if (!chat) {
          return { messages: [] };
        }

        return { messages: await loadChatMessages(chat.id) };
      },
    ),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    const chat = await ctx.db.chat.findFirst({
      where: { userId: ctx.session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    if (!chat) {
      return { success: false, message: "No chat found to delete" };
    }

    await ctx.db.chat.delete({ where: { id: chat.id } });

    return { success: true };
  }),

  getChatId: protectedProcedure.query(async ({ ctx }) => {
    const chat = await ctx.db.chat.findFirst({
      where: { userId: ctx.session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    return { chatId: chat ? chat.id : null };
  }),
});
