#!/usr/bin/env node
/**
 * Vérifie la chaîne du simulateur sur un site en ligne, de bout en bout :
 *   1. /api/simulation/prepare : consigne construite et signée, refus propres
 *      (surfaces incompatibles, référence inconnue, ancien format) ;
 *   2. génération sur le CRM avec une photo d'essai : soit un rendu, soit une
 *      erreur classée et lisible (crédit épuisé, surcharge…) — jamais un échec muet ;
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
let echecs = 0;

const verifier = (ok, libelle, detail = "") => {
  console.log(`${ok ? "  ok " : "  KO "} ${libelle}${detail ? ` — ${detail}` : ""}`);
  if (!ok) echecs++;
};
const poster = async (url, corps, entetes = {}) => {
  const rep = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Origin: SITE, ...entetes }, body: JSON.stringify(corps) });
  return { statut: rep.status, data: await rep.json().catch(() => ({})) };
};

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
  console.log("2. Génération sur le CRM");
  const debut = Date.now();
  const gen = await poster(CRM, { prompt: prep.data.prompt, swatchUrls: prep.data.swatchUrls, sig: prep.data.sig, exp: prep.data.exp, parcoursId, projet: "cuisine", references: [{ zone: "meubles-bas", libelle: "Meubles bas", ref: "AA05", nom: "Honey Oak" }], page: "/simulateur", photo_base64: photo });
  const duree = `${Math.round((Date.now() - debut) / 1000)} s`;
  if (gen.statut === 200 && gen.data.image) verifier(true, "rendu généré", `${duree}, simulation gardée : ${gen.data.simulationSiteId ?? "non"}`);
  else {
    raisonEchec = gen.data.reason ?? `http-${gen.statut}`;
    const classee = ["service-indisponible", "photo-refusee", "surcharge", "delai", "erreur", "ip-quota", "global-quota"].includes(raisonEchec);
    verifier(classee && typeof gen.data.error === "string" && gen.data.error.length > 40, `échec classé et lisible (${raisonEchec}, HTTP ${gen.statut}, ${duree})`, gen.data.error);
    if (raisonEchec === "service-indisponible") verifier(/coordonnées/.test(gen.data.error) && !/sombre|floue/.test(gen.data.error), "le message ne met pas la photo en cause et propose de laisser ses coordonnées");
  }
}

if (avecContact) {
  console.log("3. Demande sans rendu (photo jointe)");
  const contact = await poster(`${SITE}/api/simulation/contact`, {
    name: "AUDIT TEST Simulateur sans rendu", phone: "06 00 00 00 31", email: "audit-test-31@example.com", ville: "Pérols", codePostal: "34470",
    message: "Essai automatique : demande envoyée alors que la génération a échoué. À archiver.",
    project_type: "cuisine", parcoursId, simulationIds: [], rendusLocaux: [], referenceChoisie: "AA05", references: "Meubles bas : AA05 (Honey Oak)",
    photoAvant: photo, simulationEchouee: raisonEchec ?? "essai", formulaire: "simulateur · essai automatique", consentementMail: false, consentementTexte: "essai",
  });
  verifier(contact.statut === 200 && contact.data.success && contact.data.leadId, "lead créé dans le CRM", `leadId ${contact.data.leadId ?? "?"}${contact.data.viaMail ? " (par mail de secours)" : ""}`);
  verifier(contact.data.photos >= 1, "photo du visiteur gardée par le CRM", `${contact.data.photos ?? 0} photo(s)`);
}

console.log(echecs ? `\n${echecs} vérification(s) en échec.` : "\nTout est conforme.");
process.exit(echecs ? 1 : 0);
