"use client";

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
  switch (part.state) {
    case "approval-requested":
      return (
        <ApprovalActions
          question="Do you approve deleting this recipe? This cannot be undone."
          onApprove={() => onApprove(part.approval.id)}
          onDeny={() => onDeny(part.approval.id)}
        />
      );

    case "output-available":
      return (
        <ToolResultCard>
          <p>Recipe deleted successfully.</p>
        </ToolResultCard>
      );

    case "output-denied":
      return (
        <ToolResultCard tone="denied">
          <p>Deletion denied. The recipe was not deleted.</p>
        </ToolResultCard>
      );

    default:
      return null;
  }
}
