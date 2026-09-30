import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ORDRE_ENTONNOIR, creerEmetteur, rouvrirGeneration, type EtapeEntonnoir } from "./entonnoir";

/** Mission 15 (partie 4) — l'entonnoir : les événements partent dans l'ordre, une fois chacun par parcours. */

describe("entonnoir du simulateur", () => {
  test("une étape ne part qu'une fois, dans l'ordre ; un retour en arrière ne recompte rien", () => {
    const partis: EtapeEntonnoir[] = [];
    const e = creerEmetteur((type) => partis.push(type));
    assert.equal(e.marquer("PIECE_CHOISIE", { projet: "cuisine" }), true);
    assert.equal(e.marquer("PHOTO_CHARGEE"), true);
    assert.equal(e.marquer("PIECE_CHOISIE", { projet: "meubles" }), false, "retour à la pièce : rien ne repart");
    assert.equal(e.marquer("PHOTO_CHARGEE"), false);
    assert.equal(e.marquer("GENERATION_LANCEE"), true);
    assert.equal(e.marquer("RESULTAT_VU"), true);
    assert.deepEqual(partis, ["PIECE_CHOISIE", "PHOTO_CHARGEE", "GENERATION_LANCEE", "RESULTAT_VU"]);
    assert.deepEqual(e.emises(), [...ORDRE_ENTONNOIR]);
  });

  test("« Essayer d'autres matières » recompte une génération et un résultat, pas la pièce ni la photo ; « Nouvelle simulation » repart de zéro", () => {
    const partis: EtapeEntonnoir[] = [];
    let e = creerEmetteur((type) => partis.push(type));
    for (const etape of ORDRE_ENTONNOIR) e.marquer(etape);
    e = rouvrirGeneration(e, (type) => partis.push(type));
    assert.deepEqual(e.emises(), ["PIECE_CHOISIE", "PHOTO_CHARGEE"]);
    assert.equal(e.marquer("PIECE_CHOISIE"), false);
    assert.equal(e.marquer("GENERATION_LANCEE"), true);
    assert.equal(e.marquer("RESULTAT_VU"), true);
    assert.deepEqual(partis, ["PIECE_CHOISIE", "PHOTO_CHARGEE", "GENERATION_LANCEE", "RESULTAT_VU", "GENERATION_LANCEE", "RESULTAT_VU"]);
    e.reinitialiser();
    assert.deepEqual(e.emises(), []);
    assert.equal(e.marquer("PIECE_CHOISIE"), true);
  });
});
