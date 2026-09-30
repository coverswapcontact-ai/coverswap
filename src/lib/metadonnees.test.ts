import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, test } from "node:test";
import type { Metadata } from "next";
import { articles } from "@/data/blog-articles";
import { PRESTATIONS } from "@/data/prestations";
import { ZONES, getZoneSlug } from "@/data/zones";
import { IMAGE_PARTAGE, LONGUEUR_MAX_DESCRIPTION, couperDescription, metadonneesPage, urlAbsolue } from "./metadonnees";

/**
 * Mission 16 (partie 5) — les métadonnées de chaque page par `metadonneesPage` : canonical absolu, Open Graph complet
 * (titre, description, adresse, image claire, nom du site, langue), carte de partage, description de 160 caractères
 * au plus ; toutes les pages publiques l'utilisent (plus aucun héritage du titre Open Graph du gabarit).
 */

type OpenGraphComplet = { title: string; description: string; url: string; siteName: string; locale: string; type: string; images: { url: string; width: number; height: number; alt: string }[] };

function verifierComplet(m: Metadata, chemin: string) {
  const canonical = String(m.alternates?.canonical);
  assert.match(canonical, /^https:\/\/coverswap\.fr(\/|$)/, `${chemin} : canonical absolu`);
  assert.equal(canonical, urlAbsolue(chemin), chemin);
  const og = m.openGraph as unknown as OpenGraphComplet;
  assert.ok(og, `${chemin} : Open Graph`);
  const titre = typeof m.title === "object" && m.title && "absolute" in m.title ? m.title.absolute : m.title;
  assert.equal(og.title, titre, `${chemin} : titre Open Graph = titre de la page`);
  assert.equal(og.description, m.description, chemin);
  assert.equal(og.url, canonical, chemin);
  assert.equal(og.siteName, "CoverSwap");
  assert.equal(og.locale, "fr_FR");
  assert.equal(og.type, "website");
  assert.equal(og.images.length, 1);
  assert.equal(og.images[0].url, IMAGE_PARTAGE.url, `${chemin} : l'image claire`);
  assert.deepEqual([og.images[0].width, og.images[0].height], [1200, 630]);
  assert.ok(og.images[0].alt);
  const twitter = m.twitter as { card?: string; title?: string; images?: string[] };
  assert.equal(twitter.card, "summary_large_image");
  assert.equal(twitter.title, titre);
  assert.ok(String(m.description).length <= LONGUEUR_MAX_DESCRIPTION, `${chemin} : ${String(m.description).length} caractères`);
  // Une description d'origine trop longue est coupée à la fin d'une phrase ; jamais au milieu d'un mot.
  assert.ok(!/\s…$/.test(String(m.description)), chemin);
}

describe("metadonneesPage", () => {
  test("canonical absolu, Open Graph complet, carte de partage", () => {
    const m = metadonneesPage({ titre: "Matières | CoverSwap", description: "Les matières.", chemin: "/matieres" });
    assert.deepEqual(m.title, { absolute: "Matières | CoverSwap" });
    assert.equal(m.alternates?.canonical, "https://coverswap.fr/matieres");
    verifierComplet(m, "/matieres");
    assert.equal(urlAbsolue("/"), "https://coverswap.fr");
    assert.equal(urlAbsolue("pro"), "https://coverswap.fr/pro");
    assert.equal(urlAbsolue("https://coverswap.fr/zones"), "https://coverswap.fr/zones");
    const avecImage = metadonneesPage({ titre: "T", description: "D", chemin: "/", image: { url: "https://coverswap.fr/autre.jpg", largeur: 800, hauteur: 400, alt: "Autre" } });
    assert.deepEqual((avecImage.openGraph as unknown as OpenGraphComplet).images, [{ url: "https://coverswap.fr/autre.jpg", width: 800, height: 400, alt: "Autre" }]);
  });

  test("description ≤ 160 : telle quelle si elle tient, sinon à la fin d'une phrase, sinon au dernier mot avec « … »", () => {
    const courte = "Une phrase courte.";
    assert.equal(couperDescription(courte), courte);
    assert.equal(couperDescription("  espaces   en   trop  "), "espaces en trop");
    const phrases = `${"Première phrase assez longue pour occuper la place ".repeat(2).trim()}. ${"Seconde phrase qui déborde ".repeat(5).trim()}.`;
    const coupee = couperDescription(phrases);
    assert.ok(coupee.length <= 160);
    assert.ok(coupee.endsWith("place."), coupee);
    const sansPoint = "mot ".repeat(80).trim();
    const coupeeMot = couperDescription(sansPoint);
    assert.ok(coupeeMot.length <= 160, String(coupeeMot.length));
    assert.ok(coupeeMot.endsWith("mot…"), coupeeMot);
    assert.ok(metadonneesPage({ titre: "T", description: sansPoint, chemin: "/" }).description!.length <= 160);
  });
});

describe("toutes les pages publiques passent par metadonneesPage", () => {
  test("pages statiques : métadonnées complètes", async () => {
    const pages: [string, string][] = [
      ["/", "@/app/page"],
      ["/simulateur", "@/app/simulateur/page"],
      ["/matieres", "@/app/matieres/page"],
      ["/comment-ca-marche", "@/app/comment-ca-marche/page"],
      ["/pro", "@/app/pro/page"],
      ["/contact", "@/app/contact/page"],
      ["/zones", "@/app/zones/page"],
      ["/cgv", "@/app/cgv/page"],
      ["/mentions-legales", "@/app/mentions-legales/page"],
      ["/politique-confidentialite", "@/app/politique-confidentialite/page"],
    ];
    for (const [chemin, module] of pages) {
      const { metadata } = (await import(module)) as { metadata: Metadata };
      verifierComplet(metadata, chemin);
    }
  });

  test("pages générées : réalisations, chaque pièce, chaque ville, chaque guide", async () => {
    // /realisations lit les publications du CRM pour sa description : CRM injoignable simulé (aucune requête réseau).
    const fetchOrigine = globalThis.fetch;
    globalThis.fetch = (async () => new Response("{}", { status: 503 })) as typeof fetch;
    try {
      const realisations = await import("@/app/realisations/page");
      verifierComplet(await realisations.generateMetadata(), "/realisations");
    } finally {
      globalThis.fetch = fetchOrigine;
    }
    const pieces = await import("@/app/prestations/[slug]/page");
    for (const p of PRESTATIONS.filter((x) => x.slug !== "professionnel")) verifierComplet(await pieces.generateMetadata({ params: Promise.resolve({ slug: p.slug }) }), `/prestations/${p.slug}`);
    const zones = await import("@/app/zones/[slug]/page");
    for (const z of ZONES) verifierComplet(await zones.generateMetadata({ params: Promise.resolve({ slug: getZoneSlug(z) }) }), `/zones/${getZoneSlug(z)}`);
    const guides = await import("@/app/blog/[slug]/page");
    for (const a of articles) verifierComplet(await guides.generateMetadata({ params: Promise.resolve({ slug: a.slug }) }), `/blog/${a.slug}`);
  });

  test("aucune page n'écrit ses métadonnées à la main (hors espace client et désinscription, jamais indexés)", () => {
    const APP = join(process.cwd(), "src", "app");
    const pages: string[] = [];
    const parcourir = (dossier: string) => {
      for (const n of readdirSync(dossier)) {
        const chemin = join(dossier, n);
        if (statSync(chemin).isDirectory()) parcourir(chemin);
        else if (n === "page.tsx") pages.push(chemin);
      }
    };
    parcourir(APP);
    const nomDe = (f: string) => relative(APP, f).split(sep).join("/");
    const privees = new Set(["e/[jeton]/page.tsx", "desinscription/page.tsx"]);
    for (const f of pages.filter((x) => !privees.has(nomDe(x)))) {
      const source = readFileSync(f, "utf8");
      assert.match(source, /metadonneesPage\(/, `${nomDe(f)} : metadonneesPage`);
      assert.doesNotMatch(source, /openGraph:|alternates:/, `${nomDe(f)} : métadonnées écrites à la main`);
      // Un fil d'Ariane balisé sur chaque page (sauf l'accueil) ; les pages par pièce le posent par `ContenuPrestation`.
      if (nomDe(f) !== "page.tsx") assert.match(source, /<BreadcrumbSchema|<ContenuPrestation/, `${nomDe(f)} : fil d'Ariane`);
    }
    for (const f of pages.filter((x) => privees.has(nomDe(x)))) assert.match(readFileSync(f, "utf8"), /robots: \{ index: false/, nomDe(f));
  });
});
