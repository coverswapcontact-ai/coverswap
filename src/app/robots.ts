import type { MetadataRoute } from 'next';
import { ENTREPRISE } from '@/lib/entreprise';

/**
 * Robots (mission 16, partie 5) : tout le site est ouvert, sauf les routes d'API, l'espace client (`/e/<jeton>` :
 * pages privées) et la désinscription (lien signé, jamais indexé).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/e/', '/desinscription'],
    },
    sitemap: `${ENTREPRISE.site}/sitemap.xml`,
  };
}
