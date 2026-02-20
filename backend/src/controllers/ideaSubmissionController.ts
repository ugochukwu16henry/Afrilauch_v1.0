import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { resolveTenantIdFromRequest } from './authController';
import { setAuthCookie } from './authController';

const prisma = new PrismaClient();

export interface IdeaSubmissionBody {
  name: string;
  email: string;
  password: string;
  country: string;
  ideaDescription: string;
  problemItSolves: string;
  targetUsers: string;
  industry: string;
  stage: 'just_idea' | 'prototype' | 'existing_business';
  goals: string[];
  budgetRange: string;
}

/** Run AI evaluation (mock) — same logic as /ai/evaluate-idea */
function runAIEvaluation(ideaDescription: string, industry: string, country: string): void {
  const feasibilityScore = Math.min(95, 60 + Math.floor(Math.random() * 35));
  const riskLevel = feasibilityScore > 80 ? 'Low' : feasibilityScore > 60 ? 'Medium' : 'High';
  const marketPotential = feasibilityScore > 75 ? 'High' : feasibilityScore > 50 ? 'Medium' : 'Emerging';
  // Log for now; could store in project metadata or send to queue
  console.log('[IdeaSubmission] AI evaluation:', {
    feasibilityScore,
    riskLevel,
    marketPotential,
    industry,
    country,
    ideaPreview: ideaDescription.slice(0, 80) + '...',
  });
}

import { sendNotificationEmail } from '../services/emailService';
import { createAuditLog } from '../services/auditLogService';
import { awardBadge } from '../services/badgeService';
import { recordSignupReferral, recordReferralStage } from '../services/referralService';
import { enrollEarlyAccessOnIdeaSubmission, EARLY_ACCESS_REF } from '../services/earlyAccessService';

/** POST /api/v1/idea-submissions — Public: create User + Client + Project, trigger AI, return token */
export async function submit(req: Request, res: Response): Promise<void> {
  const body = req.body as IdeaSubmissionBody;
  const {
    name,
    email,
    password,
    country,
    ideaDescription,
    problemItSolves,
    targetUsers,
    industry,
    stage,
    goals,
    budgetRange,
  } = body;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }
  if (!ideaDescription?.trim()) {
    res.status(400).json({ error: 'Idea description is required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existingUser) {
    res.status(400).json({ error: 'Email already registered' });
    return;
  }

  const tenantId = await resolveTenantIdFromRequest(req);
  const passwordHash = await hashPassword(password);
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'client',
      tenantId,
    },
    select: { id: true, name: true, email: true, role: true, tenantId: true, setupPaid: true, setupReason: true, createdAt: true },
  });

  const ref = (req.query.ref as string | undefined) || (req.body as { ref?: string }).ref;
  if (ref) {
    recordSignupReferral(prisma, { referrerId: ref, referredUserId: user.id }).catch(() => {});
  }

  // Founder Early Access Scholarship — first 300 signups with the special ref
  if (ref === EARLY_ACCESS_REF) {
    const enrolled = await enrollEarlyAccessOnIdeaSubmission(prisma, { userId: user.id });
    if (enrolled) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          setupPaid: true,
          setupReason: 'early_access_scholarship',
        },
      });
    }
  }

  const businessName = ideaDescription.trim().slice(0, 80) || `${name.trim()}'s Venture`;
  const ideaSummary = [
    country?.trim() && `Country: ${country.trim()}`,
    ideaDescription.trim(),
    problemItSolves?.trim() && `Problem: ${problemItSolves.trim()}`,
    targetUsers?.trim() && `Target users: ${targetUsers.trim()}`,
    Array.isArray(goals) && goals.length > 0 && `Goals: ${goals.join(', ')}`,
    stage && `Stage: ${stage}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const client = await prisma.client.create({
    data: {
      userId: user.id,
      businessName,
      industry: industry?.trim() || null,
      ideaSummary,
      budgetRange: budgetRange?.trim() || null,
    },
  });

  const projectName = ideaDescription.trim().slice(0, 100) || 'My Startup';
  const description = [
    ideaDescription.trim(),
    problemItSolves?.trim() && `Problem: ${problemItSolves.trim()}`,
    targetUsers?.trim() && `Target users: ${targetUsers.trim()}`,
    Array.isArray(goals) && goals.length > 0 && `Goals: ${goals.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const project = await prisma.project.create({
    data: {
      clientId: client.id,
      projectName,
      description,
      tagline: ideaDescription.trim().slice(0, 280) || null,
      problemStatement: problemItSolves?.trim() || null,
      targetMarket: targetUsers?.trim() || null,
      workspaceStage: 'draft',
      stage: 'Planning',
      status: 'IdeaSubmitted',
    },
  });

  await prisma.$transaction([
    prisma.projectMember.create({
      data: { projectId: project.id, userId: user.id, role: 'founder' },
    }),
    prisma.businessModel.create({
      data: { projectId: project.id },
    }),
  ]);

  createAuditLog(prisma, {
    adminId: user.id,
    actionType: 'idea_submitted',
    entityType: 'idea',
    entityId: project.id,
    details: { email: user.email, name: user.name },
  }).catch(() => {});

  // Achievements & referrals
  awardBadge(prisma, { userId: user.id, badge: 'idea_starter' }).catch(() => {});
  recordReferralStage(prisma, { referredUserId: user.id, stage: 'idea_submitted' }).catch(() => {});

  runAIEvaluation(ideaDescription.trim(), industry?.trim() || '', country?.trim() || '');
  sendNotificationEmail({
    type: 'idea_submitted',
    userEmail: normalizedEmail,
    dynamicData: { name: name.trim(), ideaPreview: ideaDescription.trim().slice(0, 120) },
  }).catch((e) => console.error('[IdeaSubmission] Email error:', e));

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ?? undefined,
  });

  setAuthCookie(res, token);

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      setupPaid: user.setupPaid ?? false,
      setupReason: user.setupReason ?? null,
    },
    token,
    message: 'Your draft idea has been saved. Review it in your dashboard and click Final Submit when ready.',
  });
}
