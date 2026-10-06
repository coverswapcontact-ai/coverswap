import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import type { SimulationClient } from "@/components/espace/api";
import { libelleSimulation, nommer } from "@/components/espace/simulations-outils";
import { exempleConnu } from "@/lib/exemples-simulateur";
import { corpsDemandeSimulation } from "@/lib/simulateur/demande";
import type { Selection } from "@/lib/simulateur/reprise";
import { ZONES_REPLI } from "@/lib/simulateur/zones";
import { validerContactSimulation } from "@/app/api/simulation/contact/validation";
import type { EcranGeneration as TypeEcranGeneration } from "./EcranGeneration";

/**
 * Relecture adverse des phases D, E, F, constat important n° 1 (et mineur n° 6) : une simulation faite sur une PIÈCE
 * D'EXEMPLE le dit de bout en bout. `exemple` part dans `prepare` (relu contre la liste), puis au CRM avec la génération
 * et avec la demande ; après un échec, le secours devient « Recevoir une simulation faite à la main » et l'avant
 * d'exemple ne part jamais comme photo du visiteur ; l'attente et le résultat ne disent pas « Votre simulation » ; dans
 * l'espace, une simulation sur un exemple s'appelle « Ambiance · avant / après ». Un CRM d'avant (sans `exemple`) ne
 * change rien : le champ est facultatif des deux côtés. `fetch` est remplacé : aucune requête ne sort.
 */
const EXEMPLE = "cuisine-bordeaux-brillante";
const PHOTO = "data:image/jpeg;base64,AAAA";
const lire = (f: string) => readFileSync(path.join(process.cwd(), "src", f), "utf8");
const texte = (html: string) => html.replace(/&#x27;|&apos;/g, "'");

type Appel = { url: string; corps: Record<string, unknown> };
let appels: Appel[] = [];
let repondre: (url: string) => Response = () => new Response("{}", { status: 500 });
const fetchOrigine = globalThis.fetch;
const env = { ...process.env };
// Chargés après l'environnement : `generation-client` lit l'adresse du CRM à son chargement (l'écran l'importe aussi).
let client: typeof import("@/lib/simulateur/generation-client");
let EcranGeneration: typeof TypeEcranGeneration;
let FORMULAIRE_VIDE: typeof import("./Formulaires").FORMULAIRE_VIDE;

before(async () => {
  // Lu au chargement du module : posé avant l'import.
  process.env.NEXT_PUBLIC_SIMULATE_URL = "https://crm.essai.test/api/simulate";
  process.env.SIMULATE_TOKEN_SECRET = "secret-des-essais";
  process.env.TURNSTILE_SECRET_KEY = "";
  process.env.CRM_WEBHOOK_URL = "https://crm.essai.test/api/webhook";
  process.env.CRM_WEBHOOK_SECRET = "secret-webhook-des-essais";
  process.env.RESEND_API_KEY = "";
  globalThis.fetch = (async (entree: string | URL | Request, init?: RequestInit) => {
    const url = String(entree instanceof Request ? entree.url : entree);
    appels.push({ url, corps: typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : {} });
    return repondre(url);
  }) as typeof fetch;
  client = await import("@/lib/simulateur/generation-client");
  EcranGeneration = (await import("./EcranGeneration")).EcranGeneration;
  FORMULAIRE_VIDE = (await import("./Formulaires")).FORMULAIRE_VIDE;
});

after(() => {
  globalThis.fetch = fetchOrigine;
  process.env = env;
});

const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { "content-type": "application/json" } });

describe("relecture D, E, F : le nom d'une pièce d'exemple", () => {
  test("seuls les 18 exemples du site passent ; rien d'autre", () => {
    assert.equal(exempleConnu(EXEMPLE), EXEMPLE);
    assert.equal(exempleConnu("pro-comptoir-accueil"), "pro-comptoir-accueil");
    for (const refuse of ["cuisine-bordeaux-brillante-avant", "inconnu", "../photos", "", 12, null, undefined]) assert.equal(exempleConnu(refuse), null, String(refuse));
  });
});

describe("relecture D, E, F : la génération sur un exemple le dit au CRM", () => {
  const entree = { projetId: "cuisine", parcoursId: "aaaaaaaa-0000-4000-8000-000000000001", turnstileToken: null, selections: [{ surface: "credence", ref: "NF13" }], photo: PHOTO, page: "/simulateur", source: null, campagne: null };

  test("`exemple` part dans prepare, puis au CRM tel que prepare l'a relu ; sans exemple, aucun champ", async () => {
    const prepare = { ok: true, projet: "cuisine", selections: entree.selections, sig: "s", exp: 1, parcoursId: entree.parcoursId };
    repondre = (url) => (url === "/api/simulation/prepare" ? json({ ...prepare, exemple: EXEMPLE }) : json({ ok: true, travailId: "cmun000000000001", attenteEstimeeS: 60 }, 202));
    appels = [];
    assert.equal((await client.lancerGeneration({ ...entree, exemple: EXEMPLE })).ok, true);
    assert.deepEqual(appels.map((a) => [a.url, a.corps.exemple]), [["/api/simulation/prepare", EXEMPLE], ["https://crm.essai.test/api/simulate", EXEMPLE]]);
    // Sur la photo du visiteur : rien.
    repondre = (url) => (url === "/api/simulation/prepare" ? json(prepare) : json({ ok: true, travailId: "cmun000000000002", attenteEstimeeS: 60 }, 202));
    appels = [];
    await client.lancerGeneration({ ...entree, exemple: null });
    assert.ok(appels.every((a) => !("exemple" in a.corps)), "aucun champ exemple");
    // Le site ne fait passer au CRM que ce que prepare a relu (un exemple refusé par prepare ne part pas).
    appels = [];
    await client.lancerGeneration({ ...entree, exemple: "inconnu" });
    assert.equal(appels[0].corps.exemple, "inconnu");
    assert.ok(!("exemple" in appels[1].corps));
  });

  test("prepare relit `exemple` contre la liste : connu → rendu, inconnu → absent ; la signature ne change pas", async () => {
    const { POST } = await import("@/app/api/simulation/prepare/route");
    repondre = () => {
      throw new Error("CRM injoignable");
    };
    const lancer = async (exemple: unknown, ip: string) => {
      const reponse = await POST(new NextRequest("http://localhost/api/simulation/prepare", { method: "POST", body: JSON.stringify({ project_type: "cuisine", parcoursId: entree.parcoursId, turnstileToken: null, selections: entree.selections, exemple }), headers: { "content-type": "application/json", "x-forwarded-for": ip } }));
      return { status: reponse.status, corps: (await reponse.json()) as Record<string, unknown> };
    };
    const connu = await lancer(EXEMPLE, "203.0.113.21");
    assert.equal(connu.status, 200, JSON.stringify(connu.corps));
    assert.equal(connu.corps.exemple, EXEMPLE);
    const inconnu = await lancer("../photos", "203.0.113.22");
    assert.equal(inconnu.status, 200);
    assert.ok(!("exemple" in inconnu.corps));
    assert.equal(typeof connu.corps.sig, "string");
    assert.match(lire("app/simulateur/_components/Simulateur.tsx"), /campagne: origine\.campagne,\s+exemple: etat\.exemple,\s+\}\);/);
  });
});

describe("relecture D, E, F : la demande faite sur un exemple", () => {
  const base = { formulaire: { name: "Aline", phone: "0611000001", email: "aline@exemple.fr", ville: "Lattes", codePostal: "34970" }, connus: { ville: null, codePostal: null }, projet: "cuisine", parcoursId: null, simulationIds: [], references: [], jetonCaptcha: null, acquisition: {}, consentement: {}, page: "/simulateur" };

  test("après un échec sur un exemple : ni photo, la raison et le nom de l'exemple ; sur la photo du visiteur : la photo part ; après un rendu : le nom et le lien de l'espace", () => {
    const surExemple = corpsDemandeSimulation({ ...base, echec: { photo: PHOTO, raison: "credit" }, exemple: EXEMPLE });
    assert.ok(!("photoAvant" in surExemple), "l'avant d'exemple n'est pas la photo du visiteur");
    assert.deepEqual([surExemple.simulationEchouee, surExemple.exemple], ["credit", EXEMPLE]);
    const surSaPhoto = corpsDemandeSimulation({ ...base, echec: { photo: PHOTO, raison: "credit" }, exemple: null });
    assert.deepEqual([surSaPhoto.photoAvant, "exemple" in surSaPhoto], [PHOTO, false]);
    const apresRendu = corpsDemandeSimulation({ ...base, echec: null, exemple: EXEMPLE });
    assert.deepEqual([apresRendu.exemple, apresRendu.afficherLienEspace], [EXEMPLE, true]);
  });

  test("la route la relit : exemple connu → gardé, et aucune photo même si elle arrive ; exemple inconnu → ignoré", () => {
    const corps = { name: "Aline", phone: "0611000001", simulationEchouee: "credit", photoAvant: PHOTO };
    const surExemple = validerContactSimulation({ ...corps, exemple: EXEMPLE });
    assert.ok(surExemple.ok);
    assert.deepEqual([surExemple.contact.exemple, surExemple.contact.photoAvant], [EXEMPLE, undefined]);
    const inconnu = validerContactSimulation({ ...corps, exemple: "inconnu" });
    assert.ok(inconnu.ok);
    assert.deepEqual([inconnu.contact.exemple, inconnu.contact.photoAvant], [undefined, PHOTO]);
  });

  test("POST /api/simulation/contact après un échec sur un exemple : le CRM reçoit `exemple`, aucune photo, et la note le dit", async () => {
    const { POST } = await import("@/app/api/simulation/contact/route");
    repondre = () => json({ success: true, leadId: "lead-essai" });
    const envoyer = async (corps: Record<string, unknown>) => {
      appels = [];
      const reponse = await POST(new NextRequest("http://localhost/api/simulation/contact", { method: "POST", body: JSON.stringify(corps), headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.30" } }));
      assert.equal(reponse.status, 200);
      assert.equal(appels.length, 1);
      return appels[0].corps;
    };
    const demande = corpsDemandeSimulation({ ...base, echec: { photo: PHOTO, raison: "credit" }, exemple: EXEMPLE });
    const recu = await envoyer({ ...demande, photoAvant: PHOTO });
    assert.equal(recu.exemple, EXEMPLE);
    assert.ok(!("photos" in recu), "aucune photo au CRM");
    assert.match(String(recu.notes), /SIMULATION À RÉALISER À LA MAIN[\s\S]*Essai sur la pièce d'exemple cuisine-bordeaux-brillante : aucune photo du visiteur, la lui demander\./);
    // Contrôle : sur la photo du visiteur, elle part, et pas de champ `exemple`.
    const visiteur = await envoyer(corpsDemandeSimulation({ ...base, echec: { photo: "data:image/jpeg;base64,BBBB", raison: "credit" }, exemple: null }));
    assert.deepEqual([visiteur.photos, "exemple" in visiteur], [["data:image/jpeg;base64,BBBB"], false]);
    assert.match(String(visiteur.notes), /Photo du visiteur jointe\./);
  });
});

describe("relecture D, E, F : l'attente, le secours et le résultat sur un exemple", () => {
  const film = (ref: string, nom: string): Selection => ({ ref, nom, famille: "couleur", finition: "mat", categorie: "", tags: [], image: "" });
  const rien = () => undefined;
  const base = (): ComponentProps<typeof TypeEcranGeneration> => ({
    piece: ZONES_REPLI.pieces[0],
    photo: PHOTO,
    selections: { credence: film("NE31", "Marbre") },
    analyse: null,
    sondage: null,
    travail: { travailId: "cmun000000000001", lanceLe: 1, attenteEstimeeS: 75 },
    echec: null,
    peutReessayer: false,
    attenteReessai: null,
    onReessayer: rien,
    envoye: false,
    formulaire: FORMULAIRE_VIDE,
    onFormulaire: rien,
    avecVille: true,
    envoiEnCours: false,
    onEnvoyer: rien,
    onRevenir: rien,
    onNouvelle: rien,
    onJeton: rien,
  });
  const rendre = (maj: Partial<ComponentProps<typeof TypeEcranGeneration>>) => texte(renderToStaticMarkup(createElement(EcranGeneration, { ...base(), ...maj })));

  test("pendant : « L'ambiance se prépare », jamais « Votre simulation se prépare » ; sur sa photo, inchangé", () => {
    assert.match(rendre({ exemple: EXEMPLE }), /L'ambiance se prépare/);
    assert.doesNotMatch(rendre({ exemple: EXEMPLE }), /Votre simulation se prépare/);
    assert.match(rendre({}), /Votre simulation se prépare/);
  });

  test("après un échec : « Recevoir une simulation faite à la main » (titre et bouton), rien sur « ma photo » ; envoyée : on lui demande une photo de sa pièce", () => {
    const echec = { raison: "credit", message: "Le service est saturé." };
    const html = rendre({ echec, exemple: EXEMPLE });
    assert.match(html, /<h3[^>]*>Recevoir une simulation faite à la main<\/h3>/);
    assert.match(html, /<button type="submit"[^>]*>[\s\S]*Recevoir une simulation faite à la main/);
    assert.doesNotMatch(html, /Envoyer ma photo|à partir de cette photo/);
    assert.match(rendre({ echec, exemple: EXEMPLE, envoye: true }), /Nous vous recontactons pour une photo de votre pièce/);
    // Sur sa photo : le secours d'avant.
    assert.match(rendre({ echec }), /Envoyer ma photo et recevoir ma simulation/);
    assert.match(lire("app/simulateur/_components/Simulateur.tsx"), /onJeton=\{setJetonCaptcha\}\s+exemple=\{etat\.exemple\}/);
  });

  test("résultat : l'annonce aux lecteurs d'écran dit « L'ambiance apparaît » sur un exemple", () => {
    assert.match(lire("app/simulateur/_components/EcranResultat.tsx"), /"Chargement du rendu" : exemple \? "L'ambiance apparaît" : "Votre simulation apparaît"/);
  });
});

describe("relecture D, E, F : l'espace nomme « Ambiance · avant / après » une simulation sur un exemple", () => {
  const sim = (id: string, le: string, maj: Partial<SimulationClient> = {}): SimulationClient => ({ id, titre: "Votre simulation sur coverswap.fr", description: null, source: "SITE", zones: [], avant: true, le, nouvelle: false, choisie: false, commentaire: null, ...maj });

  test("les noms : les essais sur sa photo comptés à part, les ambiances à part ; un CRM d'avant (sans champ) ne change rien", () => {
    const noms = nommer([sim("a", "2026-10-01"), sim("b", "2026-10-02", { exemple: EXEMPLE }), sim("c", "2026-10-03")]);
    assert.deepEqual([...noms.entries()], [["a", "Essai sur le site 1"], ["b", "Ambiance · avant / après"], ["c", "Essai sur le site 2"]]);
    assert.deepEqual([...nommer([sim("x", "1", { exemple: EXEMPLE }), sim("y", "2", { exemple: "cuisine-merisier" })]).values()], ["Ambiance · avant / après 1", "Ambiance · avant / après 2"]);
    assert.deepEqual([...nommer([sim("z", "1")]).values()], ["Essai sur le site"]);
    assert.equal(libelleSimulation(sim("b", "1", { exemple: EXEMPLE })), "Ambiance · avant / après");
    assert.equal(libelleSimulation(sim("a", "1")), "Votre simulation sur coverswap.fr");
    assert.equal(libelleSimulation({ titre: null }), "Simulation");
  });

  test("le compte et le devis : plus aucun « Simulation » codé en dur, l'étiquette sur le curseur d'un exemple", () => {
    const compte = lire("components/espace/EspaceCompte.tsx");
    assert.doesNotMatch(compte, /titre \?\? "Simulation/);
    assert.equal((compte.match(/libelleSimulation\(/g) ?? []).length, 5);
    assert.match(compte, /etiquette=\{simulationOuverte\.exemple \? LIBELLE_AMBIANCE : undefined\}/);
    assert.match(lire("components/espace/EtapeDevis.tsx"), /etiquette=\{simulation\.exemple \? LIBELLE_AMBIANCE : undefined\}/);
  });
});
