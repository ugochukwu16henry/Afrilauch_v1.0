import { LegalLayout } from '@/components/legal/LegalLayout';

export const metadata = {
  title: 'Privacy Policy — RiseFlow Hub',
  description:
    'How RiseFlow Hub collects, uses, and protects your data.',
};

const LAST_UPDATED = 'January 2025';

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How we collect, use, and protect your personal information."
      lastUpdated={LAST_UPDATED}
    >
      <h2 id="intro">1. Introduction</h2>
      <p>
        RiseFlow Hub (&quot;we&quot;, &quot;us&quot;) is committed to protecting your privacy. This policy describes what data we collect, how we use it, and how we protect it.
      </p>

      <h2 id="data-collected">2. Data We Collect</h2>
      <p>We may collect:</p>
      <ul>
        <li><strong>Account and profile:</strong> Name, email, password (hashed), role, and tenant/organization.</li>
        <li><strong>Project and business:</strong> Business name, idea summary, industry, budget range, goals, and project-related content.</li>
        <li><strong>Consultations and leads:</strong> Contact details, business idea, preferences, and communication history.</li>
        <li><strong>Usage and technical:</strong> Logs, IP address, device/browser type, and how you use the platform (e.g., pages visited, actions taken).</li>
        <li><strong>Agreements and signatures:</strong> Electronic signature data, IP address at signing, and related audit information.</li>
      </ul>

      <h2 id="how-used">3. How We Use Your Data</h2>
      <p>We use your data to:</p>
      <ul>
        <li>Provide and operate the Platform (accounts, projects, milestones, tasks, agreements).</li>
        <li>Process payments and communicate about your projects and services.</li>
        <li>Send transactional and, where permitted, marketing communications (you can opt out).</li>
        <li>Improve our services, security, and user experience.</li>
        <li>Comply with law and enforce our terms.</li>
        <li>Support multi-tenant and white-label features (e.g., per-organization branding and access).</li>
      </ul>

      <h2 id="protection">4. Data Protection</h2>
      <p>
        We implement appropriate technical and organizational measures to protect your data, including encryption (e.g., in transit and at rest where applicable), access controls, and secure development practices. Access to personal data is limited to those who need it. We retain data only as long as necessary for the purposes in this policy or as required by law.
      </p>

      <h2 id="third-party">5. Third-Party Services</h2>
      <p>
        We may use third-party services for hosting, email, payments, analytics, and support. These providers may process your data on our behalf and have their own privacy policies. We choose providers that commit to appropriate safeguards. Examples include:
      </p>
      <ul>
        <li>Cloud and hosting providers (e.g., for servers and databases).</li>
        <li>Email and notification services (e.g., transactional and marketing email).</li>
        <li>Payment processors (for billing and payments).</li>
        <li>Analytics and monitoring tools (to improve the Platform).</li>
      </ul>
      <p>
        We do not sell your personal information to third parties for their marketing.
      </p>

      <h2 id="rights">6. Your Rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or restrict processing of your data, or to object to certain uses. You can update account and profile data in the Platform; for other requests, contact us using the details on our website. You may also have the right to lodge a complaint with a supervisory authority.
      </p>

      <h2 id="changes">7. Changes</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the updated version on the Platform and indicate the &quot;Last updated&quot; date. Continued use after changes constitutes acceptance of the updated policy.
      </p>
    </LegalLayout>
  );
}
