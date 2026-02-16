-- Enable Row Level Security (RLS) on public tables for Supabase / PostgREST.
-- When RLS is enabled with no policies, anon/authenticated roles see no rows.
-- Your backend (Prisma) typically uses a role with BYPASSRLS or service role, so it is unaffected.
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public

-- Talent & hiring
ALTER TABLE public.founder_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TalentRating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."JobRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Hire" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Hirer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Skill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Talent" ENABLE ROW LEVEL SECURITY;

-- Notifications & AI
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_outputs ENABLE ROW LEVEL SECURITY;

-- Equity & accounts
ALTER TABLE public.startup_equity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_equity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_scores ENABLE ROW LEVEL SECURITY;

-- User settings & preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_activity_log ENABLE ROW LEVEL SECURITY;

-- Business module
ALTER TABLE public.business_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_financial_snapshots ENABLE ROW LEVEL SECURITY;

-- FAQ & help
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_ai_logs ENABLE ROW LEVEL SECURITY;

-- Tours, badges, referrals
ALTER TABLE public.user_tour_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Milestones & forum
ALTER TABLE public.milestone_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

-- System (Prisma migrations table – RLS blocks direct API access; migration runner uses BYPASSRLS)
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Security & support
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_banner_events ENABLE ROW LEVEL SECURITY;
