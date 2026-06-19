-- CreateEnum
CREATE TYPE "AutopilotAction" AS ENUM ('AUTO_REPLIED', 'ESCALATED', 'OPTED_OUT', 'SKIPPED');

-- CreateEnum
CREATE TYPE "EscalationReason" AS ENUM ('COMPLAINT', 'LOW_CONFIDENCE', 'KNOWLEDGE_GAP', 'SENSITIVE');

-- CreateTable
CREATE TABLE "autopilot_events" (
    "id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "inbound_message_id" UUID,
    "action" "AutopilotAction" NOT NULL,
    "intent" TEXT,
    "confidence" DOUBLE PRECISION,
    "reason" "EscalationReason",
    "matched_kb_doc_id" UUID,
    "model" TEXT,
    "reply_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autopilot_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "autopilot_events_contact_id_idx" ON "autopilot_events"("contact_id");

-- CreateIndex
CREATE INDEX "autopilot_events_action_idx" ON "autopilot_events"("action");

-- CreateIndex
CREATE INDEX "autopilot_events_created_at_idx" ON "autopilot_events"("created_at");
