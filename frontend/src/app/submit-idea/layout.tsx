import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submit your idea — RiseFlow Hub',
  description:
    'Submit your startup idea for AI evaluation and a tailored proposal. We create your account, evaluate your idea, and prepare your startup roadmap.',
};

export default function SubmitIdeaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
