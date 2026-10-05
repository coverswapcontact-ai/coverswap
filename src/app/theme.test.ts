import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { contraste, lireJetons } from "../../scripts/jetons.mjs";
import { Logo } from "@/components/Logo";

/**
 * Mission 16 (partie 1) — le thème clair est celui de tout le site : plus de
 * jeton sombre, plus de verre ; aucune classe du thème sombre ni emoji dans
 * les composants (l'espace client, `src/components/espace/`, est hors champ :
 * il appartient à la mission 15).
 *
 * Site 3.0, lot B1 — les jetons de la direction « La Revue » dans le bloc
 * `@theme` de globals.css, seule source (lue par `scripts/jetons.mjs` pour les
 * images) ; leurs contrastes ; le grain du papier ; le logo hors des dessins.
 */

const RACINE = process.cwd();
const SRC = join(RACINE, "src");
/** Fins de ligne ramenées à LF : sous Windows (`core.autocrlf`), git réécrit les fichiers en CRLF au checkout. */
const lire = (f: string) => readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const CSS = lire(join(SRC, "app", "globals.css"));

function fichiers(dossier: string, extension: string, sortie: string[] = []): string[] {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) fichiers(chemin, extension, sortie);
    else if (chemin.endsWith(extension)) sortie.push(chemin);
  }
  return sortie;
}

const HORS_ESPACE = fichiers(SRC, ".tsx").filter((f) => !relative(SRC, f).split(sep).join("/").startsWith("components/espace/"));
const nom = (f: string) => relative(SRC, f).split(sep).join("/");

describe("globals.css : le thème clair seul", () => {
  test("aucun jeton sombre, ni verre, ni carte de verre", () => {
    for (const interdit of ["--color-noir", "--color-rouge", "--color-gris-", "backdrop-blur", "glass-card"]) {
      assert.ok(!CSS.includes(interdit), `globals.css contient encore ${interdit}`);
    }
  });

  test("le corps de page prend le fond et l'encre ; deux tailles de titre figées", () => {
    assert.match(CSS, /body\s*\{[^}]*background:\s*var\(--color-fond\)/);
    assert.match(CSS, /body\s*\{[^}]*color:\s*var\(--color-encre\)/);
    assert.match(CSS, /color-scheme:\s*light/);
    assert.match(CSS, /--titre-1:\s*34px/);
    assert.match(CSS, /--titre-2:\s*26px/);
    assert.match(CSS, /\.surtitre\s*\{[^}]*text-transform:\s*uppercase/);
  });

  test("la couleur de la barre du navigateur : une seule source, la valeur du jeton de fond (site et espace client)", () => {
    const fond = CSS.match(/--color-fond:\s*(#[0-9a-f]{6})/i)?.[1];
    assert.ok(fond);
    for (const f of [join(SRC, "app", "layout.tsx"), join(SRC, "app", "e", "[jeton]", "page.tsx")]) {
      assert.equal(lire(f).match(/themeColor:\s*"(#[0-9A-Fa-f]{6})"/)?.[1]?.toLowerCase(), fond.toLowerCase(), nom(f));
    }
    // Aucune autre page n'en déclare.
    const autres = fichiers(join(SRC, "app"), ".tsx").filter((f) => nom(f) !== "app/layout.tsx" && !nom(f).startsWith("app/e/") && /themeColor/.test(readFileSync(f, "utf8")));
    assert.deepEqual(autres.map(nom), []);
  });

  test("site 3.0 : le grand titre, le grand numéro, le filet, le cartel ; le focus visible sur l'encre", () => {
    assert.match(CSS, /--titre-0:\s*44px/);
    assert.match(CSS, /@media \(min-width: 48rem\) \{\s*:root \{\s*--titre-0:\s*96px/);
    for (const classe of ["titre-0", "grand-numero", "filet", "cartel"]) assert.match(CSS, new RegExp(`\\.${classe}\\s*\\{`), classe);
    assert.doesNotMatch(CSS.match(/\.grand-numero\s*\{[^}]*\}/)?.[0] ?? "", /accent/, "le grand numéro n'est jamais rouge");
    assert.match(CSS, /\.ton-encre :focus-visible\s*\{\s*outline-color:\s*var\(--color-fond\)/);
    assert.match(CSS, /\*, ::after, ::before, ::backdrop, ::file-selector-button \{ border-color: var\(--color-trait\); \}/);
  });
});

describe("site 3.0 : les jetons, une seule source", () => {
  const JETONS = lireJetons();
  const c = (texte: string, fond: string) => contraste(JETONS[texte], JETONS[fond]);

  test("les valeurs de la direction « La Revue » (énoncé, phase B)", () => {
    assert.deepEqual(
      { fond: JETONS.fond, "fond-2": JETONS["fond-2"], encre: JETONS.encre, "encre-2": JETONS["encre-2"], trait: JETONS.trait, accent: JETONS.accent, "accent-survol": JETONS["accent-survol"], "sur-encre-2": JETONS["sur-encre-2"] },
      { fond: "#F4EDE2", "fond-2": "#EBE2D4", encre: "#1B1613", "encre-2": "#6E5F52", trait: "#D9CDBD", accent: "#B3261E", "accent-survol": "#8F1E18", "sur-encre-2": "#A99C8E" },
    );
    for (const nouveau of ["alerte-fond", "alerte-texte", "succes", "succes-fond", "blanc", "sombre", "encre-survol"]) assert.ok(JETONS[nouveau], nouveau);
    // Les anciens noms du vert passent à `succes` ; la mention Google garde son gris imposé.
    assert.ok(!("ok-fond" in JETONS) && !("ok-texte" in JETONS));
    assert.equal(JETONS.google, "#5E5E5E");
  });

  test("lireJetons() rend exactement les couleurs hexadécimales du bloc @theme, et rien d'autre", () => {
    const bloc = CSS.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
    const declarees = [...bloc.matchAll(/--color-([a-z0-9-]+):\s*#/g)].map((m) => m[1]);
    assert.ok(declarees.length >= 18, `${declarees.length} couleurs`);
    assert.deepEqual(Object.keys(JETONS).sort(), declarees.sort());
    assert.deepEqual(lireJetons("@theme {\n  --color-x: #abcdef;\n  --font-y: serif;\n  --rayon-z: 4px;\n}\n"), { x: "#ABCDEF" });
    assert.throws(() => lireJetons("body { color: red; }"), /@theme/);
  });

  test("aucun fichier de jetons en double ; les scripts qui écrivent des images lisent @theme", () => {
    for (const double of ["src/lib/jetons.ts", "src/jetons.ts", "tailwind.config.ts", "tailwind.config.js"]) assert.ok(!existsSync(join(RACINE, double)), double);
    for (const f of ["scripts/generate-assets.mjs", "scripts/preparer-images.mjs"]) {
      const source = lire(join(RACINE, f));
      assert.match(source, /from ["']\.\/jetons\.mjs["']/, f);
      assert.match(source, /lireJetons\(\)/, f);
      assert.doesNotMatch(source, /["']#[0-9a-fA-F]{6}["']|\{ r: \d+, g: \d+, b: \d+ \}/, `${f} : une couleur écrite en dur`);
    }
  });

  test("contrastes mesurés (WCAG, texte courant 4,5:1), ceux de docs/DESIGN.md", () => {
    const attendus: [string, string, number][] = [
      ["encre", "fond", 15.42],
      ["encre", "fond-2", 13.98],
      ["encre-2", "fond", 5.28],
      ["encre-2", "fond-2", 4.78],
      ["accent", "fond", 5.62],
      ["accent", "fond-2", 5.09],
      ["blanc", "accent", 6.54],
      ["blanc", "accent-survol", 8.87],
      ["fond", "encre", 15.42],
      ["sur-encre-2", "encre", 6.69],
      ["alerte-texte", "alerte-fond", 6.74],
      ["alerte-texte", "fond", 7.39],
      ["succes", "succes-fond", 5.41],
      ["succes", "fond", 5.76],
      ["google", "fond", 5.58],
    ];
    for (const [texte, fond, valeur] of attendus) {
      assert.equal(c(texte, fond), valeur, `${texte} sur ${fond}`);
      assert.ok(valeur >= 4.5, `${texte} sur ${fond}`);
    }
    // Le gris chaud sur l'encre est INTERDIT (2,92) : sur l'encre, le secondaire est `sur-encre-2`.
    assert.equal(c("encre-2", "encre"), 2.92);
    assert.equal(contraste("#FFFFFF", "#000000"), 21);
    assert.equal(contraste("#777777", "#FFFFFF"), 4.48);
  });
});

describe("site 3.0 : le grain du papier", () => {
  const SANS_COMMENTAIRES = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
  const donnees = CSS.match(/--grain:\s*url\("data:image\/svg\+xml,([^"]+)"\)/)?.[1];

  test("un SVG feTurbulence, d'opacité 0,18 au plus, en tuile dimensionnée de 160 px", () => {
    assert.ok(donnees, "--grain introuvable");
    const svg = decodeURIComponent(donnees);
    assert.match(svg, /<svg xmlns='http:\/\/www\.w3\.org\/2000\/svg' width='160' height='160'>/);
    assert.match(svg, /<feTurbulence type='fractalNoise' baseFrequency='0\.7' numOctaves='3' stitchTiles='stitch'\/>/);
    assert.match(svg, /<feColorMatrix type='saturate' values='0'\/>/);
    const opacites = [...svg.matchAll(/opacity='([\d.]+)'/g)].map((m) => Number(m[1]));
    assert.equal(opacites.length, 1);
    assert.ok(opacites[0] > 0 && opacites[0] <= 0.18, `opacité ${opacites[0]}`);
    const poses = [...SANS_COMMENTAIRES.matchAll(/var\(--grain\)[^;]*;/g)].map((m) => m[0]);
    assert.ok(poses.length > 0);
    for (const pose of poses) assert.match(pose, /\/ 160px 160px;$/, pose);
  });

  test("posé sur body et .papier seulement, multiplié au papier", () => {
    const regles = [...SANS_COMMENTAIRES.matchAll(/([^{}]+)\{([^{}]*var\(--grain\)[^{}]*)\}/g)];
    assert.deepEqual(regles.map((m) => m[1].trim()), ["body", ".papier"]);
    for (const [, , corps] of regles) {
      assert.match(corps, /background: var\(--color-fond\) var\(--grain\)/);
      assert.match(corps, /background-blend-mode: multiply;/);
    }
  });

  test("jamais de .papier sur fond-2, l'encre, le sombre ou le rouge (cadres de photos, blocs encre)", () => {
    const constats: string[] = [];
    for (const f of fichiers(SRC, ".tsx")) {
      for (const [chaine] of readFileSync(f, "utf8").matchAll(/"[^"\n]*"|`[^`]*`/g)) {
        if (/(?<![\w-])papier(?![\w-])/.test(chaine) && /(?<![\w-])bg-(fond-2|encre|sombre|accent|blanc)(?![\w-])/.test(chaine)) constats.push(`${nom(f)} : ${chaine}`);
      }
    }
    assert.deepEqual(constats, []);
  });
});

describe("site 3.0 : le logo", () => {
  test("components/Logo.tsx, serveur, aux jetons ; espace/Illustrations le réexporte", () => {
    const source = lire(join(SRC, "components", "Logo.tsx"));
    assert.doesNotMatch(source, /#[0-9a-fA-F]{3,6}\b|text-white/);
    assert.doesNotMatch(source, /^["']use client["']/m);
    const html = renderToStaticMarkup(createElement(Logo));
    assert.match(html, /bg-accent/);
    assert.match(html, />Cover<span class="text-accent">Swap<\/span>/);
    const illustrations = lire(join(SRC, "components", "espace", "Illustrations.tsx"));
    assert.match(illustrations, /export \{ Logo \} from "@\/components\/Logo";/);
    assert.doesNotMatch(illustrations, /export function Logo/);
    for (const f of ["components/EnteteSite.tsx", "components/Desinscription.tsx"]) assert.match(lire(join(SRC, f)), /import \{ Logo \} from "@\/components\/Logo";/, f);
  });
});

describe("composants et pages (hors espace client) : plus rien du thème sombre", () => {
  const INTERDITS: [string, RegExp][] = [
    ["text-white", /(?<![\w-])text-white(?![\w-])/],
    ["bg-noir", /(?<![\w-])bg-noir(?![\w-])/],
    ["text-gris-", /(?<![\w-])text-gris-/],
    ["bg-rouge", /(?<![\w-])bg-rouge(?![\w-])/],
    ["emoji", /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u],
  ];

  test(`${HORS_ESPACE.length} fichiers .tsx relus`, () => {
    assert.ok(HORS_ESPACE.length > 40);
    const constats: string[] = [];
    for (const f of HORS_ESPACE) {
      const lignes = readFileSync(f, "utf8").split("\n");
      lignes.forEach((ligne, i) => {
        for (const [libelle, motif] of INTERDITS) if (motif.test(ligne)) constats.push(`${nom(f)}:${i + 1} ${libelle}`);
      });
    }
    assert.deepEqual(constats, []);
  });

  test("les composants sombres retirés ne reviennent pas", () => {
    const presents = new Set(fichiers(join(SRC, "components"), ".tsx").map(nom));
    for (const retire of ["Header", "Footer", "HeroVideo", "ScrollReveal", "TextureBackground", "WhatsAppButton"]) {
      assert.ok(!presents.has(`components/${retire}.tsx`), `${retire}.tsx existe encore`);
    }
  });
});
