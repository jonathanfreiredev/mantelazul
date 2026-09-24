"use client";

import { useTranslations } from "next-intl";
import { ApprovalActions } from "./approval-actions";
import { ToolResultCard } from "./tool-result-card";
import { type ToolPart } from "./tool-part";

interface DeleteRecipeToolProps {
  part: ToolPart<"deleteRecipe">;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}

/** Renders the destructive recipe deletion tool, which always requires approval. */
export function DeleteRecipeTool({
  part,
  onApprove,
  onDeny,
}: DeleteRecipeToolProps) {
  const t = useTranslations("Chat");

  switch (part.state) {
    case "approval-requested":
      return (
        <ApprovalActions
          question={t("approveDeleteRecipe")}
          onApprove={() => onApprove(part.approval.id)}
          onDeny={() => onDeny(part.approval.id)}
        />
      );

    case "output-available":
      return (
        <ToolResultCard>
          <p>{t("deleted")}</p>
        </ToolResultCard>
      );

    case "output-denied":
      return (
        <ToolResultCard tone="denied">
          <p>{t("deletionDenied")}</p>
        </ToolResultCard>
      );

    default:
      return null;
  }
}
