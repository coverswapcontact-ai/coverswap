/**
 * FICHIER GÉNÉRÉ par `scripts/preparer-images.mjs` (`npm run images`) : ne pas éditer à la main.
 *
 * Les images préparées du site (mission 16, partie 2) : pour chaque original de
 * `public/images/sources/`, ses dimensions (`width` / `height` réservés, CLS 0) et
 * les largeurs produites dans `public/images/prep/<nom>-<largeur>.<avif|webp|jpg>`
 * (480 / 960 / 1600 plafonnées à l'origine) et l'empreinte de l'original (sha1,
 * 12 caractères : un original remplacé sous le même nom est repréparé). Lu par
 * `Photo` via `sourcesPhoto` (`src/lib/images-preparees.ts`).
 */
import type { ManifesteImages } from "./images-preparees";

export const MANIFESTE_IMAGES: ManifesteImages = {
  "etape-photo": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "0d983799eaf0" },
  "etape-pose": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "0306da50565b" },
  "meubles-armoire": { largeur: 1024, hauteur: 1536, largeurs: [480, 960, 1024], empreinte: "92adbbe00c49" },
  "mur-salon": { largeur: 1024, hauteur: 904, largeurs: [480, 960, 1024], empreinte: "44b83f181c49" },
  "ouverture-cuisine-apres": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "e5261882c715" },
  "ouverture-cuisine-avant": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "fdb1e19ea3c3" },
  "ouverture-provisoire": { largeur: 1080, hauteur: 1080, largeurs: [480, 960, 1080], empreinte: "bd8f462fb495" },
  "piece-cuisine": { largeur: 1024, hauteur: 1024, largeurs: [480, 960, 1024], empreinte: "cb7634eb26ea" },
  "piece-meubles": { largeur: 1024, hauteur: 1024, largeurs: [480, 960, 1024], empreinte: "c0a716f7dd6e" },
  "piece-murs": { largeur: 1024, hauteur: 1024, largeurs: [480, 960, 1024], empreinte: "a87908ded348" },
  "piece-pro": { largeur: 1024, hauteur: 1024, largeurs: [480, 960, 1024], empreinte: "59f72c69b80e" },
  "piece-salle-de-bain": { largeur: 1024, hauteur: 1024, largeurs: [480, 960, 1024], empreinte: "b9c8feecda6d" },
  "pro-bureaux": { largeur: 1024, hauteur: 684, largeurs: [480, 960, 1024], empreinte: "29494d64594d" },
  "pro-commerce": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "783c17f5d7f8" },
  "pro-hotel": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "c5a35bc1a016" },
  "pro-restaurant": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "c8686bf307e0" },
};
