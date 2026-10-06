import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { classesBouton } from "@/components/simulation/Bouton";
import { AMBIANCES_ACCUEIL } from "@/components/accueil/RealisationsAccueil";
import { PAIRES_SERIE_2 } from "@/data/ambiances";
import { PIECES_INSPIRATION, inspirations } from "@/lib/ambiances";
import { lireDepuis } from "@/lib/simulateur/entonnoir";
import { lireComposition, lireRefDemandee } from "@/lib/simulateur/matiere-demandee";
import { PREMIERES, combinaison, reglesSuite, suitesDesAmbiances } from "./_components/FiltresInspirations";
import { cartesInspirations, ordreInspirations } from "./_components/ordre";

/**
 * Site 3.0, lot C4 — /inspirations : toutes les ambiances (série 1, les 36 « après » de la série 2, les 2 ambiances ;
 * jamais un « avant » seul), filtres pièce et teinte sans JavaScript, la carte des pages de prestation (curseur si
 * c'est une paire, composition en cartels, « Essayer » `depuis=inspirations`), et une page praticable : grille dense,
 * pièces mêlées, 12 premières puis « Voir toutes les ambiances » (toujours sans JavaScript), une seule image prioritaire.
 */
const lire = (fichier: string) => readFileSync(path.join(process.cwd(), "src", fichier), "utf8");
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;
const texteHtml = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const PIECES = PIECES_INSPIRATION.map((p) => p.id);

async function rendre(): Promise<string> {
  const { default: Page } = await import("./page");
  return texteHtml(renderToStaticMarkup(createElement(Page)));
}

/** Les cartes rendues : le contenu de chaque `<li data-inspiration>`, dans l'ordre. */
const cartesRendues = (html: string) => html.split("<li ").filter((b) => /^id="[^"]+" data-inspiration=""/.test(b)).map((b) => `<li ${b}`);

describe("/inspirations : l'ordre", () => {
  const liste = inspirations();
  const ordre = ordreInspirations(liste, PIECES);

  test("les mêmes 52 ambiances, ni retirées ni doublées ; une photo seule de cuisine en tête", () => {
    assert.equal(ordre.length, 52);
    assert.deepEqual(new Set(ordre.map((a) => a.id)), new Set(liste.map((a) => a.id)));
    assert.equal(ordre[0].piece, "cuisine");
    assert.equal(ordre[0].avant, undefined, "une paire n'est jamais prioritaire : la première carte est une photo seule");
  });

  test("les douze premières montrent toutes les pièces ; deux « après » d'un même avant ne se suivent jamais", () => {
    assert.deepEqual(new Set(ordre.slice(0, PREMIERES).map((a) => a.piece)), new Set(PIECES));
    const avants = ordre.slice(0, PREMIERES).flatMap((a) => (a.avant ? [a.avant] : []));
    assert.equal(new Set(avants).size, avants.length, "aucun avant deux fois parmi les premières");
    for (let i = 1; i < ordre.length; i++) assert.ok(!ordre[i].avant || ordre[i].avant !== ordre[i - 1].avant, `${ordre[i - 1].id} puis ${ordre[i].id}`);
  });
});

describe("/inspirations : la suite, sans JavaScript", () => {
  const a = (piece: string, ...teintes: string[]) => ({ piece, teintes });
  const liste = [a("cuisine", "vert"), a("cuisine", "bleu"), a("meubles", "vert"), a("cuisine", "vert"), a("meubles", "vert")];

  test("chaque ambiance sait dans quelles combinaisons elle vient après les premières", () => {
    assert.equal(combinaison("", ""), "tout--tout");
    assert.equal(combinaison("cuisine", ""), "cuisine--tout");
    assert.deepEqual(suitesDesAmbiances(liste, ["cuisine", "meubles"], ["vert", "bleu"], 2), ["", "", "tout--tout", "tout--tout tout--vert cuisine--tout", "tout--tout tout--vert"]);
  });

  test("les règles : la suite masquée tant que la case n'est pas cochée, sauf l'ambiance visée ; le bouton et le reste comptés ; rien pour une combinaison courte", () => {
    const css = reglesSuite(".f", liste, ["cuisine", "meubles"], ["vert", "bleu"], 2);
    const choix = (p: string, t: string) => `.f:has(input[name="piece"][value="${p}"]:checked):has(input[name="teinte"][value="${t}"]:checked):not(:has(input[name="suite"]:checked))`;
    assert.ok(css.includes(`${choix("", "")} [data-suite~="tout--tout"]:not(:target) { display: none; }`));
    assert.ok(css.includes(`${choix("", "")} [data-voir-plus] { display: flex; }`));
    assert.ok(css.includes(`${choix("", "")} [data-reste]::after { content: "3 de plus"; }`));
    assert.ok(css.includes(`${choix("cuisine", "")} [data-reste]::after { content: "1 de plus"; }`));
    assert.ok(!css.includes('[data-suite~="meubles--tout"]'), "deux meubles : tout est visible, pas de bouton");
    assert.ok(!css.includes('value="bleu"'), "une seule ambiance bleue : aucune règle");
  });
});

describe("/inspirations : la page rendue", () => {
  test("52 cartes, chacune son ancre, ses données de filtre, un titre h2 ; la grille dense (1, 2, 3 colonnes)", async () => {
    const html = await rendre();
    const cartes = cartesRendues(html);
    assert.equal(cartes.length, 52);
    assert.equal(cartesInspirations().length, 52, "chaque image est préparée");
    for (const c of cartes) assert.match(c, /^<li id="[a-z0-9-]+" data-inspiration="" data-piece="[a-z-]+" data-teintes="[a-z- ]+"/);
    assert.equal(compter(html, "<h2"), 52);
    assert.match(html, /<ul class="sm:columns-2 sm:gap-x-6 lg:columns-3">/);
    for (const id of AMBIANCES_ACCUEIL) assert.ok(html.includes(`<li id="${id}"`), `l'ancre de l'accueil #${id}`);
  });

  test("honnêteté : « Ambiance » ou « Ambiance · avant / après » sur chaque carte, jamais un avant seul, jamais « Simulation » ni « Réalisation »", async () => {
    const html = await rendre();
    const cartes = cartesRendues(html);
    const paires = inspirations().filter((a) => a.avant);
    assert.equal(paires.length, 41, "36 après de la série 2 et 5 paires de la série 1");
    for (const c of cartes) assert.equal(compter(c, ">Ambiance</span>") + compter(c, ">Ambiance · avant / après</span>"), 1);
    assert.equal(compter(html, ">Ambiance · avant / après</span>"), 41, "un curseur par paire");
    assert.equal(compter(html, 'role="slider"'), 41);
    assert.equal(compter(html, ">Ambiance</span>"), 11 + 1, "les photos seules et l'étiquette de tête");
    // Un avant n'est montré que dans le curseur de ses « après » : autant d'images que de paires qui le portent.
    for (const avant of new Set(paires.map((a) => a.avant!))) {
      const nb = paires.filter((a) => a.avant === avant).length;
      assert.equal(cartes.filter((c) => c.includes(`/images/prep/${avant}-`)).length, nb, avant);
      for (const c of cartes.filter((x) => x.includes(`/images/prep/${avant}-`))) assert.match(c, /role="slider"/, `${avant} : seulement dans un curseur`);
    }
    for (const p of PAIRES_SERIE_2) assert.ok(!inspirations().some((x) => x.image === p.avant), p.avant);
    assert.equal(compter(html, "<picture"), 11 + 2 * 41);
    assert.ok(!/>Simulation</.test(html) && !/>Réalisation</.test(html));
  });

  test("composition et « Essayer » sur chacune : cartels vers leur matière, le simulateur avec la composition et depuis=inspirations", async () => {
    const html = await rendre();
    for (const c of cartesRendues(html)) {
      const essais = [...c.matchAll(/href="(\/simulateur\?[^"]+)"[^>]*>Essayer cette composition chez moi</g)].map((m) => m[1]);
      assert.equal(essais.length, 1);
      const parametres = new URLSearchParams(essais[0].split("?")[1]);
      assert.equal(lireDepuis(parametres.get("depuis")), "inspirations");
      const ref = parametres.get("ref");
      if (ref) assert.ok(lireRefDemandee(ref) === ref && lireComposition(ref), ref);
      // Site 3.0, lot D4 : vers la fiche de leur matière (`/matieres/<famille>/<REF>`).
      assert.ok(/href="\/matieres\/[a-z]+\/[A-Z0-9]+"/.test(c), "les cartels mènent à la fiche de leur matière");
      assert.equal(compter(c, 'href="/matieres?ref='), 0);
    }
  });

  test("relecture des lots B et C : une action principale, « Simuler ma pièce » depuis=inspirations, après la grille ; « Voir les matières » en secondaire", async () => {
    const html = await rendre();
    const echapper = (t: string) => t.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    const boutons = (variante: "principal" | "secondaire") => [...html.matchAll(new RegExp(`<a class="${echapper(classesBouton(variante))}[^"]*" href="([^"]*)"[^>]*>([^<]*)</a>`, "g"))].map((m) => [m[1], m[2]]);
    assert.deepEqual(boutons("principal"), [["/simulateur?depuis=inspirations", "Simuler ma pièce"]]);
    assert.equal(lireDepuis(new URLSearchParams(boutons("principal")[0][0].split("?")[1]).get("depuis")), "inspirations");
    assert.deepEqual(boutons("secondaire"), [["/matieres", "Voir les matières"]]);
    assert.ok(html.indexOf('href="/simulateur?depuis=inspirations"') > html.lastIndexOf("data-inspiration="), "après la grille");
  });

  test("une seule image prioritaire, la première carte (une photo seule) ; les paires jamais ; rien d'autre au premier chargement", async () => {
    const html = await rendre();
    const cartes = cartesRendues(html);
    assert.equal(compter(html, 'fetchPriority="high"'), 1);
    assert.ok(cartes[0].includes('fetchPriority="high"') && !cartes[0].includes('role="slider"'));
    assert.equal(compter(html, 'loading="eager"'), 1);
    for (const c of cartes.slice(1)) assert.doesNotMatch(c, /loading="eager"/);
  });

  test("praticable : les 12 premières visibles, la suite masquée jusqu'à « Voir toutes les ambiances » (une case, sans JavaScript) ; l'ambiance visée toujours montrée", async () => {
    const html = await rendre();
    const cartes = cartesRendues(html);
    const dansLaSuite = cartes.map((c) => /data-suite="[^"]*\btout--tout\b/.test(c));
    assert.deepEqual(dansLaSuite.map((x, i) => [i, x]).filter(([, x]) => x).map(([i]) => i), Array.from({ length: 40 }, (_, i) => i + PREMIERES));
    assert.equal(PREMIERES, 12);
    assert.match(html, /\[data-suite~="tout--tout"\]:not\(:target\) \{ display: none; \}/);
    assert.ok(html.includes('[data-reste]::after { content: "40 de plus"; }'));
    assert.match(html, /<div data-voir-plus="" class="mt-4 hidden [^"]*"><label class="[^"]*"><input type="checkbox"[^>]* name="suite"\/><span>Voir toutes les ambiances<\/span><span data-reste=""/);
    // Toujours sans JavaScript, et plus de calque d'étiquettes ni de légende (la composition est en cartels).
    for (const f of ["app/inspirations/page.tsx", "app/inspirations/_components/FiltresInspirations.tsx", "app/inspirations/_components/ordre.ts"]) assert.doesNotMatch(lire(f), /"use client"/, f);
    assert.doesNotMatch(lire("app/inspirations/page.tsx"), /PhotoAmbiance|LegendeMatieres/);
    // L'accueil mène aux ambiances par un lien de page (l'ancre `:target` passe la suite), jamais par `Link`.
    assert.doesNotMatch(lire("components/accueil/RealisationsAccueil.tsx"), /<Link href=\{lienInspiration/);
  });
});
