import type { MatiereCalque } from "@/components/ambiances/CalqueMatieres";
import { PAIRES_SERIE_2 } from "@/data/ambiances";
import { ambianceDeLImage } from "@/lib/ambiances";
import { sourcesPhoto, type ManifesteImages, type SourcesImage, MEDIA_ECRAN_LARGE, MEDIA_TELEPHONE, plafonnerSrcset } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { urlAbsolue, type ImagePartage } from "@/lib/metadonnees";
import { sourcesPhotoCrm, type Publication } from "@/lib/publications";

/**
 * Ce que l'accueil montre en image (mission 16, partie 3), en règles pures et
 * testées — l'honnêteté (énoncé § 1.1) est CODÉE ici, pas seulement écrite :
 *  - l'ouverture prend la PREMIÈRE réalisation publiée par le CRM qui a une
 *    photo avant ET une photo après (étiquette « Réalisation, <ville> »), en
 *    WebP réduit par le CRM (`sourcesPhotoCrm` : le LCP n'est pas la photo
 *    entière) ; sinon (site 3.0, lot B6) la paire d'ambiance de l'énoncé, la
 *    cuisine bordeaux brillante passée en Deep Green NF13 (`IMAGE_OUVERTURE`),
 *    étiquetée « Ambiance · avant / après » — « Simulation » est réservé aux
 *    rendus du moteur —, AVIF préparé, avec sa légende exacte. La légende,
 *    l'`ImageObject` et l'image de partage suivent l'image retenue ;
 *  - les études simulées de `/realisations` (« Simulation », « Ambiance ») ont
 *    disparu au lot C5 : la page montre les vraies d'abord, puis ses paires
 *    « Avant / après en ambiance » (`app/realisations/paires.ts`).
 */

/** Site 3.0 (lot B6) : la paire de l'ouverture quand aucune réalisation n'est publiée (énoncé, § C.1). */
export const IMAGE_OUVERTURE = { avant: "cuisine-bordeaux-brillante-avant", apres: "cuisine-bordeaux-brillante-apres-couleur" } as const;
/** La légende de l'ouverture, exacte (énoncé, § C.1). */
export const LEGENDE_OUVERTURE = "Cuisine des années 2000, façades bordeaux brillantes → Deep Green NF13, plan Pale Oak AG13. Posé en une journée.";
export const ETIQUETTE_OUVERTURE = "Ambiance · avant / après";
/** Le cadre d'une réalisation publiée à l'ouverture (ses photos n'ont pas de dimensions connues) : celui des images d'ambiance. */
export const RATIO_REALISATION = "3 / 2";

/**
 * Les textes de l'image de l'ouverture : l'« après » est lu en premier (il vient d'abord dans le document) et seul en
 * plein écran. Mission 19 : tiré de l'ambiance (`data/ambiances`, la scène et chaque matière) ; l'« avant » dit ce
 * qu'on voit sur la nouvelle image.
 */
const AMBIANCE_OUVERTURE = ambianceDeLImage(IMAGE_OUVERTURE.apres);
export const ALT_OUVERTURE = AMBIANCE_OUVERTURE?.alt ?? "Cuisine rénovée au film, image d'ambiance";
const SCENE_AVANT_OUVERTURE = PAIRES_SERIE_2.find((p) => p.avant === IMAGE_OUVERTURE.avant)?.scene;
export const ALT_AVANT_OUVERTURE = `${SCENE_AVANT_OUVERTURE ?? "La même cuisine avant la pose"}. Image d'ambiance.`;

/**
 * L'attribut `sizes` de l'image de l'ouverture : le même pour le `<picture>` et pour son préchargement. Site 3.0 : la
 * photo prend toute la largeur (gouttières de 16 px, 24 px dès 768 px), jusqu'à 1 152 px.
 */
export const TAILLES_OUVERTURE = "(min-width: 1200px) 1152px, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)";

export type ChoixOuverture = {
  /** « ambiance » (mission 19, ex-« simulation ») : la paire générée de l'ouverture, avant la première réalisation publiée. */
  type: "realisation" | "ambiance";
  avant: string;
  apres: string;
  ratio: string;
  etiquette: string;
  /** Ce que montre l'image, sous elle : la légende exacte de l'énoncé, ou le titre et la ville d'une réalisation. */
  legende: string;
  alt: string;
  altAvant: string;
  preparees: { avant: SourcesImage; apres: SourcesImage };
  /** Mission 19 : les étiquettes matière de l'« après » et le lien de sa composition (l'ambiance seulement). */
  matieres?: MatiereCalque[];
  lienComposition?: string;
  /** L'identifiant de la réalisation publiée montrée (elle n'est pas répétée plus bas). */
  idPublication?: string;
};

/** Une réalisation avec les deux photos, dans l'ordre du CRM (d'un type de projet, s'il est donné). */
function premiereAvantApres(realisations: readonly Publication[], typeProjet?: string): (Publication & { photoAvant: string; photoApres: string }) | null {
  const trouvee = realisations.find((p) => p.type === "REALISATION" && (!typeProjet || p.typeProjet === typeProjet) && !!p.photoAvant && !!p.photoApres);
  return trouvee ? (trouvee as Publication & { photoAvant: string; photoApres: string }) : null;
}

/** La paire d'ambiance d'une ouverture : l'avant, l'après (noms du manifeste) et la légende posée sous l'image. */
export type PaireOuverture = { avant: string; apres: string; legende: string };

/** La paire de l'accueil (énoncé, § C.1). */
export const PAIRE_OUVERTURE_ACCUEIL: PaireOuverture = { ...IMAGE_OUVERTURE, legende: LEGENDE_OUVERTURE };

/**
 * L'image d'une ouverture : la première réalisation publiée qui a ses deux photos — de la pièce (`typeProjet`, le
 * code du CRM) sur une page de prestation (site 3.0, lot C1), de n'importe quelle pièce sur l'accueil —, sinon la
 * paire d'ambiance (`paire` : celle de l'accueil par défaut, celle de la prestation sinon, `data/cas-prestations`),
 * sinon `null` (images non préparées).
 */
export function choisirOuverture(realisations: readonly Publication[], manifeste: ManifesteImages = MANIFESTE_IMAGES, { typeProjet, paire = PAIRE_OUVERTURE_ACCUEIL }: { typeProjet?: string; paire?: PaireOuverture } = {}): ChoixOuverture | null {
  const reelle = premiereAvantApres(realisations, typeProjet);
  if (reelle) {
    return {
      type: "realisation",
      avant: reelle.photoAvant,
      apres: reelle.photoApres,
      ratio: RATIO_REALISATION,
      etiquette: reelle.ville ? `Réalisation, ${reelle.ville}` : "Réalisation",
      legende: reelle.ville ? `${reelle.titre}, ${reelle.ville}.` : `${reelle.titre}.`,
      alt: `Après — ${reelle.titre}`,
      altAvant: `Avant — ${reelle.titre}`,
      preparees: { avant: sourcesPhotoCrm(reelle.photoAvant), apres: sourcesPhotoCrm(reelle.photoApres) },
      idPublication: reelle.id,
    };
  }
  const avant = sourcesPhoto(paire.avant, manifeste);
  const apres = sourcesPhoto(paire.apres, manifeste);
  if (!avant || !apres) return null;
  const ambiance = paire.apres === IMAGE_OUVERTURE.apres ? AMBIANCE_OUVERTURE : ambianceDeLImage(paire.apres);
  const scene = PAIRES_SERIE_2.find((p) => p.avant === paire.avant)?.scene;
  return {
    type: "ambiance",
    avant: avant.src,
    apres: apres.src,
    ratio: `${avant.largeur} / ${avant.hauteur}`,
    etiquette: ETIQUETTE_OUVERTURE,
    legende: paire.legende,
    alt: paire === PAIRE_OUVERTURE_ACCUEIL ? ALT_OUVERTURE : (ambiance?.alt ?? "Pièce rénovée au film, image d'ambiance"),
    altAvant: paire === PAIRE_OUVERTURE_ACCUEIL ? ALT_AVANT_OUVERTURE : `${scene ?? "La même pièce avant la pose"}. Image d'ambiance.`,
    preparees: { avant, apres },
    ...(ambiance ? { matieres: ambiance.surfaces, lienComposition: ambiance.lienComposition } : {}),
  };
}

/**
 * Site 3.0 (lot B6) : l'image de partage suit l'image retenue — la photo « après » d'une réalisation publiée (WebP de
 * 1 600 px du CRM, au cadre 3 / 2 de l'ouverture). Une image d'ambiance n'est JAMAIS partagée telle quelle : elle n'y
 * porterait pas son étiquette « Ambiance » ; l'accueil garde l'image de partage du site jusqu'aux images composées et
 * étiquetées du lot F2 (`null` : celle par défaut).
 */
export function partageOuverture(choix: ChoixOuverture | null): ImagePartage | null {
  if (choix?.type !== "realisation") return null;
  return { url: `${choix.apres}?l=1600`, largeur: 1600, hauteur: 1067, alt: choix.legende };
}

/**
 * L'`ImageObject` (schema.org) de l'image de l'ouverture : son adresse, sa légende (celle affichée) et ce qu'elle est
 * (« Réalisation » ou « Ambiance · avant / après », comme l'étiquette posée dessus). `null` sans image.
 */
export function imageObjetOuverture(choix: ChoixOuverture | null): Record<string, unknown> | null {
  if (!choix) return null;
  const adresse = choix.apres.startsWith("http") ? choix.apres : urlAbsolue(choix.apres);
  return { "@context": "https://schema.org", "@type": "ImageObject", contentUrl: adresse, caption: choix.legende, description: `${choix.etiquette}. ${choix.alt}` };
}

/**
 * Mission 16 (partie 6) : le préchargement de l'image « avant » de l'ouverture (le LCP), pour `ReactDOM.preload` sur
 * `/` seulement. Il vise EXACTEMENT ce que le `<picture>` choisira : le `srcset` AVIF (préparé) — ou, pour une
 * réalisation du CRM, les WebP réduits (`?l=`) —, les mêmes `sizes`, `type` (un navigateur qui ne lit pas le format
 * ignore le préchargement au lieu de télécharger deux fois), `fetchPriority="high"` et `no-referrer` comme l'`<img>`.
 * `href` : l'entrée du `srcset` la plus proche de 960 px (repli des navigateurs sans `imagesrcset`). `null` sans image.
 */
export type PrechargementImage = { href: string; options: { as: "image"; imageSrcSet?: string; imageSizes?: string; type?: string; media?: string; fetchPriority: "high"; referrerPolicy: "no-referrer" } };

/** L'adresse de l'entrée d'un `srcset` dont la largeur est la plus grande ≤ 960 px (sinon la plus petite). */
export function adresseMoyenne(srcset: string): string {
  const entrees = srcset
    .split(",")
    .map((e) => e.trim().split(/\s+/))
    .filter((e) => e[0])
    .map(([adresse, largeur]) => ({ adresse, largeur: Number.parseInt(largeur ?? "", 10) || 0 }))
    .sort((a, b) => a.largeur - b.largeur);
  const moyennes = entrees.filter((e) => e.largeur <= 960);
  return (moyennes.length ? moyennes[moyennes.length - 1] : entrees[0])?.adresse ?? "";
}

/**
 * Les préchargements de l'« avant » de l'ouverture : un seul quand la série tient sous 960 px, sinon deux, chacun
 * avec son `media` — le téléphone reçoit la série plafonnée (comme les sources du `<picture>`), l'écran large la
 * série entière. Jamais deux téléchargements de la même image.
 */
export function prechargementsOuverture(choix: ChoixOuverture | null, tailles: string = TAILLES_OUVERTURE): PrechargementImage[] {
  if (!choix) return [];
  const sources = choix.preparees.avant;
  const commun = { as: "image", fetchPriority: "high", referrerPolicy: "no-referrer" } as const;
  const format = sources.avif ? { srcset: sources.avif, type: "image/avif" } : sources.webp ? { srcset: sources.webp, type: "image/webp" } : sources.jpg ? { srcset: sources.jpg, type: undefined } : null;
  if (!format) return [{ href: sources.src, options: commun }];
  const options = (srcset: string, media?: string) => ({ ...commun, imageSrcSet: srcset, imageSizes: tailles, ...(format.type ? { type: format.type } : {}), ...(media ? { media } : {}) });
  const plafonne = plafonnerSrcset(format.srcset);
  if (plafonne === format.srcset) return [{ href: adresseMoyenne(format.srcset) || sources.src, options: options(format.srcset) }];
  return [
    { href: adresseMoyenne(plafonne) || sources.src, options: options(plafonne, MEDIA_TELEPHONE) },
    { href: adresseMoyenne(format.srcset) || sources.src, options: options(format.srcset, MEDIA_ECRAN_LARGE) },
  ];
}
