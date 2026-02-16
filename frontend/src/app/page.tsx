import {
  Nav,
  Hero,
  Problem,
  Solution,
  HowItWorks,
  AIPower,
  ForInvestors,
  PlatformFeatures,
  Vision,
  FinalCTA,
  Footer,
  FAQPreview,
  SupportBanner,
  Section,
} from '@/components/landing';
import { RevenueModelSection } from '@/components/common/RevenueModelSection';
import { PricingJourneySection } from '@/components/common/PricingJourneySection';
import { type FaqItem } from '@/lib/api';
import { pageContentFallback } from '@/data/pageContent';
import type { HomePageContent } from '@/data/pageContent';
import type { Metadata } from 'next';

/**
 * Fetch page content from CMS API. Falls back to static content when API returns 404.
 * Future: Super Admin edits → save to DB → this API returns dynamic content.
 */
async function getPageContent(slug: 'home' = 'home'): Promise<HomePageContent> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/content/${slug}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('No dynamic content');
    return await res.json();
  } catch {
    return pageContentFallback[slug] as HomePageContent;
  }
}

async function getHighlightedFaqs(): Promise<Pick<FaqItem, 'id' | 'question' | 'answer'>[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/faq?highlighted=true&limit=6`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed');
    const data = (await res.json()) as { items: FaqItem[] };
    return data.items.map((i) => ({ id: i.id, question: i.question, answer: i.answer }));
  } catch {
    return [];
  }
}

// Dynamic social share metadata for home page.
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/share-meta/home`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('No share meta');
    const meta = (await res.json()) as {
      title: string;
      description: string;
      imageUrl: string;
      canonicalUrl: string;
    };
    return {
      title: meta.title,
      description: meta.description,
      alternates: { canonical: meta.canonicalUrl },
      openGraph: {
        title: meta.title,
        description: meta.description,
        url: meta.canonicalUrl,
        images: [{ url: meta.imageUrl }],
      },
      twitter: {
        card: 'summary_large_image',
        title: meta.title,
        description: meta.description,
        images: [meta.imageUrl],
      },
    };
  } catch {
    // Fallback to layout defaults if share meta not configured yet.
    return {};
  }
}

export default async function HomePage() {
  const content = await getPageContent();
  const faqs = await getHighlightedFaqs();

  return (
    <div className="min-h-screen bg-background text-text-dark">
      <Nav />
      <main>
        <Hero content={content.hero} />
        <Problem content={content.problem} />
        <Solution content={content.solution} />
        <HowItWorks content={content.howItWorks} />
        <AIPower content={content.aiPower} />
        <ForInvestors content={content.forInvestors} />
        <PlatformFeatures content={content.platformFeatures} />
        <Section id="how-pricing-works" variant="muted">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
              How Our Pricing Works
            </h2>
          </div>
          <RevenueModelSection source="homepage" variant="full" />
          <PricingJourneySection className="mt-12" source="homepage" />
        </Section>
        <Vision content={content.vision} />
        <FAQPreview items={faqs} />
        <FinalCTA content={content.finalCta} />
        <Footer />
      </main>
      <SupportBanner />
    </div>
  );
}
