import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { corpsEvenement, envoyerVers } from "./evenements-site";
import { CLE_OPPOSITION, mesureRefusee } from "./opposition-mesure";
import type { Origine } from "./utm";

/**
 * Mission 17 (partie B) : le corps d'un événement (référent, fuseau, utm détaillés, gclid ; rien d'autre) et
 * l'opposition (drapeau du bouton, Global Privacy Control : rien n'est envoyé).
 */
const ORIGINE: Origine = { source: "meta", medium: "paid", campagne: "cuisine-sept", contenu: "video-1", entree: "/", referent: "facebook.com", gclid: false };
const PARCOURS = "aaaaaaaa-1700-4000-8000-000000000001";

describe("corps de l'événement", () => {
  test("les champs d'avant (source courte, campagne) et les nouveaux (référent, fuseau, utm, gclid) ; rien d'autre", () => {
    const corps = corpsEvenement("PAGE_VUE", {}, { parcoursId: PARCOURS, page: "/cuisine", origine: ORIGINE, fuseau: "Europe/Paris" });
    assert.deepEqual(corps, {
      parcoursId: PARCOURS,
      type: "PAGE_VUE",
      page: "/cuisine",
      source: "meta/paid",
      campagne: "cuisine-sept",
      referent: "facebook.com",
      fuseau: "Europe/Paris",
      utm: { source: "meta", medium: "paid", campagne: "cuisine-sept", contenu: "video-1" },
      gclid: false,
      meta: null,
    });
    // Ni écran, ni langue, ni page d'entrée, ni identifiant nouveau.
    assert.deepEqual(Object.keys(corps).sort(), ["campagne", "fuseau", "gclid", "meta", "page", "parcoursId", "referent", "source", "type", "utm"]);
  });

  test("arrivée directe par Google Ads : gclid vrai, référent seul, meta gardée", () => {
    const direct: Origine = { source: null, medium: null, campagne: null, contenu: null, entree: "/", referent: "google.com", gclid: true };
    const corps = corpsEvenement("DEVIS_DEMANDE", { formulaire: "simulateur" }, { parcoursId: PARCOURS, page: "/simulateur", origine: direct, fuseau: null });
    assert.equal(corps.source, "google.com");
    assert.equal(corps.referent, "google.com");
    assert.equal(corps.gclid, true);
    assert.equal(corps.fuseau, null);
    assert.deepEqual(corps.utm, { source: null, medium: null, campagne: null, contenu: null });
    assert.deepEqual(corps.meta, { formulaire: "simulateur" });
  });
});

describe("opposition : drapeau et Global Privacy Control", () => {
  test("pur : le drapeau « 1 » ou GPC vrai refusent ; le reste compte", () => {
    assert.equal(mesureRefusee("1", undefined), true);
    assert.equal(mesureRefusee(null, true), true);
    assert.equal(mesureRefusee("1", true), true);
    assert.equal(mesureRefusee(null, undefined), false);
    assert.equal(mesureRefusee(null, false), false);
    assert.equal(mesureRefusee("0", "true"), false, "seules les valeurs exactes comptent");
  });

  /* Un navigateur simulé : stockages, navigator (sendBeacon, globalPrivacyControl), fetch. */
  const envois: { voie: "beacon" | "fetch"; url: string; corps: string }[] = [];
  const global = globalThis as Record<string, unknown>;
  const avant = { window: global.window, localStorage: global.localStorage, sessionStorage: global.sessionStorage, fetch: global.fetch, navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator") };
  const stockage = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
  };
  const navigateur = (gpc?: boolean) => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        globalPrivacyControl: gpc,
        sendBeacon: (url: string, blob: Blob) => {
          void blob.text().then((corps) => envois.push({ voie: "beacon", url, corps }));
          return true;
        },
      },
    });
  };
  const URL_CRM = "https://crm.example.test/api/site/evenements";

  beforeEach(() => {
    envois.length = 0;
    global.window = { location: { pathname: "/cuisine" }, dispatchEvent: () => true };
    global.localStorage = stockage();
    global.sessionStorage = stockage();
    global.fetch = async (url: string, init: { body: string }) => {
      envois.push({ voie: "fetch", url, corps: init.body });
      return new Response("{}");
    };
    navigateur(undefined);
  });

  afterEach(() => {
    global.window = avant.window;
    global.localStorage = avant.localStorage;
    global.sessionStorage = avant.sessionStorage;
    global.fetch = avant.fetch;
    if (avant.navigator) Object.defineProperty(globalThis, "navigator", avant.navigator);
  });

  test("sans refus, l'événement part (fetch pour PAGE_VUE) avec le fuseau du navigateur", () => {
    assert.equal(envoyerVers(URL_CRM, "PAGE_VUE"), true);
    assert.equal(envois.length, 1);
    const corps = JSON.parse(envois[0].corps);
    assert.equal(envois[0].voie, "fetch");
    assert.equal(corps.page, "/cuisine");
    assert.equal(corps.fuseau, Intl.DateTimeFormat().resolvedOptions().timeZone);
    assert.equal(corps.gclid, false);
  });

  test("drapeau « Ne pas compter mes visites » posé : rien ne part, ni page vue ni étape", async () => {
    (global.localStorage as ReturnType<typeof stockage>).setItem(CLE_OPPOSITION, "1");
    assert.equal(envoyerVers(URL_CRM, "PAGE_VUE"), false);
    assert.equal(envoyerVers(URL_CRM, "GENERATION_LANCEE", { projet: "cuisine" }), false);
    await new Promise((r) => setTimeout(r, 5));
    assert.deepEqual(envois, []);
  });

  test("Global Privacy Control : rien ne part, sans rien à cliquer", async () => {
    navigateur(true);
    assert.equal(envoyerVers(URL_CRM, "DEVIS_DEMANDE"), false);
    assert.equal(envoyerVers(URL_CRM, "PAGE_VUE"), false);
    await new Promise((r) => setTimeout(r, 5));
    assert.deepEqual(envois, []);
  });

  test("drapeau retiré : la mesure reprend (sendBeacon pour les étapes)", async () => {
    const local = global.localStorage as ReturnType<typeof stockage>;
    local.setItem(CLE_OPPOSITION, "1");
    local.removeItem(CLE_OPPOSITION);
    assert.equal(envoyerVers(URL_CRM, "PIECE_CHOISIE", { projet: "cuisine" }), true);
    await new Promise((r) => setTimeout(r, 5));
    assert.equal(envois.length, 1);
    assert.equal(envois[0].voie, "beacon");
    assert.deepEqual(JSON.parse(envois[0].corps).meta, { projet: "cuisine" });
  });

  test("stockage local bloqué : GPC seul décide, l'envoi n'échoue pas", () => {
    global.localStorage = { getItem: () => { throw new Error("bloqué"); } };
    assert.equal(envoyerVers(URL_CRM, "PAGE_VUE"), true);
  });

  test("sans adresse (intégration continue) : rien ne part", () => {
    assert.equal(envoyerVers("", "PAGE_VUE"), false);
    assert.deepEqual(envois, []);
  });
});
