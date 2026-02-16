-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "revenue_system_versions" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "version_type" VARCHAR(20) NOT NULL,
    "edited_by_id" TEXT,
    "edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_system_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "revenue_system_versions_edited_at_idx" ON "revenue_system_versions"("edited_at");

-- AddForeignKey (idempotent)
DO $$ BEGIN
    ALTER TABLE "revenue_system_versions" ADD CONSTRAINT "revenue_system_versions_edited_by_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enable RLS (idempotent, matching pattern from migration 20250203180000)
ALTER TABLE public.revenue_system_versions ENABLE ROW LEVEL SECURITY;

-- Add RLS policy (idempotent, matching pattern from migration 20250203180100)
DO $$ BEGIN
    CREATE POLICY "rls_no_api_revenue_system_versions" ON public.revenue_system_versions FOR ALL USING (false);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
