/**
 * Prépare les pictogrammes du site (mission 19), en local, sans coût :
 *   public/images/pictos/sources/<nom>.png   (les originaux détourés, 512 × 512, fond transparent, commités)
 *   → public/images/pictos/<nom>-<128|256>.<avif|webp>
 *
 * Les pictos (familles de projet, formes de cuisine) remplacent les dessins de `DessinFamille` et `PlanCuisine`
 * (`src/components/espace/Illustrations.tsx`) : affichés à 64 px au moins, donc deux tailles (1x et 2x de 128 px au
 * plus). La transparence est gardée (AVIF et WebP la portent ; pas de JPEG ici). Les originaux viennent des essais
 * retenus de `crm-coverswap/scripts/generer-ambiances.ts` (GPT Image 2.5, fond transparent), détourés de leurs
 * marges vides puis posés au centre d'un carré.
 *
 * Idempotent : ne refait que les sorties absentes ou plus anciennes que leur original (`--tout` refait tout).
 * Usage : npm run pictos
 */
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DOSSIER_PICTOS = path.join(RACINE, "public", "images", "pictos");
export const DOSSIER_SOURCES_PICTOS = path.join(DOSSIER_PICTOS, "sources");
export const TAILLES_PICTOS = [128, 256];

async function principal() {
  const sharp = (await import("sharp")).default;
  const tout = process.argv.includes("--tout");
  const sources = (await fs.readdir(DOSSIER_SOURCES_PICTOS)).filter((f) => f.endsWith(".png")).sort();
  let faits = 0;
  for (const fichier of sources) {
    const nom = path.basename(fichier, ".png");
    const original = path.join(DOSSIER_SOURCES_PICTOS, fichier);
    const date = (await fs.stat(original)).mtimeMs;
    for (const taille of TAILLES_PICTOS) {
      for (const [ext, options] of [
        ["avif", { quality: 60, effort: 6 }],
        ["webp", { quality: 82, alphaQuality: 90, effort: 6 }],
      ]) {
        const sortie = path.join(DOSSIER_PICTOS, `${nom}-${taille}.${ext}`);
        if (!tout && existsSync(sortie) && (await fs.stat(sortie)).mtimeMs >= date) continue;
        await sharp(original).resize(taille, taille, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })[ext](options).toFile(sortie);
        faits += 1;
      }
    }
    console.log(`${nom} : ${TAILLES_PICTOS.map((t) => `${t} px`).join(", ")}`);
  }
  console.log(`${faits} fichier(s) produit(s).`);
}

principal().catch((erreur) => {
  console.error(erreur);
  process.exitCode = 1;
});
