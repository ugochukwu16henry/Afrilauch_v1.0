ALTER TABLE "Milestone"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currency" VARCHAR(6) NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS "billing_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "sequence" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "milestone_payments" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "milestone_id" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(6) NOT NULL,
  "payment_method" VARCHAR(30) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
  "reference" TEXT NOT NULL,
  "proof_of_payment_url" VARCHAR(500),
  "transfer_reference" VARCHAR(120),
  "confirmed_by_admin" BOOLEAN NOT NULL DEFAULT false,
  "confirmed_at" TIMESTAMP(3),
  "provider_ref" VARCHAR(120),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "milestone_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "milestone_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "milestone_payments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "milestone_payments_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "milestone_payments_reference_key" ON "milestone_payments"("reference");
CREATE INDEX IF NOT EXISTS "milestone_payments_project_id_status_idx" ON "milestone_payments"("project_id", "status");
CREATE INDEX IF NOT EXISTS "milestone_payments_milestone_id_status_idx" ON "milestone_payments"("milestone_id", "status");
