import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { PICTOS_ELEMENTS } from "@/components/espace/Illustrations";
import { ELEMENTS, elementPrecis, zoneDeLElement } from "./elements";
import { lireElementDemande } from "./matiere-demandee";
import { ZONES_REPLI } from "./zones";

/** Site 3.0 (lot B6) : les éléments précis des pictos de l'accueil mènent à une pièce et à une zone du simulateur. */
describe("éléments précis", () => {
  test("sept éléments, chacun vers une pièce et une zone connues du simulateur, chacun avec son picto", () => {
    assert.deepEqual(ELEMENTS.map((e) => e.id), ["porte-interieure", "placard-coulissant", "plan-de-travail", "meuble-vasque", "commode", "porte-entree", "refrigerateur"]);
    for (const e of ELEMENTS) {
      const piece = ZONES_REPLI.pieces.find((p) => p.id === e.piece);
      assert.ok(piece, `${e.id} : pièce ${e.piece} inconnue`);
      assert.ok(piece.zones.some((z) => z.id === e.zone), `${e.id} : zone ${e.zone} absente de ${e.piece}`);
      assert.ok(PICTOS_ELEMENTS[e.id], `${e.id} : pas de picto`);
    }
    // Rattachés côté site, consignes du CRM inchangées.
    assert.deepEqual([elementPrecis("porte-entree")?.zone, elementPrecis("refrigerateur")?.zone], ["portes-dressing", "facades-cuisine"]);
  });

  test("l'adresse : un élément connu seulement ; sa zone seulement dans sa pièce", () => {
    assert.equal(lireElementDemande("plan-de-travail"), "plan-de-travail");
    assert.equal(lireElementDemande(" commode "), "commode");
    for (const valeur of [null, undefined, "", "four", "<script>", "plan de travail"]) assert.equal(lireElementDemande(valeur), null, String(valeur));
    assert.equal(zoneDeLElement("plan-de-travail", "cuisine"), "plan-de-travail");
    assert.equal(zoneDeLElement("plan-de-travail", "salle-de-bain"), null, "la pièce a changé : rien à ouvrir");
    assert.equal(zoneDeLElement(null, "cuisine"), null);
  });

  test("le hook de l'écran des matières ouvre la zone une seule fois, si la pièce l'a", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/simulateur/_components/useMatiereDemandee.ts"), "utf8");
    assert.match(source, /zoneDemandeeRef\.current = null;\s+if \(piece\.zones\.some\(\(z\) => z\.id === zone\)\) ouvrirZone\?\.\(zone\);/);
  });
});
