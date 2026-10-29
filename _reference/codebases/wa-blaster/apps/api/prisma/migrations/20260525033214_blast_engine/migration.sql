-- CreateEnum
CREATE TYPE "BlastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELED', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "blasts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "default_language" "LanguagePreference" NOT NULL DEFAULT 'EN',
    "segment_id" UUID,
    "recipient_snapshot" JSONB NOT NULL DEFAULT '[]',
    "variable_mapping" JSONB NOT NULL DEFAULT '{}',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "BlastStatus" NOT NULL DEFAULT 'DRAFT',
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "blasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "blast_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "meta_message_id" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "error_code" TEXT,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_events" (
    "id" UUID NOT NULL,
    "message_id" UUID,
    "meta_event_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "blasts_status_idx" ON "blasts"("status");

-- CreateIndex
CREATE INDEX "blasts_scheduled_at_idx" ON "blasts"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_meta_message_id_key" ON "messages"("meta_message_id");

-- CreateIndex
CREATE INDEX "messages_blast_id_idx" ON "messages"("blast_id");

-- CreateIndex
CREATE INDEX "messages_contact_id_idx" ON "messages"("contact_id");

-- CreateIndex
CREATE INDEX "messages_status_idx" ON "messages"("status");

-- CreateIndex
CREATE INDEX "message_events_message_id_idx" ON "message_events"("message_id");

-- CreateIndex
CREATE INDEX "message_events_received_at_idx" ON "message_events"("received_at");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_blast_id_fkey" FOREIGN KEY ("blast_id") REFERENCES "blasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
