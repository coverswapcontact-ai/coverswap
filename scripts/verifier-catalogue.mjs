#!/usr/bin/env node
/**
 * Vérifie l'image de chaque référence du catalogue (src/data/revetements.json).
 *
 * Cover Styl' renomme parfois ses fichiers (le suffixe change quand une image
 * est redéposée) : l'ancienne adresse répond alors 404 et la carte reste vide.
 *
 *   node scripts/verifier-catalogue.mjs            liste les images en échec (code de sortie 1 s'il y en a)
 *   node scripts/verifier-catalogue.mjs --reparer  retrouve la nouvelle adresse sur la fiche produit
 *                                                  de coverstyl.com et corrige le fichier de données
 *
 * La réparation ne garde que l'échantillon (première image de la galerie,
 * 595 px de large), jamais la photo d'ambiance, et revérifie l'adresse trouvée.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const FICHIER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "revetements.json");
const HOTE = "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/";
const COLLECTIONS = { bois: "wood", pierre: "stone", beton: "concrete", couleur: "color", metal: "metal", textile: "textile", paillettes: "glitter" };
const AGENT = { "User-Agent": "Mozilla/5.0 (verification du catalogue coverswap.fr)" };
const reparer = process.argv.includes("--reparer");

async function imageValide(url) {
  try {
    const rep = await fetch(url, { headers: AGENT, signal: AbortSignal.timeout(25000) });
    if (!rep.ok) return `HTTP ${rep.status}`;
    const octets = new Uint8Array(await rep.arrayBuffer());
    if (octets.length < 1500) return `fichier trop petit (${octets.length} o)`;
    const jpeg = octets[0] === 0xff && octets[1] === 0xd8;
    const png = octets[0] === 0x89 && octets[1] === 0x50;
    const webp = octets[0] === 0x52 && octets[8] === 0x57;
    return jpeg || png || webp ? null : "contenu qui n'est pas une image";
  } catch (e) {
    return e?.name === "TimeoutError" ? "délai dépassé" : String(e?.message ?? e).slice(0, 80);
  }
}

/** Cherche l'échantillon sur la fiche produit : première image de la galerie, celle de 595 px de large. */
async function retrouver(ref) {
  const id = ref.id.toLowerCase();
  const essais = [COLLECTIONS[ref.famille], ...Object.values(COLLECTIONS)].filter((c, i, t) => c && t.indexOf(c) === i);
  for (const collection of essais) {
    let html;
    try {
      const rep = await fetch(`https://coverstyl.com/fr/collection/${collection}/${id}/`, { headers: AGENT, signal: AbortSignal.timeout(25000) });
      if (!rep.ok) continue;
      html = await rep.text();
    } catch {
      continue;
    }
    const echantillon = new RegExp(`"width":595,"height":\\d+,[^}]*?"url":"(${HOTE.replaceAll(".", "\\.")}${id}_[a-z0-9]+\\.(?:jpg|jpeg|png|webp))"`, "i").exec(html);
    const galerie = new RegExp(`gallery_active[^>]*><img src="https://cms\\.coverstyl\\.com/img-optim/cover-styl/web/(${id}_[a-z0-9]+\\.(?:jpg|jpeg|png|webp))`, "i").exec(html);
    const url = echantillon?.[1] ?? (galerie ? HOTE + galerie[1] : null);
    if (url && !(await imageValide(url))) return url;
  }
  return null;
}

async function parLots(liste, taille, fn) {
  const sorties = [];
  for (let i = 0; i < liste.length; i += taille) sorties.push(...(await Promise.all(liste.slice(i, i + taille).map(fn))));
  return sorties;
}

const refs = JSON.parse(readFileSync(FICHIER, "utf8"));
const etats = await parLots(refs, 12, async (ref) => ({ ref, erreur: ref.image ? await imageValide(ref.image) : "pas d'adresse" }));
const enEchec = etats.filter((e) => e.erreur);
console.log(`${refs.length} références vérifiées, ${enEchec.length} image(s) en échec.`);

let restantes = 0;
for (const { ref, erreur } of enEchec) {
  if (!reparer) {
    console.log(`  ${ref.id} · ${ref.nom} · ${erreur} · ${ref.image}`);
    restantes++;
    continue;
  }
  const nouvelle = await retrouver(ref);
  if (nouvelle) {
    console.log(`  ${ref.id} · ${ref.nom} · réparée → ${nouvelle}`);
    ref.image = nouvelle;
  } else {
    console.log(`  ${ref.id} · ${ref.nom} · ${erreur} · introuvable chez Cover Styl' : à retirer du catalogue ou à remplacer à la main`);
    restantes++;
  }
}
if (reparer && enEchec.length > restantes) writeFileSync(FICHIER, JSON.stringify(refs, null, 2) + "\n", "utf8");
process.exit(restantes > 0 ? 1 : 0);
