import assert from "node:assert/strict";
import crypto from "node:crypto";
import { describe, test } from "node:test";
import { depasseLaLimite } from "@/lib/limite-abus";
import { validerSelections } from "./selections";
import { VALIDITE_SIGNATURE_MS, chaineSignee, signerSelections } from "./signature";
import { DELAI_ZONES_MS, ZONES_REPLI, chargerZonesSimulateur, zonesMaxEnLettres } from "./zones";

/** Mission 15 (partie 4) — `prepare` : des sélections validées contre la liste du CRM, puis un corps signé (sans prompt). */

describe("sélections → corps signé", () => {
  test("la chaîne signée est stable : v2, parcours, pièce, surface:ref dans l'ordre, expiration — la même que le CRM recalcule", () => {
    const chaine = chaineSignee({ parcoursId: "aaaaaaaa-1500-4000-8000-000000000001", projet: "cuisine", selections: [{ surface: "credence", ref: "NE31" }, { surface: "meubles-bas", ref: "D1" }], exp: 1_700_000_000_000 });
    assert.equal(chaine, "v2\naaaaaaaa-1500-4000-8000-000000000001\ncuisine\ncredence:NE31,meubles-bas:D1\n1700000000000");
    const sig = signerSelections("secret", { parcoursId: "p", projet: "cuisine", selections: [{ surface: "credence", ref: "NE31" }], exp: 42 });
    assert.equal(sig, crypto.createHmac("sha256", "secret").update("v2\np\ncuisine\ncredence:NE31\n42").digest("hex"));
    // L'ordre fait partie de la signature ; une référence changée aussi.
    assert.notEqual(sig, signerSelections("secret", { parcoursId: "p", projet: "cuisine", selections: [{ surface: "credence", ref: "D1" }], exp: 42 }));
    assert.equal(VALIDITE_SIGNATURE_MS, 90_000);
  });

  test("validation contre la liste du CRM : zones de la pièce, doublons ignorés, référence du catalogue, limite, incompatibilités", () => {
    const refs = new Set(["NE31", "D1", "AB02", "MK15", "NF15"]);
    const ok = validerSelections(ZONES_REPLI, "cuisine", [{ surface: "credence", ref: "NE31" }, { surface: "credence", ref: "D1" }, { surface: "meubles-bas", ref: "D1" }, { surface: 12, ref: "x" }], refs);
    assert.deepEqual(ok, { ok: true, selections: [{ surface: "credence", ref: "NE31" }, { surface: "meubles-bas", ref: "D1" }] });
    const raison = (brut: unknown, projet = "cuisine") => {
      const lecture = validerSelections(ZONES_REPLI, projet, brut, refs);
      return lecture.ok ? "ok" : lecture.raison;
    };
    assert.equal(raison(undefined), "aucune-zone");
    assert.equal(raison([]), "aucune-zone");
    assert.equal(raison([{ surface: "plan-vasque", ref: "NE31" }]), "zone-inconnue");
    assert.equal(raison([{ surface: "credence", ref: "ZZZ99" }]), "reference-inconnue");
    assert.equal(raison([{ surface: "meubles-hauts", ref: "NE31" }, { surface: "meubles-bas", ref: "D1" }, { surface: "plan-de-travail", ref: "MK15" }, { surface: "credence", ref: "AB02" }, { surface: "facades-cuisine", ref: "NF15" }]), "trop-de-surfaces");
    assert.equal(raison([{ surface: "facades-cuisine", ref: "NE31" }, { surface: "meubles-hauts", ref: "D1" }]), "surfaces-incompatibles");
    assert.equal(raison([{ surface: "credence", ref: "NE31" }], "garage"), "projet");
    assert.equal(raison([{ surface: "meuble-vasque", ref: "NE31" }], "salle-de-bain"), "ok");
    // Le catalogue réel du site connaît AA05 (référence de tête du catalogue Cover Styl').
    assert.equal(validerSelections(ZONES_REPLI, "cuisine", [{ surface: "credence", ref: "AA05" }]).ok, true);
  });

  test("zones de repli : cinq pièces, quatre zones au plus, les mêmes identifiants que le CRM", () => {
    assert.equal(ZONES_REPLI.zonesMax, 4);
    assert.deepEqual(
      ZONES_REPLI.pieces.map((p) => p.id),
      ["cuisine", "salle-de-bain", "meubles", "mur-plafond", "professionnel"]
    );
    assert.deepEqual(ZONES_REPLI.pieces.map((p) => p.titre), ["Votre cuisine", "Votre salle de bain", "Vos meubles", "Vos murs", "Votre espace pro"]);
    assert.deepEqual([zonesMaxEnLettres(4), zonesMaxEnLettres(1), zonesMaxEnLettres(12)], ["quatre", "une", "12"]);
  });

  test("un CRM qui ne répond pas (ni erreur, ni réponse) : le repli après le délai, jamais l'attente de la coupure", async () => {
    assert.equal(DELAI_ZONES_MS, 5_000);
    const muet: typeof fetch = (_url, init) =>
      new Promise((_resoudre, rejeter) => {
        init?.signal?.addEventListener("abort", () => rejeter(init.signal!.reason instanceof Error ? init.signal!.reason : new Error("abandon")));
      });
    // Le minuteur d'`AbortSignal.timeout` ne retient pas la boucle d'événements (unref) : sous test, rien d'autre ne la tient.
    const garde = setTimeout(() => {}, 5_000);
    const debut = Date.now();
    const zones = await chargerZonesSimulateur({ delaiMs: 40, fetch: muet });
    clearTimeout(garde);
    assert.equal(zones, ZONES_REPLI);
    assert.ok(Date.now() - debut < 2_000, "le repli arrive au délai, pas plus tard");
    // Un CRM qui répond bien reste lu.
    const vivant: typeof fetch = async () => new Response(JSON.stringify({ ...ZONES_REPLI, version: 7 }), { status: 200, headers: { "content-type": "application/json" } });
    assert.equal((await chargerZonesSimulateur({ delaiMs: 40, fetch: vivant })).version, 7);
    const enErreur: typeof fetch = async () => new Response("nope", { status: 503 });
    assert.equal(await chargerZonesSimulateur({ delaiMs: 40, fetch: enErreur }), ZONES_REPLI);
  });
});

describe("limite d'abus de prepare", () => {
  test("30 appels par clé et par 10 min, puis refus ; la fenêtre glisse", () => {
    const compteurs = new Map<string, number[]>();
    const debut = 1_000_000;
    for (let i = 0; i < 30; i++) assert.equal(depasseLaLimite("ip", debut + i * 1000, undefined, compteurs), false, `appel ${i + 1}`);
    assert.equal(depasseLaLimite("ip", debut + 31_000, undefined, compteurs), true);
    assert.equal(depasseLaLimite("autre", debut + 31_000, undefined, compteurs), false, "une autre clé n'est pas touchée");
    assert.equal(depasseLaLimite("ip", debut + 10 * 60_000 + 1, undefined, compteurs), false, "les appels du début sont sortis de la fenêtre");
  });
});
