-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED');

-- CreateTable
CREATE TABLE "templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "language" "LanguagePreference" NOT NULL,
    "category" "TemplateCategory" NOT NULL DEFAULT 'MARKETING',
    "body_text" TEXT NOT NULL,
    "header_json" JSONB,
    "footer_text" TEXT,
    "buttons_json" JSONB,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "meta_template_id" TEXT,
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "rejection_reason" TEXT,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "templates_name_idx" ON "templates"("name");

-- CreateIndex
CREATE INDEX "templates_status_idx" ON "templates"("status");

-- CreateIndex
CREATE INDEX "templates_meta_template_id_idx" ON "templates"("meta_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "templates_name_version_language_key" ON "templates"("name", "version", "language");
