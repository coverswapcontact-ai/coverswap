#!/usr/bin/env node
/**
 * Mesure la couleur moyenne de chaque échantillon du catalogue et l'écrit dans
 * src/data/revetements.json (champ `hex`, ex. "#C9B28F"). Mission 15 (partie 2) :
 * le CRM lit ce `hex` par /api/catalogue pour décrire la teinte au modèle
 * d'image (« light warm beige (about #C9B28F) ») sans avoir à retélécharger
 * l'échantillon ; il le mesure lui-même quand il manque.
 *
 *   node scripts/mesurer-couleurs.mjs             mesure les références sans `hex` (497 images au premier passage)
 *   node scripts/mesurer-couleurs.mjs --tout      remesure tout
 *
 * Même mesure que le CRM (crm/src/lib/simulateur/couleur.ts) : image réduite à
 * 48 × 48 (cover), moyenne des pixels. Sans effet sur le site lui-même
 * (`images.unoptimized`) : rien n'est produit dans public/. Aucun coût : les
 * images sont celles du catalogue, servies par le stockage de Cover Styl'.
 * scripts/verifier-catalogue.mjs --reparer conserve le champ.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const FICHIER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "revetements.json");
const AGENT = { "User-Agent": "Mozilla/5.0 (mesure des couleurs coverswap.fr)" };
const tout = process.argv.includes("--tout");
const HEX_VALIDE = /^#[0-9A-F]{6}$/;

const hex2 = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0").toUpperCase();

async function mesurer(url) {
  const reponse = await fetch(url, { headers: AGENT, signal: AbortSignal.timeout(25_000) });
  if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
  const octets = Buffer.from(await reponse.arrayBuffer());
  const { data, info } = await sharp(octets).rotate().resize(48, 48, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = info.width * info.height;
  let [r, g, b] = [0, 0, 0];
  for (let i = 0; i < pixels; i++) {
    r += data[i * 3];
    g += data[i * 3 + 1];
    b += data[i * 3 + 2];
  }
  return `#${hex2(r / pixels)}${hex2(g / pixels)}${hex2(b / pixels)}`;
}

async function parLots(liste, taille, fn) {
  const sorties = [];
  for (let i = 0; i < liste.length; i += taille) sorties.push(...(await Promise.all(liste.slice(i, i + taille).map(fn))));
  return sorties;
}

const refs = JSON.parse(readFileSync(FICHIER, "utf8"));
const aMesurer = refs.filter((r) => r.image && (tout || !HEX_VALIDE.test(r.hex ?? "")));
console.log(`${refs.length} références, ${aMesurer.length} à mesurer${tout ? " (tout)" : ""}.`);

let mesurees = 0;
let echecs = 0;
await parLots(aMesurer, 8, async (ref) => {
  try {
    ref.hex = await mesurer(ref.image);
    mesurees++;
  } catch (e) {
    echecs++;
    console.log(`  ${ref.id} · ${ref.nom} · non mesurée : ${String(e?.message ?? e).slice(0, 80)}`);
  }
});
if (mesurees > 0) writeFileSync(FICHIER, JSON.stringify(refs, null, 2) + "\n", "utf8");
console.log(`${mesurees} couleur(s) écrite(s), ${echecs} échec(s).`);
process.exit(echecs > 0 ? 1 : 0);
