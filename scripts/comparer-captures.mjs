#!/usr/bin/env node
/**
 * Compare les captures d'écran de cette exécution à celles de la dernière exécution réussie sur `main` (mission 16,
 * partie 6) : pour chaque `<page>-<largeur>.jpg` (ou `.png`, le format d'avant le site 3.0) présente des deux côtés,
 * `pixelmatch` compte les pixels changés et écrit `diff-<page>-<largeur>.png` (en rouge : ce qui a changé) à côté des
 * nouvelles captures ; une page qui a changé de hauteur est comparée sur le plus grand cadre (la bande en plus compte
 * comme changée). Le résumé (pourcentage par page et par largeur) va dans le résumé du job GitHub
 * (`$GITHUB_STEP_SUMMARY`), sinon à l'écran.
 *
 *   node scripts/comparer-captures.mjs [captures-precedentes] [captures]
 *
 * INFORMATION SEULEMENT : le script finit toujours avec le code 0 (une capture qui change n'est pas une erreur ; c'est
 * Lighthouse qui fait échouer le job). Décodage des captures et encodage des différences par sharp (déjà une dépendance du site).
 */
import { appendFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Une capture : `<page>-<largeur>.jpg` (ou `.png`) ; les images de différence (`diff-…`) ne se comparent pas. */
export function lireNomCapture(fichier) {
  if (fichier.startsWith("diff-")) return null;
  const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)-(\d{3,4})\.(?:jpg|png)$/.exec(fichier);
  return m ? { page: m[1], largeur: Number(m[2]) } : null;
}

async function lireCaptures(dossier) {
  try {
    return (await readdir(dossier)).filter((f) => lireNomCapture(f) !== null).sort();
  } catch {
    return [];
  }
}

/** Les pixels RGBA d'une capture (JPEG ou PNG), étendus à `largeur` × `hauteur` (fond magenta : une bande ajoutée se voit et compte). */
async function pixels(sharp, fichier, largeur, hauteur) {
  const image = sharp(fichier).ensureAlpha();
  const { width, height } = await sharp(fichier).metadata();
  const etendue = width < largeur || height < hauteur ? image.extend({ right: largeur - width, bottom: hauteur - height, background: { r: 255, g: 0, b: 255, alpha: 1 } }) : image;
  return etendue.raw().toBuffer();
}

/** Compare deux captures ; écrit l'image de différence ; rend le compte et le pourcentage de pixels changés. */
export async function comparerDeux(fichierAvant, fichierApres, fichierDiff) {
  const { default: sharp } = await import("sharp");
  const { default: pixelmatch } = await import("pixelmatch");
  const [avant, apres] = await Promise.all([sharp(fichierAvant).metadata(), sharp(fichierApres).metadata()]);
  const largeur = Math.max(avant.width, apres.width);
  const hauteur = Math.max(avant.height, apres.height);
  const [a, b] = await Promise.all([pixels(sharp, fichierAvant, largeur, hauteur), pixels(sharp, fichierApres, largeur, hauteur)]);
  const diff = Buffer.alloc(largeur * hauteur * 4);
  const changes = pixelmatch(a, b, diff, largeur, hauteur, { threshold: 0.1 });
  await sharp(diff, { raw: { width: largeur, height: hauteur, channels: 4 } }).png().toFile(fichierDiff);
  const total = largeur * hauteur;
  return { changes, total, pourcent: total > 0 ? Math.round((changes / total) * 10_000) / 100 : 0, avant: `${avant.width}×${avant.height}`, apres: `${apres.width}×${apres.height}` };
}

/** Compare tout ce qui se compare ; rend les lignes du résumé (et les captures nouvelles ou disparues). */
export async function comparerCaptures({ avant = "captures-precedentes", apres = "captures" } = {}) {
  const [anciennes, nouvelles] = await Promise.all([lireCaptures(avant), lireCaptures(apres)]);
  const lignes = [];
  for (const fichier of nouvelles.filter((f) => anciennes.includes(f))) {
    const { page, largeur } = lireNomCapture(fichier);
    try {
      lignes.push({ page, largeur, ...(await comparerDeux(path.join(avant, fichier), path.join(apres, fichier), path.join(apres, `diff-${fichier.replace(/\.jpg$/, ".png")}`))) });
    } catch (erreur) {
      lignes.push({ page, largeur, erreur: erreur instanceof Error ? erreur.message : String(erreur) });
    }
  }
  return { reference: anciennes.length > 0, lignes, nouvelles: nouvelles.filter((f) => !anciennes.includes(f)), disparues: anciennes.filter((f) => !nouvelles.includes(f)) };
}

const pourcentFr = (n) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Le résumé en Markdown (résumé du job GitHub). */
export function resumeMarkdown({ reference, lignes, nouvelles, disparues }) {
  const titre = "### Captures 390 / 768 / 1440 : comparaison avec la dernière exécution réussie sur main";
  if (!reference) return `${titre}\n\nAucune capture de référence (première exécution, ou aucune exécution réussie sur main) : rien à comparer. Les captures de cette exécution sont dans l'artefact « captures ».\n`;
  const tableau = [
    "| Page | Largeur | Pixels changés | Taille (avant → après) |",
    "|---|---|---|---|",
    ...lignes.map((l) => (l.erreur ? `| ${l.page} | ${l.largeur} | comparaison impossible : ${l.erreur} | — |` : `| ${l.page} | ${l.largeur} | ${l.changes === 0 ? "aucun" : pourcentFr(l.pourcent)} | ${l.avant === l.apres ? l.apres : `${l.avant} → ${l.apres}`} |`)),
  ];
  const extras = [nouvelles.length ? `Nouvelles : ${nouvelles.join(", ")}.` : "", disparues.length ? `Disparues : ${disparues.join(", ")}.` : ""].filter(Boolean);
  return `${titre}\n\n${tableau.join("\n")}\n\n${extras.length ? `${extras.join(" ")}\n\n` : ""}Les images \`diff-<page>-<largeur>.png\` (en rouge : ce qui a changé) sont dans l'artefact « captures ». Information seulement : la comparaison ne fait jamais échouer le job.\n`;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const [avant = "captures-precedentes", apres = "captures"] = process.argv.slice(2);
  comparerCaptures({ avant, apres })
    .then((resultat) => resumeMarkdown(resultat))
    .catch((erreur) => `### Captures : comparaison impossible\n\n${erreur instanceof Error ? erreur.message : String(erreur)}\n`)
    .then(async (texte) => {
      if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, texte, "utf8");
      console.log(texte);
    })
    .finally(() => process.exit(0));
}
