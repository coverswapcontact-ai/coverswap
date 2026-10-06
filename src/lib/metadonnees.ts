import type { Metadata } from "next";
import { ENTREPRISE } from "./entreprise";

/**
 * Les métadonnées d'une page (mission 16, partie 5) : UN helper pour toutes les pages publiques du site. Chaque page
 * a son titre, sa description, son adresse canonique ABSOLUE et son Open Graph complet (titre, description, adresse,
 * image claire) — plus aucune page n'hérite du titre Open Graph du gabarit (`layout.tsx`, qui garde les valeurs par
 * défaut). La description est ramenée à 160 caractères au plus (`couperDescription` : à la fin d'une phrase si
 * possible, sinon au dernier mot, avec « … ») : le texte d'origine reste entier dans la page et le balisage.
 * Module pur (testé : `metadonnees.test.ts`).
 */

export const LONGUEUR_MAX_DESCRIPTION = 160;

export type ImagePartage = { url: string; largeur: number; hauteur: number; alt?: string };

/** L'image de partage claire du site (`scripts/generate-assets.mjs` : 1200 × 630, fond clair). */
export const IMAGE_PARTAGE: ImagePartage = { url: `${ENTREPRISE.site}/og-image.jpg`, largeur: 1200, hauteur: 630 };

/** L'adresse absolue d'un chemin du site (« / » → la racine, sans barre finale). */
export function urlAbsolue(chemin: string): string {
  if (/^https?:\/\//.test(chemin)) return chemin;
  const propre = chemin.startsWith("/") ? chemin : `/${chemin}`;
  return propre === "/" ? ENTREPRISE.site : `${ENTREPRISE.site}${propre}`;
}

/**
 * Une description de 160 caractères au plus : telle quelle si elle tient ; sinon coupée après la dernière phrase
 * complète qui tient (au moins la moitié de la place), sinon au dernier mot entier suivi de « … ».
 */
export function couperDescription(texte: string, max: number = LONGUEUR_MAX_DESCRIPTION): string {
  const propre = texte.replace(/\s+/g, " ").trim();
  if (propre.length <= max) return propre;
  const debut = propre.slice(0, max);
  const finDePhrase = Math.max(debut.lastIndexOf(". "), debut.lastIndexOf("! "), debut.lastIndexOf("? "));
  if (finDePhrase >= max / 2) return debut.slice(0, finDePhrase + 1);
  const avantEllipse = propre.slice(0, max - 1);
  const espace = avantEllipse.lastIndexOf(" ");
  const coupe = (espace > max / 2 ? avantEllipse.slice(0, espace) : avantEllipse).replace(/[\s,;:—–-]+$/, "");
  return `${coupe}…`;
}

export type ProprietesMetadonnees = {
  /** Le titre complet de la page (« … | CoverSwap »), repris tel quel par Open Graph et la carte de partage. */
  titre: string;
  description: string;
  /** Le chemin de la page (« /matieres ») ou son adresse absolue. */
  chemin: string;
  image?: ImagePartage;
  /**
   * Site 3.0 (lot D4) : `false` pour une page servie mais tenue hors de l'index (`noindex, follow` : les moteurs
   * suivent ses liens, sans la montrer) — les fiches de matière hors des 52 indexées. Par défaut, rien n'est dit.
   */
  indexer?: boolean;
};

export function metadonneesPage({ titre, description, chemin, image = IMAGE_PARTAGE, indexer = true }: ProprietesMetadonnees): Metadata {
  const url = urlAbsolue(chemin);
  const courte = couperDescription(description);
  const partage = { url: image.url, width: image.largeur, height: image.hauteur, alt: image.alt ?? titre };
  return {
    title: { absolute: titre },
    description: courte,
    alternates: { canonical: url },
    openGraph: { title: titre, description: courte, url, type: "website", siteName: ENTREPRISE.nom, locale: "fr_FR", images: [partage] },
    twitter: { card: "summary_large_image", title: titre, description: courte, images: [image.url] },
    ...(indexer ? {} : { robots: { index: false, follow: true } }),
  };
}
