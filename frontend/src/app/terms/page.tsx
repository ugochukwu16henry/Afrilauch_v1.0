import { LegalLayout } from '@/components/legal/LegalLayout';

export const metadata = {
  title: 'Terms of Service — RiseFlow Hub',
  description:
    'Terms of Service for RiseFlow Hub: startup development, payments, milestones, IP ownership, and termination.',
};

const LAST_UPDATED = 'January 2025';

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="Please read these terms carefully before using RiseFlow Hub."
      lastUpdated={LAST_UPDATED}
    >
      <h2 id="acceptance">1. Acceptance of Terms</h2>
      <p>
        By accessing or using RiseFlow Hub (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.
      </p>

      <h2 id="platform">2. Nature of the Platform</h2>
      <p>
        RiseFlow Hub is a <strong>startup development service</strong>. We help entrepreneurs turn ideas into products and businesses by providing development, design, marketing, project management, and access to tools and resources. We do not provide legal, tax, or financial advice. Outcomes depend on your inputs, market conditions, and execution.
      </p>

      <h2 id="payments">3. Payments & Milestone Terms</h2>
      <p>
        Fees and payment terms are set out in your project agreement or proposal. Unless otherwise agreed:
      </p>
      <ul>
        <li>Payments may be tied to <strong>milestones</strong> (e.g., design approval, MVP delivery, launch).</li>
        <li>You are responsible for paying on the due dates. Late payment may result in pause of work or interest.</li>
        <li>Refunds are handled per your contract; generally, work already delivered is non-refundable.</li>
        <li>We may use third-party payment processors; their terms also apply to payment processing.</li>
      </ul>

      <h2 id="funding">4. No Guarantee of Funding</h2>
      <p>
        The Platform may offer features that connect founders with investors (e.g., marketplace, introductions). <strong>We do not guarantee that you will receive funding</strong>. Investor interest, due diligence, and investment decisions are solely between you and the investor. We are not a broker, adviser, or party to any investment.
      </p>

      <h2 id="ip">5. Intellectual Property</h2>
      <ul>
        <li><strong>Your idea and content:</strong> You retain ownership of your business idea, brand, content you provide, and any custom deliverables expressly assigned to you in your project agreement.</li>
        <li><strong>Platform tools and IP:</strong> We own our platform, software, templates, methodologies, and pre-existing tools. Unless your agreement says otherwise, we do not transfer ownership of our tools or platform IP to you; we grant you a license to use deliverables as agreed.</li>
        <li><strong>Deliverables:</strong> Ownership of project deliverables (e.g., code, designs) will be as set out in your specific project or service agreement.</li>
      </ul>

      <h2 id="termination">6. Termination</h2>
      <p>
        We or you may terminate or suspend access in line with your agreement and these terms. On termination:
      </p>
      <ul>
        <li>Your right to use the Platform ceases; you must stop using our services and (where applicable) return or delete confidential materials.</li>
        <li>Sections that by their nature should survive (e.g., IP, limitations of liability, dispute resolution) continue to apply.</li>
        <li>Outstanding fees remain due; we may retain or delete your data as described in our Privacy Policy.</li>
      </ul>

      <h2 id="general">7. General</h2>
      <p>
        We may update these terms from time to time; continued use after changes constitutes acceptance. These terms are governed by the law specified in your agreement or, if none, the laws of the jurisdiction in which we operate. For questions, contact us via the details on our website.
      </p>
    </LegalLayout>
  );
}
