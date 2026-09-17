/**
 * Rapatrie les photos de fond (Unsplash) en fichiers locaux déjà dimensionnés :
 *   public/images/fonds/<id>-1600.jpg  (écrans larges)
 *   public/images/fonds/<id>-800.jpg   (mobile)
 * puis remplace les URL Unsplash du code par `/images/fonds/<id>`.
 *
 * Pourquoi : le site sert ses images sans l'optimiseur Vercel (quota du plan
 * Hobby épuisé → HTTP 402, catalogue vide). Les fichiers sont donc produits ici,
 * une fois, et servis tels quels.
 *
 * Usage : node scripts/importer-fonds.mjs
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(RACINE, "src");
const DEST = path.join(RACINE, "public", "images", "fonds");
const TAILLES = [
  { largeur: 1600, qualite: 72 },
  { largeur: 800, qualite: 70 },
];

async function fichiers(dossier) {
  const entrees = await fs.readdir(dossier, { withFileTypes: true });
  const resultat = [];
  for (const e of entrees) {
    const p = path.join(dossier, e.name);
    if (e.isDirectory()) resultat.push(...(await fichiers(p)));
    else if (/\.(tsx?|json)$/.test(e.name)) resultat.push(p);
  }
  return resultat;
}

const MOTIF = /https:\/\/images\.unsplash\.com\/(photo-[0-9a-f-]+)\?[^"'`\s]*/g;

async function main() {
  await fs.mkdir(DEST, { recursive: true });
  const liste = await fichiers(SRC);
  const ids = new Set();
  const contenus = new Map();
  for (const f of liste) {
    const t = await fs.readFile(f, "utf-8");
    let m;
    let trouve = false;
    while ((m = MOTIF.exec(t))) {
      ids.add(m[1]);
      trouve = true;
    }
    if (trouve) contenus.set(f, t);
  }
  console.log(`${ids.size} photo(s) Unsplash distincte(s) dans ${contenus.size} fichier(s)`);

  for (const id of ids) {
    const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=85&fm=jpg`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${id} : HTTP ${res.status}`);
    const original = Buffer.from(await res.arrayBuffer());
    for (const { largeur, qualite } of TAILLES) {
      const sortie = path.join(DEST, `${id}-${largeur}.jpg`);
      const buf = await sharp(original).resize({ width: largeur, withoutEnlargement: true }).jpeg({ quality: qualite, mozjpeg: true }).toBuffer();
      await fs.writeFile(sortie, buf);
      console.log(`  ${path.basename(sortie)} ${(buf.length / 1024).toFixed(0)} Ko`);
    }
  }

  for (const [f, t] of contenus) {
    const nouveau = t.replace(MOTIF, (_, id) => `/images/fonds/${id}`);
    await fs.writeFile(f, nouveau, "utf-8");
    console.log(`réécrit : ${path.relative(RACINE, f)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
