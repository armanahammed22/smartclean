
import { MetadataRoute } from 'next';
import { db } from '@/lib/firebaseAdmin';

/**
 * Dynamic Sitemap Generator (Server-Side)
 * Uses Firebase Admin SDK to fetch data during the build or request.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://smartclean.com.bd';

  // Static Routes
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

  if (!db) {
    console.warn('Sitemap warning: Database not connected. Returning static routes only.');
    return staticRoutes;
  }

  try {
    // 1. Dynamic Product Routes
    const productSnap = await db.collection('products').get();
    const productRoutes = productSnap.docs.map((doc) => ({
      url: `${baseUrl}/product/${doc.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // 2. Dynamic Service Routes
    const serviceSnap = await db.collection('services').get();
    const serviceRoutes = serviceSnap.docs.map((doc) => ({
      url: `${baseUrl}/service/${doc.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // 3. Dynamic Landing Pages
    const landingSnap = await db.collection('landing_pages').get();
    const landingRoutes = landingSnap.docs.map((doc) => ({
      url: `${baseUrl}/${doc.data().slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // 4. Dynamic Info Pages
    const pageSnap = await db.collection('pages_management').get();
    const pageRoutes = pageSnap.docs.map((doc) => ({
      url: `${baseUrl}/page/${doc.data().slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

    return [...staticRoutes, ...productRoutes, ...serviceRoutes, ...landingRoutes, ...pageRoutes];
  } catch (e) {
    console.error('Sitemap Generation Error:', e);
    return staticRoutes;
  }
}
