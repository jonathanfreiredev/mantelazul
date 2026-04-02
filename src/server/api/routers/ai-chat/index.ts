import type { ReasoningUIPart } from "ai";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import z from "zod";

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
      }): Promise<{
        messages: {
          id: string;
          role: "system" | "user" | "assistant";
          parts: ReasoningUIPart[];
        }[];
      }> => {
        const chat = await ctx.db.chat.findFirst({
          where: { id: chatId, userId: ctx.session?.user.id },
        });

        if (!chat) {
          return { messages: [] };
        }

        const messages = await ctx.db.message.findMany({
          where: { chatId: chat.id },
          orderBy: { createdAt: "asc" },
        });

        const uiMessages = messages.map((msg) => ({
          id: msg.id,
          role: msg.role.toLowerCase() as "system" | "user" | "assistant",
          parts: JSON.parse(msg.content),
        }));

        return { messages: uiMessages };
      },
    ),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    const chat = await ctx.db.chat.findFirst({
      where: { userId: ctx.session?.user.id },
    });

    if (!chat) {
      return { success: false, message: "No chat found to delete" };
    }

    await ctx.db.chat.delete({ where: { id: chat.id } });

    return { success: true };
  }),

  getChatId: protectedProcedure.query(async ({ ctx }) => {
    const chat = await ctx.db.chat.findFirst({
      where: { userId: ctx.session?.user.id },
    });

    return { chatId: chat ? chat.id : null };
  }),
});
