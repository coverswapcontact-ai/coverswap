import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ORDRE_ENTONNOIR, creerEmetteur, lireDepuis, rouvrirGeneration, type EtapeEntonnoir } from "./entonnoir";

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

  test("mission 16 (partie 3) : ?depuis= d'un bouton de l'accueil, repris dans le meta de PIECE_CHOISIE, rien d'autre", () => {
    for (const valeur of ["accueil-ouverture", "accueil-final", "accueil-colle", "accueil-etapes"]) assert.equal(lireDepuis(valeur), valeur);
    for (const valeur of [null, undefined, "", "Accueil", "accueil ouverture", "a".repeat(41), "<script>", "x@y.fr", "0612345678+33"]) assert.equal(lireDepuis(valeur), null, String(valeur));
    const partis: { type: EtapeEntonnoir; meta: Record<string, unknown> }[] = [];
    const e = creerEmetteur((type, meta) => partis.push({ type, meta }));
    const depuis = lireDepuis(new URLSearchParams("projet=cuisine&depuis=accueil-ouverture").get("depuis"));
    e.marquer("PIECE_CHOISIE", { projet: "cuisine", ...(depuis ? { depuis } : {}) });
    assert.deepEqual(partis, [{ type: "PIECE_CHOISIE", meta: { projet: "cuisine", depuis: "accueil-ouverture" } }]);
    // Le simulateur lit le paramètre au montage et ne le met que dans PIECE_CHOISIE.
    const simulateur = readFileSync(path.join(process.cwd(), "src/app/simulateur/_components/Simulateur.tsx"), "utf8");
    assert.match(simulateur, /depuisLien\.current = lireDepuis\(parametres\.get\("depuis"\)\);/);
    assert.match(simulateur, /marquer\("PIECE_CHOISIE", \{ projet: id, \.\.\.\(depuisLien\.current \? \{ depuis: depuisLien\.current \} : \{\}\) \}\)/);
    assert.equal(simulateur.split("depuisLien.current").length - 1, 3, "lu une fois, écrit dans PIECE_CHOISIE seulement");
  });
});
