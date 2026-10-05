import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Bouton, classesBouton, TEINTE_PRINCIPALE, type ProprietesBouton } from "./Bouton";
import { Lien, type ProprietesLien } from "./Lien";

/** Mission 16 (partie 1) — un seul bouton pour le site : `Bouton` (`<button>`) et `Lien` (`<a>`) partagent `classesBouton`. */

const classesDe = (html: string, balise: "button" | "a") => {
  const trouve = html.match(new RegExp(`<${balise}[^>]*\\sclass="([^"]*)"`));
  assert.ok(trouve, `pas de <${balise} class> dans ${html}`);
  return trouve[1].split(/\s+/).filter(Boolean).sort();
};
const liste = (classes: string) => classes.split(/\s+/).filter(Boolean).sort();

describe("Bouton et Lien : les mêmes classes", () => {
  for (const variante of ["principal", "secondaire", "sur-encre"] as const) {
    test(`variante ${variante}`, () => {
      const bouton = renderToStaticMarkup(createElement(Bouton, { variante } as ProprietesBouton, "Simuler ma cuisine"));
      const lien = renderToStaticMarkup(createElement(Lien, { variante, href: "/simulateur" } as ProprietesLien, "Simuler ma cuisine"));
      assert.deepEqual(classesDe(bouton, "button"), liste(classesBouton(variante)));
      assert.deepEqual(classesDe(lien, "a"), liste(classesBouton(variante)));
      assert.match(lien, /href="\/simulateur"/);
    });
  }

  test("pleine largeur des deux côtés ; une classe en plus s'ajoute sans rien retirer", () => {
    assert.ok(liste(classesBouton("principal", true)).includes("w-full"));
    assert.ok(!liste(classesBouton("principal", false)).includes("w-full"));
    const lien = renderToStaticMarkup(createElement(Lien, { href: "/", plein: true, className: "mt-4" } as ProprietesLien, "Accueil"));
    assert.deepEqual(classesDe(lien, "a"), liste(`${classesBouton("principal", true)} mt-4`));
  });

  test("cible tactile d'au moins 44 px, sur chaque variante", () => {
    for (const variante of ["principal", "secondaire", "sur-encre", "discret"] as const) {
      const hauteur = classesBouton(variante).match(/min-h-\[(\d+)px\]/);
      assert.ok(hauteur, `pas de hauteur minimale pour ${variante}`);
      assert.ok(Number(hauteur[1]) >= 44, `${variante} : ${hauteur[1]} px`);
    }
  });

  test("site 3.0 (lot B2) : le principal est le rouge, le secondaire le contour à l'encre, sur-encre le contour au papier ; aucune couleur hors jetons", () => {
    assert.match(classesBouton("principal"), /\bbg-accent\b/);
    assert.match(classesBouton("principal"), /\btext-blanc\b/);
    assert.match(classesBouton("principal"), /\bhover:bg-accent-survol\b/);
    assert.ok(classesBouton("principal").includes(TEINTE_PRINCIPALE), "le libellé-bouton de fichier prend les mêmes teintes");
    assert.match(classesBouton("secondaire"), /\bborder-encre\b/);
    assert.match(classesBouton("secondaire"), /\btext-encre\b/);
    assert.match(classesBouton("sur-encre"), /\bborder-fond\b/);
    assert.match(classesBouton("sur-encre"), /\btext-fond\b/);
    assert.match(classesBouton("sur-encre"), /\bhover:bg-fond\/10(?!\S)/);
    // Le rouge n'est que dans le principal : ni le contour, ni le lien discret.
    for (const variante of ["secondaire", "sur-encre", "discret"] as const) assert.doesNotMatch(classesBouton(variante), /accent/, variante);
    const toutes = (["principal", "secondaire", "sur-encre", "discret"] as const).map((v) => classesBouton(v)).join(" ");
    assert.doesNotMatch(toutes, /text-white|bg-rouge|#[0-9a-f]{3,6}/i);
  });
});
