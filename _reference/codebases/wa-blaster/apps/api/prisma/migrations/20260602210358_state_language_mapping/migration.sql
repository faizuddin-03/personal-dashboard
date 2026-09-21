-- CreateEnum
CREATE TYPE "MalaysianState" AS ENUM ('JOHOR', 'KEDAH', 'KELANTAN', 'MELAKA', 'NEGERI_SEMBILAN', 'PAHANG', 'PENANG', 'PERAK', 'PERLIS', 'SABAH', 'SARAWAK', 'SELANGOR', 'TERENGGANU', 'KUALA_LUMPUR', 'LABUAN', 'PUTRAJAYA');

-- CreateEnum
CREATE TYPE "BlastLanguageMode" AS ENUM ('PREFERENCE', 'STATE');

-- AlterTable
ALTER TABLE "blasts" ADD COLUMN     "language_mode" "BlastLanguageMode" NOT NULL DEFAULT 'PREFERENCE',
ADD COLUMN     "unique_contacts" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "state_language_mapping" (
    "state" "MalaysianState" NOT NULL,
    "languages" "LanguagePreference"[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "state_language_mapping_pkey" PRIMARY KEY ("state")
);

-- Pre-feature blasts were 1 message per contact, so uniqueContacts == totalRecipients
UPDATE "blasts" SET "unique_contacts" = "total_recipients";
