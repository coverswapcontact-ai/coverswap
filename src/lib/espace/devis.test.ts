import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Devis } from "@/components/espace/api";
import { devisDeLOnglet, enteteDesDevis, precisionAccord } from "./devis";

/**
 * Mission 18 (B7) — l'onglet Devis : ce qui se signe vient du CRM (`devisASigner`) ; un avenant (ou un nouveau devis)
 * émis après la signature s'affiche à côté du devis signé et se signe ici. Un état gardé d'avant B7 (sans le champ)
 * garde le calcul d'avant : une fois l'accord donné, seul le devis signé.
 */

const devis = (id: string, accepte = false): Devis => ({
  id,
  numero: `2026-0${id}`,
  libelle: null,
  objet: id === "1" ? "Cuisine" : "Avenant : crédence",
  lignes: [],
  total: id === "1" ? 1500 : 400,
  acompte: 0,
  acomptePct: 30,
  solde: 0,
  conditions: [],
  mentionTva: "",
  emisLe: "2026-10-01T08:00:00.000Z",
  valableJusquau: "2026-10-31T08:00:00.000Z",
  accepte: accepte ? { le: "2026-10-02T08:00:00.000Z", nom: "Client Essai", source: "ESPACE", retirable: true } : null,
  pdf: null,
});

describe("onglet Devis de l'espace (mission 18, B7)", () => {
  test("avant la signature : les devis proposés, à comparer s'ils sont plusieurs ; un seul s'ouvre directement", () => {
    const a = devis("1");
    const b = devis("2");
    const deux = devisDeLOnglet({ devis: b, devisProposes: [a, b], devisASigner: [a, b] });
    assert.deepEqual([deux.liste.map((d) => d.id), deux.avenant, deux.ouvert], [["1", "2"], false, null]);
    assert.deepEqual(enteteDesDevis(deux), { surtitre: "2 devis vous sont proposés", phrase: "Comparez, puis donnez votre accord sur celui qui vous convient. Un seul sera retenu." });
    assert.equal(precisionAccord(deux), " Les autres devis proposés ne seront pas retenus.");
    const un = devisDeLOnglet({ devis: a, devisProposes: [a], devisASigner: [a] });
    assert.deepEqual([un.liste.map((d) => d.id), un.ouvert?.id, precisionAccord(un)], [["1"], "1", ""]);
  });

  test("signé, un avenant émis depuis : il s'affiche et s'ouvre, le devis signé reste à côté et valable", () => {
    const origine = devis("1", true);
    const avenant = devis("2");
    const choix = devisDeLOnglet({ devis: origine, devisProposes: [origine, avenant], devisASigner: [avenant] });
    assert.deepEqual([choix.liste.map((d) => d.id), choix.avenant, choix.ouvert?.id, choix.signes.map((d) => d.id)], [["2", "1"], true, "2", ["1"]]);
    assert.deepEqual(enteteDesDevis(choix), { surtitre: "Un nouveau devis vous est proposé", phrase: "Votre devis signé reste valable. Lisez le nouveau, puis donnez votre accord ici." });
    assert.equal(precisionAccord(choix), " Votre devis signé n° 2026-01 reste valable.");
    const deux = devisDeLOnglet({ devis: origine, devisProposes: [origine, avenant, devis("3")], devisASigner: [avenant, devis("3")] });
    assert.deepEqual([deux.ouvert, enteteDesDevis(deux).surtitre, precisionAccord(deux)], [null, "2 nouveaux devis vous sont proposés", " Les autres devis proposés ne seront pas retenus. Votre devis signé n° 2026-01 reste valable."]);
  });

  test("l'avenant signé : les deux devis signés se relisent, plus rien à signer", () => {
    const origine = devis("1", true);
    const avenant = devis("2", true);
    const choix = devisDeLOnglet({ devis: origine, devisProposes: [origine, avenant], devisASigner: [] });
    assert.deepEqual([choix.liste.map((d) => d.id), choix.avenant, choix.ouvert], [["1", "2"], false, null]);
    assert.deepEqual(enteteDesDevis(choix), { surtitre: "Vos devis signés", phrase: "Touchez un devis pour le relire." });
  });

  test("état gardé d'avant B7 (pas de devisASigner) : le calcul d'avant — signé, seul le devis signé", () => {
    const origine = devis("1", true);
    const avenant = devis("2");
    const ancien = devisDeLOnglet({ devis: origine, devisProposes: [origine, avenant] });
    assert.deepEqual([ancien.liste.map((d) => d.id), ancien.avenant, ancien.ouvert?.id], [["1"], false, "1"]);
    const avant = devisDeLOnglet({ devis: devis("2"), devisProposes: [devis("1"), devis("2")] });
    assert.deepEqual(avant.liste.map((d) => d.id), ["1", "2"]);
    assert.deepEqual(devisDeLOnglet({ devis: devis("1") }).liste.map((d) => d.id), ["1"], "très ancien état : le devis seul");
  });
});
