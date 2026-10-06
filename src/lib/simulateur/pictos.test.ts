import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EcranMatieres } from "@/app/simulateur/_components/EcranMatieres";
import { EcranPhoto } from "@/app/simulateur/_components/EcranPhoto";
import { EcranPiece } from "@/app/simulateur/_components/EcranPiece";
import { Estimation } from "@/app/simulateur/_components/Estimation";
import { PICTOS_ELEMENTS, PICTOS_FAMILLES } from "@/components/espace/Illustrations";
import { ELEMENTS } from "./elements";
import { PROJECT_TYPES, getProject, pictoDeLaPiece } from "./projets";
import type { Selection } from "./reprise";
import { PICTO_DE_ZONE, ZONES_REPLI, pictoDeZone, type ZonesSimulateur } from "./zones";

/**
 * Site 3.0, lot E2 : les pictos de la série 1 (5 familles, 4 plans) et les 8 nouveaux (7 éléments, la cuisine en
 * couloir) remplacent tout dessin au trait dans le choix de la pièce, de l'élément et de la forme.
 */
const RACINE = process.cwd();
const SRC = path.join(RACINE, "src");
const lire = (f: string) => readFileSync(path.join(SRC, f), "utf8");
const PLANS = ["plan-une-rangee", "plan-en-l", "plan-en-u", "plan-ilot", "plan-parallele"];
const quatreFichiers = (nom: string) => [128, 256].flatMap((t) => ["avif", "webp"].map((ext) => path.join(RACINE, "public", "images", "pictos", `${nom}-${t}.${ext}`)));
const pictosRendus = (html: string) => [...html.matchAll(/\/images\/pictos\/([a-z-]+)-(?:128|256)\.webp/g)].map((m) => m[1]);
const film = (ref: string): Selection => ({ ref, nom: "Deep Green", famille: "couleur", finition: "mat", categorie: "", tags: [], image: "" });

describe("lot E2 : les pictos partout", () => {
  test("chaque pièce a son picto (série 1), cuisine à défaut ; quatre fichiers (AVIF et WebP, 128 et 256 px) par picto utilisé", () => {
    assert.deepEqual(Object.fromEntries(PROJECT_TYPES.map((p) => [p.id, p.picto])), { cuisine: "picto-cuisine", "salle-de-bain": "picto-salle-de-bain", meubles: "picto-mobilier", "mur-plafond": "picto-murs", professionnel: "picto-pro" });
    assert.equal(pictoDeLaPiece("exterieur"), getProject("exterieur").picto);
    assert.equal(pictoDeLaPiece("exterieur"), "picto-cuisine");
    // Les pièces du simulateur et les familles de l'espace montrent les mêmes pictos.
    assert.deepEqual(new Set(PROJECT_TYPES.map((p) => p.picto)), new Set(Object.values(PICTOS_FAMILLES)));
    const utilises = new Set([...PROJECT_TYPES.map((p) => p.picto), ...Object.values(PICTOS_ELEMENTS), ...Object.values(PICTO_DE_ZONE).filter((x): x is string => !!x), ...PLANS]);
    assert.equal(utilises.size, 17, "5 familles, 7 éléments, 5 plans");
    for (const nom of utilises) for (const f of quatreFichiers(nom)) assert.ok(existsSync(f), f);
  });

  test("chaque élément mène à une pièce et une zone de ZONES_REPLI ; porte d'entrée et réfrigérateur rattachés (meubles, cuisine)", () => {
    for (const e of ELEMENTS) {
      const piece = ZONES_REPLI.pieces.find((p) => p.id === e.piece);
      assert.ok(piece?.zones.some((z) => z.id === e.zone), `${e.id} → ${e.piece}/${e.zone}`);
    }
    const parId = Object.fromEntries(ELEMENTS.map((e) => [e.id, `${e.piece}/${e.zone}`]));
    assert.equal(parId["porte-entree"], "meubles/portes-dressing");
    assert.equal(parId.refrigerateur, "cuisine/facades-cuisine");
  });

  test("PICTO_DE_ZONE : des zones connues seulement ; toute autre zone, ou une zone nouvelle du CRM, prend le picto de sa pièce", () => {
    const zonesConnues = new Set(ZONES_REPLI.pieces.flatMap((p) => p.zones.map((z) => z.id)));
    for (const zone of Object.keys(PICTO_DE_ZONE)) assert.ok(zonesConnues.has(zone), zone);
    assert.equal(pictoDeZone("plan-de-travail", "cuisine"), "picto-plan-de-travail");
    assert.equal(pictoDeZone("portes-dressing", "meubles"), "picto-placard-coulissant");
    assert.equal(pictoDeZone("meuble-complet", "meubles"), "picto-commode");
    assert.equal(pictoDeZone("credence", "cuisine"), "picto-cuisine", "zone sans picto propre : celui de la pièce");
    assert.equal(pictoDeZone("tablier-baignoire", "salle-de-bain"), "picto-salle-de-bain");
    assert.equal(pictoDeZone("zone-nouvelle", "mur-plafond"), "picto-murs", "zone publiée plus tard par le CRM");
    assert.equal(pictoDeZone("zone-nouvelle", "piece-nouvelle"), "picto-cuisine");
    for (const p of ZONES_REPLI.pieces) for (const z of p.zones) for (const f of quatreFichiers(pictoDeZone(z.id, p.id))) assert.ok(existsSync(f), `${z.id} : ${f}`);
  });

  test("écran 1 : les cinq cartes en pictos, puis « Un élément précis ? » — sept boutons, picto de 64 px et libellé ; un élément choisit sa pièce et ouvre sa zone", () => {
    const html = renderToStaticMarkup(createElement(EcranPiece, { zones: ZONES_REPLI, projet: null, onChoisir: () => undefined })).replace(/&#x27;/g, "'");
    assert.match(html, /<h3 id="etape-element"[^>]*>Un élément précis \?<\/h3>/);
    const rangee = html.slice(html.indexOf('id="etape-element"'));
    const boutons = rangee.split("<button").slice(1);
    assert.equal(boutons.length, 7);
    boutons.forEach((b, i) => {
      assert.ok(b.includes(`/images/pictos/${PICTOS_ELEMENTS[ELEMENTS[i].id]}-128.webp`), ELEMENTS[i].id);
      assert.match(b, /class="object-contain h-16 w-16"/);
      assert.match(b, /alt=""/);
      assert.ok(b.includes(`>${ELEMENTS[i].libelle}<`), ELEMENTS[i].libelle);
      assert.match(b, /min-h-\[44px\]/);
    });
    // Un élément dont la pièce n'est plus publiée n'est pas proposé.
    const sansSdb: ZonesSimulateur = { ...ZONES_REPLI, pieces: ZONES_REPLI.pieces.filter((p) => p.id !== "salle-de-bain") };
    assert.ok(!renderToStaticMarkup(createElement(EcranPiece, { zones: sansSdb, projet: null, onChoisir: () => undefined })).includes("picto-meuble-vasque"));
    assert.match(lire("app/simulateur/_components/EcranPiece.tsx"), /onClick=\{\(\) => onChoisir\(e\.piece, e\.id\)\}/);
    const simulateur = lire("app/simulateur/_components/Simulateur.tsx");
    assert.match(simulateur, /const choisirPiece = \(id: string, element: string \| null = null\) => \{/);
    assert.match(simulateur, /zoneDemandee\.current = zoneDeLElement\(element, id\);\s+marquerPiece\(id\);/);
    assert.match(simulateur, /<EcranPiece zones=\{zones\} projet=\{charge && pieceChoisie \? etat\.projet : null\} onChoisir=\{choisirPiece\} \/>/);
  });

  test("écran 3 : chaque zone sans matière montre son picto de 64 px ; une matière choisie prend sa place", () => {
    const meubles = ZONES_REPLI.pieces.find((p) => p.id === "meubles")!;
    const html = renderToStaticMarkup(
      createElement(EcranMatieres, { piece: meubles, photo: "data:image/jpeg;base64,AAAA", rapport: null, selections: { "meuble-tv": film("NF13") }, analyse: null, conseilIgnore: false, onIgnorerConseil: () => undefined, onReprendrePhoto: () => undefined, onOuvrir: () => undefined, onRetirer: () => undefined, focusZone: null, zonesRefusees: [], messageRefus: null, peutGenerer: false, raisonBloque: null, occupe: false, onGenerer: () => undefined, zonesMax: 4 })
    );
    assert.deepEqual(pictosRendus(html).filter((_, i, t) => t.indexOf(_) === i), ["picto-placard-coulissant", "picto-commode"], "le meuble TV a sa matière : pas de picto");
    assert.equal((html.match(/class="object-contain h-16 w-16"/g) ?? []).length, 2);
    assert.equal((html.match(/min-h-\[64px\]/g) ?? []).length, 3, "les rangées gardent leur hauteur dans les deux états");
  });

  test("écran 2 : le conseil « Toute la zone visible » montre le picto de la pièce ; les deux schémas à la couleur du texte, aucune couleur écrite", () => {
    const sdb = renderToStaticMarkup(createElement(EcranPhoto, { projet: getProject("salle-de-bain"), photo: null, rapport: null, occupe: false, onFichier: () => undefined, onGarder: () => undefined }));
    assert.deepEqual(pictosRendus(sdb).filter((_, i, t) => t.indexOf(_) === i), ["picto-salle-de-bain"]);
    assert.match(sdb, /class="object-contain h-16 w-16 sm:h-32 sm:w-32"/);
    assert.ok(!sdb.includes("Meubles, plan, crédence"), "le conseil vaut pour toutes les pièces");
    assert.equal((sdb.match(/<svg viewBox="0 0 120 92"[^>]*stroke="currentColor"/g) ?? []).length, 2);
    assert.ok(renderToStaticMarkup(createElement(EcranPhoto, { projet: getProject("professionnel"), photo: null, rapport: null, occupe: false, onFichier: () => undefined, onGarder: () => undefined })).includes("picto-pro-128.webp"));
    assert.doesNotMatch(lire("app/simulateur/_components/EcranPhoto.tsx"), /#[0-9a-f]{3,8}\b/i);
  });

  test("estimation : le plan de chaque forme publiée ; « couloir » (plan-parallele) seulement si le CRM publie ce format ; le picto de la famille sinon", () => {
    const format = (id: string) => ({ id, libelle: id, aide: "≈ 3 m", metres: 3 });
    const rendre = (famille: "CUISINE" | "SDB", ids: string[]) => renderToStaticMarkup(createElement(Estimation, { famille, formats: ids.map(format), format: null, onFormat: () => undefined, estimation: null }));
    // Ce que le CRM publie aujourd'hui (tarifs-publics.ts : petite, moyenne, grande).
    const aujourdhui = rendre("CUISINE", ["une-rangee", "en-l", "ilot"]);
    assert.deepEqual(pictosRendus(aujourdhui), ["plan-une-rangee", "plan-en-l", "plan-ilot"]);
    assert.equal((aujourdhui.match(/<svg/g) ?? []).length, 3);
    assert.ok(!aujourdhui.includes("plan-parallele"));
    assert.deepEqual(pictosRendus(rendre("CUISINE", ["une-rangee", "parallele", "en-u"])), ["plan-une-rangee", "plan-parallele", "plan-en-u"]);
    assert.deepEqual(pictosRendus(rendre("CUISINE", ["inconnu"])), ["picto-cuisine"]);
    assert.deepEqual(pictosRendus(rendre("SDB", ["un-lavabo", "deux-lavabos"])), ["picto-salle-de-bain", "picto-salle-de-bain"]);
  });

  test("64 px au moins à chaque appel d'un picto dans le simulateur ; plus aucun dessin de pièce au trait (CuisineDeFace supprimé)", () => {
    const fichiers = ["app/simulateur/_components/EcranPiece.tsx", "app/simulateur/_components/EcranMatieres.tsx", "app/simulateur/_components/EcranPhoto.tsx", "app/simulateur/_components/Estimation.tsx", "components/simulation/CartesPieces.tsx"];
    let appels = 0;
    for (const f of fichiers) {
      for (const m of lire(f).matchAll(/<(?:Picto|PlanCuisine|DessinFamille)[^>]*className="([^"]*)"/g)) {
        appels++;
        assert.ok(/\bh-(16|20|24|full)\b/.test(m[1]), `${f} : ${m[1]}`);
      }
    }
    assert.equal(appels, 6);
    const tous = (dossier: string): string[] => readdirSync(dossier, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tous(path.join(dossier, e.name)) : /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [path.join(dossier, e.name)] : []));
    for (const f of tous(SRC)) assert.ok(!readFileSync(f, "utf8").includes("CuisineDeFace"), f);
    // Les cartes de pièce sans photo : le picto de la pièce, en svg (une image par carte).
    assert.match(lire("components/simulation/CartesPieces.tsx"), /<Picto nom=\{pictoDeLaPiece\(p\.id\)\} enSvg className="h-full w-full" \/>/);
  });
});
