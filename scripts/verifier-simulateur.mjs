#!/usr/bin/env node
/**
 * Vérifie la chaîne du simulateur sur un site en ligne, de bout en bout :
 *   1. /api/simulation/prepare : sélections validées contre la liste de zones du CRM et signées
 *      (mission 15, partie 4 : le site ne construit plus de prompt), refus propres
 *      (zones incompatibles, référence inconnue, zone hors pièce) ;
 *   2. génération sur le CRM avec une photo d'essai, au contrat ASYNCHRONE de la
 *      mission 15 : POST { projet, selections, sig, exp, parcoursId, photo_base64, asynchrone: true }
 *      → 202 { travailId, attenteEstimeeS }, puis sondage GET ?id=&p= jusqu'à PRETE ou ECHEC —
 *      soit un rendu, soit une erreur classée et lisible, jamais un échec muet ;
 *   3. avec --contact : la demande part au CRM avec la photo quand la génération a échoué.
 *
 *   node scripts/verifier-simulateur.mjs                     (coverswap.fr, étapes 1 et 2)
 *   node scripts/verifier-simulateur.mjs --sans-generation   (étape 1 seule, ne coûte rien)
 *   node scripts/verifier-simulateur.mjs --contact           (crée un lead « AUDIT TEST » dans le CRM)
 *   SITE=http://localhost:3010 node scripts/verifier-simulateur.mjs
 *
 * Coût : une génération réussie ≈ 0,10 à 0,25 € selon le nombre de zones ; une génération refusée ne coûte rien.
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
verifier(prep.statut === 200 && typeof prep.data.sig === "string" && Array.isArray(prep.data.selections), "sélections validées et signées", `${prep.data.selections?.length ?? 0} zone(s), expire dans ${prep.data.exp ? Math.round((prep.data.exp - Date.now()) / 1000) : "?"} s`);
verifier(!("prompt" in prep.data), "aucun prompt construit par le site (le CRM construit la consigne)");
verifier(prep.data.projet === "cuisine" && prep.data.selections?.every((s) => typeof s.surface === "string" && typeof s.ref === "string"), "le corps signé ne porte que la pièce et les sélections");
const conflit = await poster(`${SITE}/api/simulation/prepare`, { ...base, selections: [{ surface: "facades-cuisine", ref: "AA05" }, { surface: "meubles-hauts", ref: "AA05" }] });
verifier(conflit.statut === 400 && conflit.data.reason === "surfaces-incompatibles", "zones incompatibles refusées", conflit.data.error);
const inconnue = await poster(`${SITE}/api/simulation/prepare`, { ...base, selections: [{ surface: "credence", ref: "ZZZ999" }] });
verifier(inconnue.statut === 400 && inconnue.data.reason === "reference-inconnue", "référence hors catalogue refusée", inconnue.data.error);
const horsPiece = await poster(`${SITE}/api/simulation/prepare`, { ...base, selections: [{ surface: "plan-vasque", ref: "AA05" }] });
verifier(horsPiece.statut === 400 && horsPiece.data.reason === "zone-inconnue", "zone d'une autre pièce refusée", horsPiece.data.error);
const vide = await poster(`${SITE}/api/simulation/prepare`, { ...base, selections: [] });
verifier(vide.statut === 400 && vide.data.reason === "aucune-zone", "sans zone : refus clair", vide.data.error);

let raisonEchec = null;
if (!sansGeneration && prep.statut === 200) {
  console.log("2. Génération sur le CRM (travail asynchrone, suivi jusqu'au rendu)");
  const debut = Date.now();
  const duree = () => `${Math.round((Date.now() - debut) / 1000)} s`;
  const lancement = await poster(CRM, {
    asynchrone: true,
    projet: prep.data.projet,
    selections: prep.data.selections,
    sig: prep.data.sig,
    exp: prep.data.exp,
    parcoursId,
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
      verifier(Array.isArray(suivi.data.references) && suivi.data.references.some((r) => r.libelle === "Crédence" && r.ref === "NE31"), "références relues par le CRM (libellé de la source unique)");
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
    const classee = ["service-indisponible", "ip-quota", "global-quota", "expired", "bad-signature", "internal", "origin", "zone-non-visible"].includes(raisonEchec);
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
