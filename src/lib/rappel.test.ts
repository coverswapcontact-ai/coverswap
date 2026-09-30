import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { creneauxRappel, estCreneauRappel, libelleRappel, phraseRappel, rappelDuCreneau } from "./rappel";

/**
 * Mission 16 (partie 4) — « Être rappelé » : les libellés des trois créneaux selon l'heure et le jour, en heure de
 * Paris ; le week-end passe au lundi ; les instants sont ceux que le CRM calcule (mêmes cas que
 * `crm/src/lib/base/mission-16-partie-4.test.ts`).
 */

const libelles = (maintenant: Date) => creneauxRappel(maintenant).map((o) => [o.code, o.libelle]);
const iso = (d: Date) => d.toISOString();

describe("creneauxRappel : les trois boutons", () => {
  test("mercredi 10 h : ce soir 18 h, demain 10 h, demain 18 h", () => {
    assert.deepEqual(libelles(new Date("2026-09-30T08:00:00Z")), [
      ["ce-soir-18h", "Ce soir 18 h"],
      ["demain-10h", "Demain 10 h"],
      ["demain-18h", "Demain 18 h"],
    ]);
  });

  test("mercredi 17 h 45 : « ce soir » devient demain 18 h, un seul bouton pour deux codes", () => {
    const options = creneauxRappel(new Date("2026-09-30T15:45:00Z"));
    assert.deepEqual(options.map((o) => o.libelle), ["Demain 10 h", "Demain 18 h"]);
    assert.equal(iso(options[1].le), "2026-10-01T16:00:00.000Z");
  });

  test("vendredi midi : ce soir, puis lundi 10 h et lundi 18 h", () => {
    assert.deepEqual(libelles(new Date("2026-10-02T10:00:00Z")), [
      ["ce-soir-18h", "Ce soir 18 h"],
      ["demain-10h", "Lundi 10 h"],
      ["demain-18h", "Lundi 18 h"],
    ]);
  });

  test("samedi et dimanche : lundi (« demain » le dimanche)", () => {
    assert.deepEqual(creneauxRappel(new Date("2026-10-03T09:00:00Z")).map((o) => o.libelle), ["Lundi 10 h", "Lundi 18 h"]);
    assert.deepEqual(creneauxRappel(new Date("2026-10-04T09:00:00Z")).map((o) => o.libelle), ["Demain 10 h", "Demain 18 h"]);
  });

  test("changement d'heure (samedi 24 octobre 2026) : lundi 10 h est 9 h UTC", () => {
    const options = creneauxRappel(new Date("2026-10-24T09:00:00Z"));
    assert.deepEqual(options.map((o) => [o.libelle, iso(o.le)]), [["Lundi 10 h", "2026-10-26T09:00:00.000Z"], ["Lundi 18 h", "2026-10-26T17:00:00.000Z"]]);
  });
});

describe("rappelDuCreneau : les instants du CRM", () => {
  test("mêmes cas que le CRM : 17:29 ce soir, 17:30 demain ; vendredi → lundi ; l'hiver", () => {
    assert.equal(iso(rappelDuCreneau("ce-soir-18h", new Date("2026-09-30T15:29:00Z"))), "2026-09-30T16:00:00.000Z");
    assert.equal(iso(rappelDuCreneau("ce-soir-18h", new Date("2026-09-30T15:30:00Z"))), "2026-10-01T16:00:00.000Z");
    assert.equal(iso(rappelDuCreneau("demain-10h", new Date("2026-10-02T10:00:00Z"))), "2026-10-05T08:00:00.000Z");
    assert.equal(iso(rappelDuCreneau("ce-soir-18h", new Date("2026-10-02T17:00:00Z"))), "2026-10-05T16:00:00.000Z");
    assert.equal(iso(rappelDuCreneau("ce-soir-18h", new Date("2026-11-04T09:00:00Z"))), "2026-11-04T17:00:00.000Z");
  });

  test("la phrase de confirmation et les libellés", () => {
    const mercredi = new Date("2026-09-30T08:00:00Z");
    assert.equal(phraseRappel(new Date("2026-10-01T08:00:00Z"), mercredi), "Lucas vous appelle demain à 10 h.");
    assert.equal(phraseRappel(new Date("2026-09-30T16:00:00Z"), mercredi), "Lucas vous appelle ce soir à 18 h.");
    assert.equal(phraseRappel(new Date("2026-10-05T08:00:00Z"), new Date("2026-10-02T10:00:00Z")), "Lucas vous appelle lundi à 10 h.");
    assert.equal(libelleRappel(new Date("2026-09-30T12:30:00Z"), mercredi), "Aujourd'hui 14 h 30");
    assert.deepEqual(["ce-soir-18h", "demain-10h", "demain-18h", "demain-9h", "", null].map(estCreneauRappel), [true, true, true, false, false, false]);
  });
});
