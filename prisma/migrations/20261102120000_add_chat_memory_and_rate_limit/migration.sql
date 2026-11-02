-- Conversation memory for long chats: the model sees a compact summary plus the most recent
-- turns instead of the whole transcript.
ALTER TABLE "chat"
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "summaryUpToMessageId" TEXT,
  ADD COLUMN "summaryUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "summaryTokens" INTEGER;

-- Per-user, per-window counters for abuse protection. These limit request frequency, never the
-- length of a conversation.
CREATE TABLE "rate_limit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rate_limit_userId_action_windowStart_key"
  ON "rate_limit"("userId", "action", "windowStart");

CREATE INDEX "rate_limit_userId_action_idx"
  ON "rate_limit"("userId", "action");
