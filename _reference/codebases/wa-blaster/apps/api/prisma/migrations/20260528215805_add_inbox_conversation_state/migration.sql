-- CreateEnum
CREATE TYPE "MessageSource" AS ENUM ('BLAST', 'INBOX');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "body" TEXT,
ADD COLUMN     "source" "MessageSource" NOT NULL DEFAULT 'BLAST',
ALTER COLUMN "blast_id" DROP NOT NULL,
ALTER COLUMN "template_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "inbox_conversation_state" (
    "contact_id" UUID NOT NULL,
    "last_inbound_at" TIMESTAMP(3),
    "last_outbound_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_conversation_state_pkey" PRIMARY KEY ("contact_id")
);

-- CreateIndex
CREATE INDEX "inbox_conversation_state_resolved_at_last_inbound_at_idx" ON "inbox_conversation_state"("resolved_at", "last_inbound_at" DESC);

-- AddForeignKey
ALTER TABLE "inbox_conversation_state" ADD CONSTRAINT "inbox_conversation_state_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill: pre-populate inbox state from existing inbound_messages so the inbox
-- isn't empty on day one. Treats all pre-existing conversations as open.
INSERT INTO "inbox_conversation_state"
  ("contact_id", "last_inbound_at", "last_outbound_at", "resolved_at", "created_at", "updated_at")
SELECT
  inbound."contact_id",
  MAX(inbound."received_at") AS last_inbound_at,
  (SELECT MAX(m."sent_at") FROM "messages" m
     WHERE m."contact_id" = inbound."contact_id"
       AND m."status" IN ('SENT','DELIVERED','READ')) AS last_outbound_at,
  NULL AS resolved_at,
  NOW(), NOW()
FROM "inbound_messages" inbound
GROUP BY inbound."contact_id";
