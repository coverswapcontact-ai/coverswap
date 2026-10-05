import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import { FORMATS, LARGEURS, empreinteOriginal, lireEmpreintes, nomSortie, planifierSorties, preparerImages, texteManifeste } from "../../scripts/preparer-images.mjs";
import { MANIFESTE_IMAGES } from "./images-manifeste";
import { DOSSIER_IMAGES, imagePreparee, sourcesPhoto, type ManifesteImages } from "./images-preparees";

/**
 * Mission 16 — le manifeste des images préparées : AVIF + WebP + JPEG et les dimensions réservées (partie 1), les
 * sorties planifiées par `scripts/preparer-images.mjs` et le manifeste généré, trié et stable (partie 2), et la
 * préparation elle-même (dans un dossier temporaire) : un original remplacé sous le même nom est repréparé.
 */

const ESSAI: ManifesteImages = {
  "ouverture-essai": { largeur: 2400, hauteur: 1600, largeurs: [480, 960, 1600] },
  "petite-essai": { largeur: 700, hauteur: 500, largeurs: [480] },
};

describe("sourcesPhoto", () => {
  test("un nom inconnu (ou un nom hérité d'Object) rend null", () => {
    assert.equal(sourcesPhoto("inconnue", ESSAI), null);
    assert.equal(sourcesPhoto("toString", ESSAI), null);
    assert.equal(sourcesPhoto("inconnue"), null);
    assert.equal(imagePreparee("toString"), false);
  });

  test("une entrée du manifeste rend le triplet avif / webp / jpg et ses dimensions", () => {
    const s = sourcesPhoto("ouverture-essai", ESSAI);
    assert.ok(s);
    assert.equal(s.avif, `${DOSSIER_IMAGES}/ouverture-essai-480.avif 480w, ${DOSSIER_IMAGES}/ouverture-essai-960.avif 960w, ${DOSSIER_IMAGES}/ouverture-essai-1600.avif 1600w`);
    assert.equal(s.webp, `${DOSSIER_IMAGES}/ouverture-essai-480.webp 480w, ${DOSSIER_IMAGES}/ouverture-essai-960.webp 960w, ${DOSSIER_IMAGES}/ouverture-essai-1600.webp 1600w`);
    assert.equal(s.jpg, `${DOSSIER_IMAGES}/ouverture-essai-480.jpg 480w, ${DOSSIER_IMAGES}/ouverture-essai-960.jpg 960w, ${DOSSIER_IMAGES}/ouverture-essai-1600.jpg 1600w`);
    assert.equal(s.src, `${DOSSIER_IMAGES}/ouverture-essai-960.jpg`);
    assert.equal(s.largeur, 2400);
    assert.equal(s.hauteur, 1600);
    assert.equal(imagePreparee("ouverture-essai", ESSAI), true);
  });

  test("une image plus petite que 960 : le src est sa seule largeur", () => {
    const s = sourcesPhoto("petite-essai", ESSAI);
    assert.ok(s);
    assert.equal(s.src, `${DOSSIER_IMAGES}/petite-essai-480.jpg`);
    assert.equal(s.avif, `${DOSSIER_IMAGES}/petite-essai-480.avif 480w`);
  });

  test("le manifeste du dépôt ne décrit que des largeurs croissantes, jamais au-delà de l'origine", () => {
    for (const [nom, e] of Object.entries(MANIFESTE_IMAGES)) {
      assert.deepEqual([...e.largeurs].sort((a, b) => a - b), e.largeurs, nom);
      assert.ok(e.largeurs.every((l) => l <= e.largeur), nom);
    }
  });
});

describe("planifierSorties (scripts/preparer-images.mjs)", () => {
  const largeurs = (l: number, h: number) => planifierSorties(l, h).map((s) => s.largeur);

  test("les largeurs visées sont 480, 960, 1600", () => {
    assert.deepEqual(LARGEURS, [480, 960, 1600]);
  });

  test("une grande image : 480, 960, 1600, au même rapport", () => {
    assert.deepEqual(planifierSorties(2400, 1600), [
      { largeur: 480, hauteur: 320 },
      { largeur: 960, hauteur: 640 },
      { largeur: 1600, hauteur: 1067 },
    ]);
  });

  test("jamais agrandie : chaque largeur plafonnée à l'origine, sans doublon, croissante", () => {
    assert.deepEqual(largeurs(1536, 1024), [480, 960, 1536]); // ambiance paysage de gpt-image-1
    assert.deepEqual(largeurs(1024, 1024), [480, 960, 1024]); // ambiance carrée
    assert.deepEqual(largeurs(1024, 1536), [480, 960, 1024]); // ambiance portrait
    assert.deepEqual(largeurs(1600, 900), [480, 960, 1600]);
    assert.deepEqual(largeurs(960, 640), [480, 960]);
    assert.deepEqual(largeurs(700, 500), [480, 700]);
    assert.deepEqual(largeurs(300, 200), [300]);
    for (const [l, h] of [[5000, 3000], [1536, 1024], [961, 400], [480, 480], [100, 900]]) {
      const sorties = planifierSorties(l, h);
      assert.ok(sorties.every((s) => s.largeur <= l && s.hauteur <= h), `${l} × ${h}`);
      assert.deepEqual(sorties.map((s) => s.largeur), [...new Set(sorties.map((s) => s.largeur))].sort((a, b) => a - b), `${l} × ${h}`);
    }
  });

  test("des dimensions invalides sont refusées", () => {
    assert.throws(() => planifierSorties(0, 100));
    assert.throws(() => planifierSorties(100, -1));
    assert.throws(() => planifierSorties(10.5, 10));
    assert.throws(() => planifierSorties(Number.NaN, 10));
  });
});

describe("le manifeste généré", () => {
  test("trié par nom, quel que soit l'ordre d'arrivée ; le même manifeste donne le même texte", () => {
    const a = texteManifeste({ "zeta-essai": { largeur: 700, hauteur: 500, largeurs: [700, 480] }, "alpha-essai": { largeur: 2400, hauteur: 1600, largeurs: [480, 960, 1600] } });
    const b = texteManifeste({ "alpha-essai": { largeur: 2400, hauteur: 1600, largeurs: [480, 960, 1600] }, "zeta-essai": { largeur: 700, hauteur: 500, largeurs: [480, 700] } });
    assert.equal(a, b);
    assert.ok(a.indexOf('"alpha-essai"') < a.indexOf('"zeta-essai"'));
    assert.match(a, /"zeta-essai": \{ largeur: 700, hauteur: 500, largeurs: \[480, 700\] \},/);
    assert.match(texteManifeste({}), /export const MANIFESTE_IMAGES: ManifesteImages = \{\};/);
  });

  test("en-tête « fichier généré, ne pas éditer » ; le fichier du dépôt est exactement ce que le script écrirait", () => {
    const fichier = readFileSync(path.join(process.cwd(), "src", "lib", "images-manifeste.ts"), "utf8").split("\r\n").join("\n");
    assert.match(fichier, /FICHIER GÉNÉRÉ par `scripts\/preparer-images\.mjs`.*ne pas éditer/);
    assert.equal(texteManifeste(MANIFESTE_IMAGES), fichier);
    const noms = Object.keys(MANIFESTE_IMAGES);
    assert.deepEqual(noms, [...noms].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0)));
  });

  test("série 2 (lot B4) : 1536 × 1024 ou 1024 × 1536, plafonnées à l'origine (jamais de 1600), chacune avec sa source servie", () => {
    const serie2 = (JSON.parse(readFileSync(path.join(process.cwd(), "scripts", "bibliotheque", "serie-2.json"), "utf8")) as { nom: string; serie: string }[]).filter((e) => e.serie !== "pictos");
    for (const { nom } of serie2) {
      const e = MANIFESTE_IMAGES[nom];
      assert.ok(e, nom);
      assert.deepEqual(e.largeurs, e.largeur > e.hauteur ? [480, 960, 1536] : [480, 960, 1024], nom);
      assert.ok(sourcesPhoto(nom)?.src.includes(`?v=${e.empreinte}`), nom);
    }
  });

  test("l'empreinte de l'original : écrite après les largeurs, relue telle quelle ; une entrée sans empreinte n'en a pas", () => {
    const texte = texteManifeste({ "alpha-essai": { largeur: 700, hauteur: 500, largeurs: [480, 700], empreinte: "0123456789ab" }, "zeta-essai": { largeur: 300, hauteur: 200, largeurs: [300] } });
    assert.match(texte, /"alpha-essai": \{ largeur: 700, hauteur: 500, largeurs: \[480, 700\], empreinte: "0123456789ab" \},/);
    assert.deepEqual([...lireEmpreintes(texte)], [["alpha-essai", "0123456789ab"]]);
    assert.deepEqual([...lireEmpreintes("")], []);
    assert.match(empreinteOriginal(Buffer.from("original")), /^[0-9a-f]{12}$/);
    assert.notEqual(empreinteOriginal(Buffer.from("original")), empreinteOriginal(Buffer.from("originaL")));
  });
});

describe("preparerImages : un original remplacé sous le même nom", () => {
  const sorties = (nom: string, largeurs: number[]) => largeurs.flatMap((l) => FORMATS.map((f) => nomSortie(nom, l, f))).sort();

  test("sorties refaites même à date de modification égale (copie par l'Explorateur), largeurs d'avant retirées ; sinon rien", async () => {
    const sharp = (await import("sharp")).default;
    const racine = mkdtempSync(path.join(tmpdir(), "coverswap-images-"));
    try {
      const sources = path.join(racine, "sources");
      const prep = path.join(racine, "prep");
      const manifeste = path.join(racine, "images-manifeste.ts");
      mkdirSync(sources);
      const original = path.join(sources, "essai-cuisine.png");
      const image = (l: number, h: number, fond: { r: number; g: number; b: number }) => sharp({ create: { width: l, height: h, channels: 3, background: fond } }).png().toBuffer();
      const journal: string[] = [];
      const lancer = () => preparerImages({ sources, prep, manifeste, journal: (ligne: string) => journal.push(ligne) });

      writeFileSync(original, await image(1200, 800, { r: 200, g: 30, b: 30 }));
      const date = statSync(original).mtime;
      const premier = await lancer();
      assert.deepEqual([premier.produits, premier.gardes, premier.refaites, premier.manifesteReecrit], [9, 0, [], true]);
      assert.deepEqual(readdirSync(prep).sort(), sorties("essai-cuisine", [480, 960, 1200]));
      const empreinteRouge = lireEmpreintes(readFileSync(manifeste, "utf8")).get("essai-cuisine");
      assert.equal(empreinteRouge, empreinteOriginal(readFileSync(original)));

      // Relancé tel quel : rien.
      const second = await lancer();
      assert.deepEqual([second.produits, second.gardes, second.refaites, second.manifesteReecrit], [0, 9, [], false]);

      // Remplacé sous le même nom, à la même date de modification : toutes les sorties refaites, la largeur d'avant retirée.
      writeFileSync(original, await image(1000, 1000, { r: 30, g: 30, b: 200 }));
      utimesSync(original, date, date);
      const troisieme = await lancer();
      assert.deepEqual([troisieme.produits, troisieme.gardes, troisieme.refaites, troisieme.manifesteReecrit], [9, 0, ["essai-cuisine"], true]);
      assert.deepEqual(readdirSync(prep).sort(), sorties("essai-cuisine", [480, 960, 1000]));
      assert.deepEqual(troisieme.retirees.sort(), sorties("essai-cuisine", [1200]));
      // Même largeur qu'avant (480) : c'est bien la nouvelle image (bleue), pas l'ancienne (rouge) gardée.
      for (const f of FORMATS) {
        const [r, , b] = (await sharp(path.join(prep, nomSortie("essai-cuisine", 480, f))).stats()).channels.map((c) => c.mean);
        assert.ok(b > r, `${f} : rouge ${r}, bleu ${b}`);
      }
      const texte = readFileSync(manifeste, "utf8");
      assert.match(texte, /"essai-cuisine": \{ largeur: 1000, hauteur: 1000, largeurs: \[480, 960, 1000\], empreinte: "[0-9a-f]{12}" \},/);
      assert.notEqual(lireEmpreintes(texte).get("essai-cuisine"), empreinteRouge);
      assert.ok(journal.some((l) => l.includes("original changé")));

      // Relancé : rien.
      const quatrieme = await lancer();
      assert.deepEqual([quatrieme.produits, quatrieme.refaites, quatrieme.manifesteReecrit], [0, [], false]);
    } finally {
      rmSync(racine, { recursive: true, force: true });
    }
  });

  test("un manifeste d'avant les empreintes : les sorties existantes sont refaites une fois, puis plus", async () => {
    const sharp = (await import("sharp")).default;
    const racine = mkdtempSync(path.join(tmpdir(), "coverswap-images-"));
    try {
      const sources = path.join(racine, "sources");
      const prep = path.join(racine, "prep");
      const manifeste = path.join(racine, "images-manifeste.ts");
      mkdirSync(sources);
      writeFileSync(path.join(sources, "essai-mur.jpg"), await sharp({ create: { width: 600, height: 400, channels: 3, background: { r: 90, g: 120, b: 60 } } }).jpeg().toBuffer());
      const lancer = () => preparerImages({ sources, prep, manifeste, journal: () => undefined });
      await lancer();
      writeFileSync(manifeste, texteManifeste({ "essai-mur": { largeur: 600, hauteur: 400, largeurs: [480, 600] } }));
      const refait = await lancer();
      assert.deepEqual([refait.produits, refait.gardes, refait.refaites], [6, 0, ["essai-mur"]]);
      assert.equal((await lancer()).produits, 0);
    } finally {
      rmSync(racine, { recursive: true, force: true });
    }
  });
});
