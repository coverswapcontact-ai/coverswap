import type { MetadataRoute } from 'next';
import { articles } from '@/data/blog-articles';
import { ZONES, getZoneSlug } from '@/data/zones';
import { PRESTATIONS, lienPrestation } from '@/data/prestations';
import { ENTREPRISE } from '@/lib/entreprise';

/**
 * Sitemap dynamique CoverSwap (mission 16, partie 5 : les six pages du tunnel, les pages par pièce, les zones, les
 * guides, les pages légales). Aucune adresse redirigée (`next.config.ts › redirects`) n'y figure : /devis, /blog,
 * /prestations, /revetements, /prestations/professionnel (test : src/app/sitemap.test.ts).
 *
 * Bonnes pratiques :
 *  - `lastModified` figé à une date fixe par URL (pas Date.now à chaque build)
 *    pour éviter que Google interprète tout le site comme "constamment modifié".
 *  - Priorités : 1.0 (accueil), 0.9 (simulateur, zones — SEO local), 0.8 (matières, réalisations, comment ça marche,
 *    pro, pages par pièce), 0.7 (contact, index des zones), 0.5 (guides), 0.3 (légal).
 */
const LAST_BUILD = new Date('2026-09-30T00:00:00Z');

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = ENTREPRISE.site;

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: LAST_BUILD, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/simulateur`, lastModified: LAST_BUILD, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/matieres`, lastModified: LAST_BUILD, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/realisations`, lastModified: LAST_BUILD, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/comment-ca-marche`, lastModified: LAST_BUILD, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/pro`, lastModified: LAST_BUILD, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: LAST_BUILD, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/zones`, lastModified: LAST_BUILD, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/mentions-legales`, lastModified: LAST_BUILD, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/politique-confidentialite`, lastModified: LAST_BUILD, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/cgv`, lastModified: LAST_BUILD, changeFrequency: 'yearly', priority: 0.3 },
  ];

  /** Pages par pièce (cuisine, salle de bain, meubles) et vitrages ; « professionnel » est devenue /pro (ci-dessus). */
  const prestationPages: MetadataRoute.Sitemap = PRESTATIONS.filter((p) => p.slug !== 'professionnel').map((p) => ({
    url: `${baseUrl}${lienPrestation(p.slug)}`,
    lastModified: LAST_BUILD,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  /** Pages locales (zones) — priorité haute (0.9) : forte intention de recherche locale. */
  const zonePages: MetadataRoute.Sitemap = ZONES.map((zone) => ({
    url: `${baseUrl}/zones/${getZoneSlug(zone)}`,
    lastModified: LAST_BUILD,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  const blogPages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: new Date(article.dateModifiedIso),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...prestationPages, ...zonePages, ...blogPages];
}
