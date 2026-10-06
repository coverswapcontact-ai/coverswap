import assert from "node:assert/strict";
import { describe, test } from "node:test";
import nextConfig from "../../next.config";
import { articles } from "@/data/blog-articles";
import { ZONES, getZoneSlug } from "@/data/zones";
import { GET as llms } from "./llms.txt/route";
import robots from "./robots";
import sitemap from "./sitemap";

/**
 * Mission 16 (partie 5) — le sitemap, robots.txt et llms.txt : les six pages du tunnel, les pages par pièce, les 8
 * pages locales et leur index, les guides, les pages légales ; aucune adresse redirigée ; robots ferme l'API,
 * l'espace client et la désinscription.
 * Site 3.0 (lot D5) : les sept familles de matières et les 52 fiches indexées, écrites EN DUR (jamais reconstruites
 * par `fichesIndexees()`) ; aucune fiche en `noindex` ; llms.txt liste les familles.
 */

/** Les sept pages de famille (lot D3). */
const FAMILLES = ["bois", "couleur", "textile", "pierre", "metal", "beton", "paillettes"].map((f) => `/matieres/${f}`);

/** Les 52 fiches indexées (lot D1 : les 49 matières vues dans une ambiance, plus les vedettes NF27, J3, Q1). */
const FICHES = [
  ...["AA14", "AA17", "AG13", "AL26", "AL28", "B4", "D1", "I14", "NE68", "NF27", "NF95", "NH15"].map((r) => `/matieres/bois/${r}`),
  ...["J3", "K1", "K4", "K6", "M10", "M6", "M9", "NE55", "NE56", "NE83", "NF02", "NF04", "NF13", "NF14", "NH21", "NH22", "NH26", "NH27", "NH28", "NH29", "RM01", "RM02", "RM16", "RM19", "RM20", "RM21", "RM23", "RM26", "RM29", "RM30"].map((r) => `/matieres/couleur/${r}`),
  ...["MK15", "NE31", "NE71", "NF99", "NH38", "NH47", "U50"].map((r) => `/matieres/pierre/${r}`),
  ...["NE24", "NH12"].map((r) => `/matieres/beton/${r}`),
  "/matieres/metal/Q1",
];

const BASE = "https://coverswap.fr";
const chemins = () => sitemap().map((e) => e.url.replace(BASE, "") || "/");

describe("sitemap.xml", () => {
  test("aucune adresse redirigée, aucune page privée", async () => {
    const redirigees = ((await nextConfig.redirects?.()) ?? []).map((r) => r.source);
    const urls = chemins();
    for (const source of [...redirigees, "/devis", "/blog", "/prestations", "/revetements", "/prestations/professionnel"]) assert.ok(!urls.includes(source), source);
    for (const u of urls) assert.ok(!/^\/(e\/|api\/|desinscription)/.test(u), u);
    assert.equal(new Set(urls).size, urls.length, "une adresse, une entrée");
    for (const e of sitemap()) assert.ok(e.url.startsWith(BASE), e.url);
  });

  test("toutes les pages présentes : tunnel, pièces, zones, guides, légales", () => {
    const urls = chemins();
    const attendues = [
      "/",
      "/simulateur",
      "/matieres",
      "/realisations",
      "/inspirations",
      "/comment-ca-marche",
      "/pro",
      "/contact",
      "/prestations/cuisine",
      "/prestations/salle-de-bain",
      "/prestations/meubles",
      "/prestations/vitrages",
      "/zones",
      ...ZONES.map((z) => `/zones/${getZoneSlug(z)}`),
      ...articles.map((a) => `/blog/${a.slug}`),
      ...FAMILLES,
      ...FICHES,
      "/cgv",
      "/mentions-legales",
      "/politique-confidentialite",
    ];
    assert.deepEqual([...urls].sort(), [...attendues].sort());
    assert.equal(ZONES.length, 8);
    assert.equal(urls.length, 95, "36 pages, 7 familles, 52 fiches");
  });

  test("lot D5 : les sept familles et les 52 fiches indexées, aucune autre fiche", () => {
    const urls = chemins();
    assert.equal(FAMILLES.length, 7);
    assert.equal(FICHES.length, 52);
    for (const u of ["/matieres/couleur/NF13", "/matieres/bois/D1", "/matieres/pierre/NE31", "/matieres/metal/Q1", "/matieres/bois/NF27", "/matieres/couleur/J3", ...FAMILLES]) assert.ok(urls.includes(u), u);
    // Absentes : deux fiches non indexées (Brown Wenge A1, Hard Silver Q2), AF02 (vue seulement dans une photo utile), l'ancienne adresse.
    for (const u of ["/matieres/textile/A1", "/matieres/metal/Q2", "/matieres/bois/AF02", "/matieres?ref=NF13"]) assert.ok(!urls.includes(u), u);
    assert.equal(urls.filter((u) => /^\/matieres\/[a-z]+\/[A-Z0-9]+$/.test(u)).length, 52);
    for (const e of sitemap().filter((x) => x.url.includes("/matieres/"))) {
      assert.equal((e.lastModified as Date).toISOString(), "2026-10-06T00:00:00.000Z", e.url);
      assert.equal(e.priority, /\/matieres\/[a-z]+\/[A-Z0-9]+$/.test(e.url) ? 0.5 : 0.7, e.url);
    }
  });

  test("dates : le jour de la mise en ligne du site 3.0 pour les pages (lot G2), la date de modification pour les guides", () => {
    for (const e of sitemap().filter((x) => !x.url.includes("/matieres/"))) {
      const guide = articles.find((a) => e.url.endsWith(`/blog/${a.slug}`));
      assert.equal((e.lastModified as Date).toISOString(), guide ? new Date(guide.dateModifiedIso).toISOString() : "2026-10-06T00:00:00.000Z", e.url);
    }
  });
});

describe("robots.txt et llms.txt", () => {
  test("robots : tout ouvert sauf l'API, l'espace client et la désinscription ; le sitemap absolu", () => {
    const r = robots();
    const regles = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    assert.equal(regles.allow, "/");
    assert.deepEqual(regles.disallow, ["/api/", "/e/", "/desinscription"]);
    assert.equal(r.sitemap, `${BASE}/sitemap.xml`);
  });

  test("llms.txt : les nouvelles pages, aucune adresse redirigée", async () => {
    const texte = await llms().text();
    for (const page of ["/simulateur", "/matieres", "/realisations", "/comment-ca-marche", "/pro", "/contact", "/zones", "/prestations/cuisine", "/prestations/vitrages", "/comment-ca-marche#faq", "/cgv"]) assert.ok(texte.includes(`${BASE}${page}`), page);
    for (const a of articles) assert.ok(texte.includes(`${BASE}/blog/${a.slug}`), a.slug);
    for (const z of ZONES) assert.ok(texte.includes(`${BASE}/zones/${getZoneSlug(z)}`), z.ville);
    assert.doesNotMatch(texte, /coverswap\.fr\/(devis|revetements|blog|prestations|prestations\/professionnel|#faq)(\)|\s|$)/);
    assert.match(texte, /bois \(\d+\)/, "les familles du catalogue et leurs nombres");
    // Lot D5 : les sept pages de famille, et l'adresse d'une fiche.
    for (const f of FAMILLES) assert.ok(texte.includes(`${BASE}${f})`), f);
    assert.ok(texte.includes("## Familles de matières"));
    assert.ok(texte.includes(`${BASE}/matieres/couleur/NF13`), "l'exemple de fiche");
  });
});
