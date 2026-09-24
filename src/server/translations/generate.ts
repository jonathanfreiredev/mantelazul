import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { LOCALES, type Locale } from "~/lib/locales";
import { recipeTranslationsSchema } from "./schema";
import type { RecipeTranslationContent, RecipeTranslations } from "./types";

const translationModel = openai("gpt-6-luna");

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Spanish",
  de: "German",
};

const SYSTEM_PROMPT = `You translate cooking recipes.

You receive one recipe written in a source language and you must return the exact same recipe
in every supported language.

Rules:
- Translate the title, the description, the names of the ingredients and the step descriptions.
- NEVER add, remove or merge ingredients or steps. Every language must keep exactly the same
  number of entries, in the same order, with the same "order" values.
- Keep culinary terminology accurate and natural for each language. Do not add notes, comments
  or explanations.
- Do not translate brand names or proper nouns.
- The source language is authoritative: reproduce its text verbatim for its own language.`;

const USER_PROMPT_TEMPLATE = (sourceLocale: Locale, content: unknown) =>
  `Source language: ${LANGUAGE_NAMES[sourceLocale]} (${sourceLocale}).

Return the recipe in all of these languages: ${LOCALES.map(
    (locale) => `${LANGUAGE_NAMES[locale]} (${locale})`,
  ).join(", ")}.

Recipe:
${JSON.stringify(content, null, 2)}`;

/**
 * Generates every locale of a recipe from its authoritative source text.
 *
 * The source content is restored verbatim afterwards, so the author's own words are never
 * altered by a translation round-trip. The structure (amount and order of ingredients and
 * steps) is validated before returning: a translation that changes it is rejected.
 */
export async function generateRecipeTranslations(input: {
  sourceLocale: Locale;
  content: RecipeTranslationContent;
}): Promise<RecipeTranslations> {
  const { sourceLocale, content } = input;

  const { object } = await generateObject({
    model: translationModel,
    schema: recipeTranslationsSchema,
    system: SYSTEM_PROMPT,
    prompt: USER_PROMPT_TEMPLATE(sourceLocale, content),
  });

  const translations = object as RecipeTranslations;
  translations[sourceLocale] = content;

  for (const locale of LOCALES) {
    const translated = translations[locale];
    if (!translated) {
      throw new Error(`The model did not return a "${locale}" translation.`);
    }
    assertSameStructure(content, translated, locale);
  }

  return translations;
}

function assertSameStructure(
  source: RecipeTranslationContent,
  translated: RecipeTranslationContent,
  locale: Locale,
): void {
  const sameShape =
    source.ingredients.length === translated.ingredients.length &&
    source.steps.length === translated.steps.length &&
    source.ingredients.every(
      (ingredient, index) =>
        translated.ingredients[index]?.order === ingredient.order,
    ) &&
    source.steps.every(
      (step, index) => translated.steps[index]?.order === step.order,
    );

  if (!sameShape) {
    throw new Error(
      `The generated "${locale}" translation does not match the source structure ` +
        `(expected ${source.ingredients.length} ingredients and ${source.steps.length} steps, ` +
        `got ${translated.ingredients.length} and ${translated.steps.length}).`,
    );
  }
}
