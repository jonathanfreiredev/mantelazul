"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { type ToolName } from "./tools/tool-part";

export type AssistantActivity =
  { kind: "thinking" } | { kind: "tool"; tool: ToolName };

/**
 * Message key for each tool, so the status line can say what the assistant is doing instead of a
 * generic "Working". Typed as a complete record on purpose: adding a tool without a phrase is a
 * compile error, not a silent "Working".
 */
const ACTIVITY_KEYS: Record<ToolName, string> = {
  getTags: "activity.getTags",
  searchRecipes: "activity.searchRecipes",
  getFavouriteRecipes: "activity.getFavouriteRecipes",
  getOneRecipe: "activity.getOneRecipe",
  getMealPlan: "activity.getMealPlan",
  createRecipe: "activity.createRecipe",
  updateRecipe: "activity.updateRecipe",
  deleteRecipe: "activity.deleteRecipe",
  planMeals: "activity.planMeals",
  generateRecipeImage: "activity.generateRecipeImage",
};

/**
 * The one line that says what the assistant is doing right now.
 *
 * It is a sentence, not a badge: the user is waiting and wants to know on what, and naming the
 * step also makes the agent's run readable from the outside.
 */
export function AssistantActivityIndicator({
  activity,
}: {
  activity: AssistantActivity;
}) {
  const t = useTranslations("Chat");
  const key =
    activity.kind === "thinking"
      ? "activity.thinking"
      : ACTIVITY_KEYS[activity.tool];

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="status-shimmer mt-2 text-sm font-light"
    >
      {t(key)}
    </motion.p>
  );
}
