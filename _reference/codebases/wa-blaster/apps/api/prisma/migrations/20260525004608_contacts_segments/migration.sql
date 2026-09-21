-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Ethnicity" AS ENUM ('MALAY', 'CHINESE', 'INDIAN', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('ISLAM', 'BUDDHISM', 'HINDUISM', 'CHRISTIANITY', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Occupation" AS ENUM ('STUDENT', 'EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LanguagePreference" AS ENUM ('EN', 'MS', 'ZH', 'TA', 'OTHER');

-- CreateEnum
CREATE TYPE "OptInStatus" AS ENUM ('OPTED_IN', 'OPTED_OUT', 'PENDING');

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "phone_e164" TEXT NOT NULL,
    "name" TEXT,
    "date_of_birth" DATE,
    "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
    "ethnicity" "Ethnicity" NOT NULL DEFAULT 'UNKNOWN',
    "religion" "Religion" NOT NULL DEFAULT 'UNKNOWN',
    "occupation" "Occupation" NOT NULL DEFAULT 'UNKNOWN',
    "language_preference" "LanguagePreference" NOT NULL DEFAULT 'EN',
    "city" TEXT,
    "state" TEXT,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "opt_in_status" "OptInStatus" NOT NULL DEFAULT 'PENDING',
    "opt_in_source" TEXT,
    "opt_in_at" TIMESTAMP(3),
    "opt_out_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_segments" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filter_json" JSONB NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_segments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contacts_phone_e164_key" ON "contacts"("phone_e164");

-- CreateIndex
CREATE INDEX "contacts_ethnicity_idx" ON "contacts"("ethnicity");

-- CreateIndex
CREATE INDEX "contacts_gender_idx" ON "contacts"("gender");

-- CreateIndex
CREATE INDEX "contacts_language_preference_idx" ON "contacts"("language_preference");

-- CreateIndex
CREATE INDEX "contacts_state_idx" ON "contacts"("state");

-- CreateIndex
CREATE INDEX "contacts_opt_in_status_idx" ON "contacts"("opt_in_status");

-- CreateIndex
CREATE INDEX "contacts_created_at_idx" ON "contacts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "contact_segments_name_key" ON "contact_segments"("name");
