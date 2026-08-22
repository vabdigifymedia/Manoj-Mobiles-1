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

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['Arial', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'Manoj Mobiles | Smarter choices, better service',
  description: 'Shop genuine smartphones, accessories, and local mobile service from Manoj Mobiles.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Manoj Mobiles',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
      <body className={`${inter.className} font-sans antialiased flex min-h-screen flex-col bg-background pb-[env(safe-area-inset-bottom)]`} suppressHydrationWarning>
        <ScrollbarManager />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <StoreProvider>
              <Header />
              <main className="flex-1 pb-16 md:pb-0">
                {children}
              </main>
              <Footer />
              <MobileNav />
              <CompareBasket />
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
