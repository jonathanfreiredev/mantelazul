"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import type { MyAgentUIMessage } from "~/lib/agent";
import {
  AssistantActivityIndicator,
  type AssistantActivity,
} from "./assistant-activity-indicator";
import { MessagePart } from "./message-part";
import { DeleteRecipeTool } from "./tools/delete-recipe-tool";
import { GeneratedImagePart } from "./tools/generated-image-part";
import { RecipeApprovalTool } from "./tools/recipe-approval-tool";
import { ToolErrorCard } from "./tools/tool-error-card";
import { isToolErrorPart, isToolPart } from "./tools/tool-part";

interface ChatMessageProps {
  message: MyAgentUIMessage;
  /** Current status chip for this message, or null when the assistant is idle. */
  activity: AssistantActivity | null;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
  onNavigate: () => void;
}

export function ChatMessage({
  message,
  activity,
  onApprove,
  onDeny,
  onNavigate,
}: ChatMessageProps) {
  const t = useTranslations("Chat");
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-neutral-600 text-white"
            : "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
        }`}
      >
        <div>
          <p className="mb-1 text-xs font-extralight opacity-70">
            {isUser ? t("you") : t("ai")}
          </p>

          {activity && <AssistantActivityIndicator activity={activity} />}

          {message.parts.map((part, index) => {
            const key = `${message.id}-${index}`;

            // Failed and interrupted tool calls are rendered uniformly, before the tools with
            // their own success UI.
            if (isToolErrorPart(part)) {
              return (
                <ToolErrorCard
                  key={part.toolCallId}
                  errorText={part.errorText}
                />
              );
            }

            if (isToolPart(part, ["createRecipe", "updateRecipe"])) {
              return (
                <RecipeApprovalTool
                  key={part.toolCallId}
                  part={part}
                  onApprove={onApprove}
                  onDeny={onDeny}
                  onNavigate={onNavigate}
                />
              );
            }

            if (isToolPart(part, ["deleteRecipe"])) {
              return (
                <DeleteRecipeTool
                  key={part.toolCallId}
                  part={part}
                  onApprove={onApprove}
                  onDeny={onDeny}
                />
              );
            }

            if (isToolPart(part, ["generateRecipeImage"])) {
              return <GeneratedImagePart key={part.toolCallId} part={part} />;
            }

            if (part.type === "text" || part.type === "file") {
              return <MessagePart key={key} part={part} partIndex={index} />;
            }

            // Other tool parts (search, favourites, getOne, tags) have no bespoke UI.
            return null;
          })}
        </div>
      </div>
    </motion.div>
  );
}
