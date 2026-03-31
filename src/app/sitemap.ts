import { MetadataRoute } from 'next';
import { db } from '@/lib/firebaseAdmin';

/**
 * Dynamic Sitemap Generator (Server-Side)
 * Fixed "URL not allowed" by ensuring consistent domain structure.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use environment variable if available, otherwise fallback to the primary domain.
  // Note: For Google Search Console, this MUST match your verified property URL.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartclean.com.bd';

  // 1. Define Static Base Routes
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

  // Safe check for DB connection
  if (!db) {
    return staticRoutes;
  }

  try {
    // 2. Fetch Active Products
    const productSnap = await db.collection('products').where('status', '==', 'Active').get();
    const productRoutes = productSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/product/${data.slug || doc.id}`,
        lastModified: new Date(data.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

    // 3. Fetch Active Services
    const serviceSnap = await db.collection('services').where('status', '==', 'Active').get();
    const serviceRoutes = serviceSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/service/${data.slug || doc.id}`,
        lastModified: new Date(data.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

    // 4. Fetch Dynamic Landing Pages
    const landingSnap = await db.collection('landing_pages').where('active', '==', true).get();
    const landingRoutes = landingSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/${data.slug}`,
        lastModified: new Date(data.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      };
    });

    // 5. Fetch CMS Managed Pages
    const cmsSnap = await db.collection('pages_management').where('isPublished', '==', true).get();
    const cmsRoutes = cmsSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/page/${data.slug}`,
        lastModified: new Date(data.updatedAt || new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      };
    });

    return [
      ...staticRoutes,
      ...productRoutes,
      ...serviceRoutes,
      ...landingRoutes,
      ...cmsRoutes
    ];
  } catch (e) {
    console.error('[Sitemap Generator] Fetch failed:', e);
    return staticRoutes;
  }
}
