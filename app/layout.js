import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ghub-git-main-william-robbs-projects.vercel.app'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'GHUB - Personal Fitness & Wellness Hub',
    template: '%s | GHUB',
  },
  description: 'Track your fitness journey, nutrition, and personal growth',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'GHUB - Personal Fitness & Wellness Hub',
    description: 'Track your fitness journey, nutrition, and personal growth',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GHUB - Personal Fitness & Wellness Hub',
    description: 'Track your fitness journey, nutrition, and personal growth',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
