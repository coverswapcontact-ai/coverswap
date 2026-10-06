import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import sitemap from "@/app/sitemap";
import { ENTREPRISE } from "@/lib/entreprise";

/**
 * Site 3.0, lot F6 (énoncé, phase F, point 1 ; plan, F6) : « un texte utile de 300 mots au moins par page indexée ».
 * Les pages indexées sont celles du plan du site (`sitemap.ts` : accueil, simulateur, matières, familles, fiches
 * indexées, prestations, `/pro`, comment ça marche, inspirations, réalisations, zones, villes, guides, contact, pages
 * légales) : chacune est RENDUE comme par Next (composants asynchrones, routeur factice, CRM simulé — aucune requête
 * réseau), sans l'en-tête ni le pied de page (le gabarit), donc le contenu du `<main>` seul ; les scripts (JSON-LD) et
 * les styles sont retirés, un mot est une suite sans espace qui porte au moins une lettre ou un chiffre. Le seuil
 * n'est pas un objectif de bourrage : c'est le plancher sous lequel une page n'a rien à dire (docs/SEO.md).
 */

const SEUIL = 300;
const ROUTEUR = { back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, prefetch() {} };
const fetchOrigine = globalThis.fetch;
before(() => {
  globalThis.fetch = (async (url: string | URL) => (String(url).endsWith("/api/site/publications") ? new Response(JSON.stringify({ publications: [] }), { status: 200 }) : new Response("{}", { status: 404 }))) as typeof fetch;
});
after(() => {
  globalThis.fetch = fetchOrigine;
});

/** Le module et les paramètres de la page d'une adresse du plan du site. */
function pageDeLAdresse(chemin: string): { module: string; props?: Record<string, unknown> } {
  const params = (p: Record<string, string>) => ({ params: Promise.resolve(p) });
  const [premier, deuxieme, troisieme] = chemin.split("/").filter(Boolean);
  if (!premier) return { module: "@/app/page" };
  if (premier === "matieres" && troisieme) return { module: "@/app/matieres/[famille]/[ref]/page", props: params({ famille: deuxieme, ref: troisieme }) };
  if (premier === "matieres" && deuxieme) return { module: "@/app/matieres/[famille]/page", props: params({ famille: deuxieme }) };
  if (["prestations", "zones", "blog"].includes(premier) && deuxieme) return { module: `@/app/${premier}/[slug]/page`, props: params({ slug: deuxieme }) };
  return { module: `@/app/${premier}/page` };
}

async function rendre(chemin: string): Promise<string> {
  const { module, props } = pageDeLAdresse(chemin);
  const { default: Page } = (await import(module)) as { default: (p?: Record<string, unknown>) => unknown };
  const flux = await renderToReadableStream(createElement(AppRouterContext.Provider, { value: ROUTEUR as never }, (await Page(props)) as never));
  await flux.allReady;
  return new Response(flux).text();
}

/** Le texte rendu d'une page : sans scripts ni styles, entités décodées, espaces resserrés. */
function texteRendu(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const compterMots = (texte: string) => texte.split(" ").filter((m) => /[\p{L}\p{N}]/u.test(m)).length;

const ADRESSES = sitemap().map((e) => e.url.slice(ENTREPRISE.site.length) || "/");

describe("300 mots rendus sur chaque page indexée (site 3.0, lot F6)", () => {
  test("le compte : balises, scripts et styles retirés ; un mot porte une lettre ou un chiffre", () => {
    const html = `<div><h1>Rénover sa cuisine</h1><script type="application/ld+json">{"a":"pas compté du tout"}</script><p>En 1 journée — sans travaux : l&#x27;atelier</p><style>.x{color:red}</style></div>`;
    assert.equal(texteRendu(html), "Rénover sa cuisine En 1 journée — sans travaux : l'atelier");
    assert.equal(compterMots(texteRendu(html)), 9);
    assert.equal(pageDeLAdresse("/matieres/couleur/NF13").module, "@/app/matieres/[famille]/[ref]/page");
    assert.equal(pageDeLAdresse("/matieres/bois").module, "@/app/matieres/[famille]/page");
    assert.equal(pageDeLAdresse("/zones/covering-lattes").module, "@/app/zones/[slug]/page");
    assert.equal(pageDeLAdresse("/").module, "@/app/page");
    assert.equal(pageDeLAdresse("/contact").module, "@/app/contact/page");
  });

  test(`les ${ADRESSES.length} adresses du plan du site, toutes au-dessus de ${SEUIL} mots`, async () => {
    // Le plan du site est la liste des pages indexées : aucune n'y manque (les comptes exacts sont dans sitemap.test.ts).
    for (const attendue of ["/", "/simulateur", "/matieres", "/contact", "/pro", "/zones", "/matieres/bois", "/matieres/couleur/NF13", "/prestations/vitrages", "/blog/entretenir-revetement-adhesif"]) assert.ok(ADRESSES.includes(attendue), attendue);
    const sous: string[] = [];
    const comptes = new Map<string, number>();
    for (const chemin of ADRESSES) {
      const mots = compterMots(texteRendu(await rendre(chemin)));
      comptes.set(chemin, mots);
      if (mots < SEUIL) sous.push(`${chemin} : ${mots} mots`);
    }
    assert.deepEqual(sous, [], `pages sous ${SEUIL} mots`);
    // Les deux pages qui manquaient au relevé du lot F1 (contact 205, matières 287) ont désormais leur texte.
    assert.ok(comptes.get("/contact")! >= SEUIL && comptes.get("/matieres")! >= SEUIL);
  });

  test("le texte ajouté au lot F6 est celui de la page, pas un bourrage : /contact dit le délai, ce qu'il faut joindre et où l'on pose ; /matieres dit comment choisir", async () => {
    const contact = texteRendu(await rendre("/contact"));
    for (const phrase of ["Après votre message", "Ce qui nous aide à vous répondre juste", "Où nous intervenons", "Rien ne vous engage avant la signature du devis."]) assert.ok(contact.includes(phrase), phrase);
    const matieres = texteRendu(await rendre("/matieres"));
    assert.ok(matieres.includes("Choisir sans se tromper"));
    assert.ok(matieres.includes("avant de commander quoi que ce soit"));
    // Une phrase n'est jamais répétée pour gonfler le compte.
    for (const texte of [contact, matieres]) {
      const phrases = texte.split(/(?<=[.!?])\s+/).filter((p) => p.length > 40);
      assert.equal(new Set(phrases).size, phrases.length, "une phrase répétée");
    }
  });
});
