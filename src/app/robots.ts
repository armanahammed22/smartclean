
import { MetadataRoute } from 'next'

/**
 * SEO Robots Configuration
 * Instructs search engines which pages to index and which to ignore.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/staff/',
        '/account/',
        '/login',
        '/signup',
        '/checkout',
        '/order-success',
        '/secure-admin-portal',
        '/secure-staff-access'
      ],
    },
    sitemap: 'https://smartclean.com.bd/sitemap.xml', // Update with actual domain
  }
}
