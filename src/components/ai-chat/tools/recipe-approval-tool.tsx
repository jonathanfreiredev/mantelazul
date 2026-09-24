"use client";

import { NotepadTextIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../../ui/button";
import { ApprovalActions } from "./approval-actions";
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
  const router = useRouter();
  const isCreate = part.type === "tool-createRecipe";

  switch (part.state) {
    case "approval-requested":
      return (
        <ApprovalActions
          question={`Do you approve ${isCreate ? "creating" : "updating"} the following recipe: ${part.input.title}?`}
          onApprove={() => onApprove(part.approval.id)}
          onDeny={() => onDeny(part.approval.id)}
        />
      );

    case "output-available": {
      const recipe = part.output.recipe;

      return (
        <ToolResultCard>
          <p>
            Recipe &quot;{recipe.title}&quot; {isCreate ? "created" : "updated"}{" "}
            successfully!
          </p>
          <Button
            variant="outline"
            onClick={() => {
              if (window.location.pathname === `/recipes/${recipe.slug}`) {
                // Already on the recipe page: refresh the data instead of pushing.
                router.refresh();
              } else {
                router.push(`/recipes/${recipe.slug}`);
              }

              onNavigate();
            }}
          >
            <NotepadTextIcon /> View Recipe
          </Button>
        </ToolResultCard>
      );
    }

    case "output-denied":
      return (
        <ToolResultCard tone="denied">
          <p>
            Recipe {isCreate ? "creation" : "update"} denied. The assistant will
            try to find another solution.
          </p>
        </ToolResultCard>
      );

    default:
      return null;
  }
}
