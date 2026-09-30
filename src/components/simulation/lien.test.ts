import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Bouton, classesBouton, type ProprietesBouton } from "./Bouton";
import { Lien, type ProprietesLien } from "./Lien";

/** Mission 16 (partie 1) — un seul bouton pour le site : `Bouton` (`<button>`) et `Lien` (`<a>`) partagent `classesBouton`. */

const classesDe = (html: string, balise: "button" | "a") => {
  const trouve = html.match(new RegExp(`<${balise}[^>]*\\sclass="([^"]*)"`));
  assert.ok(trouve, `pas de <${balise} class> dans ${html}`);
  return trouve[1].split(/\s+/).filter(Boolean).sort();
};
const liste = (classes: string) => classes.split(/\s+/).filter(Boolean).sort();

describe("Bouton et Lien : les mêmes classes", () => {
  for (const variante of ["principal", "secondaire"] as const) {
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
    for (const variante of ["principal", "secondaire", "discret"] as const) {
      const hauteur = classesBouton(variante).match(/min-h-\[(\d+)px\]/);
      assert.ok(hauteur, `pas de hauteur minimale pour ${variante}`);
      assert.ok(Number(hauteur[1]) >= 44, `${variante} : ${hauteur[1]} px`);
    }
  });

  test("le principal est l'encre, le secondaire le contour : aucune couleur hors jetons", () => {
    assert.match(classesBouton("principal"), /\bbg-encre\b/);
    assert.match(classesBouton("secondaire"), /\bborder-encre\b/);
    assert.doesNotMatch(`${classesBouton("principal")} ${classesBouton("secondaire")} ${classesBouton("discret")}`, /text-white|bg-rouge|#[0-9a-f]{3,6}/i);
  });
});
