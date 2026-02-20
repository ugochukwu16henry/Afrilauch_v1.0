'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getStoredRoleFromToken, api, type User } from '@/lib/api';

export default function InternalKnowledgeCenterPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenRole, setTokenRole] = useState<string | null>(null);

  useEffect(() => {
    setTokenRole(getStoredRoleFromToken());
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    api.auth
      .me(token)
      .then(setUser)
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const role = user?.role || tokenRole;
    if (!loading && role && role !== 'super_admin') {
      router.replace('/dashboard/admin');
    }
  }, [loading, user, tokenRole, router]);

  if (loading || !user) {
    return (
      <div className="max-w-4xl">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const effectiveRole = user?.role || tokenRole;
  if (effectiveRole !== 'super_admin') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-2 mb-6 text-amber-800 text-sm font-medium">
        🔒 Internal use only — Super Admin. Not visible to other users. Use when answering investors, partners, or team.
      </div>

      <h1 className="text-2xl font-bold text-secondary mb-2">Internal Knowledge & Orientation</h1>
      <p className="text-gray-600 mb-8">
        Reference document for platform structure, value proposition, and founder context. Can be updated anytime by Super Admin.
      </p>

      <article className="space-y-10 text-gray-800">
        <section>
          <h2 className="text-lg font-bold text-secondary mb-3 border-b border-gray-200 pb-2">
            1. What Is This Platform?
          </h2>
          <p className="mb-3">
            This is a <strong>venture-building platform</strong> that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Helps people with ideas turn them into <strong>structured startups</strong></li>
            <li>Provides <strong>workspace tools</strong> so each idea becomes a mini-company inside the platform</li>
            <li>Connects startups to <strong>guidance</strong>, <strong>systems</strong>, and <strong>investors</strong></li>
          </ul>
          <p className="mt-3 text-gray-600">
            It functions like a digital venture studio: not just learning, but real startup building with workspaces, business models, roadmaps, and investor-ready profiles.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-secondary mb-3 border-b border-gray-200 pb-2">
            2. Problem We Solve
          </h2>
          <p className="mb-3">
            Many people have ideas but lack:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Structure</strong> — no clear path from idea to company</li>
            <li><strong>Guidance</strong> — no mentorship or systems</li>
            <li><strong>Team</strong> — no way to collaborate or assign roles</li>
            <li><strong>Funding path</strong> — no bridge to investors</li>
          </ul>
          <p className="mt-3 font-medium text-secondary">
            This platform prevents good ideas from dying by giving structure, tools, and a path to investment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-secondary mb-3 border-b border-gray-200 pb-2">
            3. How the System Works (Simple Flow)
          </h2>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 font-medium text-gray-800">
            User joins →
            Creates account →
            Adds idea →
            Gets startup workspace →
            Builds business with tools →
            Gets reviewed →
            Investor-ready profile created
          </div>
          <p className="mt-3 text-gray-600 text-sm">
            Each submitted idea automatically creates a dedicated workspace (overview, idea vault, business model, roadmap, team, documents, consultation, investor view, progress). Stage progresses from Idea → Validation → Building → Growth.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-secondary mb-3 border-b border-gray-200 pb-2">
            4. Core Features List
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Startup Workspace System</strong> — each idea = one workspace</li>
            <li><strong>Idea Vault</strong> — private notes, pitch drafts, save draft / submit for review</li>
            <li><strong>Business Model Builder</strong> — value proposition, customer segments, revenue streams, cost structure, channels, key activities</li>
            <li><strong>Roadmap Planner</strong> — Phase 1: Validation, Phase 2: Prototype, Phase 3: Launch, Phase 4: Growth</li>
            <li><strong>Team Collaboration</strong> — assign members, roles, invite team</li>
            <li><strong>Investor Profiles</strong> — read-only pitch view, marketplace</li>
            <li><strong>Consultation Booking</strong> — free booking when setup fee paid</li>
            <li><strong>AI Co-Founder Assistant</strong> — evaluations, business plan, market analysis, risk analysis, idea chat</li>
            <li><strong>Progress Tracking</strong> — tasks completed, milestones, stage progression</li>
            <li><strong>Super Admin Oversight</strong> — full platform visibility, metrics, audit logs, reports</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-secondary mb-3 border-b border-gray-200 pb-2">
            5. Why This Platform Is Important
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Bridges the gap</strong> between idea and execution</li>
            <li><strong>Gives structure</strong> to beginners who don’t know where to start</li>
            <li><strong>Supports founders</strong> who lack business knowledge but have vision</li>
            <li><strong>Creates a pipeline</strong> of investable startups for investors</li>
            <li><strong>Functions like a digital venture studio</strong> — software that acts as an incubator + toolset</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-secondary mb-3 border-b border-gray-200 pb-2">
            6. Founder Profile (Internal)
          </h2>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
            <p><strong>Founder & Technical Lead:</strong> Henry Ugochukwu</p>
            <p className="text-gray-700 text-sm">
              Visionary behind the platform structure. Leads technical architecture and oversees systems design. Focused on helping people reach their full potential by combining technology, business structure, and mentorship. The platform reflects this vision: not just software, but a structured environment where ideas become real startups.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-secondary mb-3 border-b border-gray-200 pb-2">
            7. FAQ (For Super Admin Use)
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="font-semibold text-gray-800">Q: Is this an incubator or a software tool?</dt>
              <dd className="mt-1 text-gray-700 pl-4 border-l-2 border-primary/30">
                A: Both — it is software that acts as a venture studio. Users get workspace tools, structure, and a path to investors, similar to an incubator, but delivered through the platform.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-800">Q: How do startups get investors?</dt>
              <dd className="mt-1 text-gray-700 pl-4 border-l-2 border-primary/30">
                A: Through structured profiles and the investor marketplace. Startups build investor-ready pitch profiles (read-only view), publish to the marketplace, and investors can browse, express interest, and commit. Agreements and payments flow through the platform.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-800">Q: What makes this different?</dt>
              <dd className="mt-1 text-gray-700 pl-4 border-l-2 border-primary/30">
                A: Not just learning — it’s a real startup-building environment. Each idea gets a workspace, business model canvas, roadmap, team, and progress tracking. It’s Startup OS + venture studio + incubator in one.
              </dd>
            </div>
          </dl>
        </section>
      </article>

      <p className="mt-10 text-sm text-gray-500 border-t border-gray-200 pt-6">
        This document is stored under Internal Knowledge Center. Editable only by Super Admin. Can be updated anytime.
      </p>
    </div>
  );
}
