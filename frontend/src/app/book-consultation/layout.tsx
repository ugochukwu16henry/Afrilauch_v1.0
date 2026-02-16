import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Consultation — RiseFlow Hub',
  description:
    'Book a consultation and get expert guidance on turning your idea into a real business. 30–45 minute strategy session with idea clarity and roadmap.',
};

export default function BookConsultationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
