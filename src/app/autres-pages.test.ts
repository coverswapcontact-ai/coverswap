import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IMAGE_OUVERTURE, LEGENDE_OUVERTURE } from "@/components/accueil/etudes";
import ContenuPrestation, { vueDeLaPrestation } from "@/components/ContenuPrestation";
import { classesBouton, type VarianteBouton } from "@/components/simulation/Bouton";
import { PAIRES_SERIE_2, PHOTOS_UTILES } from "@/data/ambiances";
import { CAS_PRESTATIONS, casDeLaPrestation } from "@/data/cas-prestations";
import { articles } from "@/data/blog-articles";
import { FAQ_EAU_CHALEUR, FAQ_GARANTIE, FAQ_GENERALE, FAQ_RETRAIT } from "@/data/faq";
import { PRESTATIONS, getPrestation, lienPiece } from "@/data/prestations";
import { ZONES, getZoneSlug } from "@/data/zones";
import { ACOMPTE_POURCENT, DELAI_RENDU, DELAI_REPONSE_COURT, DUREE_POSE_TEXTE, FOURCHETTES, GARANTIE_ANS, PRIX_EXPLICATION, PRIX_PLAGE, VALIDITE_DEVIS_JOURS, euros, fourchette } from "@/lib/offre";
import { ambianceDeLImage } from "@/lib/ambiances";
import { lienMatiere, matiereCartel } from "@/lib/matieres-vedettes";
import type { Publication } from "@/lib/publications";
import { lireDepuis } from "@/lib/simulateur/entonnoir";
import { lireComposition, lireRefDemandee } from "@/lib/simulateur/matiere-demandee";
import type { TarifsSite } from "@/lib/tarifs-site";
import { teintePrestation } from "@/lib/teintes-prestations";
import { A_PREPARER, DEROULE, ENTRETIEN, FAQ_RESTANTE, GUIDE_ENTRETIEN, INTRO_GUIDES, OBJECTIONS, QUAND_RENOVER_NON, QUAND_RENOVER_OUI, RESTE_EN_PLACE, SIGNES_RENOVER } from "./comment-ca-marche/contenu";
import { AVANTAGES_DEVIS_EN_LIGNE, ETAPES_DEVIS_EN_LIGNE } from "./comment-ca-marche/devis-en-ligne";

/**
 * Mission 16 (partie 5) — les autres pages rendues : /realisations (réalisations publiées, sinon études simulées
 * étiquetées ; les cinq pièces → pages par pièce), les pages par pièce (site 3.0, lot C1 : titre court, ouverture
 * avant / après — la réalisation de la pièce d'abord —, cas d'ambiance, vedettes, prix du CRM, villes, teinte, bouton
 * de la pièce, balisage), /comment-ca-marche (procédé, déroulé et délais, ce qui reste en place, entretien, prix,
 * objections, « Quand rénover ? », guides ; lot C3), les pages locales (plus de
 * `LocalBusiness` par ville). Le CRM est simulé (`fetch` remplacé) : aucune requête réseau.
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;
const echapper = (texte: string) => texte.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const texteHtml = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const sansScripts = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, "");

/** Les liens rendus en bouton principal (ou secondaire) : [adresse, libellé]. */
function boutons(html: string, variante: VarianteBouton): [string, string][] {
  const motif = new RegExp(`<a class="${echapper(classesBouton(variante))}[^"]*" href="([^"]*)"[^>]*>([^<]*)</a>`, "g");
  return [...html.matchAll(motif)].map((m) => [texteHtml(m[1]), texteHtml(m[2])]);
}

/** Le balisage JSON-LD de la page. */
function balisage(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as Record<string, unknown>);
}

/** Le CRM simulé : les publications demandées, rien d'autre (zones, avis : 404 → replis). */
let publications: Partial<Publication>[] = [];
/** Les tarifs publiés par le CRM simulé (`null` : 404, le repli). Ceux de la production au 6 octobre 2026, en partie. */
let tarifsCrm: TarifsSite | null = null;
const TARIFS_CRM: TarifsSite = {
  version: 1,
  familles: [
    { id: "CUISINE", sousParties: [{ id: "facades-hautes", libelle: "Façades hautes", metrage: true, prixUnitaire: 110, unite: "ml" }, { id: "credence", libelle: "Crédence", metrage: false, prixUnitaire: null, unite: "ml" }], formats: [] },
    { id: "SDB", sousParties: [{ id: "meuble-vasque", libelle: "Meuble vasque", metrage: true, prixUnitaire: null, unite: "ml" }], formats: [] },
    { id: "MEUBLES", sousParties: [{ id: "portes-dressing", libelle: "Portes de dressing", metrage: false, prixUnitaire: 50, unite: "ml" }, { id: "meuble-tv", libelle: "Meuble TV", metrage: false, prixUnitaire: 65, unite: "ml" }], formats: [] },
    { id: "PRO", sousParties: [{ id: "comptoir", libelle: "Comptoir", metrage: true, prixUnitaire: 55, unite: "ml" }], formats: [] },
  ],
};
const fetchOrigine = globalThis.fetch;
before(() => {
  globalThis.fetch = (async (url: string | URL) => {
    if (String(url).endsWith("/api/site/publications")) return new Response(JSON.stringify({ publications }), { status: 200 });
    if (String(url).endsWith("/api/site/tarifs") && tarifsCrm) return new Response(JSON.stringify(tarifsCrm), { status: 200 });
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
  /** Les liens « Essayer cette composition chez moi » : leurs adresses. */
  const essais = (html: string) => [...html.matchAll(/<a[^>]* href="([^"]*)"[^>]*>Essayer cette composition chez moi<\/a>/g)].map((m) => texteHtml(m[1]));

  test("sans réalisation publiée : « Ce que ça donne », « Les premières réalisations arrivent », puis les avant / après EN AMBIANCE étiquetés, « Simuler ma pièce »", async () => {
    publications = [];
    const html = await rendrePage("@/app/realisations/page");
    assert.match(html, /<h1 class="titre-1 max-w-3xl text-encre">Ce que ça donne<\/h1>/);
    assert.equal(compter(html, "<h1"), 1);
    assert.ok(html.includes("Les premières réalisations arrivent"));
    // Site 3.0 (lot C5) : quatre paires d'ambiance, chacune « Ambiance · avant / après » (+ l'étiquette en tête de section), jamais « Simulation ».
    assert.equal(compter(html, "<article"), 4);
    assert.equal(compter(html, ">Ambiance · avant / après</span>"), 4 + 1);
    assert.ok(!html.includes(">Simulation</span>") && !/simulés?/.test(html), "des images générées, jamais présentées comme des rendus du simulateur");
    // Sans le CRM : la plage au mètre linéaire, jamais une fourchette par pièce (relecture des lots B et C).
    assert.ok(html.includes(`Notre tarif : ${PRIX_PLAGE}, fourni et posé`) && !html.includes(fourchette("cuisine")));
    assert.deepEqual(boutons(html, "principal"), [["/simulateur?depuis=realisations", "Simuler ma pièce"]], "le principal dit d'où il vient (relecture des lots B et C)");
    assert.ok(!/Lattes|Réalisation, |>Réalisation</.test(html), "jamais une ville, jamais « Réalisation » sur une image d'ambiance");
    // La description (Open Graph, carte de partage) ne promet pas de photos de chantier qui n'existent pas.
    const { generateMetadata } = await import("@/app/realisations/page");
    const m = await generateMetadata();
    assert.match(String(m.description), /exemples en ambiance, étiquetés comme tels/);
    assert.doesNotMatch(String(m.description), /chantier|avis|simulé/);
    assert.equal((m.openGraph as { description?: string }).description, m.description);
  });

  test("« Avant / après en ambiance » : une section séparée, après les vrais chantiers ; quatre paires (cuisine, salle de bain, meubles, pro), leurs cartels, le tarif du CRM, « Essayer » depuis=realisations", async () => {
    const { PAIRES_REALISATIONS, pairesRealisations, prixPaire } = await import("@/app/realisations/paires");
    tarifsCrm = TARIFS_CRM;
    const paires = pairesRealisations(TARIFS_CRM);
    assert.deepEqual(paires.map((p) => p.id), ["cuisine", "salle-de-bain", "meubles", "professionnel"], "les quatre paires sont préparées");
    // Les mêmes paires que les ouvertures des pages de prestation, et le comptoir de /pro : une paire, une histoire.
    assert.deepEqual(PAIRES_REALISATIONS.map((p) => p.apres), [CAS_PRESTATIONS.cuisine.ouverture.apres, CAS_PRESTATIONS["salle-de-bain"].ouverture.apres, CAS_PRESTATIONS.meubles.ouverture.apres, "pro-comptoir-accueil-apres-bois"]);
    assert.ok(paires.every((p) => p.cas.preparees.avant), "des paires, jamais un avant seul ni un après seul");
    // Relecture des lots B et C : le tarif de la famille LU AU CRM — plus la fourchette d'offre.ts qui le contredisait
    // (une salle de bain chiffrée là où le CRM dit « Sur devis », un comptoir « sur devis » là où il publie un prix).
    assert.deepEqual(paires.map((p) => p.prix), [
      `Notre tarif : ${euros(110)}/ml, fourni et posé · pose en une journée en général`,
      "Sur devis, après une visite ou sur vos photos · pose en une journée en général",
      `Notre tarif : dès ${euros(50)}/ml, fourni et posé`,
      `Notre tarif : ${euros(55)}/ml, fourni et posé`,
    ]);
    assert.equal(prixPaire({ famille: "SDB", enUneJournee: false }, null), `Notre tarif : ${PRIX_PLAGE}, fourni et posé`, "sans le CRM : la plage au mètre linéaire");
    for (const p of paires) for (const cle of ["cuisine", "sdb", "meuble"] as const) assert.ok(!p.prix.includes(fourchette(cle)), `${p.id} : ${cle}`);

    for (const avecChantiers of [false, true]) {
      publications = avecChantiers ? [publication({ id: "r1" })] : [];
      const html = await rendrePage("@/app/realisations/page");
      const debut = html.indexOf('id="en-ambiance"');
      assert.ok(debut > 0);
      assert.ok(debut > html.indexOf(avecChantiers ? "Nos chantiers" : "Les premières réalisations arrivent"), "les vraies d'abord");
      const section = html.slice(debut, html.indexOf("Ce que nous recouvrons"));
      assert.ok(section.includes(">Avant / après en ambiance</h2>"));
      assert.equal(compter(section, 'role="slider"'), 4);
      assert.equal(compter(section, "<article"), 4);
      for (const p of paires) {
        assert.ok(section.includes(`>${p.cas.nom}</h3>`), p.cas.nom);
        assert.ok(section.includes(`/images/prep/${p.cas.ambiance.avant}-`) && section.includes(`/images/prep/${p.cas.ambiance.image}-`), p.id);
        for (const m of p.cas.matieres) assert.ok(section.includes(`${m.matiere.id} · `), `${p.id} : ${m.matiere.id}`);
        assert.ok(texteHtml(section).includes(p.prix), p.prix);
        // Chaque carte à la teinte de sa prestation.
        assert.ok(section.includes(`--teinte:${teintePrestation(p.id)!.teinte.hex}`), `${p.id} : teinte`);
      }
      const liens = essais(section);
      assert.equal(liens.length, 4);
      for (const lien of liens) {
        const parametres = new URLSearchParams(lien.split("?")[1]);
        assert.equal(lireDepuis(parametres.get("depuis")), "realisations", lien);
        assert.ok(lireComposition(lireRefDemandee(parametres.get("ref")))?.length, lien);
      }
      assert.equal(boutons(section, "principal").length, 0, "une seule action principale, hors de la section");
      assert.ok(!section.includes(">Simulation</span>") && !section.includes("Lattes"));
    }
    // La valeur `depuis` est documentée au suivi.
    assert.ok(readFileSync(join(process.cwd(), "docs", "SUIVI.md"), "utf8").includes("`realisations`"));
    tarifsCrm = null;
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
    assert.equal(compter(html, "<article"), 2 + 4, "les deux chantiers, puis les quatre avant / après en ambiance");
    assert.ok(html.indexOf("/api/site/photos/r2/apres") < html.indexOf('id="en-ambiance"'), "les vraies d'abord");
    assert.ok(html.includes("/api/site/photos/r1/apres?l=480 480w"));
    assert.ok(html.includes(euros(2400)));
    assert.ok(!html.includes("Prix habituel"), "sans prix publié, aucun prix sur la carte d'un chantier (relecture des lots B et C)");
    assert.ok(html.includes("Avis clients") && html.includes("« Très propre. »"));
    assert.ok(!html.includes("Les premières réalisations arrivent"));
    assert.deepEqual(boutons(html, "principal"), [["/simulateur?depuis=realisations", "Simuler ma pièce"]]);
    assert.equal(lireDepuis(new URLSearchParams(boutons(html, "principal")[0][0].split("?")[1]).get("depuis")), "realisations");
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

describe("pages par pièce (site 3.0, lot C1)", () => {
  const PIECES = ["cuisine", "salle-de-bain", "meubles"] as const;
  const page = (slug: string) => rendrePage("@/app/prestations/[slug]/page", { params: Promise.resolve({ slug }) });
  /** Les liens « Essayer cette composition chez moi » : leurs adresses. */
  const essais = (html: string) => [...html.matchAll(/<a[^>]* href="([^"]*)"[^>]*>Essayer cette composition chez moi<\/a>/g)].map((m) => texteHtml(m[1]));

  test("titre de 7 mots au plus ; l'ancien titre et les paragraphes restent ; UNE action principale (le simulateur de la pièce, depuis=prestation-<slug>), en haut et au dernier appel ; « Demander un devis » en secondaire", async () => {
    publications = [];
    for (const slug of PIECES) {
      const p = getPrestation(slug)!;
      assert.ok(p.titreCourt.replace(/[,.:;]/g, "").split(/\s+/).filter(Boolean).length <= 7, p.titreCourt);
      const html = await page(slug);
      assert.ok(html.includes(`<h1 id="titre-prestation" class="titre-1 mt-2 max-w-3xl text-balance text-encre">${p.titreCourt}</h1>`), slug);
      assert.equal(compter(html, "<h1"), 1);
      if (p.h1 !== p.titreCourt) assert.ok(html.includes(`>${p.h1}</h2>`), `${slug} : ancien titre gardé`);
      for (const para of p.intro) assert.ok(html.includes(para), `${slug} : paragraphe gardé`);
      const principaux = boutons(html, "principal");
      assert.ok(principaux.length === 2 && principaux.every(([href, libelle]) => href === `/simulateur?projet=${p.simulateur}&depuis=prestation-${slug}` && libelle === p.libelleSimuler), `${slug} : ${JSON.stringify(principaux)}`);
      assert.ok(boutons(html, "secondaire").some(([href, libelle]) => href === "/contact" && libelle === "Demander un devis"));
      // Le dernier appel, en encre : le même principal, « Être rappelé » et le devis posés sur l'encre.
      const dernier = html.slice(html.indexOf('id="dernier-appel"'));
      assert.match(dernier, /^id="dernier-appel"[^>]*class="ton-encre bg-encre/);
      assert.equal(boutons(dernier, "principal").length, 1);
      assert.ok(dernier.includes(">Être rappelé</button>") && boutons(dernier, "sur-encre").some(([href]) => href === "/contact"));
      assert.ok(html.includes(p.prix.fourchette));
      assert.ok(!html.includes('href="/prestations"'), "le fil d'Ariane passe par /realisations");
      // Site 3.0 (lot F4) : toujours les quatre types de la prestation, une fois chacun, plus un ImageObject par avant / après rendu.
      const types = balisage(html).map((b) => b["@type"]);
      assert.deepEqual([...new Set(types)].sort(), ["BreadcrumbList", "FAQPage", "HowTo", "ImageObject", "Service"]);
      for (const t of ["BreadcrumbList", "FAQPage", "HowTo", "Service"]) assert.equal(types.filter((x) => x === t).length, 1, `${slug} : un seul ${t}`);
      assert.equal(types.filter((x) => x === "ImageObject").length, compter(html, 'role="slider"'), `${slug} : un ImageObject par curseur`);
      const service = balisage(html).find((b) => b["@type"] === "Service") as { "@id": string; image: { "@id": string }; offers: { url: string }; provider: { "@id": string } };
      assert.deepEqual(Object.keys(service).slice(0, 4), ["@context", "@type", "@id", "image"], "@id et image juste après @type");
      assert.equal(service["@id"], `https://coverswap.fr/prestations/${slug}#service`);
      const ouvertureObjet = balisage(html).find((b) => b["@type"] === "ImageObject" && b["@id"] === service.image["@id"]);
      assert.ok(ouvertureObjet && String(ouvertureObjet.contentUrl).includes(`/images/prep/${CAS_PRESTATIONS[slug].ouverture.apres}-`), `${slug} : le Service renvoie à l'avant / après de l'ouverture`);
      assert.equal(ouvertureObjet.creditText, "Image d'ambiance générée aux teintes du catalogue");
      assert.equal(service.offers.url, `https://coverswap.fr/simulateur?projet=${p.simulateur}`, "l'offre : l'adresse du simulateur de la pièce, sans le `depuis` du bouton");
      assert.equal(service.provider["@id"], "https://coverswap.fr/#entreprise");
      const fil = balisage(html).find((b) => b["@type"] === "BreadcrumbList") as { itemListElement: { name: string; item: string }[] };
      assert.deepEqual(fil.itemListElement.map((e) => e.item), ["https://coverswap.fr", "https://coverswap.fr/realisations", `https://coverswap.fr/prestations/${slug}`]);
    }
  });

  test("l'ouverture : la paire d'ambiance de la pièce, étiquetée, sa légende et ses cartels ; le seul couple prioritaire (l'« avant » est le LCP) ; jamais « Simulation » ni « Réalisation »", async () => {
    publications = [];
    for (const slug of PIECES) {
      const { ouverture } = CAS_PRESTATIONS[slug];
      const html = await page(slug);
      // L'image de la page est celle de l'ouverture : ses deux images, et elles seules, en priorité haute.
      const prioritaires = [...html.matchAll(/<img [^>]*src="([^"]*)"[^>]*fetchPriority="high"/g)].map((m) => m[1]);
      // Lot F6 : les liens de préchargement (`Prechargements`, hissés dans le <head> sur le site) portent aussi fetchPriority ; on compte les images.
      assert.equal((html.match(/<img [^>]*fetchPriority="high"/g) ?? []).length, 2, slug);
      assert.deepEqual(prioritaires.map((src) => src.replace(/-\d+\.jpg\?v=.*$/, "").replace("/images/prep/", "")).sort(), [ouverture.apres, ouverture.avant].sort(), slug);
      assert.ok(html.indexOf(`/images/prep/${ouverture.avant}-`) < html.indexOf('id="cas"'), `${slug} : l'ouverture avant les cas`);
      assert.ok(html.includes(`>${ouverture.legende}</figcaption>`), slug);
      assert.ok(html.includes(">Ambiance · avant / après</span>"));
      assert.ok(!html.includes(">Simulation</span>") && !/>Réalisation(, [^<]*)?</.test(html), slug);
      assert.ok(!html.includes("/images/prep/piece-"), `${slug} : plus l'ambiance piece-* de la mission 16`);
      // Les cartels des matières de l'ouverture, au filet de la teinte de la prestation.
      const teinte = teintePrestation(slug)!.teinte.hex;
      assert.ok(html.includes(`style="--teinte:${teinte}"`), slug);
      assert.match(html, new RegExp(`<ul class="grid grid-cols-2[^"]*" aria-label="Matières posées">`), slug);
    }
    const cuisine = await page("cuisine");
    assert.ok(cuisine.includes(">Deep Green</span>") && cuisine.includes("NF13 · Couleur"), "cuisine : la bordeaux passée en Deep Green NF13");
  });

  test("les cas : chacun étiqueté, avec son curseur (paire) ou sa photo seule, ses cartels à la teinte et « Essayer cette composition chez moi » (depuis=prestation-<slug>) ; aucun doublon avec l'ouverture", async () => {
    publications = [];
    for (const slug of PIECES) {
      const html = await page(slug);
      const vue = vueDeLaPrestation(getPrestation(slug)!);
      assert.equal(vue.cas.length, CAS_PRESTATIONS[slug].cas.length, `${slug} : toutes les images préparées`);
      const paires = vue.cas.filter((c) => c.preparees.avant).length;
      assert.equal(compter(html, 'role="slider"'), 1 + paires, slug);
      assert.equal(compter(html, ">Ambiance · avant / après</span>"), 1 + paires, slug);
      assert.equal(compter(html, ">Ambiance</span>"), vue.cas.length - paires + 1, `${slug} : les photos seules, et l'étiquette en tête des cas`);
      const liens = essais(html);
      assert.equal(liens.length, vue.cas.length, slug);
      for (const lien of liens) {
        const parametres = new URLSearchParams(lien.split("?")[1]);
        assert.equal(lireDepuis(parametres.get("depuis")), `prestation-${slug}`, lien);
        assert.equal(parametres.get("projet"), getPrestation(slug)!.simulateur, lien);
        assert.ok(lireComposition(lireRefDemandee(parametres.get("ref")))?.length, lien);
      }
      for (const c of vue.cas) {
        assert.ok(html.includes(`>${c.nom}</h3>`), `${slug} : ${c.nom}`);
        for (const m of c.matieres) assert.ok(html.includes(`${m.matiere.id} · `), `${slug} : ${m.matiere.id}`);
      }
      // Aucune image n'est à la fois l'ouverture et un cas.
      const { ouverture, cas } = CAS_PRESTATIONS[slug];
      assert.ok(!cas.includes(ouverture.apres));
      assert.ok(vue.cas.every((c) => c.ambiance.avant !== ouverture.avant), `${slug} : pas l'autre après de l'avant de l'ouverture`);
      // La bande de matière de la teinte ferme les cas.
      const ref = teintePrestation(slug)!.teinte.ref;
      assert.ok(html.indexOf(`aria-label="Matière ${matiereCartel(ref)!.nom} · ${ref}`) > html.indexOf('id="cas"'), `${slug} : bande ${ref}`);
      assert.equal(boutons(html.slice(html.indexOf('id="cas"'), html.indexOf('id="matieres"')), "principal").length, 0, "une seule action principale : pas dans les cas");
    }
    const salle = await page("salle-de-bain");
    assert.ok(salle.includes("AA14 · ") && salle.includes("RM26 · ") && !salle.includes("Khaki"), "la salle de bain : les références de la série 2");
    // Les nouvelles valeurs `depuis` sont documentées au suivi (aucun type d'événement nouveau).
    const suivi = readFileSync(join(process.cwd(), "docs", "SUIVI.md"), "utf8");
    for (const slug of PIECES) assert.ok(suivi.includes(`\`prestation-${slug}\``), slug);
    const meubles = await page("meubles");
    assert.ok(meubles.includes("meubles-dressing-avant") && meubles.includes("etude-meubles-avant") && meubles.includes("RM30 · ") && meubles.includes("NH12 · "), "meubles : le dressing et le meuble TV de la série 1");
  });

  test("les matières vedettes (8 vrais échantillons vers leur fiche), les prix du CRM de la famille tels quels, les villes", async () => {
    publications = [];
    for (const slug of PIECES) {
      const html = await page(slug);
      const section = html.slice(html.indexOf('id="matieres"'));
      for (const ref of CAS_PRESTATIONS[slug].vedettes) assert.ok(section.includes(`href="${lienMatiere(ref)}"`), `${slug} : ${ref}`);
      assert.ok(section.includes('href="/matieres"'));
      // Les villes : une page chacune.
      for (const z of ZONES) assert.ok(html.includes(`href="/zones/${getZoneSlug(z)}"`), `${slug} : ${z.ville}`);
    }
    // Les prix : les tarifs du CRM de la famille, tels quels (sans le CRM : la plage au mètre linéaire seule).
    const tarifs: TarifsSite = {
      version: 1,
      familles: [
        { id: "CUISINE", sousParties: [{ id: "facades-hautes", libelle: "Façades hautes", metrage: true, prixUnitaire: 110, unite: "ml" }, { id: "credence", libelle: "Crédence", metrage: false, prixUnitaire: null, unite: "ml" }], formats: [] },
        { id: "MEUBLES", sousParties: [{ id: "meuble-tv", libelle: "Meuble TV", metrage: false, prixUnitaire: 65, unite: "ml" }], formats: [] },
      ],
    };
    const avec = texteHtml(renderToStaticMarkup(createElement(ContenuPrestation, { p: getPrestation("cuisine")!, url: "https://coverswap.fr/prestations/cuisine", fil: [], tarifs })));
    const prix = avec.slice(avec.indexOf('id="prix"'), avec.indexOf('id="villes"'));
    assert.ok(prix.includes("Façades hautes") && prix.includes(`${euros(110)}/ml`), "le prix du CRM, tel quel");
    assert.ok(!prix.includes("Crédence") && !prix.includes("Meuble TV"), "un prix nul est masqué ; les autres familles n'y sont pas");
    const sans = texteHtml(renderToStaticMarkup(createElement(ContenuPrestation, { p: getPrestation("salle-de-bain")!, url: "https://coverswap.fr/prestations/salle-de-bain", fil: [], tarifs: null })));
    const repli = sans.slice(sans.indexOf('id="prix"'), sans.indexOf('id="villes"'));
    assert.ok(repli.includes(PRIX_PLAGE) && !repli.includes(fourchette("sdb")) && !repli.includes(fourchette("cuisine")), "le repli : la plage au mètre linéaire, aucune fourchette par pièce (relecture des lots B et C)");
    // Ni le texte de la page, ni sa FAQ, ni sa description ne chiffrent la pièce : le bloc du CRM est le seul prix.
    for (const slug of ["cuisine", "salle-de-bain", "meubles"]) {
      const p = getPrestation(slug)!;
      const texte = JSON.stringify([p.descriptionSeo, p.prix, p.faq]);
      for (const n of [FOURCHETTES.cuisine.min, FOURCHETTES.cuisine.max, FOURCHETTES.sdb.max, FOURCHETTES.meuble.min]) assert.ok(!texte.includes(euros(n)), `${slug} : ${euros(n)}`);
    }
    const sdbCrm = texteHtml(renderToStaticMarkup(createElement(ContenuPrestation, { p: getPrestation("salle-de-bain")!, url: "https://coverswap.fr/prestations/salle-de-bain", fil: [], tarifs: { version: 1, familles: [{ id: "SDB", sousParties: [{ id: "meuble-vasque", libelle: "Meuble vasque", metrage: true, prixUnitaire: null, unite: "ml" }], formats: [] }] } })));
    assert.ok(sdbCrm.includes("Sur devis, après une visite ou sur vos photos."), "une famille sans aucun prix : « Sur devis »");
  });

  test("la teinte de la prestation sur la page (filets, cartels, bande) ; les autres prestations à la leur", async () => {
    publications = [];
    for (const slug of PIECES) {
      const html = await page(slug);
      const t = teintePrestation(slug)!;
      // Lot F6 : les liens de préchargement (hissés dans le <head> sur le site) précèdent la page dans ce rendu isolé.
      assert.ok(html.replace(/^(?:<link [^>]*\/>)+/, "").startsWith(`<div style="--teinte:${t.teinte.hex}">`), slug);
      assert.ok(compter(html, 'class="filet') >= 8 + 1, `${slug} : filets des villes et des cas`);
      // Les autres prestations portent leur propre teinte (vitrages : aucune).
      const pro = html.match(/<a [^>]*href="\/pro"[^>]*>/)?.[0] ?? "";
      assert.ok(pro.includes(`--teinte:${teintePrestation("professionnel")!.teinte.hex};--teinte-2:${teintePrestation("professionnel")!.seconde!.hex}`), `${slug} : ${pro}`);
      const vitrages = html.match(/<a [^>]*href="\/prestations\/vitrages"[^>]*>/)?.[0] ?? "";
      assert.ok(vitrages && !vitrages.includes("--teinte"), `${slug} : vitrages sans teinte`);
    }
  });

  test("une réalisation publiée de la pièce passe d'abord : l'ouverture (avec ses deux photos), puis les autres de la pièce, puis les ambiances", async () => {
    const c1 = publication({ id: "c1", titre: "Cuisine en chêne" });
    const c2 = publication({ id: "c2", titre: "Cuisine noire", photoAvant: null });
    const s1 = publication({ id: "s1", typeProjet: "SDB", titre: "Salle de bain verte" });
    const avis = publication({ id: "a1", type: "AVIS" });
    publications = [avis, s1, c2, c1];
    const cuisine = await page("cuisine");
    assert.ok(cuisine.includes(">Réalisation, Lattes</span>") && cuisine.includes(">Cuisine en chêne, Lattes.</figcaption>"));
    assert.match(cuisine, /<img src="[^"]*\/api\/site\/photos\/c1\/avant"[^>]*fetchPriority="high"/);
    assert.equal((cuisine.match(/<img [^>]*fetchPriority="high"/g) ?? []).length, 2);
    assert.ok(cuisine.indexOf(">Nos chantiers</h3>") < cuisine.indexOf(">Ambiance</span>"), "les chantiers avant les ambiances");
    assert.ok(cuisine.includes(">Cuisine noire</h3>") && !cuisine.includes(">Cuisine en chêne</h3>"), "l'ouverture n'est pas répétée en carte");
    assert.ok(!cuisine.includes("Salle de bain verte"), "une réalisation d'une autre pièce n'est pas montrée");
    const salle = await page("salle-de-bain");
    assert.ok(salle.includes(">Salle de bain verte, Lattes.</figcaption>") && !salle.includes(">Nos chantiers</h3>"));
    const meubles = await page("meubles");
    assert.ok(meubles.includes(`>${CAS_PRESTATIONS.meubles.ouverture.legende}</figcaption>`), "sans réalisation de meubles : la paire d'ambiance");

    // En règles pures.
    const p = getPrestation("cuisine")!;
    const sansAvant = vueDeLaPrestation(p, [c2 as Publication]);
    assert.equal(sansAvant.ouverture?.type, "ambiance", "une réalisation sans photo avant ne prend pas l'ouverture…");
    assert.deepEqual(sansAvant.reelles.map((e) => e.id), ["c2"], "… mais passe avant les ambiances");
    assert.equal(vueDeLaPrestation(p, [avis as Publication]).ouverture?.type, "ambiance", "un avis n'est pas une réalisation");
    assert.deepEqual(vueDeLaPrestation(getPrestation("vitrages")!, [publication({ id: "v", typeProjet: "AUTRE" }) as Publication]), { ouverture: null, reelles: [], cas: [], vedettes: [] });
    assert.equal(vueDeLaPrestation(p, [], {}).ouverture, null, "sans les images de la paire : pas d'image");
    assert.deepEqual(vueDeLaPrestation(p, [], {}).cas, [], "un cas non préparé est sauté");
  });

  test("vitrages : inchangée — pas de simulateur, « Demander un devis » en principal, ni image, ni cas, ni vedettes, ni teinte", async () => {
    publications = [publication({ id: "x", typeProjet: "AUTRE" })];
    const p = getPrestation("vitrages")!;
    const html = await page("vitrages");
    assert.ok(html.includes(`>${p.titreCourt}</h1>`));
    assert.ok(boutons(html, "principal").length > 0 && boutons(html, "principal").every(([href, libelle]) => href === "/contact" && libelle === "Demander un devis"));
    assert.equal(compter(html, "<picture"), 0);
    assert.ok(!/>Réalisation(, [^<]*)?</.test(html) && !html.includes("Ambiance") && !html.includes('id="cas"') && !html.includes('id="matieres"'));
    assert.ok(html.startsWith("<div>"), "pas de teinte");
    assert.ok(html.includes(p.prix.fourchette));
  });

  test("les cas de chaque page (data/cas-prestations) : cuisine = la bordeaux puis les 10 autres cuisines de la série 2 et la cuisine familiale ; salle de bain = les 3 ; meubles = buffet, placard, portes de couloir, dressing, meuble TV ; l'après au plus petit ΔE affiché", () => {
    const avantDe = (image: string) => ambianceDeLImage(image)?.avant ?? null;
    const avantsSerie2 = (piece: string) => PAIRES_SERIE_2.filter((x) => x.piece === piece).map((x) => x.avant);
    const { cuisine, "salle-de-bain": salle, meubles } = CAS_PRESTATIONS;
    assert.deepEqual({ avant: cuisine.ouverture.avant, apres: cuisine.ouverture.apres }, IMAGE_OUVERTURE);
    assert.equal(cuisine.ouverture.legende, LEGENDE_OUVERTURE);
    assert.equal(cuisine.cas.length, 11);
    assert.deepEqual([cuisine.ouverture.avant, ...cuisine.cas.map(avantDe).filter(Boolean)].sort(), avantsSerie2("cuisine").sort(), "les 11 cuisines de la série 2, une fois chacune");
    assert.ok(cuisine.cas.includes("amb-cuisine-familiale"));
    assert.deepEqual([salle.ouverture.avant, ...salle.cas.map(avantDe)].sort(), avantsSerie2("salle-de-bain").sort(), "les 3 salles de bain");
    assert.equal(meubles.ouverture.avant, "buffet-salle-a-manger-avant");
    assert.deepEqual(meubles.cas.map(avantDe), ["placard-coulissant-chambre-avant", "portes-couloir-avant", null, "meubles-dressing-avant", "etude-meubles-avant"]);
    assert.ok(meubles.cas.includes("amb-couloir-portes"));
    // L'après d'une paire de la série 2 : le plus petit ΔE affiché maximal (sauf la bordeaux, fixée par l'énoncé).
    type Composee = { nom: string; avant?: string; composition?: Record<string, { deltaEAffichee?: number }> };
    const serie2 = JSON.parse(readFileSync(join(process.cwd(), "scripts", "bibliotheque", "serie-2.json"), "utf8")) as Composee[];
    const pire = (nom: string) => Math.max(...Object.values(serie2.find((x) => x.nom === nom)!.composition!).map((c) => c.deltaEAffichee ?? 0));
    for (const data of [cuisine, salle, meubles]) {
      for (const image of [data.ouverture.apres, ...data.cas]) {
        if (image === IMAGE_OUVERTURE.apres) continue;
        const entree = serie2.find((x) => x.nom === image);
        if (!entree?.avant) continue;
        const soeurs = serie2.filter((x) => x.avant === entree.avant && x.composition);
        assert.ok(soeurs.every((s) => pire(image) <= pire(s.nom)), `${image} : ΔE ${pire(image)}`);
      }
      // Aucun doublon ; les vedettes, huit références du catalogue.
      assert.equal(new Set([data.ouverture.apres, ...data.cas]).size, data.cas.length + 1);
      assert.equal(new Set(data.vedettes).size, 8);
      for (const ref of data.vedettes) assert.ok(matiereCartel(ref), ref);
    }
  });

  test("« professionnel » n'est plus une page par pièce ; la liste des pièces reste celle des données", () => {
    assert.deepEqual(PRESTATIONS.map((p) => p.slug), ["cuisine", "salle-de-bain", "meubles", "professionnel", "vitrages"]);
    assert.equal(lienPiece("professionnel"), "/pro");
    assert.equal(casDeLaPrestation("professionnel"), null);
    assert.equal(casDeLaPrestation("vitrages"), null);
    assert.equal(casDeLaPrestation("toString"), null);
  });
});

describe("/comment-ca-marche", () => {
  const rendre = async () => {
    const { default: Page } = await import("@/app/comment-ca-marche/page");
    return texteHtml(renderToStaticMarkup(await Page()));
  };

  test("procédé, déroulé, prix, objections, FAQ, quand rénover, devis, guides : dans cet ordre, ancres d'avant gardées ; une seule action principale", async () => {
    const html = await rendre();
    // Site 3.0 (lot C3) : les ancres d'avant (comment-ca-marche, prix, objections, faq, devis, guides) restent, dans le
    // même ordre ; le déroulé, ce qui reste en place, l'entretien, « Quand rénover ? » et le dernier appel s'y glissent.
    const ordre = ["comment-ca-marche", "deroule", "en-place", "entretien", "prix", "objections", "faq", "quand-renover", "devis", "guides", "dernier-appel"].map((id) => html.indexOf(`id="${id}"`));
    assert.ok(ordre.every((i) => i > 0), JSON.stringify(ordre));
    assert.deepEqual([...ordre].sort((a, b) => a - b), ordre);
    assert.equal(compter(html, "<h1"), 1);
    // Une seule action, trois fois (sous le titre, sous les étapes, au dernier appel) : « Simuler ma pièce », qui dit
    // d'où elle vient (avant le lot C3 : « Simuler ma cuisine », /simulateur?projet=cuisine).
    const principaux = boutons(html, "principal");
    assert.ok(principaux.length === 3 && principaux.every(([href, libelle]) => href === "/simulateur?depuis=comment-ca-marche" && libelle === "Simuler ma pièce"), JSON.stringify(principaux));
    assert.equal(lireDepuis(new URLSearchParams(principaux[0][0].split("?")[1]).get("depuis")), "comment-ca-marche");
    // Relecture des lots B et C : le premier au premier écran, sous le titre et sa phrase, avant les étapes.
    const premier = html.indexOf(`href="${principaux[0][0]}"`);
    assert.ok(premier > html.indexOf("</h1>") && premier < html.indexOf('id="comment-ca-marche"'), "le premier principal sous le titre");
    assert.ok(html.indexOf(`href="${principaux[0][0]}"`, premier + 1) < html.indexOf('id="deroule"'), "le deuxième sous les étapes");
    // Les huit photos (3 avant le lot C3) : les quatre étapes, la preuve de finition, les deux du déroulé, l'encart.
    assert.equal(compter(html, "<picture"), 8);
    const photos = [...html.matchAll(/<picture>[\s\S]*?<\/picture>/g)].map((m) => m[0]);
    for (const nom of ["etape-photo", "etape-simulation", "echantillons-table", "pose-mains", "detail-chant", "mesure-visite", "outils-pose", "usure-detail"]) assert.equal(photos.filter((p) => p.includes(`/images/prep/${nom}-`)).length, 1, `${nom} : une fois`);
  });

  test("les six photos utiles, chacune une fois et étiquetée « Ambiance » ; la capture du simulateur seule en « Simulation » ; jamais « Réalisation »", async () => {
    const html = await rendre();
    assert.equal(compter(html, ">Ambiance</span>"), 7, "étape 1 et les six photos utiles");
    assert.equal(compter(html, ">Simulation</span>"), 1);
    assert.ok(!html.includes(">Réalisation<"));
    const photos = [...html.matchAll(/<picture>[\s\S]*?<\/picture>/g)].map((m) => m[0]);
    // Le déroulé : mesure-visite à la visite, outils-pose au jour de la pose ; usure-detail dans « Quand rénover ? ».
    const section = (id: string) => html.slice(html.indexOf(`id="${id}"`), html.indexOf("</section>", html.indexOf(`id="${id}"`)));
    assert.ok(section("deroule").includes("/images/prep/mesure-visite-") && section("deroule").includes("/images/prep/outils-pose-"));
    assert.ok(section("quand-renover").includes("/images/prep/usure-detail-"));
    for (const nom of ["detail-chant", "echantillons-table", "pose-mains"]) assert.ok(section("comment-ca-marche").includes(`/images/prep/${nom}-`), nom);
    // Les photos du déroulé et de l'encart sont décrites (texte alternatif de la bibliothèque) : leur étiquette est lue.
    for (const p of PHOTOS_UTILES.filter((x) => ["mesure-visite", "outils-pose", "usure-detail"].includes(x.image))) assert.ok(html.includes(`alt="${p.alt}"`), p.image);
    // Pas d'image d'ouverture : la première photo des étapes est au premier écran, c'est le LCP — la seule prioritaire,
    // et la section des étapes n'est pas différée.
    assert.equal(compter(html, 'fetchPriority="high"'), 1);
    assert.ok(photos.find((p) => p.includes('fetchPriority="high"'))!.includes("/images/prep/etape-photo-"));
    assert.doesNotMatch(html.slice(html.lastIndexOf("<section", html.indexOf('id="comment-ca-marche"') + 20), html.indexOf('id="comment-ca-marche"') + 200), /sous-la-ligne/);
  });

  test("les délais (d'offre.ts seulement), ce qui reste en place, l'entretien, « Quand rénover ? », le dernier appel en encre", async () => {
    const html = sansScripts(await rendre());
    assert.equal(DEROULE.length, 6);
    assert.deepEqual(DEROULE.filter((e) => e.photo).map((e) => e.photo), ["mesure-visite", "outils-pose"]);
    for (const e of DEROULE) assert.ok(html.includes(e.quand) && html.includes(e.titre) && html.includes(e.texte), e.titre);
    for (const delai of [DELAI_RENDU, `Sous ${DELAI_REPONSE_COURT}`, `${VALIDITE_DEVIS_JOURS} jours`, `${ACOMPTE_POURCENT} %`, `La pose, en ${DUREE_POSE_TEXTE}`]) assert.ok(DEROULE.some((e) => `${e.quand} ${e.titre} ${e.texte}`.includes(delai)), delai);
    // Aucun délai inventé : pas de semaines promises entre la commande et la pose.
    assert.doesNotMatch(DEROULE.map((e) => e.texte).join(" "), /semaine|\b\d+ jours ouvrés|sous \d+ jours/i);
    for (const r of RESTE_EN_PLACE) assert.ok(html.includes(r.titre) && html.includes(r.texte), r.titre);
    for (const a of A_PREPARER) assert.ok(html.includes(a), a);
    for (const g of ENTRETIEN) assert.ok(html.includes(g.texte), g.titre);
    assert.ok(html.includes(`href="/blog/${GUIDE_ENTRETIEN}"`) && articles.some((a) => a.slug === GUIDE_ENTRETIEN));
    const encart = html.slice(html.indexOf('id="quand-renover"'));
    assert.match(encart, /<h2 class="titre-2 text-encre">Quand rénover \?<\/h2>/);
    for (const t of [QUAND_RENOVER_OUI, ...SIGNES_RENOVER, QUAND_RENOVER_NON]) assert.ok(encart.includes(t), t.slice(0, 30));
    // Le dernier appel en encre, « Être rappelé » posé sur l'encre.
    const dernier = html.slice(html.lastIndexOf("<section", html.indexOf('id="dernier-appel"') + 20));
    assert.match(dernier, /ton-encre/);
    assert.match(dernier, />Être rappelé</);
  });

  test("les filets plutôt que les cartes blanches (lot C3) : ni fond blanc ni cadre sur la page et dans les blocs partagés", async () => {
    const html = await rendre();
    assert.doesNotMatch(lire("app/comment-ca-marche/page.tsx"), /bg-white|border-trait/);
    assert.doesNotMatch(lire("components/BlocsPrestation.tsx"), /bg-white|border border-trait|CARTE_PRESTATION/);
    assert.ok(compter(html, 'class="filet') >= ETAPES_DEVIS_EN_LIGNE.length + AVANTAGES_DEVIS_EN_LIGNE.length, "étapes et atouts du devis en ligne sous un filet");
    assert.ok(compter(html, 'class="group filet"') === FAQ_RESTANTE.length, "les questions repliées entre des filets");
    assert.match(html, /class="grand-numero text-encre" aria-hidden="true">03<\/span>/, "les étapes du devis en ligne portent leur grand numéro");
    assert.ok(!existsSync(join(SRC, "components", "accueil", "CommentCaMarche.tsx")), "les trois étapes d'avant sont retirées");
  });

  test("le prix : au mètre linéaire, ce qui est compris, les tarifs du CRM (ceux de l'accueil, plus les fourchettes d'offre.ts qui les contredisaient), le lien vers l'estimation", async () => {
    tarifsCrm = TARIFS_CRM;
    const html = await rendre();
    tarifsCrm = null;
    for (const texte of [PRIX_PLAGE, PRIX_EXPLICATION, "Nous mesurons le film réellement posé", `Devis gratuit, valable ${VALIDITE_DEVIS_JOURS} jours, acompte de ${ACOMPTE_POURCENT} % à la commande.`, "Compris : le film"]) assert.ok(html.includes(texte), texte.slice(0, 40));
    const prix = html.slice(html.indexOf('id="prix"'), html.indexOf('id="objections"'));
    // Les quatre familles du CRM, chaque prix tel quel ; la salle de bain sans prix : « Sur devis ».
    for (const famille of ["Cuisine", "Salle de bain", "Meubles", "Professionnels"]) assert.ok(prix.includes(`>${famille}</h3>`), famille);
    assert.ok(prix.includes(`>${euros(110)}/ml</dd>`) && prix.includes(`>${euros(55)}/ml</dd>`) && prix.includes("Sur devis, après une visite ou sur vos photos."));
    for (const cle of ["cuisine", "sdb", "meuble"] as const) assert.ok(!html.includes(fourchette(cle)), cle);
    assert.equal(compter(html, "<table"), 0, "plus de table des ordres de grandeur");
    assert.ok(boutons(html, "secondaire").some(([href, libelle]) => href === "/simulateur?depuis=comment-ca-marche" && libelle === "Estimer sur ma photo"));
    // Sans le CRM : la plage au mètre linéaire seule.
    const repli = await rendre();
    assert.ok(repli.includes(PRIX_PLAGE) && !repli.includes(fourchette("cuisine")));
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
    // Site 3.0 (lot F4) : le fil visible pose lui-même son BreadcrumbList (l'ancre #guides reste au lien, pas au balisage) ; le dernier élément est le titre du guide, le même des deux côtés.
    assert.match(guide, /<Breadcrumb items=\{\[\{ label: "Accueil", href: "\/" \}, \{ label: "Comment ça marche", href: GUIDES \}, \{ label: article\.titreSeo \?\? article\.title, href: `\/blog\/\$\{article\.slug\}` \}\]\} \/>/);
    assert.doesNotMatch(guide, /BreadcrumbSchema/);
    assert.match(guide, /<Lien href=\{GUIDES\} variante="secondaire">/);
    assert.match(guide, /<ArticleSchema/);
  });

  test("l'illustration d'un guide : 800 ou 1600 px au choix du navigateur (srcset), plus le seul 1600 px de next/image", async () => {
    assert.doesNotMatch(lire("app/blog/[slug]/page.tsx"), /from "next\/image"/);
    // Les guides à photo de fond (lot C7 : ceux de la bibliothèque ont leur ouverture préparée, `blog/guides.test.ts`).
    const aFond = articles.filter((a) => a.image);
    assert.equal(aFond.length, 9);
    for (const article of aFond) {
      const html = await rendrePage("@/app/blog/[slug]/page", { params: Promise.resolve({ slug: article.slug }) });
      const img = html.match(/<img[^>]*srcset="([^"]*)"[^>]*>/i);
      assert.ok(img, article.slug);
      assert.equal(img[1], `${article.image}-800.jpg 800w, ${article.image}-1600.jpg 1600w`);
      assert.match(img[0], /src="[^"]*-800\.jpg"/);
      // Lot C7 : la colonne de l'article sans carte (768 px au plus, la colonne de 300 px et son écart dès 1 024 px).
      assert.match(img[0], /sizes="\(min-width: 1152px\) 768px, [^"]*calc\(100vw - 32px\)"/);
      assert.match(img[0], /alt=""/);
    }
  });
});
