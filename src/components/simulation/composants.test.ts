import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AvantApres } from "./AvantApres";
import { PAS_CURSEUR, PAS_PAGE_CURSEUR, positionAuClavier } from "./curseur-clavier";
import { Etiquette } from "./Etiquette";
import { Photo, type ProprietesPhoto } from "./Photo";
import { RESERVE_BOUTON_COLLE, RESERVE_BOUTON_COLLE_MOBILE } from "./reserve-bouton-colle";

/**
 * Mission 16 (partie 1, relecture) — les composants communs :
 *  - `Photo` a toujours une hauteur (rapport réservé, ou l'image dans le flux) ;
 *  - `AvantApres` avec un rapport : les deux images remplissent le cadre de la
 *    même façon (une photo d'un autre format n'est pas coupée d'un seul côté) ;
 *  - les pastilles « Avant » / « Après » sont l'`Etiquette` commune, au dessin
 *    de la mission 15 (le simulateur ne change pas) ;
 *  - la réserve du bouton collé est une chaîne importable côté serveur.
 */

const balises = (html: string, nom: string) => html.match(new RegExp(`<${nom}\\b[^>]*>`, "g")) ?? [];
const classes = (balise: string | undefined) => (balise?.match(/\sclass="([^"]*)"/)?.[1] ?? "").split(/\s+/).filter(Boolean).sort();
const rendre = (p: ProprietesPhoto) => renderToStaticMarkup(createElement(Photo, p));

describe("Photo : une place réservée, jamais un cadre de 0 px", () => {
  test("src + dimensions : le rapport de l'image est réservé, l'image remplit le cadre", () => {
    const html = rendre({ src: "/pro.jpg", largeur: 1200, hauteur: 800, alt: "Un restaurant" });
    assert.match(html, /aspect-ratio:\s*1200 \/ 800/);
    assert.ok(classes(balises(html, "img")[0]).includes("absolute"));
  });

  test("src + ratio : le ratio demandé", () => {
    const html = rendre({ src: "/pro.jpg", ratio: "4 / 3", alt: "Un restaurant" });
    assert.match(html, /aspect-ratio:\s*4 \/ 3/);
  });

  test("un nom absent du manifeste : la place reste visible (repli 4 / 3), l'alt est lu", () => {
    const html = rendre({ nom: "inconnue-du-manifeste", alt: "Une cuisine" });
    assert.match(html, /aspect-ratio:\s*4 \/ 3/);
    assert.match(html, /role="img"[^>]*aria-label="Une cuisine"|aria-label="Une cuisine"[^>]*role="img"/);
  });

  test("l'étiquette « Ambiance » est l'Etiquette commune", () => {
    const html = rendre({ src: "/pro.jpg", largeur: 1200, hauteur: 800, alt: "Un restaurant", etiquette: "Ambiance" });
    const attendue = renderToStaticMarkup(createElement(Etiquette, { className: "absolute top-3 left-3" } as Parameters<typeof Etiquette>[0], "Ambiance"));
    assert.ok(html.includes(attendue), html);
  });
});

describe("AvantApres", () => {
  test("avec un rapport : l'après et l'avant remplissent le cadre de la même façon", () => {
    const html = renderToStaticMarkup(createElement(AvantApres, { apres: "/apres.jpg", avant: "/avant.jpg", alt: "Après", altAvant: "Avant", ratio: "4 / 3", sansOutils: true }));
    const images = balises(html, "img");
    assert.equal(images.length, 2);
    for (const img of images) {
      for (const c of ["absolute", "inset-0", "h-full", "w-full", "object-cover"]) assert.ok(classes(img).includes(c), `${c} manque : ${img}`);
    }
    assert.match(html, /aspect-ratio:\s*4 \/ 3/);
  });

  test("avec un rapport et sans photo avant : l'après remplit aussi le cadre", () => {
    const html = renderToStaticMarkup(createElement(AvantApres, { apres: "/apres.jpg", avant: null, alt: "Après", ratio: "4 / 3", sansOutils: true }));
    assert.ok(classes(balises(html, "img")[0]).includes("object-cover"));
  });

  test("sans rapport (l'espace client) : l'après donne sa hauteur naturelle, comme avant", () => {
    const html = renderToStaticMarkup(createElement(AvantApres, { apres: "/apres.jpg", avant: "/avant.jpg", alt: "Après" }));
    assert.deepEqual(classes(balises(html, "img")[0]), ["block", "w-full"]);
  });

  test("les pastilles sont l'Etiquette commune, au dessin de la mission 15", () => {
    const html = renderToStaticMarkup(createElement(AvantApres, { apres: "/apres.jpg", avant: "/avant.jpg", alt: "Après", sansOutils: true }));
    const avant = balises(html, "span").find((b) => classes(b).includes("left-3"));
    const apres = balises(html, "span").find((b) => classes(b).includes("right-3"));
    assert.ok(avant && apres);
    for (const c of ["rounded-[4px]", "px-2", "py-1", "text-[12.5px]", "font-medium", "bg-encre/70", "text-blanc"]) assert.ok(classes(avant).includes(c), `Avant : ${c}`);
    for (const c of ["rounded-[4px]", "px-2", "py-1", "text-[12.5px]", "font-medium", "bg-white/85", "text-encre"]) assert.ok(classes(apres).includes(c), `Après : ${c}`);
  });
});

describe("site 3.0, lot B3 : le curseur avant / après au clavier, sa place réservée", () => {
  test("flèches de 5 %, Page ↑ / ↓ de 25 %, Début et Fin ; toujours entre 0 et 100", () => {
    assert.equal(PAS_CURSEUR, 5);
    assert.equal(PAS_PAGE_CURSEUR, 25);
    for (const [touche, attendue] of [["ArrowRight", 55], ["ArrowUp", 55], ["ArrowLeft", 45], ["ArrowDown", 45], ["PageUp", 75], ["PageDown", 25], ["Home", 0], ["End", 100]] as const) {
      assert.equal(positionAuClavier(touche, 50), attendue, touche);
    }
    assert.equal(positionAuClavier("ArrowRight", 98), 100);
    assert.equal(positionAuClavier("PageUp", 90), 100);
    assert.equal(positionAuClavier("ArrowDown", 3), 0);
    assert.equal(positionAuClavier("PageDown", 10), 0);
  });

  test("une touche que le curseur ne gère pas garde son effet (Tab, Entrée, Espace, lettres)", () => {
    for (const touche of ["Tab", "Enter", " ", "a", "Escape"]) assert.equal(positionAuClavier(touche, 50), null, touche);
  });

  test("le curseur appelle la règle et retient le défilement de la page pour toute touche gérée", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "simulation", "AvantApres.tsx"), "utf8").replace(/\r\n/g, "\n");
    assert.match(source, /onKeyDown=\{\(e\) => \{\s*const suivante = positionAuClavier\(e\.key, position\);\s*if \(suivante === null\) return;\s*e\.preventDefault\(\);\s*setPosition\(suivante\);\s*\}\}/);
    assert.doesNotMatch(source, /e\.key === "Arrow/, "plus de touche gérée hors de la règle");
  });

  test("un vrai curseur pour les lecteurs d'écran : role slider, focalisable, nommé, bornes et valeur", () => {
    const html = renderToStaticMarkup(createElement(AvantApres, { apres: "/apres.jpg", avant: "/avant.jpg", alt: "Après", ratio: "4 / 3", sansOutils: true }));
    const curseur = balises(html, "div").find((b) => b.includes('role="slider"'));
    assert.ok(curseur);
    for (const attribut of ['tabindex="0"', 'aria-label="Comparer avant et après"', 'aria-valuemin="0"', 'aria-valuemax="100"', 'aria-valuenow="50"', 'aria-valuetext="Moitié avant, moitié après"']) assert.ok(curseur.includes(attribut), attribut);
    // La poignée fait 48 px (cible tactile ≥ 44 px).
    assert.ok(classes(curseur).includes("h-12") && classes(curseur).includes("w-12"));
  });

  test("hors espace client, chaque curseur réserve sa place (ratio) : aucun décalage au chargement", () => {
    const src = join(process.cwd(), "src");
    const tous = (d: string, sortie: string[] = []): string[] => {
      for (const n of readdirSync(d)) {
        const c = join(d, n);
        if (statSync(c).isDirectory()) tous(c, sortie);
        else if (c.endsWith(".tsx")) sortie.push(c);
      }
      return sortie;
    };
    const appels: string[] = [];
    for (const f of tous(src)) {
      const nom = relative(src, f).split(sep).join("/");
      // L'espace client, et l'arrivée du rendu qu'il est seul à employer : images du CRM au format inconnu.
      if (nom.startsWith("components/espace/") || nom === "components/simulation/FonduRendu.tsx") continue;
      for (const m of readFileSync(f, "utf8").matchAll(/<AvantApres\b([\s\S]*?)\/>/g)) {
        appels.push(nom);
        assert.match(m[1], /\bratio=\{/, `${nom} : <AvantApres> sans ratio`);
      }
    }
    assert.ok(appels.length >= 5, `${appels.length} appels relus`);
  });
});

describe("réserve du bouton collé", () => {
  test("des chaînes de classes (pas des références client)", () => {
    assert.equal(typeof RESERVE_BOUTON_COLLE, "string");
    assert.equal(RESERVE_BOUTON_COLLE, "pb-28");
    assert.equal(RESERVE_BOUTON_COLLE_MOBILE, "pb-28 md:pb-0");
  });
});
