import type { MatiereCalque } from "@/components/ambiances/CalqueMatieres";
import { ambianceDeLImage } from "@/lib/ambiances";
import { versEtudeReelle, type EtudeReelle } from "@/lib/etude-de-cas";
import { ALT_PIECES, PHOTOS_PIECES } from "@/lib/images-pieces";
import { sourcesPhoto, type ManifesteImages, type SourcesImage, type SourcesPhoto, MEDIA_ECRAN_LARGE, MEDIA_TELEPHONE, plafonnerSrcset } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { DUREE_POSE_TEXTE, fourchette } from "@/lib/offre";
import { sourcesPhotoCrm, type Publication } from "@/lib/publications";

export type { EtudeReelle } from "@/lib/etude-de-cas";

/**
 * Ce que l'accueil montre en image (mission 16, partie 3), en règles pures et
 * testées — l'honnêteté (énoncé § 1.1) est CODÉE ici, pas seulement écrite :
 *  - l'ouverture prend la PREMIÈRE réalisation publiée par le CRM qui a une
 *    photo avant ET une photo après (étiquette « Réalisation, <ville> »), en
 *    WebP réduit par le CRM (`sourcesPhotoCrm` : le LCP n'est pas la photo
 *    entière) ; sinon la paire d'ambiance de l'ouverture (mission 19 : deux
 *    images générées et calées, étiquette « Ambiance » — « Simulation » est
 *    réservé aux rendus du moteur —, AVIF préparé, étiquettes matière) ;
 *  - « Réalisations » montre jusqu'à trois réalisations publiées (avec leur
 *    photo après ; prix et durée publiés, sinon habituels libellés comme tels :
 *    `lib/etude-de-cas`) ; sinon trois études SIMULÉES : la cuisine de
 *    l'ouverture (« Simulation »), la salle de bain et les meubles en image
 *    d'ambiance (« Ambiance » : une image générée n'est pas un rendu du
 *    moteur), chacune avec la fourchette d'`offre.ts` et la durée de pose —
 *    jamais un prix réel inventé, jamais une ville.
 */

const AVANT_OUVERTURE = "ouverture-cuisine-avant";
const APRES_OUVERTURE = "ouverture-cuisine-apres";
/** Le cadre d'une réalisation publiée à l'ouverture (ses photos n'ont pas de dimensions connues) : celui des images d'ambiance. */
export const RATIO_REALISATION = "3 / 2";

/**
 * Les textes de l'image de l'ouverture : l'« après » est lu en premier (il vient d'abord dans le document) et seul en
 * plein écran. Mission 19 : tiré de l'ambiance (`data/ambiances`, la scène et chaque matière) ; l'« avant » dit ce
 * qu'on voit sur la nouvelle image.
 */
const AMBIANCE_OUVERTURE = ambianceDeLImage(APRES_OUVERTURE);
export const ALT_OUVERTURE = AMBIANCE_OUVERTURE?.alt ?? "Cuisine rénovée au film, image d'ambiance";
export const ALT_AVANT_OUVERTURE = "La même cuisine avant la pose : façades en bois orangé brillant, plan de travail en granit";

/** L'attribut `sizes` de l'image de l'ouverture : le même pour le `<picture>` et pour son préchargement. */
export const TAILLES_OUVERTURE = "(min-width: 1152px) 672px, (min-width: 768px) 58vw, 100vw";

export type ChoixOuverture = {
  /** « ambiance » (mission 19, ex-« simulation ») : la paire générée de l'ouverture, avant la première réalisation publiée. */
  type: "realisation" | "ambiance";
  avant: string;
  apres: string;
  ratio: string;
  etiquette: string;
  alt: string;
  altAvant: string;
  preparees: { avant: SourcesImage; apres: SourcesImage };
  /** Mission 19 : les étiquettes matière de l'« après » et le lien de sa composition (l'ambiance seulement). */
  matieres?: MatiereCalque[];
  lienComposition?: string;
};

/** Une réalisation avec les deux photos, dans l'ordre du CRM. */
function premiereAvantApres(realisations: readonly Publication[]): (Publication & { photoAvant: string; photoApres: string }) | null {
  const trouvee = realisations.find((p) => p.type === "REALISATION" && !!p.photoAvant && !!p.photoApres);
  return trouvee ? (trouvee as Publication & { photoAvant: string; photoApres: string }) : null;
}

export function choisirOuverture(realisations: readonly Publication[], manifeste: ManifesteImages = MANIFESTE_IMAGES): ChoixOuverture | null {
  const reelle = premiereAvantApres(realisations);
  if (reelle) {
    return {
      type: "realisation",
      avant: reelle.photoAvant,
      apres: reelle.photoApres,
      ratio: RATIO_REALISATION,
      etiquette: reelle.ville ? `Réalisation, ${reelle.ville}` : "Réalisation",
      alt: `Après — ${reelle.titre}`,
      altAvant: `Avant — ${reelle.titre}`,
      preparees: { avant: sourcesPhotoCrm(reelle.photoAvant), apres: sourcesPhotoCrm(reelle.photoApres) },
    };
  }
  const avant = sourcesPhoto(AVANT_OUVERTURE, manifeste);
  const apres = sourcesPhoto(APRES_OUVERTURE, manifeste);
  if (!avant || !apres) return null;
  return {
    type: "ambiance",
    avant: avant.src,
    apres: apres.src,
    ratio: `${avant.largeur} / ${avant.hauteur}`,
    etiquette: "Ambiance",
    alt: ALT_OUVERTURE,
    altAvant: ALT_AVANT_OUVERTURE,
    preparees: { avant, apres },
    ...(AMBIANCE_OUVERTURE ? { matieres: AMBIANCE_OUVERTURE.surfaces, lienComposition: AMBIANCE_OUVERTURE.lienComposition } : {}),
  };
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

/* ── Réalisations ─────────────────────────────────────────────────── */

export type EtudeSimulee = {
  id: "cuisine" | "salle-de-bain" | "meubles";
  titre: string;
  image: { type: "avant-apres"; avant: string; apres: string; preparees: { avant: SourcesPhoto; apres: SourcesPhoto } } | { type: "photo"; nom: string };
  etiquette: "Simulation" | "Ambiance";
  /** Le texte de l'image, qui se lit seul (lecteur d'écran). */
  alt: string;
  /** Le texte de l'« avant » d'une paire. */
  altAvant?: string;
  /** La fourchette d'`offre.ts` (« 1 200 € à 3 500 € », « dès 250 € »). */
  prix: string;
  /** La durée de pose d'`offre.ts` (« une journée »). */
  duree: string;
  /** Mission 19 : les étiquettes matière de l'« après » et le lien de sa composition (paire d'ambiance). */
  matieres?: MatiereCalque[];
  lienComposition?: string;
};

export type ChoixEtudes = { mode: "reelles"; titre: "Ils l'ont fait"; etudes: EtudeReelle[] } | { mode: "simulees"; titre: "Ce que ça donne"; etudes: EtudeSimulee[] };

export const ETUDES_MAX = 3;

/** Une étude en image d'ambiance (la photo de la carte de pièce, `lib/images-pieces`), étiquetée « Ambiance » : le repli. */
function etudeAmbiance(id: EtudeSimulee["id"], titre: string, cle: "cuisine" | "sdb" | "meuble"): EtudeSimulee {
  return { id, titre, image: { type: "photo", nom: PHOTOS_PIECES[id] }, etiquette: "Ambiance", alt: ALT_PIECES[id], prix: fourchette(cle), duree: DUREE_POSE_TEXTE };
}

/**
 * Mission 19 : une étude en PAIRE d'ambiance (deux images générées et calées, `data/ambiances`) : l'« après » (nom du
 * manifeste) et son « avant », étiquetée « Ambiance », avec ses étiquettes matière ; null si l'une des deux images
 * n'est pas préparée.
 */
function etudePaire(id: EtudeSimulee["id"], titre: string, cle: "cuisine" | "sdb" | "meuble", imageApres: string, manifeste: ManifesteImages): EtudeSimulee | null {
  const ambiance = ambianceDeLImage(imageApres);
  const avant = ambiance?.avant ? sourcesPhoto(ambiance.avant, manifeste) : null;
  const apres = sourcesPhoto(imageApres, manifeste);
  if (!ambiance || !avant || !apres) return null;
  return {
    id,
    titre,
    image: { type: "avant-apres", avant: avant.src, apres: apres.src, preparees: { avant, apres } },
    etiquette: "Ambiance",
    alt: ambiance.alt,
    altAvant: `La même pièce avant la pose, avec ses matières d'origine`,
    prix: fourchette(cle),
    duree: DUREE_POSE_TEXTE,
    matieres: ambiance.surfaces,
    lienComposition: ambiance.lienComposition,
  };
}

/** La cuisine de l'ouverture (avant / après) : depuis la mission 19, deux images d'ambiance générées et calées (« Ambiance »), si elles sont préparées. */
export function etudeCuisineSimulee(manifeste: ManifesteImages = MANIFESTE_IMAGES): EtudeSimulee | null {
  const etude = etudePaire("cuisine", "Cuisine", "cuisine", APRES_OUVERTURE, manifeste);
  return etude ? { ...etude, altAvant: ALT_AVANT_OUVERTURE } : null;
}

/** Les images « après » des paires d'étude : la cuisine de l'ouverture, la salle de bain, le meuble TV, le dressing (Prestations › Meubles). */
export const PAIRES_ETUDES = { "salle-de-bain": "etude-salle-de-bain-apres", meubles: "etude-meubles-apres", dressing: "meubles-armoire" } as const;

/** Les études de cas de l'accueil : les réalisations publiées si le CRM en a, sinon trois paires d'ambiance (mission 19). */
export function choisirEtudes(realisations: readonly Publication[], manifeste: ManifesteImages = MANIFESTE_IMAGES): ChoixEtudes {
  const publiees = realisations.filter((p): p is Publication & { photoApres: string } => p.type === "REALISATION" && !!p.photoApres).slice(0, ETUDES_MAX);
  if (publiees.length > 0) return { mode: "reelles", titre: "Ils l'ont fait", etudes: publiees.map(versEtudeReelle) };

  // Trois paires avant / après d'ambiance ; à défaut (image non préparée), l'image d'ambiance de la pièce.
  return {
    mode: "simulees",
    titre: "Ce que ça donne",
    etudes: [
      etudeCuisineSimulee(manifeste) ?? etudeAmbiance("cuisine", "Cuisine", "cuisine"),
      etudePaire("salle-de-bain", "Salle de bain", "sdb", PAIRES_ETUDES["salle-de-bain"], manifeste) ?? etudeAmbiance("salle-de-bain", "Salle de bain", "sdb"),
      etudePaire("meubles", "Meubles", "meuble", PAIRES_ETUDES.meubles, manifeste) ?? etudeAmbiance("meubles", "Meubles", "meuble"),
    ],
  };
}

/* ── L'étude de cas d'une page par pièce (mission 16, partie 5) ───────── */

export type EtudePiece = { mode: "reelle"; etude: EtudeReelle } | { mode: "simulee"; etude: EtudeSimulee };

/**
 * L'étude de cas de la page d'une pièce (`/prestations/<slug>`) : la PREMIÈRE réalisation publiée par le CRM pour ce
 * type de projet (avec sa photo après) ; sinon, depuis la mission 19, la paire d'ambiance de la pièce — la cuisine de
 * l'ouverture, la salle de bain, le dressing pour les meubles (l'image verticale) ; sinon rien.
 */
export function etudeDeLaPiece(typeProjet: string, pieceId: string | null, realisations: readonly Publication[], manifeste: ManifesteImages = MANIFESTE_IMAGES): EtudePiece | null {
  const reelle = realisations.find((p) => p.type === "REALISATION" && p.typeProjet === typeProjet && !!p.photoApres);
  if (reelle) return { mode: "reelle", etude: versEtudeReelle(reelle) };
  const simulee =
    pieceId === "cuisine"
      ? etudeCuisineSimulee(manifeste)
      : pieceId === "salle-de-bain"
        ? etudePaire("salle-de-bain", "Salle de bain", "sdb", PAIRES_ETUDES["salle-de-bain"], manifeste)
        : pieceId === "meubles"
          ? etudePaire("meubles", "Dressing", "meuble", PAIRES_ETUDES.dressing, manifeste)
          : null;
  return simulee ? { mode: "simulee", etude: simulee } : null;
}
