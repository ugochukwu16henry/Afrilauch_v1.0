-- Add explicit "no API access" RLS policies so Supabase linter "RLS Enabled No Policy" is satisfied.
-- USING (false) = no rows visible via PostgREST. Backend using service role / BYPASSRLS is unaffected.
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

-- Talent & hiring
CREATE POLICY "rls_no_api_founder_reputation" ON public.founder_reputation FOR ALL USING (false);
CREATE POLICY "rls_no_api_TalentRating" ON public."TalentRating" FOR ALL USING (false);
CREATE POLICY "rls_no_api_JobRequest" ON public."JobRequest" FOR ALL USING (false);
CREATE POLICY "rls_no_api_Hire" ON public."Hire" FOR ALL USING (false);
CREATE POLICY "rls_no_api_Hirer" ON public."Hirer" FOR ALL USING (false);
CREATE POLICY "rls_no_api_Skill" ON public."Skill" FOR ALL USING (false);
CREATE POLICY "rls_no_api_partner_inquiries" ON public.partner_inquiries FOR ALL USING (false);
CREATE POLICY "rls_no_api_talent_skills" ON public.talent_skills FOR ALL USING (false);
CREATE POLICY "rls_no_api_Talent" ON public."Talent" FOR ALL USING (false);

-- Notifications & AI
CREATE POLICY "rls_no_api_notifications" ON public.notifications FOR ALL USING (false);
CREATE POLICY "rls_no_api_ai_conversations" ON public.ai_conversations FOR ALL USING (false);
CREATE POLICY "rls_no_api_ai_generated_outputs" ON public.ai_generated_outputs FOR ALL USING (false);

-- Equity & accounts
CREATE POLICY "rls_no_api_startup_equity" ON public.startup_equity FOR ALL USING (false);
CREATE POLICY "rls_no_api_account_status" ON public.account_status FOR ALL USING (false);
CREATE POLICY "rls_no_api_notification_settings" ON public.notification_settings FOR ALL USING (false);
CREATE POLICY "rls_no_api_deal_room_access" ON public.deal_room_access FOR ALL USING (false);
CREATE POLICY "rls_no_api_company_equity" ON public.company_equity FOR ALL USING (false);
CREATE POLICY "rls_no_api_startup_scores" ON public.startup_scores FOR ALL USING (false);

-- User settings & preferences
CREATE POLICY "rls_no_api_user_preferences" ON public.user_preferences FOR ALL USING (false);
CREATE POLICY "rls_no_api_privacy_settings" ON public.privacy_settings FOR ALL USING (false);
CREATE POLICY "rls_no_api_settings_activity_log" ON public.settings_activity_log FOR ALL USING (false);

-- Business module
CREATE POLICY "rls_no_api_business_module_access" ON public.business_module_access FOR ALL USING (false);
CREATE POLICY "rls_no_api_business_growth" ON public.business_growth FOR ALL USING (false);
CREATE POLICY "rls_no_api_business_financial_snapshots" ON public.business_financial_snapshots FOR ALL USING (false);

-- FAQ & help
CREATE POLICY "rls_no_api_faq_items" ON public.faq_items FOR ALL USING (false);
CREATE POLICY "rls_no_api_help_ai_logs" ON public.help_ai_logs FOR ALL USING (false);

-- Tours, badges, referrals
CREATE POLICY "rls_no_api_user_tour_progress" ON public.user_tour_progress FOR ALL USING (false);
CREATE POLICY "rls_no_api_user_badges" ON public.user_badges FOR ALL USING (false);
CREATE POLICY "rls_no_api_referrals" ON public.referrals FOR ALL USING (false);

-- Milestones & forum
CREATE POLICY "rls_no_api_milestone_triggers" ON public.milestone_triggers FOR ALL USING (false);
CREATE POLICY "rls_no_api_forum_posts" ON public.forum_posts FOR ALL USING (false);
CREATE POLICY "rls_no_api_forum_comments" ON public.forum_comments FOR ALL USING (false);
CREATE POLICY "rls_no_api_forum_likes" ON public.forum_likes FOR ALL USING (false);

-- System
CREATE POLICY "rls_no_api_prisma_migrations" ON public._prisma_migrations FOR ALL USING (false);

-- Security & support
CREATE POLICY "rls_no_api_security_events" ON public.security_events FOR ALL USING (false);
CREATE POLICY "rls_no_api_blocked_ips" ON public.blocked_ips FOR ALL USING (false);
CREATE POLICY "rls_no_api_support_banner_events" ON public.support_banner_events FOR ALL USING (false);
