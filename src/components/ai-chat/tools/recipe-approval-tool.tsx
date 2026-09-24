"use client";

import { NotepadTextIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "~/i18n/navigation";
import { Button } from "../../ui/button";
import { ApprovalActions } from "./approval-actions";
import { RecipeResultHeader } from "./recipe-result-header";
import { ToolResultCard } from "./tool-result-card";
import { type ToolPart } from "./tool-part";

interface RecipeApprovalToolProps {
  part: ToolPart<"createRecipe"> | ToolPart<"updateRecipe">;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
  /** Called once the user navigates away, so the drawer can close. */
  onNavigate: () => void;
}

/**
 * Renders the recipe create/update tools. They are interchangeable in the UI: the only
 * differences are the wording and the tense of the result message.
 */
export function RecipeApprovalTool({
  part,
  onApprove,
  onDeny,
  onNavigate,
}: RecipeApprovalToolProps) {
  const t = useTranslations("Chat");
  const router = useRouter();
  const isCreate = part.type === "tool-createRecipe";

  switch (part.state) {
    case "approval-requested":
      return (
        <ApprovalActions
          question={t(isCreate ? "approveCreateRecipe" : "approveUpdateRecipe", {
            title: part.input.title,
          })}
          onApprove={() => onApprove(part.approval.id)}
          onDeny={() => onDeny(part.approval.id)}
        />
      );

    case "output-available": {
      const recipe = part.output.recipe;

      return (
        <ToolResultCard>
          <RecipeResultHeader
            title={recipe.title}
            imageUrl={recipe.imageUrl}
            caption={isCreate ? t("created") : t("updated")}
          />
          <Button
            variant="outline"
            onClick={() => {
              if (window.location.pathname.endsWith(`/recipes/${recipe.slug}`)) {
                // Already on the recipe page: refresh the data instead of pushing.
                router.refresh();
              } else {
                router.push(`/recipes/${recipe.slug}`);
              }

              onNavigate();
            }}
          >
            <NotepadTextIcon /> {t("viewRecipe")}
          </Button>
        </ToolResultCard>
      );
    }

    case "output-denied":
      return (
        <ToolResultCard tone="denied">
          <p>{t(isCreate ? "creationDenied" : "updateDenied")}</p>
        </ToolResultCard>
      );

    default:
      return null;
  }
}
