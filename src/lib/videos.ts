/**
 * Les vidéos du site (mission 22, partie B) : quatre films motion design, muets, dans `public/videos/` (H.264, 1080 au
 * plus grand côté, `faststart`, sans piste son), plus la boucle courte du présentoir (`-t 9.6`, un fichier à part).
 * Module pur, sans import : les composants envoyés au navigateur (`BoutonVideo`, `VideoBoucle`, l'écran Pièce du
 * simulateur) le lisent sans tirer le manifeste des images.
 *
 * Cache : `/videos/*` est servi en cache immuable d'un an (`next.config.ts › headers`), comme les images préparées ;
 * chaque adresse porte donc l'empreinte de son fichier (`?v=<sha1 tronqué>`), écrite ici à la main et vérifiée contre
 * le fichier par `src/lib/videos.test.ts` : une vidéo remplacée sous le même nom sans nouvelle empreinte fait échouer
 * le test (sinon le navigateur garderait l'ancienne un an).
 *
 * Son : les fichiers n'ont pas de piste son ; une voix off viendra peut-être. Le visiteur l'activera par le bouton
 * « Son » du plein écran (`PleinEcran`, muet par défaut) ; jamais d'office.
 *
 * Honnêteté : les affiches (une image à 1,5 s ou 8 s de chaque film, `public/images/sources/affiche-*.jpg`, préparées
 * par `npm run images`) portent leur étiquette : « Ambiance » (le reel, le présentoir et « Comment ça marche » montrent
 * des ambiances générées), « Démonstration » (la démo du simulateur montre l'outil, pas un chantier).
 */
export type VideoSite = {
  /** Le fichier dans `public/videos/`. */
  fichier: string;
  /** sha1 des octets, 12 caractères (`sha1sum`). */
  empreinte: string;
  largeur: number;
  hauteur: number;
  /** Durée en secondes (ffprobe). */
  duree: number;
  /** Le nom de l'affiche au manifeste des images (`affiche-*`). */
  affiche: string;
  /** L'étiquette d'honnêteté posée sur l'affiche. */
  etiquette: "Ambiance" | "Démonstration";
  /** Le nom du film (dialogue du plein écran, `VideoObject`). */
  titre: string;
  /** Ce qu'il montre (`VideoObject`). */
  description: string;
};

/** Dossier public des vidéos. */
export const DOSSIER_VIDEOS = "/videos";

/** Date de mise en ligne des films (`VideoObject.uploadDate`). */
export const DATE_VIDEOS = "2026-10-06";

export const VIDEOS = {
  reel: {
    fichier: "reel-avant-apres.mp4",
    empreinte: "be8a198ec114",
    largeur: 608,
    hauteur: 1080,
    duree: 15.5,
    affiche: "affiche-reel-avant-apres",
    etiquette: "Ambiance",
    titre: "Avant / après en 15 secondes",
    description: "Des pièces avant et après la pose d'un film adhésif Cover Styl' : cuisine, salle de bain, meubles. Images d'ambiance aux teintes du catalogue.",
  },
  commentCaMarche: {
    fichier: "comment-ca-marche.mp4",
    empreinte: "30bd94dc64d6",
    largeur: 1080,
    hauteur: 608,
    duree: 30,
    affiche: "affiche-comment-ca-marche",
    etiquette: "Ambiance",
    titre: "Comment ça marche, en 30 secondes",
    description: "Les quatre étapes du covering : votre photo, la simulation, les échantillons chez vous, la pose en une journée. Images d'ambiance aux teintes du catalogue.",
  },
  presentoir: {
    fichier: "presentoir.mp4",
    empreinte: "83b4b1909619",
    largeur: 1080,
    hauteur: 608,
    duree: 20.5,
    affiche: "affiche-presentoir",
    etiquette: "Ambiance",
    titre: "Le présentoir des matières, en 20 secondes",
    description: "Les familles de films adhésifs Cover Styl' : bois, pierre, béton, métal, couleurs unies. Images d'ambiance aux teintes du catalogue.",
  },
  presentoirBoucle: {
    fichier: "presentoir-boucle.mp4",
    empreinte: "92b1cc17b7b4",
    largeur: 1080,
    hauteur: 608,
    duree: 9.6,
    affiche: "affiche-presentoir",
    etiquette: "Ambiance",
    titre: "Le présentoir des matières",
    description: "Les familles de films adhésifs Cover Styl' qui défilent : bois, pierre, béton, métal, couleurs unies. Boucle muette, images d'ambiance aux teintes du catalogue.",
  },
  demoSimulateur: {
    fichier: "demo-simulateur.mp4",
    empreinte: "208758f665ca",
    largeur: 608,
    hauteur: 1080,
    duree: 21,
    affiche: "affiche-demo-simulateur",
    etiquette: "Démonstration",
    titre: "La démo du simulateur, en 20 secondes",
    description: "Le simulateur de covering sur un téléphone : la pièce, la photo, le choix des matières et le rendu avant / après avec son estimation.",
  },
} as const satisfies Record<string, VideoSite>;

export type IdVideo = keyof typeof VIDEOS;

/** L'adresse d'un fichier vidéo, avec son empreinte (cache immuable). */
export const adresseVideo = (v: VideoSite) => `${DOSSIER_VIDEOS}/${v.fichier}?v=${v.empreinte}`;

/** Le rapport du cadre réservé (« 1080 / 608 »). */
export const ratioVideo = (v: VideoSite) => `${v.largeur} / ${v.hauteur}`;

/** La durée en ISO 8601 pour `VideoObject` (secondes entières : « PT15S »). */
export const dureeIso = (v: VideoSite) => `PT${Math.floor(v.duree)}S`;

/** Les libellés des boutons, tels que l'énoncé les écrit (arrondis à 5 s). */
export const LIBELLES_VIDEO: Record<IdVideo, string> = {
  reel: "Voir en 15 s",
  commentCaMarche: "Voir en 30 s",
  presentoir: "Voir le présentoir en 20 s",
  presentoirBoucle: "Lire",
  demoSimulateur: "Voir la démo · 20 s",
};
