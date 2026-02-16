 'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SocialLinksBar } from '@/components/common/SocialLinksBar';

const FOOTER_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Team', href: '/team' },
  { label: 'Submit idea', href: '/submit-idea' },
  { label: 'Book consultation', href: '/book-consultation' },
  { label: 'Investors', href: '/investors' },
  { label: 'Startups', href: '/startups' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'User Agreement', href: '/user-agreement' },
];

export function Footer() {
  return (
    <footer id="contact" className="border-t border-gray-200 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <Link href="/" className="flex items-center gap-2 font-semibold text-secondary">
            <Image src="/RiseFlowHub%20logo.png" alt="RiseFlow Hub" width={32} height={32} className="h-8 w-auto object-contain" />
            <span>RiseFlow Hub</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-primary transition"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <SocialLinksBar variant="light" size="sm" align="center" />
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} RiseFlow Hub. Build. Grow. Launch.
        </p>
      </div>
    </footer>
  );
}
