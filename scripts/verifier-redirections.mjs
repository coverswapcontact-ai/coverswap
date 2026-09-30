#!/usr/bin/env node
/**
 * Vérifie les redirections permanentes du site EN LIGNE (mission 16, partie 5), après un déploiement : chaque
 * ancienne adresse répond 301 ou 308 (Next répond 308 pour `permanent: true`) avec un `location` vers sa nouvelle
 * page ; la requête (`?famille=bois`) passe telle quelle. Une sonde HEAD par adresse, sans suivre la redirection ;
 * aucun effet de bord, aucun coût.
 *
 *   node scripts/verifier-redirections.mjs                       (https://coverswap.fr)
 *   SITE=https://<aperçu>.vercel.app node scripts/verifier-redirections.mjs
 *
 * La liste est celle de `next.config.ts › redirects` (le test `src/redirections.test.ts` vérifie qu'elles ne
 * divergent pas). Code de sortie 1 si une adresse ne redirige pas comme attendu.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

/** [ancienne adresse, nouvelle adresse] — la même liste que `next.config.ts`. */
export const REDIRECTIONS_ATTENDUES = [
  ["/simulation", "/simulateur"],
  ["/blog/tendances-deco-2025-covering", "/blog/quelle-finition-choisir"],
  ["/devis", "/simulateur"],
  ["/prestations/professionnel", "/pro"],
  ["/revetements", "/matieres"],
  ["/prestations", "/realisations"],
  ["/blog", "/comment-ca-marche"],
];

/** Des sondes avec une requête : elle doit passer telle quelle. */
export const SONDES_AVEC_REQUETE = [["/revetements?famille=bois", "/matieres?famille=bois"]];

/**
 * Le chemin (et la requête) d'un en-tête `location`, absolu ou relatif.
 * @param {string | null} location
 * @param {string} site
 * @returns {string | null}
 */
export function cheminDe(location, site) {
  if (!location) return null;
  const url = new URL(location, site);
  return `${url.pathname}${url.search}`;
}

/**
 * Sonde chaque adresse (HEAD, `redirect: "manual"`) et rend la liste des constats ; `sonder` est remplaçable (tests :
 * aucune requête réseau).
 * @typedef {{ status: number, headers: { get(nom: string): string | null } }} ReponseSonde
 * @param {{ site?: string, sonder?: (url: string) => Promise<ReponseSonde>, journal?: (ligne: string) => void }} [options]
 * @returns {Promise<{ source: string, destination: string, statut: number, vers: string | null, ok: boolean }[]>}
 */
export async function verifierRedirections({ site = "https://coverswap.fr", sonder = (url) => fetch(url, { method: "HEAD", redirect: "manual" }), journal = console.log } = {}) {
  const base = site.replace(/\/$/, "");
  const constats = [];
  for (const [source, destination] of [...REDIRECTIONS_ATTENDUES, ...SONDES_AVEC_REQUETE]) {
    let statut = 0;
    let vers = null;
    try {
      const reponse = await sonder(`${base}${source}`);
      statut = reponse.status;
      vers = cheminDe(reponse.headers.get("location"), base);
    } catch (erreur) {
      vers = `erreur : ${erreur instanceof Error ? erreur.message : String(erreur)}`;
    }
    const ok = (statut === 301 || statut === 308) && vers === destination;
    constats.push({ source, destination, statut, vers, ok });
    journal(`${ok ? "  ok " : "  KO "} ${source} → ${destination}${ok ? ` (${statut})` : ` — reçu ${statut || "rien"}${vers ? `, location ${vers}` : ""}`}`);
  }
  return constats;
}

// Lancé directement (pas importé par le test) ; sans `await` au premier niveau : le test l'importe via tsx en CommonJS.
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const site = process.env.SITE || "https://coverswap.fr";
  console.log(`Redirections de ${site}`);
  verifierRedirections({ site })
    .then((constats) => {
      const echecs = constats.filter((c) => !c.ok).length;
      console.log(echecs ? `\n${echecs} redirection(s) en défaut.` : `\nToutes les redirections répondent (${constats.length}).`);
      process.exit(echecs ? 1 : 0);
    })
    .catch((erreur) => {
      console.error(erreur);
      process.exit(1);
    });
}
