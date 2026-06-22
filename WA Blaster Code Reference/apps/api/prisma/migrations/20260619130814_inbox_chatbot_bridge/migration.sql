-- AlterEnum
ALTER TYPE "MessageSource" ADD VALUE 'CHATBOT';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "conversation_id" UUID;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "tickets_conversation_id_idx" ON "tickets"("conversation_id");
