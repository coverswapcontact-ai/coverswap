#!/usr/bin/env node
/**
 * Captures d'écran des pages du site (mission 16, partie 6 ; revu pour le site 3.0, lot B0) : 390 / 768 / 1440 px de
 * large, page entière, en JPEG qualité 80, dans `<dossier>/<page>-<largeur>.jpg`. Lancé par l'intégration continue
 * (`.github/workflows/site.yml`) sur le site construit et démarré (`next start -p 3100`), puis comparé à la dernière
 * exécution réussie sur `main` (`scripts/comparer-captures.mjs`).
 *
 *   npm run captures                                   # les six pages de Lighthouse, 3 largeurs, dans captures/
 *   node scripts/captures.mjs sortie --pages=accueil,/prestations/cuisine --largeurs=390,1440
 *   SITE=https://coverswap.fr npm run captures
 *
 * - Sous 768 px, `deviceScaleFactor: 2` (un téléphone se regarde comme sur un téléphone) ; 1 au-dessus.
 * - **Contrôle à 360 px** : chaque page capturée est ouverte à 360 px ; si `scrollWidth` dépasse 360, le script le dit
 *   (avec les éléments qui débordent) et finit avec le code 1, après avoir fait toutes les captures.
 * - **Rien ne part** : toute requête autre que GET/HEAD est coupée (aucun formulaire, aucun événement, aucune
 *   génération), ainsi que les appels au CRM et à `/api/simulate*`, `/api/simulation/*`, `/api/site/evenements`. Seules
 *   les images du CRM (échantillons des matières) passent, en lecture.
 * - Avant chaque capture, la page défile jusqu'en bas puis remonte : les images en `loading="lazy"` et les sections en
 *   `content-visibility: auto` sont rendues (et ces sections sont forcées visibles pour la capture pleine page). Mouvement réduit, animations coupées : deux passages donnent la même image.
 * - Navigateur : le Chromium de Playwright (`npx playwright install chromium`, installé par la CI, jamais au
 *   `npm install`) ; à défaut, Microsoft Edge installé sur le poste.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Les six pages mesurées par la CI (les mêmes que `lighthouserc.json`) : la sélection par défaut. */
export const PAGES_CAPTURES = [
  { nom: "accueil", chemin: "/" },
  { nom: "simulateur", chemin: "/simulateur" },
  { nom: "matieres", chemin: "/matieres" },
  { nom: "realisations", chemin: "/realisations" },
  { nom: "comment-ca-marche", chemin: "/comment-ca-marche" },
  { nom: "pro", chemin: "/pro" },
];

/** Pages connues hors sélection par défaut, appelables par leur nom avec `--pages`. */
export const PAGES_SUPPLEMENTAIRES = [
  { nom: "prestation-cuisine", chemin: "/prestations/cuisine" },
  { nom: "matieres-nf13", chemin: "/matieres?ref=NF13" },
  { nom: "matiere-fiche-nf13", chemin: "/matieres/couleur/NF13" },
];

/** Téléphone, tablette, ordinateur ; la hauteur de fenêtre n'est que celle du premier écran (la capture prend toute la page). */
export const LARGEURS_CAPTURES = [
  { largeur: 390, hauteur: 844, mobile: true },
  { largeur: 768, hauteur: 1024, mobile: false },
  { largeur: 1440, hauteur: 900, mobile: false },
];

/** Aucun débordement horizontal à cette largeur (le plus petit téléphone visé). */
export const LARGEUR_CONTROLE = 360;

/** Format des captures : JPEG qualité 80 (dix fois plus léger qu'un PNG pleine page, assez fin pour juger). */
export const FORMAT_CAPTURE = { type: "jpeg", quality: 80 };

/** Échelle de rendu : 2 sous 768 px, 1 au-dessus. */
export const echelle = (largeur) => (largeur < 768 ? 2 : 1);

export const nomCapture = (page, largeur) => `${page}-${largeur}.jpg`;

/** Le nom de fichier d'une adresse donnée telle quelle (`/matieres?ref=NF13` → `matieres-ref-nf13`). */
export function nomDeChemin(chemin) {
  const nom = chemin.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return nom || "accueil";
}

/** Une page par son nom (connue) ou par son adresse (`/…`). */
function resoudrePage(valeur) {
  if (valeur.startsWith("/")) return [...PAGES_CAPTURES, ...PAGES_SUPPLEMENTAIRES].find((p) => p.chemin === valeur) ?? { nom: nomDeChemin(valeur), chemin: valeur };
  const connue = [...PAGES_CAPTURES, ...PAGES_SUPPLEMENTAIRES].find((p) => p.nom === valeur);
  if (!connue) throw new Error(`page inconnue : « ${valeur} » (un nom connu, ou une adresse qui commence par /)`);
  return connue;
}

/** Une largeur : celles de `LARGEURS_CAPTURES` gardent leur hauteur ; une autre est « téléphone » sous 768 px. */
function resoudreLargeur(valeur) {
  const largeur = Number(valeur);
  if (!Number.isInteger(largeur) || largeur < 320 || largeur > 2560) throw new Error(`largeur invalide : « ${valeur} » (un entier de 320 à 2560)`);
  return LARGEURS_CAPTURES.find((l) => l.largeur === largeur) ?? { largeur, hauteur: largeur < 768 ? 844 : 900, mobile: largeur < 768 };
}

/**
 * Lit la ligne de commande : `[dossier] [--pages=a,b] [--largeurs=390,1440]` (aussi `--pages a,b`). Sans option : les
 * six pages, les trois largeurs, `captures/`.
 */
export function lireOptions(argv) {
  const options = { dossier: "captures", pages: PAGES_CAPTURES, largeurs: LARGEURS_CAPTURES };
  const liste = (v) => v.split(",").map((x) => x.trim()).filter(Boolean);
  let dossierVu = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const m = /^--([a-z-]+)(?:=(.*))?$/.exec(arg);
    if (!m) {
      if (dossierVu) throw new Error(`argument en trop : « ${arg} »`);
      options.dossier = arg;
      dossierVu = true;
      continue;
    }
    const [, nom, valeurEgale] = m;
    if (nom === "etat-resultat") throw new Error("--etat-resultat n'existe pas encore : il arrive avec les captures de livraison (lot G1), une fois la bibliothèque d'images en place");
    if (nom !== "pages" && nom !== "largeurs") throw new Error(`option inconnue : --${nom}`);
    const valeur = valeurEgale ?? argv[++i];
    if (!valeur || valeur.startsWith("--")) throw new Error(`--${nom} attend une liste séparée par des virgules`);
    if (nom === "pages") options.pages = liste(valeur).map(resoudrePage);
    else options.largeurs = liste(valeur).map(resoudreLargeur).sort((a, b) => a.largeur - b.largeur);
  }
  if (options.pages.length === 0 || options.largeurs.length === 0) throw new Error("aucune page ou aucune largeur");
  return options;
}

/**
 * Hôtes du CRM : la production, et ceux des variables d'environnement s'il y en a (Railway est reconnu à part).
 * @param {Record<string, string | undefined>} [env]
 */
export function hotesCrm(env = process.env) {
  const hotes = new Set(["crm.coverswap.fr"]);
  for (const cle of ["NEXT_PUBLIC_CRM_URL", "NEXT_PUBLIC_SIMULATE_URL"]) {
    try {
      if (env[cle]) hotes.add(new URL(env[cle]).hostname);
    } catch {
      // adresse mal formée : ignorée
    }
  }
  return hotes;
}

/**
 * Une requête est-elle coupée pendant les captures ? Oui pour tout ce qui n'est pas GET/HEAD (formulaires, événements,
 * générations), pour `/api/simulate*`, `/api/simulation/*` et `/api/site/evenements` où qu'ils soient, et pour tout
 * appel au CRM sauf ses images (les échantillons des matières, en lecture).
 */
export function requeteCoupee({ methode, url, type }, hotes = hotesCrm()) {
  if (!["GET", "HEAD"].includes(String(methode).toUpperCase())) return true;
  let adresse;
  try {
    adresse = new URL(url);
  } catch {
    return false;
  }
  if (/^\/api\/(simulate|simulation\/|site\/evenements)/.test(adresse.pathname)) return true;
  const crm = hotes.has(adresse.hostname) || adresse.hostname.endsWith(".railway.app");
  return crm && type !== "image";
}

async function faireDefiler(page) {
  await page.evaluate(async () => {
    const pause = (ms) => new Promise((resoudre) => setTimeout(resoudre, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(window.innerHeight * 0.8)) {
      window.scrollTo(0, y);
      await pause(120);
    }
    window.scrollTo(0, 0);
    await pause(200);
  });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
}

async function lancerNavigateur(journal) {
  const { chromium } = await import("playwright");
  try {
    return await chromium.launch();
  } catch (erreur) {
    journal(`Chromium de Playwright absent (${erreur instanceof Error ? erreur.message.split("\n")[0] : erreur}) : Microsoft Edge à la place.`);
    return chromium.launch({ channel: "msedge" });
  }
}

async function nouveauContexte(navigateur, format, coupees) {
  const contexte = await navigateur.newContext({
    viewport: { width: format.largeur, height: format.hauteur },
    deviceScaleFactor: echelle(format.largeur),
    isMobile: format.mobile,
    hasTouch: format.mobile,
    reducedMotion: "reduce",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    serviceWorkers: "block",
  });
  const hotes = hotesCrm();
  await contexte.route("**/*", (route) => {
    const requete = route.request();
    if (requeteCoupee({ methode: requete.method(), url: requete.url(), type: requete.resourceType() }, hotes)) {
      coupees.push(`${requete.method()} ${requete.url()}`);
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
  return contexte;
}

/** Ouvre chaque page à 360 px : `scrollWidth` doit rester ≤ 360. Rend les pages qui débordent, avec les coupables. */
async function controlerDebordement(navigateur, pages, site, coupees) {
  const contexte = await nouveauContexte(navigateur, { largeur: LARGEUR_CONTROLE, hauteur: 780, mobile: true }, coupees);
  const page = await contexte.newPage();
  const debordements = [];
  try {
    for (const p of pages) {
      await page.goto(new URL(p.chemin, site).toString(), { waitUntil: "networkidle", timeout: 60_000 });
      await faireDefiler(page);
      const mesure = await page.evaluate((limite) => {
        const largeur = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        const coupables = [];
        if (largeur > limite) {
          for (const el of document.body.querySelectorAll("*")) {
            const r = el.getBoundingClientRect();
            if (r.right > limite + 1 && r.width > 0) coupables.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${typeof el.className === "string" && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 3).join(".")}` : ""} (droite ${Math.round(r.right)} px)`);
            if (coupables.length >= 5) break;
          }
        }
        return { largeur, coupables };
      }, LARGEUR_CONTROLE);
      if (mesure.largeur > LARGEUR_CONTROLE) debordements.push({ page: p.nom, largeur: mesure.largeur, coupables: mesure.coupables });
    }
  } finally {
    await contexte.close();
  }
  return debordements;
}

export async function capturer({ site = "http://localhost:3100", dossier = "captures", pages = PAGES_CAPTURES, largeurs = LARGEURS_CAPTURES, journal = console.log } = {}) {
  await mkdir(dossier, { recursive: true });
  const navigateur = await lancerNavigateur(journal);
  const faites = [];
  const coupees = [];
  let debordements = [];
  try {
    for (const format of largeurs) {
      const contexte = await nouveauContexte(navigateur, format, coupees);
      const page = await contexte.newPage();
      for (const p of pages) {
        const fichier = path.join(dossier, nomCapture(p.nom, format.largeur));
        await page.goto(new URL(p.chemin, site).toString(), { waitUntil: "networkidle", timeout: 60_000 });
        await faireDefiler(page);
        // Site 3.0 (lot D4) : la page remonte avant la capture pleine page, et le navigateur ne peint plus les sections
        // `content-visibility: auto` (`.sous-la-ligne`) hors du dernier écran : elles sortaient en blanc. On les force.
        await page.addStyleTag({ content: "*{content-visibility:visible !important}" });
        await page.screenshot({ path: fichier, fullPage: true, animations: "disabled", ...FORMAT_CAPTURE });
        faites.push(fichier);
        journal(`capture ${fichier}`);
      }
      await contexte.close();
    }
    debordements = await controlerDebordement(navigateur, pages, site, coupees);
  } finally {
    await navigateur.close();
  }
  return { faites, debordements, coupees };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  let options;
  try {
    options = lireOptions(process.argv.slice(2));
  } catch (erreur) {
    console.error(erreur instanceof Error ? erreur.message : erreur);
    process.exit(2);
  }
  capturer({ site: process.env.SITE || "http://localhost:3100", ...options })
    .then(({ faites, debordements, coupees }) => {
      const distinctes = [...new Set(coupees.map((r) => r.split("?")[0]))];
      console.log(`${faites.length} captures ; ${coupees.length} requête(s) coupée(s)${distinctes.length ? ` : ${distinctes.slice(0, 10).join(", ")}` : ""}.`);
      if (debordements.length === 0) {
        console.log(`Contrôle à ${LARGEUR_CONTROLE} px : aucun débordement horizontal.`);
        return;
      }
      for (const d of debordements) console.error(`Débordement à ${LARGEUR_CONTROLE} px : ${d.page} fait ${d.largeur} px de large${d.coupables.length ? ` (${d.coupables.join(" ; ")})` : ""}.`);
      process.exit(1);
    })
    .catch((erreur) => {
      console.error(erreur);
      process.exit(1);
    });
}
