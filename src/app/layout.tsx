import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'REGGAP - Registro de GAP',
  description: 'Sistema de registro e acompanhamento de ocorrências, falhas e problemas operacionais',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'REGGAP',
  },
  icons: {
    icon: [
      { url: '/reggaplogo.png', sizes: '192x192', type: 'image/png' },
      { url: '/reggaplogo.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/reggaplogo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'REGGAP - Registro de GAP',
    description: 'Sistema de registro e acompanhamento de ocorrências, falhas e problemas operacionais',
    images: ['/reggaplogo.png'],
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'REGGAP',
    'mobile-web-app-capable': 'yes',
    'application-name': 'REGGAP',
  },
}

export const viewport: Viewport = {
  themeColor: '#073e29',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
