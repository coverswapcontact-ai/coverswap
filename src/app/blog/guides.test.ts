import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { classesBouton } from "@/components/simulation/Bouton";
import { PAIRES_SERIE_2, PHOTOS_UTILES } from "@/data/ambiances";
import { articles, getArticleBySlug, type BlogArticle } from "@/data/blog-articles";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { PRIX_PLAGE, fourchette } from "@/lib/offre";
import { lireDepuis } from "@/lib/simulateur/entonnoir";
import { lireComposition } from "@/lib/simulateur/matiere-demandee";
import type { TarifsSite } from "@/lib/tarifs-site";
import { DEPUIS_BLOG, actionDuGuide, illustrationDe, imageDuBalisage, insecables } from "./[slug]/illustration";

/**
 * Site 3.0, lot C7 — les guides écrits avec la bibliothèque (énoncé, § C.2) : trois articles utiles, 800 mots au plus,
 * sans aucun montant écrit (les prix sont ceux du CRM, `ContenuPrix`, ou son repli documenté), le curseur « Ambiance ·
 * avant / après » de leurs paires et les photos utiles « Ambiance », le balisage `Article` sur une image du manifeste,
 * le maillage vers la prestation, le simulateur (`depuis=blog`) et les guides voisins (liens réciproques). Le CRM est
 * simulé (`fetch` remplacé) : aucune requête réseau.
 */
const RACINE = process.cwd();
const lire = (fichier: string) => readFileSync(path.join(RACINE, "src", fichier), "utf8");
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;
const texteHtml = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

const BORDEAUX = "cuisine-bordeaux-brillante-renover-sans-changer";
const JAUNIE = "cuisine-blanche-jaunie-que-faire";
const COMPARATIF = "covering-peinture-remplacement-comparatif";
const VOISINS = ["covering-adhesif-vs-peinture-cuisine", "prix-renovation-cuisine-covering"];

const guide = (slug: string): BlogArticle => {
  const a = getArticleBySlug(slug);
  assert.ok(a, slug);
  return a;
};
const NOUVEAUX = [BORDEAUX, JAUNIE, COMPARATIF].map(guide);

/** Tout le texte d'un guide, tel que la page le montre (titres, paragraphes, astuce, conclusion, liens). */
const texteGuide = (a: BlogArticle) => [a.title, a.excerpt, a.content.intro, ...a.content.sections.flatMap((s) => [s.title, s.text]), a.content.tip ?? "", a.content.conclusion, ...(a.liens ?? []).map((l) => l.libelle)].join(" ");
const mots = (texte: string) => texte.split(/\s+/).filter((m) => /[\p{L}\p{N}]/u.test(m)).length;

/** Le CRM simulé : les tarifs demandés (`null` : il ne répond pas), les appels comptés. */
let tarifs: TarifsSite | null = null;
let appels: string[] = [];
const fetchOrigine = globalThis.fetch;
before(() => {
  globalThis.fetch = (async (url: string | URL) => {
    appels.push(String(url));
    if (String(url).endsWith("/api/site/tarifs") && tarifs) return new Response(JSON.stringify(tarifs), { status: 200 });
    return new Response("{}", { status: 404 });
  }) as typeof fetch;
});
after(() => {
  globalThis.fetch = fetchOrigine;
});

async function rendreGuide(slug: string): Promise<string> {
  const { default: Page } = (await import("./[slug]/page")) as { default: (p: { params: Promise<{ slug: string }> }) => Promise<Parameters<typeof renderToStaticMarkup>[0]> };
  return texteHtml(renderToStaticMarkup(await Page({ params: Promise.resolve({ slug }) })));
}
const balisage = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as Record<string, unknown>);
const essais = (html: string) => [...html.matchAll(/<a[^>]* href="([^"]*)"[^>]*>Essayer cette composition chez moi<\/a>/g)].map((m) => m[1]);
const principaux = (html: string) => [...html.matchAll(new RegExp(`<a class="${classesBouton("principal").replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}[^"]*" href="([^"]*)"[^>]*>([^<]*)</a>`, "g"))].map((m) => [m[1], m[2]]);

describe("les trois guides du lot C7 : les données", () => {
  test("les titres de l'énoncé, la bibliothèque prévue (paires bordeaux et blanche-jaunie, usure-detail, pose-mains, outils-pose)", () => {
    assert.deepEqual(
      NOUVEAUX.map((a) => a.title),
      ["Cuisine bordeaux brillante : la rénover sans la changer", "Cuisine blanche qui a jauni : que faire ?", "Covering, peinture ou remplacement : le vrai comparatif"]
    );
    const images = (a: BlogArticle) => [a.paire ?? a.imagePreparee, ...a.content.sections.flatMap((s) => (s.image ? [s.image] : []))];
    assert.deepEqual(images(guide(BORDEAUX)), ["cuisine-bordeaux-brillante-apres-couleur", "cuisine-bordeaux-brillante-apres-neutre"]);
    assert.deepEqual(images(guide(JAUNIE)), ["cuisine-blanche-jaunie-apres-bois", "usure-detail", "cuisine-blanche-jaunie-apres-couleur"]);
    assert.deepEqual(images(guide(COMPARATIF)), ["pose-mains", "outils-pose"]);
    // Les deux « après » de chaque paire : la même cuisine, deux directions.
    for (const [slug, avant] of [[BORDEAUX, "cuisine-bordeaux-brillante-avant"], [JAUNIE, "cuisine-blanche-jaunie-avant"]] as const) {
      const paire = PAIRES_SERIE_2.find((p) => p.avant === avant);
      assert.ok(paire, avant);
      assert.deepEqual([...images(guide(slug))].filter((n) => n?.includes("-apres-")).sort(), [...paire.apres].sort(), slug);
    }
  });

  test("une seule image d'ouverture par guide (photo de fond, paire ou photo utile), et chaque image de la bibliothèque se résout", () => {
    for (const a of articles) {
      assert.equal([a.image, a.paire, a.imagePreparee].filter(Boolean).length, 1, a.slug);
      for (const nom of [a.paire, a.imagePreparee, ...a.content.sections.map((s) => s.image)].filter((n): n is string => !!n)) {
        const ill = illustrationDe(nom);
        assert.ok(ill, `${a.slug} : ${nom}`);
        if (ill.type === "photo") assert.ok(PHOTOS_UTILES.some((p) => p.image === nom && p.alt === ill.alt));
        else assert.ok(ill.cas.preparees.avant, `${nom} : un « après » de paire`);
      }
      // Une paire ouvre sur son curseur : `paire` est un « après », jamais un avant seul.
      if (a.paire) assert.equal(illustrationDe(a.paire)?.type, "paire", a.slug);
    }
    assert.equal(illustrationDe("cuisine-bordeaux-brillante-avant"), null, "un avant seul n'est jamais montré");
    assert.equal(illustrationDe("inconnue"), null);
  });

  test("800 mots au plus chacun, et un vrai texte (400 au moins)", () => {
    for (const a of NOUVEAUX) {
      const n = mots(texteGuide(a));
      assert.ok(n <= 800 && n >= 400, `${a.slug} : ${n} mots`);
      assert.ok(a.excerpt.length <= 155, `${a.slug} : description de ${a.excerpt.length} caractères`);
    }
  });

  test("aucun montant écrit : ni « € » dans leur texte, ni « \\d+ € » dans les sources du blog ; les prix viennent de ContenuPrix", () => {
    for (const a of NOUVEAUX) {
      assert.doesNotMatch(texteGuide(a), /€/, a.slug);
      assert.doesNotMatch(texteGuide(a), /\d\s*(euros?|EUR)\b/i, a.slug);
      assert.ok(a.content.sections.some((s) => s.prix?.includes("CUISINE")), `${a.slug} : les prix de la cuisine`);
    }
    for (const f of ["data/blog-articles.ts", "app/blog/[slug]/page.tsx", "app/blog/[slug]/illustration.ts"]) assert.ok(!/\d+\s?€/.test(lire(f)), `${f} : un montant écrit`);
  });

  test("le comparatif et ses voisins : liens réciproques, sans les doubler", () => {
    const comparatif = guide(COMPARATIF);
    for (const voisin of VOISINS) {
      assert.ok(comparatif.relatedSlugs.includes(voisin), voisin);
      assert.ok(comparatif.liens?.some((l) => l.href === `/blog/${voisin}`), voisin);
      assert.ok(guide(voisin).relatedSlugs.includes(COMPARATIF), `${voisin} → comparatif`);
    }
    // Un angle à trois options : les quatre critères de l'énoncé, ce que le face-à-face peinture ne traite pas.
    const titres = comparatif.content.sections.map((s) => s.title);
    for (const critere of ["Le délai", "La poussière et le bruit", "La réversibilité", "La durée"]) assert.ok(titres.includes(critere), critere);
    assert.match(texteGuide(comparatif), /[Rr]emplacement/);
    assert.doesNotMatch(texteGuide(guide(VOISINS[0])), /[Rr]emplacement :/);
    // Tous les guides voisins existent (aucun lien mort).
    for (const a of articles) for (const s of a.relatedSlugs) assert.ok(getArticleBySlug(s), `${a.slug} → ${s}`);
  });
});

describe("les trois guides du lot C7 : la page rendue", () => {
  test("bordeaux et blanche-jaunie : deux curseurs « Ambiance · avant / après » (ouverture prioritaire, puis la seconde direction), « Ambiance » sur la photo utile, jamais « Réalisation » ni « Simulation »", async () => {
    for (const [slug, photos] of [[BORDEAUX, 0], [JAUNIE, 1]] as const) {
      const html = await rendreGuide(slug);
      assert.equal(compter(html, 'role="slider"'), 2, slug);
      assert.equal(compter(html, ">Ambiance · avant / après</span>"), 2, slug);
      assert.equal(compter(html, ">Ambiance</span>"), photos, slug);
      assert.doesNotMatch(html, />(Réalisation|Simulation)</, slug);
      // L'ouverture seule est prioritaire (l'avant et l'après de son curseur) ; le reste attend.
      const a = guide(slug);
      const prioritaires = [...html.matchAll(/<img[^>]*fetchPriority="high"[^>]*>/gi)].map((m) => m[0]);
      assert.equal(prioritaires.length, 2, slug);
      for (const img of prioritaires) assert.ok(img.includes(`/images/prep/${a.paire}-`) || img.includes(`/images/prep/${a.paire?.replace(/-apres-[a-z]+$/, "-avant")}-`), img);
      assert.ok(html.includes(`/images/prep/${a.content.sections.find((s) => s.image?.includes("-apres-"))?.image}-`));
      // Les textes des images : ceux de la bibliothèque.
      if (slug === JAUNIE) assert.ok(html.includes(`alt="${PHOTOS_UTILES.find((p) => p.image === "usure-detail")?.alt}"`));
    }
  });

  test("le comparatif : pose-mains en ouverture « Ambiance » prioritaire, outils-pose plus bas, aucun curseur", async () => {
    const html = await rendreGuide(COMPARATIF);
    assert.equal(compter(html, 'role="slider"'), 0);
    assert.equal(compter(html, ">Ambiance</span>"), 2);
    assert.doesNotMatch(html, />(Réalisation|Simulation)</);
    const prioritaires = [...html.matchAll(/<img[^>]*fetchPriority="high"[^>]*>/gi)].map((m) => m[0]);
    assert.equal(prioritaires.length, 1);
    assert.ok(prioritaires[0].includes("/images/prep/pose-mains-"));
    assert.ok(html.indexOf("/images/prep/pose-mains-") < html.indexOf("/images/prep/outils-pose-"));
    for (const nom of ["pose-mains", "outils-pose"]) assert.ok(html.includes(`alt="${PHOTOS_UTILES.find((p) => p.image === nom)?.alt}"`), nom);
  });

  test("le maillage : « Essayer » depuis=blog avec la composition, un seul principal « Simuler ma cuisine », la prestation, les guides voisins", async () => {
    for (const a of NOUVEAUX) {
      const html = await rendreGuide(a.slug);
      for (const lien of essais(html)) {
        const parametres = new URL(lien, "https://coverswap.fr").searchParams;
        assert.equal(lireDepuis(parametres.get("depuis")), DEPUIS_BLOG);
        assert.equal(parametres.get("projet"), "cuisine");
        assert.ok(lireComposition(parametres.get("ref")), lien);
      }
      assert.equal(essais(html).length, a.paire ? 2 : 0, a.slug);
      assert.deepEqual(principaux(html), [["/simulateur?projet=cuisine&depuis=blog", "Simuler ma cuisine"]], a.slug);
      assert.ok(html.includes('href="/prestations/cuisine"'), a.slug);
      for (const s of a.relatedSlugs) assert.ok(html.includes(`href="/blog/${s}"`), `${a.slug} → ${s}`);
    }
    for (const voisin of VOISINS) assert.ok((await rendreGuide(voisin)).includes(`href="/blog/${COMPARATIF}"`), voisin);
    // Un guide sans pièce : « Simuler ma pièce », toujours depuis=blog.
    assert.deepEqual(actionDuGuide({}), { href: "/simulateur?depuis=blog", libelle: "Simuler ma pièce" });
  });

  test("les prix : ceux du CRM tels quels (« Sur devis » sans prix), sinon le repli documenté ; un guide sans prix n'appelle pas le CRM", async () => {
    tarifs = { version: 1, familles: [{ id: "CUISINE", sousParties: [{ id: "facades", libelle: "Façades", metrage: true, prixUnitaire: 97, unite: "ml" }, { id: "credence", libelle: "Crédence", metrage: false, prixUnitaire: null, unite: "ml" }], formats: [] }] };
    let html = await rendreGuide(BORDEAUX);
    assert.ok(html.includes(">97 €/ml</dd>") && !html.includes(">Crédence<"));
    tarifs = { version: 1, familles: [{ id: "CUISINE", sousParties: [{ id: "facades", libelle: "Façades", metrage: true, prixUnitaire: null, unite: "ml" }], formats: [] }] };
    html = await rendreGuide(COMPARATIF);
    assert.ok(html.includes("Sur devis, après une visite ou sur vos photos."));
    tarifs = null;
    html = await rendreGuide(JAUNIE);
    assert.ok(html.includes(PRIX_PLAGE) && html.includes(fourchette("cuisine")));
    appels = [];
    await rendreGuide("entretenir-revetement-adhesif");
    assert.deepEqual(appels, []);
  });

  test("le balisage Article : l'image du manifeste à 1 536 px (fichier présent), la photo de fond pour les premiers guides", async () => {
    for (const a of articles) {
      const html = await rendreGuide(a.slug);
      const article = balisage(html).find((b) => b["@type"] === "Article");
      assert.ok(article, a.slug);
      assert.equal(article.headline, a.title);
      assert.equal(article.datePublished, a.dateIso);
      const image = (article.image as string[])[0];
      assert.equal(image, imageDuBalisage(a));
      const nom = a.paire ?? a.imagePreparee;
      if (nom) {
        assert.equal(image, `https://coverswap.fr/images/prep/${nom}-1536.jpg`);
        assert.equal(Math.max(...MANIFESTE_IMAGES[nom].largeurs), 1536);
      } else assert.equal(image, `https://coverswap.fr${a.image}-1600.jpg`);
      assert.ok(existsSync(path.join(RACINE, "public", image.replace("https://coverswap.fr/", ""))), image);
    }
    assert.equal(imageDuBalisage(guide(COMPARATIF), { "pose-mains": { largeur: 800, hauteur: 600, largeurs: [480, 800] } }), "https://coverswap.fr/images/prep/pose-mains-800.jpg", "jamais agrandie");
  });

  test("la page du guide : sur le papier, sans carte blanche ; trois guides de plus listés à « Comment ça marche »", () => {
    const page = lire("app/blog/[slug]/page.tsx");
    assert.doesNotMatch(page, /bg-white|bg-fond"/);
    assert.match(page, /<ContenuPrix tarifs=\{tarifs\} familles=\{section\.prix\}/);
    assert.equal(articles.length, 12);
    // Jamais un « : » en début de ligne : l'espace qui le précède est insécable dans le titre et le texte affichés.
    const insecable = String.fromCharCode(160);
    assert.equal(insecables("Cuisine bordeaux brillante : la rénover ? Oui ; vite !"), `Cuisine bordeaux brillante${insecable}: la rénover${insecable}? Oui${insecable}; vite${insecable}!`);
  });

  test("la typographie rendue : titre et paragraphes sans espace sécable devant « : »", async () => {
    const html = await rendreGuide(BORDEAUX);
    const h1 = html.match(/<h1[^>]*>([^<]*)<\/h1>/)?.[1] ?? "";
    assert.ok(h1.includes(`brillante${String.fromCharCode(160)}: la`) || h1.includes("brillante&nbsp;: la"), h1);
    const corps = html.slice(html.indexOf("<article"), html.indexOf("</article>"));
    assert.doesNotMatch(corps.replace(/<[^>]*>/g, ""), / [:;?!]/);
    assert.deepEqual(articles.slice(0, 3).map((a) => a.slug), [BORDEAUX, JAUNIE, COMPARATIF]);
  });
});
