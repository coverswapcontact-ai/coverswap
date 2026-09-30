import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { PHOTOS_PIECES, photoDePiece } from "@/lib/images-pieces";
import { PROJECT_TYPES } from "@/lib/simulateur/projets";
import { CartesPieces, type PieceCarte } from "./CartesPieces";
import { Photo } from "./Photo";

/**
 * Mission 16 (partie 2) — les cartes de pièces reçoivent les photos d'ambiance :
 *  - une image préparée → la carte la montre (`<picture>`, carré, « Ambiance »), sinon le dessin au trait ;
 *  - sans `photos` (l'espace client) : les dessins, comme avant ;
 *  - aucun `div` dans un bouton (la photo passe en cadre `span`) ;
 *  - premier écran du simulateur : les trois premières photos en chargement immédiat (sans `fetchpriority`, réservé à
 *    l'ouverture), les autres et l'accueil en `lazy` ;
 *  - les noms viennent d'un seul endroit (`lib/images-pieces`), lu par le simulateur et l'accueil.
 */

const PIECES: PieceCarte[] = PROJECT_TYPES.map((p) => ({ id: p.id, libelle: p.label, description: p.description }));
const rendre = (photos?: Record<string, string>) => renderToStaticMarkup(createElement(CartesPieces, { pieces: PIECES, valeur: null, onChoisir: () => undefined, photos }));
const boutons = (html: string) => html.split("<button").slice(1);
/** Un nom réellement préparé (le manifeste du dépôt n'est pas vide : ouverture provisoire, illustrations). */
const PREPAREE = Object.keys(MANIFESTE_IMAGES)[0];

describe("CartesPieces avec photos", () => {
  test("sans photos : cinq dessins, aucune image, aucune étiquette", () => {
    const html = rendre();
    assert.equal(boutons(html).length, 5);
    assert.equal((html.match(/<svg/g) ?? []).length, 5);
    assert.ok(!html.includes("<picture") && !html.includes("<img") && !html.includes("Ambiance"));
  });

  test("une photo préparée remplace le dessin de SA carte (carré, « Ambiance »), les autres gardent le leur", { skip: PREPAREE ? false : "manifeste vide" }, () => {
    const html = rendre({ cuisine: PREPAREE, "salle-de-bain": "piece-inexistante-du-manifeste" });
    const [cuisine, sdb, ...autres] = boutons(html);
    assert.match(cuisine, /<picture>/);
    assert.match(cuisine, /aspect-ratio:\s*1 \/ 1/);
    assert.match(cuisine, /srcSet="[^"]*\.avif 480w|srcset="[^"]*\.avif 480w/i);
    assert.match(cuisine, />Ambiance</);
    assert.match(cuisine, /alt=""/);
    assert.ok(!cuisine.includes("<svg"), "la carte avec photo n'a plus son dessin");
    // Nom absent du manifeste (image pas encore générée) : le dessin reste.
    assert.ok(sdb.includes("<svg") && !sdb.includes("<picture") && !sdb.includes("Ambiance"));
    for (const b of autres) assert.ok(b.includes("<svg") && !b.includes("<picture"));
  });

  test("aucun div dans un bouton : la photo est posée dans un cadre span", { skip: PREPAREE ? false : "manifeste vide" }, () => {
    const html = rendre({ cuisine: PREPAREE, meubles: PREPAREE });
    for (const b of boutons(html)) assert.ok(!b.split("</button>")[0].includes("<div"), b);
    const cadre = renderToStaticMarkup(createElement(Photo, { nom: PREPAREE, alt: "", ratio: "1 / 1", enLigne: true }));
    assert.match(cadre, /^<span class="relative block overflow-hidden bg-fond-2"/);
    assert.match(renderToStaticMarkup(createElement(Photo, { nom: PREPAREE, alt: "" })), /^<div class="relative overflow-hidden bg-fond-2"/);
  });

  test("chargement : les N premières photos tout de suite (eager, sans fetchpriority), les autres en lazy ; lazy par défaut", { skip: PREPAREE ? false : "manifeste vide" }, () => {
    const toutes = Object.fromEntries(PIECES.map((p) => [p.id, PREPAREE]));
    const images = (photosImmediates?: number) => boutons(renderToStaticMarkup(createElement(CartesPieces, { pieces: PIECES, valeur: null, onChoisir: () => undefined, photos: toutes, photosImmediates }))).map((b) => b.match(/<img [^>]*>/)?.[0] ?? "");
    const parDefaut = images();
    assert.equal(parDefaut.length, 5);
    for (const img of parDefaut) assert.match(img, /loading="lazy"/);
    const premierEcran = images(3);
    assert.deepEqual(premierEcran.map((img) => img.match(/loading="(\w+)"/)?.[1]), ["eager", "eager", "eager", "lazy", "lazy"]);
    for (const img of premierEcran) assert.ok(!/fetchpriority/i.test(img), "fetchpriority réservé à l'ouverture");
    // `priorite` (l'ouverture) garde eager + fetchpriority high ; `immediat` seul, eager sans fetchpriority.
    assert.match(renderToStaticMarkup(createElement(Photo, { nom: PREPAREE, alt: "", priorite: true })), /loading="eager"[^>]*fetchPriority="high"|fetchPriority="high"[^>]*loading="eager"/i);
    const immediate = renderToStaticMarkup(createElement(Photo, { nom: PREPAREE, alt: "", immediat: true }));
    assert.match(immediate, /loading="eager"/);
    assert.ok(!/fetchpriority/i.test(immediate));
  });

  test("un identifiant hérité d'Object n'a pas de photo", () => {
    assert.equal(photoDePiece(PHOTOS_PIECES, "constructor"), null);
    assert.equal(photoDePiece(undefined, "cuisine"), null);
    assert.equal(photoDePiece(PHOTOS_PIECES, "cuisine"), "piece-cuisine");
  });
});

describe("les photos des pièces : un seul endroit", () => {
  test("une photo d'ambiance par pièce du simulateur, noms piece-* (ceux des ambiances générées)", () => {
    assert.deepEqual(Object.keys(PHOTOS_PIECES).sort(), PROJECT_TYPES.map((p) => p.id).sort());
    assert.deepEqual(Object.values(PHOTOS_PIECES).sort(), ["piece-cuisine", "piece-meubles", "piece-murs", "piece-pro", "piece-salle-de-bain"]);
  });

  test("le simulateur et l'accueil passent PHOTOS_PIECES ; l'espace client, non (ses cartes restent des dessins)", () => {
    const lire = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");
    for (const f of ["src/app/simulateur/_components/EcranPiece.tsx", "src/components/HomeClient.tsx"]) {
      assert.match(lire(f), /<CartesPieces [^\n]*photos=\{PHOTOS_PIECES\}[^\n]*\/>/, f);
      assert.match(lire(f), /from "@\/lib\/images-pieces"/, f);
    }
    // Premier écran du simulateur : les photos du premier rang en chargement immédiat ; l'accueil (module sous l'ouverture) en lazy.
    assert.match(lire("src/app/simulateur/_components/EcranPiece.tsx"), /<CartesPieces [^\n]*photosImmediates=\{PHOTOS_IMMEDIATES\}/);
    assert.match(lire("src/app/simulateur/_components/EcranPiece.tsx"), /const PHOTOS_IMMEDIATES = 3;/);
    assert.ok(!lire("src/components/HomeClient.tsx").includes("photosImmediates"));
    assert.ok(!lire("src/components/espace/CreationEcrans.tsx").includes("photos="));
    // Aucune liste de noms piece-* ailleurs que dans lib/images-pieces.
    for (const f of ["src/app/simulateur/_components/EcranPiece.tsx", "src/components/HomeClient.tsx", "src/components/simulation/CartesPieces.tsx"]) assert.ok(!/"piece-(cuisine|murs|pro|meubles|salle-de-bain)"/.test(lire(f)), f);
  });
});
