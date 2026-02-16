export type CmsFieldType = 'text' | 'richtext' | 'image' | 'json';

export interface CmsFieldDef {
  key: string;
  label: string;
  type: CmsFieldType;
  placeholder?: string;
}

export interface CmsSectionConfig {
  pageName: string;
  title: string;
  description?: string;
  fields: CmsFieldDef[];
}

export const cmsSections: Record<string, CmsSectionConfig> = {
  'website-pages': {
    pageName: 'home',
    title: 'Website Pages',
    description: 'Homepage and public website content.',
    fields: [
      { key: 'home.hero.title', label: 'Hero Title', type: 'text', placeholder: 'Turn Ideas Into Real Startups' },
      { key: 'home.hero.subtitle', label: 'Hero Subtitle', type: 'richtext', placeholder: 'Subtitle text' },
      { key: 'home.problem.title', label: 'Problem Section Title', type: 'text' },
      { key: 'home.problem.description', label: 'Problem Section Description', type: 'richtext' },
      { key: 'home.about.title', label: 'About Section Title', type: 'text' },
      { key: 'home.about.body', label: 'About Section Body', type: 'richtext' },
      { key: 'home.cta.label', label: 'Primary CTA Button Label', type: 'text', placeholder: 'Get Started' },
    ],
  },
  'dashboard-content': {
    pageName: 'dashboard',
    title: 'Dashboard Content',
    description: 'Text shown in user dashboards.',
    fields: [
      { key: 'dashboard.welcome.title', label: 'Welcome Title', type: 'text' },
      { key: 'dashboard.welcome.message', label: 'Welcome Message', type: 'richtext' },
      { key: 'dashboard.empty.projects', label: 'Empty State (Projects)', type: 'text' },
      { key: 'dashboard.empty.tasks', label: 'Empty State (Tasks)', type: 'text' },
    ],
  },
  pricing: {
    pageName: 'pricing',
    title: 'Pricing Controls',
    description: 'Setup fees, investor fees, plan prices.',
    fields: [
      { key: 'pricing.setupFee', label: 'Setup Fee (USD) Description', type: 'text', placeholder: 'e.g. One-time setup fee' },
      { key: 'pricing.investorFee', label: 'Investor Fee Description', type: 'text' },
      { key: 'pricing.plan.ideaStarter.price', label: 'Idea Starter Plan Price (display)', type: 'text', placeholder: 'e.g. $99' },
      { key: 'pricing.plan.ideaStarter.features', label: 'Idea Starter Features (JSON array or text)', type: 'text' },
    ],
  },
  legal: {
    pageName: 'legal',
    title: 'Legal Documents',
    description: 'Terms, Privacy, Agreements (rich text).',
    fields: [
      { key: 'legal.terms', label: 'Terms of Service', type: 'richtext' },
      { key: 'legal.privacy', label: 'Privacy Policy', type: 'richtext' },
      { key: 'legal.agreement', label: 'Default Agreement Text', type: 'richtext' },
    ],
  },
  'email-templates': {
    pageName: 'email',
    title: 'Email Templates',
    description: 'Subject and body for system emails.',
    fields: [
      { key: 'email.welcome.subject', label: 'Welcome Email Subject', type: 'text' },
      { key: 'email.welcome.body', label: 'Welcome Email Body', type: 'richtext' },
      { key: 'email.payment.receipt', label: 'Payment Receipt Email Body', type: 'richtext' },
      { key: 'email.agreement.pending', label: 'Agreement Pending Subject', type: 'text' },
    ],
  },
  'feature-descriptions': {
    pageName: 'features',
    title: 'Feature Descriptions',
    description: 'Roles and feature copy.',
    fields: [
      { key: 'features.roles.client', label: 'Client Role Description', type: 'text' },
      { key: 'features.roles.investor', label: 'Investor Role Description', type: 'text' },
      { key: 'features.mentor.title', label: 'AI Mentor Title', type: 'text' },
      { key: 'features.marketplace.title', label: 'Marketplace Title', type: 'text' },
    ],
  },
  'system-messages': {
    pageName: 'system',
    title: 'System Messages',
    description: 'Notifications and form labels.',
    fields: [
      { key: 'system.notifications.success', label: 'Generic Success Message', type: 'text' },
      { key: 'system.notifications.error', label: 'Generic Error Message', type: 'text' },
      { key: 'system.forms.submit', label: 'Submit Button Label', type: 'text', placeholder: 'Submit' },
      { key: 'system.forms.cancel', label: 'Cancel Button Label', type: 'text', placeholder: 'Cancel' },
    ],
  },
  hiring: {
    pageName: 'hiring',
    title: 'Hiring & Talent Marketplace',
    description: 'Role categories, skill list, and platform fees. Used on Join as Talent and marketplace.',
    fields: [
      { key: 'hiring.roleCategories', label: 'Role Categories (JSON array)', type: 'json', placeholder: '["Tech Roles","Creative Roles","Business Roles"]' },
      { key: 'hiring.skillList', label: 'Skill List (JSON array)', type: 'json', placeholder: '["Frontend Developer","Backend Developer",...]' },
      { key: 'hiring.talentFeeUsd', label: 'Talent marketplace fee (USD)', type: 'text', placeholder: '7' },
      { key: 'hiring.companyFeeUsd', label: 'Hiring company fee (USD)', type: 'text', placeholder: '20' },
    ],
  },
  'revenue-model': {
    pageName: 'revenue_model',
    title: 'Revenue Model Transparency',
    description: 'Two variants: landing (conversion-focused) on homepage, pricing, onboarding, dashboard; investor (strategic) on deal room. Plus Pricing Journey (visual flow). Toggle visible in each JSON.',
    fields: [
      {
        key: 'revenue_model',
        label: 'Revenue model content (JSON: visible, landing, investor)',
        type: 'json',
        placeholder: '{"visible":true,"landing":{...},"investor":{...}}',
      },
      {
        key: 'pricing_journey',
        label: 'Pricing Journey visual flow (JSON: visible, headline, subheadline, steps[], revenueTable[], diagramSteps[], diagramLabels[])',
        type: 'json',
        placeholder: '{"visible":true,"headline":"...","steps":[...],"revenueTable":[...]}',
      },
    ],
  },
};

export const cmsSectionSlugs = Object.keys(cmsSections) as string[];
