import Link from 'next/link';
import { Nav, Section, Footer, PricingPlans } from '@/components/landing';
import { RevenueModelSection } from '@/components/common/RevenueModelSection';
import { PricingJourneySection } from '@/components/common/PricingJourneySection';

export const metadata = {
  title: 'Pricing — RiseFlow Hub',
  description:
    'Transparent, startup-friendly pricing. We structure pricing based on scope, complexity, and growth goals — with setup fees, milestone payments, and optional subscription.',
};

const PAYMENT_ITEMS = [
  {
    title: 'Setup fee',
    description: 'A clear upfront fee to kick off your project and lock scope.',
  },
  {
    title: 'Milestone payments',
    description: 'Pay as we hit agreed milestones — no big lump sum upfront.',
  },
  {
    title: 'Optional monthly subscription',
    description: 'Ongoing support, hosting, or growth services on a monthly plan.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-text-dark">
      <Nav />

      {/* Intro */}
      <section className="relative overflow-hidden bg-white px-4 py-16 sm:py-20">
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            background: 'linear-gradient(165deg, #E8F4EE 0%, #E8EEF7 100%)',
          }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl md:text-5xl">
            Transparent, Startup-Friendly Pricing
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            Every idea is different. We structure pricing based on scope, complexity, and growth goals.
          </p>
        </div>
      </section>

      {/* Plans */}
      <Section id="plans" variant="muted">
        <PricingPlans />
      </Section>

      {/* How our pricing works — Revenue model transparency */}
      <Section id="how-pricing-works" variant="muted">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
            How Our Pricing Works
          </h2>
        </div>
        <RevenueModelSection source="pricing" variant="full" />
        <PricingJourneySection className="mt-12" source="pricing" />
      </Section>

      {/* Payment structure */}
      <Section id="payment">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
            How You Pay
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Flexible payment structure — no surprises.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {PAYMENT_ITEMS.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-6 transition hover:border-primary/20 hover:bg-primary/5"
            >
              <h3 className="text-lg font-semibold text-text-dark">{item.title}</h3>
              <p className="mt-2 text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section variant="dark">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Get My Custom Proposal
          </h2>
          <p className="mt-4 text-white/85">
            Tell us your idea and goals — we&apos;ll send a tailored proposal with scope and pricing.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition"
          >
            Get My Custom Proposal
          </Link>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
