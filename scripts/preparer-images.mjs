/**
 * Prépare les images du site (mission 16, partie 2), en local, sans coût :
 *   public/images/sources/<nom>.<jpg|jpeg|png>  (les originaux, commités)
 *   → public/images/prep/<nom>-<largeur>.<avif|webp|jpg>
 *   → src/lib/images-manifeste.ts (regénéré : dimensions, largeurs et empreinte de chaque image)
 *
 * Pourquoi : le site n'utilise pas l'optimiseur d'images de Vercel
 * (`images.unoptimized`, quota du plan Hobby épuisé → HTTP 402). Chaque image
 * est donc produite ici, une fois, aux largeurs 480 / 960 / 1600 plafonnées à
 * l'origine (jamais agrandie : une image de 1536 px sort en 480, 960 et 1536),
 * en AVIF (qualité 50), WebP (78) et JPEG mozjpeg (80), puis servie telle
 * quelle par le composant `Photo` (`<picture>`, `width` / `height` réservés).
 *
 * Idempotent : ne produit que les fichiers manquants (`--tout` refait tout),
 * SAUF pour un original remplacé sous le même nom : son empreinte (sha1 des
 * octets, 12 caractères, écrite au manifeste) ne correspond plus, et toutes
 * ses sorties sont refaites — la date de modification n'est pas un signe (une
 * copie par l'Explorateur de Windows la garde). Les fichiers de prep/ qu'aucune
 * source ne demande plus sont retirés (ce sont des sorties, pas des données) ;
 * le manifeste n'est réécrit que s'il change.
 *
 * Honnêteté (énoncé de la mission 16, § 1.1) : une image générée est une
 * « ambiance », jamais un chantier ; un rendu du moteur est une « Simulation ».
 * Jamais une photo de client du CRM ici.
 *
 * Usage : npm run images           (ce qui manque)
 *         npm run images -- --tout (tout refaire)
 */
import { createHash } from "node:crypto";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { lireJetons, versRgb } from "./jetons.mjs";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DOSSIER_SOURCES = path.join(RACINE, "public", "images", "sources");
export const DOSSIER_PREP = path.join(RACINE, "public", "images", "prep");
export const FICHIER_MANIFESTE = path.join(RACINE, "src", "lib", "images-manifeste.ts");

/** Les largeurs visées, croissantes. */
export const LARGEURS = [480, 960, 1600];
/** Les formats produits, dans l'ordre du `<picture>`, et leur qualité. */
export const FORMATS = /** @type {const} */ (["avif", "webp", "jpg"]);
export const QUALITES = { avif: 50, webp: 78, jpg: 80 };
/** Extensions acceptées dans sources/. */
export const EXTENSIONS_SOURCES = [".jpg", ".jpeg", ".png"];
/** Un nom d'image : minuscules, chiffres et tirets (il devient une adresse). */
export const MOTIF_NOM = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Fond posé sous une éventuelle transparence (le JPEG n'en a pas) : le jeton `--color-fond`, lu dans globals.css. */
const FOND = versRgb(lireJetons().fond);
/** Longueur de l'empreinte d'un original au manifeste (sha1 tronqué) : assez pour voir qu'il a été remplacé. */
export const LONGUEUR_EMPREINTE = 12;

/**
 * L'empreinte d'un original : les 12 premiers caractères du sha1 de ses
 * octets. Fonction pure.
 * @param {Uint8Array} octets
 * @returns {string}
 */
export function empreinteOriginal(octets) {
  return createHash("sha1").update(octets).digest("hex").slice(0, LONGUEUR_EMPREINTE);
}

/**
 * Les empreintes d'un manifeste déjà écrit (le texte que rend
 * `texteManifeste`) : `nom → empreinte`. Une entrée sans empreinte (manifeste
 * d'avant) n'y figure pas : ses sorties seront refaites. Fonction pure.
 * @param {string} texte
 * @returns {Map<string, string>}
 */
export function lireEmpreintes(texte) {
  const empreintes = new Map();
  for (const m of texte.matchAll(/^\s*"([a-z0-9-]+)":\s*\{[^\n}]*\bempreinte:\s*"([0-9a-f]+)"/gm)) empreintes.set(m[1], m[2]);
  return empreintes;
}

/**
 * Les sorties d'une image : les largeurs 480 / 960 / 1600 plafonnées à la
 * largeur d'origine (jamais agrandie), sans doublon, croissantes, et la hauteur
 * de chacune au même rapport. Fonction pure.
 * @param {number} largeurOrigine
 * @param {number} hauteurOrigine
 * @returns {{ largeur: number; hauteur: number }[]}
 */
export function planifierSorties(largeurOrigine, hauteurOrigine) {
  if (!Number.isInteger(largeurOrigine) || !Number.isInteger(hauteurOrigine) || largeurOrigine <= 0 || hauteurOrigine <= 0) {
    throw new Error(`Dimensions invalides : ${largeurOrigine} × ${hauteurOrigine}`);
  }
  const largeurs = [...new Set(LARGEURS.map((l) => Math.min(l, largeurOrigine)))].sort((a, b) => a - b);
  return largeurs.map((largeur) => ({ largeur, hauteur: Math.max(1, Math.round((hauteurOrigine * largeur) / largeurOrigine)) }));
}

/**
 * Le fichier de sortie d'une image, à une largeur et dans un format.
 * @param {string} nom
 * @param {number} largeur
 * @param {string} format
 */
export function nomSortie(nom, largeur, format) {
  return `${nom}-${largeur}.${format}`;
}

/**
 * Le texte de `src/lib/images-manifeste.ts` : noms triés (ordre des caractères,
 * indépendant de la langue du poste), une ligne par image. Fonction pure : le
 * même manifeste donne toujours le même texte.
 * @param {Record<string, { largeur: number; hauteur: number; largeurs: number[]; empreinte?: string }>} entrees
 * @returns {string}
 */
export function texteManifeste(entrees) {
  const noms = Object.keys(entrees).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const lignes = noms.map((nom) => {
    const e = entrees[nom];
    const largeurs = [...e.largeurs].sort((a, b) => a - b);
    const empreinte = e.empreinte ? `, empreinte: ${JSON.stringify(e.empreinte)}` : "";
    return `  ${JSON.stringify(nom)}: { largeur: ${e.largeur}, hauteur: ${e.hauteur}, largeurs: [${largeurs.join(", ")}]${empreinte} },`;
  });
  const objet = lignes.length > 0 ? `{\n${lignes.join("\n")}\n}` : "{}";
  return [
    "/**",
    " * FICHIER GÉNÉRÉ par `scripts/preparer-images.mjs` (`npm run images`) : ne pas éditer à la main.",
    " *",
    " * Les images préparées du site (mission 16, partie 2) : pour chaque original de",
    " * `public/images/sources/`, ses dimensions (`width` / `height` réservés, CLS 0) et",
    " * les largeurs produites dans `public/images/prep/<nom>-<largeur>.<avif|webp|jpg>`",
    " * (480 / 960 / 1600 plafonnées à l'origine) et l'empreinte de l'original (sha1,",
    " * 12 caractères : un original remplacé sous le même nom est repréparé). Lu par",
    " * `Photo` via `sourcesPhoto` (`src/lib/images-preparees.ts`).",
    " */",
    'import type { ManifesteImages } from "./images-preparees";',
    "",
    `export const MANIFESTE_IMAGES: ManifesteImages = ${objet};`,
    "",
  ].join("\n");
}

/**
 * Les originaux de sources/ : `{ nom, fichier }`, triés ; un nom invalide ou en
 * double (x.jpg et x.png) arrête tout plutôt que de choisir en silence.
 * @param {string} dossier
 */
export async function listerSources(dossier = DOSSIER_SOURCES) {
  if (!existsSync(dossier)) return [];
  const fichiers = (await fs.readdir(dossier)).filter((f) => EXTENSIONS_SOURCES.includes(path.extname(f).toLowerCase())).sort();
  const vus = new Map();
  for (const f of fichiers) {
    const nom = path.basename(f, path.extname(f));
    if (!MOTIF_NOM.test(nom)) throw new Error(`Nom d'image refusé : « ${f} » (minuscules, chiffres et tirets seulement).`);
    if (vus.has(nom)) throw new Error(`Deux originaux pour « ${nom} » : ${vus.get(nom)} et ${f}.`);
    vus.set(nom, f);
  }
  return [...vus.entries()].map(([nom, fichier]) => ({ nom, fichier: path.join(dossier, fichier) }));
}

const ko = (octets) => `${Math.round(octets / 1024)} Ko`;

/**
 * La préparation (ce que fait `npm run images`), dossiers en paramètre pour
 * les tests. Pour chaque original : les sorties planifiées ; une sortie absente
 * est produite ; si l'empreinte de l'original n'est plus celle du manifeste
 * (remplacé sous le même nom, ou manifeste d'avant les empreintes), TOUTES ses
 * sorties sont refaites ; `tout` refait tout. Les sorties qu'aucun original ne
 * demande plus sont retirées ; le manifeste n'est réécrit que s'il change.
 * @param {{ sources?: string; prep?: string; manifeste?: string; tout?: boolean; journal?: (ligne: string) => void }} [options]
 * @returns {Promise<{ produits: number; gardes: number; refaites: string[]; retirees: string[]; manifesteReecrit: boolean }>}
 */
export async function preparerImages({ sources = DOSSIER_SOURCES, prep = DOSSIER_PREP, manifeste: fichierManifeste = FICHIER_MANIFESTE, tout = false, journal = console.log } = {}) {
  const sharp = (await import("sharp")).default;
  await fs.mkdir(prep, { recursive: true });
  const ancien = existsSync(fichierManifeste) ? (await fs.readFile(fichierManifeste, "utf8")).split("\r\n").join("\n") : "";
  const empreintesAvant = lireEmpreintes(ancien);
  const nomsAvant = new Set([...ancien.matchAll(/^\s*"([a-z0-9-]+)":/gm)].map((m) => m[1]));

  /** @type {Record<string, { largeur: number; hauteur: number; largeurs: number[]; empreinte: string }>} */
  const manifeste = {};
  const attendus = new Set();
  /** @type {{ produits: number; gardes: number; refaites: string[]; retirees: string[]; manifesteReecrit: boolean }} */
  const bilan = { produits: 0, gardes: 0, refaites: [], retirees: [], manifesteReecrit: false };

  for (const { nom, fichier } of await listerSources(sources)) {
    // Les octets lus une fois : l'empreinte est celle de l'image encodée, pas d'une copie relue ensuite.
    const original = await fs.readFile(fichier);
    const empreinte = empreinteOriginal(original);
    const connue = empreintesAvant.get(nom);
    // Original remplacé sous le même nom (ou manifeste d'avant les empreintes) : ses sorties existantes sont périmées.
    const perimees = connue !== empreinte;
    if (perimees && nomsAvant.has(nom)) bilan.refaites.push(nom);
    const meta = await sharp(original).metadata();
    const tourne = (meta.orientation ?? 1) >= 5; // orientation EXIF : largeur et hauteur échangées
    const largeur = (tourne ? meta.height : meta.width) ?? 0;
    const hauteur = (tourne ? meta.width : meta.height) ?? 0;
    const sorties = planifierSorties(largeur, hauteur);
    manifeste[nom] = { largeur, hauteur, largeurs: sorties.map((s) => s.largeur), empreinte };
    const tailles = [];
    for (const { largeur: l } of sorties) {
      for (const format of FORMATS) {
        const sortie = path.join(prep, nomSortie(nom, l, format));
        attendus.add(path.basename(sortie));
        if (!tout && !perimees && existsSync(sortie)) {
          bilan.gardes++;
          continue;
        }
        const base = sharp(original).rotate().resize({ width: l, withoutEnlargement: true }).flatten({ background: FOND });
        const encodee = format === "avif" ? base.avif({ quality: QUALITES.avif }) : format === "webp" ? base.webp({ quality: QUALITES.webp }) : base.jpeg({ quality: QUALITES.jpg, mozjpeg: true });
        const octets = await encodee.toBuffer();
        await fs.writeFile(sortie, octets);
        tailles.push(`${l}.${format} ${ko(octets.length)}`);
        bilan.produits++;
      }
    }
    const raison = !bilan.refaites.includes(nom) ? "" : connue ? " [original changé : sorties refaites]" : " [sans empreinte au manifeste : sorties refaites]";
    journal(`${nom} (${largeur} × ${hauteur})${raison} : ${tailles.length > 0 ? tailles.join(", ") : "déjà prête"}`);
  }

  // Les sorties qu'aucune source ne demande plus (original retiré, renommé, ou redimensionné) : retirées.
  for (const f of await fs.readdir(prep)) {
    if (!attendus.has(f)) {
      await fs.rm(path.join(prep, f));
      bilan.retirees.push(f);
      journal(`retirée (plus de source) : prep/${f}`);
    }
  }

  const texte = texteManifeste(manifeste);
  if (ancien !== texte) {
    await fs.writeFile(fichierManifeste, texte, "utf8");
    bilan.manifesteReecrit = true;
    journal(`manifeste réécrit : ${path.relative(RACINE, fichierManifeste)} (${Object.keys(manifeste).length} image(s))`);
  } else journal("manifeste inchangé");
  journal(`${bilan.produits} fichier(s) produit(s), ${bilan.gardes} déjà là${bilan.refaites.length > 0 ? ` ; repréparés (original changé ou empreinte absente) : ${bilan.refaites.join(", ")}` : ""}.`);
  return bilan;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  preparerImages({ tout: process.argv.includes("--tout") }).catch((erreur) => {
    console.error(erreur instanceof Error ? erreur.message : erreur);
    process.exit(1);
  });
}
