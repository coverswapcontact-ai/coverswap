import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { estimationCalculable, estimationPourEnvoi, estimer, FAMILLE_DU_PROJET, formatsDeLaFamille, MARGE_ESTIMATION, PRECISION_ESTIMATION, repliDeLaFamille, texteEstimation, ZONE_VERS_SOUS_PARTIE, type Estimation } from "./estimation";
import { FOURCHETTES } from "./offre";
import { ZONES_REPLI } from "./simulateur/zones";
import type { TarifsSite } from "./tarifs-site";

/**
 * Mission 16 (partie 4) — l'estimation après le rendu : fourchette juste pour une cuisine moyenne avec deux zones,
 * arrondie à la centaine, ± 12 % ; repli sur les fourchettes d'`offre.ts` quand un tarif manque, qu'un format est
 * inconnu ou que le CRM ne répond pas ; jamais `NaN`.
 */

const FORMATS_CUISINE = [
  { id: "une-rangee", libelle: "Petite", aide: "Un seul mur, ≈ 3 m", metres: 3 },
  { id: "en-l", libelle: "Moyenne", aide: "En L, ≈ 5 m", metres: 5 },
  { id: "ilot", libelle: "Grande", aide: "Avec îlot, ≈ 8 m", metres: 8 },
];

function tarifs(prix: { hautes?: number | null; basses?: number | null; unite?: "ml" | "jour" | "forfait" } = {}): TarifsSite {
  const { hautes = 170, basses = 170, unite = "ml" } = prix;
  return {
    version: 1,
    familles: [
      {
        id: "CUISINE",
        sousParties: [
          { id: "facades-hautes", libelle: "Façades hautes", metrage: true, prixUnitaire: hautes, unite },
          { id: "facades-basses", libelle: "Façades basses", metrage: true, prixUnitaire: basses, unite },
          { id: "plan-de-travail", libelle: "Plan de travail", metrage: false, prixUnitaire: 90, unite: "ml" },
          { id: "credence", libelle: "Crédence", metrage: false, prixUnitaire: null, unite: "ml" },
        ],
        formats: FORMATS_CUISINE,
      },
      { id: "SDB", sousParties: [{ id: "meuble-vasque", libelle: "Meuble vasque", metrage: true, prixUnitaire: 400, unite: "ml" }], formats: [{ id: "un-lavabo", libelle: "Un lavabo", aide: "≈ 80 cm", metres: 0.8 }] },
      { id: "MEUBLES", sousParties: [], formats: [] },
      { id: "PRO", sousParties: [], formats: [] },
    ],
  };
}

const espaces = (texte: string) => texte.replace(/\s/g, " ");
const cuisine = (zones: string[], format: string | null = "en-l", t: TarifsSite | null = tarifs()) => estimer({ famille: "CUISINE", format, tarifs: t, zonesChoisies: zones });
const repliCuisine: Estimation = { type: "repli", famille: "CUISINE", min: FOURCHETTES.cuisine.min, max: FOURCHETTES.cuisine.max };

describe("estimer : la fourchette calculée", () => {
  test("cuisine moyenne (5 m), façades hautes et basses à 170 €/ml : 1 700 € → « 1 500 à 1 900 € »", () => {
    const e = cuisine(["meubles-hauts", "meubles-bas"]);
    assert.deepEqual(e, { type: "calculee", famille: "CUISINE", min: 1500, max: 1900, format: FORMATS_CUISINE[1] });
    assert.equal(espaces(texteEstimation(e)), "Estimation : 1 500 à 1 900 €");
    // « Façades (toutes) » vaut les deux sous-parties : même résultat.
    assert.deepEqual(cuisine(["facades-cuisine"]), e);
  });

  test("arrondi à la centaine, ± 12 % autour du total", () => {
    for (const [hautes, basses, format] of [[113, 97, "une-rangee"], [150, 150, "ilot"], [55, 131, "en-l"]] as const) {
      const metres = FORMATS_CUISINE.find((f) => f.id === format)!.metres;
      const total = (hautes + basses) * metres;
      const e = cuisine(["meubles-hauts", "meubles-bas"], format, tarifs({ hautes, basses }));
      assert.equal(e.type, "calculee");
      if (e.type !== "calculee") continue;
      assert.equal(e.min % 100, 0);
      assert.equal(e.max % 100, 0);
      assert.equal(e.min, Math.round((total * (1 - MARGE_ESTIMATION)) / 100) * 100);
      assert.equal(e.max, Math.max(Math.round((total * (1 + MARGE_ESTIMATION)) / 100) * 100, e.min + 100));
      assert.ok(e.min < e.max);
    }
  });

  test("une zone que la longueur ne chiffre pas (plan de travail, crédence) : la fourchette de la pièce, jamais un chiffre qui l'oublie", () => {
    assert.deepEqual(cuisine(["meubles-bas"]), { type: "calculee", famille: "CUISINE", min: 700, max: 1000, format: FORMATS_CUISINE[1] });
    assert.deepEqual(cuisine(["meubles-bas", "plan-de-travail"]), repliCuisine);
    assert.deepEqual(cuisine(["facades-cuisine", "credence"]), repliCuisine);
    assert.deepEqual(cuisine(["plan-de-travail"]), repliCuisine);
    assert.deepEqual(cuisine([]), repliCuisine, "aucune zone");
    assert.deepEqual(cuisine(["zone-inconnue"]), repliCuisine);
  });

  test("une petite surface garde une fourchette lisible (au moins 100 € d'écart)", () => {
    const e = estimer({ famille: "SDB", format: "un-lavabo", tarifs: tarifs(), zonesChoisies: ["meuble-vasque"] });
    assert.deepEqual(e.type === "calculee" ? [e.min, e.max] : null, [300, 400]);
  });
});

describe("estimer : les replis", () => {
  test("un tarif absent, un tarif qui n'est pas au mètre linéaire, un format inconnu ou pas encore choisi, pas de tarifs : la fourchette d'offre.ts", () => {
    assert.deepEqual(cuisine(["meubles-hauts", "meubles-bas"], "en-l", tarifs({ basses: null })), repliCuisine);
    assert.deepEqual(cuisine(["meubles-hauts"], "en-l", tarifs({ unite: "forfait" })), repliCuisine);
    assert.deepEqual(cuisine(["meubles-hauts"], "en-u"), repliCuisine, "format inconnu");
    assert.deepEqual(cuisine(["meubles-hauts"], null), repliCuisine);
    assert.deepEqual(cuisine(["meubles-hauts"], "en-l", null), repliCuisine, "CRM injoignable");
    assert.equal(espaces(texteEstimation(repliCuisine)), "Cuisine : 1 200 à 3 500 €");
  });

  test("meubles : « dès 250 € » ; pro : sur devis ; murs (pas de famille) : sur devis", () => {
    const meubles = estimer({ famille: "MEUBLES", format: null, tarifs: tarifs(), zonesChoisies: ["meuble-tv"] });
    assert.deepEqual(meubles, { type: "repli", famille: "MEUBLES", min: 250, max: null });
    assert.equal(espaces(texteEstimation(meubles)), "Meubles : dès 250 €");
    assert.deepEqual(estimer({ famille: "PRO", format: null, tarifs: tarifs(), zonesChoisies: ["comptoir-habillage"] }), { type: "sur-devis" });
    assert.deepEqual(estimer({ famille: FAMILLE_DU_PROJET["mur-plafond"] ?? null, format: null, tarifs: tarifs(), zonesChoisies: ["mur-principal"] }), { type: "sur-devis" });
    assert.equal(texteEstimation({ type: "sur-devis" }), "Prix sur devis");
    assert.deepEqual(repliDeLaFamille(null), { type: "sur-devis" });
  });

  test("jamais NaN : prix ou longueurs illisibles → repli", () => {
    for (const prix of [Number.NaN, Number.POSITIVE_INFINITY, -170, 0]) {
      const e = cuisine(["meubles-hauts", "meubles-bas"], "en-l", tarifs({ hautes: prix }));
      assert.deepEqual(e, repliCuisine, String(prix));
    }
    const t = tarifs();
    t.familles[0].formats = [{ id: "en-l", libelle: "Moyenne", aide: "", metres: Number.NaN }];
    assert.deepEqual(cuisine(["meubles-hauts"], "en-l", t), repliCuisine);
    assert.deepEqual(formatsDeLaFamille("CUISINE", t), [], "un format sans longueur n'est pas proposé");
    for (const e of [cuisine(["meubles-hauts"]), cuisine([]), repliCuisine]) assert.ok(!/NaN|undefined/.test(texteEstimation(e)), texteEstimation(e));
  });
});

describe("estimationCalculable : la taille ne se demande que si elle change le chiffre", () => {
  test("façades seules : oui ; avec un plan de travail, une crédence, un tarif absent ou pas au mètre, sans format : non", () => {
    const t = tarifs();
    const calculable = (zones: string[], x: TarifsSite | null = t, famille: Parameters<typeof estimationCalculable>[0]["famille"] = "CUISINE") => estimationCalculable({ famille, tarifs: x, zonesChoisies: zones });
    assert.equal(calculable(["meubles-hauts", "meubles-bas"]), true);
    assert.equal(calculable(["facades-cuisine"]), true);
    assert.equal(calculable(["facades-cuisine", "plan-de-travail"]), false, "le plan de travail n'est pas chiffré par la longueur");
    assert.equal(calculable(["credence"]), false);
    assert.equal(calculable([]), false);
    assert.equal(calculable(["meubles-hauts"], tarifs({ hautes: null })), false, "tarif absent");
    assert.equal(calculable(["meubles-hauts"], tarifs({ unite: "forfait" })), false, "pas au mètre linéaire");
    assert.equal(calculable(["meubles-hauts"], null), false, "CRM injoignable");
    assert.equal(calculable(["meuble-vasque"], t, "SDB"), true);
    assert.equal(calculable(["tablier-baignoire"], t, "SDB"), false);
    assert.equal(calculable(["portes-dressing"], t, "MEUBLES"), false, "mobilier : aucun format");
    assert.equal(calculable(["meubles-hauts"], t, null), false);
    // Quand ce n'est pas calculable, toutes les tailles donnent la même fourchette : la demander serait un geste pour rien.
    const tailles = FORMATS_CUISINE.map((f) => texteEstimation(estimer({ famille: "CUISINE", format: f.id, tarifs: t, zonesChoisies: ["facades-cuisine", "plan-de-travail"] })));
    assert.equal(new Set(tailles).size, 1);
  });
});

describe("ce qui part au CRM, et les tables", () => {
  test("estimationPourEnvoi : fourchette et taille ; la fourchette de repli sans taille ; rien pour « sur devis » ou « dès »", () => {
    assert.deepEqual(estimationPourEnvoi(cuisine(["meubles-hauts", "meubles-bas"])), { estimationMin: 1500, estimationMax: 1900, formatPiece: "Moyenne · En L, ≈ 5 m" });
    assert.deepEqual(estimationPourEnvoi(repliCuisine), { estimationMin: 1200, estimationMax: 3500 });
    assert.deepEqual(estimationPourEnvoi({ type: "sur-devis" }), {});
    assert.deepEqual(estimationPourEnvoi({ type: "repli", famille: "MEUBLES", min: 250, max: null }), {});
    assert.deepEqual(estimationPourEnvoi(null), {});
  });

  test("chaque zone du simulateur (hors murs) a sa ligne dans ZONE_VERS_SOUS_PARTIE ; la phrase fixe", () => {
    for (const piece of ZONES_REPLI.pieces) {
      const famille = FAMILLE_DU_PROJET[piece.id];
      if (!famille) {
        assert.equal(piece.id, "mur-plafond");
        continue;
      }
      for (const zone of piece.zones) assert.ok(zone.id in ZONE_VERS_SOUS_PARTIE[famille], `${piece.id} › ${zone.id}`);
    }
    assert.equal(PRECISION_ESTIMATION, "Déplacement compris. Le devis exact suit vos photos.");
  });
});
