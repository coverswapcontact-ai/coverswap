import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { origineDepuis, referentDe, sourceCourte, utmDetailles, type Origine } from "./utm";

/** Mission 17 (partie B) : l'origine détaillée jointe aux événements (référent, utm, gclid). */
const origine = (extra: Partial<Origine> = {}): Origine => ({ source: null, medium: null, campagne: null, contenu: null, entree: "/", referent: null, gclid: false, ...extra });

describe("référent : l'hôte seul, sans www, rien pour coverswap.fr", () => {
  test("hôte sans chemin ni requête, en minuscules, sans www.", () => {
    assert.equal(referentDe("https://www.google.com/search?q=revetement+adhesif"), "google.com");
    assert.equal(referentDe("https://chatgpt.com/c/abc-123"), "chatgpt.com");
    assert.equal(referentDe("https://L.Facebook.com/l.php?u=x"), "l.facebook.com");
    assert.equal(referentDe("https://gemini.google.com/app"), "gemini.google.com");
  });

  test("vide si la visite vient du site lui-même (et de ses sous-domaines), absent ou illisible", () => {
    for (const r of ["https://coverswap.fr/", "https://www.coverswap.fr/realisations", "https://crm.coverswap.fr/e/xyz", "", null, undefined, "pas une adresse"]) assert.equal(referentDe(r), null, String(r));
    // Un domaine qui finit seulement par les mêmes lettres n'est pas le site.
    assert.equal(referentDe("https://pascoverswap.fr/"), "pascoverswap.fr");
  });
});

describe("origine d'une arrivée : utm détaillés, gclid présent ou non", () => {
  test("les quatre utm lus tels quels ; la page d'entrée ; le référent réduit", () => {
    const o = origineDepuis("?utm_source=meta&utm_medium=paid&utm_campaign=cuisine-sept&utm_content=video-1&utm_term=x", "/cuisine", "https://www.facebook.com/");
    assert.deepEqual(o, { source: "meta", medium: "paid", campagne: "cuisine-sept", contenu: "video-1", entree: "/cuisine", referent: "facebook.com", gclid: false });
    assert.deepEqual(utmDetailles(o), { source: "meta", medium: "paid", campagne: "cuisine-sept", contenu: "video-1" });
  });

  test("gclid : sa présence seulement, jamais sa valeur", () => {
    const o = origineDepuis("?gclid=Cj0KCQjw-TRES-SECRET", "/", "https://www.google.com/");
    assert.equal(o.gclid, true);
    assert.ok(!JSON.stringify(o).includes("Cj0KCQjw"), "la valeur du gclid n'est gardée nulle part");
    assert.equal(origineDepuis("?utm_source=google", "/", "").gclid, false);
    assert.equal(origineDepuis("?gclid=", "/", "").gclid, true, "présent même vide");
  });

  test("arrivée directe : tout à null, entrée seulement", () => {
    assert.deepEqual(origineDepuis("", "/simulateur", ""), origine({ entree: "/simulateur" }));
    assert.deepEqual(utmDetailles(origineDepuis("", "/", "")), { source: null, medium: null, campagne: null, contenu: null });
  });
});

describe("sourceCourte : la source que les familles du CRM lisent (inchangée)", () => {
  test("utm_source[/utm_medium] d'abord", () => {
    assert.equal(sourceCourte(origine({ source: "meta", medium: "paid", referent: "facebook.com" })), "meta/paid");
    assert.equal(sourceCourte(origine({ source: "chatgpt.com" })), "chatgpt.com");
  });

  test("sinon le référent, sans www. ; rien pour coverswap.fr ni en direct", () => {
    assert.equal(sourceCourte(origine({ referent: "perplexity.ai" })), "perplexity.ai");
    // Un onglet ouvert avant la mission 17 garde l'hôte brut : toujours réduit.
    assert.equal(sourceCourte(origine({ referent: "www.bing.com" })), "bing.com");
    assert.equal(sourceCourte(origine({ referent: "www.coverswap.fr" })), undefined);
    assert.equal(sourceCourte(origine()), undefined);
  });
});
