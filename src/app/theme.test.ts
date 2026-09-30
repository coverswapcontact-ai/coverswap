import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, test } from "node:test";

/**
 * Mission 16 (partie 1) — le thème clair est celui de tout le site : plus de
 * jeton sombre, plus de verre ; aucune classe du thème sombre ni emoji dans
 * les composants (l'espace client, `src/components/espace/`, est hors champ :
 * il appartient à la mission 15).
 */

const SRC = join(process.cwd(), "src");
const CSS = readFileSync(join(SRC, "app", "globals.css"), "utf8");

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

  test("la couleur de la barre du navigateur : une seule source, la valeur du jeton de fond", () => {
    const fond = CSS.match(/--color-fond:\s*(#[0-9a-f]{6})/i)?.[1];
    assert.ok(fond);
    const gabarit = readFileSync(join(SRC, "app", "layout.tsx"), "utf8");
    assert.equal(gabarit.match(/themeColor:\s*"(#[0-9A-Fa-f]{6})"/)?.[1]?.toLowerCase(), fond.toLowerCase());
    // L'espace client (/e/…) garde sa déclaration (mission 15, inchangé) ; aucune autre page n'en a.
    const autres = fichiers(join(SRC, "app"), ".tsx").filter((f) => nom(f) !== "app/layout.tsx" && !nom(f).startsWith("app/e/") && /themeColor/.test(readFileSync(f, "utf8")));
    assert.deepEqual(autres.map(nom), []);
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
