import type { Metadata, Viewport } from 'next'
import { Orbitron, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { FirebaseAuthProvider } from '@/components/providers/firebase-auth-provider'
import { getAppBaseUrl } from '@/lib/site'
import './globals.css'

const orbitron = Orbitron({ 
  subsets: ["latin"],
  variable: '--font-orbitron',
  display: 'swap',
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: 'Royal Flush Poker | Premium Online Gaming',
  description: 'Experience the most advanced online poker platform with stunning visuals and real-time gameplay',
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
  themeColor: '#0d1117',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body className={`${orbitron.variable} ${inter.variable} font-sans antialiased min-h-screen`}>
        <FirebaseAuthProvider>
          {children}
        </FirebaseAuthProvider>
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  )
}
