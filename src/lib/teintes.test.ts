import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { AMBIANCES } from "@/data/ambiances";
import revetements from "@/data/revetements.json";
import { lab } from "./ambiances";
import { estFicheIndexee, fichesIndexees, prestationsDeFamille, referencesVedettes, vueDans } from "./indexation-matieres";
import { CHROMA_NEUTRE, TEINTES, cleDeTeinte, deltaE, deltaEHex, labDeHex, lchDeHex, matieresProches, teinteDe, trierParTeinte } from "./teintes";

/**
 * Site 3.0, lot D1 — les teintes des matières (Lab, ΔE 2000, nuancier, matières proches) et l'indexation des fiches
 * (« Vue dans » sur les deux séries, 52 fiches indexées, prestations par famille).
 */

type Ref = { id: string; nom: string; famille: string; finition: string; hex: string };
const CATALOGUE = revetements as Ref[];
const proche = (a: number, b: number, ecart = 1e-4) => Math.abs(a - b) <= ecart;

describe("Lab et ΔE 2000", () => {
  test("Lab : le blanc à 100, le noir à 0, sans teinte ; une seule conversion pour le site", () => {
    const [Lb, ab, bb] = labDeHex("#FFFFFF");
    assert.ok(proche(Lb, 100, 0.01) && proche(ab, 0, 0.01) && proche(bb, 0, 0.01), `${Lb} ${ab} ${bb}`);
    assert.deepEqual(labDeHex("#000000").map((v) => Math.round(v * 1000) / 1000), [0, 0, 0]);
    assert.deepEqual(labDeHex("b3261e"), labDeHex("#B3261E"), "dièse et casse indifférents");
    assert.equal(lab, labDeHex, "lib/ambiances lit la même conversion");
    const { C, h } = lchDeHex("#B3261E");
    assert.ok(C > 50 && h > 20 && h < 45, `rouge : C ${C}, h ${h}`);
  });

  test("CIEDE2000 : les valeurs de référence de Sharma, Wu et Dalal (2005)", () => {
    const paires: [[number, number, number], [number, number, number], number][] = [
      [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
      [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
      [[50, 0, 0], [50, -1, 2], 2.3669],
      [[50, 2.49, -0.001], [50, -2.49, 0.0009], 7.1792],
      [[50, 2.5, 0], [73, 25, -18], 27.1492],
      [[50, 2.5, 0], [56, -27, -3], 31.903],
      [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
      [[22.7233, 20.0904, -46.694], [23.0331, 14.973, -42.5619], 2.0373],
      [[90.9257, -0.5406, -0.9208], [88.6381, -0.8985, -0.7239], 1.5381],
    ];
    for (const [a, b, attendu] of paires) assert.ok(proche(deltaE(a, b), attendu), `${a} / ${b} : ${deltaE(a, b)} au lieu de ${attendu}`);
  });

  test("ΔE : nul pour une même couleur, symétrique, positif", () => {
    for (const m of CATALOGUE.slice(0, 40)) assert.equal(deltaEHex(m.hex, m.hex), 0, m.id);
    for (let i = 0; i < 60; i++) {
      const a = CATALOGUE[i].hex;
      const b = CATALOGUE[(i * 7 + 13) % CATALOGUE.length].hex;
      assert.ok(proche(deltaEHex(a, b), deltaEHex(b, a), 1e-9), `${a} / ${b}`);
      assert.ok(deltaEHex(a, b) >= 0);
    }
    assert.ok(deltaEHex("#FFFFFF", "#000000") > 99);
  });
});

describe("la teinte du filtre (lot D2)", () => {
  test("un vert ou un bleu très foncé mais franc va avec sa couleur ; les noirs restent noirs", () => {
    const teinte = (id: string) => {
      const m = CATALOGUE.find((x) => x.id === id)!;
      return teinteDe(m.famille, m.hex);
    };
    assert.deepEqual(["NF13", "M9", "NF14", "K1", "R9"].map(teinte), ["Vert", "Bleu", "Bleu", "Noir", "Noir"]);
    assert.ok(TEINTES.includes(teinte("D1")));
  });
});

describe("le nuancier", () => {
  test("un nuancier connu : les couleurs autour du cercle (rouge → violet), puis les neutres du blanc au noir", () => {
    const n = (id: string, hex: string) => ({ id, hex });
    const melange = [n("noir", "#151515"), n("bleu", "#2A5DB0"), n("blanc", "#FAFAF7"), n("jaune", "#E8C21A"), n("rouge", "#B3261E"), n("gris", "#8A8A88"), n("violet", "#6E3A8E"), n("orange", "#E07A1F"), n("vert", "#2E7D32")];
    assert.deepEqual(trierParTeinte(melange).map((m) => m.id), ["rouge", "orange", "jaune", "vert", "bleu", "violet", "blanc", "gris", "noir"]);
    // Même case de teinte : du plus clair au plus foncé.
    const chenes = [n("fonce", "#6B4A2E"), n("clair", "#C9A27A"), n("moyen", "#9A7048")];
    const cases = new Set(chenes.map((c) => cleDeTeinte(c.hex)[1]));
    assert.equal(cases.size, 1, "trois bois de la même case");
    assert.deepEqual(trierParTeinte(chenes).map((m) => m.id), ["clair", "moyen", "fonce"]);
  });

  test("le catalogue rangé : les 497 matières, sans toucher à la liste reçue ; les couleurs avant les neutres, chaque case du clair au foncé", () => {
    const copie = [...CATALOGUE];
    const range = trierParTeinte(CATALOGUE);
    assert.deepEqual(CATALOGUE, copie, "la liste reçue ne bouge pas");
    assert.equal(range.length, CATALOGUE.length);
    assert.deepEqual(range.map((m) => m.id).sort(), CATALOGUE.map((m) => m.id).sort());
    const premierNeutre = range.findIndex((m) => lchDeHex(m.hex).C < CHROMA_NEUTRE);
    assert.ok(premierNeutre > 0 && range.slice(premierNeutre).every((m) => lchDeHex(m.hex).C < CHROMA_NEUTRE), "les neutres à part, au bout");
    for (let i = 1; i < range.length; i++) {
      const [ga, ca, la] = cleDeTeinte(range[i - 1].hex);
      const [gb, cb, lb] = cleDeTeinte(range[i].hex);
      assert.ok(ga < gb || (ga === gb && (ca < cb || (ca === cb && la <= lb))), `${range[i - 1].id} puis ${range[i].id}`);
    }
    assert.deepEqual(trierParTeinte(CATALOGUE).map((m) => m.id), range.map((m) => m.id), "même entrée, même ordre");
  });

  test("les matières proches : 6, sans la référence elle-même, du plus proche au moins proche ; dans la famille sur demande", () => {
    for (const ref of ["NF13", "D1", "K1", "NE31"]) {
      const proches = matieresProches(ref, CATALOGUE);
      assert.equal(proches.length, 6, ref);
      assert.ok(!proches.some((m) => m.id === ref), ref);
      for (let i = 1; i < proches.length; i++) assert.ok(proches[i - 1].deltaE <= proches[i].deltaE, ref);
      const source = CATALOGUE.find((m) => m.id === ref)!;
      const autres = CATALOGUE.filter((m) => m.id !== ref && !proches.some((p) => p.id === m.id));
      assert.ok(autres.every((m) => deltaEHex(source.hex, m.hex) >= proches[5].deltaE), `${ref} : aucune matière plus proche oubliée`);
      assert.ok(matieresProches(ref, CATALOGUE, 6, { memeFamille: true }).every((m) => m.famille === source.famille), ref);
    }
    assert.equal(matieresProches("D1", CATALOGUE, 3).length, 3);
    assert.deepEqual(matieresProches("ZZZ999", CATALOGUE), []);
  });
});

describe("l'indexation des fiches", () => {
  test("52 fiches indexées : les 49 matières vues dans une ambiance (séries 1 et 2) et les vedettes NF27, J3, Q1 ; AF02 dehors", () => {
    const fiches = fichesIndexees();
    assert.equal(fiches.length, 52);
    assert.equal(new Set(fiches).size, 52);
    assert.equal(Object.keys(vueDans()).length, 49);
    for (const ref of Object.keys(vueDans())) assert.ok(fiches.includes(ref), ref);
    for (const ref of ["NF27", "J3", "Q1", "NF13", "D1", "RM20", "K1", "NE31", "NE24", "AG13", "U50"]) assert.ok(estFicheIndexee(ref), ref);
    for (const ref of ["AF02", "A4", "ZZZ999"]) assert.equal(estFicheIndexee(ref), false, ref);
    for (const ref of referencesVedettes()) assert.ok(estFicheIndexee(ref), `vedette ${ref}`);
    assert.deepEqual(fiches, CATALOGUE.map((m) => m.id).filter((id) => fiches.includes(id)), "dans l'ordre du catalogue");
  });

  test("« Vue dans » : les deux séries, les ambiances d'inspiration seules, avec leur image et leur pièce", () => {
    const vues = vueDans();
    const ids = new Set(Object.values(vues).flatMap((l) => l.map((a) => a.id)));
    assert.ok(ids.has("cuisine-sauge-bois-clair"), "série 1");
    assert.ok(ids.has("cuisine-bordeaux-brillante-apres-couleur"), "série 2");
    assert.ok(!ids.has("pose-mains") && !ids.has("detail-chant") && !ids.has("pose-sauge"), "ni photo d'étape ni photo utile");
    assert.equal(vues.AF02, undefined);
    for (const [ref, liste] of Object.entries(vues)) {
      for (const v of liste) {
        const a = AMBIANCES.find((x) => x.id === v.id)!;
        assert.ok(a.inspiration && a.surfaces.some((s) => s.ref === ref), `${ref} dans ${v.id}`);
        assert.deepEqual([v.titre, v.image, v.piece], [a.titre, a.image, a.piece]);
      }
    }
    const rang = (id: string) => AMBIANCES.findIndex((a) => a.id === id);
    for (const liste of Object.values(vues)) assert.deepEqual(liste.map((a) => rang(a.id)), liste.map((a) => rang(a.id)).sort((x, y) => x - y), "dans l'ordre de data/ambiances");
  });

  test("les prestations d'une famille : bois, couleurs, pierres, bétons partout ; métaux, textiles, paillettes en meubles et pro", () => {
    for (const f of ["bois", "couleur", "pierre", "beton"]) assert.deepEqual(prestationsDeFamille(f).map((p) => p.href), ["/prestations/cuisine", "/prestations/salle-de-bain", "/prestations/meubles"], f);
    for (const f of ["metal", "textile", "paillettes"]) assert.deepEqual(prestationsDeFamille(f).map((p) => p.href), ["/prestations/meubles", "/pro"], f);
    assert.deepEqual(prestationsDeFamille("inconnue"), []);
  });
});
