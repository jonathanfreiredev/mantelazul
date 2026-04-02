import { tool } from "ai";
import z from "zod";
import { api } from "~/trpc/server";

export const toolGetTags = tool({
  description: `
Retrieves all available tags that can be associated with a recipe. 
This tool can be used to get the tags before creating the recipe.
This tool can also be used to provide the user with options for categorizing their recipe based on predefined tags in the system.

IMPORTANT: This tool does not take any input, it simply returns the list of tags available in the system.
  `,
  inputSchema: z.object({}),
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
});
