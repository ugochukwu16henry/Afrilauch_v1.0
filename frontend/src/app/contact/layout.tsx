import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — RiseFlow Hub',
  description:
    'Have a question, partnership idea, or need support? Reach out. Email support, business inquiries, partnerships, or send a message.',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
