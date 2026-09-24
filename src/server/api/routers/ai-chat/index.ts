import type { MyAgentUIMessage } from "~/lib/agent";
import { sanitizeInterruptedToolParts } from "~/lib/chat-message-parts";
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
      }): Promise<{ messages: MyAgentUIMessage[] }> => {
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
          // Repair messages saved by an older, interrupted stream so they render and can be
          // sent back to the model.
          parts: sanitizeInterruptedToolParts(
            JSON.parse(msg.content),
          ) as MyAgentUIMessage["parts"],
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
