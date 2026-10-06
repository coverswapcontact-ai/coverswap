import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { after, before, describe, test } from "node:test";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CREDIT_AMBIANCE, LOCAL_BUSINESS, LOCAL_BUSINESS_ID, adresseImage, idService, imageObjet, legendeAmbiance } from "@/components/JsonLd";
import { elementsBalisage } from "@/components/Breadcrumb";
import { AMBIANCES } from "@/data/ambiances";
import { ambiances } from "@/lib/ambiances";
import type { Publication } from "@/lib/publications";

/**
 * Site 3.0, lot F4 (énoncé, phase F, « Technique ») : les données structurées des pages rendues — une seule entreprise
 * locale (le gabarit), un `Service` par prestation (`@id` et image juste après `@type`), `FAQPage` sur l'accueil et
 * comment-ça-marche, un `BreadcrumbList` partout où un fil d'Ariane est visible (et lui seul : le fil le pose), un
 * `ImageObject` légendé par avant / après rendu (`creditText` honnête sur les images d'ambiance), du JSON valide ; les
 * textes alternatifs des ambiances disent la pièce et les matières. Le CRM est simulé (`fetch` remplacé) : aucune
 * requête réseau. Les pages sont rendues comme par Next (composants asynchrones compris), le routeur factice.
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");
const SITE = "https://coverswap.fr";
const ROUTEUR = { back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, prefetch() {} };

let publications: Partial<Publication>[] = [];
const fetchOrigine = globalThis.fetch;
before(() => {
  globalThis.fetch = (async (url: string | URL) => (String(url).endsWith("/api/site/publications") ? new Response(JSON.stringify({ publications }), { status: 200 }) : new Response("{}", { status: 404 }))) as typeof fetch;
});
after(() => {
  globalThis.fetch = fetchOrigine;
});

/** La page rendue en HTML, comme le serveur la sert (sans le gabarit). */
async function rendre(module: string, props?: Record<string, unknown>): Promise<string> {
  const { default: Page } = (await import(module)) as { default: (p?: Record<string, unknown>) => unknown };
  const flux = await renderToReadableStream(createElement(AppRouterContext.Provider, { value: ROUTEUR as never }, (await Page(props)) as never));
  await flux.allReady;
  return new Response(flux).text();
}

/** Les blocs JSON-LD de la page : le texte brut et l'objet. */
function blocs(html: string): { brut: string; objet: Record<string, unknown> }[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => ({ brut: m[1], objet: JSON.parse(m[1]) as Record<string, unknown> }));
}
const types = (html: string) => blocs(html).map((b) => String(b.objet["@type"]));
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;
const decoder = (t: string) => t.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

const parametres = (cle: string, valeur: string) => ({ params: Promise.resolve({ [cle]: valeur }) });

/** Les pages publiques, leur adresse et les types attendus (comptés). */
const PAGES: { chemin: string; module: string; props?: Record<string, unknown>; attendus: Record<string, number | "curseurs"> }[] = [
  { chemin: "/", module: "@/app/page", attendus: { Service: 1, FAQPage: 1, ImageObject: "curseurs" } },
  { chemin: "/simulateur", module: "@/app/simulateur/page", attendus: { HowTo: 1, FAQPage: 1, BreadcrumbList: 1 } },
  { chemin: "/matieres", module: "@/app/matieres/page", attendus: { BreadcrumbList: 1 } },
  { chemin: "/matieres/bois", module: "@/app/matieres/[famille]/page", props: parametres("famille", "bois"), attendus: { BreadcrumbList: 1, ImageObject: "curseurs" } },
  { chemin: "/matieres/metal", module: "@/app/matieres/[famille]/page", props: parametres("famille", "metal"), attendus: { BreadcrumbList: 1 } },
  { chemin: "/matieres/couleur/NF13", module: "@/app/matieres/[famille]/[ref]/page", props: { params: Promise.resolve({ famille: "couleur", ref: "NF13" }) }, attendus: { BreadcrumbList: 1 } },
  ...["cuisine", "salle-de-bain", "meubles"].map((slug) => ({ chemin: `/prestations/${slug}`, module: "@/app/prestations/[slug]/page", props: parametres("slug", slug), attendus: { Service: 1, FAQPage: 1, HowTo: 1, BreadcrumbList: 1, ImageObject: "curseurs" as const } })),
  { chemin: "/prestations/vitrages", module: "@/app/prestations/[slug]/page", props: parametres("slug", "vitrages"), attendus: { Service: 1, FAQPage: 1, HowTo: 1, BreadcrumbList: 1 } },
  { chemin: "/pro", module: "@/app/pro/page", attendus: { Service: 1, FAQPage: 1, HowTo: 1, BreadcrumbList: 1, ImageObject: "curseurs" } },
  { chemin: "/comment-ca-marche", module: "@/app/comment-ca-marche/page", attendus: { FAQPage: 1, BreadcrumbList: 1 } },
  { chemin: "/inspirations", module: "@/app/inspirations/page", attendus: { BreadcrumbList: 1, ImageObject: "curseurs" } },
  { chemin: "/realisations", module: "@/app/realisations/page", attendus: { BreadcrumbList: 1, ImageObject: "curseurs" } },
  { chemin: "/zones", module: "@/app/zones/page", attendus: { BreadcrumbList: 1 } },
  { chemin: "/zones/covering-montpellier", module: "@/app/zones/[slug]/page", props: parametres("slug", "covering-montpellier"), attendus: { Service: 1, FAQPage: 1, BreadcrumbList: 1 } },
  { chemin: "/contact", module: "@/app/contact/page", attendus: { BreadcrumbList: 1 } },
  { chemin: "/cgv", module: "@/app/cgv/page", attendus: { BreadcrumbList: 1 } },
  { chemin: "/mentions-legales", module: "@/app/mentions-legales/page", attendus: { BreadcrumbList: 1 } },
  { chemin: "/politique-confidentialite", module: "@/app/politique-confidentialite/page", attendus: { BreadcrumbList: 1 } },
  { chemin: "/blog/cuisine-bordeaux-brillante-renover-sans-changer", module: "@/app/blog/[slug]/page", props: parametres("slug", "cuisine-bordeaux-brillante-renover-sans-changer"), attendus: { Article: 1, BreadcrumbList: 1, ImageObject: "curseurs" } },
  { chemin: "/blog/entretenir-revetement-adhesif", module: "@/app/blog/[slug]/page", props: parametres("slug", "entretenir-revetement-adhesif"), attendus: { Article: 1, BreadcrumbList: 1 } },
];

const rendues = new Map<string, string>();
async function page(chemin: string): Promise<string> {
  const p = PAGES.find((x) => x.chemin === chemin)!;
  if (!rendues.has(chemin)) rendues.set(chemin, await rendre(p.module, p.props));
  return rendues.get(chemin)!;
}

describe("données structurées des pages rendues (site 3.0, lot F4)", () => {
  test("les types attendus par page, comptés : un ImageObject par curseur avant / après, rien d'autre", async () => {
    publications = [];
    for (const p of PAGES) {
      const html = await page(p.chemin);
      const vus: Record<string, number> = {};
      for (const t of types(html)) vus[t] = (vus[t] ?? 0) + 1;
      const curseurs = compter(html, 'role="slider"');
      const attendus = Object.fromEntries(Object.entries(p.attendus).map(([t, n]) => [t, n === "curseurs" ? curseurs : n]));
      assert.deepEqual(vus, attendus, p.chemin);
      if (p.attendus.ImageObject === "curseurs") assert.ok(curseurs >= 1, `${p.chemin} : au moins un avant / après`);
    }
    // Les comptes du rendu du 06/10/2026 (bibliothèque série 2) : ils changent avec les pages, pas en silence.
    const nombre = async (chemin: string) => types(await page(chemin)).filter((t) => t === "ImageObject").length;
    assert.deepEqual(await Promise.all(["/", "/prestations/cuisine", "/prestations/salle-de-bain", "/prestations/meubles", "/pro", "/inspirations", "/realisations"].map(nombre)), [8, 11, 3, 5, 2, 41, 4]);
  });

  test("du JSON valide partout, sans « < » (rien ne peut fermer le script) ; chaque bloc porte @context et @type", async () => {
    for (const p of PAGES) {
      for (const { brut, objet } of blocs(await page(p.chemin))) {
        assert.ok(!brut.includes("<"), `${p.chemin} : « < » dans un bloc`);
        assert.equal(objet["@context"], "https://schema.org", p.chemin);
        assert.equal(typeof objet["@type"], "string", p.chemin);
        assert.deepEqual(Object.keys(objet).slice(0, 2), ["@context", "@type"], p.chemin);
      }
    }
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(LOCAL_BUSINESS)));
  });

  test("UNE entreprise locale : posée par le gabarit, jamais par une page ; les services y renvoient par son @id", async () => {
    assert.equal(LOCAL_BUSINESS["@type"], "HomeAndConstructionBusiness");
    assert.equal(LOCAL_BUSINESS["@id"], `${SITE}/#entreprise`);
    const gabarit = lire("app/layout.tsx");
    assert.equal(compter(gabarit, "<LocalBusinessSchema />"), 1);
    // Aucun autre fichier ne la pose, ni n'écrit une autre fiche d'entreprise.
    const fichiers = (dossier: string): string[] => readdirSync(dossier, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fichiers(join(dossier, e.name)) : /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [join(dossier, e.name)] : []));
    for (const f of fichiers(SRC)) {
      const nom = relative(SRC, f).split(sep).join("/");
      const source = readFileSync(f, "utf8");
      if (nom !== "app/layout.tsx" && nom !== "components/JsonLd.tsx") assert.ok(!source.includes("LocalBusinessSchema"), `${nom} : une seconde entreprise locale`);
      if (nom !== "components/JsonLd.tsx") assert.ok(!/"@type": "(LocalBusiness|HomeAndConstructionBusiness)"/.test(source), `${nom} : une fiche d'entreprise écrite à la main`);
    }
    for (const p of PAGES) {
      const html = await page(p.chemin);
      assert.ok(!types(html).some((t) => /Business$/.test(t)), `${p.chemin} : une entreprise dans la page`);
      for (const { objet } of blocs(html).filter((b) => b.objet["@type"] === "Service")) assert.deepEqual(objet.provider, { "@id": LOCAL_BUSINESS_ID }, p.chemin);
    }
  });

  test("un Service par prestation : @id et image juste après @type ; l'image renvoie à l'ImageObject de l'ouverture posé sur la page", async () => {
    for (const chemin of ["/", "/prestations/cuisine", "/prestations/salle-de-bain", "/prestations/meubles", "/pro", "/prestations/vitrages"]) {
      const html = await page(chemin);
      const service = blocs(html).find((b) => b.objet["@type"] === "Service")!.objet as Record<string, unknown> & { image?: { "@id": string } };
      const url = chemin === "/" ? SITE : `${SITE}${chemin}`;
      assert.equal(service["@id"], idService(url), chemin);
      assert.equal(service["@id"], chemin === "/" ? `${SITE}/#service` : `${SITE}${chemin}#service`);
      if (chemin === "/prestations/vitrages") {
        assert.equal(service.image, undefined, "vitrages : pas d'avant / après, pas d'image");
        assert.deepEqual(Object.keys(service).slice(0, 3), ["@context", "@type", "@id"]);
        continue;
      }
      assert.deepEqual(Object.keys(service).slice(0, 4), ["@context", "@type", "@id", "image"], chemin);
      const image = blocs(html).find((b) => b.objet["@type"] === "ImageObject" && b.objet["@id"] === service.image!["@id"]);
      assert.ok(image, `${chemin} : l'ImageObject de l'ouverture est sur la page`);
      // L'ouverture : le premier avant / après de la page.
      assert.equal(blocs(html).find((b) => b.objet["@type"] === "ImageObject")!.objet["@id"], service.image!["@id"], chemin);
    }
  });

  test("ImageObject : image absolue (la plus grande préparée : 1 536 px, 1 024 en portrait), légende, description, @id unique ; « creditText » d'ambiance sur les images générées", async () => {
    publications = [];
    for (const p of PAGES) {
      const objets = blocs(await page(p.chemin)).filter((b) => b.objet["@type"] === "ImageObject").map((b) => b.objet);
      const ids = objets.map((o) => o["@id"]);
      assert.equal(new Set(ids).size, ids.length, `${p.chemin} : un même avant / après balisé deux fois`);
      for (const o of objets) {
        assert.match(String(o.contentUrl), /^https:\/\/coverswap\.fr\/images\/prep\/[a-z0-9-]+-(1536|1024)\.jpg\?v=[0-9a-f]+$/, p.chemin);
        assert.ok(String(o.caption).length > 10 && String(o.description).startsWith("Ambiance · avant / après. "), `${p.chemin} : ${String(o.caption)}`);
        assert.ok(String(o.description).includes("Image d'ambiance aux teintes du catalogue"), p.chemin);
        assert.equal(o.creditText, CREDIT_AMBIANCE, p.chemin);
      }
    }
    assert.equal(CREDIT_AMBIANCE, "Image d'ambiance générée aux teintes du catalogue");
  });

  test("une réalisation publiée : son ImageObject dit « Réalisation », sans creditText d'ambiance (une vraie photo)", async () => {
    publications = [{ id: "r1", type: "REALISATION", titre: "Cuisine en chêne", texte: "Façades refaites.", ville: "Lattes", typeProjet: "CUISINE", note: null, auteur: null, photoAvant: "https://crm.example.test/api/site/photos/r1/avant", photoApres: "https://crm.example.test/api/site/photos/r1/apres", matieres: [{ ref: "AA14", nom: "Original Oak" }], publieLe: "2026-09-01T00:00:00.000Z" }];
    try {
      const html = await rendre("@/app/realisations/page");
      const objets = blocs(html).filter((b) => b.objet["@type"] === "ImageObject").map((b) => b.objet);
      assert.equal(objets.length, compter(html, 'role="slider"'));
      const reelle = objets.find((o) => String(o.contentUrl).includes("/photos/r1/apres"));
      assert.ok(reelle, "le chantier est balisé");
      assert.equal(reelle.creditText, undefined);
      assert.ok(String(reelle.description).startsWith("Réalisation. Après la pose — Cuisine en chêne, Original Oak AA14"));
      assert.match(decoder(html), /alt="Après la pose — Cuisine en chêne, Original Oak AA14"/, "le texte de l'image dit les matières posées");
      // Les paires d'ambiance qui suivent gardent leur crédit.
      assert.ok(objets.filter((o) => o !== reelle).every((o) => o.creditText === CREDIT_AMBIANCE));
    } finally {
      publications = [];
    }
  });

  test("règles pures : adresse la plus grande, @id sans requête, légende d'ambiance sans « : » ni espace sécable", () => {
    const sources = { jpg: "/images/prep/x-480.jpg?v=ab12cd 480w, /images/prep/x-1536.jpg?v=ab12cd 1536w, /images/prep/x-960.jpg?v=ab12cd 960w" };
    assert.equal(adresseImage("/images/prep/x-960.jpg?v=ab12cd", sources), `${SITE}/images/prep/x-1536.jpg?v=ab12cd`);
    assert.equal(adresseImage("https://crm.example.test/p/apres"), "https://crm.example.test/p/apres");
    const o = imageObjet({ src: "/images/prep/x-960.jpg?v=ab12cd", sources, legende: "L.", description: "D.", ambiance: true });
    assert.deepEqual(Object.keys(o), ["@context", "@type", "@id", "contentUrl", "caption", "description", "creditText"]);
    assert.equal(o["@id"], `${SITE}/images/prep/x-1536.jpg#image`);
    assert.equal(imageObjet({ src: "https://crm.example.test/p/apres", legende: "L.", description: "D.", ambiance: false }).creditText, undefined);
    assert.equal(legendeAmbiance("Cuisine en L", [{ surface: "façades", nom: "Deep Green", ref: "NF13" }, { surface: "plan de travail", nom: "Pale Oak", ref: "AG13" }]), "Cuisine en L. Façades Deep Green NF13, plan de travail Pale Oak AG13.");
  });

  test("FAQPage sur l'accueil et comment-ça-marche, une seule par page", async () => {
    for (const chemin of ["/", "/comment-ca-marche"]) assert.equal(types(await page(chemin)).filter((t) => t === "FAQPage").length, 1, chemin);
    for (const p of PAGES) assert.ok(types(await page(p.chemin)).filter((t) => t === "FAQPage").length <= 1, p.chemin);
  });
});

describe("le fil d'Ariane, visible ET balisé (site 3.0, lot F4)", () => {
  test("toute page intérieure a son fil visible, et son BreadcrumbList dit exactement ce qu'on lit (noms, ordre, adresses ; la dernière est la page)", async () => {
    for (const p of PAGES.filter((x) => x.chemin !== "/")) {
      const html = await page(p.chemin);
      const nav = html.match(/<nav aria-label="Fil d&#x27;Ariane"[^>]*>([\s\S]*?)<\/nav>/);
      assert.ok(nav, `${p.chemin} : fil visible`);
      assert.equal(compter(html, 'aria-label="Fil d&#x27;Ariane"'), 1, p.chemin);
      const lus = [...nav[1].matchAll(/<a [^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>|<span class="text-encre" aria-current="page">([^<]*)<\/span>/g)].map((m) => ({ href: m[1] ? decoder(m[1]) : null, label: decoder(m[2] ?? m[3]) }));
      const liste = blocs(html).find((b) => b.objet["@type"] === "BreadcrumbList")!.objet as { itemListElement: { "@type": string; position: number; name: string; item: string }[] };
      assert.deepEqual(liste.itemListElement.map((e) => e.name), lus.map((l) => l.label), p.chemin);
      assert.deepEqual(liste.itemListElement.map((e) => e.position), lus.map((_, i) => i + 1));
      assert.equal(liste.itemListElement[0].item, SITE);
      lus.slice(0, -1).forEach((l, i) => assert.equal(liste.itemListElement[i].item, l.href === "/" ? SITE : `${SITE}${l.href!.replace(/#.*$/, "")}`, p.chemin));
      assert.equal(liste.itemListElement.at(-1)!.item, `${SITE}${p.chemin}`, `${p.chemin} : le dernier élément est la page`);
    }
  });

  test("un guide : le titre du guide des deux côtés (plus « Guide ») ; l'ancre #guides reste au lien visible, pas au balisage", async () => {
    const html = await page("/blog/cuisine-bordeaux-brillante-renover-sans-changer");
    assert.match(html, /<span class="text-encre" aria-current="page">Rénover une cuisine bordeaux brillante<\/span>/);
    assert.match(html, /href="\/comment-ca-marche#guides"/);
    assert.deepEqual(elementsBalisage([{ label: "Accueil", href: "/" }, { label: "Comment ça marche", href: "/comment-ca-marche#guides" }]), [
      { name: "Accueil", url: SITE },
      { name: "Comment ça marche", url: `${SITE}/comment-ca-marche` },
    ]);
  });

  test("le fil du simulateur passe sous l'outil (le premier écran reste au simulateur) ; les pages légales et le contact l'ont au-dessus du h1", async () => {
    const simulateur = await page("/simulateur");
    assert.ok(simulateur.indexOf('aria-label="Fil d&#x27;Ariane"') > simulateur.indexOf("Comment ça marche</h2>") - 2000 && simulateur.indexOf('aria-label="Fil d&#x27;Ariane"') < simulateur.indexOf("Comment ça marche</h2>"));
    for (const chemin of ["/contact", "/cgv", "/mentions-legales", "/politique-confidentialite"]) {
      const html = await page(chemin);
      assert.ok(html.indexOf('aria-label="Fil d&#x27;Ariane"') < html.indexOf("<h1"), chemin);
    }
  });
});

describe("textes alternatifs (site 3.0, lot F4)", () => {
  test("chaque ambiance : la pièce (sa scène), chaque surface et sa matière (nom et référence), et « image d'ambiance », en français", () => {
    for (const a of ambiances(AMBIANCES)) {
      assert.ok(a.alt.startsWith(`${a.scene}. `), a.id);
      for (const s of a.surfaces) assert.ok(a.alt.toLowerCase().includes(`${s.surface} ${s.nom} ${s.ref}`.toLowerCase()), `${a.id} : ${s.ref}`);
      assert.ok(a.alt.endsWith("Image d'ambiance aux teintes du catalogue."), a.id);
    }
  });

  test("sur les pages rendues, chaque image d'ambiance porte le texte de son ambiance (jamais vide), son « avant » dit la pièce d'origine", async () => {
    publications = [];
    // Les ambiances (les photos utiles, décoratives à côté de leur texte, peuvent être muettes : `alt=""`).
    const resolues = ambiances(AMBIANCES).filter((a) => a.inspiration);
    const parImage = new Map(resolues.map((a) => [a.image, a.alt] as const));
    for (const chemin of ["/", "/prestations/cuisine", "/inspirations", "/realisations", "/pro"]) {
      const html = decoder(await page(chemin));
      let vues = 0;
      for (const m of html.matchAll(/<img [^>]*src="\/images\/prep\/([a-z0-9-]+?)-\d+\.jpg[^"]*"[^>]*alt="([^"]*)"/g)) {
        const [, nom, alt] = m;
        if (parImage.has(nom)) {
          // Muette seulement dans un lien qui a son propre texte (la rangée « Ambiances » de l'accueil, qui nomme chaque
          // matière ; les cartes des pièces de /realisations, nommées par la pièce) : le lien dit déjà ce qu'on voit.
          if (alt === "") {
            const debut = html.lastIndexOf("<a ", m.index);
            assert.ok(debut > html.lastIndexOf("</a>", m.index), `${chemin} : ${nom} muette hors d'un lien`);
            const texte = html.slice(debut, html.indexOf("</a>", m.index)).replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
            assert.ok(texte.replace(/Ambiance/g, "").trim().length > 3, `${chemin} : ${nom} muette dans un lien sans texte`);
          } else assert.equal(alt, parImage.get(nom), `${chemin} : ${nom}`);
          vues++;
        } else if (/-avant$/.test(nom)) assert.match(alt, /\. Image d'ambiance\.$/, `${chemin} : ${nom}`);
      }
      assert.ok(vues > 0, chemin);
    }
  });

  test("aucune page n'écrit un BreadcrumbList à part du fil visible (une seule liste)", () => {
    assert.match(lire("components/Breadcrumb.tsx"), /<BreadcrumbSchema items=\{elementsBalisage\(items\)\} \/>/);
    assert.match(lire("components/ContenuPrestation.tsx"), /<Breadcrumb items=\{fil\} \/>/);
  });
});
