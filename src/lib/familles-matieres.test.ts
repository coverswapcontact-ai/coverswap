import assert from "node:assert/strict";
import { describe, test } from "node:test";
import revetements from "@/data/revetements.json";
import { FAMILLES, estFamille, libelleFamille } from "./familles-matieres";

/** Mission 16 (partie 1, relecture) — une seule liste de familles ; `?famille=` inconnu ne filtre rien. */

describe("familles du catalogue", () => {
  test("chaque référence du catalogue appartient à une famille de la liste", () => {
    const hors = (revetements as { famille: string }[]).filter((r) => !estFamille(r.famille)).map((r) => r.famille);
    assert.deepEqual([...new Set(hors)], []);
  });

  test("?famille= : une famille connue est reconnue ; vide, inconnue ou héritée d'Object ne l'est pas", () => {
    assert.equal(estFamille("bois"), true);
    for (const valeur of [null, undefined, "", "Bois", "tout", "constructor", "inconnue"]) assert.equal(estFamille(valeur), false, String(valeur));
  });

  test("les libellés sont ceux du simulateur", () => {
    assert.equal(libelleFamille("couleur"), "Couleurs");
    assert.equal(libelleFamille("inconnue"), "inconnue");
    assert.equal(FAMILLES.length, 7);
  });
});
