import type { Metadata } from 'next'
import './globals.css'
import UmamiScript from '@/components/UmamiScript'

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
    <html lang="en">
      <head>
        <UmamiScript />
      </head>
      <body>{children}</body>
    </html>
  )
}
