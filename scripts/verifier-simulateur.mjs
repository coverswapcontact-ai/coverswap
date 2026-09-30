#!/usr/bin/env node
/**
 * Vérifie la chaîne du simulateur sur un site en ligne, de bout en bout :
 *   1. /api/simulation/prepare : consigne construite et signée, refus propres
 *      (surfaces incompatibles, référence inconnue, ancien format) ;
 *   2. génération sur le CRM avec une photo d'essai, au contrat ASYNCHRONE de la
 *      mission 15 : POST `asynchrone: true` → 202 { travailId, attenteEstimeeS },
 *      puis sondage GET ?id=&p= jusqu'à PRETE ou ECHEC — soit un rendu, soit une
 *      erreur classée et lisible (crédit épuisé, surcharge…), jamais un échec muet ;
 *   3. avec --contact : la demande part au CRM avec la photo quand la génération a échoué.
 *
 *   node scripts/verifier-simulateur.mjs                     (coverswap.fr, étapes 1 et 2)
 *   node scripts/verifier-simulateur.mjs --sans-generation   (étape 1 seule, ne coûte rien)
 *   node scripts/verifier-simulateur.mjs --contact           (crée un lead « AUDIT TEST » dans le CRM)
 *   SITE=http://localhost:3010 node scripts/verifier-simulateur.mjs
 *
 * Coût : une génération réussie ≈ 0,10 à 0,25 € selon le nombre de surfaces ; une génération refusée ne coûte rien.
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = (process.env.SITE || "https://coverswap.fr").replace(/\/$/, "");
const CRM = process.env.CRM_SIMULATE_URL || "https://crm.coverswap.fr/api/simulate";
const sansGeneration = process.argv.includes("--sans-generation");
const avecContact = process.argv.includes("--contact");
const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const photo = "data:image/jpeg;base64," + readFileSync(path.join(racine, "public/images/fonds/photo-1722605090433-41d1183a792d-800.jpg")).toString("base64");
const parcoursId = randomUUID();
/** Au-delà, le suivi s'arrête : le CRM lui-même lit un travail perdu après 10 min EN_COURS. */
const SUIVI_MAX_MS = 6 * 60_000;
const INTERVALLE_SUIVI_MS = 3_000;
const RAISONS_CLASSEES = ["service-indisponible", "photo-refusee", "surcharge", "delai", "erreur", "interrompue", "stockage", "purgee"];
let echecs = 0;

const verifier = (ok, libelle, detail = "") => {
  console.log(`${ok ? "  ok " : "  KO "} ${libelle}${detail ? ` — ${detail}` : ""}`);
  if (!ok) echecs++;
};
const poster = async (url, corps, entetes = {}) => {
  const rep = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Origin: SITE, ...entetes }, body: JSON.stringify(corps) });
  return { statut: rep.status, data: await rep.json().catch(() => ({})) };
};
const lire = async (url) => {
  const rep = await fetch(url, { headers: { Origin: SITE }, cache: "no-store" });
  return { statut: rep.status, data: await rep.json().catch(() => ({})) };
};
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`Simulateur de ${SITE} (parcours ${parcoursId})\n1. Préparation`);
const base = { project_type: "cuisine", parcoursId };
const prep = await poster(`${SITE}/api/simulation/prepare`, { ...base, selections: [{ surface: "meubles-bas", ref: "AA05" }, { surface: "credence", ref: "NE31" }] });
verifier(prep.statut === 200 && prep.data.sig && prep.data.prompt?.includes("FINAL CHECK"), "consigne construite et signée", `${prep.data.prompt?.length ?? 0} caractères, ${prep.data.swatchUrls?.length ?? 0} échantillon(s)`);
verifier(prep.data.prompt?.includes("BASE UNITS") && prep.data.prompt?.includes("KITCHEN BACKSPLASH"), "une consigne par surface (meubles bas, crédence)");
verifier(prep.data.prompt?.includes("Wood-grain decor film") && prep.data.prompt?.includes("Marble decor film"), "un descriptif par revêtement (bois, marbre)");
const conflit = await poster(`${SITE}/api/simulation/prepare`, { ...base, selections: [{ surface: "facades-cuisine", ref: "AA05" }, { surface: "meubles-hauts", ref: "AA05" }] });
verifier(conflit.statut === 400 && conflit.data.reason === "surfaces-incompatibles", "surfaces incompatibles refusées", conflit.data.error);
const inconnue = await poster(`${SITE}/api/simulation/prepare`, { ...base, selections: [{ surface: "credence", ref: "ZZZ999" }] });
verifier(inconnue.statut === 400 && inconnue.data.reason === "reference-inconnue", "référence hors catalogue refusée", inconnue.data.error);
const ancien = await poster(`${SITE}/api/simulation/prepare`, { ...base, zone1_ref: "AA05" });
verifier(ancien.statut === 400 && ancien.data.reason === "version", "ancien format : invitation à recharger", ancien.data.error);

let raisonEchec = null;
if (!sansGeneration && prep.statut === 200) {
  console.log("2. Génération sur le CRM (travail asynchrone, suivi jusqu'au rendu)");
  const debut = Date.now();
  const duree = () => `${Math.round((Date.now() - debut) / 1000)} s`;
  const lancement = await poster(CRM, {
    asynchrone: true,
    prompt: prep.data.prompt,
    swatchUrls: prep.data.swatchUrls,
    sig: prep.data.sig,
    exp: prep.data.exp,
    parcoursId,
    projet: "cuisine",
    references: [{ zone: "meubles-bas", libelle: "Meubles bas", ref: "AA05", nom: "Honey Oak" }],
    page: "/simulateur",
    photo_base64: photo,
  });
  if (lancement.statut === 202 && typeof lancement.data.travailId === "string") {
    verifier(true, "travail créé (202)", `attente annoncée ${lancement.data.attenteEstimeeS ?? "?"} s`);
    const urlSuivi = `${CRM}?id=${encodeURIComponent(lancement.data.travailId)}&p=${encodeURIComponent(parcoursId)}`;
    let suivi = await lire(urlSuivi);
    verifier(suivi.statut === 200 && ["EN_ATTENTE", "EN_COURS", "PRETE", "ECHEC"].includes(suivi.data.statut), "suivi lisible tout de suite", `${suivi.data.statut ?? "?"}, HTTP ${suivi.statut}`);
    verifier((await lire(`${CRM}?id=${encodeURIComponent(lancement.data.travailId)}&p=${randomUUID()}`)).statut === 404, "un autre parcours ne voit rien (404)");
    while (suivi.statut === 200 && (suivi.data.statut === "EN_ATTENTE" || suivi.data.statut === "EN_COURS") && Date.now() - debut < SUIVI_MAX_MS) {
      await attendre(INTERVALLE_SUIVI_MS);
      suivi = await lire(urlSuivi);
    }
    if (suivi.statut === 200 && suivi.data.statut === "PRETE") {
      verifier(typeof suivi.data.image === "string" && suivi.data.image.startsWith("data:image/"), "rendu généré", `${duree()}, simulation gardée : ${suivi.data.simulationSiteId ?? "non"}`);
      const image = await fetch(`${CRM}/image?id=${encodeURIComponent(lancement.data.travailId)}&p=${encodeURIComponent(parcoursId)}&quoi=apres`, { headers: { Origin: SITE } });
      verifier(image.status === 200 && (image.headers.get("content-type") ?? "").startsWith("image/"), "rendu servi par adresse (/api/simulate/image)", image.headers.get("content-type") ?? "");
    } else if (suivi.statut === 200 && suivi.data.statut === "ECHEC") {
      raisonEchec = suivi.data.erreur?.raison ?? "erreur";
      const message = suivi.data.erreur?.message;
      verifier(RAISONS_CLASSEES.includes(raisonEchec) && typeof message === "string" && message.length > 40, `échec classé et lisible (${raisonEchec}, ${duree()})`, message);
      if (raisonEchec === "service-indisponible") verifier(/coordonnées/.test(message ?? "") && !/sombre|floue/.test(message ?? ""), "le message ne met pas la photo en cause et propose de laisser ses coordonnées");
    } else {
      verifier(false, "suivi du travail", `HTTP ${suivi.statut}, statut ${suivi.data.statut ?? "?"} après ${duree()}`);
    }
  } else {
    raisonEchec = lancement.data.reason ?? `http-${lancement.statut}`;
    const classee = ["service-indisponible", "ip-quota", "global-quota", "expired", "bad-signature", "internal", "origin"].includes(raisonEchec);
    verifier(classee && typeof lancement.data.error === "string" && lancement.data.error.length > 20, `refus classé et lisible (${raisonEchec}, HTTP ${lancement.statut}, ${duree()})`, lancement.data.error);
  }
}

if (avecContact) {
  console.log("3. Demande sans rendu (photo jointe)");
  const contact = await poster(`${SITE}/api/simulation/contact`, {
    name: "AUDIT TEST Simulateur sans rendu", phone: "06 00 00 00 31", email: "audit-test-31@example.com", ville: "Pérols", codePostal: "34470",
    message: "Essai automatique : demande envoyée alors que la génération a échoué. À archiver.",
    project_type: "cuisine", parcoursId, simulationIds: [], referenceChoisie: "AA05", references: "Meubles bas : AA05 (Honey Oak)",
    photoAvant: photo, simulationEchouee: raisonEchec ?? "essai", formulaire: "simulateur · essai automatique", consentementMail: false, consentementTexte: "essai",
  });
  verifier(contact.statut === 200 && contact.data.success && contact.data.leadId, "lead créé dans le CRM", `leadId ${contact.data.leadId ?? "?"}${contact.data.viaMail ? " (par mail de secours)" : ""}`);
  verifier(contact.data.photos >= 1, "photo du visiteur gardée par le CRM", `${contact.data.photos ?? 0} photo(s)`);
}

console.log(echecs ? `\n${echecs} vérification(s) en échec.` : "\nTout est conforme.");
process.exit(echecs ? 1 : 0);
