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
 */

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
      "/cgv",
      "/mentions-legales",
      "/politique-confidentialite",
    ];
    assert.deepEqual([...urls].sort(), [...attendues].sort());
    assert.equal(ZONES.length, 8);
  });

  test("dates : le jour de la partie 5 pour les pages, la date de modification pour les guides", () => {
    for (const e of sitemap()) {
      const guide = articles.find((a) => e.url.endsWith(`/blog/${a.slug}`));
      assert.equal((e.lastModified as Date).toISOString(), guide ? new Date(guide.dateModifiedIso).toISOString() : "2026-09-30T00:00:00.000Z", e.url);
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
  });
});
