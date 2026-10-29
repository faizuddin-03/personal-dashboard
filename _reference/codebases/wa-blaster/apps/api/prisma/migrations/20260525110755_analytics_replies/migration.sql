-- CreateEnum
CREATE TYPE "InboundRouting" AS ENUM ('ANALYTICS', 'CHATBOT', 'NONE');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "replied_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "inbound_messages" (
    "id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "meta_message_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attributed_blast_id" UUID,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "routed_to" "InboundRouting" NOT NULL DEFAULT 'ANALYTICS',

    CONSTRAINT "inbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inbound_messages_meta_message_id_key" ON "inbound_messages"("meta_message_id");

-- CreateIndex
CREATE INDEX "inbound_messages_contact_id_idx" ON "inbound_messages"("contact_id");

-- CreateIndex
CREATE INDEX "inbound_messages_attributed_blast_id_idx" ON "inbound_messages"("attributed_blast_id");

-- CreateIndex
CREATE INDEX "inbound_messages_received_at_idx" ON "inbound_messages"("received_at");
