import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import z from "zod";
import {
  resolveUsagesByName,
  type IngredientUsage,
} from "~/lib/step-ingredients";

const model = openai("gpt-6-luna");

const SYSTEM_PROMPT = `You read a cooking recipe and work out which ingredients each step consumes.

For every step you receive, list the ingredients that step actually uses, using their exact names.

Rules:
- Use the exact ingredient name, copied from the list you are given. Never invent a name.
- Always write both "part" and "of", even for the whole ingredient: write 1 and 1 when the step
  uses all of it.
- An ingredient belongs to the step that actually uses it up, and only to that step. A later step
  that mixes, assembles or plates what is already prepared takes nothing from it: the potatoes
  fried in step 5 are the potatoes peeled in step 1, so only one of the two lists them. A step
  that only combines what is ready gets an empty list.
- When a step does take only part of an ingredient, give the share as a fraction: half is part 1,
  of 2; two thirds is part 2, of 3. Never write a decimal. Between them, the steps that take part
  of an ingredient must add up to the whole and never more.
- Read the step text: if it says "add the rest of the tomatoes" or "half the flour", that is what
  the share has to reflect.
- Ingredients with no amount, like salt or pepper, are listed the same way, by name, with part 1
  and of 1.
- Leave out an ingredient that no step mentions.
- Return exactly one entry per step, in the same order you receive them, even when a step uses
  nothing: in that case return an empty list. Never merge, split or reorder steps.`;

const inferredSchema = z.object({
  steps: z.array(
    z.object({
      ingredients: z.array(
        z.object({
          name: z.string().trim().min(1),
          // Required rather than optional: OpenAI's strict structured output rejects a schema
          // whose properties are not all required, so "the whole ingredient" is written 1/1.
          part: z.int().positive(),
          of: z.int().positive(),
        }),
      ),
    }),
  ),
});

export interface StepIngredientSuggestion {
  stepOrder: number;
  ingredientUsages: IngredientUsage[];
}

/**
 * Works out which ingredients each step of a recipe consumes.
 *
 * Used by the editor's "suggest" button and by the backfill script, so an existing recipe can get
 * its assignments filled in without anyone typing them. It only proposes: nothing is written
 * here, and the author reviews the result before saving.
 *
 * One call per recipe, never one per step.
 */
export async function inferStepIngredients({
  ingredients,
  steps,
}: {
  ingredients: { order: number; name: string }[];
  steps: { order: number; description: string }[];
}): Promise<StepIngredientSuggestion[]> {
  const { object } = await generateObject({
    model,
    schema: inferredSchema,
    system: SYSTEM_PROMPT,
    prompt: [
      "Ingredients:",
      ...ingredients.map(
        (ingredient) => `- ${ingredient.name} (order ${ingredient.order})`,
      ),
      "",
      "Steps, in order:",
      ...steps.map((step, index) => `${index + 1}) ${step.description}`),
    ].join("\n"),
  });

  if (object.steps.length !== steps.length) {
    throw new Error(
      `The model returned ${object.steps.length} steps for a recipe with ${steps.length}.`,
    );
  }

  return steps.map((step, index) => ({
    stepOrder: step.order,
    ingredientUsages: resolveUsagesByName(
      object.steps[index]?.ingredients ?? [],
      ingredients,
    ),
  }));
}
