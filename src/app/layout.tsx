import type { Metadata } from 'next'
import { Manrope, Sora } from 'next/font/google'
import './globals.css'
import UmamiScript from '@/components/UmamiScript'

// UI font — modern grotesk with full Cyrillic (RU/UK content + chrome).
const manrope = Manrope({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

// Display font for the wordmark only (Latin "Uplore").
const sora = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-sora',
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
    <html lang="en" className={`${manrope.variable} ${sora.variable}`}>
      <head>
        <UmamiScript />
      </head>
      <body>{children}</body>
    </html>
  )
}
