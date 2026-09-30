import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { debuterSondage, decisionAuMontage, etapesCochees, migrerEtat, reduireSondage, texteAttente, MESSAGE_DELAI, MESSAGE_ECHEC_GENERIQUE, MESSAGE_INJOIGNABLE, MESSAGE_INTROUVABLE, MESSAGE_SANS_PHOTO, REPRISE_MAX_MS, type EtatSimulateur } from "./reprise";

/** Mission 15 (partie 1) — fonctions pures de la reprise du simulateur (aucun réseau, aucune génération). */

const PHOTO = "data:image/jpeg;base64,AAAA";
const etatV2 = (extra: Partial<EtatSimulateur> = {}): EtatSimulateur => ({ projet: "cuisine", photo: PHOTO, selections: {}, parcoursId: "aaaaaaaa-1500-4000-8000-000000000001", travailEnCours: null, rendus: [], majLe: Date.now() - 60_000, ...extra });

describe("migration de l'état v1 → v2", () => {
  test("l'ancien état repart sans image : identifiants gardés dans rendus, résultat et rendusLocaux abandonnés", () => {
    const v1 = { projet: "salle-de-bain", photo: PHOTO, selections: { "meuble-vasque": { ref: "NE31", nom: "Chêne", famille: "bois", finition: "Soft", categorie: "x", tags: ["a"], image: "https://s3/NE31.jpg" } }, resultat: { image: "data:image/png;base64,BBBB", avant: null, simulationSiteId: "cmun12345678", references: [{ zone: "meuble-vasque", libelle: "Meuble vasque", ref: "NE31", nom: "Chêne" }] }, simulationSiteIds: ["cmun12345678", "cmun87654321"], rendusLocaux: [{ avant: "data:...", apres: "data:...", references: [] }], majLe: 1700000000000 };
    const etat = migrerEtat(v1);
    assert.ok(etat);
    assert.deepEqual([etat.projet, etat.photo, etat.parcoursId, etat.travailEnCours, etat.majLe], ["salle-de-bain", PHOTO, null, null, 1700000000000]);
    assert.equal(etat.selections["meuble-vasque"]?.ref, "NE31");
    assert.deepEqual(etat.rendus.map((r) => [r.simulationSiteId, r.urlApres, r.references.length]), [["cmun12345678", "", 1], ["cmun87654321", "", 0]]);
    assert.ok(!("resultat" in etat) && !("rendusLocaux" in etat));
  });

  test("un état v2 revient tel quel ; l'illisible donne null ou l'état vide", () => {
    const v2 = { version: 2, projet: "meubles", photo: null, selections: {}, parcoursId: "p", travailEnCours: { travailId: "cmun000000000001", lanceLe: 5, attenteEstimeeS: 90 }, rendus: [{ travailId: "cmun000000000002", simulationSiteId: null, urlApres: "https://crm/api/simulate/image?id=x", urlAvant: null, references: [], le: 7 }], majLe: 9 };
    const etat = migrerEtat(v2);
    assert.deepEqual(etat?.travailEnCours, { travailId: "cmun000000000001", lanceLe: 5, attenteEstimeeS: 90 });
    assert.equal(etat?.rendus[0].urlApres, "https://crm/api/simulate/image?id=x");
    assert.equal(migrerEtat(null), null);
    assert.equal(migrerEtat("n'importe quoi"), null);
    assert.deepEqual(migrerEtat({}), { projet: "cuisine", photo: null, selections: {}, parcoursId: null, travailEnCours: null, rendus: [], majLe: 0 });
  });
});

describe("décision au montage", () => {
  test("travail en cours → reprise du sondage ; ?reprise= (lien du mail) ouvre ce travail même sans état, et adopte le parcours du lien", () => {
    const travail = { travailId: "cmun000000000001", lanceLe: 1, attenteEstimeeS: 75 };
    assert.deepEqual(decisionAuMontage(etatV2({ travailEnCours: travail })), { ecran: "attente", travail });
    const lien = decisionAuMontage(null, { reprise: "cmun000000000009", maintenant: 42 });
    assert.deepEqual(lien, { ecran: "attente", travail: { travailId: "cmun000000000009", lanceLe: 42, attenteEstimeeS: 0 } });
    // Lien complet (travail + parcours) sans mémoire locale : c'est CE parcours qui sonde, pas un parcours neuf (→ 404).
    const complet = decisionAuMontage(null, { reprise: "cmun000000000009", p: "aaaaaaaa-1500-4000-8000-000000000009", maintenant: 42 });
    assert.deepEqual(complet, { ecran: "attente", travail: { travailId: "cmun000000000009", lanceLe: 42, attenteEstimeeS: 0 }, parcoursId: "aaaaaaaa-1500-4000-8000-000000000009" });
    assert.ok(!("parcoursId" in decisionAuMontage(null, { reprise: "cmun000000000009", p: "../etc" })), "un parcours mal formé est ignoré");
    assert.deepEqual(decisionAuMontage(null, { reprise: "../etc" }), { ecran: "direct", etape: 1 }, "un identifiant mal formé est ignoré");
  });

  test("parcours récent → bandeau (étape 3 si un rendu existe, sinon 2) ; depuis l'accueil → direct ; trop vieux → étape 1", () => {
    const maintenant = Date.now();
    assert.deepEqual(decisionAuMontage(etatV2(), { maintenant }), { ecran: "bandeau", etape: 2 });
    const avecRendu = etatV2({ rendus: [{ travailId: "cmun000000000002", simulationSiteId: "s", urlApres: "https://crm/image", urlAvant: null, references: [], le: maintenant }] });
    assert.deepEqual(decisionAuMontage(avecRendu, { maintenant }), { ecran: "bandeau", etape: 3 });
    assert.deepEqual(decisionAuMontage(etatV2(), { maintenant, depuisAccueil: true }), { ecran: "direct", etape: 2 });
    assert.deepEqual(decisionAuMontage(etatV2({ majLe: maintenant - REPRISE_MAX_MS - 1 }), { maintenant }), { ecran: "direct", etape: 1 });
    assert.deepEqual(decisionAuMontage(etatV2({ photo: null }), { maintenant }), { ecran: "direct", etape: 1 });
    assert.deepEqual(decisionAuMontage(null), { ecran: "direct", etape: 1 });
  });
});

describe("machine d'état du sondage", () => {
  const depart = debuterSondage({ travailId: "cmun000000000001", lanceLe: 1_000, attenteEstimeeS: 75 });

  test("en attente puis en cours → continuer (étape et attente mises à jour) ; PRETE → prêt ; ECHEC → échec avec la raison", () => {
    const c1 = reduireSondage(depart, { type: "reponse", reponse: { statut: "EN_ATTENTE", etape: null, attenteEstimeeS: 60 } }, 2_000);
    assert.equal(c1.suite, "continuer");
    assert.deepEqual([c1.etat.statut, c1.etat.attenteEstimeeS, c1.etat.etape, c1.etat.horsLigne], ["EN_ATTENTE", 60, null, false]);
    const c2 = reduireSondage(c1.etat, { type: "reponse", reponse: { statut: "EN_COURS", etape: "rendu" } }, 5_000);
    assert.equal(c2.suite, "continuer");
    assert.deepEqual([c2.etat.statut, c2.etat.etape, c2.etat.attenteEstimeeS], ["EN_COURS", "rendu", 60]);
    const pret = reduireSondage(c2.etat, { type: "reponse", reponse: { statut: "PRETE", simulationSiteId: "s1", references: [] } }, 60_000);
    assert.equal(pret.suite, "pret");
    if (pret.suite === "pret") assert.equal(pret.reponse.simulationSiteId, "s1");
    const echec = reduireSondage(c2.etat, { type: "reponse", reponse: { statut: "ECHEC", erreur: { raison: "photo-refusee", message: "Cette photo…" } } }, 60_000);
    assert.deepEqual(echec.suite === "echec" ? [echec.raison, echec.message] : null, ["photo-refusee", "Cette photo…"]);
  });

  test("réseau coupé ou 5xx → continuer hors ligne, sans abandonner avant 10 min ; 404 → introuvable ; EN_COURS depuis plus de 10 min (demarreLe du CRM) → délai, jamais en file d'attente", () => {
    const r1 = reduireSondage(depart, { type: "reseau" }, 4_000);
    assert.equal(r1.suite, "continuer");
    assert.deepEqual([r1.etat.horsLigne, r1.etat.echecsReseau], [true, 1]);
    const r2 = reduireSondage(r1.etat, { type: "http", status: 503 }, 7_000);
    assert.equal(r2.suite, "continuer");
    assert.equal(r2.etat.echecsReseau, 2);
    const retour = reduireSondage(r2.etat, { type: "reponse", reponse: { statut: "EN_COURS", etape: "rendu" } }, 10_000);
    assert.deepEqual([retour.suite, retour.etat.horsLigne, retour.etat.echecsReseau], ["continuer", false, 0]);
    const abandon = reduireSondage(r2.etat, { type: "reseau" }, 1_000 + 10 * 60_000 + 1);
    assert.equal(abandon.suite, "echec");
    if (abandon.suite === "echec") assert.equal(abandon.raison, "injoignable");
    const introuvable = reduireSondage(depart, { type: "http", status: 404 }, 4_000);
    assert.equal(introuvable.suite === "echec" ? introuvable.raison : null, "introuvable");
    // Même règle que le CRM : 10 min EN_COURS, comptées depuis `demarreLe` (pas depuis le lancement côté navigateur).
    const demarreLe = new Date(1_000_000).toISOString();
    const enCours = reduireSondage(depart, { type: "reponse", reponse: { statut: "EN_COURS", etape: "rendu", demarreLe } }, 1_000_000 + 10 * 60_000);
    assert.equal(enCours.suite, "continuer", "10 min tout juste : on continue");
    const perdu = reduireSondage(depart, { type: "reponse", reponse: { statut: "EN_COURS", etape: "rendu", demarreLe } }, 1_000_000 + 10 * 60_000 + 1);
    assert.deepEqual(perdu.suite === "echec" ? [perdu.raison, perdu.message] : null, ["delai", MESSAGE_DELAI]);
    // Sans `demarreLe` (ancien CRM), le lancement sert de repère — seulement EN_COURS.
    assert.equal(reduireSondage(depart, { type: "reponse", reponse: { statut: "EN_COURS" } }, 1_000 + 10 * 60_000 + 1).suite, "echec");
    // En file d'attente (campagne : plus de deux générations en parallèle), le navigateur attend tant que le CRM ne dit pas ECHEC.
    const enFile = reduireSondage(depart, { type: "reponse", reponse: { statut: "EN_ATTENTE" } }, 1_000 + 25 * 60_000);
    assert.deepEqual([enFile.suite, enFile.etat.statut], ["continuer", "EN_ATTENTE"]);
    // Aucun message ne répète le titre de l'écran (« Nous n'avons pas réussi cette fois-ci. »).
    for (const message of [MESSAGE_DELAI, MESSAGE_ECHEC_GENERIQUE, MESSAGE_INJOIGNABLE, MESSAGE_INTROUVABLE, MESSAGE_SANS_PHOTO]) assert.doesNotMatch(message, /Nous n'avons pas réussi/);
  });
});

describe("écran d'attente", () => {
  test("étape → cases cochées : rendu coche les deux premières, PRETE tout, rien avant l'analyse", () => {
    assert.deepEqual(etapesCochees("rendu"), [true, true, false]);
    assert.deepEqual(etapesCochees("matieres"), [true, false, false]);
    assert.deepEqual(etapesCochees("analyse"), [false, false, false]);
    assert.deepEqual(etapesCochees(null, "EN_ATTENTE"), [false, false, false]);
    assert.deepEqual(etapesCochees("rendu", "PRETE"), [true, true, true]);
  });

  test("attente en mots, arrondie à 15 s", () => {
    assert.equal(texteAttente(75), "environ 1 min 15");
    assert.equal(texteAttente(88), "environ 1 min 30");
    assert.equal(texteAttente(120), "environ 2 min");
    assert.equal(texteAttente(40), "environ 45 s");
    assert.equal(texteAttente(0), "environ 15 s");
  });
});
