-- CreateEnum
CREATE TYPE "KnowledgeSource" AS ENUM ('SYNCED', 'FROM_ESCALATION');

-- CreateEnum
CREATE TYPE "KnowledgeStatus" AS ENUM ('PUBLISHED', 'CANDIDATE', 'DISMISSED');

-- CreateTable
CREATE TABLE "knowledge_docs" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" "KnowledgeSource" NOT NULL DEFAULT 'SYNCED',
    "status" "KnowledgeStatus" NOT NULL DEFAULT 'PUBLISHED',
    "uses" INTEGER NOT NULL DEFAULT 0,
    "ticket_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_docs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_docs_status_idx" ON "knowledge_docs"("status");

-- CreateIndex
CREATE INDEX "knowledge_docs_source_idx" ON "knowledge_docs"("source");

-- CreateIndex
CREATE INDEX "knowledge_docs_category_idx" ON "knowledge_docs"("category");
