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
import { GRILLE_TUILES_GRANDES, SqueletteTuiles } from "@/components/simulation/Squelette";
import { FAMILLES, libelleFamille } from "./familles-matieres";
import { MATIERES_PAR_PAGE, catalogueEnMemoireSiCharge, chargerCatalogue, choixFamilles, etatListeMatieres, filtrerMatieres, lienEssayer, lireAdresseMatieres, messageAucuneMatiere, type Matiere } from "./matieres";
import { NB_REFERENCES } from "./offre";

/**
 * Mission 16 (partie 5) — la page Matières : ce que l'adresse demande (`?famille=`, `?ref=`), le filtre (famille,
 * favoris, recherche en français), les familles et leurs nombres, « Essayer sur ma photo » → `/simulateur?ref=`, le
 * premier lot rendu par le serveur (référencement) et le catalogue partagé avec la feuille du simulateur.
 */

const CATALOGUE = revetements as Matiere[];
const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");
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

  test("« Essayer sur ma photo » → le simulateur, la matière présélectionnée (encodée)", () => {
    assert.equal(lienEssayer("K1"), "/simulateur?ref=K1");
    assert.equal(lienEssayer("A B&C"), "/simulateur?ref=A%20B%26C");
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
  test("le serveur rend le titre, l'intro et le premier lot de 30 tuiles (vignettes du CRM), sans bouton principal", async () => {
    const { default: PageMatieres, metadata } = await import("@/app/matieres/page");
    const html = renderToStaticMarkup(avecRouteur(createElement(PageMatieres))).replace(/&#x27;/g, "'");
    assert.match(html, /<p class="surtitre">Catalogue Cover Styl'<\/p><h1 class="titre-1 mt-2 text-encre">Choisissez votre matière<\/h1>/);
    assert.ok(html.includes(`${NB_REFERENCES} références Cover Styl'`));
    // L'intro tient en deux lignes à 390 px (environ 42 caractères par ligne en 17 px sur 358 px).
    const intro = html.match(/<p class="texte mt-4 max-w-2xl text-encre-2">([^<]*)<\/p>/);
    assert.ok(intro && intro[1].length <= 84, intro?.[1]);
    assert.equal(compter(html, "/api/site/echantillons/"), MATIERES_PAR_PAGE);
    for (const m of CATALOGUE.slice(0, MATIERES_PAR_PAGE)) assert.ok(html.includes(`/api/site/echantillons/${m.id}?l=320`), m.id);
    assert.ok(!html.includes(`/api/site/echantillons/${CATALOGUE[MATIERES_PAR_PAGE].id}?`), "le 31e attend « Voir plus »");
    assert.ok(html.includes(`Voir plus (${NB_REFERENCES - MATIERES_PAR_PAGE})`));
    assert.equal(compter(html, `class="${classesBouton("principal")}`), 0, "le bouton principal est dans la matière en grand");
    assert.match(html, /grid-cols-3[^"]*md:grid-cols-5/);
    for (const f of choixFamilles(CATALOGUE)) assert.ok(html.includes(`>${f.libelle}</span>`), f.libelle);
    assert.match(String(metadata.title && typeof metadata.title === "object" && "absolute" in metadata.title ? metadata.title.absolute : ""), new RegExp(`^Matières Cover Styl' : bois, marbre, béton, couleurs — ${NB_REFERENCES} références`));
  });

  test("la matière en grand : PleinEcran + ZoomImage (l'échantillon entier), nom, référence, famille, « Essayer sur ma photo »", () => {
    const source = lire("app/matieres/_components/Matieres.tsx");
    assert.match(source, /<PleinEcran/);
    assert.match(source, /apres=\{agrandie \? urlEchantillon\(agrandie\.id\) : ""\}/);
    assert.match(source, /<Lien href=\{lienEssayer\(agrandie\.id\)\} onClick=\{aller\(lienEssayer\(agrandie\.id\)\)\} plein>\s*Essayer sur ma photo/);
    assert.match(source, /Réf\. \{agrandie\.id\} · \{libelleFamille\(agrandie\.famille\)\}/);
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
    assert.match(page, /const SOUS_LES_BARRES = "scroll-mt-\[140px\]";/);
    assert.equal(compter(page, "SOUS_LES_BARRES)"), 2, "la tuile et la recherche");
    assert.ok(page.includes("<BoutonFavori nom={m.nom} favori={favori} onBasculer={() => basculerFavori(m.id)} className={SOUS_LES_BARRES} />"), "le cœur aussi");
    assert.match(page, /role="group" aria-label="Familles de matières" className="[^"]*overflow-x-auto px-4 [^"]*md:px-6/);
  });

  test("le squelette de la page a la grille et la hauteur des vraies tuiles (rien ne saute à l'arrivée du catalogue)", () => {
    const page = lire("app/matieres/_components/Matieres.tsx");
    assert.match(page, /<ul className=\{cx\("mt-4", GRILLE_TUILES_GRANDES\)\}>/);
    assert.match(page, /<SqueletteTuiles nombre=\{15\} grand \/>/);
    const squelette = renderToStaticMarkup(createElement(SqueletteTuiles, { nombre: 15, grand: true }));
    assert.ok(squelette.startsWith(`<ul class="${GRILLE_TUILES_GRANDES}"`), squelette.slice(0, 120));
    assert.equal(compter(squelette, "<li>"), 15);
    assert.equal(compter(squelette, "h-[19.5px]") + compter(squelette, "h-[22.5px]"), 30, "le libellé de 13 px puis le nom de 15 px");
    // Le squelette du simulateur ne change pas.
    assert.ok(renderToStaticMarkup(createElement(SqueletteTuiles)).startsWith('<ul class="grid grid-cols-3 gap-x-2.5 gap-y-3"'));
  });
});
