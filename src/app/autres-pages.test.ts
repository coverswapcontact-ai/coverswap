import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { etudeDeLaPiece } from "@/components/accueil/etudes";
import { classesBouton } from "@/components/simulation/Bouton";
import { articles } from "@/data/blog-articles";
import { FAQ_EAU_CHALEUR, FAQ_GARANTIE, FAQ_GENERALE, FAQ_RETRAIT } from "@/data/faq";
import { PRESTATIONS, getPrestation, lienPiece } from "@/data/prestations";
import { ZONES, getZoneSlug } from "@/data/zones";
import { ACOMPTE_POURCENT, FOURCHETTES, GARANTIE_ANS, PRIX_EXPLICATION, PRIX_PLAGE, VALIDITE_DEVIS_JOURS, euros, fourchette } from "@/lib/offre";
import type { Publication } from "@/lib/publications";
import { FAQ_RESTANTE, INTRO_GUIDES, OBJECTIONS } from "./comment-ca-marche/contenu";

/**
 * Mission 16 (partie 5) — les autres pages rendues : /realisations (réalisations publiées, sinon études simulées
 * étiquetées ; les cinq pièces → pages par pièce), les pages par pièce (titre court, ambiance, étude de cas, bouton
 * de la pièce, balisage), /comment-ca-marche (procédé, prix, objections, guides), les pages locales (plus de
 * `LocalBusiness` par ville). Le CRM est simulé (`fetch` remplacé) : aucune requête réseau.
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;
const echapper = (texte: string) => texte.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const texteHtml = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const sansScripts = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, "");

/** Les liens rendus en bouton principal (ou secondaire) : [adresse, libellé]. */
function boutons(html: string, variante: "principal" | "secondaire"): [string, string][] {
  const motif = new RegExp(`<a class="${echapper(classesBouton(variante))}[^"]*" href="([^"]*)"[^>]*>([^<]*)</a>`, "g");
  return [...html.matchAll(motif)].map((m) => [texteHtml(m[1]), texteHtml(m[2])]);
}

/** Le balisage JSON-LD de la page. */
function balisage(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as Record<string, unknown>);
}

/** Le CRM simulé : les publications demandées, rien d'autre (zones, avis : 404 → replis). */
let publications: Partial<Publication>[] = [];
const fetchOrigine = globalThis.fetch;
before(() => {
  globalThis.fetch = (async (url: string | URL) => {
    if (String(url).endsWith("/api/site/publications")) return new Response(JSON.stringify({ publications }), { status: 200 });
    return new Response("{}", { status: 404 });
  }) as typeof fetch;
});
after(() => {
  globalThis.fetch = fetchOrigine;
});

function publication(p: Partial<Publication> & { id: string }): Partial<Publication> {
  return { type: "REALISATION", titre: `Chantier ${p.id}`, texte: "Façades refaites en noir mat.", ville: "Lattes", typeProjet: "CUISINE", note: null, auteur: null, photoAvant: `/api/site/photos/${p.id}/avant`, photoApres: `/api/site/photos/${p.id}/apres`, publieLe: "2026-09-01T00:00:00.000Z", ...p };
}

async function rendrePage(module: string, props?: Record<string, unknown>): Promise<string> {
  const { default: Page } = (await import(module)) as { default: (p?: Record<string, unknown>) => unknown };
  return texteHtml(renderToStaticMarkup((await Page(props)) as Parameters<typeof renderToStaticMarkup>[0]));
}

describe("/realisations", () => {
  test("sans réalisation publiée : « Ce que ça donne », trois études SIMULÉES étiquetées, « Simuler ma pièce »", async () => {
    publications = [];
    const html = await rendrePage("@/app/realisations/page");
    assert.match(html, /<h1 class="titre-1 max-w-3xl text-encre">Ce que ça donne<\/h1>/);
    assert.equal(compter(html, "<h1"), 1);
    assert.ok(html.includes("Les premières réalisations arrivent"));
    assert.ok(html.includes(">Ambiance</span>") && !html.includes(">Simulation</span>"), "mission 19 : des images générées, toutes « Ambiance »");
    assert.ok(html.includes(`${fourchette("cuisine")} fourni et posé`));
    assert.deepEqual(boutons(html, "principal"), [["/simulateur", "Simuler ma pièce"]]);
    assert.ok(!/Lattes|Réalisation, /.test(html), "jamais une ville, jamais « Réalisation » sur une simulation");
    // La description (Open Graph, carte de partage) ne promet pas de photos de chantier qui n'existent pas.
    const { generateMetadata } = await import("@/app/realisations/page");
    const m = await generateMetadata();
    assert.match(String(m.description), /exemples simulés, étiquetés comme tels/);
    assert.doesNotMatch(String(m.description), /chantier|avis/);
    assert.equal((m.openGraph as { description?: string }).description, m.description);
  });

  test("les cinq pièces → les pages par pièce ; les textes de l'ancien index /prestations sont repris", async () => {
    publications = [];
    const html = await rendrePage("@/app/realisations/page");
    for (const [piece, adresse] of [["cuisine", "/prestations/cuisine"], ["salle-de-bain", "/prestations/salle-de-bain"], ["meubles", "/prestations/meubles"], ["mur-plafond", "/simulateur?projet=mur-plafond"], ["professionnel", "/pro"]] as const) {
      assert.equal(lienPiece(piece), adresse);
      assert.ok(html.includes(`href="${adresse}"`), adresse);
    }
    assert.equal(compter(html, 'aria-pressed="'), 0, "des liens, pas des boutons de choix");
    for (const nom of ["piece-cuisine", "piece-salle-de-bain", "piece-meubles", "piece-murs", "piece-pro"]) assert.ok(html.includes(`/images/prep/${nom}-`), nom);
    for (const texte of ["Un film adhésif Cover Styl' posé à chaud sur vos surfaces existantes : la pièce change de style en une journée, sans démontage ni gravats, et le film se retire sans trace.", `Tarif au mètre linéaire, ${PRIX_PLAGE} fourni et posé : le chiffre se détermine au devis selon la complexité de la pose.`, "Un doute sur ce qui est possible chez vous ? Envoyez des photos : nous vous disons ce qui se recouvre, ce qui ne se recouvre pas, et à quel prix"]) assert.ok(html.includes(texte), texte.slice(0, 40));
    assert.ok(html.includes('href="/contact"') && html.includes('href="/prestations/vitrages"'));
  });

  test("avec des réalisations publiées : une carte chacune (photos du CRM réduites), les avis, un seul bouton principal", async () => {
    publications = [publication({ id: "r1" }), publication({ id: "r2", typeProjet: "SDB", ville: "Pérols", prix: 2400 }), { ...publication({ id: "a1" }), type: "AVIS", texte: "Très propre.", note: 5, auteur: "M. D.", photoAvant: null, photoApres: null }];
    const html = await rendrePage("@/app/realisations/page");
    assert.equal(compter(html, "<article"), 2);
    assert.ok(html.includes("/api/site/photos/r1/apres?l=480 480w"));
    assert.ok(html.includes(euros(2400)));
    assert.ok(html.includes(`Prix habituel : ${fourchette("cuisine")}`));
    assert.ok(html.includes("Avis clients") && html.includes("« Très propre. »"));
    assert.ok(!html.includes("Les premières réalisations arrivent"));
    assert.deepEqual(boutons(html, "principal"), [["/simulateur", "Simuler ma pièce"]]);
    // Plan de titres : h1, puis un h2 (masqué à l'œil) au-dessus des titres h3 des cartes.
    const titres = [...html.matchAll(/<h([1-6])/g)].map((t) => Number(t[1]));
    assert.deepEqual(titres.slice(0, 3), [1, 2, 3], JSON.stringify(titres));
    assert.ok(html.includes('<h2 class="sr-only">Nos chantiers</h2>'));
    const { generateMetadata } = await import("@/app/realisations/page");
    assert.match(String((await generateMetadata()).description), /photos après chantier publiées avec l'accord des clients, et leurs avis\.$/);
    publications = [publication({ id: "r1" })];
    assert.match(String((await generateMetadata()).description), /photos après chantier publiées avec l'accord des clients\.$/);
  });
});

describe("pages par pièce", () => {
  test("titre de 7 mots au plus ; l'ancien titre et les paragraphes restent ; le bouton de la pièce ; « Demander un devis » en secondaire", async () => {
    publications = [];
    for (const slug of ["cuisine", "salle-de-bain", "meubles"]) {
      const p = getPrestation(slug)!;
      assert.ok(p.titreCourt.replace(/[,.:;]/g, "").split(/\s+/).filter(Boolean).length <= 7, p.titreCourt);
      const html = await rendrePage("@/app/prestations/[slug]/page", { params: Promise.resolve({ slug }) });
      assert.ok(html.includes(`<h1 class="titre-1 mt-2 max-w-3xl text-encre">${p.titreCourt}</h1>`), slug);
      assert.equal(compter(html, "<h1"), 1);
      if (p.h1 !== p.titreCourt) assert.ok(html.includes(`>${p.h1}</h2>`), `${slug} : ancien titre gardé`);
      for (const para of p.intro) assert.ok(html.includes(para), `${slug} : paragraphe gardé`);
      const principaux = boutons(html, "principal");
      assert.ok(principaux.length === 2 && principaux.every(([href, libelle]) => href === `/simulateur?projet=${p.simulateur}` && libelle === p.libelleSimuler), `${slug} : ${JSON.stringify(principaux)}`);
      assert.ok(boutons(html, "secondaire").some(([href, libelle]) => href === "/contact" && libelle === "Demander un devis"));
      // L'image d'ambiance de la pièce ouvre la page : étiquetée, prioritaire (une seule).
      assert.ok(html.includes(`/images/prep/piece-${slug === "salle-de-bain" ? "salle-de-bain" : slug}-`), slug);
      assert.equal(compter(html, 'fetchPriority="high"'), 1, slug);
      assert.ok(html.includes(">Ambiance</span>"));
      assert.ok(html.includes(p.prix.fourchette));
      assert.ok(!html.includes('href="/prestations"'), "le fil d'Ariane passe par /realisations");
      const types = balisage(html).map((b) => b["@type"]);
      assert.deepEqual([...types].sort(), ["BreadcrumbList", "FAQPage", "HowTo", "Service"]);
      const service = balisage(html).find((b) => b["@type"] === "Service") as { offers: { url: string }; provider: { "@id": string } };
      assert.equal(service.offers.url, `https://coverswap.fr/simulateur?projet=${p.simulateur}`);
      assert.equal(service.provider["@id"], "https://coverswap.fr/#entreprise");
      const fil = balisage(html).find((b) => b["@type"] === "BreadcrumbList") as { itemListElement: { name: string; item: string }[] };
      assert.deepEqual(fil.itemListElement.map((e) => e.item), ["https://coverswap.fr", "https://coverswap.fr/realisations", `https://coverswap.fr/prestations/${slug}`]);
    }
  });

  test("vitrages : pas de simulateur, « Demander un devis » en principal, pas d'image ni d'étude", async () => {
    publications = [publication({ id: "x", typeProjet: "AUTRE" })];
    const p = getPrestation("vitrages")!;
    const html = await rendrePage("@/app/prestations/[slug]/page", { params: Promise.resolve({ slug: "vitrages" }) });
    assert.ok(html.includes(`>${p.titreCourt}</h1>`));
    assert.ok(boutons(html, "principal").every(([href, libelle]) => href === "/contact" && libelle === "Demander un devis"));
    assert.equal(compter(html, "<picture"), 0);
    assert.ok(!html.includes("Une réalisation"), "un chantier « AUTRE » n'est pas une étude de vitrages");
  });

  test("l'étude de cas : la réalisation publiée de la pièce, sinon sa paire d'ambiance (mission 19 : cuisine, salle de bain, dressing), sinon rien", async () => {
    const cuisine = publication({ id: "c1" }) as Publication;
    const sdb = publication({ id: "s1", typeProjet: "SDB" }) as Publication;
    assert.equal(etudeDeLaPiece("CUISINE", "cuisine", [sdb, cuisine])?.mode, "reelle");
    assert.equal(etudeDeLaPiece("SDB", "salle-de-bain", [sdb, cuisine])?.mode, "reelle");
    assert.equal(etudeDeLaPiece("CUISINE", "cuisine", [sdb])?.mode, "simulee", "la paire d'ambiance de l'ouverture");
    assert.equal(etudeDeLaPiece("CUISINE", "cuisine", [], {}), null, "sans les images de la paire : rien");
    assert.equal(etudeDeLaPiece("SDB", "salle-de-bain", [cuisine])?.mode, "simulee", "la paire de la salle de bain");
    const dressing = etudeDeLaPiece("MEUBLES", "meubles", []);
    assert.ok(dressing?.mode === "simulee" && dressing.etude.image.type === "avant-apres" && dressing.etude.image.apres.includes("meubles-armoire"), "Prestations › Meubles : la paire du dressing");
    assert.equal(etudeDeLaPiece("AUTRE", null, []), null);
    assert.equal(etudeDeLaPiece("CUISINE", "cuisine", [publication({ id: "sans", photoApres: null }) as Publication])?.mode, "simulee", "une réalisation sans photo après n'est pas une étude");

    publications = [cuisine];
    const reelle = await rendrePage("@/app/prestations/[slug]/page", { params: Promise.resolve({ slug: "cuisine" }) });
    assert.ok(reelle.includes("Une réalisation") && reelle.includes("/api/site/photos/c1/apres?l=960 960w"));
    publications = [];
    const simulee = await rendrePage("@/app/prestations/[slug]/page", { params: Promise.resolve({ slug: "cuisine" }) });
    assert.ok(simulee.includes("Ce que ça donne") && simulee.includes(">Ambiance</span>"));
    const salle = await rendrePage("@/app/prestations/[slug]/page", { params: Promise.resolve({ slug: "salle-de-bain" }) });
    assert.ok(salle.includes("Ce que ça donne") && salle.includes("Khaki · K4"), "la paire de la salle de bain, étiquetée");
    const meubles = await rendrePage("@/app/prestations/[slug]/page", { params: Promise.resolve({ slug: "meubles" }) });
    assert.ok(meubles.includes("meubles-dressing-avant") && meubles.includes("Pastel Olive Green · RM30"), "Prestations › Meubles : le dressing avant / après, étiqueté");
  });

  test("« professionnel » n'est plus une page par pièce ; la liste des pièces reste celle des données", () => {
    assert.deepEqual(PRESTATIONS.map((p) => p.slug), ["cuisine", "salle-de-bain", "meubles", "professionnel", "vitrages"]);
    assert.equal(lienPiece("professionnel"), "/pro");
  });
});

describe("/comment-ca-marche", () => {
  const rendre = async () => {
    const { default: Page } = await import("@/app/comment-ca-marche/page");
    return texteHtml(renderToStaticMarkup(createElement(Page)));
  };

  test("procédé, prix, objections, FAQ, devis, guides : dans cet ordre ; « Simuler ma cuisine » en principal", async () => {
    const html = await rendre();
    const ordre = ["comment-ca-marche", "prix", "objections", "faq", "devis", "guides"].map((id) => html.indexOf(`id="${id}"`));
    assert.ok(ordre.every((i) => i > 0), JSON.stringify(ordre));
    assert.deepEqual([...ordre].sort((a, b) => a - b), ordre);
    assert.equal(compter(html, "<h1"), 1);
    const principaux = boutons(html, "principal");
    assert.ok(principaux.length === 2 && principaux.every(([href, libelle]) => href === "/simulateur?projet=cuisine" && libelle === "Simuler ma cuisine"), JSON.stringify(principaux));
    assert.equal(compter(html, "<picture"), 3, "trois étapes avec image");
  });

  test("le prix : au mètre linéaire, ce qui est compris, les fourchettes d'offre.ts, le lien vers l'estimation", async () => {
    const html = await rendre();
    for (const texte of [PRIX_PLAGE, PRIX_EXPLICATION, "Nous mesurons le film réellement posé", `Devis gratuit, valable ${VALIDITE_DEVIS_JOURS} jours, acompte de ${ACOMPTE_POURCENT} % à la commande.`, "Ordres de grandeur par type de projet, fourni et posé", "Compris : le film"]) assert.ok(html.includes(texte), texte.slice(0, 40));
    assert.equal(compter(html, '<th scope="row"'), 4);
    for (const cle of ["cuisine", "sdb", "meuble"] as const) assert.ok(html.includes(fourchette(cle)), cle);
    assert.ok(html.includes("Sur devis après visite"));
    assert.ok(html.includes(FOURCHETTES.cuisine.libelle.slice(1)));
    assert.ok(boutons(html, "secondaire").some(([href, libelle]) => href === "/simulateur?projet=cuisine" && libelle === "Estimer sur ma photo"));
  });

  test("les objections : une ligne, deux phrases au plus ; la FAQ générale fondue dedans, sans doublon (un seul FAQPage)", async () => {
    assert.deepEqual(OBJECTIONS.map((o) => o.sujet), ["durabilité", "entretien", "garantie", "chaleur et eau", "cuisine neuve", "location"]);
    const phrasesDe = (texte: string) => texte.split(/(?<=[.!?])\s+/).filter(Boolean);
    for (const o of OBJECTIONS) {
      assert.ok(o.q.length <= 45, o.q);
      assert.ok(phrasesDe(o.a).length <= 2, `${o.sujet} : ${phrasesDe(o.a).length} phrases`);
    }
    assert.ok(OBJECTIONS.find((o) => o.sujet === "garantie")!.a.includes(`garantis ${GARANTIE_ANS} ans`));
    // Une seule source : les objections qui reprennent la FAQ générale lisent SA réponse ; la FAQ repliée ne les répète pas.
    assert.deepEqual(OBJECTIONS.filter((o) => o.reprend).map((o) => [o.sujet, o.reprend]), [["garantie", FAQ_GARANTIE], ["chaleur et eau", FAQ_EAU_CHALEUR], ["location", FAQ_RETRAIT]]);
    for (const o of OBJECTIONS.filter((x) => x.reprend)) assert.equal(o.a, o.reprend!.a, o.sujet);
    assert.deepEqual(FAQ_RESTANTE, FAQ_GENERALE.filter((q) => ![FAQ_GARANTIE, FAQ_EAU_CHALEUR, FAQ_RETRAIT].includes(q)));
    // Aucune phrase dite deux fois dans « Vos questions » (objections + FAQ repliée).
    const phrases = [...OBJECTIONS, ...FAQ_RESTANTE].flatMap((x) => phrasesDe(x.a));
    assert.deepEqual(phrases.filter((p, i) => phrases.indexOf(p) !== i), []);
    const html = await rendre();
    const visible = sansScripts(html);
    for (const o of OBJECTIONS) assert.ok(visible.includes(o.q) && compter(visible, o.a) === 1, o.sujet);
    for (const q of FAQ_GENERALE) assert.equal(compter(visible, q.a), 1, q.q);
    for (const q of FAQ_RESTANTE) assert.ok(visible.includes(q.q), q.q);
    const faq = balisage(html).filter((b) => b["@type"] === "FAQPage") as { mainEntity: { name: string }[] }[];
    assert.equal(faq.length, 1);
    const noms = faq[0].mainEntity.map((q) => q.name);
    assert.deepEqual(noms, [...OBJECTIONS.map((o) => o.q), ...FAQ_RESTANTE.map((q) => q.q)]);
    assert.equal(new Set(noms).size, noms.length, "chaque question une fois");
    // « Covering » / « film adhésif » expliqué une fois au plus dans le texte de la page (la FAQ générale le fait).
    assert.ok(compter(visible, "film adhésif") <= 1);
  });

  test("les guides (tous, hors menu) et les vitrages ; l'intro de l'ancien index /blog reprise", async () => {
    const html = await rendre();
    for (const a of articles) assert.ok(html.includes(`href="/blog/${a.slug}"`), a.slug);
    assert.ok(html.includes('href="/prestations/vitrages"'));
    assert.ok(html.includes(INTRO_GUIDES));
    assert.ok(INTRO_GUIDES.startsWith("Les vraies questions, les vraies réponses"));
    // Textes de l'ancien accueil (« Ce que ça change ») : pas de travaux, réversible et garanti.
    assert.ok(html.includes("Pas de démontage, pas de poussière, pas de séchage"));
    // L'ouverture provisoire de l'ancien accueil et l'habillage de son module de simulation.
    assert.ok(html.includes("Cuisine, salle de bain, meubles, locaux professionnels : un film Cover Styl' posé sur vos surfaces existantes."));
    assert.ok(html.includes("vous pouvez quitter la page : la simulation continue"));
    assert.ok(html.includes("Le film se retire à chaud") || html.includes("le film se retire à chaud"));
  });
});

describe("pages locales et guides", () => {
  test("une page de ville : plus de LocalBusiness par ville, un Service rattaché à l'entreprise ; « Simuler ma cuisine » ; textes locaux gardés", async () => {
    publications = [];
    for (const zone of [ZONES[0], ZONES.find((z) => z.ville === "Nîmes")!]) {
      const html = await rendrePage("@/app/zones/[slug]/page", { params: Promise.resolve({ slug: getZoneSlug(zone) }) });
      const types = balisage(html).map((b) => b["@type"]);
      assert.ok(!types.includes("LocalBusiness") && !types.includes("HomeAndConstructionBusiness"), JSON.stringify(types));
      const service = balisage(html).find((b) => b["@type"] === "Service") as { areaServed: { "@type": string; name: string }; provider: { "@id": string }; offers: { url: string } };
      assert.deepEqual(service.areaServed, { "@type": "City", name: zone.ville });
      assert.deepEqual(service.provider, { "@id": "https://coverswap.fr/#entreprise" });
      assert.equal(service.offers.url, "https://coverswap.fr/simulateur");
      assert.ok(types.includes("FAQPage") && types.includes("BreadcrumbList"));
      const principaux = boutons(html, "principal");
      assert.ok(principaux.length === 2 && principaux.every(([href, libelle]) => href === "/simulateur?projet=cuisine" && libelle === "Simuler ma cuisine"), JSON.stringify(principaux));
      assert.ok(html.includes(zone.habitat.slice(0, 40)));
      assert.ok(html.includes(`garanti ${GARANTIE_ANS} ans`));
    }
    assert.doesNotMatch(lire("app/zones/[slug]/page.tsx"), /"@type": "LocalBusiness"|ZoneLocalBusinessSchema/);
  });

  test("l'index des zones : « Simuler ma cuisine » en principal, la demande pour une autre ville en secondaire", async () => {
    const { default: Page } = await import("@/app/zones/page");
    const html = texteHtml(renderToStaticMarkup(createElement(Page)));
    assert.deepEqual(boutons(html, "principal"), [["/simulateur?projet=cuisine", "Simuler ma cuisine"]]);
    assert.ok(boutons(html, "secondaire").some(([href]) => href === "/contact"));
    for (const z of ZONES) assert.ok(html.includes(`href="/zones/${getZoneSlug(z)}"`), z.ville);
  });

  test("un guide : fil d'Ariane et retours vers « Comment ça marche » (l'index /blog est redirigé)", () => {
    const guide = lire("app/blog/[slug]/page.tsx");
    assert.match(guide, /const GUIDES = "\/comment-ca-marche#guides";/);
    assert.match(guide, /name: "Comment ça marche", url: `\$\{ENTREPRISE\.site\}\/comment-ca-marche`/);
    assert.match(guide, /<Lien href=\{GUIDES\} variante="secondaire">/);
    assert.match(guide, /<ArticleSchema/);
  });

  test("l'illustration d'un guide : 800 ou 1600 px au choix du navigateur (srcset), plus le seul 1600 px de next/image", async () => {
    assert.doesNotMatch(lire("app/blog/[slug]/page.tsx"), /from "next\/image"/);
    for (const article of articles) {
      const html = await rendrePage("@/app/blog/[slug]/page", { params: Promise.resolve({ slug: article.slug }) });
      const img = html.match(/<img[^>]*srcset="([^"]*)"[^>]*>/i);
      assert.ok(img, article.slug);
      assert.equal(img[1], `${article.image}-800.jpg 800w, ${article.image}-1600.jpg 1600w`);
      assert.match(img[0], /src="[^"]*-800\.jpg"/);
      assert.match(img[0], /sizes="\(min-width: 1200px\) 702px, [^"]*calc\(100vw - 82px\)"/);
      assert.match(img[0], /alt=""/);
    }
  });
});
