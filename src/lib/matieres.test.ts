import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import revetements from "@/data/revetements.json";
import { classesBouton } from "@/components/simulation/Bouton";
import { garderLeFocus } from "@/components/simulation/PleinEcran";
import { GRILLE_ECHANTILLONS, SqueletteTuiles } from "@/components/simulation/Squelette";
import { FAMILLES, libelleFamille } from "./familles-matieres";
import { vueDans } from "./indexation-matieres";
import { MATIERES_PAR_PAGE, catalogueEnMemoireSiCharge, chargerCatalogue, choixFamilles, choixFinitions, estAffine, etatListeMatieres, filtrerMatieres, lienEssayer, lireAdresseMatieres, messageAucuneMatiere, premieresDuPresentoir, tiroirs, type Matiere } from "./matieres";
import { NB_REFERENCES } from "./offre";
import { teinteDe, trierParTeinte } from "./teintes";

/**
 * Mission 16 (partie 5) — la page Matières : ce que l'adresse demande (`?famille=`, `?ref=`), le filtre (famille,
 * favoris, recherche en français), les familles et leurs nombres, « Essayer sur ma photo » → `/simulateur?ref=`, le
 * premier lot rendu par le serveur (référencement) et le catalogue partagé avec la feuille du simulateur.
 */

const CATALOGUE = revetements as Matiere[];
const SRC = join(process.cwd(), "src");
/** Fins de ligne ramenées à LF : sous Windows (`core.autocrlf`), un fichier repris par git revient en CRLF. */
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8").replace(/\r\n/g, "\n");
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;
/** Un routeur factice : la page (liens posés dans le plein écran) lit le routeur de Next ; rien ne navigue ici. */
const ROUTEUR = { back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, prefetch() {} };
const avecRouteur = (element: Parameters<typeof renderToStaticMarkup>[0]) => createElement(AppRouterContext.Provider, { value: ROUTEUR as never }, element);

describe("l'adresse de la page Matières", () => {
  test("?ref inconnu → rien d'ouvert ; famille inconnue → « Tout »", () => {
    for (const recherche of ["?ref=ZZZ999", "?ref=", "?ref=%20%20", "?ref=constructor", "", "?autre=1"]) {
      const lu = lireAdresseMatieres(recherche, CATALOGUE);
      assert.equal(lu.ouverte, null, recherche);
      assert.equal(lu.famille, "tout", recherche);
    }
    for (const recherche of ["?famille=inconnue", "?famille=", "?famille=constructor", "?famille=toString", "?famille=BOIS"]) assert.equal(lireAdresseMatieres(recherche, CATALOGUE).famille, "tout", recherche);
  });

  test("?ref connu → la matière s'ouvre et sa famille filtre ; ?famille explicite passe avant", () => {
    const k1 = lireAdresseMatieres("?ref=K1", CATALOGUE);
    assert.equal(k1.ouverte?.id, "K1");
    assert.equal(k1.famille, "couleur");
    assert.equal(lireAdresseMatieres("?famille=bois", CATALOGUE).famille, "bois");
    const deux = lireAdresseMatieres("?famille=bois&ref=K1", CATALOGUE);
    assert.deepEqual([deux.famille, deux.ouverte?.id], ["bois", "K1"]);
    // Avant le catalogue : rien d'ouvert (la page relit l'adresse quand il arrive), la famille explicite s'applique.
    assert.deepEqual(lireAdresseMatieres("?famille=pierre&ref=K1", null), { famille: "pierre", ouverte: null });
  });

  test("« Essayer sur ma photo » → le simulateur, la matière présélectionnée (encodée) ; `depuis` seulement s'il est donné", () => {
    assert.equal(lienEssayer("K1"), "/simulateur?ref=K1");
    assert.equal(lienEssayer("A B&C"), "/simulateur?ref=A%20B%26C");
    assert.equal(lienEssayer("NF13", "matieres"), "/simulateur?ref=NF13&depuis=matieres");
  });
});

describe("filtre et familles", () => {
  test("familles : « Tout » puis celles du simulateur, comptées dans les données", () => {
    const choix = choixFamilles(CATALOGUE);
    assert.deepEqual(choix.map((c) => c.id), ["tout", ...FAMILLES.map((f) => f.id)]);
    assert.equal(choix[0].nombre, NB_REFERENCES);
    assert.equal(choix.slice(1).reduce((n, c) => n + c.nombre, 0), NB_REFERENCES, "chaque référence a sa famille");
    assert.equal(choix.find((c) => c.id === "bois")?.nombre, CATALOGUE.filter((m) => m.famille === "bois").length);
  });

  test("famille, favoris, recherche en français ; l'ordre du catalogue est gardé", () => {
    assert.equal(filtrerMatieres(CATALOGUE, { filtre: "tout" }).length, NB_REFERENCES);
    assert.ok(filtrerMatieres(CATALOGUE, { filtre: "pierre" }).every((m) => m.famille === "pierre"));
    assert.deepEqual(filtrerMatieres(CATALOGUE, { filtre: "favoris", favoris: ["K1", "NF27"] }).map((m) => m.id).sort(), ["K1", "NF27"]);
    assert.deepEqual(filtrerMatieres(CATALOGUE, { filtre: "favoris", favoris: [] }), []);
    const noyer = filtrerMatieres(CATALOGUE, { filtre: "tout", recherche: "noyer" });
    assert.ok(noyer.length > 0 && noyer.every((m) => /walnut|noyer/i.test(`${m.nom} ${m.tags.join(" ")}`)));
    assert.ok(filtrerMatieres(CATALOGUE, { filtre: "couleur", recherche: "noir mat" }).some((m) => m.id === "K1"));
    assert.deepEqual(filtrerMatieres(CATALOGUE, { filtre: "bois", recherche: "   " }), filtrerMatieres(CATALOGUE, { filtre: "bois" }));
    const ids = filtrerMatieres(CATALOGUE, { filtre: "tout" }).map((m) => m.id);
    assert.deepEqual(ids, CATALOGUE.map((m) => m.id));
  });

  test("site 3.0, lot D2 — l'affinage : teinte, finition, vue dans une ambiance, combinables ; l'ordre du catalogue est gardé", () => {
    const vues = Object.keys(vueDans());
    const verts = filtrerMatieres(CATALOGUE, { filtre: "tout", teinte: "Vert" });
    assert.ok(verts.length > 0 && verts.every((m) => teinteDe(m.famille, m.hex) === "Vert"));
    assert.ok(verts.some((m) => m.id === "NF13"), "le vert profond");
    assert.deepEqual(filtrerMatieres(CATALOGUE, { filtre: "tout", finition: "Structured" }).map((m) => m.id), ["AA01", "AA02", "AA04", "AA05", "AA12", "AA17"]);
    assert.deepEqual(filtrerMatieres(CATALOGUE, { filtre: "tout", finition: "Rustic" }).map((m) => m.id), ["AA15"]);
    assert.equal(filtrerMatieres(CATALOGUE, { filtre: "tout", finition: "Glitter" }).length, 16);
    // « Vue dans une ambiance » garde les 49 références vues (séries 1 et 2), et elles seules.
    const enAmbiance = filtrerMatieres(CATALOGUE, { filtre: "tout", ambiance: vues });
    assert.equal(enAmbiance.length, 49);
    assert.deepEqual(enAmbiance.map((m) => m.id).sort(), [...vues].sort());
    assert.ok(!enAmbiance.some((m) => m.id === "AF02" || m.id === "NF27"));
    // Combinés : famille, teinte, ambiance, recherche.
    const boisClairsVus = filtrerMatieres(CATALOGUE, { filtre: "bois", teinte: "Bois clair", ambiance: vues });
    assert.ok(boisClairsVus.length > 0 && boisClairsVus.every((m) => m.famille === "bois" && teinteDe("bois", m.hex) === "Bois clair" && vues.includes(m.id)));
    assert.ok(boisClairsVus.some((m) => m.id === "AG13"), "le chêne pâle de la bordeaux");
    assert.deepEqual(filtrerMatieres(CATALOGUE, { filtre: "couleur", teinte: "Vert", ambiance: vues, recherche: "deep" }).map((m) => m.id), ["NF13"]);
    assert.deepEqual(filtrerMatieres(CATALOGUE, { filtre: "paillettes", finition: "Structured" }), []);
    const ids = enAmbiance.map((m) => m.id);
    assert.deepEqual(ids, CATALOGUE.map((m) => m.id).filter((id) => ids.includes(id)), "le filtre garde l'ordre du catalogue ; le présentoir range ensuite par teinte");
    // Sans affinage, rien ne change ; un affinage vide n'en est pas un.
    assert.deepEqual(filtrerMatieres(CATALOGUE, { filtre: "bois", teinte: null, finition: null, ambiance: null }), filtrerMatieres(CATALOGUE, { filtre: "bois" }));
    assert.deepEqual([estAffine({}), estAffine({ teinte: "Vert" }), estAffine({ finition: "Rustic" }), estAffine({ ambiance: vues }), estAffine({ ambiance: null })], [false, true, true, true, false]);
  });

  test("site 3.0, lot D2 — les sept tiroirs : comptés dans les données, du plus fourni au moins fourni, quatre teintes de leur nuancier", () => {
    const t = tiroirs(CATALOGUE);
    assert.deepEqual(t.map((f) => [f.id, f.libelle, f.nombre]), [
      ["tout", "Tout", 497],
      ["bois", "Bois", 267],
      ["couleur", "Couleurs", 89],
      ["textile", "Textiles", 41],
      ["pierre", "Pierres", 36],
      ["metal", "Métaux", 31],
      ["beton", "Bétons et stucs", 17],
      ["paillettes", "Paillettes", 16],
    ]);
    for (const f of t) {
      assert.equal(f.teintes.length, 4, f.id);
      for (const hex of f.teintes) assert.match(hex, /^#[0-9A-F]{6}$/, f.id);
      if (f.id !== "tout") for (const hex of f.teintes) assert.ok(CATALOGUE.some((m) => m.famille === f.id && m.hex.toUpperCase() === hex), `${f.id} : ${hex} est une de ses matières`);
    }
    assert.equal(new Set(t[1].teintes).size, 4, "quatre teintes différentes du bois");
    // La finition : les trois qui ne sont pas « Standard » (474 matières sur 497), glosées.
    assert.deepEqual(choixFinitions(CATALOGUE), [
      { id: "Structured", libelle: "Structurée", nombre: 6 },
      { id: "Rustic", libelle: "Rustique", nombre: 1 },
      { id: "Glitter", libelle: "Pailletée", nombre: 16 },
    ]);
    assert.equal(CATALOGUE.filter((m) => m.finition === "Soft").length, 474);
  });

  test("le catalogue est chargé une fois, partagé avec la feuille du simulateur", async () => {
    const premier = await chargerCatalogue();
    assert.equal(premier.length, NB_REFERENCES);
    assert.equal(await chargerCatalogue(), premier, "même copie en mémoire");
    assert.equal(catalogueEnMemoireSiCharge(), premier);
    const feuille = lire("components/simulation/FeuilleCatalogue.tsx");
    assert.match(feuille, /from "@\/lib\/matieres"/);
    assert.doesNotMatch(feuille, /import\("@\/data\/revetements\.json"\)/, "un seul chargement du catalogue");
  });
});

describe("la liste : premier lot, attente, échec, comptes", () => {
  const PREMIERES = CATALOGUE.slice(0, MATIERES_PAR_PAGE);
  const base = { probleme: false, filtre: "tout", recherche: "", premieres: PREMIERES, familles: choixFamilles(CATALOGUE), limite: MATIERES_PAR_PAGE };

  test("avant le catalogue : le premier lot pour « Tout », compté au total ; une famille attend (squelette)", () => {
    const tout = etatListeMatieres({ ...base, filtrees: null });
    assert.deepEqual([tout.visibles.length, tout.attend, tout.echec, tout.reste], [MATIERES_PAR_PAGE, false, false, NB_REFERENCES - MATIERES_PAR_PAGE]);
    assert.equal(tout.message, `${NB_REFERENCES} matières`);
    const bois = etatListeMatieres({ ...base, filtre: "bois", filtrees: null });
    assert.deepEqual([bois.visibles.length, bois.attend], [0, true]);
  });

  test("catalogue en échec sur « Tout » : le message même avec le premier lot visible, les matières affichées comptées, pas de « Voir plus »", () => {
    const tout = etatListeMatieres({ ...base, probleme: true, filtrees: null });
    assert.equal(tout.visibles.length, MATIERES_PAR_PAGE);
    assert.deepEqual([tout.echec, tout.attend, tout.reste], [true, false, 0]);
    assert.equal(tout.message, `Le reste du catalogue ne s'est pas chargé (${MATIERES_PAR_PAGE} matières affichées). Vérifiez votre réseau, puis rechargez la page.`);
    assert.ok(!tout.message.includes(String(NB_REFERENCES)), "jamais le total du catalogue");
    const bois = etatListeMatieres({ ...base, probleme: true, filtre: "bois", filtrees: null });
    assert.deepEqual([bois.visibles.length, bois.attend, bois.reste], [0, false, 0]);
    assert.equal(bois.message, "Le catalogue ne s'est pas chargé. Vérifiez votre réseau, puis rechargez la page.");
  });

  test("un affinage avant le catalogue attend (squelette) ; sans résultat, il dit d'enlever un filtre", () => {
    const vert = etatListeMatieres({ ...base, filtrees: null, affine: true });
    assert.deepEqual([vert.visibles.length, vert.attend], [0, true]);
    assert.equal(etatListeMatieres({ ...base, filtrees: [], affine: true }).message, "Aucune matière pour ce choix : enlevez un filtre ou ouvrez un autre tiroir.");
    assert.equal(messageAucuneMatiere("favoris", "", "matière", true), messageAucuneMatiere("tout", "zzz", "matière", true), "l'affinage passe avant le reste");
    assert.equal(etatListeMatieres({ ...base, filtrees: null }).visibles.length, MATIERES_PAR_PAGE, "sans affinage : le premier lot du serveur");
    const boisClairs = filtrerMatieres(CATALOGUE, { filtre: "bois", teinte: "Bois clair", ambiance: Object.keys(vueDans()) });
    assert.equal(etatListeMatieres({ ...base, filtre: "bois", filtrees: boisClairs, affine: true, precisions: ["Bois clair", "vues dans une ambiance"] }).message, `${boisClairs.length} matières dans Bois (Bois clair, vues dans une ambiance)`, "le compte dit l'affinage");
  });

  test("catalogue arrivé : compte filtré, « Voir plus », listes vides (mêmes règles que la feuille du simulateur)", () => {
    const bois = filtrerMatieres(CATALOGUE, { filtre: "bois" });
    const etat = etatListeMatieres({ ...base, filtre: "bois", filtrees: bois });
    assert.equal(etat.message, `${bois.length} matières dans ${libelleFamille("bois")}`);
    assert.equal(etat.reste, Math.max(0, bois.length - MATIERES_PAR_PAGE));
    assert.equal(etatListeMatieres({ ...base, filtre: "favoris", filtrees: [] }).message, messageAucuneMatiere("favoris", ""));
    assert.match(messageAucuneMatiere("favoris", ""), /d'une matière pour la garder/);
    assert.match(messageAucuneMatiere("favoris", "", "échantillon"), /d'un échantillon pour le garder/);
    assert.match(etatListeMatieres({ ...base, recherche: "zzz", filtrees: [] }).message, /^Aucune matière ne correspond/);
    // La feuille du simulateur lit les mêmes règles et les mêmes pièces : filtre, message, cœur, champ (rien de recopié).
    const feuille = lire("components/simulation/FeuilleCatalogue.tsx");
    assert.match(feuille, /filtrerMatieres\(catalogue \?\? \[\], \{ filtre, recherche, favoris \}\)/);
    assert.match(feuille, /messageAucuneMatiere\(filtre, recherche, "échantillon"\)/);
    assert.doesNotMatch(feuille, /correspondRecherche|IconeCoeur taille=\{18\}|const CHAMP =/);
    const page = lire("app/matieres/_components/Matieres.tsx");
    for (const source of [feuille, page]) assert.match(source, /<BoutonFavori /);
    assert.doesNotMatch(page, /IconeCoeur taille=\{18\}|Pas encore de favori|min-h-\[48px\]/);
  });
});

describe("la page rendue", () => {
  test("le serveur rend le titre, l'intro et le premier lot de 30 échantillons du nuancier (vignettes du CRM), sans bouton principal", async () => {
    const { default: PageMatieres, metadata } = await import("@/app/matieres/page");
    const html = renderToStaticMarkup(avecRouteur(createElement(PageMatieres))).replace(/&#x27;/g, "'");
    assert.match(html, /<p class="surtitre">Catalogue Cover Styl'<\/p><h1 class="titre-1 mt-2 text-encre">Choisissez votre matière<\/h1>/);
    assert.ok(html.includes(`${NB_REFERENCES} références Cover Styl'`));
    // L'intro tient en deux lignes à 390 px (environ 42 caractères par ligne en 17 px sur 358 px).
    const intro = html.match(/<p class="texte mt-4 max-w-2xl text-encre-2">([^<]*)<\/p>/);
    assert.ok(intro && intro[1].length <= 84, intro?.[1]);
    // La grille seule (la bande de matière qui ferme la page lit aussi le CRM).
    const debut = html.indexOf(`<ul class="mt-4 ${GRILLE_ECHANTILLONS}">`);
    assert.ok(debut > 0, "la grille des échantillons");
    const grille = html.slice(debut, html.indexOf("</ul>", debut));
    assert.equal(compter(grille, "/api/site/echantillons/"), MATIERES_PAR_PAGE);
    const nuancier = trierParTeinte(CATALOGUE);
    assert.deepEqual(premieresDuPresentoir(CATALOGUE), nuancier.slice(0, MATIERES_PAR_PAGE));
    let precedent = -1;
    for (const m of nuancier.slice(0, MATIERES_PAR_PAGE)) {
      const ici = grille.indexOf(`/api/site/echantillons/${m.id}?l=320`);
      assert.ok(ici > precedent, `${m.id} à sa place dans le nuancier`);
      precedent = ici;
    }
    assert.ok(!grille.includes(`/api/site/echantillons/${nuancier[MATIERES_PAR_PAGE].id}?`), "le 31e attend « Voir plus »");
    assert.ok(html.includes(`Voir plus (${NB_REFERENCES - MATIERES_PAR_PAGE})`));
    // Chaque échantillon : coin arrondi, ombre légère, la couleur de la matière dessous, son cartel ; la première rangée part tout de suite, le reste à la demande.
    assert.equal(compter(grille, 'loading="eager"'), 5);
    assert.equal(compter(grille, 'loading="lazy"'), MATIERES_PAR_PAGE - 5);
    assert.equal(compter(grille, "rounded-[var(--rayon-sm)] bg-fond-2 shadow-[0_10px_22px_rgba(40,25,15,0.18)]"), MATIERES_PAR_PAGE);
    const premiere = nuancier[0];
    assert.ok(grille.includes(`background-color:${premiere.hex}`), "la couleur de la matière tant que la vignette charge");
    assert.ok(grille.includes(`aria-label="${premiere.nom} · ${premiere.id} · `), "l'échantillon est nommé par son cartel");
    assert.equal(compter(grille, '<span class="relative block pl-[15px] mt-3"'), MATIERES_PAR_PAGE, "un cartel par échantillon, dans le bouton");
    assert.ok(!grille.includes("<p "), "pas de paragraphe dans un bouton");
    assert.equal(compter(html, `class="${classesBouton("principal")}`), 0, "le bouton principal est dans la matière en grand");
    assert.match(html, /grid-cols-2[^"]*sm:grid-cols-3[^"]*lg:grid-cols-5/);
    // Les tiroirs, leurs nombres et leurs pastilles ; les filtres.
    for (const f of tiroirs(CATALOGUE)) assert.ok(html.includes(`<span>${f.libelle}</span><span class="text-[13px] ${f.id === "tout" ? "text-blanc/70" : "text-encre-2"}">${f.nombre}</span>`), f.libelle);
    assert.equal(choixFamilles(CATALOGUE).length, tiroirs(CATALOGUE).length, "« Tout » et les sept familles");
    assert.ok(html.includes(">Favoris</span>"));
    const barre = html.slice(html.indexOf('aria-label="Familles de matières"'), html.indexOf('<select id="filtre-teinte"'));
    assert.equal(compter(barre, "h-4 w-4 rounded-full ring-2"), 32, "quatre pastilles par tiroir, « Tout » compris");
    // Lot D3 : les sept familles mènent à leur page, chacune avec les quatre teintes de son tiroir.
    const familles = html.slice(html.indexOf('<section id="familles"'), html.indexOf("</section>", html.indexOf('<section id="familles"')));
    assert.equal(compter(familles, "h-4 w-4 rounded-full ring-2"), 28, "quatre pastilles par famille");
    for (const f of tiroirs(CATALOGUE).filter((t) => t.id !== "tout")) assert.ok(familles.includes(`href="/matieres/${f.id}"`) && familles.includes(`${f.nombre} références`), f.id);
    assert.match(html, /<select id="filtre-teinte"/);
    assert.match(html, /<select id="filtre-finition"[^>]*>.*Structurée \(6\).*Rustique \(1\).*Pailletée \(16\)<\/option><\/select>/);
    assert.ok(!/<option value="Soft"/.test(html), "« Standard » ne filtrerait presque rien");
    assert.ok(html.includes('<span>Vue dans une ambiance</span><span class="text-[13px] text-encre-2">49</span>'));
    // La bande de matière ferme le présentoir, après la grille.
    assert.ok(html.indexOf('aria-label="Matière Original Oak · AA14') > debut);
    assert.equal(String(metadata.title && typeof metadata.title === "object" && "absolute" in metadata.title ? metadata.title.absolute : ""), `Films adhésifs Cover Styl' : ${NB_REFERENCES} matières | CoverSwap`, "site 3.0 (lot F2) : 60 caractères au plus (docs/SEO.md)");
  });

  test("la matière en grand : PleinEcran + ZoomImage (l'échantillon entier), nom, référence, famille, « Essayer sur ma photo »", () => {
    const source = lire("app/matieres/_components/Matieres.tsx");
    assert.match(source, /<PleinEcran/);
    assert.match(source, /apres=\{agrandie \? urlEchantillon\(agrandie\.id\) : ""\}/);
    assert.match(source, /<Lien href=\{lienEssayer\(agrandie\.id, "matieres"\)\} onClick=\{aller\(lienEssayer\(agrandie\.id, "matieres"\)\)\} plein>\s*Essayer sur ma photo/);
    // Le cartel de la matière : nom, référence, famille, finition.
    assert.match(source, /<Cartel matiere=\{agrandie\} \/>/);
    // « Vue dans » : un lien de PAGE (pas le routeur) — l'ancre ouvre l'ambiance même dans la suite masquée de /inspirations.
    assert.match(source, /<a href=\{`\/inspirations#\$\{a\.id\}`\} className="[^"]*">/);
    assert.doesNotMatch(source, /aller\(`\/inspirations/);
    assert.match(source, /useFavoris\(\)/);
    assert.match(source, /useLiensDeFeuille\(agrandie !== null, fermer\)/, "le lien part une fois le plein écran fermé");
    assert.doesNotMatch(source, /useSearchParams\(/,"l'adresse est lue sans rendre toute la page côté client");
    const pleinEcran = lire("components/simulation/PleinEcran.tsx");
    assert.match(pleinEcran, /<ZoomImage/);
    assert.match(pleinEcran, /pied \? <div className="shrink-0 bg-fond/);
  });

  test("la matière en grand est un vrai dialogue modal : page verrouillée, molette retenue, clavier gardé dedans", () => {
    assert.match(lire("app/matieres/_components/Matieres.tsx"), /\n\s+modale\n/);
    const pleinEcran = lire("components/simulation/PleinEcran.tsx");
    assert.match(pleinEcran, /if \(!modale\) return;\s+verrouillerLaPage\(\);/);
    assert.match(pleinEcran, /liberer\(\);/);
    assert.match(pleinEcran, /retenirMolette=\{modale\}/);
    // React pose « wheel » en passif : l'écouteur de la molette est posé à la main, non passif.
    assert.match(lire("components/simulation/ZoomImage.tsx"), /addEventListener\("wheel", surMolette, \{ passive: false \}\)/);
    // Tab et Maj+Tab tournent entre le premier et le dernier élément ; un focus resté dehors rentre.
    const focus: string[] = [];
    const element = (nom: string) => ({ nom, getClientRects: () => [1], focus: () => focus.push(nom) });
    const [fermer, milieu, favori] = [element("fermer"), element("essayer"), element("favori")];
    const boite = { querySelectorAll: () => [fermer, milieu, favori], contains: (x: unknown) => [fermer, milieu, favori].includes(x as never) } as unknown as HTMLElement;
    const touche = (shiftKey: boolean) => {
      let empeche = false;
      return {
        e: {
          key: "Tab",
          shiftKey,
          preventDefault: () => {
            empeche = true;
          },
        },
        empeche: () => empeche,
      };
    };
    const t1 = touche(false);
    garderLeFocus(t1.e, boite, favori as unknown as Element);
    assert.deepEqual([t1.empeche(), focus.at(-1)], [true, "fermer"]);
    const t2 = touche(true);
    garderLeFocus(t2.e, boite, fermer as unknown as Element);
    assert.deepEqual([t2.empeche(), focus.at(-1)], [true, "favori"]);
    const t3 = touche(false);
    garderLeFocus(t3.e, boite, milieu as unknown as Element);
    assert.equal(t3.empeche(), false, "au milieu, le navigateur fait son Tab");
    const t4 = touche(false);
    garderLeFocus(t4.e, boite, { hors: true } as unknown as Element);
    assert.deepEqual([t4.empeche(), focus.at(-1)], [true, "fermer"]);
  });

  test("focus visible : les tuiles s'arrêtent sous l'en-tête et la barre collée ; les pastilles du bout ne sont pas rognées", () => {
    const page = lire("app/matieres/_components/Matieres.tsx");
    assert.match(page, /const SOUS_LES_BARRES = "scroll-mt-\[140px\] lg:scroll-mt-\[200px\]";/, "dès 1 024 px, les tiroirs tiennent sur deux rangées");
    assert.equal(compter(page, "SOUS_LES_BARRES)"), 2, "la tuile et la recherche");
    assert.ok(page.includes("<BoutonFavori nom={m.nom} favori={favori} onBasculer={() => basculerFavori(m.id)} className={SOUS_LES_BARRES} />"), "le cœur aussi");
    assert.match(page, /role="group" aria-label="Familles de matières" className="[^"]*overflow-x-auto px-4 [^"]*md:px-6/);
  });

  test("le squelette de la page a la grille et la hauteur des vrais échantillons (rien ne saute à l'arrivée du catalogue)", () => {
    const page = lire("app/matieres/_components/Matieres.tsx");
    assert.match(page, /<ul className=\{cx\("mt-4", GRILLE_ECHANTILLONS\)\}>/);
    assert.match(page, /<SqueletteTuiles nombre=\{10\} grand \/>/);
    const squelette = renderToStaticMarkup(createElement(SqueletteTuiles, { nombre: 10, grand: true }));
    assert.ok(squelette.startsWith(`<ul class="${GRILLE_ECHANTILLONS}"`), squelette.slice(0, 120));
    assert.equal(compter(squelette, "<li>"), 10);
    // Le cartel : le nom de 19 px (interligne 1,25 : 24 px), puis « RÉF · famille · finition » en 12 px, souvent sur deux lignes (34 px).
    assert.equal(compter(squelette, "mt-3 flex h-[24px]") + compter(squelette, "mt-1 flex h-[34px]"), 20, "le nom puis la ligne du cartel");
    assert.equal(compter(squelette, "pl-[15px]"), 20, "décalés comme le texte du cartel, à droite de son filet");
    // Le squelette du simulateur ne change pas.
    assert.ok(renderToStaticMarkup(createElement(SqueletteTuiles)).startsWith('<ul class="grid grid-cols-3 gap-x-2.5 gap-y-3"'));
  });
});
