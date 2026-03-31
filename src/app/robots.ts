import { MetadataRoute } from 'next'

/**
 * SEO Robots Configuration
 * Pointing to dynamic sitemap URL.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartclean.com.bd';

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
        '/secure-staff-access',
        '/api/'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
