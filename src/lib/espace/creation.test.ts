import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Creation, Piece } from "@/components/espace/api";
import { choixDepuisSimulation, ecranAtteignableCreation, ecranDeDepart, filmsChoisis, idDePiece, pieceDesZones, piecesDeCreation, raisonBloque, reduireCreation, reduireSuivi, statutAttente, texteQuota, zonesChoisies, zonesMaxDe, zonesOrdonnees, type ChoixCreation } from "./creation";

/**
 * Mission 15 (partie 5) — le parcours « Créer une simulation » de l'espace :
 * les pièces telles que le CRM les donne (murs et tablier de baignoire
 * proposés), les trois écrans et leurs gestes, le lancement, le suivi.
 */

/** Ce que le CRM rend depuis la source unique (partie 5), pour un projet salle de bain. */
const PIECES: Piece[] = [
  { piece: "SDB", id: "salle-de-bain", libelle: "Salle de bain", aide: "Meuble vasque, plan, murs carrelés, baignoire", zones: [{ zone: "carrelage-mural", libelle: "Murs carrelés" }, { zone: "meuble-vasque", libelle: "Meuble vasque" }, { zone: "plan-vasque", libelle: "Plan vasque" }, { zone: "tablier-baignoire", libelle: "Tablier de baignoire" }], cochees: ["carrelage-mural"], duProjet: true },
  { piece: "CUISINE", id: "cuisine", libelle: "Cuisine", aide: "Façades, plan de travail, crédence", zones: [{ zone: "meubles-hauts", libelle: "Meubles hauts" }, { zone: "meubles-bas", libelle: "Meubles bas" }, { zone: "plan-de-travail", libelle: "Plan de travail" }, { zone: "credence", libelle: "Crédence" }], cochees: [], duProjet: false },
  { piece: "MEUBLES", id: "meubles", libelle: "Meubles", aide: "Dressing, placards, meuble TV, commode", zones: [{ zone: "portes-dressing", libelle: "Portes du dressing" }, { zone: "meuble-tv", libelle: "Meuble TV" }, { zone: "meuble-complet", libelle: "Commode, buffet, bureau" }], cochees: [], duProjet: false },
  { piece: "MURS", id: "mur-plafond", libelle: "Murs, plafond", aide: "Un mur, deux murs, le plafond", zones: [{ zone: "mur-principal", libelle: "Mur principal" }, { zone: "mur-accent", libelle: "Second mur" }, { zone: "plafond", libelle: "Plafond" }], cochees: [], duProjet: false },
  { piece: "PRO", id: "professionnel", libelle: "Local professionnel", aide: "Bar, comptoir, mobilier, rangements", zones: [{ zone: "comptoir-habillage", libelle: "Façade du bar" }, { zone: "comptoir-plateau", libelle: "Plateau du bar" }, { zone: "mobilier-pro", libelle: "Mobilier" }, { zone: "rangements-pro", libelle: "Rangements" }, { zone: "habillage-mural", libelle: "Habillage mural" }], cochees: [], duProjet: false },
];
const CREATION: Creation = { gratuites: 5, accordees: 0, faites: 2, restantes: 3, enCours: [], enRelecture: [], demandeesLe: null, disponible: true, zones: PIECES[0].zones, zonesProjet: ["carrelage-mural"], piece: "SDB", pieces: PIECES, zonesMax: 4 };
const SDB = PIECES[0];

describe("les pièces et les zones viennent du CRM", () => {
  test("MURS et le tablier de baignoire sont proposés ; sa pièce d'abord ; la limite et le dessin de la carte", () => {
    const pieces = piecesDeCreation(CREATION);
    assert.deepEqual(pieces.map((p) => p.piece), ["SDB", "CUISINE", "MEUBLES", "MURS", "PRO"]);
    assert.deepEqual(pieces.find((p) => p.piece === "MURS")?.zones.map((z) => z.zone), ["mur-principal", "mur-accent", "plafond"]);
    assert.ok(pieces[0].zones.some((z) => z.zone === "tablier-baignoire"));
    assert.equal(zonesMaxDe(CREATION), 4);
    assert.equal(zonesMaxDe({ zonesMax: 3 }), 3);
    assert.equal(zonesMaxDe(null), 4, "sans le CRM : 4");
    assert.deepEqual(pieces.map(idDePiece), ["salle-de-bain", "cuisine", "meubles", "mur-plafond", "professionnel"]);
    assert.equal(idDePiece({ piece: "MURS" }), "mur-plafond", "un état d'avant la partie 5 retrouve le dessin par le code");
  });

  test("un état d'avant (une seule pièce, sans `pieces`) reste lisible ; les zones cochées viennent d'abord", () => {
    const ancien = piecesDeCreation({ piece: "CUISINE", zones: [{ zone: "plan-de-travail", libelle: "Plan de travail" }] });
    assert.deepEqual(ancien.map((p) => [p.piece, p.libelle, p.zones.length]), [["CUISINE", "Votre projet", 1]]);
    assert.deepEqual(piecesDeCreation(null).map((p) => p.piece), ["CUISINE"]);
    const piece: Piece = { piece: "CUISINE", libelle: "Cuisine", aide: "", zones: [{ zone: "meubles-hauts", libelle: "Meubles hauts" }, { zone: "plan-de-travail", libelle: "Plan de travail" }], cochees: ["plan-de-travail"] };
    assert.deepEqual(zonesOrdonnees(piece).map((z) => z.zone), ["plan-de-travail", "meubles-hauts"]);
  });

  test("« Essayer d'autres matières » : la pièce est retrouvée d'après les zones, les teintes reprises, la photo à choisir", () => {
    const zones = [{ zone: "plan-de-travail", libelle: "Plan de travail", ref: "MK15", nom: "Raw Travertine" }, { zone: "meubles-bas", libelle: "Meubles bas", ref: "D1", nom: "" }];
    assert.equal(pieceDesZones(PIECES, zones).piece, "CUISINE");
    const choix = choixDepuisSimulation(PIECES, zones);
    assert.deepEqual(choix, { piece: "CUISINE", photoId: null, teintes: { "plan-de-travail": { ref: "MK15", nom: "Raw Travertine" }, "meubles-bas": { ref: "D1", nom: "D1" } } });
    assert.equal(pieceDesZones(PIECES, []).piece, "SDB", "sans zone : sa pièce");
    assert.equal(pieceDesZones(PIECES, [{ zone: "inconnue" }]).piece, "SDB");
  });
});

describe("les trois écrans : Pièce · Photo · Matières", () => {
  const vide: ChoixCreation = { piece: "SDB", photoId: null, teintes: {} };

  test("atteignables : toujours en arrière, en avant jusqu'à ce qui est fait, rien pendant le lancement", () => {
    assert.equal(ecranAtteignableCreation({ pieceChoisie: false, photoId: null }, 2, 1), false);
    assert.equal(ecranAtteignableCreation({ pieceChoisie: true, photoId: null }, 2, 1), true);
    assert.equal(ecranAtteignableCreation({ pieceChoisie: true, photoId: null }, 3, 1), false);
    assert.equal(ecranAtteignableCreation({ pieceChoisie: true, photoId: "p1" }, 3, 1), true);
    assert.equal(ecranAtteignableCreation({ pieceChoisie: true, photoId: "p1" }, 1, 3), true);
    assert.equal(ecranAtteignableCreation({ pieceChoisie: true, photoId: "p1", generationEnCours: true }, 1, 3), false);
    assert.equal(ecranDeDepart({ ...vide, photoId: "p1" }, true), 3, "un choix repris après un échec repart aux matières");
    assert.equal(ecranDeDepart(vide, false), 1);
  });

  test("les gestes : changer de pièce vide seulement les matières ; reprendre la photo les garde ; « appliquer aussi à »", () => {
    let t = reduireCreation(1, vide, { type: "piece-choisie", piece: "SDB" });
    assert.deepEqual([t.ecran, t.choix], [2, vide]);
    t = reduireCreation(2, t.choix, { type: "photo-choisie", photoId: "p1" });
    assert.deepEqual([t.ecran, t.choix.photoId], [3, "p1"]);
    t = reduireCreation(3, t.choix, { type: "teinte-choisie", zone: "meuble-vasque", teinte: { ref: "D1", nom: "Classic Walnut" }, aussi: ["plan-vasque"] });
    assert.deepEqual(Object.keys(t.choix.teintes).sort(), ["meuble-vasque", "plan-vasque"]);
    assert.equal(t.choix.teintes["plan-vasque"].ref, "D1", "le même film sur les deux zones");
    t = reduireCreation(3, t.choix, { type: "photo-reprise" });
    assert.deepEqual([t.ecran, Object.keys(t.choix.teintes).length, t.choix.photoId], [2, 2, "p1"], "la photo se reprend sans perdre les matières");
    t = reduireCreation(2, t.choix, { type: "photo-choisie", photoId: "p2" });
    assert.deepEqual([t.ecran, t.choix.photoId, Object.keys(t.choix.teintes).length], [3, "p2", 2]);
    t = reduireCreation(3, t.choix, { type: "teinte-retiree", zone: "plan-vasque" });
    assert.deepEqual([t.ecran, Object.keys(t.choix.teintes)], [3, ["meuble-vasque"]]);
    const meme = reduireCreation(3, t.choix, { type: "piece-choisie", piece: "SDB" });
    assert.deepEqual([meme.ecran, meme.choix], [2, t.choix], "même pièce : rien ne change");
    const autre = reduireCreation(3, t.choix, { type: "piece-choisie", piece: "MURS" });
    assert.deepEqual([autre.ecran, autre.choix], [2, { piece: "MURS", photoId: "p2", teintes: {} }], "autre pièce : matières vidées, photo gardée");
    assert.deepEqual(reduireCreation(3, t.choix, { type: "retour", vers: 1 }).ecran, 1);
    assert.deepEqual(reduireCreation(3, t.choix, { type: "retour", vers: 1 }, { generationEnCours: true }).ecran, 3, "rien ne bouge pendant le lancement");
    assert.deepEqual(reduireCreation(1, { ...vide, photoId: null }, { type: "retour", vers: 3 }).ecran, 1, "pas en avant sans photo");
    assert.deepEqual(reduireCreation(3, t.choix, { type: "tout-recommencer" }), { ecran: 1, choix: { piece: "SDB", photoId: null, teintes: {} } });
  });
});

describe("le lancement", () => {
  test("ce qui bloque, dans l'ordre : la photo, une matière, la limite du CRM ; les zones choisies dans l'ordre de la pièce", () => {
    const sansPhoto: ChoixCreation = { piece: "SDB", photoId: null, teintes: { "meuble-vasque": { ref: "D1", nom: "Noyer" } } };
    assert.match(raisonBloque(SDB, sansPhoto, 4) ?? "", /photo/);
    assert.match(raisonBloque(SDB, { ...sansPhoto, photoId: "p1", teintes: {} }, 4) ?? "", /au moins une matière/);
    const quatre: ChoixCreation = { piece: "SDB", photoId: "p1", teintes: Object.fromEntries(SDB.zones.map((z) => [z.zone, { ref: "AB02", nom: "Creamy" }])) };
    assert.equal(raisonBloque(SDB, quatre, 4), null);
    assert.match(raisonBloque(SDB, quatre, 3) ?? "", /3 zones au plus/);
    const choisies = zonesChoisies(SDB, { piece: "SDB", photoId: "p1", teintes: { "tablier-baignoire": { ref: "AL23", nom: "Grey Marble" }, "carrelage-mural": { ref: "AL23", nom: "Grey Marble" } } });
    assert.deepEqual(choisies.map((z) => z.zone), ["carrelage-mural", "tablier-baignoire"], "les zones cochées d'abord, puis l'ordre de la pièce");
  });

  test("une teinte sur une zone que l'analyse ne voit pas bloque le lancement (le CRM la refuserait) ; sans analyse, rien ne bloque", () => {
    const tablier: ChoixCreation = { piece: "SDB", photoId: "p1", teintes: { "tablier-baignoire": { ref: "AL23", nom: "Grey Marble" }, "carrelage-mural": { ref: "AL23", nom: "Grey Marble" } } };
    const analyse = { empreinte: "e", statut: "PRETE" as const, zonesVisibles: ["carrelage-mural", "meuble-vasque"], zonesNonVisibles: ["tablier-baignoire"], verdict: "bonne" as const, conseil: null, raison: null };
    assert.equal(raisonBloque(SDB, tablier, 4), null, "analyse inconnue : on lance (jamais à l'aveugle)");
    assert.equal(raisonBloque(SDB, tablier, 4, { ...analyse, statut: "EN_COURS" }), null, "analyse en cours : on lance");
    assert.match(raisonBloque(SDB, tablier, 4, analyse) ?? "", /^Cette zone n'est pas visible sur votre photo : Tablier de baignoire\. Retirez-la, ou reprenez une photo\.$/);
    const deux = { ...analyse, zonesNonVisibles: ["tablier-baignoire", "carrelage-mural"], zonesVisibles: ["meuble-vasque"] };
    assert.match(raisonBloque(SDB, tablier, 4, deux) ?? "", /^Ces zones ne sont pas visibles sur votre photo : Murs carrelés, Tablier de baignoire\. Retirez-les/);
    assert.equal(raisonBloque(SDB, { ...tablier, teintes: { "carrelage-mural": tablier.teintes["carrelage-mural"] } }, 4, analyse), null, "la zone retirée : on lance");
  });

  test("les films de l'écran d'attente et le texte du quota", () => {
    const films = filmsChoisis([{ zone: "meuble-vasque", libelle: "Meuble vasque", ref: "D1", nom: "Classic Walnut" }, { zone: "plafond", libelle: "", ref: "", nom: "" }], (ref) => `/v/${ref}`);
    assert.deepEqual(films, [{ zone: "meuble-vasque", libelle: "Meuble vasque", nom: "Classic Walnut", image: "/v/D1" }, { zone: "plafond", libelle: "plafond", nom: "", image: null }]);
    assert.equal(texteQuota(3, 5), "Il vous en reste 3 sur 5.");
    assert.equal(texteQuota(1, 5), "Il vous en reste 1 sur 5 : c'est la dernière.");
    assert.equal(texteQuota(0, 5), "Vous avez utilisé vos 5 simulations.");
    assert.equal(texteQuota(0, 1), "Vous avez utilisé votre simulation.");
  });
});

describe("le suivi d'une génération", () => {
  test("en file sans étape, en cours avec ; prête, relecture, échec, oubliée, hors ligne", () => {
    assert.equal(statutAttente({ etape: null }), "EN_ATTENTE");
    assert.equal(statutAttente({ etape: "matieres" }), "EN_COURS");
    assert.deepEqual(reduireSuivi({ type: "reponse", reponse: { statut: "EN_COURS", etape: "rendu", attenteEstimeeS: 80, simulationId: null, message: null, raison: null } }), { suite: "continuer", etape: "rendu", attenteEstimeeS: 80, horsLigne: false });
    assert.deepEqual(reduireSuivi({ type: "reponse", reponse: { statut: "PRETE", simulationId: "s1", message: null, raison: null } }), { suite: "prete", simulationId: "s1" });
    const relecture = reduireSuivi({ type: "reponse", reponse: { statut: "RELECTURE", simulationId: "s2", message: "Votre simulation demande une relecture : vous la recevrez dès qu'elle est prête.", raison: null } });
    assert.deepEqual(relecture, { suite: "relecture", simulationId: "s2", message: "Votre simulation demande une relecture : vous la recevrez dès qu'elle est prête." });
    assert.deepEqual(reduireSuivi({ type: "reponse", reponse: { statut: "ECHEC", simulationId: null, message: "La génération a été interrompue par une mise à jour du service. Elle ne compte pas : relancez-la.", raison: "interrompue" } }), { suite: "echec", raison: "interrompue", message: "La génération a été interrompue par une mise à jour du service. Elle ne compte pas : relancez-la." });
    assert.deepEqual(reduireSuivi({ type: "http", status: 404 }), { suite: "oubliee" });
    assert.deepEqual(reduireSuivi({ type: "http", status: 503 }), { suite: "continuer", etape: null, attenteEstimeeS: null, horsLigne: true });
    assert.deepEqual(reduireSuivi({ type: "reseau" }), { suite: "continuer", etape: null, attenteEstimeeS: null, horsLigne: true });
    assert.equal(reduireSuivi({ type: "http", status: 401 }).suite, "echec");
  });
});
