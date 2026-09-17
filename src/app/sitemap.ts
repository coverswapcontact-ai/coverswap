import type { MetadataRoute } from 'next';
import { articles } from '@/data/blog-articles';
import { ZONES, getZoneSlug } from '@/data/zones';
import { PRESTATIONS } from '@/data/prestations';

/**
 * Sitemap dynamique CoverSwap.
 *
 * Bonnes pratiques :
 *  - `lastModified` figé à une date fixe par URL (pas Date.now à chaque build)
 *    pour éviter que Google interprète tout le site comme "constamment modifié".
 *  - Priorités : 1.0 (home), 0.9 (zones — SEO local), 0.8 (prestations),
 *    0.7 (catalogue + contact + index zones), 0.6 (blog), 0.5 (articles), 0.3 (legal).
 */
const LAST_BUILD = new Date('2026-09-17T00:00:00Z');

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://coverswap.fr';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: LAST_BUILD, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/simulateur`, lastModified: LAST_BUILD, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/devis`, lastModified: LAST_BUILD, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/zones`, lastModified: LAST_BUILD, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/realisations`, lastModified: LAST_BUILD, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/prestations`, lastModified: LAST_BUILD, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/revetements`, lastModified: LAST_BUILD, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: LAST_BUILD, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: LAST_BUILD, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/mentions-legales`, lastModified: LAST_BUILD, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/politique-confidentialite`, lastModified: LAST_BUILD, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/cgv`, lastModified: LAST_BUILD, changeFrequency: 'yearly', priority: 0.3 },
  ];

  /**
   * Pages locales (zones) — priorité haute (0.9) car forte intention de
   * recherche locale. Google les remontera en SERP local.
   */
  const prestationPages: MetadataRoute.Sitemap = PRESTATIONS.map((p) => ({
    url: `${baseUrl}/prestations/${p.slug}`,
    lastModified: LAST_BUILD,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const zonePages: MetadataRoute.Sitemap = ZONES.map((zone) => ({
    url: `${baseUrl}/zones/${getZoneSlug(zone)}`,
    lastModified: LAST_BUILD,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  const blogPages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: LAST_BUILD,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...prestationPages, ...zonePages, ...blogPages];
}
