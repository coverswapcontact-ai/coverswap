import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, test } from "node:test";
import type { Metadata } from "next";
import { articles } from "@/data/blog-articles";
import { PRESTATIONS } from "@/data/prestations";
import { ZONES, getZoneSlug } from "@/data/zones";
import { DESCRIPTION_PAGE, TITRE_PAGE } from "@/app/comment-ca-marche/contenu";
import { TITRE_ZONES, descriptionVille, descriptionZones, titreVille } from "@/app/zones/textes-seo";
import { DESCRIPTION_META_ACCUEIL, TITRE_META_ACCUEIL } from "@/components/accueil/sections";
import { SLUGS_FAMILLES } from "./pages-familles";
import { parametresDesFiches } from "./fiches-matieres";
import { IMAGE_PARTAGE, LONGUEUR_MAX_DESCRIPTION, LONGUEUR_MAX_TITRE, couperDescription, imagePartage, metadonneesPage, urlAbsolue } from "./metadonnees";

/**
 * Mission 16 (partie 5) — les métadonnées de chaque page par `metadonneesPage` : canonical absolu, Open Graph complet
 * (titre, description, adresse, image claire, nom du site, langue), carte de partage, description de 160 caractères
 * au plus ; toutes les pages publiques l'utilisent (plus aucun héritage du titre Open Graph du gabarit).
 * Site 3.0 (lot F2) : titre de 60 caractères au plus, description de 155 au plus, écrite pour tenir (jamais coupée) ;
 * l'image de partage de chaque page est `imagePartage(chemin)` (son avant / après composé, sinon l'image du site), et
 * le fichier existe.
 */

type OpenGraphComplet = { title: string; description: string; url: string; siteName: string; locale: string; type: string; images: { url: string; width: number; height: number; alt: string }[] };

/** Le fichier d'une image de partage du site (sous `public/`), ou `null` pour une image d'ailleurs (le CRM). */
const fichierPublic = (url: string) => (url.startsWith("https://coverswap.fr/") ? join(process.cwd(), "public", ...url.replace("https://coverswap.fr/", "").split("/")) : null);

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
  // Site 3.0 (lot F2) : l'image de la page (CRM coupé : aucune réalisation publiée), une seule source.
  assert.equal(og.images[0].url, imagePartage(chemin).url, `${chemin} : l'image de partage de la page`);
  const fichier = fichierPublic(og.images[0].url);
  assert.ok(fichier && existsSync(fichier), `${chemin} : ${og.images[0].url} existe`);
  assert.deepEqual([og.images[0].width, og.images[0].height], [1200, 630]);
  assert.ok(og.images[0].alt);
  if (og.images[0].url !== IMAGE_PARTAGE.url) assert.ok(og.images[0].alt.startsWith("Ambiance · avant / après"), `${chemin} : l'image composée dit ce qu'elle est`);
  assert.ok(String(titre).length <= LONGUEUR_MAX_TITRE, `${chemin} : titre de ${String(titre).length} caractères`);
  const twitter = m.twitter as { card?: string; title?: string; images?: string[] };
  assert.equal(twitter.card, "summary_large_image");
  assert.equal(twitter.title, titre);
  assert.ok(String(m.description).length <= LONGUEUR_MAX_DESCRIPTION, `${chemin} : ${String(m.description).length} caractères`);
  // Une description d'origine trop longue est coupée à la fin d'une phrase ; jamais au milieu d'un mot.
  assert.ok(!/\s…$/.test(String(m.description)), chemin);
  // Site 3.0 (lot F2) : écrite pour tenir, jamais coupée au mot.
  assert.ok(!String(m.description).endsWith("…"), `${chemin} : description coupée`);
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
      ["/simulateur", "@/app/simulateur/page"],
      ["/matieres", "@/app/matieres/page"],
      ["/comment-ca-marche", "@/app/comment-ca-marche/page"],
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

  test("pages générées : l'accueil, réalisations, chaque pièce, chaque ville, chaque guide", async () => {
    // /realisations lit les publications du CRM pour sa description : CRM injoignable simulé (aucune requête réseau).
    const fetchOrigine = globalThis.fetch;
    globalThis.fetch = (async () => new Response("{}", { status: 503 })) as typeof fetch;
    try {
      const realisations = await import("@/app/realisations/page");
      verifierComplet(await realisations.generateMetadata(), "/realisations");
      // Site 3.0 (lot B6) : l'accueil choisit son image de partage d'après l'ouverture (une réalisation publiée).
      const accueil = await import("@/app/page");
      verifierComplet(await accueil.generateMetadata(), "/");
      // Site 3.0 (lot F2) : /pro, les pages par pièce et les fiches lisent les publications pour leur image de partage.
      const pro = await import("@/app/pro/page");
      verifierComplet(await pro.generateMetadata(), "/pro");
      const pieces = await import("@/app/prestations/[slug]/page");
      for (const p of PRESTATIONS.filter((x) => x.slug !== "professionnel")) verifierComplet(await pieces.generateMetadata({ params: Promise.resolve({ slug: p.slug }) }), `/prestations/${p.slug}`);
      const fiches = await import("@/app/matieres/[famille]/[ref]/page");
      for (const f of parametresDesFiches()) verifierComplet(await fiches.generateMetadata({ params: Promise.resolve(f) }), `/matieres/${f.famille}/${f.ref}`);
    } finally {
      globalThis.fetch = fetchOrigine;
    }
    const familles = await import("@/app/matieres/[famille]/page");
    for (const famille of SLUGS_FAMILLES) verifierComplet(await familles.generateMetadata({ params: Promise.resolve({ famille }) }), `/matieres/${famille}`);
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
      // Site 3.0 (lot F4) : le fil VISIBLE (`<Breadcrumb`) pose aussi le BreadcrumbList ; aucune page ne balise un fil à part.
      if (nomDe(f) !== "page.tsx") assert.match(source, /<Breadcrumb |<ContenuPrestation/, `${nomDe(f)} : fil d'Ariane`);
      assert.doesNotMatch(source, /<BreadcrumbSchema/, `${nomDe(f)} : un balisage de fil séparé du fil visible`);
    }
    for (const f of pages.filter((x) => privees.has(nomDe(x)))) assert.match(readFileSync(f, "utf8"), /robots: \{ index: false/, nomDe(f));
  });
});

describe("site 3.0 (lot F2) : titres ≤ 60, descriptions écrites pour tenir en 155 (docs/SEO.md)", () => {
  test("les textes d'origine tiennent : rien n'est coupé par couperDescription", () => {
    const titres = [TITRE_META_ACCUEIL, TITRE_PAGE, TITRE_ZONES, ...PRESTATIONS.map((p) => `${p.titreSeo} | CoverSwap`), ...articles.map((a) => `${a.titreSeo ?? a.title} | CoverSwap`), ...ZONES.map((z) => titreVille(z.ville))];
    for (const t of titres) assert.ok(t.length <= LONGUEUR_MAX_TITRE, `${t} (${t.length})`);
    const descriptions = [DESCRIPTION_META_ACCUEIL, DESCRIPTION_PAGE, descriptionZones(ZONES.map((z) => z.ville)), ...PRESTATIONS.map((p) => p.descriptionSeo), ...articles.map((a) => a.excerpt), ...ZONES.map((z) => descriptionVille(z.ville, z.codePostal))];
    for (const d of descriptions) assert.ok(d.length <= LONGUEUR_MAX_DESCRIPTION, `${d} (${d.length})`);
    assert.equal(LONGUEUR_MAX_DESCRIPTION, 155);
    assert.equal(LONGUEUR_MAX_TITRE, 60);
  });

  test("les villes : « Covering adhésif à <ville> », sans majuscule à chaque mot ; le titre le plus complet qui tient", () => {
    assert.equal(titreVille("Lattes"), "Covering adhésif à Lattes, sans travaux | CoverSwap");
    assert.equal(titreVille("Castelnau-le-Lez"), "Covering adhésif à Castelnau-le-Lez | CoverSwap");
    assert.match(descriptionVille("Nîmes", "30000 / 30900"), /^Covering adhésif à Nîmes \(30000\) : cuisine, salle de bain et meubles/);
    for (const z of ZONES) assert.doesNotMatch(titreVille(z.ville), /Adhésif|Rénovation|Jour/);
  });

  test("/realisations : « avis » au titre seulement quand le CRM en publie", async () => {
    const fetchOrigine = globalThis.fetch;
    globalThis.fetch = (async () => new Response("{}", { status: 503 })) as typeof fetch;
    try {
      const realisations = await import("@/app/realisations/page");
      assert.deepEqual((await realisations.generateMetadata()).title, { absolute: "Réalisations de covering à Montpellier | CoverSwap" });
    } finally {
      globalThis.fetch = fetchOrigine;
    }
    assert.match(readFileSync(join(process.cwd(), "src", "app", "realisations", "page.tsx"), "utf8"), /titre: avis\.length > 0 \? TITRE_AVEC_AVIS : TITRE_SANS_AVIS/);
  });
});

describe("site 3.0 (lot F3) : un seul hôte, un canonical par page, aucun par défaut", () => {
  test("le gabarit n'a plus de canonical par défaut ; son adresse est ENTREPRISE.site", () => {
    // Lu comme texte : le gabarit importe globals.css (pas de rendu sous node). La 404 construite est vérifiée en F3
    // sur le build (aucun <link rel="canonical">).
    const gabarit = readFileSync(join(process.cwd(), "src", "app", "layout.tsx"), "utf8");
    assert.doesNotMatch(gabarit, /alternates:|canonical|NEXT_PUBLIC_SITE_URL/, "la 404 et les pages privées ne pointent plus vers l'accueil");
    assert.match(gabarit, /const SITE_URL = ENTREPRISE\.site;/);
    assert.match(gabarit, /metadataBase: new URL\(SITE_URL\)/);
  });

  test("aucune autre adresse du site que ENTREPRISE.site (ni www, ni vercel.app, ni variable d'environnement)", () => {
    const SRC = join(process.cwd(), "src");
    const fichiers: string[] = [];
    const parcourir = (dossier: string) => {
      for (const n of readdirSync(dossier)) {
        const chemin = join(dossier, n);
        if (statSync(chemin).isDirectory()) parcourir(chemin);
        else if (/\.tsx?$/.test(n) && !n.endsWith(".test.ts")) fichiers.push(chemin);
      }
    };
    parcourir(SRC);
    for (const f of fichiers) {
      const texte = readFileSync(f, "utf8");
      assert.doesNotMatch(texte, /NEXT_PUBLIC_SITE_URL|www\.coverswap\.fr|coverswap\.vercel\.app/, relative(SRC, f));
    }
  });

  test("le plan du site cite chaque page fixe indexable, et aucune page privée", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = new Set(sitemap().map((e) => e.url));
    const APP = join(process.cwd(), "src", "app");
    const fixes: string[] = [];
    const parcourir = (dossier: string) => {
      for (const n of readdirSync(dossier)) {
        const chemin = join(dossier, n);
        if (statSync(chemin).isDirectory()) parcourir(chemin);
        else if (n === "page.tsx") fixes.push(relative(APP, dossier).split(sep).join("/"));
      }
    };
    parcourir(APP);
    const publiques = fixes.filter((d) => !d.includes("[") && !/^(e|desinscription)(\/|$)/.test(d));
    assert.ok(publiques.length >= 12, String(publiques.length));
    for (const d of publiques) assert.ok(urls.has(urlAbsolue(`/${d}`)), `/${d} au plan du site`);
    for (const u of urls) assert.doesNotMatch(u, /\/(e|desinscription|api)(\/|$)/, u);
    for (const u of urls) assert.ok(u === "https://coverswap.fr" || u.startsWith("https://coverswap.fr/"), u);
  });
});
