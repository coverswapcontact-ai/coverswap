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
  "etape-photo": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "82c61105f42f" },
  "etape-pose": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "f746a037f3f4" },
  "etape-simulation": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "4c219eac90ca" },
  "etude-meubles-apres": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "b1fd9d73e99e" },
  "etude-meubles-avant": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "69ae53a19673" },
  "etude-salle-de-bain-apres": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "59597d4e564a" },
  "etude-salle-de-bain-avant": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "eab5f8512b76" },
  "meubles-armoire": { largeur: 1024, hauteur: 1536, largeurs: [480, 960, 1024], empreinte: "a69a8c6f0021" },
  "meubles-dressing-avant": { largeur: 1024, hauteur: 1536, largeurs: [480, 960, 1024], empreinte: "903922182ae4" },
  "mur-salon": { largeur: 1024, hauteur: 1024, largeurs: [480, 960, 1024], empreinte: "5b42caf09818" },
  "ouverture-cuisine-apres": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "5ffe051f6ec0" },
  "ouverture-cuisine-avant": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "84acc79b95b3" },
  "piece-cuisine": { largeur: 1024, hauteur: 1024, largeurs: [480, 960, 1024], empreinte: "71ad1306ec4a" },
  "piece-meubles": { largeur: 1024, hauteur: 1024, largeurs: [480, 960, 1024], empreinte: "e72f4cc3da76" },
  "piece-murs": { largeur: 1024, hauteur: 1024, largeurs: [480, 960, 1024], empreinte: "706f0abe3d7f" },
  "piece-pro": { largeur: 1024, hauteur: 1024, largeurs: [480, 960, 1024], empreinte: "5715a7ac0149" },
  "piece-salle-de-bain": { largeur: 1024, hauteur: 1024, largeurs: [480, 960, 1024], empreinte: "078472f63023" },
  "pro-bureaux": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "e3032b36e940" },
  "pro-commerce": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "ffaa63f6e36e" },
  "pro-hotel": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "3afead7017d2" },
  "pro-restaurant": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "70b9c6d9c564" },
  "pro-restaurant-avant": { largeur: 1536, hauteur: 1024, largeurs: [480, 960, 1536], empreinte: "e6894a53b84d" },
};
