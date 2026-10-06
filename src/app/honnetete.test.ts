import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createElement } from "react";
import { renderToReadableStream, renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import sitemap from "@/app/sitemap";
import EcranResultat from "@/app/simulateur/_components/EcranResultat";
import { ExemplesPhoto } from "@/app/simulateur/_components/ExemplesPhoto";
import { ETAPES_TRAVAIL } from "@/components/accueil/CommentOnTravaille";
import { AMBIANCES_SERIE_2, PAIRES_SERIE_2, PHOTOS_UTILES } from "@/data/ambiances-serie-2";
import { ENTREPRISE } from "@/lib/entreprise";
import { exemplesSimulateur } from "@/lib/exemples-simulateur";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import type { Publication } from "@/lib/publications";
import type { RenduSimulateur } from "@/lib/simulateur/reprise";

/**
 * Site 3.0, lot F6 (plan, F6 ; règle d'honnêteté de l'énoncé) : vérifié sur les pages RENDUES, pas sur les données —
 *  - chaque image du manifeste (`lib/images-manifeste` : toutes les images du dépôt, toutes générées sauf la capture
 *    du simulateur `etape-simulation`) porte son étiquette posée sur elle : « Ambiance » ou « Ambiance · avant /
 *    après », « Simulation » pour la capture du simulateur, jamais « Réalisation » ;
 *  - la série 2 (bibliothèque du lot B4) ne porte donc jamais « Réalisation », ni dans l'étiquette ni dans le texte
 *    alternatif ;
 *  - un rendu fait sur une pièce d'exemple (`ExemplesPhoto`, résultat d'un exemple) ne porte jamais « Simulation » ;
 *  - un vrai chantier publié par le CRM porte « Réalisation » et passe devant les ambiances.
 * Pages rendues : toutes celles du plan du site (les pages indexées), comme par Next (routeur factice, CRM simulé :
 * aucune requête réseau).
 *
 * Lecture du HTML : une image = un `<picture>` (ou un `<img>` hors `<picture>`) dont la source est une image préparée
 * `/images/prep/<nom>-<largeur>.<format>` ; les deux images d'un curseur (après, puis avant, sans texte entre elles)
 * forment un cadre ; l'étiquette du cadre est la première pastille `Etiquette` (hors « Avant » / « Après ») qui le
 * suit avant l'image suivante.
 */

const ROUTEUR = { back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, prefetch() {} };
let publications: Partial<Publication>[] = [];
const fetchOrigine = globalThis.fetch;
before(() => {
  globalThis.fetch = (async (url: string | URL) => (String(url).endsWith("/api/site/publications") ? new Response(JSON.stringify({ publications }), { status: 200 }) : new Response("{}", { status: 404 }))) as typeof fetch;
});
after(() => {
  globalThis.fetch = fetchOrigine;
});

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
  return (await new Response(flux).text()).replace(/&amp;/g, "&").replace(/&#x27;/g, "'");
}

type ImageRendue = { nom: string; debut: number; fin: number; alt: string };
type Cadre = { noms: string[]; alts: string[]; etiquette: string | null };

const PASTILLE = /<span[^>]*class="[^"]*rounded-\[4px\] px-2 py-1 text-\[12\.5px\][^"]*"[^>]*>([\s\S]*?)<\/span>/g;
const sansBalises = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** Les images d'une page, dans l'ordre : tout `<picture>`, et tout `<img>` hors `<picture>` (nom `null` hors manifeste). */
function images(html: string): (ImageRendue & { manifeste: boolean })[] {
  const liste: (ImageRendue & { manifeste: boolean })[] = [];
  const dansPicture: [number, number][] = [];
  for (const m of html.matchAll(/<picture[\s\S]*?<\/picture>/g)) {
    dansPicture.push([m.index, m.index + m[0].length]);
    const nom = m[0].match(/\/images\/prep\/([a-z0-9-]+?)-\d+\.(?:avif|webp|jpg)/)?.[1] ?? "";
    liste.push({ nom, debut: m.index, fin: m.index + m[0].length, alt: m[0].match(/<img[^>]* alt="([^"]*)"/)?.[1] ?? "", manifeste: nom in MANIFESTE_IMAGES });
  }
  for (const m of html.matchAll(/<img [^>]*>/g)) {
    if (dansPicture.some(([d, f]) => m.index > d && m.index < f)) continue;
    const nom = m[0].match(/\/images\/prep\/([a-z0-9-]+?)-\d+\.(?:avif|webp|jpg)/)?.[1] ?? "";
    // Les vignettes d'échantillons et les pictos ne coupent pas un cadre : seule une image du manifeste compte ici.
    if (nom) liste.push({ nom, debut: m.index, fin: m.index + m[0].length, alt: m[0].match(/ alt="([^"]*)"/)?.[1] ?? "", manifeste: nom in MANIFESTE_IMAGES });
  }
  return liste.sort((a, b) => a.debut - b.debut);
}

/** Les cadres des images du manifeste et leur étiquette d'honnêteté. */
function cadres(html: string): Cadre[] {
  const toutes = images(html);
  const sortie: Cadre[] = [];
  for (let i = 0; i < toutes.length; i++) {
    if (!toutes[i].manifeste) continue;
    const groupe = [toutes[i]];
    // L'avant d'un curseur suit son après sans texte entre les deux : un seul cadre.
    while (toutes[i + 1]?.manifeste && sansBalises(html.slice(toutes[i].fin, toutes[i + 1].debut)) === "") groupe.push(toutes[++i]);
    const fin = toutes[i + 1]?.debut ?? html.length;
    const suite = html.slice(toutes[i].fin, Math.min(fin, toutes[i].fin + 6000));
    const etiquettes = [...suite.matchAll(PASTILLE)].map((m) => sansBalises(m[1])).filter((t) => t !== "Avant" && t !== "Après");
    sortie.push({ noms: groupe.map((g) => g.nom), alts: groupe.map((g) => g.alt), etiquette: etiquettes[0] ?? null });
  }
  return sortie;
}

/**
 * L'étiquette due à une image du manifeste : la capture du simulateur est une « Simulation », l'affiche de la démo du
 * simulateur (mission 22) une « Démonstration », tout le reste est généré (les affiches des autres films aussi).
 */
const etiquettesPermises = (nom: string) => (nom === "etape-simulation" ? ["Simulation"] : nom === "affiche-demo-simulateur" ? ["Démonstration"] : ["Ambiance", "Ambiance · avant / après"]);

const SERIE_2 = new Set([...AMBIANCES_SERIE_2.flatMap((a) => [a.image, a.avant ?? a.image]), ...PAIRES_SERIE_2.map((p) => p.avant), ...PHOTOS_UTILES.map((p) => p.image)]);
const ADRESSES = sitemap().map((e) => e.url.slice(ENTREPRISE.site.length) || "/");

describe("honnêteté des images (site 3.0, lot F6)", () => {
  test("la lecture : un curseur est un cadre, son étiquette est sous lui ; une image sans étiquette se voit", () => {
    const pic = (nom: string) => `<picture><source type="image/avif" srcSet="/images/prep/${nom}-480.avif?v=1 480w"/><img src="/images/prep/${nom}-480.jpg?v=1" alt="${nom}"/></picture>`;
    const etiquette = (t: string) => `<span class="inline-flex items-center rounded-[4px] px-2 py-1 text-[12.5px] font-medium bg-white/85 text-encre">${t}</span>`;
    const html = `<div>${pic("cuisine-merisier-apres-couleur")}${pic("cuisine-merisier-avant")}${etiquette("Avant")}${etiquette("Après")}${etiquette("Ambiance · avant / après")}</div><p>Texte</p><div>${pic("pose-mains")}</div><p>Rien</p>${pic("detail-chant")}${etiquette("Ambiance")}`;
    assert.deepEqual(cadres(html), [
      { noms: ["cuisine-merisier-apres-couleur", "cuisine-merisier-avant"], alts: ["cuisine-merisier-apres-couleur", "cuisine-merisier-avant"], etiquette: "Ambiance · avant / après" },
      { noms: ["pose-mains"], alts: ["pose-mains"], etiquette: null },
      { noms: ["detail-chant"], alts: ["detail-chant"], etiquette: "Ambiance" },
    ]);
    assert.deepEqual(etiquettesPermises("etape-simulation"), ["Simulation"]);
    assert.deepEqual(etiquettesPermises("affiche-demo-simulateur"), ["Démonstration"]);
    assert.ok(SERIE_2.has("cuisine-bordeaux-brillante-avant") && SERIE_2.has("usure-detail") && SERIE_2.has("pro-comptoir-accueil-apres-bois"));
    for (const nom of SERIE_2) assert.ok(nom in MANIFESTE_IMAGES, `${nom} : au manifeste`);
  });

  test("chaque image du manifeste rendue, sur toutes les pages indexées, porte son étiquette ; la série 2 jamais « Réalisation »", async () => {
    publications = [];
    const fautes: string[] = [];
    const vues = new Set<string>();
    let nombre = 0;
    for (const chemin of ADRESSES) {
      for (const cadre of cadres(await rendre(chemin))) {
        nombre++;
        for (const nom of cadre.noms) {
          vues.add(nom);
          if (!cadre.etiquette || !etiquettesPermises(nom).includes(cadre.etiquette)) fautes.push(`${chemin} › ${nom} : ${cadre.etiquette ?? "sans étiquette"}`);
          if (SERIE_2.has(nom) && /Réalisation/.test(`${cadre.etiquette} ${cadre.alts.join(" ")}`)) fautes.push(`${chemin} › ${nom} : « Réalisation » sur la série 2`);
        }
      }
    }
    assert.deepEqual(fautes, []);
    // La vérification porte : des centaines de cadres, et presque tout le manifeste passe sous les yeux du test.
    assert.ok(nombre > 200, `${nombre} cadres`);
    const jamais = Object.keys(MANIFESTE_IMAGES).filter((nom) => !vues.has(nom));
    assert.ok(jamais.length <= 10, `images du manifeste jamais rendues sur une page indexée : ${jamais.join(", ")}`);
  });

  test("un vrai chantier publié porte « Réalisation » et passe en premier ; les ambiances autour gardent « Ambiance »", async () => {
    publications = [{ id: "r1", type: "REALISATION", titre: "Cuisine en chêne", texte: "Façades refaites.", ville: "Lattes", typeProjet: "CUISINE", note: null, auteur: null, photoAvant: "https://crm.example.test/api/site/photos/r1/avant", photoApres: "https://crm.example.test/api/site/photos/r1/apres", matieres: [{ ref: "AA14", nom: "Original Oak" }], publieLe: "2026-09-01T00:00:00.000Z" }];
    try {
      for (const chemin of ["/", "/realisations"]) {
        const html = await rendre(chemin);
        const pastilles = [...html.matchAll(PASTILLE)].map((m) => sansBalises(m[1])).filter((t) => t !== "Avant" && t !== "Après");
        assert.match(pastilles[0] ?? "", /^Réalisation/, `${chemin} : la réalisation d'abord`);
        for (const cadre of cadres(html)) for (const nom of cadre.noms) assert.ok(cadre.etiquette && etiquettesPermises(nom).includes(cadre.etiquette), `${chemin} › ${nom} : ${cadre.etiquette}`);
      }
    } finally {
      publications = [];
    }
  });

  test("un rendu fait sur une pièce d'exemple ne porte jamais « Simulation » : les exemples du simulateur et leur résultat", () => {
    const exemples = exemplesSimulateur();
    assert.ok(exemples.length >= 18, `${exemples.length} exemples`);
    const rien = () => {};
    for (const exemple of exemples) {
      const html = renderToStaticMarkup(createElement(ExemplesPhoto, { exemples, projet: exemple.piece, occupe: false, charge: null, erreur: null, onEssayer: rien, initial: exemple.id })).replace(/&#x27;/g, "'");
      const lesCadres = cadres(html).filter((c) => c.noms.includes(`${exemple.id}-avant`));
      assert.equal(lesCadres.length, 1, `${exemple.id} : le curseur de l'exemple`);
      assert.equal(lesCadres[0].etiquette, "Ambiance · avant / après", exemple.id);
      const pastilles = [...html.matchAll(PASTILLE)].map((m) => sansBalises(m[1]));
      assert.ok(!pastilles.includes("Simulation"), `${exemple.id} : « Simulation » sur un exemple`);
      const rendu: RenduSimulateur = { travailId: `cmun${exemple.id}`, simulationSiteId: null, urlApres: "https://crm.coverswap.fr/api/simulate/image?id=1", urlAvant: null, references: [], le: 1, exemple: exemple.id };
      const resultat = renderToStaticMarkup(createElement(EcranResultat, { rendu, rendus: [rendu], photo: "data:image/jpeg;base64,AAAA", titre: "Votre cuisine", fondu: false, onFonduFini: rien, onChoisirRendu: rien, onAutresMatieres: rien }));
      const etiquettes = [...resultat.matchAll(PASTILLE)].map((m) => sansBalises(m[1])).filter((t) => t !== "Avant" && t !== "Après");
      assert.deepEqual(etiquettes, ["Ambiance · avant / après"], `${exemple.id} : le résultat`);
    }
    // La seule « Simulation » posée sur une image du dépôt est la capture de l'écran du simulateur.
    assert.deepEqual(ETAPES_TRAVAIL.filter((e) => e.etiquette === "Simulation").map((e) => e.image), ["etape-simulation"]);
  });
});
