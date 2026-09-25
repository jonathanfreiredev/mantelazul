import { tool } from "ai";
import z from "zod";
import { getRequestLocale } from "~/server/translations/request-locale";
import { api } from "~/trpc/server";
import { formatMealPlanForModel } from "./format-recipe-for-model";

export const toolGetMealPlan = tool({
  description: `
Reads the meals already planned in the user's calendar for a date range.

Use it before planning meals, so you know what those days already contain and can tell the user.
It returns the meals shared with the user's household plus their own private ones.

RULES:
- Dates are YYYY-MM-DD and the range is inclusive. It cannot span more than 31 days; make several calls for a longer period.
- Meals are always added on top of what is already planned: this tool never removes anything.
  `,
  inputSchema: z.object({
    from: z
      .string()
      .describe("First day of the range, YYYY-MM-DD. It is required."),
    to: z
      .string()
      .describe("Last day of the range, YYYY-MM-DD. It is required."),
  }),
  execute: async ({ from, to }) => {
    const locale = await getRequestLocale();
    const { entries } = await api.mealPlan.getRange({ from, to, locale });

    return { success: true, entries };
  },
  toModelOutput: ({ output }) => ({
    type: "text",
    value: formatMealPlanForModel(output.entries),
  }),
});
