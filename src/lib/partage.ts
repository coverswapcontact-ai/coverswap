import { CAS_PRESTATIONS } from "@/data/cas-prestations";
import { PAIRES_SERIE_2 } from "@/data/ambiances";
import { articles } from "@/data/blog-articles";
import { PAIRE_COMPTOIR_PRO } from "@/app/pro/contenu";
import { ordreInspirations } from "@/app/inspirations/_components/ordre";
import { PIECES_INSPIRATION, ambianceDeLImage, inspirations } from "./ambiances";
import { ENTREPRISE } from "./entreprise";
import { ambiancesDeLaFiche, parametresDesFiches } from "./fiches-matieres";
import { SLUGS_FAMILLES, ambiancesDeFamille } from "./pages-familles";
import type { Publication } from "./publications";

/**
 * L'image de partage d'une page (site 3.0, lot F2 ; `docs/SEO.md`, « Image de partage ») : UNE source pour tout le
 * site. `metadonneesPage` l'appelle par défaut ; le gabarit et le balisage de l'entreprise lisent `IMAGE_PARTAGE`.
 *  - une réalisation publiée montrée en premier sur la page (accueil, prestation de sa pièce, `/pro`, `/realisations`,
 *    fiche d'une matière qu'elle porte) : sa photo « après » du CRM ;
 *  - sinon l'avant / après de la page (`paireDePartage`), composé par `npm run og` (`scripts/og.mjs`, sharp, aucun
 *    appel d'API) en 1 200 × 630 avec le bandeau « Ambiance · avant / après » : une image générée n'est jamais
 *    partagée sans son étiquette ; un fichier par paire, `public/images/og/<après>.jpg` ;
 *  - sinon l'image du site (`IMAGE_PARTAGE` : celle de l'accueil).
 * Avant tout cela, cinq pages ont une image dessinée pour les aperçus de liens (SMS, WhatsApp, iMessage ; 07/10/2026) :
 * `IMAGES_DEDIEES`, fichiers `public/images/partage/`, prioritaires sur l'avant / après de la page (ces pages ne passent pas de réalisation).
 * Pur (testé : `partage.test.ts`) ; rien ici n'importe `metadonnees` (qui l'importe).
 */

export type ImagePartage = { url: string; largeur: number; hauteur: number; alt?: string };

/** Les images dessinées pour les aperçus de liens (1 200 × 630), sous `public/images/partage/`. */
export const DOSSIER_IMAGES_DEDIEES = "/images/partage";
const dediee = (nom: string, alt: string): ImagePartage => ({ url: `${ENTREPRISE.site}${DOSSIER_IMAGES_DEDIEES}/${nom}.jpg`, largeur: 1200, hauteur: 630, alt });

/** L'image de partage du site, celle de l'accueil : la cuisine bordeaux passée en vert profond, avant / après. */
export const IMAGE_PARTAGE: ImagePartage = dediee("partage-accueil", "CoverSwap : votre cuisine, transformée en une journée, sans travaux. Avant / après.");

/** L'image de l'espace client (`/e/[jeton]`, hors `metadonneesPage`). */
export const IMAGE_PARTAGE_ESPACE: ImagePartage = dediee("partage-espace", "Votre espace CoverSwap : vos simulations, votre devis et vos échantillons au même endroit.");

/** Les pages qui ont leur image dessinée, prioritaire sur toute autre (chemin sans barre finale). */
export const IMAGES_DEDIEES: Record<string, ImagePartage> = {
  "/": IMAGE_PARTAGE,
  "/simulateur": dediee("partage-simulateur", "CoverSwap : votre cuisine sur votre photo, avec les matières de votre choix. Gratuit."),
  "/contact": dediee("partage-echantillons", "CoverSwap : les vrais échantillons chez vous, les mesures prises, votre devis sous 48 h."),
  "/matieres": dediee("partage-matieres", "CoverSwap : 497 matières Cover Styl', à voir en vrai, échantillons apportés chez vous."),
};

/** Le bandeau posé sur chaque image composée, et le dossier des images composées (sous `public/`). */
export const ETIQUETTE_PARTAGE = "Ambiance · avant / après";
export const DOSSIER_PARTAGE = "/images/og";
export const LARGEUR_PARTAGE = 1200;
export const HAUTEUR_PARTAGE = 630;

/** Une paire de la bibliothèque : l'avant et l'après (noms du manifeste des images). */
export type PairePartage = { avant: string; apres: string };

/** L'avant d'un « après » de la série 2 (ou de la série 1 quand l'ambiance a un avant calé). */
function avantDe(apres: string): string | null {
  return PAIRES_SERIE_2.find((p) => p.apres.includes(apres))?.avant ?? ambianceDeLImage(apres)?.avant ?? null;
}

const paire = (apres: string | undefined): PairePartage | null => {
  const avant = apres ? avantDe(apres) : null;
  return apres && avant ? { avant, apres } : null;
};

/** La paire de l'accueil : l'ouverture de la cuisine (la bordeaux brillante en Deep Green NF13, énoncé § C.1). */
const PAIRE_ACCUEIL = CAS_PRESTATIONS.cuisine.ouverture;

/**
 * L'avant / après que montre la page `chemin` (sans réalisation publiée), ou `null` (la page n'en montre pas : l'image
 * du site). Même règle que la page : son ouverture, sinon la première de ses ambiances qui a un avant.
 */
export function paireDePartage(chemin: string): PairePartage | null {
  const c = chemin.replace(/\/$/, "") || "/";
  if (c === "/" || c === "/simulateur" || c === "/realisations") return paire(PAIRE_ACCUEIL.apres);
  if (c === "/pro") return paire(PAIRE_COMPTOIR_PRO.apres);
  if (c === "/inspirations") return paire(ordreInspirations(inspirations(), PIECES_INSPIRATION.map((p) => p.id)).find((a) => a.avant)?.image);
  const prestation = c.match(/^\/prestations\/([^/]+)$/)?.[1];
  if (prestation) return paire((CAS_PRESTATIONS as Record<string, { ouverture: PairePartage } | undefined>)[prestation]?.ouverture.apres);
  const guide = c.match(/^\/blog\/([^/]+)$/)?.[1];
  if (guide) return paire(articles.find((a) => a.slug === guide)?.paire);
  const fiche = c.match(/^\/matieres\/([^/]+)\/([^/]+)$/);
  if (fiche) return paire(ambiancesDeLaFiche(fiche[2]).find((v) => v.ambiance.avant)?.ambiance.image);
  const famille = c.match(/^\/matieres\/([^/]+)$/)?.[1];
  if (famille) return SLUGS_FAMILLES.includes(famille) ? paire(ambiancesDeFamille(famille).find((a) => a.avant)?.image) : null;
  return null;
}

/** Toutes les pages qui partagent un avant / après (celles que `scripts/og.mjs` compose ; hors `IMAGES_DEDIEES`), dans un ordre stable. */
export function pagesAvecPaire(): { chemin: string; paire: PairePartage }[] {
  const chemins = [
    "/realisations",
    "/pro",
    "/inspirations",
    ...Object.keys(CAS_PRESTATIONS).map((s) => `/prestations/${s}`),
    ...articles.map((a) => `/blog/${a.slug}`),
    ...SLUGS_FAMILLES.map((f) => `/matieres/${f}`),
    ...parametresDesFiches().map((f) => `/matieres/${f.famille}/${f.ref}`),
  ];
  return chemins.flatMap((chemin) => {
    const p = paireDePartage(chemin);
    return p ? [{ chemin, paire: p }] : [];
  });
}

/** Le fichier composé d'une paire, sous `public/` : `/images/og/<après>.jpg`. */
export const fichierPartage = (apres: string) => `${DOSSIER_PARTAGE}/${apres}.jpg`;

/** Le texte alternatif d'une image composée : ce qu'elle est, puis ce qu'elle montre. */
function altPartage({ avant, apres }: PairePartage): string {
  const scene = PAIRES_SERIE_2.find((p) => p.avant === avant)?.scene ?? ambianceDeLImage(apres)?.titre;
  return scene ? `${ETIQUETTE_PARTAGE}, image d'ambiance : ${scene}` : `${ETIQUETTE_PARTAGE}, image d'ambiance`;
}

/** Une réalisation publiée par le CRM : l'adresse de sa photo « après » et sa légende (titre, ville). */
export type RealisationPartagee = { photo: string; legende: string };

/** La réalisation publiée à partager (sa photo « après » et sa légende), ou `null` sans réalisation ni photo. */
export function realisationPartagee(p: Pick<Publication, "titre" | "ville" | "photoApres"> | null | undefined): RealisationPartagee | null {
  if (!p?.photoApres) return null;
  return { photo: p.photoApres, legende: p.ville ? `${p.titre}, ${p.ville}.` : `${p.titre}.` };
}

/** L'image de partage de la page `chemin` (voir l'en-tête) ; `reelle` : la réalisation publiée qu'elle montre en premier. */
export function imagePartage(chemin: string, reelle?: RealisationPartagee | null): ImagePartage {
  // La photo du CRM, réduite à 1 600 px (WebP, au cadre 3 / 2 des réalisations), comme à l'ouverture de l'accueil.
  if (reelle) return { url: `${reelle.photo}?l=1600`, largeur: 1600, hauteur: 1067, alt: reelle.legende };
  const dedieeDeLaPage = IMAGES_DEDIEES[chemin.replace(/\/$/, "") || "/"];
  if (dedieeDeLaPage) return dedieeDeLaPage;
  const p = paireDePartage(chemin);
  if (!p) return IMAGE_PARTAGE;
  return { url: `${ENTREPRISE.site}${fichierPartage(p.apres)}`, largeur: LARGEUR_PARTAGE, hauteur: HAUTEUR_PARTAGE, alt: altPartage(p) };
}
