"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../ui/button";

interface ApprovalRequestProps {
  question: string;
  onApprove: () => void;
  onDeny: () => void;
}

/** Approve/deny controls shown when a tool needs the user's confirmation to run. */
export function ApprovalActions({
  question,
  onApprove,
  onDeny,
}: ApprovalRequestProps) {
  const t = useTranslations("Chat");

  return (
    <div>
      <p className="mb-2">{question}</p>
      <div className="flex gap-2">
        <Button variant="default" onClick={onApprove}>
          {t("approve")}
        </Button>
        <Button variant="destructive" onClick={onDeny}>
          {t("deny")}
        </Button>
      </div>
    </div>
  );
}
