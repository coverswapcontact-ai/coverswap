import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { classesBouton } from "@/components/simulation/Bouton";
import { PRESTATIONS } from "@/data/prestations";
import revetements from "@/data/revetements.json";
import { GLOSES_FINITIONS, NOTES_MATIERES, REPERES_FAMILLES } from "@/data/notes-matieres";
import { inspirations } from "@/lib/ambiances";
import { FINITIONS } from "@/lib/cartel";
import { cheminMatiere } from "@/lib/familles-matieres";
import { ambiancesDeLaFiche, descriptionFiche, ecartLisible, ficheDe, parametresDesFiches, prochesDeLaFiche, realisationsDeLaMatiere, titreFiche } from "@/lib/fiches-matieres";
import { fichesIndexees, vueDans } from "@/lib/indexation-matieres";
import { lienEssayer, type Matiere } from "@/lib/matieres";
import { lienMatiere } from "@/lib/matieres-vedettes";
import { metadonneesPage } from "@/lib/metadonnees";
import { compterMots } from "@/lib/pages-familles";
import type { Publication } from "@/lib/publications";
import { lireDepuis } from "@/lib/simulateur/entonnoir";
import { lireRefDemandee } from "@/lib/simulateur/matiere-demandee";
import { lienVisiteFamille, lienVisiteMatiere, messageVisite } from "@/lib/visite";
import PageFiche, { DEPUIS_FICHE, HAUTEUR_ECHANTILLON, LARGEUR_ECHANTILLON, dynamicParams, generateMetadata, generateStaticParams, revalidate } from "./[famille]/[ref]/page";

/**
 * Site 3.0, lot D4 — `/matieres/<famille>/<REF>` : la fiche de chaque matière (497 pages statiques ; une référence
 * d'une autre famille, une autre casse, une référence inconnue → 404), la grande vignette du CRM (la seule image
 * prioritaire), la teinte, la finition, le cartel, « Vue dans » (une réalisation publiée qui la porte d'abord, puis
 * toutes ses ambiances des séries 1 et 2), ses six voisines de teinte (ΔE), sa famille et ses prestations, « Essayer
 * chez moi » (le simulateur, la matière posée, `depuis=matiere-fiche`) en action principale, « La voir en vrai chez
 * moi » (`/contact?ref=<REF>&visite=1`, message prérempli), le fil d'Ariane visible et balisé. Les 52 fiches indexées
 * ont au moins 300 mots rendus, dont une note propre de 60 à 90 mots ; les 445 autres sont en `noindex, follow`.
 */
const CATALOGUE = revetements as Matiere[];
const SITE = "https://coverswap.fr";
/** Les 52 fiches indexées, écrites en dur (D1 : les 49 vues dans une ambiance, plus NF27, J3, Q1). */
const NB_FICHES = 497;
const NB_INDEXEES = 52;

const INSECABLE = String.fromCharCode(160);
const texteHtml = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").split(INSECABLE).join(" ");
const sansBalises = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ");
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;
const params = (famille: string, ref: string) => ({ params: Promise.resolve({ famille, ref }) });
const balisage = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as Record<string, unknown>);

function bloc(html: string, ouverture: string, balise = "section"): string {
  const debut = html.indexOf(ouverture);
  if (debut < 0) return "";
  let profondeur = 0;
  const motif = new RegExp(`<(/?)${balise}\\b`, "g");
  motif.lastIndex = debut;
  for (let m = motif.exec(html); m; m = motif.exec(html)) {
    profondeur += m[1] ? -1 : 1;
    if (profondeur === 0) return html.slice(debut, m.index);
  }
  return html.slice(debut);
}

/** Les publications du CRM, remplacées : aucune requête réseau (une réalisation qui porte NF13 quand on la demande). */
const fetchOrigine = globalThis.fetch;
let publications: Publication[] = [];
const REALISATION_NF13: Publication = { id: "r1", type: "REALISATION", titre: "Cuisine vert profond", texte: null, ville: "Lattes", typeProjet: "CUISINE", note: null, auteur: null, photoAvant: "/api/site/photos/r1/avant", photoApres: "/api/site/photos/r1/apres", publieLe: "2026-09-01T00:00:00.000Z", matieres: [{ ref: "NF13", nom: "Deep Green" }] };
beforeEach(() => {
  publications = [];
  globalThis.fetch = (async () => new Response(JSON.stringify({ publications }), { status: 200, headers: { "Content-Type": "application/json" } })) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = fetchOrigine;
});

async function rendre(famille: string, ref: string): Promise<string> {
  return texteHtml(renderToStaticMarkup(await PageFiche(params(famille, ref))));
}
const familleDe = (ref: string) => CATALOGUE.find((m) => m.id === ref)!.famille;

describe("/matieres/<famille>/<REF> : les adresses", () => {
  test("497 pages statiques, chacune sous sa famille, rien d'autre ; revalidées comme /realisations", () => {
    const tous = parametresDesFiches();
    assert.equal(tous.length, NB_FICHES);
    assert.deepEqual(generateStaticParams(), tous);
    assert.equal(new Set(tous.map((p) => p.ref)).size, NB_FICHES, "une adresse par référence");
    for (const p of tous) assert.equal(familleDe(p.ref), p.famille, p.ref);
    assert.equal(dynamicParams, false, "toute autre adresse est un 404");
    assert.equal(revalidate, 300);
    assert.equal(lienMatiere("NF13"), "/matieres/couleur/NF13");
    assert.equal(lienMatiere("D1"), "/matieres/bois/D1");
    assert.equal(lienMatiere("NE31"), "/matieres/pierre/NE31");
    assert.equal(cheminMatiere("Q1", "metal"), "/matieres/metal/Q1");
    assert.equal(cheminMatiere("Q1", "inconnue"), "/matieres?ref=Q1", "sans famille connue : l'ancienne adresse, toujours servie");
    assert.equal(cheminMatiere("Q1"), "/matieres?ref=Q1");
  });

  test("404 : une référence d'une autre famille, une autre casse, une référence ou une famille inconnue ; aucune métadonnée", async () => {
    for (const [famille, ref] of [
      ["bois", "K1"],
      ["couleur", "D1"],
      ["bois", "d1"],
      ["Bois", "D1"],
      ["bois", "ZZZ999"],
      ["inconnue", "D1"],
      ["tout", "D1"],
      ["bois", ""],
    ]) {
      assert.equal(ficheDe(famille, ref), null, `${famille}/${ref}`);
      await assert.rejects(PageFiche(params(famille, ref)), (e: { digest?: string }) => e.digest === "NEXT_HTTP_ERROR_FALLBACK;404", `${famille}/${ref}`);
      assert.deepEqual(await generateMetadata(params(famille, ref)), {}, `${famille}/${ref}`);
    }
    assert.equal(ficheDe("bois", "D1")?.nom, "Classic Walnut");
  });
});

describe("/matieres/<famille>/<REF> : l'indexation et les métadonnées", () => {
  test("52 fiches indexées, les 445 autres en noindex, follow ; titre ≤ 60, description ≤ 155, canonique", async () => {
    const indexees = fichesIndexees();
    assert.equal(indexees.length, NB_INDEXEES);
    const titres = new Set<string>();
    let sansIndex = 0;
    for (const { famille, ref } of parametresDesFiches()) {
      const meta = await generateMetadata(params(famille, ref));
      const m = ficheDe(famille, ref)!;
      const titre = titreFiche(m);
      assert.deepEqual(meta.title, { absolute: titre });
      assert.ok(titre.length <= 60 && titre.endsWith(" | CoverSwap") && titre.includes(ref), `${titre} (${titre.length})`);
      titres.add(titre);
      const description = descriptionFiche(m, ambiancesDeLaFiche(ref).length);
      assert.ok(description.length <= 155 && description.includes(ref), `${ref} : ${description.length}`);
      assert.equal(meta.description, description, "la description tient : rien n'est coupé");
      assert.equal(meta.alternates?.canonical, `${SITE}/matieres/${famille}/${ref}`);
      if (indexees.includes(ref)) assert.equal(meta.robots, undefined, ref);
      else {
        assert.deepEqual(meta.robots, { index: false, follow: true }, ref);
        sansIndex += 1;
      }
    }
    assert.equal(titres.size, NB_FICHES, "un titre par fiche");
    assert.equal(sansIndex, NB_FICHES - NB_INDEXEES);
    assert.equal(titreFiche(ficheDe("couleur", "NF13")!), "Deep Green NF13 : film adhésif uni | CoverSwap");
    assert.equal(titreFiche(ficheDe("pierre", "NH39")!), "Pietra di Cardoso Grigio NH39 | CoverSwap", "un nom long : le titre court");
  });

  test("metadonneesPage : `indexer: false` donne noindex, follow ; rien par défaut", () => {
    assert.deepEqual(metadonneesPage({ titre: "T", description: "D", chemin: "/x", indexer: false }).robots, { index: false, follow: true });
    assert.equal(metadonneesPage({ titre: "T", description: "D", chemin: "/x" }).robots, undefined);
  });
});

describe("/matieres/<famille>/<REF> : les notes", () => {
  test("une note par fiche indexée, de 60 à 90 mots, toutes distinctes", () => {
    assert.deepEqual(Object.keys(NOTES_MATIERES).sort(), [...fichesIndexees()].sort());
    const phrases = new Set<string>();
    for (const [ref, note] of Object.entries(NOTES_MATIERES)) {
      const mots = compterMots(note);
      assert.ok(mots >= 60 && mots <= 90, `${ref} : ${mots} mots`);
      for (const phrase of note.split(/(?<=[.!?])\s+/)) {
        if (compterMots(phrase) < 6) continue;
        assert.ok(!phrases.has(phrase), `${ref} : phrase reprise d'une autre note — « ${phrase} »`);
        phrases.add(phrase);
      }
    }
    assert.equal(new Set(Object.values(NOTES_MATIERES)).size, NB_INDEXEES);
  });

  test("honnêtes : aucun montant ni promesse chiffrée ; les références citées existent ; « on », « nous »", () => {
    const refs = new Set(CATALOGUE.map((m) => m.id));
    for (const [ref, note] of Object.entries(NOTES_MATIERES)) {
      assert.doesNotMatch(note, /€|%|°|\bans\b|\bnorme|\bclass[ée]|\bgaranti|\bimperméable\b|\bignifug|\bM1\b|\bmm\b/i, ref);
      assert.doesNotMatch(note, /\b(Simulation|Réalisation)\b/, `${ref} : ces étiquettes ont un sens réservé`);
      assert.doesNotMatch(note, /\\u[0-9a-f]{4}/i);
      // Toute référence citée (lettres puis chiffres) est au catalogue, avec son vrai nom juste avant.
      for (const [, nom, cite] of note.matchAll(/([A-Z][\p{L}' -]+?) ([A-Z]{1,2}\d{1,3})\b/gu)) {
        assert.ok(refs.has(cite), `${ref} : ${cite} n'est pas au catalogue`);
        assert.ok(nom.endsWith(CATALOGUE.find((m) => m.id === cite)!.nom), `${ref} : ${cite} s'appelle ${CATALOGUE.find((m) => m.id === cite)!.nom} (« ${nom} »)`);
      }
      assert.match(note, /(^|[^\p{L}])([Oo]n|[Nn]ous|[Nn]otre|[Nn]os) \p{L}/u, `${ref} : la première personne du pluriel`);
    }
  });

  test("repères par famille et gloses des finitions : complets", () => {
    assert.deepEqual(Object.keys(REPERES_FAMILLES).sort(), ["beton", "bois", "couleur", "metal", "paillettes", "pierre", "textile"]);
    assert.deepEqual(Object.keys(GLOSES_FINITIONS).sort(), Object.keys(FINITIONS).sort());
    for (const r of Object.values(REPERES_FAMILLES)) for (const t of Object.values(r)) assert.ok(compterMots(t) >= 10 && !/€|%|°|\bans\b/.test(t), t);
  });
});

describe("/matieres/<famille>/<REF> : la page rendue", () => {
  test("NF13 (indexée) : fil d'Ariane, grande vignette prioritaire, actions, cartel, teinte, finition, note, Vue dans, voisines", async () => {
    const html = await rendre("couleur", "NF13");
    assert.equal(compter(html, "<h1 "), 1);
    assert.ok(html.includes(">Deep Green</h1>"));

    // Le fil d'Ariane : visible et balisé.
    const fil = bloc(html, '<nav aria-label="Fil d\'Ariane"', "nav");
    assert.ok(fil.includes('href="/"') && fil.includes('href="/matieres"') && fil.includes('href="/matieres/couleur"') && fil.includes('aria-current="page">Deep Green NF13</span>'), "fil visible");
    const liste = balisage(html).find((b) => b["@type"] === "BreadcrumbList") as { itemListElement: { position: number; name: string; item: string }[] };
    assert.deepEqual(
      liste.itemListElement.map((e) => [e.position, e.name, e.item]),
      [
        [1, "Accueil", SITE],
        [2, "Matières", `${SITE}/matieres`],
        [3, "Couleurs", `${SITE}/matieres/couleur`],
        [4, "Deep Green NF13", `${SITE}/matieres/couleur/NF13`],
      ],
    );

    // La grande vignette : l'échantillon entier du CRM, la seule image prioritaire de la page.
    assert.match(html, /<img src="[^"]*\/api\/site\/echantillons\/NF13" alt="Échantillon Deep Green, référence NF13" width="595" height="790" loading="eager" fetchPriority="high"/);
    assert.equal([LARGEUR_ECHANTILLON, HAUTEUR_ECHANTILLON].join("×"), "595×790");
    assert.equal((html.match(/<img [^>]*fetchPriority="high"/g) ?? []).length, 1, "une seule image prioritaire");
    assert.ok(html.includes("md:aspect-[595/790]"), "l'image entière dès 768 px");

    // Une action principale (« Essayer chez moi », en haut et au dernier appel), « La voir en vrai chez moi » à côté.
    const principaux = [...html.matchAll(new RegExp(`<a class="${classesBouton("principal").replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}[^"]*" href="([^"]*)"[^>]*>([^<]*)</a>`, "g"))].map((m) => [m[1], m[2]]);
    assert.deepEqual(principaux, [
      [lienEssayer("NF13", DEPUIS_FICHE), "Essayer chez moi"],
      [lienEssayer("NF13", DEPUIS_FICHE), "Essayer chez moi"],
    ]);
    assert.equal(lienEssayer("NF13", DEPUIS_FICHE), "/simulateur?ref=NF13&depuis=matiere-fiche");
    assert.equal(lireRefDemandee("NF13"), "NF13", "le simulateur pose la matière (matiere-demandee)");
    assert.equal(lireDepuis(DEPUIS_FICHE), DEPUIS_FICHE, "une valeur `depuis` valide (docs/SUIVI.md)");
    assert.equal(lienEssayer("K1"), "/simulateur?ref=K1", "sans `depuis`, l'adresse ne change pas");
    assert.equal(compter(html, `href="${lienVisiteMatiere("NF13").replace(/&/g, "&amp;")}"`) + compter(html, `href="${lienVisiteMatiere("NF13")}"`), 2);
    assert.ok(html.includes(">La voir en vrai chez moi</a>"));

    // Cartel, teinte, finition, famille.
    assert.ok(html.includes("Deep Green") && html.includes("NF13 · Couleur · Standard"));
    const fiche = bloc(html, '<dl class="', "dl");
    assert.ok(fiche.includes("Vert, couleur moyenne #23342E") && fiche.includes(`Standard. <span class="text-encre-2">${GLOSES_FINITIONS.Soft}`));
    assert.ok(fiche.includes('href="/matieres/couleur"'));

    // La note, rendue telle quelle.
    assert.ok(bloc(html, '<section id="note"').includes(NOTES_MATIERES.NF13), "la note");

    // Vue dans : ses quatre ambiances, étiquetées, vers /inspirations et le simulateur.
    const vue = bloc(html, '<section id="vue-dans"');
    const ambiances = vueDans().NF13;
    assert.equal(ambiances.length, 4);
    for (const a of ambiances) assert.ok(vue.includes(`href="/inspirations#${a.id}"`), a.id);
    assert.equal(compter(vue, ">Ambiance</span>"), 4, "l'étiquette d'honnêteté");
    assert.ok(!/>(Simulation|Réalisation)</.test(vue));
    assert.equal(compter(vue, "depuis=matiere-fiche"), 4);

    // Les six voisines de teinte, vers leur fiche, avec leur écart.
    const proches = bloc(html, '<section id="proches"');
    const attendues = prochesDeLaFiche("NF13");
    assert.equal(attendues.length, 6);
    assert.ok(!attendues.some((p) => p.id === "NF13"));
    for (const p of attendues) assert.ok(proches.includes(`href="${lienMatiere(p.id)}"`) && proches.includes(`Écart ${ecartLisible(p.deltaE)}`), p.id);
    assert.equal(attendues[0].id, "NE83");
  });

  test("les 52 fiches indexées : au moins 300 mots rendus, dont la note ; une seule image prioritaire", async () => {
    for (const ref of fichesIndexees()) {
      const html = await rendre(familleDe(ref), ref);
      const mots = compterMots(sansBalises(html));
      assert.ok(mots >= 300, `${ref} : ${mots} mots rendus`);
      assert.ok(html.includes(NOTES_MATIERES[ref]), `${ref} : la note`);
      assert.equal((html.match(/<img [^>]*fetchPriority="high"/g) ?? []).length, 1, ref);
      assert.equal(compter(bloc(html, '<section id="vue-dans"'), "<li class=\"filet"), vueDans()[ref]?.length ?? 0, `${ref} : toutes ses ambiances`);
    }
  });

  test("une fiche non indexée : pas de note, pas de « Vue dans », le reste est là", async () => {
    const ref = CATALOGUE.find((m) => m.famille === "textile")!.id;
    assert.ok(!fichesIndexees().includes(ref));
    const html = await rendre("textile", ref);
    assert.equal(bloc(html, '<section id="note"'), "");
    assert.equal(bloc(html, '<section id="vue-dans"'), "");
    assert.equal(compter(html, "<h1 "), 1);
    assert.equal(compter(bloc(html, '<section id="proches"'), "/api/site/echantillons/"), 6);
    assert.ok(html.includes(REPERES_FAMILLES.textile.aSavoir.split(" : ")[0]));
    assert.ok(html.includes('href="/prestations/meubles"') && html.includes('href="/pro"'), "ses prestations");
  });

  test("une réalisation publiée qui porte la matière passe avant les ambiances", async () => {
    publications = [REALISATION_NF13, { ...REALISATION_NF13, id: "r2", matieres: [{ ref: "D1", nom: "Classic Walnut" }] }];
    assert.deepEqual(realisationsDeLaMatiere("NF13", publications).map((p) => p.id), ["r1"]);
    assert.deepEqual(realisationsDeLaMatiere("NF13", [{ ...REALISATION_NF13, photoApres: null }]), [], "sans photo « après », pas de carte");
    const vue = bloc(await rendre("couleur", "NF13"), '<section id="vue-dans"');
    const chantier = vue.indexOf("Cuisine vert profond");
    assert.ok(chantier > 0 && chantier < vue.indexOf('href="/inspirations#'), "la réalisation d'abord");
    // Une matière sans ambiance mais portée par un chantier : la section existe, avec la réalisation seule.
    publications = [{ ...REALISATION_NF13, matieres: [{ ref: "Q1", nom: "Mat Aluminium" }] }];
    const q1 = bloc(await rendre("metal", "Q1"), '<section id="vue-dans"');
    assert.ok(q1.includes("Cuisine vert profond") && !q1.includes("/inspirations#"));
  });

  test("les liens mènent tous à une page qui existe", async () => {
    const prestations = new Set(PRESTATIONS.map((p) => `/prestations/${p.slug}`));
    const ambiances = new Set(inspirations().map((a) => a.id));
    for (const ref of ["NF13", "AA14", "Q1", "J3", CATALOGUE.find((m) => m.famille === "paillettes")!.id]) {
      const html = await rendre(familleDe(ref), ref);
      const liens = [...html.matchAll(/<a [^>]*href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
      for (const l of liens) {
        const [, familleRef, autre] = l.match(/^\/matieres\/([a-z]+)\/([A-Z0-9]+)$/) ?? [];
        const famille = l.match(/^\/matieres\/([a-z]+)$/)?.[1];
        const ancre = l.match(/^\/inspirations#(.+)$/)?.[1];
        const ok =
          ["/", "/matieres", "/pro"].includes(l) ||
          prestations.has(l) ||
          (autre !== undefined && autre !== ref && ficheDe(familleRef, autre) !== null) ||
          (famille !== undefined && CATALOGUE.some((m) => m.famille === famille)) ||
          (ancre !== undefined && ambiances.has(ancre)) ||
          l === lienVisiteMatiere(ref) ||
          l === lienEssayer(ref, DEPUIS_FICHE) ||
          /^\/simulateur\?projet=[a-z-]+&ref=[^"&]+&depuis=matiere-fiche$/.test(l);
        assert.ok(ok, `${ref} : ${l}`);
      }
    }
  });

  test("source : la vignette prioritaire avec preconnect, les réalisations lues comme /realisations, aucun préchargement", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/matieres/[famille]/[ref]/page.tsx"), "utf8");
    assert.match(source, /import \{ preconnect \} from "react-dom";/);
    assert.match(source, /if \(crm\) preconnect\(crm\);/);
    assert.doesNotMatch(source, /preload\(/);
    assert.match(source, /chargerPublications\(\)/);
  });
});

describe("D4 : les liens vers les fiches et la visite", () => {
  test("le présentoir, les familles, l'accueil, les ambiances mènent aux fiches ; /matieres?ref= reste servie", () => {
    const presentoir = readFileSync(path.join(process.cwd(), "src/app/matieres/_components/Matieres.tsx"), "utf8");
    assert.match(presentoir, /<Link href=\{cheminMatiere\(agrandie\.id, agrandie\.famille\)\} onClick=\{aller\(cheminMatiere\(agrandie\.id, agrandie\.famille\)\)\}/);
    assert.match(presentoir, /Voir la fiche de \{agrandie\.nom\}/);
    assert.match(readFileSync(path.join(process.cwd(), "src/lib/matieres.ts"), "utf8"), /referenceDeLAdresse\(parametres\.get\("ref"\), catalogue\)/, "?ref= toujours lu");
    const calque = readFileSync(path.join(process.cwd(), "src/components/ambiances/CalqueMatieres.tsx"), "utf8");
    assert.doesNotMatch(calque, /export const lienMatiere/, "plus de double de lienMatiere");
    assert.match(calque, /href=\{cheminMatiere\(m\.ref, m\.famille\)\}/);
    // Toutes les références : une fiche, sous leur famille.
    for (const m of CATALOGUE) assert.equal(lienMatiere(m.id), `/matieres/${m.famille}/${m.id}`, m.id);
  });

  test("« La voir en vrai chez moi » : la référence ou la famille, et un message prérempli", () => {
    assert.equal(lienVisiteMatiere("NF13"), "/contact?ref=NF13&visite=1");
    assert.equal(lienVisiteFamille("beton"), "/contact?visite=1&famille=beton");
    const msg = (q: string) => messageVisite(new URLSearchParams(q));
    assert.equal(msg("ref=NF13"), null, "sans visite=1, rien n'est prérempli");
    assert.match(msg("ref=NF13&visite=1")!, /^Bonjour, j'aimerais voir la matière NF13 en vrai, chez moi/);
    assert.match(msg("visite=1&famille=beton")!, /vos bétons et stucs en vrai/);
    assert.match(msg("visite=1&famille=inconnue")!, /vos matières en vrai/);
    assert.match(msg("ref=<b>x</b>&visite=1")!, /vos matières en vrai/, "une référence bricolée n'entre pas dans le message");
    const formulaire = readFileSync(path.join(process.cwd(), "src/app/contact/_components/FormulaireContact.tsx"), "utf8");
    assert.match(formulaire, /messageVisite\(new URLSearchParams\(searchParams\.toString\(\)\)\)/);
    assert.match(formulaire, /messageInitial=\{message \?\? undefined\}/);
    assert.match(readFileSync(path.join(process.cwd(), "src/components/DevisForm.tsx"), "utf8"), /name="message"\s+defaultValue=\{messageInitial\}/);
  });
});
