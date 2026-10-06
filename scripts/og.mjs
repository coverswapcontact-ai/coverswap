#!/usr/bin/env node
/**
 * Les images de partage des pages (site 3.0, lot F2 ; `docs/SEO.md`, « Image de partage ») : pour chaque avant / après
 * que montre une page (`pagesAvecPaire`, `src/lib/partage.ts`, la seule source), une image de 1 200 × 630 composée par
 * sharp à partir des images de la bibliothèque — l'avant à gauche, l'après à droite, chacun marqué, et le bandeau
 * « Ambiance · avant / après » en bas : une image générée n'est jamais partagée sans son étiquette. Aucun appel
 * d'API, aucun coût ; un fichier par paire (`public/images/og/<après>.jpg`), les fichiers qui ne servent plus sont
 * retirés. Relançable : le résultat ne dépend que des images et des jetons.
 *
 *   npm run og          (node --import tsx scripts/og.mjs)
 *
 * Couleurs : les jetons de `globals.css` (`scripts/jetons.mjs`). Police : Segoe UI ou Arial (les polices du site ne
 * sont pas installées sur le poste ; sharp prend celles du système).
 */
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { lireJetons } from "./jetons.mjs";
import { DOSSIER_PARTAGE, ETIQUETTE_PARTAGE, HAUTEUR_PARTAGE, LARGEUR_PARTAGE, pagesAvecPaire } from "../src/lib/partage.ts";

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(RACINE, "public");
const SORTIE = path.join(PUBLIC, ...DOSSIER_PARTAGE.split("/").filter(Boolean));
const JETONS = lireJetons();
const POLICE = "'Segoe UI', Arial, sans-serif";

const L = LARGEUR_PARTAGE;
const H = HAUTEUR_PARTAGE;
/** Le bandeau du bas, et le filet entre l'avant et l'après. */
const BANDEAU = 64;
const FILET = 6;
const DEMI = (L - FILET) / 2;
const HAUT_IMAGES = H - BANDEAU;

/** L'image d'origine d'un nom du manifeste : l'original de la bibliothèque, sinon la plus grande image préparée. */
function source(nom) {
  const original = path.join(PUBLIC, "images", "sources", `${nom}.jpg`);
  if (existsSync(original)) return original;
  for (const largeur of [1600, 1536, 1024, 960]) {
    const prep = path.join(PUBLIC, "images", "prep", `${nom}-${largeur}.jpg`);
    if (existsSync(prep)) return prep;
  }
  throw new Error(`image introuvable : ${nom}`);
}

const echapper = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Une pastille « Avant » / « Après » (papier, encre), en haut à gauche d'une moitié. */
function pastille(x, texte) {
  const largeur = 22 + texte.length * 13;
  return `<rect x="${x + 20}" y="20" width="${largeur}" height="36" rx="18" fill="${JETONS.fond}" fill-opacity="0.94"/>
  <text x="${x + 20 + largeur / 2}" y="44" text-anchor="middle" font-family="${POLICE}" font-size="20" font-weight="600" fill="${JETONS.encre}">${echapper(texte)}</text>`;
}

const habillage = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}" viewBox="0 0 ${L} ${H}">
  <rect x="${DEMI}" y="0" width="${FILET}" height="${HAUT_IMAGES}" fill="${JETONS.fond}"/>
  ${pastille(0, "Avant")}
  ${pastille(DEMI + FILET, "Après")}
  <rect x="0" y="${HAUT_IMAGES}" width="${L}" height="${BANDEAU}" fill="${JETONS.fond}"/>
  <rect x="0" y="${HAUT_IMAGES}" width="${L}" height="2" fill="${JETONS.trait}"/>
  <text x="32" y="${HAUT_IMAGES + 41}" font-family="${POLICE}" font-size="26" font-weight="600" fill="${JETONS.encre}">${echapper(ETIQUETTE_PARTAGE)}</text>
  <text x="${L - 32}" y="${HAUT_IMAGES + 41}" text-anchor="end" font-family="${POLICE}" font-size="24" font-weight="400" fill="${JETONS["encre-2"]}">coverswap.fr</text>
</svg>`;

/** Une moitié : l'image recadrée au centre pour remplir sa place. */
const moitie = (nom) => sharp(source(nom)).resize(DEMI, HAUT_IMAGES, { fit: "cover", position: "centre" }).toBuffer();

async function composer({ avant, apres }, fichier) {
  const [a, b] = await Promise.all([moitie(avant), moitie(apres)]);
  await sharp({ create: { width: L, height: H, channels: 3, background: JETONS.fond } })
    .composite([
      { input: a, left: 0, top: 0 },
      { input: b, left: DEMI + FILET, top: 0 },
      { input: Buffer.from(habillage), left: 0, top: 0 },
    ])
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(fichier);
}

mkdirSync(SORTIE, { recursive: true });
const paires = new Map();
for (const { paire } of pagesAvecPaire()) paires.set(paire.apres, paire);
for (const paire of paires.values()) {
  const fichier = path.join(SORTIE, `${paire.apres}.jpg`);
  await composer(paire, fichier);
  console.log(`  ${path.relative(RACINE, fichier)}`);
}
// Les fichiers qui ne servent plus à aucune page.
for (const nom of readdirSync(SORTIE)) {
  if (nom.endsWith(".jpg") && !paires.has(nom.replace(/\.jpg$/, ""))) {
    unlinkSync(path.join(SORTIE, nom));
    console.log(`  retiré : ${nom}`);
  }
}
console.log(`${paires.size} images de partage dans ${path.relative(RACINE, SORTIE)}.`);
