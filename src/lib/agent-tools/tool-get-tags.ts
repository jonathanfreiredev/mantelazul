import { tool } from "ai";
import z from "zod";
import { api } from "~/trpc/server";

export const toolGetTags = tool({
  description: `
Retrieves all the tags currently available in the app.

Use it before creating or updating a recipe to reuse existing tags instead of inventing
new ones. It takes no input.

NOTE: The tags stored in the app are the ones returned by this tool, so prefer them when
they fit what the user asked for.
  `,
  inputSchema: z.object({}).strict(),
  execute: async () => {
    console.log("Executing toolGetTags to retrieve all available tags...");
    const tags = await api.tags.getAll();

    return {
      success: true,
      message: "Tags retrieved successfully",
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
      })),
    };
  },
  toModelOutput: ({ output }) => ({
    type: "text",
    value:
      output.tags.length > 0
        ? `Available tags: ${output.tags.map((tag) => tag.name).join(", ")}`
        : "No tags available yet.",
  }),
});
