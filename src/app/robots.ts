import { MetadataRoute } from 'next'
import { db } from '@/lib/firebaseAdmin';

/**
 * SEO Robots Configuration
 * Pointing to dynamic sitemap URL fetched from database.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  let baseUrl = 'https://smartclean.com.bd';

  try {
    if (db) {
      const settingsSnap = await db.collection('site_settings').doc('global').get();
      const settings = settingsSnap.data();
      if (settings?.websiteUrl) {
        baseUrl = settings.websiteUrl.replace(/\/$/, '');
      }
    }
  } catch (e) {
    console.warn('[Robots] Could not fetch dynamic domain.');
  }

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
