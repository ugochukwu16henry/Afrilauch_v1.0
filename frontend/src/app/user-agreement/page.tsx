import { LegalLayout } from '@/components/legal/LegalLayout';

export const metadata = {
  title: 'User Agreement — RiseFlow Hub',
  description:
    'User Agreement for RiseFlow Hub: digital agreements, electronic signatures, and responsibilities.',
};

const LAST_UPDATED = 'January 2025';

export default function UserAgreementPage() {
  return (
    <LegalLayout
      title="User Agreement"
      description="Agreement governing your use of RiseFlow Hub and digital agreements on the Platform."
      lastUpdated={LAST_UPDATED}
    >
      <h2 id="scope">1. Scope</h2>
      <p>
        This User Agreement applies to your use of RiseFlow Hub (&quot;Platform&quot;) and to <strong>digital agreements</strong> (e.g., NDAs, MOUs, terms) that you sign or manage through the Platform. It works together with our Terms of Service and Privacy Policy.
      </p>

      <h2 id="digital-agreements">2. Digital Agreements</h2>
      <p>
        The Platform allows creation, assignment, and execution of agreements in electronic form. By using the agreement and signing features, you agree that:
      </p>
      <ul>
        <li>Agreements may be presented, signed, and stored <strong>electronically</strong>.</li>
        <li>We may support multiple agreement types (e.g., NDA, MOU, Co-Founder, Terms) as made available.</li>
        <li>You are responsible for reading and understanding each agreement before you sign or accept it.</li>
      </ul>

      <h2 id="electronic-signatures">3. Electronic Signatures</h2>
      <p>
        When you sign an agreement on the Platform (e.g., by typing your name, clicking &quot;Sign&quot;, or using a signature image), you are providing an <strong>electronic signature</strong>. You agree that:
      </p>
      <ul>
        <li>Your electronic signature has the same legal effect as a handwritten signature to the extent permitted by applicable law.</li>
        <li>You have authority to sign on behalf of yourself or the entity you represent.</li>
        <li>We may record signature time, IP address, and related audit data for integrity and dispute resolution.</li>
      </ul>

      <h2 id="platform-responsibilities">4. Platform Responsibilities</h2>
      <p>We will:</p>
      <ul>
        <li>Provide the Platform and agreement/signing features with reasonable availability and security.</li>
        <li>Store agreement and signature data in accordance with our Privacy Policy and applicable law.</li>
        <li>Allow authorized users to view and manage their assigned agreements within their role and permissions.</li>
        <li>Not modify the legal content of your agreements; we provide the tooling, not legal advice.</li>
      </ul>

      <h2 id="client-responsibilities">5. Client (User) Responsibilities</h2>
      <p>You agree to:</p>
      <ul>
        <li>Provide accurate account and profile information and keep it up to date.</li>
        <li>Use the Platform only for lawful purposes and in line with our Terms of Service.</li>
        <li>Review each agreement before signing and ensure you have authority to bind yourself or your organization.</li>
        <li>Keep your login credentials secure and notify us of any unauthorized access.</li>
        <li>Not misuse the signing or agreement features (e.g., falsifying identity or consent).</li>
      </ul>

      <h2 id="enforcement">6. Enforcement and Changes</h2>
      <p>
        Breach of this User Agreement may result in suspension or termination of your access. We may update this agreement by posting a new version on the Platform; continued use after the stated effective date constitutes acceptance. For questions, contact us via the details on our website.
      </p>
    </LegalLayout>
  );
}
