import { MetadataRoute } from 'next';
import { db } from '@/lib/firebaseAdmin';

/**
 * Dynamic Sitemap Generator (Server-Side)
 * Safely handles build-time when DB might not be connected.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://smartclean.com.bd';

  const staticRoutes = [
    '',
    '/services',
    '/products',
    '/support',
    '/deep-cleaning',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Safe check for DB (prevents build failure if env vars are missing)
  if (!db) {
    return staticRoutes;
  }

  try {
    const productSnap = await db.collection('products').where('status', '==', 'Active').get();
    const productRoutes = productSnap.docs.map((doc: any) => ({
      url: `${baseUrl}/product/${doc.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const serviceSnap = await db.collection('services').where('status', '==', 'Active').get();
    const serviceRoutes = serviceSnap.docs.map((doc: any) => ({
      url: `${baseUrl}/service/${doc.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const landingSnap = await db.collection('landing_pages').where('active', '==', true).get();
    const landingRoutes = landingSnap.docs.map((doc: any) => ({
      url: `${baseUrl}/${doc.data().slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...productRoutes, ...serviceRoutes, ...landingRoutes];
  } catch (e) {
    console.error('Sitemap fetch failed, returning static only.');
    return staticRoutes;
  }
}
