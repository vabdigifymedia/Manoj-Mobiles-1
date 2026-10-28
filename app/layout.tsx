import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { StoreProvider } from '@/components/store-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileNav } from '@/components/mobile-nav'
import { CompareBasket } from '@/components/compare-basket'
import { Toaster } from 'sonner'
import { ScrollbarManager } from '@/components/scrollbar-manager'
import Script from 'next/script'

import { BulkInquiryProvider } from '@/components/bulk-inquiry-provider'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-MM2KZX59'
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-TQ1H3FXHFQ'
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'Ps9IJo4sAROCqcloOgV7is3lpXl5RlBlGv6ZHUjWHMA'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://emistore.in'),
  title: 'Manoj Mobiles | Smarter choices, better service',
  description: 'Shop genuine smartphones, accessories, and local mobile service from Manoj Mobiles.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://emistore.in',
  },
  openGraph: {
    title: 'Manoj Mobiles | Smarter choices, better service',
    description: 'Shop genuine smartphones, accessories, and local mobile service from Manoj Mobiles.',
    url: 'https://emistore.in',
    siteName: 'EMIStore',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://emistore.in/ogimage.png',
        width: 1672,
        height: 940,
        alt: 'EMIStore - Your Dream Phone on Easy EMIs',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manoj Mobiles | Smarter choices, better service',
    description: 'Shop genuine smartphones, accessories, and local mobile service from Manoj Mobiles.',
    images: ['https://emistore.in/ogimage.png'],
  },
  ...(GSC_VERIFICATION
    ? {
        verification: {
          google: GSC_VERIFICATION,
        },
      }
    : {}),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EMIStore',
  },
  icons: {
    icon: [
      {
        url: '/logo.png',
      },
    ],
    shortcut: '/logo.png',
    apple: [
      {
        url: '/logo.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#000000',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Google Search Console verification */}
        <meta
          name="google-site-verification"
          content={GSC_VERIFICATION}
        />

        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />

        {/* Google Analytics (gtag.js) */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `,
          }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased flex min-h-screen flex-col bg-background pb-[env(safe-area-inset-bottom)]`} suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <ScrollbarManager />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <StoreProvider>
              <BulkInquiryProvider>
                <Header />
                <main className="flex-1 pb-16 md:pb-0">
                  {children}
                </main>
                <Footer />
                <MobileNav />
                <CompareBasket />
              </BulkInquiryProvider>
            </StoreProvider>
          </AuthProvider>
          {process.env.NODE_ENV === 'production' && <Analytics />}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
        <Script
          id="service-worker-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </body>
    </html>
  )
}
