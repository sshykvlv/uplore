import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import UmamiScript from '@/components/UmamiScript'

// UI font — modern grotesk with full Cyrillic (RU/UK content + chrome).
const manrope = Manrope({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

// Display font for the wordmark only (Latin "Uplore"). Self-hosted from Fontshare.
const cabinet = localFont({
  src: './fonts/CabinetGrotesk-Extrabold.woff2',
  weight: '800',
  variable: '--font-cabinet',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Uplore',
  description: 'A Hacker-News-style idea board — self-hostable, open source.',
  openGraph: {
    title: 'Uplore',
    description: 'Community idea voting board',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${cabinet.variable}`}>
      <head>
        <UmamiScript />
      </head>
      <body>{children}</body>
    </html>
  )
}
