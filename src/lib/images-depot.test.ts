import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { FORMATS, empreinteOriginal, listerSources, nomSortie, planifierSorties } from "../../scripts/preparer-images.mjs";
import { MANIFESTE_IMAGES } from "./images-manifeste";

/**
 * Mission 16 (partie 2) — les images du dépôt, telles qu'elles sont commitées :
 *  - chaque original de `public/images/sources/` est au manifeste, avec ses trois formats à chaque largeur dans
 *    `public/images/prep/`, et rien d'autre n'y traîne (un original ajouté sans `npm run images` fait échouer ici) ;
 *  - l'empreinte au manifeste est celle de l'original (un original remplacé sous le même nom sans `npm run images`
 *    fait échouer ici : ses sorties seraient les anciennes) ;
 *  - les fonds Unsplash gardés sont ceux que le code sert encore (aucune paire orpheline, aucune paire incomplète) ;
 *  - la vidéo de l'ancienne ouverture et les images à la racine du dépôt ne reviennent pas.
 */

const RACINE = process.cwd();
const PUBLIC = path.join(RACINE, "public");
const PREP = path.join(PUBLIC, "images", "prep");
const FONDS = path.join(PUBLIC, "images", "fonds");

function fichiers(dossier: string, extensions: RegExp): string[] {
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dossier, e.name);
    return e.isDirectory() ? fichiers(p, extensions) : extensions.test(e.name) ? [p] : [];
  });
}

describe("sources → prep → manifeste", () => {
  test("chaque original est au manifeste, et chaque entrée du manifeste a son original", async () => {
    const sources = (await listerSources()).map((s) => s.nom).sort();
    assert.deepEqual(Object.keys(MANIFESTE_IMAGES).sort(), sources);
  });

  test("chaque entrée porte l'empreinte de son original : aucun original remplacé sans être repréparé", async () => {
    for (const { nom, fichier } of await listerSources()) {
      assert.equal(MANIFESTE_IMAGES[nom]?.empreinte, empreinteOriginal(readFileSync(fichier)), `${nom} : original changé depuis la préparation, lancer npm run images`);
    }
  });

  test("chaque entrée : les largeurs planifiées pour ses dimensions, les trois formats de chacune sur le disque", () => {
    for (const [nom, e] of Object.entries(MANIFESTE_IMAGES)) {
      assert.deepEqual(e.largeurs, planifierSorties(e.largeur, e.hauteur).map((s) => s.largeur), nom);
      for (const l of e.largeurs) for (const f of FORMATS) assert.ok(existsSync(path.join(PREP, nomSortie(nom, l, f))), `prep/${nomSortie(nom, l, f)} manque`);
    }
  });

  test("prep/ ne contient que les sorties du manifeste, aucune vide", () => {
    const attendus = new Set(Object.entries(MANIFESTE_IMAGES).flatMap(([nom, e]) => e.largeurs.flatMap((l) => FORMATS.map((f) => nomSortie(nom, l, f)))));
    const presents = existsSync(PREP) ? readdirSync(PREP) : [];
    assert.deepEqual(presents.filter((f) => !attendus.has(f)), []);
    for (const f of presents) assert.ok(statSync(path.join(PREP, f)).size > 0, f);
  });
});

describe("les fonds Unsplash gardés", () => {
  const references = () => {
    const code = [...fichiers(path.join(RACINE, "src"), /\.(tsx?|json|mjs)$/), ...fichiers(path.join(RACINE, "scripts"), /\.(m?js|ts)$/)].map((f) => readFileSync(f, "utf8")).join("\n");
    return new Set([...code.matchAll(/photo-(\d+-[0-9a-f]+)/g)].map((m) => m[1]));
  };

  test("aucune paire orpheline : chaque fond du dossier est encore servi par le code", () => {
    const servis = references();
    const presents = [...new Set(readdirSync(FONDS).map((f) => f.match(/^photo-(\d+-[0-9a-f]+)-(?:800|1600)\.jpg$/)?.[1] ?? f))];
    assert.deepEqual(presents.filter((id) => !servis.has(id)), []);
  });

  test("chaque fond cité par le code a ses deux largeurs (800 et 1600)", () => {
    const cites = [...readFileSync(path.join(RACINE, "src", "data", "blog-articles.ts"), "utf8").matchAll(/\/images\/fonds\/photo-(\d+-[0-9a-f]+)/g), ...readFileSync(path.join(RACINE, "src", "data", "prestations.ts"), "utf8").matchAll(/\/images\/fonds\/photo-(\d+-[0-9a-f]+)/g)].map((m) => m[1]);
    assert.ok(cites.length > 0);
    for (const id of cites) for (const l of [800, 1600]) assert.ok(existsSync(path.join(FONDS, `photo-${id}-${l}.jpg`)), `photo-${id}-${l}.jpg manque`);
  });
});

describe("ce qui ne revient pas", () => {
  test("plus de vidéo d'ouverture (remplacée par une image et le curseur avant / après)", () => {
    assert.equal(existsSync(path.join(PUBLIC, "videos")), false);
    assert.deepEqual(fichiers(PUBLIC, /\.(mp4|webm|mov)$/i), []);
  });

  test("aucune image à la racine du dépôt : les originaux vivent dans public/images/sources/", () => {
    assert.deepEqual(readdirSync(RACINE).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)), []);
  });
});
