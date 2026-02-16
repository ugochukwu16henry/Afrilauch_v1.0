import path from 'path';
// Load .env from backend folder (so seed works from repo root or backend)
const backendDir = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(backendDir, '.env') });
require('dotenv').config({ path: path.join(backendDir, '.env.local'), override: true });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { fillAgreementTemplate } from '../src/templates/agreementTemplates';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Password123';

const SKILLS: { name: string; category: string }[] = [
  { name: 'Frontend Developer', category: 'Tech' },
  { name: 'Backend Developer', category: 'Tech' },
  { name: 'Full Stack Developer', category: 'Tech' },
  { name: 'Mobile Developer', category: 'Tech' },
  { name: 'DevOps Engineer', category: 'Tech' },
  { name: 'AI Engineer', category: 'Tech' },
  { name: 'Data Analyst', category: 'Tech' },
  { name: 'UI/UX Designer', category: 'Creative' },
  { name: 'Graphic Designer', category: 'Creative' },
  { name: 'Video Editor', category: 'Creative' },
  { name: 'Project Manager', category: 'Business' },
  { name: 'Marketing Specialist', category: 'Business' },
  { name: 'HR Manager', category: 'Business' },
];

const roles = [
  'super_admin',
  'client',
  'developer',
  'designer',
  'marketer',
  'project_manager',
  'finance_admin',
  'investor',
  'talent',
  'hirer',
  'hiring_company',
  'hr_manager',
  'legal_team',
  'cofounder',
] as const;

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const defaultTenant = await prisma.tenant.upsert({
    where: { domain: 'default' },
    update: {},
    create: {
      orgName: 'RiseFlow Hub',
      domain: 'default',
      primaryColor: '#6366f1',
      planType: 'enterprise',
    },
  });
  // Brand purge: if default tenant still has old name, update it
  if (defaultTenant.orgName === 'AfriLaunch Hub' || defaultTenant.orgName === 'AfriLaunch') {
    await prisma.tenant.update({
      where: { id: defaultTenant.id },
      data: { orgName: 'RiseFlow Hub' },
    });
  }
  console.log('Seeded default tenant:', defaultTenant.orgName === 'AfriLaunch Hub' || defaultTenant.orgName === 'AfriLaunch' ? 'RiseFlow Hub' : defaultTenant.orgName);

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    const email = `test-${role}@example.com`;
    const name = `Test ${role.replace('_', ' ')}`;

    await prisma.user.upsert({
      where: { email },
      update: { name, role, passwordHash, tenantId: defaultTenant.id },
      create: {
        email,
        name,
        passwordHash,
        role,
        tenantId: defaultTenant.id,
      },
    });
    console.log(`Seeded user: ${email} (${role})`);
  }

  const superAdminPassword = '1995Mobuchi@.';
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);
  await prisma.user.upsert({
    where: { email: 'ugochukwuhenry16@gmail.com' },
    update: { name: 'Super Admin', role: 'super_admin', passwordHash: superAdminHash, tenantId: defaultTenant.id },
    create: {
      email: 'ugochukwuhenry16@gmail.com',
      name: 'Super Admin',
      passwordHash: superAdminHash,
      role: 'super_admin',
      tenantId: defaultTenant.id,
    },
  });
  console.log('Seeded Super Admin: ugochukwuhenry16@gmail.com');

  // CMS: default content (Super Admin can edit via CMS Manager)
  const cmsEntries: Array<{ key: string; value: string; type: string; page: string }> = [
    { key: 'home.hero.title', value: 'Turn Ideas Into Real Startups', type: 'text', page: 'home' },
    { key: 'home.hero.subtitle', value: 'From Idea to Impact — Build your venture with expert support.', type: 'text', page: 'home' },
    { key: 'home.cta.label', value: 'Get Started', type: 'text', page: 'home' },
    { key: 'pricing.setupFee', value: 'One-time setup fee to unlock your workspace.', type: 'text', page: 'pricing' },
    { key: 'pricing.investorFee', value: 'Investor onboarding fee for deal room access.', type: 'text', page: 'pricing' },
    { key: 'email.welcome.subject', value: 'Welcome to RiseFlow Hub', type: 'text', page: 'email' },
    { key: 'legal.terms', value: 'Terms of Service content — edit in CMS Manager.', type: 'richtext', page: 'legal' },
    { key: 'legal.privacy', value: 'Privacy Policy content — edit in CMS Manager.', type: 'richtext', page: 'legal' },
    // Hiring / Talent Marketplace — editable in CMS (Super Admin)
    { key: 'hiring.roleCategories', value: JSON.stringify(['Tech Roles', 'Creative Roles', 'Business Roles']), type: 'json', page: 'hiring' },
    { key: 'hiring.skillList', value: JSON.stringify(['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer', 'DevOps Engineer', 'AI Engineer', 'Data Analyst', 'Cybersecurity', 'UI/UX Designer', 'Graphic Designer', 'Video Editor', 'Animator', 'Project Manager', 'HR Manager', 'Recruiter', 'Marketing Specialist', 'Social Media Manager']), type: 'json', page: 'hiring' },
    { key: 'hiring.talentFeeUsd', value: '7', type: 'text', page: 'hiring' },
    { key: 'hiring.companyFeeUsd', value: '20', type: 'text', page: 'hiring' },
  ];

  const defaultRevenueModel = {
    visible: true,
    // Legacy single-version (fallback when landing/investor missing)
    title: 'Our Fair Growth-Based Pricing Model',
    intro:
      'Our pricing structure is designed to support entrepreneurs at early stages while ensuring sustainable growth for both users and the platform.',
    sections: [
      { title: 'Reducing Early Financial Pressure', body: 'Startups often struggle with recurring costs. Monthly subscriptions can discourage early founders. Our one-time onboarding fee lowers entry barriers. This shows we are founder-friendly and growth-focused.' },
      { title: 'We Are a Growth Platform, Not a Subscription Tool', body: 'We are an entrepreneur enablement platform. Users are here to build, grow, and launch. We provide tools, structure, and guidance. We are a growth partner, not just a SaaS product.' },
      { title: 'Revenue Is Tied to Progress', body: "Payments occur at development stages: consultation phases, feature upgrades, and project advancement. Our success grows as our users' businesses grow." },
      { title: 'When Recurring Fees Begin', body: "Recurring fees apply only when a user's product goes live — such as a website, app, software platform, or online system. These recurring costs cover real infrastructure: database storage, frontend hosting (e.g. Vercel), backend hosting (e.g. Render/servers), security & monitoring, and ongoing maintenance. These are operational costs to keep live systems running, not platform access fees." },
      { title: 'Fairness & Trust', body: 'No endless subscriptions. Recurring fees only when systems are live. Payments tied to real services. Transparent structure.' },
      { title: 'Market Positioning', body: 'Most platforms charge for time. We charge for growth and real execution. We are a startup growth partner and technical execution team.' },
    ],
    summaryBullets: ['No endless subscriptions', 'Recurring fees only when systems are live', 'Payments tied to real services', 'Transparent structure'],
    revenueStreams: ['One-time onboarding', 'Milestone-based progress payments', 'Development & service work', 'Maintenance fees after launch'],
    marketPositioning: 'Most platforms charge for time. We charge for growth and real execution. We are a startup growth partner and technical execution team.',
    // 1) LANDING PAGE VERSION (conversion-focused)
    landing: {
      title: 'Built for Founders — Not Subscriptions',
      intro:
        'We don\'t believe in trapping entrepreneurs in monthly fees before they even launch.\n\nOur platform uses a growth-based model designed to support you from idea to launch without adding financial pressure.',
      sections: [
        {
          title: 'One-Time Onboarding Fee',
          body:
            'A small one-time fee gets you into the system, unlocks tools, consultation access, and your startup dashboard.\n\nNo recurring charges just to "stay on the platform."',
        },
        {
          title: 'You Pay as You Grow',
          body:
            'Instead of subscriptions, costs happen when your business progresses:\n\nDevelopment stages\nFeature upgrades\nExpert support\nProject milestones\n\nYour growth = our growth.',
        },
        {
          title: 'When Do Monthly Fees Start?',
          body:
            'Only after your product is live (website/app/software running).\n\nThat\'s because real systems have real costs:\n\nHosting\nDatabase storage\nSecurity\nTechnical maintenance\n\nThese fees keep your live system running — not just platform access.',
        },
      ],
      summaryTitle: 'Why Founders Love This',
      summaryBullets: [
        'No early subscription stress',
        'Payments tied to real progress',
        'Transparent and fair',
        'Built for serious entrepreneurs',
      ],
    },
    // 2) INVESTOR VERSION (professional + strategic)
    investor: {
      title: 'Revenue Model Strategy',
      intro:
        'Our platform operates on a growth-aligned monetization structure, designed to reduce early friction for users while creating diversified, scalable revenue streams.',
      sections: [
        {
          title: '1. One-Time Onboarding Fee',
          body:
            'A low-friction entry point that:\n\nEncourages adoption\nReduces churn from subscription fatigue\nPositions the platform as founder-first\n\nThis increases early user acquisition rates.',
        },
        {
          title: '2. Milestone-Based Monetization',
          body:
            'Revenue is triggered by user progress, including:\n\nConsultation phases\nDevelopment stages\nFeature unlocks\nTechnical services\n\nThis aligns platform revenue directly with startup growth outcomes.',
        },
        {
          title: '3. Post-Launch Recurring Maintenance',
          body:
            'Recurring revenue begins only when user systems go live.\n\nCovers real infrastructure costs:\n\nCloud hosting\nDatabase storage\nSecurity monitoring\nOngoing system maintenance\n\nThis produces predictable recurring income while being value-justified.',
        },
        {
          title: '4. Hybrid Revenue Model',
          body:
            'We generate income through:\n\nOnboarding fees\nService & development revenue\nMilestone payments\nPost-launch maintenance subscriptions\n\nThis creates both transactional and recurring revenue streams.',
        },
        {
          title: '5. Market Differentiation',
          body:
            'Unlike traditional SaaS platforms that charge for time access, our model charges for:\n\nBusiness progress\nTechnical execution\nOperational support\n\nWe operate as a startup growth partner, not just a software tool.',
        },
      ],
      strategicAdvantageTitle: 'Strategic Advantage',
      strategicAdvantage: [
        'Increases early adoption',
        'Reduces pricing resistance',
        'Aligns incentives with user success',
        'Builds long-term retention',
        'Improves lifetime customer value (LTV)',
      ],
    },
  };
  await prisma.cmsContent.upsert({
    where: { key: 'revenue_model' },
    update: { value: JSON.stringify(defaultRevenueModel), type: 'json', page: 'revenue_model' },
    create: {
      key: 'revenue_model',
      value: JSON.stringify(defaultRevenueModel),
      type: 'json',
      page: 'revenue_model',
      updatedById: null,
    },
  });
  console.log('Seeded CMS revenue_model (Revenue Model Transparency)');

  const defaultPricingJourney = {
    visible: true,
    headline: 'Your Platform Pricing Journey',
    subheadline: 'Think of it like a startup growth staircase, not a payment wall.',
    steps: [
      {
        stageLabel: 'STEP 1 — ENTRY STAGE',
        stageTitle: 'Founder Onboarding',
        payLabel: 'What they pay:',
        payValue: 'One-time setup fee',
        unlocks: [
          'Startup workspace',
          'Idea validation tools',
          'Dashboard access',
          'Consultation booking',
          'Guidance system',
          'Business structure tools',
        ],
        purpose: 'Remove barriers and welcome serious founders without trapping them in subscriptions.',
        color: 'green',
      },
      {
        stageLabel: 'STEP 2 — BUILDING STAGE',
        stageTitle: 'Startup Development Phase',
        payLabel: 'No monthly subscription yet. Instead, payments happen only when needed:',
        payValue: null,
        tableRows: [
          { growthAction: 'Expert consultation', paymentType: 'Session fee' },
          { growthAction: 'Feature development', paymentType: 'Milestone fee' },
          { growthAction: 'Product building', paymentType: 'Project phase payment' },
          { growthAction: 'Special tools unlock', paymentType: 'Upgrade fee' },
        ],
        messageUser: 'You only pay when your startup moves forward.',
        messageInvestor: 'Revenue tied to user progress = higher lifetime value.',
        color: 'yellow',
      },
      {
        stageLabel: 'STEP 3 — LAUNCH STAGE',
        stageTitle: 'Startup Goes Live',
        payLabel: 'Now their system exists publicly (website/app/software). This is where recurring maintenance begins.',
        payValue: null,
        tableRows: [
          { whatItCovers: 'Cloud hosting', whyNeeded: 'Keeps app/site online' },
          { whatItCovers: 'Database storage', whyNeeded: 'Saves user & business data' },
          { whatItCovers: 'Security monitoring', whyNeeded: 'Protects system' },
          { whatItCovers: 'System maintenance', whyNeeded: 'Prevents downtime' },
        ],
        note: 'This is not a platform fee. It is operational infrastructure cost.',
        color: 'blue',
      },
      {
        stageLabel: 'STEP 4 — SCALE STAGE',
        stageTitle: 'Business Growth Expansion',
        payLabel: 'As startups grow, they may choose:',
        payValue: null,
        options: [
          'Advanced analytics',
          'Automation tools',
          'AI features',
          'Marketplace promotion',
          'Investor access',
        ],
        note: 'These create additional revenue layers.',
        color: 'purple',
      },
    ],
    revenueTable: [
      { revenueType: 'Onboarding Fee', whenItHappens: 'At entry' },
      { revenueType: 'Milestone Payments', whenItHappens: 'During building' },
      { revenueType: 'Service/Development Fees', whenItHappens: 'When features are built' },
      { revenueType: 'Maintenance Subscription', whenItHappens: 'After launch' },
      { revenueType: 'Growth Upgrades', whenItHappens: 'During scaling' },
    ],
    revenueFlowLabel: 'Entry → Progress → Launch → Scale',
    whyHeadline: 'Why This Model Is Powerful',
    whyMostSay: 'Pay us every month or lose access.',
    whyYouSay: 'Grow your business. Pay when there is real value.',
    whyPartnerLabel: 'A partner',
    whyBillLabel: 'Not a bill',
    diagramHeadline: 'Simple view:',
    diagramSteps: ['Join Platform', 'Build Your Startup', 'Launch Your Product', 'Scale Your Business'],
    diagramLabels: ['One-Time Fee', 'Milestone Payments', 'Maintenance', 'Growth Tools'],
  };
  await prisma.cmsContent.upsert({
    where: { key: 'pricing_journey' },
    update: { value: JSON.stringify(defaultPricingJourney), type: 'json', page: 'revenue_model' },
    create: {
      key: 'pricing_journey',
      value: JSON.stringify(defaultPricingJourney),
      type: 'json',
      page: 'revenue_model',
      updatedById: null,
    },
  });
  console.log('Seeded CMS pricing_journey (Pricing Journey Visual Flow)');

  for (const entry of cmsEntries) {
    await prisma.cmsContent.upsert({
      where: { key: entry.key },
      update: { value: entry.value, type: entry.type, page: entry.page },
      create: { ...entry, updatedById: null },
    });
  }
  console.log(`Seeded ${cmsEntries.length} CMS content entries`);

  // Skills (for talent marketplace & hiring) — only if none exist
  const skillCount = await prisma.skill.count();
  if (skillCount === 0) {
    await prisma.skill.createMany({ data: SKILLS });
    console.log(`Seeded ${SKILLS.length} skills`);
  } else {
    console.log('Skills already present, skipping');
  }

  // FAQ items (homepage + /faq)
  try {
    const faqCount = await prisma.faqItem.count();
    if (faqCount === 0) {
      await prisma.faqItem.createMany({
        data: [
          {
            question: 'What is this platform about?',
            answer:
              'RiseFlow Hub is a global startup growth and venture enablement platform that helps entrepreneurs turn ideas into real startups through technology, guidance, and investor connection.',
            category: 'general',
            order: 1,
            isActive: true,
            isHighlighted: true,
          },
          {
            question: 'Who is this platform for?',
            answer:
              'It is built for founders with ideas, early-stage startups that need structure, and investors looking for vetted opportunities around the world.',
            category: 'general',
            order: 2,
            isActive: true,
            isHighlighted: true,
          },
          {
            question: 'What do I get when I join as a founder?',
            answer:
              'You get idea evaluation, business model creation, website/app development, an AI startup mentor, business administration tools, and investor visibility once you are ready.',
            category: 'founders',
            order: 1,
            isActive: true,
            isHighlighted: true,
          },
          {
            question: 'I only have an idea, can I join?',
            answer:
              'Yes. The platform is designed to help you move from idea stage to a structured, launched business. You do not need a finished product before joining.',
            category: 'founders',
            order: 2,
            isActive: true,
            isHighlighted: false,
          },
          {
            question: 'What is the process from idea to startup?',
            answer:
              'You submit your idea → our AI and team evaluate it → we help you shape a business model → development and branding begin → your product is launched on the platform → you get support for growth and investor access.',
            category: 'process',
            order: 1,
            isActive: true,
            isHighlighted: true,
          },
          {
            question: 'How are startups vetted for investors?',
            answer:
              'We combine AI-based scoring, human business analysis, and structured evaluation of traction, team, market, and product readiness before presenting startups to investors.',
            category: 'investors',
            order: 1,
            isActive: true,
            isHighlighted: true,
          },
          {
            question: 'How do I invest through the platform?',
            answer:
              'You browse approved startups, request access to their deal room, review documents and metrics, then express interest, request a meeting, or make an offer through the investment workflow.',
            category: 'investors',
            order: 2,
            isActive: true,
            isHighlighted: false,
          },
          {
            question: 'Why is there a setup fee?',
            answer:
              'The setup fee covers evaluation, business structuring, onboarding, and initial resources needed to support your project before launch.',
            category: 'pricing',
            order: 1,
            isActive: true,
            isHighlighted: false,
          },
          {
            question: 'Is my idea safe on this platform?',
            answer:
              'Yes. We use NDAs, role-based access control, and secure storage. Only relevant team members and approved investors can see sensitive startup information.',
            category: 'security',
            order: 1,
            isActive: true,
            isHighlighted: false,
          },
          {
            question: 'What makes this platform different?',
            answer:
              'RiseFlow Hub combines product development, business intelligence, AI mentorship, structured venture support, and investor access in one integrated platform designed for global founders.',
            category: 'benefits',
            order: 1,
            isActive: true,
            isHighlighted: true,
          },
          {
            question: 'What is the long-term goal of the platform?',
            answer:
              'Our vision is to build a global ecosystem where great ideas are not lost due to lack of structure, technology, or funding — bringing founders together from all regions.',
            category: 'vision',
            order: 1,
            isActive: true,
            isHighlighted: false,
          },
        ],
      });
      console.log('Seeded initial FAQ items');
    } else {
      console.log('FAQ items already present, skipping');
    }
    // Brand purge: update "What makes this platform different?" if it still has old brand
    const benefitsFaqNewAnswer =
      'RiseFlow Hub combines product development, business intelligence, AI mentorship, structured venture support, and investor access in one integrated platform designed for global founders.';
    const updated = await prisma.faqItem.updateMany({
      where: {
        question: 'What makes this platform different?',
        category: 'benefits',
        OR: [
          { answer: { contains: 'AfriLaunch Hub', mode: 'insensitive' } },
          { answer: { contains: 'AfriLaunch', mode: 'insensitive' } },
        ],
      },
      data: { answer: benefitsFaqNewAnswer },
    });
    if (updated.count > 0) {
      console.log(`Brand purge: updated ${updated.count} FAQ answer(s) from AfriLaunch to RiseFlow Hub`);
    }
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2021') {
      console.log('Skipping FAQ seeding (table not found). Run: pnpm run db:push');
    } else {
      throw e;
    }
  }

  // Agreement templates (for Legal / Admin to assign) — requires DB to have Agreement columns (content_html, status, etc.). Run db:push if needed.
  const agreementCount = await prisma.agreement.count();
  if (agreementCount === 0) {
    const superAdminUser = await prisma.user.findFirst({ where: { role: 'super_admin' }, select: { id: true } });
    const createdById = superAdminUser?.id ?? null;
    const date = new Date().toISOString().slice(0, 10);

    const agreementTemplates: { title: string; type: 'NDA' | 'MOU' | 'Terms' | 'FairTreatment' | 'HireContract' }[] = [
      { title: 'Standard NDA', type: 'NDA' },
      { title: 'Memorandum of Understanding', type: 'MOU' },
      { title: 'Platform Terms', type: 'Terms' },
      { title: 'Fair Treatment Agreement', type: 'FairTreatment' },
      { title: 'Contractor Agreement', type: 'HireContract' },
    ];
    try {
      for (const t of agreementTemplates) {
        const contentHtml = fillAgreementTemplate(t.type, { date, partyName: '________________', companyName: 'RiseFlow Hub', role: '________________' });
        await prisma.agreement.create({
          data: { title: t.title, type: t.type, contentHtml, createdById, status: 'Pending', version: 1 },
        });
      }
      console.log(`Seeded ${agreementTemplates.length} agreement templates`);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2022') {
        console.log('Skipping agreement templates (DB missing new Agreement columns). Run: pnpm run db:push');
      } else {
        throw e;
      }
    }
  } else {
    console.log('Agreements already present, skipping');
  }

  // Assign one agreement to test-client so client dashboard "Agreements to Sign" has content in E2E
  try {
    const clientUser = await prisma.user.findFirst({ where: { email: 'test-client@example.com' }, select: { id: true } });
    const firstAgreement = await prisma.agreement.findFirst({ select: { id: true } });
    if (clientUser && firstAgreement) {
      const existing = await prisma.assignedAgreement.count({
        where: { userId: clientUser.id, agreementId: firstAgreement.id },
      });
      if (existing === 0) {
        await prisma.assignedAgreement.create({
          data: {
            agreementId: firstAgreement.id,
            userId: clientUser.id,
            status: 'Pending',
          },
        });
        console.log('Seeded 1 assigned agreement (Pending) for test-client');
      }
    }
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2003') {
      console.log('Skipping assigned agreement seed (table or relation missing). Run: pnpm run db:push');
    } else {
      throw e;
    }
  }

  // Sample notifications (so the bell has something to show)
  try {
    const clientUser = await prisma.user.findFirst({ where: { email: 'test-client@example.com' }, select: { id: true } });
    if (clientUser) {
      const existingNotif = await prisma.notification.count({ where: { userId: clientUser.id } });
      if (existingNotif === 0) {
        await prisma.notification.createMany({
          data: [
            { userId: clientUser.id, type: 'agreement', title: 'Welcome to RiseFlow Hub', message: 'Complete your profile and explore the dashboard.', link: '/dashboard', read: false },
            { userId: clientUser.id, type: 'payment', title: 'Setup fee', message: 'Pay the one-time setup fee to unlock your workspace.', link: '/dashboard', read: false },
          ],
        });
        console.log('Seeded 2 sample notifications for test-client');
      }
    }
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2021') {
      console.log('Skipping notifications (table not found). Run: pnpm run db:push');
    } else {
      throw e;
    }
  }

  console.log('\nSeed complete. Test users (password for all):', TEST_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
