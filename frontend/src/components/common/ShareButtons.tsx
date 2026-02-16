'use client';

import { useEffect, useState } from 'react';

interface ShareButtonsProps {
  title?: string;
  text?: string;
  url?: string;
}

export function ShareButtons({ title, text, url }: ShareButtonsProps) {
  const [shareUrl, setShareUrl] = useState(url || '');

  useEffect(() => {
    if (!url && typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, [url]);

  if (!shareUrl) return null;

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(text || title || 'Check this out on RiseFlow Hub');
  const encodedTitle = encodeURIComponent(title || 'RiseFlow Hub');

  const links = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      className: 'bg-green-50 text-green-700',
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      className: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      className: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      className: 'bg-indigo-50 text-indigo-700',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-gray-500 font-medium">Share this page:</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-full px-3 py-1 font-medium hover:opacity-90 transition ${l.className}`}
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

