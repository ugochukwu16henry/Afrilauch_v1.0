-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "SecurityEventType" AS ENUM ('login_failed', 'login_suspicious', 'rate_limit_exceeded', 'ip_blocked', 'anomaly_detected', 'mfa_challenge_failed', 'mfa_required');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SecuritySeverity" AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportBannerEventType" AS ENUM ('shown', 'clicked_support', 'closed', 'dont_show_again');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "security_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(255),
    "event_type" "SecurityEventType" NOT NULL,
    "severity" "SecuritySeverity" NOT NULL DEFAULT 'medium',
    "message" VARCHAR(500) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "auto_blocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "blocked_ips" (
    "id" TEXT NOT NULL,
    "ip" VARCHAR(64) NOT NULL,
    "reason" VARCHAR(255),
    "source" VARCHAR(60) NOT NULL,
    "blocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_by_id" TEXT,

    CONSTRAINT "blocked_ips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "support_banner_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" "SupportBannerEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_banner_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "security_events_user_id_created_at_idx" ON "security_events"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "security_events_ip_created_at_idx" ON "security_events"("ip", "created_at");
CREATE INDEX IF NOT EXISTS "blocked_ips_ip_idx" ON "blocked_ips"("ip");
CREATE INDEX IF NOT EXISTS "support_banner_events_user_id_created_at_idx" ON "support_banner_events"("user_id", "created_at");

-- Add columns to contact_messages only if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_messages') THEN
    ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50);
    ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "attachment_url" VARCHAR(500);
    ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'unread';
  END IF;
END $$;

-- AddForeignKey (idempotent: drop if exists then add)
ALTER TABLE "security_events" DROP CONSTRAINT IF EXISTS "security_events_user_id_fkey";
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "blocked_ips" DROP CONSTRAINT IF EXISTS "blocked_ips_created_by_id_fkey";
ALTER TABLE "blocked_ips" ADD CONSTRAINT "blocked_ips_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_banner_events" DROP CONSTRAINT IF EXISTS "support_banner_events_user_id_fkey";
ALTER TABLE "support_banner_events" ADD CONSTRAINT "support_banner_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
