#!/usr/bin/env node
/**
 * Captures d'écran des six pages du site (mission 16, partie 6) : 375 / 768 / 1440 px de large, page entière, dans
 * `captures/<page>-<largeur>.png`. Lancé par l'intégration continue (`.github/workflows/site.yml`) sur le site construit
 * et démarré (`next start -p 3100`), puis comparé à la dernière exécution réussie sur `main`
 * (`scripts/comparer-captures.mjs`).
 *
 *   npm run captures                         # http://localhost:3100, dans captures/
 *   SITE=https://coverswap.fr npm run captures
 *
 * Avant chaque capture, la page défile jusqu'en bas puis remonte : les images en `loading="lazy"` et les sections en
 * `content-visibility: auto` sont rendues. Mouvement réduit, animations coupées : deux passages donnent la même image.
 * Chromium : `npx playwright install chromium` (l'intégration continue l'installe ; jamais au `npm install`).
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Les six pages mesurées (les mêmes que `lighthouserc.json`). */
export const PAGES_CAPTURES = [
  { nom: "accueil", chemin: "/" },
  { nom: "simulateur", chemin: "/simulateur" },
  { nom: "matieres", chemin: "/matieres" },
  { nom: "realisations", chemin: "/realisations" },
  { nom: "comment-ca-marche", chemin: "/comment-ca-marche" },
  { nom: "pro", chemin: "/pro" },
];

/** Téléphone, tablette, ordinateur ; la hauteur de fenêtre n'est que celle du premier écran (la capture prend toute la page). */
export const LARGEURS_CAPTURES = [
  { largeur: 375, hauteur: 812, mobile: true },
  { largeur: 768, hauteur: 1024, mobile: false },
  { largeur: 1440, hauteur: 900, mobile: false },
];

export const nomCapture = (page, largeur) => `${page}-${largeur}.png`;

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

export async function capturer({ site = "http://localhost:3100", dossier = "captures", journal = console.log } = {}) {
  // Import ici : les exports ci-dessus se lisent (tests) sans charger Playwright.
  const { chromium } = await import("playwright");
  await mkdir(dossier, { recursive: true });
  const navigateur = await chromium.launch();
  const faites = [];
  try {
    for (const format of LARGEURS_CAPTURES) {
      const contexte = await navigateur.newContext({
        viewport: { width: format.largeur, height: format.hauteur },
        deviceScaleFactor: 1,
        isMobile: format.mobile,
        hasTouch: format.mobile,
        reducedMotion: "reduce",
        locale: "fr-FR",
        timezoneId: "Europe/Paris",
      });
      const page = await contexte.newPage();
      for (const p of PAGES_CAPTURES) {
        const fichier = path.join(dossier, nomCapture(p.nom, format.largeur));
        await page.goto(new URL(p.chemin, site).toString(), { waitUntil: "networkidle", timeout: 60_000 });
        await faireDefiler(page);
        await page.screenshot({ path: fichier, fullPage: true, animations: "disabled" });
        faites.push(fichier);
        journal(`capture ${fichier}`);
      }
      await contexte.close();
    }
  } finally {
    await navigateur.close();
  }
  return faites;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  capturer({ site: process.env.SITE || "http://localhost:3100", dossier: process.argv[2] || "captures" })
    .then((faites) => console.log(`${faites.length} captures.`))
    .catch((erreur) => {
      console.error(erreur);
      process.exit(1);
    });
}
