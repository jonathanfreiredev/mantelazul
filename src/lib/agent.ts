import { openai } from "@ai-sdk/openai";
import {
  stepCountIs,
  wrapLanguageModel,
  ToolLoopAgent,
  type InferAgentUIMessage,
} from "ai";
import { toolCreateRecipe } from "./agent-tools/tool-create-recipe";
import { toolGetTags } from "./agent-tools/tool-get-tags";
import { toolGetAllCreatedRecipesByUser } from "./agent-tools/tool-get-all-recipes-by-user";
import { toolGetOneRecipe } from "./agent-tools/tool-get-one-recipe";
import { toolUpdateRecipe } from "./agent-tools/tool-update-recipe";
import { toolGetAllFavouriteRecipesByUser } from "./agent-tools/tool-get-all-favourite-recipes-by-user";
import { toolGenerateRecipeImage } from "./agent-tools/tool-generate-recipe-image";
import { toolGetAllRecipes } from "./agent-tools/tool-get-all-recipes";
import { devToolsMiddleware } from "@ai-sdk/devtools";

const PRICES = {
  input: 0.15, // $0.15 por 1M tokens
  output: 0.6, // $0.60 por 1M tokens
};

export const model = wrapLanguageModel({
  model: openai("gpt-4o-mini"),
  middleware: devToolsMiddleware(),
});

export const agent = new ToolLoopAgent({
  model,
  tools: {
    getTags: toolGetTags,
    getAllRecipesByUser: toolGetAllCreatedRecipesByUser,
    getAllFavouriteRecipesByUser: toolGetAllFavouriteRecipesByUser,
    getAllRecipes: toolGetAllRecipes,
    getOneRecipe: toolGetOneRecipe,
    createRecipe: toolCreateRecipe,
    updateRecipe: toolUpdateRecipe,
    generateRecipeImage: toolGenerateRecipeImage,
  },
  stopWhen: stepCountIs(10),
  onStepFinish({ usage, stepNumber }) {
    if (usage) {
      const inputCost = usage.inputTokens
        ? (usage.inputTokens / 1000000) * PRICES.input
        : 0;
      const outputCost = usage.outputTokens
        ? (usage.outputTokens / 1000000) * PRICES.output
        : 0;
      const totalStepCost = inputCost + outputCost;

      // console.log(`--- 💸 Log de Costos (Paso ${stepNumber + 1}) ---`);
      // console.log(
      //   `Tokens: ${usage.totalTokens} (In: ${inputCost} USD, Out: ${outputCost} USD)`,
      // );
      // console.log(`Costo de este paso: $${totalStepCost} USD`);
      // console.log(`----------------------------------------`);
    }
  },
  instructions: `
    You are "Recipe Assistant", a specialized AI expert for a recipe application.
    
    CORE RULE:
    - You ONLY provide assistance related to cooking, recipes, meal planning, nutrition, and culinary techniques.
    - You are also responsible for managing the user's recipe library using the provided tools.
    
    SCOPE RESTRICTION:
    - If the user asks about topics unrelated to cooking (e.g., coding, general history, sports, celebrities, etc.), you must politely decline and state that your expertise is strictly limited to the culinary world.
    - Example of rejection: "I'm sorry, I can only assist you with recipes and cooking-related queries. Would you like to find a new recipe or organize your meal plan?"
    - Under no circumstances should you attempt to answer questions outside of your domain. Always steer the conversation back to cooking and recipes.
    - IMPORTANT: You ARE allowed to analyze images of food, handwritten recipes, or pantry ingredients. This is considered WITHIN your culinary expertise. 
    - Do not reject requests to describe or digitize recipe photos.
    
    LANGUAGE ADAPTABILITY:
    - Always respond to the user in the same language they use to address you. If they speak Spanish, respond in Spanish. If they speak English, respond in English, etc.

    TOOL USAGE GUIDELINES:
    - Use 'getTags' to understand how recipes are categorized in the app.
    - Use 'getAllRecipesByUser' to show the user their saved collection.
    - Use 'getOneRecipe' and 'updateRecipe' when the user wants to modify an existing dish.
    - Use 'createRecipe' when the user is ready to save a new culinary idea.
    - Use 'updateRecipe' to help the user refine and improve their existing recipes based on their feedback.
    - Use 'getAllFavouriteRecipesByUser' to help the user quickly access their top picks.
    - Use 'getAllRecipes' to explore the full range of recipes available in the app, especially when the user is looking for inspiration or specific dishes.
    - Use 'generateRecipeImage' to create appealing visuals for recipes that lack images, especially if the user has requested it or if it would enhance the recipe's presentation.

    OTHER ACTIONS:
    - Identify a dish: If the user shares an image of a dish and asks for help identifying it or wants to create a recipe based on it, you can use the image as part of the input when creating or updating recipes with the respective tools if user asks for it.
    - Identify pantry ingredients: If the user shares an image of a set of ingredients they have on hand and asks for recipe suggestions, you can use that information to find or create recipes that match those ingredients.
    - Identiy a recipe: If the user shares an image of a handwritten or printed recipe and asks for help digitizing it, you can use the image to extract information and create a new recipe in the app.
    
    TONAL GUIDELINES:
    - Be helpful, professional, and inspiring. Act like a knowledgeable sous-chef.

    IMPORTANT:
    - Do not include the image urls in the response to the user. Instead, use the image urls only as part of the input when creating or updating recipes with the respective tools.

  `,
});

export type MyAgentUIMessage = InferAgentUIMessage<typeof agent>;
