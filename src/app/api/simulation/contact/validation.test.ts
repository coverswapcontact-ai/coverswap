import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { validerContactSimulation } from "./validation";

/**
 * Mission 16 (partie 4) — ce que `POST /api/simulation/contact` accepte : prénom et téléphone exigés, e-mail
 * facultatif (vérifié s'il est donné), créneau de rappel parmi les trois, fourchette entière et dans l'ordre, textes
 * coupés. Fonction pure : aucune requête.
 */

const base = { name: "Aline", phone: "06 11 00 00 01" };
const ok = (corps: Record<string, unknown>) => {
  const r = validerContactSimulation(corps);
  assert.equal(r.ok, true, JSON.stringify(r));
  return r.ok ? r.contact : (null as never);
};
const refus = (corps: unknown) => {
  const r = validerContactSimulation(corps);
  assert.equal(r.ok, false);
  return r.ok ? "" : r.erreur;
};

describe("validerContactSimulation", () => {
  test("prénom et téléphone suffisent ; l'e-mail est facultatif", () => {
    const c = ok(base);
    assert.deepEqual([c.nom, c.telephone, c.email, c.rappelCreneau, c.estimationMin], ["Aline", "06 11 00 00 01", undefined, undefined, undefined]);
    assert.equal(ok({ ...base, email: "  " }).email, undefined);
    assert.equal(ok({ ...base, email: "aline@example.test" }).email, "aline@example.test");
  });

  test("refus lisibles : sans prénom, sans téléphone, numéro incomplet, e-mail mal formé, corps illisible", () => {
    assert.match(refus({ phone: base.phone }), /prénom et votre téléphone/);
    assert.match(refus({ name: "Aline" }), /prénom et votre téléphone/);
    assert.match(refus({ ...base, phone: "06 11" }), /incomplet/);
    assert.match(refus({ ...base, email: "aline@" }), /e-mail invalide/);
    assert.match(refus(null), /prénom/);
  });

  test("afficherLienEspace : gardé après un rendu, jamais avec une demande après échec, jamais autre chose que true", () => {
    assert.equal(ok({ ...base, afficherLienEspace: true }).afficherLienEspace, true);
    assert.equal(ok({ ...base, afficherLienEspace: true, simulationEchouee: "credit", photoAvant: "data:image/jpeg;base64,AAAA" }).afficherLienEspace, undefined);
    for (const v of ["true", 1, false, null]) assert.equal(ok({ ...base, afficherLienEspace: v }).afficherLienEspace, undefined, String(v));
    assert.equal(ok(base).afficherLienEspace, undefined);
  });

  test("créneau de rappel : l'un des trois, sinon refusé ; vide = aucun", () => {
    for (const creneau of ["ce-soir-18h", "demain-10h", "demain-18h"]) assert.equal(ok({ ...base, rappelCreneau: creneau }).rappelCreneau, creneau);
    assert.equal(ok({ ...base, rappelCreneau: "" }).rappelCreneau, undefined);
    assert.equal(ok({ ...base, rappelCreneau: null }).rappelCreneau, undefined);
    assert.match(refus({ ...base, rappelCreneau: "demain-9h" }), /Créneau de rappel inconnu/);
    assert.match(refus({ ...base, rappelCreneau: 10 }), /Créneau de rappel inconnu/);
  });

  test("fourchette : entière et dans l'ordre, sinon laissée de côté (sans refuser la demande)", () => {
    assert.deepEqual([ok({ ...base, estimationMin: 1500, estimationMax: 1900, formatPiece: "Moyenne · En L, ≈ 5 m" })].map((c) => [c.estimationMin, c.estimationMax, c.formatPiece]), [[1500, 1900, "Moyenne · En L, ≈ 5 m"]]);
    for (const [min, max] of [[1900, 1500], [1500.5, 1900], ["1500", "1900"], [0, 100], [-1, 100]]) {
      const c = ok({ ...base, estimationMin: min, estimationMax: max, formatPiece: "x" });
      assert.deepEqual([c.estimationMin, c.estimationMax, c.formatPiece], [undefined, undefined, undefined], `${min}-${max}`);
    }
  });

  test("textes coupés, simulations et photo filtrées, consentement gardé", () => {
    const c = ok({ ...base, formatPiece: "f".repeat(80), canal: "c".repeat(90), pageEntree: `/${"p".repeat(300)}`, simulationIds: ["cmun12345678", "../x", 3, "cmun87654321"], photoAvant: "javascript:alert(1)", consentementMail: false, consentementTexte: "Case non cochée" });
    assert.deepEqual([c.formatPiece, c.canal?.length, c.pageEntree?.length, c.simulationIds, c.photoAvant, c.consentementMail], [undefined, 60, 200, ["cmun12345678", "cmun87654321"], undefined, false], "sans fourchette, pas de taille");
    assert.equal(ok({ ...base, estimationMin: 1, estimationMax: 2, formatPiece: "f".repeat(80) }).formatPiece?.length, 40);
    assert.equal(ok({ ...base, photoAvant: "data:image/jpeg;base64,AAAA" }).photoAvant, "data:image/jpeg;base64,AAAA");
    assert.equal(ok({ ...base, parcoursId: "pas-un-parcours" }).parcoursId, undefined);
  });
});
