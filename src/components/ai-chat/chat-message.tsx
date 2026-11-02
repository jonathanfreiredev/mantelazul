"use client";

import {
  BookOpenIcon,
  CalendarDaysIcon,
  CheckIcon,
  TagsIcon,
  type LucideIcon,
} from "lucide-react";
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
import { PlannedMealsTool } from "./tools/planned-meals-tool";
import { RecipeApprovalTool } from "./tools/recipe-approval-tool";
import { RecipeListTool } from "./tools/recipe-list-tool";
import { ToolErrorCard } from "./tools/tool-error-card";
import {
  isRunningToolPart,
  isToolErrorPart,
  isToolPart,
  toolNameOf,
  type ToolName,
} from "./tools/tool-part";
import { Bubble, BubbleContent } from "../ui/bubble";
import { Message, MessageContent } from "../ui/message";
import { Trace, TraceIcon, TraceLine, TraceTitle } from "../ui/trace";

interface ChatMessageProps {
  message: MyAgentUIMessage;
  /** Current status chip for this message, or null when the assistant is idle. */
  activity: AssistantActivity | null;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
  onNavigate: () => void;
}

/**
 * Tools that only read data and have no card of their own. Their completed call is shown as one
 * trace line, so the transcript records what the assistant did without repeating the answer.
 */
const TRACE_TOOLS = ["getTags", "getOneRecipe", "getMealPlan"] as const;

const TRACE_ICONS: Partial<Record<ToolName, LucideIcon>> = {
  getTags: TagsIcon,
  getOneRecipe: BookOpenIcon,
  getMealPlan: CalendarDaysIcon,
};

export function ChatMessage({
  message,
  activity,
  onApprove,
  onDeny,
  onNavigate,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Message align={isUser ? "end" : "start"}>
        <MessageContent>
          {isUser ? (
            <Bubble align="end" variant="muted">
              <BubbleContent>
                {message.parts.map((part, index) => (
                  <MessagePartFor
                    key={`${message.id}-${index}`}
                    part={part}
                    partIndex={index}
                    onApprove={onApprove}
                    onDeny={onDeny}
                    onNavigate={onNavigate}
                  />
                ))}
              </BubbleContent>
            </Bubble>
          ) : (
            <Bubble variant="ghost" className="w-full">
              <BubbleContent className="w-full">
                {message.parts.map((part, index) => (
                  <MessagePartFor
                    key={`${message.id}-${index}`}
                    part={part}
                    partIndex={index}
                    onApprove={onApprove}
                    onDeny={onDeny}
                    onNavigate={onNavigate}
                  />
                ))}
              </BubbleContent>
            </Bubble>
          )}

          {activity && <AssistantActivityIndicator activity={activity} />}
        </MessageContent>
      </Message>
    </motion.div>
  );
}

interface MessagePartForProps {
  part: MyAgentUIMessage["parts"][number];
  partIndex: number;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
  onNavigate: () => void;
}

function MessagePartFor({
  part,
  partIndex,
  onApprove,
  onDeny,
  onNavigate,
}: MessagePartForProps) {
  // Failed and interrupted tool calls are rendered uniformly, before the tools with their own
  // success UI.
  if (isToolErrorPart(part)) {
    return <ToolErrorCard errorText={part.errorText} />;
  }

  if (isToolPart(part, ["createRecipe", "updateRecipe"])) {
    return (
      <RecipeApprovalTool
        part={part}
        onApprove={onApprove}
        onDeny={onDeny}
        onNavigate={onNavigate}
      />
    );
  }

  if (isToolPart(part, ["deleteRecipe"])) {
    return (
      <DeleteRecipeTool part={part} onApprove={onApprove} onDeny={onDeny} />
    );
  }

  if (isToolPart(part, ["generateRecipeImage"])) {
    return <GeneratedImagePart part={part} />;
  }

  if (isToolPart(part, ["planMeals"])) {
    return <PlannedMealsTool part={part} onNavigate={onNavigate} />;
  }

  if (isToolPart(part, ["searchRecipes", "getFavouriteRecipes"])) {
    return <RecipeListTool part={part} onNavigate={onNavigate} />;
  }

  if (isToolPart(part, TRACE_TOOLS)) {
    // While the call runs, the activity line under the message already names it. Once it ends,
    // the trace line stays in the transcript as the record of the step.
    if (isRunningToolPart(part)) return null;

    return <ToolTrace part={part} />;
  }

  if (part.type === "text" || part.type === "file") {
    return <MessagePart part={part} partIndex={partIndex} />;
  }

  return null;
}

function ToolTrace({ part }: { part: MyAgentUIMessage["parts"][number] }) {
  const t = useTranslations("Chat");
  const name = toolNameOf(part);

  if (!name) return null;

  const Icon = TRACE_ICONS[name] ?? CheckIcon;

  return (
    <Trace className="mb-2">
      <TraceLine>
        <TraceIcon>
          <Icon />
        </TraceIcon>
        <TraceTitle>{t(`activity.${name}`)}</TraceTitle>
      </TraceLine>
    </Trace>
  );
}
