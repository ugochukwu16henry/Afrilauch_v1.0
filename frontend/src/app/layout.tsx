import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

// Normalize env URL: trim, strip leading =/whitespace (Railway sometimes injects these), ensure scheme so new URL() never throws
function normalizeEnvUrl(value: string | undefined, fallback: string): string {
  const raw = (value ?? '').trim().replace(/^[\s=]+/, '');
  const s = raw || fallback;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `https://${s.replace(/^\/+/, '')}`;
}
const APP_URL = normalizeEnvUrl(process.env.NEXT_PUBLIC_APP_URL, 'http://localhost:3000');
const SITE_NAME = 'RiseFlow Hub';
const SITE_DESCRIPTION =
  'RiseFlow Hub is a global startup growth and venture enablement platform. We guide, structure, build, connect, and scale ideas from concept to company.';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0FA958',
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${SITE_NAME} — Where Ideas Rise and Businesses Take Shape`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: { icon: '/favicon-for-app/favicon.ico' },
  keywords: [
    'startup growth platform',
    'venture enablement',
    'build a startup from idea',
    'startup development',
    'AI startup mentor',
    'venture building platform',
    'founder support',
    'startup studio',
    'innovation',
    'launch',
  ],
  authors: [{ name: SITE_NAME }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: APP_URL,
    title: `${SITE_NAME} — Where Ideas Rise and Businesses Take Shape`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: '/RiseFlowHub%20logo.png',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Global Startup Growth Platform`,
    description: SITE_DESCRIPTION,
    images: ['/RiseFlowHub%20logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const linkedinId = process.env.NEXT_PUBLIC_LINKEDIN_INSIGHT_ID;
  const googleVerify = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: SITE_NAME,
        url: APP_URL,
        logo: `${APP_URL}/RiseFlowHub%20logo.png`,
        description: SITE_DESCRIPTION,
        sameAs: [
          'https://www.linkedin.com/company/riseflow-hub',
          'https://twitter.com/riseflowhub',
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: `${SITE_NAME} Platform`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: APP_URL,
        description:
          'A global startup growth and venture enablement platform. Ideas rise, businesses are built, innovation flows.',
      },
      {
        '@type': 'Service',
        name: 'Startup venture building and product development',
        provider: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: APP_URL,
        },
        areaServed: {
          '@type': 'Place',
          name: 'Global',
        },
      },
    ],
  };

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {googleVerify && (
          <meta name="google-site-verification" content={googleVerify} />
        )}
      </head>
      <body className="min-h-screen antialiased font-sans">
        <Script
          id="org-json-ld"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />

        {gaId && (
          <>
            <Script
              id="google-analytics-src"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}

        {fbPixelId && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}

        {linkedinId && (
          <>
            <Script id="linkedin-insight" strategy="afterInteractive">
              {`
                _linkedin_partner_id = "${linkedinId}";
                window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
                window._linkedin_data_partner_ids.push(_linkedin_partner_id);
              `}
            </Script>
            <Script
              id="linkedin-insight-src"
              strategy="afterInteractive"
            >{`
              (function(l) {
                if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
                window.lintrk.q=[]}
                var s=document.getElementsByTagName("script")[0];
                var b=document.createElement("script");
                b.type="text/javascript";b.async=true;
                b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";
                s.parentNode.insertBefore(b,s);
              })(window.lintrk);
            `}</Script>
          </>
        )}

        {children}
      </body>
    </html>
  );
}
