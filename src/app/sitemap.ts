
import { MetadataRoute } from 'next';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Dynamic Sitemap Generator
 * Fetches products, services, and dynamic pages from Firestore to include in sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://smartclean.com.bd';
  const { firestore } = initializeFirebase();

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

  if (!firestore) return staticRoutes;

  try {
    // Dynamic Product Routes
    const productSnap = await getDocs(collection(firestore, 'products'));
    const productRoutes = productSnap.docs.map((doc) => ({
      url: `${baseUrl}/product/${doc.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Dynamic Service Routes
    const serviceSnap = await getDocs(collection(firestore, 'services'));
    const serviceRoutes = serviceSnap.docs.map((doc) => ({
      url: `${baseUrl}/service/${doc.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Dynamic Landing Pages
    const landingSnap = await getDocs(collection(firestore, 'landing_pages'));
    const landingRoutes = landingSnap.docs.map((doc) => ({
      url: `${baseUrl}/${doc.data().slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Dynamic Info Pages
    const pageSnap = await getDocs(collection(firestore, 'pages_management'));
    const pageRoutes = pageSnap.docs.map((doc) => ({
      url: `${baseUrl}/page/${doc.data().slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

    return [...staticRoutes, ...productRoutes, ...serviceRoutes, ...landingRoutes, ...pageRoutes];
  } catch (e) {
    return staticRoutes;
  }
}
