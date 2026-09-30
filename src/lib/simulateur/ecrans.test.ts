import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ecranAtteignable, ecranDepuisEtape, ecranMax, reduireEcran, type Progression } from "./ecrans";
import { titrePiece, ZONES_REPLI } from "./zones";

/** Mission 15 (partie 4) — la machine d'état des quatre écrans : retour arrière sans perte, titre par pièce. */

const PHOTO = "data:image/jpeg;base64,AAAA";
const rendu = { travailId: "cmun000000000002", simulationSiteId: "s", urlApres: "https://crm/image", urlAvant: null, references: [], le: 1 };
const sansRien: Progression = { photo: null, rendus: [], travailEnCours: null };
const avecPhoto: Progression = { photo: PHOTO, rendus: [], travailEnCours: null };
const avecRendu: Progression = { photo: PHOTO, rendus: [rendu], travailEnCours: null };

describe("écrans atteignables", () => {
  test("on va aussi loin que ce qui est fait : rien → pièce ; photo → matières ; rendu → résultat ; toujours en arrière", () => {
    assert.equal(ecranMax(sansRien), 1);
    assert.equal(ecranMax(avecPhoto), 3);
    assert.equal(ecranMax(avecRendu), 4);
    assert.equal(ecranAtteignable(avecPhoto, 4, 3), false);
    assert.equal(ecranAtteignable(avecPhoto, 2, 3), true);
    assert.equal(ecranAtteignable(avecPhoto, 1, 3), true);
    assert.equal(ecranAtteignable(avecRendu, 4, 3), true);
    assert.equal(ecranAtteignable(sansRien, 2, 1), false, "pas de photo : l'écran photo se gagne en choisissant la pièce");
  });

  test("pendant une génération (travail en cours ou lancement), rien ne bouge", () => {
    const enCours: Progression = { ...avecPhoto, travailEnCours: { travailId: "cmun000000000001", lanceLe: 1, attenteEstimeeS: 75 } };
    assert.equal(ecranAtteignable(enCours, 2, 3), false);
    assert.equal(ecranAtteignable(enCours, 3, 3), true);
    assert.equal(ecranAtteignable({ ...avecPhoto, generationEnCours: true }, 1, 3), false);
    assert.equal(reduireEcran(3, { type: "retour", vers: 1 }, enCours).ecran, 3);
  });
});

describe("gestes et retour arrière sans perte", () => {
  test("choisir la même pièce garde les matières ; une autre pièce vide seulement les matières", () => {
    assert.deepEqual(reduireEcran(1, { type: "piece-choisie", projet: "cuisine", projetPrecedent: "cuisine" }, avecPhoto), { ecran: 2, viderSelections: false });
    assert.deepEqual(reduireEcran(1, { type: "piece-choisie", projet: "meubles", projetPrecedent: "cuisine" }, avecPhoto), { ecran: 2, viderSelections: true });
  });

  test("photo chargée → matières ; reprendre la photo → écran photo, matières gardées ; résultat reçu → résultat", () => {
    assert.deepEqual(reduireEcran(2, { type: "photo-chargee" }, avecPhoto), { ecran: 3, viderSelections: false });
    assert.deepEqual(reduireEcran(3, { type: "photo-reprise" }, avecPhoto), { ecran: 2, viderSelections: false });
    assert.deepEqual(reduireEcran(3, { type: "generation-lancee" }, avecPhoto), { ecran: 3, viderSelections: false });
    assert.deepEqual(reduireEcran(3, { type: "resultat-recu" }, avecRendu), { ecran: 4, viderSelections: false });
  });

  test("« Essayer d'autres matières » revient aux matières avec la photo et les choix ; sans photo sur cet appareil, à la photo", () => {
    assert.deepEqual(reduireEcran(4, { type: "autres-matieres" }, avecRendu), { ecran: 3, viderSelections: false });
    assert.deepEqual(reduireEcran(4, { type: "autres-matieres" }, { ...avecRendu, photo: null }), { ecran: 2, viderSelections: false });
  });

  test("retour par le fil : seulement vers un écran atteignable, jamais en vidant quoi que ce soit", () => {
    assert.deepEqual(reduireEcran(4, { type: "retour", vers: 2 }, avecRendu), { ecran: 2, viderSelections: false });
    assert.deepEqual(reduireEcran(2, { type: "retour", vers: 4 }, avecPhoto), { ecran: 2, viderSelections: false });
    assert.deepEqual(reduireEcran(2, { type: "retour", vers: 3 }, avecPhoto), { ecran: 3, viderSelections: false });
  });

  test("écran de départ d'après la décision de reprise", () => {
    assert.equal(ecranDepuisEtape(1, sansRien), 1);
    assert.equal(ecranDepuisEtape(2, avecPhoto), 3);
    assert.equal(ecranDepuisEtape(2, sansRien), 1);
    assert.equal(ecranDepuisEtape(3, avecRendu), 4);
    assert.equal(ecranDepuisEtape(3, avecPhoto), 3, "étape 3 sans rendu affichable : les matières");
  });
});

describe("titre par pièce (libellés du CRM)", () => {
  test("« Votre cuisine », « Vos meubles », « Vos murs », « Votre espace pro » ; cuisine à défaut", () => {
    assert.equal(titrePiece(ZONES_REPLI, "cuisine"), "Votre cuisine");
    assert.equal(titrePiece(ZONES_REPLI, "salle-de-bain"), "Votre salle de bain");
    assert.equal(titrePiece(ZONES_REPLI, "meubles"), "Vos meubles");
    assert.equal(titrePiece(ZONES_REPLI, "mur-plafond"), "Vos murs");
    assert.equal(titrePiece(ZONES_REPLI, "professionnel"), "Votre espace pro");
    assert.equal(titrePiece(ZONES_REPLI, "garage"), "Votre cuisine");
  });
});
