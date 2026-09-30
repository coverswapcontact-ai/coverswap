import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DUREE_PARCOURS_MS, ETAT_VIDE, REPRISE_MAX_MS, decisionAuMontage, memoireDuParcours, migrerEtat, naissanceDuParcours, type EtatSimulateur } from "./reprise";

/**
 * Mission 17 (partie B) : le parcours gardé en IndexedDB n'est pas un identifiant persistant. 7 jours au plus depuis
 * sa naissance, jamais prolongés par l'usage ; au-delà, la mémoire repart de zéro (nouveau parcours).
 */
const JOUR = 24 * 60 * 60 * 1000;
const MAINTENANT = 1_790_000_000_000;
const etat = (extra: Partial<EtatSimulateur> = {}): EtatSimulateur => ({ ...ETAT_VIDE, photo: "data:image/jpeg;base64,AAAA", parcoursId: "aaaaaaaa-1700-4000-8000-000000000002", parcoursNeLe: MAINTENANT - JOUR, majLe: MAINTENANT - 60_000, ...extra });

describe("durée de vie du parcours du simulateur", () => {
  test("7 jours, et la reprise ne va pas au-delà", () => {
    assert.equal(DUREE_PARCOURS_MS, 7 * JOUR);
    assert.equal(REPRISE_MAX_MS, DUREE_PARCOURS_MS);
  });

  test("sous 7 jours : la mémoire est rendue telle quelle (une simulation en cours se reprend)", () => {
    const enCours = etat({ parcoursNeLe: MAINTENANT - 6 * JOUR, travailEnCours: { travailId: "cmun000000000017", lanceLe: MAINTENANT - 60_000, attenteEstimeeS: 90 } });
    assert.equal(memoireDuParcours(enCours, MAINTENANT), enCours);
    assert.equal(decisionAuMontage(memoireDuParcours(enCours, MAINTENANT), { maintenant: MAINTENANT }).ecran, "attente");
    assert.equal(memoireDuParcours(etat({ parcoursNeLe: MAINTENANT - DUREE_PARCOURS_MS }), MAINTENANT)?.parcoursId, "aaaaaaaa-1700-4000-8000-000000000002", "pile 7 jours : encore valable");
  });

  test("au-delà de 7 jours depuis la naissance : plus rien, même si la personne est revenue hier (jamais prolongé)", () => {
    const ancien = etat({ parcoursNeLe: MAINTENANT - DUREE_PARCOURS_MS - 1, majLe: MAINTENANT - JOUR });
    assert.equal(memoireDuParcours(ancien, MAINTENANT), null);
    // Sans mémoire, le montage repart de la première étape : un nouveau parcours.
    assert.deepEqual(decisionAuMontage(memoireDuParcours(ancien, MAINTENANT), { maintenant: MAINTENANT }), { ecran: "direct", etape: 1 });
  });

  test("une naissance dans le futur (horloge changée) expire ; pas de mémoire, rien à expirer", () => {
    assert.equal(memoireDuParcours(etat({ parcoursNeLe: MAINTENANT + JOUR }), MAINTENANT), null);
    assert.equal(memoireDuParcours(null, MAINTENANT), null);
  });

  test("mémoire d'avant la mission 17 (sans naissance) : la dernière mise à jour en tient lieu, une seule fois", () => {
    const brut = { version: 2, projet: "cuisine", photo: null, selections: {}, parcoursId: "aaaaaaaa-1700-4000-8000-000000000003", rendus: [], majLe: MAINTENANT - 2 * JOUR };
    const lu = migrerEtat(brut);
    assert.equal(lu?.parcoursNeLe, MAINTENANT - 2 * JOUR);
    assert.ok(memoireDuParcours(lu, MAINTENANT));
    assert.equal(memoireDuParcours(migrerEtat({ ...brut, majLe: MAINTENANT - 8 * JOUR }), MAINTENANT), null);
    // Une fois montée, la naissance est fixée : les enregistrements suivants (qui repoussent majLe) ne la bougent plus.
    assert.equal(naissanceDuParcours(lu, "aaaaaaaa-1700-4000-8000-000000000003", MAINTENANT), MAINTENANT - 2 * JOUR);
  });

  test("naissance au montage : gardée pour le même parcours, maintenant pour un parcours neuf (ou celui d'un lien)", () => {
    const memoire = etat({ parcoursNeLe: MAINTENANT - 3 * JOUR });
    assert.equal(naissanceDuParcours(memoire, "aaaaaaaa-1700-4000-8000-000000000002", MAINTENANT), MAINTENANT - 3 * JOUR);
    assert.equal(naissanceDuParcours(memoire, "bbbbbbbb-1700-4000-8000-000000000009", MAINTENANT), MAINTENANT);
    assert.equal(naissanceDuParcours(null, "bbbbbbbb-1700-4000-8000-000000000009", MAINTENANT), MAINTENANT);
  });
});
