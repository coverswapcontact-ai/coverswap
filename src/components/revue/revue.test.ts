import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { contraste, lireJetons } from "../../../scripts/jetons.mjs";
import revetements from "@/data/revetements.json";
import { FINITIONS, ligneCartel, texteCartel, type MatiereCartel } from "@/lib/cartel";
import { NB_REFERENCES } from "@/lib/offre";
import { classeTexteTeinte, PAPIER_GRAIN, SEUIL_TEXTE, styleTeinte, teintePrestation, TEINTES_PRESTATIONS, TEXTE_EN_TEINTE, type FondTexte, type TeinteCatalogue } from "@/lib/teintes-prestations";
import { Etiquette, TEXTES_ETIQUETTE } from "@/components/simulation/Etiquette";
import { Section } from "@/components/simulation/Section";
import { BandeMatiere, LARGEUR_ECHANTILLON_ENTIER } from "./BandeMatiere";
import { Cartel } from "./Cartel";
import { Echantillon } from "./Echantillon";
import { GrandNumero } from "./GrandNumero";
import { Pastille497 } from "./Pastille497";

/**
 * Site 3.0, lot B3 — les composants de base de la direction « La Revue » (`src/components/revue/`, docs/DESIGN.md) :
 * le cartel, la bande de matière, l'échantillon, le grand numéro (jamais rouge), la pastille « 497 matières » (rouge,
 * c'est une action) ; la teinte de chaque prestation, prise dans le catalogue et vérifiée contre lui, avec ses
 * contrastes recalculés depuis les jetons ; l'étiquette d'honnêteté ; les trois tons de section.
 */

type Ligne = { id: string; nom: string; famille: string; finition: string; hex: string };
const CATALOGUE = revetements as Ligne[];
const DU_CATALOGUE = (ref: string): MatiereCartel => {
  const m = CATALOGUE.find((r) => r.id === ref);
  assert.ok(m, `${ref} absent du catalogue`);
  return { id: m.id, nom: m.nom, famille: m.famille, finition: m.finition, hex: m.hex };
};
const RM20 = DU_CATALOGUE("RM20");
const rendre = (element: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(element);
const balises = (html: string, nom: string) => html.match(new RegExp(`<${nom}\\b[^>]*>`, "g")) ?? [];
const DOSSIER = join(process.cwd(), "src", "components", "revue");
const SOURCES = readdirSync(DOSSIER).filter((f) => f.endsWith(".tsx"));
const lire = (f: string) => readFileSync(join(DOSSIER, f), "utf8").replace(/\r\n/g, "\n");
const TOUTES_LES_TEINTES = Object.values(TEINTES_PRESTATIONS).flatMap((p) => (p.seconde ? [p.teinte, p.seconde] : [p.teinte]));

describe("revue : des composants serveur, aux jetons", () => {
  test("les six composants (mission 22 : la vidéo), sans « use client » ni couleur écrite en dur", () => {
    assert.deepEqual(SOURCES.sort(), ["BandeMatiere.tsx", "Cartel.tsx", "Echantillon.tsx", "GrandNumero.tsx", "Pastille497.tsx", "Video.tsx"]);
    for (const f of SOURCES) {
      const source = lire(f);
      assert.doesNotMatch(source, /^["']use client["'];?\s*$/m, f);
      assert.doesNotMatch(source, /#[0-9a-f]{6}\b/i, `${f} : une couleur hexadécimale écrite à la main`);
      // Un nom de classe collé à `${…}` (« md:w-36${className… ») échappe à Tailwind, qui ne le génère pas : la
      // pastille gardait 112 px de large à 1 440 px (vu sur la page de contrôle du lot B3).
      assert.doesNotMatch(source, /[A-Za-z0-9\])]\$\{/, `${f} : une classe collée à une expression`);
    }
  });
});

describe("le cartel : « Nom · RÉF · famille · finition », un filet à la teinte", () => {
  test("le texte du cartel, la famille au singulier, la finition en français", () => {
    assert.equal(texteCartel(RM20), "Sage Green · RM20 · Couleur · Standard");
    assert.equal(ligneCartel(DU_CATALOGUE("D1")), "D1 · Bois · Standard");
    assert.equal(ligneCartel({ id: "X", nom: "X", famille: "pierre" }), "X · Pierre", "sans finition connue, rien d'inventé");
    // Les quatre finitions du catalogue sont glosées, et aucune autre n'existe.
    assert.deepEqual([...new Set(CATALOGUE.map((m) => m.finition))].sort(), Object.keys(FINITIONS).sort());
  });

  test("clair : nom à l'encre, ligne au gris chaud ; le filet prend la teinte de la matière, ou celle passée", () => {
    const html = rendre(createElement(Cartel, { matiere: RM20 }));
    assert.match(html, /^<p class="relative pl-\[15px\]" style="--teinte:#616A57">/);
    assert.match(html, /<span class="block font-display[^"]*text-encre">Sage Green<\/span>/);
    assert.match(html, /<span class="cartel mt-1 block text-encre-2"><span class="sr-only"> · <\/span>RM20 · Couleur · Standard<\/span>/);
    assert.match(html, /<span aria-hidden="true" class="absolute w-\[3px\] bg-\[color:var\(--teinte,var\(--color-encre\)\)\]/);
    assert.match(rendre(createElement(Cartel, { matiere: RM20, teinte: "#23342E" })), /style="--teinte:#23342E"/);
  });

  test("encre : nom au papier, ligne en sur-encre-2 (jamais le gris chaud) ; sur-photo : voile d'encre, tout en blanc", () => {
    const encre = rendre(createElement(Cartel, { matiere: RM20, variante: "encre" }));
    assert.match(encre, /text-fond">Sage Green/);
    assert.match(encre, /cartel mt-1 block text-sur-encre-2"/);
    assert.doesNotMatch(encre, /text-encre-2/);
    const photo = rendre(createElement(Cartel, { matiere: RM20, variante: "sur-photo" }));
    assert.match(photo, /^<p class="relative w-fit max-w-full rounded-\[4px\] bg-encre\/80 py-2 pr-3 pl-\[23px\]"/);
    assert.equal((photo.match(/text-blanc/g) ?? []).length, 2);
  });
});

describe("l'échantillon : la vraie vignette du catalogue, place réservée, chargement différé", () => {
  test("vignette ?l=320 du CRM, carrée, posée sur la couleur de la matière, cartel dessous", () => {
    const html = rendre(createElement(Echantillon, { matiere: RM20 }));
    const img = balises(html, "img")[0] ?? "";
    assert.match(img, /src="[^"]*\/api\/site\/echantillons\/RM20\?l=320"/);
    assert.match(img, /alt=""/);
    assert.match(img, /width="320" height="320"/);
    assert.match(img, /loading="lazy"/);
    assert.match(html, /<span class="block aspect-square[^"]*shadow-[^"]*" style="background-color:#616A57">/);
    assert.match(html, /<figcaption><p class="relative/);
    assert.match(rendre(createElement(Echantillon, { matiere: RM20, priorite: true })), /loading="eager"/);
  });

  test("avec un lien : tout l'échantillon est le lien, nommé par son cartel (son propre texte, lot F6 : plus d'aria-label qui le double)", () => {
    const html = rendre(createElement(Echantillon, { matiere: RM20, href: "/matieres?ref=RM20" }));
    assert.match(html, /^<a [^>]*><figure/);
    assert.doesNotMatch(html, /aria-label/);
    // Le nom calculé du lien : son texte, l'image étant décorative — le cartel entier, séparateur caché compris.
    assert.equal(html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(), "Sage Green · RM20 · Couleur · Standard");
    assert.match(html, /href="\/matieres\?ref=RM20"/);
  });
});

describe("la bande de matière : étirée en fond, avec son cartel", () => {
  test("une image pour les lecteurs d'écran, nommée par le cartel ; le cartel visible est muet", () => {
    const html = rendre(createElement(BandeMatiere, { matiere: DU_CATALOGUE("NE31") }));
    assert.match(html, /^<div role="img" aria-label="Matière Statuary White · NE31 · Pierre · Standard"/);
    assert.match(html, /<div aria-hidden="true" class="absolute bottom-3 left-4[^"]*"><p class="relative w-fit max-w-full rounded-\[4px\] bg-encre\/80/);
  });

  test("hauteur réservée (96 / 128 px, ou 160 / 240), couleur de la matière en attendant, image différée et étirée", () => {
    const html = rendre(createElement(BandeMatiere, { matiere: DU_CATALOGUE("D1") }));
    assert.match(html, /class="relative w-full overflow-hidden bg-fond-2 h-24 md:h-32"/);
    assert.match(html, /style="background-color:#654835"/);
    const img = balises(html, "img")[0] ?? "";
    assert.match(img, /loading="lazy"/);
    assert.match(img, /sizes="100vw"/);
    assert.match(img, new RegExp(`srcSet="[^"]*/D1\\?l=320 320w, [^"]*/api/site/echantillons/D1 ${LARGEUR_ECHANTILLON_ENTIER}w"`));
    assert.match(img, /class="absolute inset-0 h-full w-full object-cover"/);
    assert.match(rendre(createElement(BandeMatiere, { matiere: RM20, hauteur: "haute" })), /h-40 md:h-60/);
  });
});

describe("la teinte de chaque prestation : une vraie référence du catalogue", () => {
  test("les teintes de l'énoncé (phase B, « La couleur »)", () => {
    const refs = Object.fromEntries(Object.values(TEINTES_PRESTATIONS).map((p) => [p.id, [p.teinte.ref, p.seconde?.ref].filter(Boolean).join(" + ")]));
    assert.deepEqual(refs, { cuisine: "RM20", "salle-de-bain": "M6", meubles: "NH12", "portes-placards": "NF13", murs: "NF99", professionnel: "K1 + D1" });
  });

  test("parité avec data/revetements.json : nom, famille, finition, couleur", () => {
    for (const t of TOUTES_LES_TEINTES) {
      const m = CATALOGUE.find((r) => r.id === t.ref);
      assert.ok(m, `${t.ref} absent du catalogue`);
      assert.deepEqual({ nom: t.nom, famille: t.famille, finition: t.finition, hex: t.hex }, { nom: m.nom, famille: m.famille, finition: m.finition, hex: m.hex }, t.ref);
    }
  });

  test("les pages et les cartes retrouvent leur teinte ; les vitrages n'en ont pas", () => {
    assert.equal(teintePrestation("cuisine")?.teinte.ref, "RM20");
    assert.equal(teintePrestation("mur-plafond")?.teinte.ref, "NF99", "la pièce du simulateur");
    assert.equal(teintePrestation("placard")?.teinte.ref, "NF13");
    assert.equal(teintePrestation("porte-entree")?.teinte.ref, "NF13");
    assert.equal(teintePrestation("vitrages"), null);
    assert.equal(teintePrestation("toString"), null, "un nom hérité d'Object n'est pas une prestation");
    assert.equal(teintePrestation(null), null);
    assert.deepEqual(styleTeinte(teintePrestation("professionnel")), { "--teinte": "#232220", "--teinte-2": "#654835" });
    assert.deepEqual(styleTeinte(teintePrestation("cuisine")), { "--teinte": "#616A57" });
    assert.equal(styleTeinte(null), undefined);
  });
});

describe("contrastes déclarés : du texte en teinte seulement à 4,5:1", () => {
  const JETONS = lireJetons();
  const FONDS = { papier: JETONS.fond, "papier-grain": PAPIER_GRAIN, "papier-2": JETONS["fond-2"], encre: JETONS.encre };
  const permis = (t: TeinteCatalogue): Record<FondTexte, boolean> => ({
    papier: Math.min(t.contrastes.papier, t.contrastes["papier-grain"]) >= SEUIL_TEXTE,
    "papier-2": t.contrastes["papier-2"] >= SEUIL_TEXTE,
    encre: t.contrastes.encre >= SEUIL_TEXTE,
  });

  test("le papier granulé est celui mesuré au lot B1 (docs/DESIGN.md)", () => {
    assert.match(readFileSync(join(process.cwd(), "docs", "DESIGN.md"), "utf8"), new RegExp(`5ᵉ centile[^|]*\\| \`${PAPIER_GRAIN}\``));
  });

  for (const t of TOUTES_LES_TEINTES) {
    test(`${t.ref} : rapports recalculés depuis les jetons ; texteAutorise = 4,5:1 atteint`, () => {
      const mesures = Object.fromEntries(Object.entries(FONDS).map(([fond, couleur]) => [fond, contraste(t.hex, couleur)]));
      assert.deepEqual(t.contrastes, mesures);
      assert.deepEqual(t.texteAutorise, permis(t));
      for (const [fond, oui] of Object.entries(t.texteAutorise)) if (oui) assert.ok(t.contrastes[fond as FondTexte] >= SEUIL_TEXTE, `${t.ref} sur ${fond}`);
    });
  }

  test("ce que ça donne : cuisine écrit sur le papier, salle de bain et murs jamais, meubles et murs sur l'encre", () => {
    const sur = (id: string, fond: FondTexte) => classeTexteTeinte(teintePrestation(id), fond);
    assert.equal(sur("cuisine", "papier"), TEXTE_EN_TEINTE);
    assert.equal(sur("cuisine", "papier-2"), "text-encre", "RM20 sur fond-2 : 4,41");
    assert.equal(sur("salle-de-bain", "papier"), "text-encre", "M6 sous le grain : 4,31");
    assert.equal(sur("meubles", "papier"), "text-encre");
    assert.equal(sur("meubles", "encre"), TEXTE_EN_TEINTE);
    assert.equal(sur("murs", "encre"), TEXTE_EN_TEINTE);
    assert.equal(sur("portes-placards", "encre"), "text-fond", "NF13 sur l'encre : 1,37");
    assert.equal(sur("professionnel", "papier-2"), TEXTE_EN_TEINTE);
    assert.equal(classeTexteTeinte(null, "encre"), "text-fond");
  });
});

describe("le grand numéro : encre ou teinte, jamais rouge", () => {
  test("Playfair 900 (classe en premier), décoratif, sur deux chiffres", () => {
    assert.equal(rendre(createElement(GrandNumero, { valeur: 3 })), '<span class="grand-numero text-encre" aria-hidden="true">03</span>');
    assert.equal(rendre(createElement(GrandNumero, { valeur: 12, sur: "encre" })), '<span class="grand-numero text-fond" aria-hidden="true">12</span>');
  });

  test("à la teinte là où elle tient 4,5:1, à l'encre ailleurs", () => {
    assert.equal(rendre(createElement(GrandNumero, { valeur: 1, teinte: teintePrestation("cuisine") })), `<span class="grand-numero ${TEXTE_EN_TEINTE}" aria-hidden="true" style="--teinte:#616A57">01</span>`);
    assert.match(rendre(createElement(GrandNumero, { valeur: 1, teinte: teintePrestation("salle-de-bain") })), /class="grand-numero text-encre"/);
    assert.match(rendre(createElement(GrandNumero, { valeur: 1, teinte: teintePrestation("meubles"), sur: "encre" })), new RegExp(`class="grand-numero ${TEXTE_EN_TEINTE.replace(/[[\]()]/g, "\\$&")}"`));
  });

  test("aucune combinaison ne passe au rouge (source et rendu)", () => {
    assert.doesNotMatch(lire("GrandNumero.tsx"), /accent|#B3261E|#8F1E18/i);
    for (const p of [null, ...Object.values(TEINTES_PRESTATIONS)]) {
      for (const sur of ["papier", "papier-2", "encre"] as const) {
        const html = rendre(createElement(GrandNumero, { valeur: 4, teinte: p, sur }));
        assert.doesNotMatch(html, /accent|#B3261E|#8F1E18/i, `${p?.id} sur ${sur}`);
      }
    }
  });
});

describe("la pastille « 497 matières » : rouge, parce que c'est une action", () => {
  test("un lien vers /matieres, au nombre du catalogue, cible ≥ 44 px, nom accessible qui contient le texte visible", () => {
    assert.equal(NB_REFERENCES, CATALOGUE.length);
    const html = rendre(createElement(Pastille497, {}));
    assert.match(html, /^<a [^>]*href="\/matieres"/);
    assert.match(html, new RegExp(`aria-label="Voir les ${NB_REFERENCES} matières"`));
    assert.match(html, new RegExp(`>${NB_REFERENCES}</span><span class="cartel mt-1">matières</span>`));
    assert.match(html, /\bbg-accent\b[^"]*\btext-blanc\b[^"]*\bhover:bg-accent-survol\b/);
    assert.match(html, /\bh-28 w-28\b/, "112 px");
    // Le nombre vient du catalogue : aucun 497 dans le code (hors commentaires).
    const code = lire("Pastille497.tsx").replace(/\/\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(code, /\b497\b/);
    assert.match(code, /\{NB_REFERENCES\}/);
  });
});

describe("l'étiquette d'honnêteté : sept textes, un seul dessin", () => {
  test("Réalisation, Simulation, Ambiance, Ambiance · avant / après, Démonstration (mission 22), Avant, Après", () => {
    assert.deepEqual([...TEXTES_ETIQUETTE], ["Réalisation", "Simulation", "Ambiance", "Ambiance · avant / après", "Démonstration", "Avant", "Après"]);
    const classes = new Set(TEXTES_ETIQUETTE.map((t) => rendre(createElement(Etiquette, {} as Parameters<typeof Etiquette>[0], t)).match(/class="([^"]*)"/)?.[1]));
    assert.equal(classes.size, 1, "le même dessin pour toutes");
    assert.match(rendre(createElement(Etiquette, {} as Parameters<typeof Etiquette>[0], "Ambiance · avant / après")), />Ambiance · avant \/ après</);
  });
});

describe("les trois tons de section : papier, papier-2, encre", () => {
  const section = (props: Parameters<typeof Section>[0]) => balises(rendre(createElement(Section, props)), "section")[0] ?? "";
  const h2 = (props: Parameters<typeof Section>[0]) => balises(rendre(createElement(Section, props)), "h2")[0] ?? "";

  test("papier (par défaut) : transparent, le grain de la page court dessous ; jamais .papier ni un autre fond", () => {
    const s = section({ titre: "Titre" });
    assert.match(s, /class="px-4 py-\[var\(--espace-5\)\] md:px-6"/);
    assert.doesNotMatch(s, /bg-|papier/);
    assert.equal(section({ titre: "Titre", ton: "papier" }), s);
    assert.match(h2({ titre: "Titre" }), /titre-2 text-encre/);
  });

  test("papier-2 : fond-2 sans grain ; l'ancien nom fond=\"fond-2\" donne la même chose", () => {
    assert.match(section({ ton: "papier-2" }), /class="bg-fond-2 px-4/);
    assert.equal(section({ fond: "fond-2" }), section({ ton: "papier-2" }));
    assert.equal(section({ fond: "fond" }), section({ ton: "papier" }));
  });

  test("encre : ton-encre (focus, secondaire et liens au papier), titre au papier", () => {
    assert.match(section({ ton: "encre", titre: "Titre" }), /class="ton-encre bg-encre text-fond px-4/);
    assert.match(h2({ ton: "encre", titre: "Titre" }), /titre-2 text-fond/);
    const css = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
    assert.match(css, /\.ton-encre :focus-visible \{ outline-color: var\(--color-fond\); \}/);
    assert.match(css, /\.ton-encre \.surtitre, \.ton-encre \.texte-2 \{ color: var\(--color-sur-encre-2\); \}/);
    assert.match(css, /:where\(\.ton-encre\) a:not\(\[class\]\) \{ color: var\(--color-fond\); \}/);
  });
});
