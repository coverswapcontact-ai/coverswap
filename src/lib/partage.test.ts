import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import sharp from "sharp";
import { PAIRE_COMPTOIR_PRO } from "@/app/pro/contenu";
import { PAIRES_REALISATIONS } from "@/app/realisations/paires";
import { cartesInspirations } from "@/app/inspirations/_components/ordre";
import { IMAGE_OUVERTURE } from "@/components/accueil/etudes";
import { AMBIANCES, PAIRES_SERIE_2 } from "@/data/ambiances";
import { articles } from "@/data/blog-articles";
import { CAS_PRESTATIONS } from "@/data/cas-prestations";
import { exemplesSimulateur } from "./exemples-simulateur";
import { ambiancesDeLaFiche } from "./fiches-matieres";
import { ambiancesDeFamille } from "./pages-familles";
import { DOSSIER_PARTAGE, ETIQUETTE_PARTAGE, IMAGE_PARTAGE, fichierPartage, imagePartage, pagesAvecPaire, paireDePartage, realisationPartagee } from "./partage";

/**
 * Site 3.0 (lot F2) — l'image de partage de chaque page (`lib/partage`, la seule source ; `docs/SEO.md`) : l'avant /
 * après que la page montre, composé et étiqueté (`scripts/og.mjs`), sinon l'image du site ; une réalisation publiée
 * la remplace. Les fichiers composés existent tous, en 1 200 × 630, et aucun ne traîne sans page.
 */

const RACINE = process.cwd();
const DOSSIER = join(RACINE, "public", ...DOSSIER_PARTAGE.split("/").filter(Boolean));
const lire = (chemin: string) => readFileSync(join(RACINE, chemin), "utf8");

describe("paireDePartage : l'avant / après que la page montre", () => {
  test("accueil, simulateur, réalisations, cuisine : la bordeaux brillante en Deep Green NF13 (l'ouverture de l'accueil)", () => {
    const attendue = { avant: IMAGE_OUVERTURE.avant, apres: IMAGE_OUVERTURE.apres };
    for (const chemin of ["/", "/simulateur", "/realisations", "/prestations/cuisine", "/realisations/"]) assert.deepEqual(paireDePartage(chemin), attendue, chemin);
    // Le premier exemple du simulateur est cet avant ; la première paire de /realisations est cet après.
    assert.equal(exemplesSimulateur()[0]?.avant.src.includes(IMAGE_OUVERTURE.avant), true);
    assert.equal(PAIRES_REALISATIONS[0].apres, IMAGE_OUVERTURE.apres);
  });

  test("salle de bain, meubles : leur ouverture ; /pro : le comptoir ; vitrages : aucune", () => {
    for (const slug of ["salle-de-bain", "meubles"] as const) {
      const { avant, apres } = CAS_PRESTATIONS[slug].ouverture;
      assert.deepEqual(paireDePartage(`/prestations/${slug}`), { avant, apres }, slug);
    }
    assert.deepEqual(paireDePartage("/pro"), { avant: PAIRE_COMPTOIR_PRO.avant, apres: PAIRE_COMPTOIR_PRO.apres });
    assert.equal(paireDePartage("/prestations/vitrages"), null);
  });

  test("/inspirations : la première carte de la page qui a un avant", () => {
    const premiere = cartesInspirations().map((c) => c.ambiance).find((a) => a.avant)!;
    assert.deepEqual(paireDePartage("/inspirations"), { avant: premiere.avant, apres: premiere.image });
  });

  test("une famille : la première de ses ambiances à avant ; une fiche : la première de « Vue dans » à avant ; un guide : sa paire", () => {
    const bois = ambiancesDeFamille("bois").find((a) => a.avant)!;
    assert.deepEqual(paireDePartage("/matieres/bois"), { avant: bois.avant, apres: bois.image });
    const nf13 = ambiancesDeLaFiche("NF13").find((v) => v.ambiance.avant)!.ambiance;
    assert.deepEqual(paireDePartage("/matieres/couleur/NF13"), { avant: nf13.avant, apres: nf13.image });
    // Une fiche sans ambiance, une famille sans ambiance à avant : l'image du site.
    assert.equal(paireDePartage("/matieres/couleur/A1"), null);
    assert.equal(paireDePartage("/matieres/paillettes"), null);
    assert.equal(paireDePartage("/matieres/inconnue"), null);
    const bordeaux = articles.find((a) => a.slug === "cuisine-bordeaux-brillante-renover-sans-changer")!;
    assert.deepEqual(paireDePartage(`/blog/${bordeaux.slug}`), { avant: "cuisine-bordeaux-brillante-avant", apres: bordeaux.paire });
    assert.equal(paireDePartage("/blog/entretenir-revetement-adhesif"), null, "un guide sans paire");
  });

  test("les pages sans avant / après gardent l'image du site", () => {
    for (const chemin of ["/comment-ca-marche", "/matieres", "/zones", "/zones/covering-lattes", "/contact", "/cgv", "/mentions-legales", "/politique-confidentialite"]) {
      assert.equal(paireDePartage(chemin), null, chemin);
      assert.deepEqual(imagePartage(chemin), IMAGE_PARTAGE, chemin);
    }
  });

  test("chaque paire est un vrai avant / après de la bibliothèque (même cadrage)", () => {
    const pages = pagesAvecPaire();
    assert.ok(pages.length >= 50, String(pages.length));
    for (const { chemin, paire } of pages) {
      const serie2 = PAIRES_SERIE_2.find((p) => p.avant === paire.avant);
      const serie1 = AMBIANCES.find((a) => a.image === paire.apres && a.avant === paire.avant);
      assert.ok(serie2?.apres.includes(paire.apres) || serie1, `${chemin} : ${paire.avant} → ${paire.apres}`);
    }
  });
});

describe("imagePartage : la seule source", () => {
  test("l'image composée de la page, son texte alternatif ; l'image du site sinon", () => {
    assert.deepEqual(imagePartage("/pro"), {
      url: `https://coverswap.fr${fichierPartage(PAIRE_COMPTOIR_PRO.apres)}`,
      largeur: 1200,
      hauteur: 630,
      alt: "Ambiance · avant / après, image d'ambiance : Accueil d'un cabinet, comptoir effet hêtre au dessus gris, chaises d'attente",
    });
    assert.equal(fichierPartage("x"), "/images/og/x.jpg");
    assert.equal(IMAGE_PARTAGE.url, "https://coverswap.fr/og-image.jpg");
  });

  test("une réalisation publiée la remplace : sa photo « après » du CRM, réduite, et sa légende", () => {
    const reelle = realisationPartagee({ titre: "Cuisine en chêne", ville: "Lattes", photoApres: "https://crm.example.test/api/site/photos/b/apres" });
    assert.deepEqual(reelle, { photo: "https://crm.example.test/api/site/photos/b/apres", legende: "Cuisine en chêne, Lattes." });
    assert.deepEqual(imagePartage("/realisations", reelle), { url: "https://crm.example.test/api/site/photos/b/apres?l=1600", largeur: 1600, hauteur: 1067, alt: "Cuisine en chêne, Lattes." });
    assert.equal(realisationPartagee({ titre: "Sans photo", ville: null, photoApres: null }), null);
    assert.equal(realisationPartagee(undefined), null);
    assert.equal(realisationPartagee({ titre: "Buffet", ville: null, photoApres: "https://crm.example.test/p" })?.legende, "Buffet.");
  });

  test("plus aucune adresse d'image de partage écrite à la main : gabarit, balisage, métadonnées", () => {
    for (const fichier of ["src/app/layout.tsx", "src/components/JsonLd.tsx", "src/lib/metadonnees.ts"]) assert.doesNotMatch(lire(fichier), /og-image\.jpg/, fichier);
    assert.match(lire("src/app/layout.tsx"), /url: IMAGE_PARTAGE\.url/);
    assert.match(lire("src/components/JsonLd.tsx"), /image: \[IMAGE_PARTAGE\.url\]/);
    assert.match(lire("src/lib/metadonnees.ts"), /image = imagePartage\(chemin\)/);
  });
});

describe("les images composées (scripts/og.mjs)", () => {
  test("une par paire utilisée, toutes présentes, en 1 200 × 630 JPEG ; aucune sans page", async () => {
    const utiles = new Set(pagesAvecPaire().map((p) => `${p.paire.apres}.jpg`));
    const presentes = readdirSync(DOSSIER).filter((n) => n.endsWith(".jpg"));
    assert.deepEqual([...presentes].sort(), [...utiles].sort());
    for (const nom of presentes) {
      const { width, height, format } = await sharp(join(DOSSIER, nom)).metadata();
      assert.deepEqual([width, height, format], [1200, 630, "jpeg"], nom);
    }
    assert.ok(existsSync(join(RACINE, "public", "og-image.jpg")));
  });

  test("le bandeau « Ambiance · avant / après » est posé, sans aucun appel d'API", () => {
    const script = lire("scripts/og.mjs");
    assert.equal(ETIQUETTE_PARTAGE, "Ambiance · avant / après");
    assert.match(script, /echapper\(ETIQUETTE_PARTAGE\)/);
    assert.match(script, /pastille\(0, "Avant"\)/);
    assert.match(script, /pastille\(DEMI \+ FILET, "Après"\)/);
    assert.doesNotMatch(script, /fetch\(|openai|api\./i);
    assert.match(lire("package.json"), /"og": "node --import tsx scripts\/og\.mjs"/);
  });
});
