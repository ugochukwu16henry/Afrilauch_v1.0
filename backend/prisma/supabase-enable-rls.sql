-- RiseFlow Hub: Enable Row Level Security (RLS) on all public tables
-- Run this in Supabase Dashboard → SQL Editor
-- Your app uses Express + Prisma with DATABASE_URL (postgres role), so we allow that role full access.
-- PostgREST/anon access remains blocked (no policy for anon), satisfying the linter.

-- Enable RLS on every table in public schema
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantBilling" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Milestone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "File" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IdeaVaultItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BusinessModel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketingReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MaintenanceLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agreement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssignedAgreement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgreementAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Investor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StartupProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Investment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketingAnalyticsSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConsultationBooking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_room_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminLead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminLeadNote" ENABLE ROW LEVEL SECURITY;

-- Policy: allow backend (postgres role from DATABASE_URL) full access so Prisma/Express keeps working
-- No policy for anon/service_role from PostgREST = they get no rows (secure by default)

CREATE POLICY "backend_full" ON "User" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "Tenant" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "TenantBilling" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "CustomRole" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "TeamInvite" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "Client" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "Project" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "Milestone" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "Task" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "Message" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "File" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "IdeaVaultItem" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "BusinessModel" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "ProjectMember" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "Payment" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "MarketingReport" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "MaintenanceLog" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "Agreement" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "AssignedAgreement" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "AgreementAuditLog" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "Investor" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "StartupProfile" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "Investment" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON deal_room_messages FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "Campaign" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "Lead" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "MarketingAnalyticsSnapshot" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "ConsultationBooking" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "ContactMessage" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "EmailLog" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON deal_room_views FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON saved_startups FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "AuditLog" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON cms_content FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "UserPayment" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "AdminLead" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_full" ON "AdminLeadNote" FOR ALL TO postgres USING (true) WITH CHECK (true);
