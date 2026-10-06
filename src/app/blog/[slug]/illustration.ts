import { resoudreCas, type CasAmbiance } from "@/components/ambiances/cas";
import { PHOTOS_UTILES } from "@/data/ambiances";
import type { BlogArticle } from "@/data/blog-articles";
import { ENTREPRISE } from "@/lib/entreprise";
import { fondSrc } from "@/lib/images";
import { DOSSIER_IMAGES, sourcesPhoto, type ManifesteImages } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { lienSimuler } from "@/lib/liens-simulateur";

/**
 * Les images d'un guide (site 3.0, lot C7), module pur (testé) : une image de la bibliothèque nommée par l'article
 * (`paire`, `imagePreparee`, l'`image` d'une section) devient soit le cas d'une paire — curseur « Ambiance · avant /
 * après », cartels, « Essayer cette composition chez moi » `depuis=blog` (`resoudreCas`, comme les autres pages) —, soit
 * une photo utile « Ambiance » avec le texte de la bibliothèque. Toutes générées : jamais « Réalisation ».
 */
export const DEPUIS_BLOG = "blog";

export type IllustrationGuide = { type: "paire"; cas: CasAmbiance } | { type: "photo"; nom: string; alt: string };

/** L'image `nom` (manifeste) : une paire si c'est l'« après » d'un avant préparé, sinon une photo utile ; `null` si elle n'est ni l'une ni l'autre. */
export function illustrationDe(nom: string, manifeste: ManifesteImages = MANIFESTE_IMAGES): IllustrationGuide | null {
  const utile = PHOTOS_UTILES.find((p) => p.image === nom);
  if (utile) return sourcesPhoto(nom, manifeste) ? { type: "photo", nom, alt: utile.alt } : null;
  // `resoudreCas` d'un « avant » rendrait son premier « après » : ici, seul un « après » nommé ouvre son curseur.
  const cas = resoudreCas(nom, { depuis: DEPUIS_BLOG }, manifeste);
  return cas?.preparees.avant && cas.ambiance.image === nom ? { type: "paire", cas } : null;
}

/**
 * L'image du balisage `Article` : l'image de la bibliothèque à sa plus grande largeur préparée (`-1536.jpg`, l'original
 * n'est jamais agrandi), sinon la photo de fond en 1600 px. Adresse absolue, sans `?v=` (Google la lit telle quelle).
 */
export function imageDuBalisage(article: BlogArticle, manifeste: ManifesteImages = MANIFESTE_IMAGES): string {
  const nom = article.paire ?? article.imagePreparee;
  const entree = nom ? manifeste[nom] : undefined;
  if (nom && entree && entree.largeurs.length > 0) return `${ENTREPRISE.site}${DOSSIER_IMAGES}/${nom}-${Math.max(...entree.largeurs)}.jpg`;
  return `${ENTREPRISE.site}${fondSrc(article.image ?? "", 1600)}`;
}

/** L'espace insécable (code 160), écrit par son code : aucun caractère invisible dans la source. */
const INSECABLE = String.fromCharCode(160);

/** Typographie française d'un texte affiché : l'espace avant « : ; ? ! » devient insécable (jamais un « : » en début de ligne). */
export function insecables(texte: string): string {
  return texte.replace(/ ([:;?!])/g, `${INSECABLE}$1`);
}

/** Le bouton de la colonne : la pièce du guide quand il en a une (« Simuler ma cuisine »), sinon « Simuler ma pièce » ; toujours `depuis=blog`. */
export function actionDuGuide(article: Pick<BlogArticle, "projet">): { href: string; libelle: string } {
  return article.projet === "cuisine" ? { href: lienSimuler({ projet: "cuisine", depuis: DEPUIS_BLOG }), libelle: "Simuler ma cuisine" } : { href: lienSimuler({ depuis: DEPUIS_BLOG }), libelle: "Simuler ma pièce" };
}
