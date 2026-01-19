const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ghub-git-main-william-robbs-projects.vercel.app'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api',
          '/dashboard',
          '/workouts',
          '/library',
          '/measurements',
          '/daily',
          '/goals',
          '/sobriety',
          '/profile',
          '/gallery',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
