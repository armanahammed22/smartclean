import { MetadataRoute } from 'next';
import { db } from '@/lib/firebaseAdmin';

/**
 * Helper to safely convert Firestore Timestamp or string to Date.
 */
function toDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate();
  const date = new Date(val);
  return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Dynamic Sitemap Generator (Server-Side)
 * Generates SEO-friendly URLs for all public records.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    console.warn('[Sitemap] Could not fetch dynamic domain.');
  }

  const staticRoutes = [
    '',
    '/services',
    '/products',
    '/support',
    '/deep-cleaning',
    '/login',
    '/signup',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  if (!db) return staticRoutes;

  try {
    const [productSnap, serviceSnap, landingSnap, cmsSnap, quoteSnap, invoiceSnap] = await Promise.all([
      db.collection('products').where('status', '==', 'Active').get(),
      db.collection('services').where('status', '==', 'Active').get(),
      db.collection('landing_pages').where('active', '==', true).get(),
      db.collection('pages_management').where('isPublished', '==', true).get(),
      db.collection('quotations').where('status', 'not-in', ['Draft', 'Rejected']).get(),
      db.collection('invoices').get()
    ]);

    const productRoutes = productSnap.docs.map((doc: any) => ({
      url: `${baseUrl}/product/${doc.data().slug || doc.id}`,
      lastModified: toDate(doc.data().updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const serviceRoutes = serviceSnap.docs.map((doc: any) => ({
      url: `${baseUrl}/service/${doc.data().slug || doc.id}`,
      lastModified: toDate(doc.data().updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const landingRoutes = landingSnap.docs.map((doc: any) => ({
      url: `${baseUrl}/${doc.data().slug}`,
      lastModified: toDate(doc.data().updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    const cmsRoutes = cmsSnap.docs.map((doc: any) => ({
      url: `${baseUrl}/page/${doc.data().slug}`,
      lastModified: toDate(doc.data().updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

    const quoteRoutes = quoteSnap.docs.map((doc: any) => ({
      url: `${baseUrl}/quotation/${doc.data().quoteNumber || doc.id}`,
      lastModified: toDate(doc.data().updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }));

    const invoiceRoutes = invoiceSnap.docs.map((doc: any) => ({
      url: `${baseUrl}/invoice/${doc.data().invoiceNumber || doc.id}`,
      lastModified: toDate(doc.data().updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    }));

    return [
      ...staticRoutes,
      ...productRoutes,
      ...serviceRoutes,
      ...landingRoutes,
      ...cmsRoutes,
      ...quoteRoutes,
      ...invoiceRoutes
    ];
  } catch (e) {
    console.error('[Sitemap Generator] Fetch failed:', e);
    return staticRoutes;
  }
}
