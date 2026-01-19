const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ghub-git-main-william-robbs-projects.vercel.app'

export default function sitemap() {
  const routes = ['', '/blog', '/science', '/recipes', '/travel', '/merch']
  const lastModified = new Date()

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
  }))
}
