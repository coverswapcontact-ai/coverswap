#!/usr/bin/env node
/**
 * Captures d'écran des pages du site (mission 16, partie 6 ; revu pour le site 3.0, lot B0) : 390 / 768 / 1440 px de
 * large, page entière, en JPEG qualité 80, dans `<dossier>/<page>-<largeur>.jpg`. Lancé par l'intégration continue
 * (`.github/workflows/site.yml`) sur le site construit et démarré (`next start -p 3100`), puis comparé à la dernière
 * exécution réussie sur `main` (`scripts/comparer-captures.mjs`).
 *
 *   npm run captures                                   # les huit pages de Lighthouse, 3 largeurs, dans captures/
 *   node scripts/captures.mjs sortie --pages=accueil,/prestations/cuisine --largeurs=390,1440
 *   SITE=https://coverswap.fr npm run captures
 *   node scripts/captures.mjs sortie --pages=simulateur-exemples --etat-resultat --largeurs=390,1440
 *   node scripts/captures.mjs --controle-plan             # seulement le contrôle à 360 px, sur tout le plan du site
 *
 * - `--etat-resultat` (site 3.0, lot G1) ajoute `simulateur-resultat` : l'écran de résultat du simulateur **sans
 *   aucune génération** — un état est écrit dans la mémoire locale (IndexedDB) du navigateur : la photo est l'avant
 *   « bordeaux » de la bibliothèque, le rendu son après « couleur » (NF13 et AG13), la pièce d'exemple posée (donc
 *   « Ambiance · avant / après », jamais « Simulation ») ; la page est rechargée et « Reprendre » cliqué.
 * - `--controle-plan` : lit `/sitemap.xml` du site et ouvre chacune de ses adresses à 360 px (aucune capture).
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

/**
 * Les huit pages mesurées par la CI (les mêmes que `lighthouserc.json`) : la sélection par défaut. Site 3.0, lot F6 :
 * les six d'avant, plus une prestation (cuisine) et une fiche de matière indexée (NF13), où le LCP vient du CRM.
 */
export const PAGES_CAPTURES = [
  { nom: "accueil", chemin: "/" },
  { nom: "simulateur", chemin: "/simulateur" },
  { nom: "matieres", chemin: "/matieres" },
  { nom: "realisations", chemin: "/realisations" },
  { nom: "comment-ca-marche", chemin: "/comment-ca-marche" },
  { nom: "pro", chemin: "/pro" },
  { nom: "prestation-cuisine", chemin: "/prestations/cuisine" },
  { nom: "matiere-fiche-nf13", chemin: "/matieres/couleur/NF13" },
];

/** Pages connues hors sélection par défaut, appelables par leur nom avec `--pages`. */
export const PAGES_SUPPLEMENTAIRES = [
  { nom: "matieres-nf13", chemin: "/matieres?ref=NF13" },
  // Site 3.0, lot G1 : l'écran Photo du simulateur (cuisine choisie), avec « Pas de photo sous la main ? » et ses exemples.
  { nom: "simulateur-exemples", chemin: "/simulateur?projet=cuisine&choix=1" },
];

/**
 * Site 3.0, lot G1 : l'état injecté pour capturer l'écran de résultat sans générer. Les images sont celles de la
 * bibliothèque (servies par le site) ; `photo` est remplie dans la page (l'avant lu en data URL, comme la photo
 * réduite d'un visiteur). `etat-resultat.test.ts` vérifie que le simulateur le relit et ouvre le résultat.
 */
export const RESULTAT_INJECTE = {
  exemple: "cuisine-bordeaux-brillante",
  avant: "/images/prep/cuisine-bordeaux-brillante-avant-1536.jpg",
  apres: "/images/prep/cuisine-bordeaux-brillante-apres-couleur-1536.jpg",
  largeur: 1536,
  hauteur: 1024,
  references: [
    { zone: "facades-cuisine", libelle: "Façades (toutes)", ref: "NF13", nom: "Deep Green" },
    { zone: "plan-de-travail", libelle: "Plan de travail", ref: "AG13", nom: "Pale Oak" },
  ],
  selections: {
    "facades-cuisine": { ref: "NF13", nom: "Deep Green", famille: "couleur", finition: "Soft", categorie: "Color", tags: ["couleur"], image: "" },
    "plan-de-travail": { ref: "AG13", nom: "Pale Oak", famille: "bois", finition: "Soft", categorie: "Wood", tags: ["bois"], image: "" },
  },
};

/** L'état du simulateur (v2) à écrire dans IndexedDB : un parcours né maintenant, un rendu arrivé, aucun travail en cours. */
export function etatResultat(photo, maintenant = Date.now(), donnees = RESULTAT_INJECTE) {
  return {
    version: 2,
    projet: "cuisine",
    photo,
    photoLargeur: donnees.largeur,
    photoHauteur: donnees.hauteur,
    selections: donnees.selections,
    parcoursId: "00000000-0000-4000-8000-00000000c0de",
    parcoursNeLe: maintenant,
    travailEnCours: null,
    rendus: [{ travailId: "capture-g1", simulationSiteId: null, urlApres: donnees.apres, urlAvant: null, references: donnees.references, le: maintenant, exemple: donnees.exemple }],
    analyse: null,
    ville: null,
    codePostal: null,
    refDemandee: null,
    exemple: donnees.exemple,
    majLe: maintenant,
  };
}

/** La page de résultat, ajoutée par `--etat-resultat`. */
export const PAGE_RESULTAT = { nom: "simulateur-resultat", chemin: "/simulateur", scenario: "etat-resultat" };

/** Les chemins des adresses d'un plan du site (`<loc>`), quel que soit son hôte : on les ouvre sur le site mesuré. */
export function cheminsDuPlan(xml) {
  return [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => {
    const u = new URL(m[1].replace(/&amp;/g, "&"));
    return u.pathname + u.search;
  });
}

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
 * huit pages, les trois largeurs, `captures/`.
 */
export function lireOptions(argv) {
  const options = { dossier: "captures", pages: PAGES_CAPTURES, largeurs: LARGEURS_CAPTURES, controlePlan: false };
  const liste = (v) => v.split(",").map((x) => x.trim()).filter(Boolean);
  let dossierVu = false;
  let avecResultat = false;
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
    if (nom === "etat-resultat" || nom === "controle-plan") {
      if (valeurEgale !== undefined) throw new Error(`--${nom} ne prend pas de valeur`);
      if (nom === "controle-plan") options.controlePlan = true;
      else avecResultat = true;
      continue;
    }
    if (nom !== "pages" && nom !== "largeurs") throw new Error(`option inconnue : --${nom}`);
    const valeur = valeurEgale ?? argv[++i];
    if (!valeur || valeur.startsWith("--")) throw new Error(`--${nom} attend une liste séparée par des virgules`);
    if (nom === "pages") options.pages = liste(valeur).map(resoudrePage);
    else options.largeurs = liste(valeur).map(resoudreLargeur).sort((a, b) => a.largeur - b.largeur);
  }
  // `--etat-resultat` seul : le résultat seulement ; avec `--pages` : en plus de ces pages.
  if (avecResultat) options.pages = argv.some((a) => a.startsWith("--pages")) ? [...options.pages, PAGE_RESULTAT] : [PAGE_RESULTAT];
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

/**
 * Écrit l'état du résultat dans la mémoire locale du simulateur (même base, même magasin, même clé que
 * `lib/simulateur/stockage.ts`), la photo étant l'avant de la bibliothèque lu en data URL.
 */
async function injecterResultat(page) {
  await page.evaluate(async ({ avant, etatSansPhoto }) => {
    const blob = await (await fetch(avant)).blob();
    const photo = await new Promise((resoudre, rejeter) => {
      const lecteur = new FileReader();
      lecteur.onload = () => resoudre(lecteur.result);
      lecteur.onerror = () => rejeter(lecteur.error);
      lecteur.readAsDataURL(blob);
    });
    await new Promise((resoudre, rejeter) => {
      const req = indexedDB.open("coverswap-simulateur", 2);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains("etat")) req.result.createObjectStore("etat");
      };
      req.onerror = () => rejeter(req.error);
      req.onsuccess = () => {
        const tx = req.result.transaction("etat", "readwrite");
        tx.objectStore("etat").put({ ...etatSansPhoto, photo }, "courant");
        tx.oncomplete = () => {
          req.result.close();
          resoudre();
        };
        tx.onerror = () => rejeter(tx.error);
      };
    });
  }, { avant: RESULTAT_INJECTE.avant, etatSansPhoto: etatResultat(null) });
}

/** Ouvre une page ; pour `simulateur-resultat`, injecte l'état, recharge et clique « Reprendre ». Puis la fait défiler. */
async function ouvrir(page, p, site) {
  await page.goto(new URL(p.chemin, site).toString(), { waitUntil: "networkidle", timeout: 60_000 });
  if (p.scenario === "etat-resultat") {
    await injecterResultat(page);
    await page.reload({ waitUntil: "networkidle", timeout: 60_000 });
    await page.getByRole("button", { name: "Reprendre", exact: true }).click();
    await page.getByRole("heading", { name: "La composition" }).waitFor({ timeout: 20_000 });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  }
  await faireDefiler(page);
}

/**
 * Au-delà de cette hauteur (pixels de l'image), le navigateur ne peint plus une capture d'un seul tenant : passé
 * 16 384 px, le bas de l'image recommence le haut de la page (relevé au lot G1 sur l'accueil à 390 px, échelle 2 :
 * 29 772 px). La page est alors capturée par tranches, recollées avec sharp.
 */
export const HAUTEUR_MAX_CAPTURE = 16_000;

/** Les tranches `{ y, hauteur }` (pixels CSS) d'une page de `hauteur` px à l'échelle `echelleRendu`. */
export function tranchesCapture(hauteur, echelleRendu, max = HAUTEUR_MAX_CAPTURE) {
  const pas = Math.floor(max / 2 / echelleRendu);
  const tranches = [];
  for (let y = 0; y < hauteur; y += pas) tranches.push({ y, hauteur: Math.min(pas, hauteur - y) });
  return tranches;
}

/** Capture pleine page, d'un seul tenant si elle tient, sinon par tranches recollées (même JPEG qualité 80). */
async function capturerPageEntiere(page, fichier, echelleRendu) {
  const { largeur, hauteur } = await page.evaluate(() => ({ largeur: document.documentElement.clientWidth, hauteur: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) }));
  if (hauteur * echelleRendu <= HAUTEUR_MAX_CAPTURE) {
    await page.screenshot({ path: fichier, fullPage: true, animations: "disabled", ...FORMAT_CAPTURE });
    return;
  }
  const { default: sharp } = await import("sharp");
  const morceaux = [];
  for (const t of tranchesCapture(hauteur, echelleRendu)) {
    const image = await page.screenshot({ clip: { x: 0, y: t.y, width: largeur, height: t.hauteur }, fullPage: true, animations: "disabled", type: "png" });
    morceaux.push({ input: image, top: Math.round(t.y * echelleRendu), left: 0 });
  }
  await sharp({ create: { width: Math.round(largeur * echelleRendu), height: Math.round(hauteur * echelleRendu), channels: 3, background: "#ffffff" } })
    .composite(morceaux)
    .jpeg({ quality: FORMAT_CAPTURE.quality })
    .toFile(fichier);
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
      await ouvrir(page, p, site);
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

export async function capturer({ site = "http://localhost:3100", dossier = "captures", pages = PAGES_CAPTURES, largeurs = LARGEURS_CAPTURES, controlePlan = false, journal = console.log } = {}) {
  if (controlePlan) {
    // Seulement le contrôle à 360 px, sur toutes les adresses du plan du site (aucune capture).
    const reponse = await fetch(new URL("/sitemap.xml", site));
    if (!reponse.ok) throw new Error(`plan du site illisible : ${reponse.status}`);
    const plan = cheminsDuPlan(await reponse.text()).map((chemin) => ({ nom: chemin, chemin }));
    journal(`Contrôle à ${LARGEUR_CONTROLE} px de ${plan.length} adresses du plan du site.`);
    const navigateur = await lancerNavigateur(journal);
    const coupees = [];
    try {
      return { faites: [], debordements: await controlerDebordement(navigateur, plan, site, coupees), coupees };
    } finally {
      await navigateur.close();
    }
  }
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
        await ouvrir(page, p, site);
        // Site 3.0 (lot D4) : la page remonte avant la capture pleine page, et le navigateur ne peint plus les sections
        // `content-visibility: auto` (`.sous-la-ligne`) hors du dernier écran : elles sortaient en blanc. On les force.
        await page.addStyleTag({ content: "*{content-visibility:visible !important}" });
        await capturerPageEntiere(page, fichier, echelle(format.largeur));
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
