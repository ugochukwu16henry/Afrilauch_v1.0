CREATE TABLE "Donation" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(6) NOT NULL DEFAULT 'USD',
  "payment_method" VARCHAR(30) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "reference" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Donation_reference_key" ON "Donation"("reference");
CREATE INDEX "Donation_status_idx" ON "Donation"("status");
CREATE INDEX "Donation_created_at_idx" ON "Donation"("created_at");

ALTER TABLE "Donation"
ADD CONSTRAINT "Donation_status_check"
CHECK ("status" IN ('pending', 'successful', 'failed'));
