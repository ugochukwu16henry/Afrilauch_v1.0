/**
 * Static page content fallback for CMS-editable pages.
 * When /api/content/[slug] returns no data, this is used.
 * Future: Super Admin edits content → saved to DB → API returns dynamic content.
 */

export interface HomePageContent {
  hero: {
    headline: string;
    headlineHighlight: string;
    subtext: string;
    ctaPrimary: string;
    ctaSecondary: string;
    tagline?: string;
    trustLine?: string;
  };
  problem: {
    title: string;
    subtext: string;
    items: { title: string; description: string }[];
  };
  solution: {
    title: string;
    subtext: string;
    columns: { title: string; description: string }[];
  };
  howItWorks: {
    title: string;
    subtext: string;
    steps: { num: number; title: string; desc: string }[];
    ctaText: string;
  };
  aiPower: {
    title: string;
    body: string;
    features: string[];
  };
  forInvestors: {
    title: string;
    body: string;
    ctaText: string;
    bullets: string[];
  };
  platformFeatures: {
    title: string;
    subtext: string;
    features: string[];
  };
  vision: {
    statement: string;
  };
  finalCta: {
    title: string;
    subtext: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
}

/** CMS-EDITABLE: home page fallback. Used when /api/content/home returns no dynamic content. */
export const pageContentFallback: Record<string, HomePageContent> = {
  home: {
    hero: {
      headline: 'Where Ideas Rise and',
      headlineHighlight: 'Businesses Take Shape',
      subtext:
        'RiseFlow Hub is a structured startup growth platform that helps entrepreneurs turn ideas into real, scalable companies through technology, guidance, and investor connection.',
      ctaPrimary: 'Start Building Your Idea',
      ctaSecondary: 'Explore Startups & Investors',
      tagline: 'Build. Grow. Launch.',
      trustLine: 'Helping founders move from idea to launch with clarity, structure, and real support.',
    },
    problem: {
      title: "Great Ideas Shouldn't Die in Notebooks",
      subtext:
        'Many entrepreneurs have the vision — but lack the tech, structure, and visibility to turn it into a real business.',
      items: [
        { title: 'No tech team', description: 'Ideas stay on paper without the engineering to build products.' },
        { title: 'No guidance', description: 'Missing structure, business planning, and clear milestones.' },
        { title: 'No access to investors', description: 'Great ideas never get in front of the right capital.' },
      ],
    },
    solution: {
      title: 'A Startup Launch Ecosystem',
      subtext: 'Not just an agency — we combine build, structure, and growth in one place.',
      columns: [
        { title: 'Build', description: 'We turn ideas into websites, software, and apps.' },
        { title: 'Structure', description: 'Business consulting, AI evaluation, and startup planning.' },
        { title: 'Grow', description: 'Marketing systems and investor visibility.' },
      ],
    },
    howItWorks: {
      title: 'How It Works',
      subtext: 'From idea to launch in five clear steps.',
      steps: [
        { num: 1, title: 'Submit Your Idea', desc: 'Share your vision and goals in a simple form.' },
        { num: 2, title: 'Get AI Evaluation & Proposal', desc: 'Receive feasibility scoring, scope, and a tailored proposal.' },
        { num: 3, title: 'We Build Your Product', desc: 'Our team builds your website, app, or software.' },
        { num: 4, title: 'Launch & Market', desc: 'Go live with marketing systems and analytics.' },
        { num: 5, title: 'Meet Investors', desc: 'Access our investor network and startup marketplace.' },
      ],
      ctaText: 'Start with step 1',
    },
    aiPower: {
      title: 'AI-Powered Startup Intelligence',
      body:
        'Our platform uses AI to evaluate your idea, generate proposals, suggest pricing, and surface growth insights — so you make data-backed decisions from day one.',
      features: [
        'Idea feasibility scoring',
        'Auto proposals & scope',
        'Smart pricing & multi-currency',
        'Growth insights & marketing suggestions',
      ],
    },
    forInvestors: {
      title: 'Discover High-Potential Startups',
      body:
        'Investors can browse vetted startups, view traction and milestones, and fund innovation — all in one marketplace.',
      ctaText: 'Explore Marketplace',
      bullets: ['Vetted startup profiles', 'Traction & milestones', 'Express interest & commit'],
    },
    platformFeatures: {
      title: 'Platform Features',
      subtext: 'Everything you need to build, track, and scale — in one place.',
      features: [
        'Client dashboards',
        'Project tracking',
        'Milestones & tasks',
        'Repo links',
        'Marketing analytics',
        'Secure agreements',
      ],
    },
    vision: {
      statement: "We are building the infrastructure that ensures great ideas don't die — they scale.",
    },
    finalCta: {
      title: "Have an Idea? Let's Build It.",
      subtext: "Start your project or book a consultation — we're here to help you launch.",
      ctaPrimary: 'Start My Project',
      ctaSecondary: 'Book a Consultation',
    },
  },
};

export type PageSlug = 'home';
