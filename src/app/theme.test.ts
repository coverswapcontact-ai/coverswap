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
    assert.ok(declarees.length >= 16, `${declarees.length} couleurs`); // 18 au lot B1, moins accent-fond et accent-texte (lot B2)
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

describe("site 3.0, lot B2 : le rouge réservé aux actions", () => {
  /**
   * Le rouge s'écrit dans ces fichiers seulement : les boutons, le lien « Simuler » de l'en-tête, la pastille « 497 matières » (lot B3) et la marque.
   * Lot C6 : l'espace client y entre ; ses boutons principaux prennent `TEINTE_PRINCIPALE` de `Bouton.tsx` (aucun fichier de plus).
   */
  const PERMIS = ["components/simulation/Bouton.tsx", "components/EnteteSite.tsx", "components/revue/Pastille497.tsx", "components/Logo.tsx"];
  /** Une classe Tailwind au rouge (`bg-accent`, `hover:text-accent-survol`, `ring-accent/40`…), sa variable CSS ou sa valeur. */
  const ROUGE = /(?<![\w-])(?:bg|text|border(?:-[trblxy])?|ring|outline|fill|stroke|decoration|from|via|to|shadow|divide|caret|placeholder)-accent(?![\w])|--color-accent|#B3261E|#8F1E18/i;
  const SOURCES = [...fichiers(SRC, ".tsx"), ...fichiers(SRC, ".ts")].filter((f) => !/\.test\.tsx?$/.test(f));

  test(`${SOURCES.length} sources (hors tests, espace client compris) : le rouge n'apparaît que dans ${PERMIS.length} fichiers`, () => {
    assert.ok(SOURCES.length > 100, `${SOURCES.length} sources`);
    const constats: string[] = [];
    for (const f of SOURCES) {
      if (PERMIS.includes(nom(f))) continue;
      lire(f).split("\n").forEach((ligne, i) => {
        if (ROUGE.test(ligne)) constats.push(`${nom(f)}:${i + 1} ${ligne.trim().slice(0, 120)}`);
      });
    }
    assert.deepEqual(constats, []);
  });

  test("le motif attrape les classes au rouge et laisse passer le reste", () => {
    for (const oui of ['"bg-accent text-blanc"', "hover:bg-accent-survol", '"border-accent ring-1 ring-accent"', "text-accent", "ring-accent/40", "border-l-accent", "var(--color-accent)", "#b3261e"]) assert.match(oui, ROUGE, oui);
    for (const non of ["accent-[var(--color-encre)]", '"mur-accent"', "text-alerte-texte", "bg-alerte-fond", "border-alerte-texte/40", "une couleur d'accent"]) assert.doesNotMatch(non, ROUGE, non);
  });

  test("le rouge des fichiers permis : le bouton principal, le lien « Simuler », la marque", () => {
    assert.match(lire(join(SRC, "components", "simulation", "Bouton.tsx")), /TEINTE_PRINCIPALE = "bg-accent text-blanc hover:bg-accent-survol/);
    const entete = lire(join(SRC, "components", "EnteteSite.tsx"));
    assert.match(entete, /const LIEN_ROUGE = "[^"]*\btext-accent\b[^"]*\bhover:text-accent-survol\b/);
    assert.match(entete, /<Link href=\{LIEN_SIMULER\.href\} className=\{LIEN_ROUGE\}>/);
    assert.doesNotMatch(entete, /bg-accent/, "l'en-tête n'a pas de bouton rouge plein (le principal est celui de la page)");
  });

  test("les erreurs passent au brun (alerte-*) : les anciens jetons ont disparu, le contraste tient 4,5:1", () => {
    const JETONS = lireJetons();
    assert.ok(!("accent-fond" in JETONS) && !("accent-texte" in JETONS), "accent-fond / accent-texte encore dans @theme");
    for (const f of SOURCES) assert.doesNotMatch(lire(f), /accent-fond|accent-texte|border-accent\//, nom(f));
    const rapport = contraste(JETONS["alerte-texte"], JETONS["alerte-fond"]);
    assert.ok(rapport >= 4.5, `alerte-texte sur alerte-fond : ${rapport}`);
    // Le brun n'est pas le rouge : une erreur ne se confond pas avec une action.
    assert.notEqual(JETONS["alerte-texte"], JETONS.accent);
    assert.notEqual(JETONS["alerte-fond"], JETONS.accent);
    // Chaque message d'erreur des formulaires et du simulateur prend le brun.
    for (const f of ["app/pro/_components/FormulairePro.tsx", "components/DevisForm.tsx", "app/simulateur/_components/Simulateur.tsx", "components/simulation/FeuilleCatalogue.tsx"]) {
      assert.match(lire(join(SRC, f)), /role="alert" className="[^"]*\bbg-alerte-fond\b[^"]*\btext-alerte-texte\b|className="[^"]*\bbg-alerte-fond\b[^"]*\btext-alerte-texte\b[^"]*" role="alert"/, f);
    }
  });

  test("relecture des lots B et C : l'onglet verrouillé de l'espace client reste lisible (encre-2 plein, ≥ 4,5:1), le cadenas dit l'état", () => {
    const JETONS = lireJetons();
    const espace = lire(join(SRC, "components", "espace", "EspaceClient.tsx"));
    assert.doesNotMatch(espace, /text-encre-2\/\d+/, "un gris chaud éclairci (encre-2/70 : 2,91:1)");
    assert.match(espace, /actif \? "text-encre" : "text-encre-2",/);
    // La barre est blanche à 95 % sur le papier ; l'appui passe au fond-2.
    for (const fond of ["blanc", "fond", "fond-2"]) assert.ok(contraste(JETONS["encre-2"], JETONS[fond]) >= 4.5, `encre-2 sur ${fond}`);
    assert.match(espace, /\) : verrou \? \(\s*<span [^>]*bg-encre-2 text-blanc[^>]*>\s*<IconeCadenas taille=\{10\} \/>/);
    assert.match(espace, /verrou \? " : pas encore ouvert"/);
  });

  test("sélections et favoris à l'encre", () => {
    assert.match(lire(join(SRC, "components", "simulation", "CartesPieces.tsx")), /choisie \? "border-encre ring-1 ring-encre"/);
    assert.match(lire(join(SRC, "components", "simulation", "ElementsCatalogue.tsx")), /favori \? "text-encre" : "text-encre-2"/);
  });
});

describe("site 3.0, lot C6 : l'espace client aux jetons", () => {
  const DOSSIER_ESPACE = join(SRC, "components", "espace");
  const ESPACE = [...fichiers(DOSSIER_ESPACE, ".tsx"), ...fichiers(DOSSIER_ESPACE, ".ts")].filter((f) => !/\.test\.tsx?$/.test(f));
  /**
   * Les exceptions (fichier → raison) : aucune à ce jour. Les ombres et le reflet du « contre-jour » restent en `rgba()`
   * (des effets, pas des couleurs d'interface) ; la signature prend la couleur calculée de sa toile (`text-encre`).
   */
  const EXCEPTIONS: Record<string, string> = {};
  const PALETTE = /(?<![\w-])(?:bg|text|border|ring|divide|outline|decoration|fill|stroke|placeholder:text)-(?:white|black|gray|grey|slate|zinc|neutral|stone|red|orange|amber|yellow|green|emerald|blue|rose)(?![\w-])/;

  test(`${ESPACE.length} sources de components/espace/ : aucune valeur hexadécimale, aucune couleur de la palette Tailwind`, () => {
    assert.ok(ESPACE.length >= 15, `${ESPACE.length} sources`);
    const constats: string[] = [];
    for (const f of ESPACE) {
      if (nom(f) in EXCEPTIONS) continue;
      lire(f).split("\n").forEach((ligne, i) => {
        if (/#[0-9a-fA-F]{3,8}\b/.test(ligne)) constats.push(`${nom(f)}:${i + 1} hexa`);
        if (PALETTE.test(ligne)) constats.push(`${nom(f)}:${i + 1} palette Tailwind`);
      });
    }
    assert.deepEqual(constats, []);
    // Le motif attrape bien les formes d'avant.
    for (const avant of ['"text-[#1A1A1A]"', "bg-[#CC0000]", "ring-black/10", "text-white", 'ctx.strokeStyle = "#1A1A1A"']) assert.ok(/#[0-9a-fA-F]{3,8}\b/.test(avant) || PALETTE.test(avant), avant);
  });

  test("le rouge sur les boutons principaux seulement : BoutonPrincipal, LienPrincipal et « Réessayer » prennent TEINTE_PRINCIPALE", () => {
    const ui = lire(join(DOSSIER_ESPACE, "ui.tsx"));
    assert.match(ui, /import \{ TEINTE_PRINCIPALE \} from "@\/components\/simulation\/Bouton";/);
    const principal = ui.slice(ui.indexOf("export function BoutonPrincipal"), ui.indexOf("export function BoutonSecondaire"));
    assert.match(principal, /\$\{TEINTE_PRINCIPALE\} disabled:bg-trait disabled:text-encre-2/);
    const lien = ui.slice(ui.indexOf("export function LienPrincipal"), ui.indexOf("export function Carte"));
    assert.match(lien, /TEINTE_PRINCIPALE, FOCUS, className/);
    // Les seuls emplois : les deux boutons d'ui.tsx et le « Réessayer » d'un espace qui n'a pas pu s'ouvrir.
    const emplois = ESPACE.filter((f) => /\bTEINTE_PRINCIPALE\b/.test(lire(f))).map(nom).sort();
    assert.deepEqual(emplois, ["components/espace/EspaceClient.tsx", "components/espace/ui.tsx"]);
    // Les surtitres ne sont jamais rouges : « fort » (l'encre), « vert » (le succès), gris par défaut.
    assert.match(ui, /ton\?: "gris" \| "fort" \| "vert"/);
    assert.doesNotMatch(ESPACE.map(lire).join("\n"), /ton="rouge"/);
  });

  test("les dessins des pièces ont laissé la place aux pictogrammes ; la cuisine de face (écran Photo du simulateur) aux jetons", () => {
    const illustrations = lire(join(DOSSIER_ESPACE, "Illustrations.tsx"));
    const toutes = [...fichiers(SRC, ".tsx"), ...fichiers(SRC, ".ts")].filter((f) => !/\.test\.tsx?$/.test(f));
    for (const retire of ["SalleDeBainDeFace", "MobilierDeFace", "ProfessionnelDeFace", "MursDeFace"]) {
      for (const f of toutes) assert.ok(!lire(f).includes(retire), `${retire} dans ${nom(f)}`);
    }
    assert.doesNotMatch(illustrations, /rgba|#[0-9a-f]{3,8}\b/i);
    const photos = lire(join(DOSSIER_ESPACE, "EtapePhotos.tsx"));
    assert.doesNotMatch(photos, /CuisineDeFace/);
    assert.match(photos, /<Picto nom=\{pictoDeLaPrise\(prise\.cadre\)\} className="h-24 w-24" \/>/);
    assert.match(photos, /cadre === "plan" \? PICTOS_ELEMENTS\["plan-de-travail"\] : PICTOS_FAMILLES\.CUISINE/);
    assert.match(lire(join(SRC, "components", "simulation", "CartesPieces.tsx")), /<DessinFamille famille=\{FAMILLES\[p\.id\] \?\? "CUISINE"\} enSvg className="h-full w-full" \/>/);
  });

  test("les montants : chiffres alignés, dans la police du texte", () => {
    for (const f of ["EtapeDevis.tsx", "EtapePaiement.tsx", "EspaceCompte.tsx"]) {
      const lignes = lire(join(DOSSIER_ESPACE, f))
        .split("\n")
        .filter((l) => /\{euros\(/.test(l) && /className=/.test(l) && !/aria-label=\{`/.test(l));
      assert.ok(lignes.length > 0, f);
      for (const l of lignes) {
        assert.match(l, /tabular-nums/, `${f} : ${l.trim().slice(0, 120)}`);
        assert.doesNotMatch(l, /font-display/, `${f} : ${l.trim().slice(0, 120)}`);
      }
    }
  });
});
