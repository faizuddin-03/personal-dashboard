-- Enable pgvector extension (required for the knowledge_chunks.embedding vector column below)
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "ConversationState" AS ENUM ('NEW', 'AUTO_REPLIED', 'ESCALATION_OFFERED', 'ESCALATED', 'AWAITING_REPLY', 'REPLIED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "BotDraftState" AS ENUM ('PENDING', 'APPROVED', 'EDITED', 'REJECTED', 'SENT');

-- CreateEnum
CREATE TYPE "ChatbotDecisionKind" AS ENUM ('AUTO_SEND', 'ESCALATE', 'IGNORE');

-- CreateEnum
CREATE TYPE "KnowledgeDocumentStatus" AS ENUM ('DRAFT', 'LIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "state" "ConversationState" NOT NULL DEFAULT 'NEW',
    "last_inbound_at" TIMESTAMP(3),
    "last_outbound_at" TIMESTAMP(3),
    "cs_window_expires_at" TIMESTAMP(3),
    "assigned_to" UUID,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "detected_language" "LanguagePreference",
    "escalation_offered_at" TIMESTAMP(3),
    "escalation_offer_inbound_id" UUID,
    "closed_at" TIMESTAMP(3),
    "closed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_inbound_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "meta_message_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL,
    "raw_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_inbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_outbound_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "meta_message_id" TEXT,
    "body" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sent_by" UUID,
    "bot_draft_id" UUID,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_outbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_drafts" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "inbound_message_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "intent_confidence" DOUBLE PRECISION NOT NULL,
    "draft_confidence" DOUBLE PRECISION NOT NULL,
    "model_used" TEXT NOT NULL,
    "embedding_model_used" TEXT NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "state" "BotDraftState" NOT NULL DEFAULT 'PENDING',
    "approved_by" UUID,
    "edited_body" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_decisions" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "inbound_message_id" UUID NOT NULL,
    "kind" "ChatbotDecisionKind" NOT NULL,
    "reason" TEXT NOT NULL,
    "intent" TEXT,
    "intent_confidence" DOUBLE PRECISION,
    "draft_confidence" DOUBLE PRECISION,
    "model_used" TEXT,
    "embedding_model_used" TEXT,
    "total_latency_ms" INTEGER NOT NULL,
    "retrieval_latency_ms" INTEGER,
    "guardrail_failures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "top_chunk_score" DOUBLE PRECISION,
    "chunks_retrieved" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "value_type" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content_md" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "embedding_model" TEXT NOT NULL,
    "captured_from_conversation_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "token_count" INTEGER NOT NULL,
    -- vector(1024) is not expressible in the Prisma schema (Unsupported type); added here manually.
    "embedding" vector(1024) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (HNSW index for fast cosine-similarity search over embeddings; not expressible in Prisma)
CREATE INDEX "knowledge_chunks_embedding_idx" ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops);

-- CreateTable
CREATE TABLE "bot_draft_citations" (
    "id" UUID NOT NULL,
    "bot_draft_id" UUID NOT NULL,
    "chunk_id" UUID NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_draft_citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolution_captures" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "closed_by" UUID NOT NULL,
    "closed_at" TIMESTAMP(3) NOT NULL,
    "disposition" TEXT NOT NULL,
    "resolution_notes" TEXT,
    "edited_answer" TEXT,
    "forced_despite_duplicate" BOOLEAN NOT NULL DEFAULT false,
    "document_id" UUID,
    "duplicate_of" UUID,
    "status" TEXT NOT NULL,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resolution_captures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_contact_id_idx" ON "conversations"("contact_id");

-- CreateIndex
CREATE INDEX "conversations_state_idx" ON "conversations"("state");

-- CreateIndex
CREATE INDEX "conversations_assigned_to_idx" ON "conversations"("assigned_to");

-- CreateIndex
CREATE INDEX "conversations_last_inbound_at_idx" ON "conversations"("last_inbound_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_inbound_messages_meta_message_id_key" ON "conversation_inbound_messages"("meta_message_id");

-- CreateIndex
CREATE INDEX "conversation_inbound_messages_conversation_id_idx" ON "conversation_inbound_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_inbound_messages_received_at_idx" ON "conversation_inbound_messages"("received_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_outbound_messages_meta_message_id_key" ON "conversation_outbound_messages"("meta_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_outbound_messages_bot_draft_id_key" ON "conversation_outbound_messages"("bot_draft_id");

-- CreateIndex
CREATE INDEX "conversation_outbound_messages_conversation_id_idx" ON "conversation_outbound_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_outbound_messages_sent_at_idx" ON "conversation_outbound_messages"("sent_at");

-- CreateIndex
CREATE INDEX "bot_drafts_conversation_id_idx" ON "bot_drafts"("conversation_id");

-- CreateIndex
CREATE INDEX "bot_drafts_state_idx" ON "bot_drafts"("state");

-- CreateIndex
CREATE INDEX "bot_drafts_created_at_idx" ON "bot_drafts"("created_at");

-- CreateIndex
CREATE INDEX "chatbot_decisions_conversation_id_idx" ON "chatbot_decisions"("conversation_id");

-- CreateIndex
CREATE INDEX "chatbot_decisions_kind_idx" ON "chatbot_decisions"("kind");

-- CreateIndex
CREATE INDEX "chatbot_decisions_created_at_idx" ON "chatbot_decisions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_documents_captured_from_conversation_id_key" ON "knowledge_documents"("captured_from_conversation_id");

-- CreateIndex
CREATE INDEX "knowledge_documents_category_idx" ON "knowledge_documents"("category");

-- CreateIndex
CREATE INDEX "knowledge_documents_status_idx" ON "knowledge_documents"("status");

-- CreateIndex
CREATE INDEX "knowledge_documents_created_at_idx" ON "knowledge_documents"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_documents_name_key" ON "knowledge_documents"("name");

-- CreateIndex
CREATE INDEX "knowledge_chunks_document_id_idx" ON "knowledge_chunks"("document_id");

-- CreateIndex
CREATE INDEX "bot_draft_citations_bot_draft_id_idx" ON "bot_draft_citations"("bot_draft_id");

-- CreateIndex
CREATE INDEX "bot_draft_citations_chunk_id_idx" ON "bot_draft_citations"("chunk_id");

-- CreateIndex
CREATE UNIQUE INDEX "resolution_captures_conversation_id_key" ON "resolution_captures"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "resolution_captures_document_id_key" ON "resolution_captures"("document_id");

-- CreateIndex
CREATE INDEX "resolution_captures_status_idx" ON "resolution_captures"("status");

-- CreateIndex
CREATE INDEX "resolution_captures_closed_at_idx" ON "resolution_captures"("closed_at");

-- CreateIndex
CREATE INDEX "resolution_captures_disposition_idx" ON "resolution_captures"("disposition");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_inbound_messages" ADD CONSTRAINT "conversation_inbound_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_outbound_messages" ADD CONSTRAINT "conversation_outbound_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_drafts" ADD CONSTRAINT "bot_drafts_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_decisions" ADD CONSTRAINT "chatbot_decisions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_draft_citations" ADD CONSTRAINT "bot_draft_citations_bot_draft_id_fkey" FOREIGN KEY ("bot_draft_id") REFERENCES "bot_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_draft_citations" ADD CONSTRAINT "bot_draft_citations_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "knowledge_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolution_captures" ADD CONSTRAINT "resolution_captures_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolution_captures" ADD CONSTRAINT "resolution_captures_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
