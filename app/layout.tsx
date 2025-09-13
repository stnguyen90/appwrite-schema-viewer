import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Appwrite Schema Viewer',
  description: 'Visualize your Appwrite database schema from an appwrite.config.json file.',
  icons: {
    icon: '/favicon.svg',
  },
  metadataBase: new URL('https://appwrite-schema-viewer.appwrite.network/'),
  openGraph: {
    type: 'website',
    title: 'Appwrite Schema Viewer',
    description: 'Visualize your Appwrite database schema from an appwrite.config.json file.',
    images: [
      {
        url: '/og.svg',
        width: 1200,
        height: 630,
        alt: 'Appwrite Schema Viewer'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Appwrite Schema Viewer',
    description: 'Visualize your Appwrite database schema from an appwrite.config.json file.',
    images: ['/og.svg']
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
