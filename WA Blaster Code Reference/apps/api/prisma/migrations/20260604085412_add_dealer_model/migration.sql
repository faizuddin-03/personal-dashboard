-- CreateEnum
CREATE TYPE "DealerTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRING', 'LAPSED');

-- CreateEnum
CREATE TYPE "VehicleSpecialization" AS ENUM ('NATIONAL', 'CONTINENTAL_LUXURY', 'SUV_MPV', 'COMMERCIAL_PICKUP', 'EV_HYBRID', 'MOTORCYCLE', 'MULTI_BRAND');

-- CreateEnum
CREATE TYPE "NumberType" AS ENUM ('PHONE', 'LANE');

-- CreateEnum
CREATE TYPE "PicRole" AS ENUM ('OWNER', 'SALES_MANAGER', 'ADMIN');

-- AlterEnum
ALTER TYPE "BlastStatus" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "blasts" ADD COLUMN     "paused_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "history_check_credits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "joined_at" TIMESTAMP(3),
ADD COLUMN     "last_seen_at" TIMESTAMP(3),
ADD COLUMN     "lifetime_spend" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "number_type" "NumberType" NOT NULL DEFAULT 'PHONE',
ADD COLUMN     "pic_name" TEXT,
ADD COLUMN     "pic_role" "PicRole",
ADD COLUMN     "subscription_status" "SubscriptionStatus",
ADD COLUMN     "tier" "DealerTier",
ADD COLUMN     "transfers_30d" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vehicle_specialization" "VehicleSpecialization";

-- CreateIndex
CREATE INDEX "contacts_tier_idx" ON "contacts"("tier");

-- CreateIndex
CREATE INDEX "contacts_subscription_status_idx" ON "contacts"("subscription_status");

-- CreateIndex
CREATE INDEX "contacts_vehicle_specialization_idx" ON "contacts"("vehicle_specialization");
