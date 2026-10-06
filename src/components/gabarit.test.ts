import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { contraste, lireJetons } from "../../scripts/jetons.mjs";
import { LIENS_PIED } from "@/lib/navigation";
import PiedDePage from "./PiedDePage";
import { ATTRIBUT_FEUILLE_OUVERTE, estChampDeSaisie, masquerPendantSaisie, retenirLeFocus } from "./simulation/saisie";

/**
 * Site 3.0, lot B5 — le gabarit (docs/DESIGN.md, « Le gabarit ») : l'en-tête (60 px, filet d'encre, menu en petites
 * capitales, lien rouge « Simuler ma pièce »), le menu du téléphone au même style, le pied de page en ton encre (liens
 * inchangés, contrastes tenus sur l'encre), le bouton collé qui s'efface pendant une saisie, à l'accueil seulement.
 */

const lire = (chemin: string) => readFileSync(join(process.cwd(), "src", chemin), "utf8");
const JETONS = lireJetons();

describe("gabarit : l'en-tête", () => {
  const entete = lire("components/EnteteSite.tsx");

  test("60 px gardés, collé en haut, le papier et son grain, un filet d'encre dessous", () => {
    assert.match(entete, /<header className="papier sticky top-0 z-50 border-b border-encre">/);
    assert.match(entete, /flex h-\[60px\]/);
    assert.doesNotMatch(entete, /bg-fond-2|shadow|backdrop-blur/, "ni cadre fond-2, ni ombre, ni verre");
  });

  test("le menu : petites capitales espacées, à l'encre, cibles de 44 px", () => {
    const entree = entete.match(/const ENTREE_MENU = "([^"]+)"/)?.[1] ?? "";
    for (const classe of ["uppercase", "tracking-[0.08em]", "text-[13px]", "text-encre", "min-h-[44px]"]) assert.ok(entree.split(" ").includes(classe), classe);
    assert.ok(!entree.split(" ").includes("text-encre-2"), "plus en gris chaud");
    assert.match(entete, /\{ENTREES_MENU\.map\(\(entree\) => \(\s*<li key=\{entree\.href\}>\s*<Link href=\{entree\.href\} className=\{ENTREE_MENU\}>/);
  });

  test("le menu d'ordinateur et le bouton « Menu » du téléphone basculent à la même largeur (jamais les deux, jamais aucun)", () => {
    assert.match(entete, /<nav aria-label="Menu principal" className="hidden lg:block">/);
    const menu = lire("components/MenuMobile.tsx");
    const bouton = menu.match(/<button type="button" aria-haspopup="dialog".*?className="([^"]+)"/s)?.[1] ?? "";
    assert.ok(bouton.split(" ").includes("lg:hidden"), bouton);
    assert.ok(!/\bmd:hidden\b/.test(bouton), "ancien seuil de 768 px");
  });

  test("« Simuler ma pièce » : un lien rouge (pas un bouton plein), sur une ligne, vers LIEN_SIMULER (depuis=entete)", () => {
    const rouge = entete.match(/const LIEN_ROUGE = "([^"]+)"/)?.[1] ?? "";
    for (const classe of ["text-accent", "font-bold", "whitespace-nowrap", "shrink-0", "min-h-[44px]"]) assert.ok(rouge.split(" ").includes(classe), classe);
    assert.match(entete, /<Link href=\{LIEN_SIMULER\.href\} className=\{LIEN_ROUGE\}>\s*\{LIEN_SIMULER\.libelle\}/);
    assert.ok(!entete.includes('"/simulateur'), "l'adresse vient de lib/navigation");
  });
});

describe("gabarit : le menu du téléphone", () => {
  const menu = lire("components/MenuMobile.tsx");

  test("au style de l'en-tête : petites capitales, filets d'encre", () => {
    const lien = menu.match(/const LIEN = "([^"]+)"/)?.[1] ?? "";
    for (const classe of ["uppercase", "tracking-[0.08em]", "border-encre", "text-encre", "min-h-[56px]"]) assert.ok(lien.split(" ").includes(classe), classe);
    assert.match(menu, /<ul className="border-t border-encre">/);
    const bouton = menu.match(/<button type="button" aria-haspopup="dialog".*?className="([^"]+)"/s)?.[1] ?? "";
    for (const classe of ["uppercase", "tracking-[0.08em]", "min-h-[44px]", "min-w-[44px]"]) assert.ok(bouton.split(" ").includes(classe), classe);
  });

  test("le bouton principal « Simuler ma pièce » au pied de la feuille, qui ferme la feuille avant de naviguer", () => {
    assert.match(menu, /pied=\{\s*<Lien href=\{LIEN_SIMULER\.href\} onClick=\{aller\(LIEN_SIMULER\.href\)\} plein>\s*\{LIEN_SIMULER\.libelle\}\s*<\/Lien>/);
  });
});

describe("gabarit : le pied de page en ton encre", () => {
  const source = lire("components/PiedDePage.tsx");
  const html = renderToStaticMarkup(createElement(PiedDePage));

  test("un bloc encre (ton-encre : focus au papier), sans grain ni fond-2, toujours id=pied-de-page (cible du bouton collé)", () => {
    assert.match(html, /^<footer id="pied-de-page" class="ton-encre bg-encre [^"]*text-fond/);
    assert.doesNotMatch(html, /class="[^"]*(?:\bpapier\b|\bbg-fond-2\b|\bbg-fond\b)/);
  });

  test("les liens inchangés : ceux de lib/navigation, les réseaux, les pages légales", () => {
    for (const { href } of LIENS_PIED) assert.ok(html.includes(`href="${href}"`), href);
    for (const href of ["/mentions-legales", "/politique-confidentialite", "/cgv", "tel:", "mailto:"]) assert.ok(html.includes(`href="${href}`), href);
    assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length, 3, "Instagram, Facebook, TikTok");
  });

  test("sur l'encre : jamais le gris chaud ni l'encre en texte ; papier et sur-encre-2 tiennent 4,5:1", () => {
    assert.doesNotMatch(html, /\btext-encre(?:-2)?(?![\w-])/, "texte invisible ou à 2,92:1 sur l'encre");
    assert.doesNotMatch(html, /border-trait/, "filet au trait (beige) sur l'encre");
    assert.match(source, /const LIEN = "[^"]*\btext-sur-encre-2\b[^"]*\bhover:text-fond\b/);
    assert.ok(contraste(JETONS.fond, JETONS.encre) >= 4.5);
    assert.ok(contraste(JETONS["sur-encre-2"], JETONS.encre) >= 4.5);
  });

  test("relecture des lots B et C : chaque lien du pied fait au moins 44 × 44 px (« Pro » faisait 25 px de large, « CGV » 30)", () => {
    // Les liens du pied (navigation, réseaux, pages légales) : la même classe, hauteur ET largeur de 44 px au moins.
    const liens = [...html.matchAll(/<a [^>]*class="([^"]*text-sur-encre-2[^"]*)"[^>]*>([^<]*)<\/a>/g)];
    assert.equal(liens.length, LIENS_PIED.length + 3 + 3, "navigation, trois réseaux, trois pages légales");
    for (const [, classes, libelle] of liens) assert.ok(/(^| )min-h-\[44px\]( |$)/.test(classes) && /(^| )min-w-\[44px\]( |$)/.test(classes), libelle);
    for (const libelle of ["Pro", "CGV"]) assert.match(html, new RegExp(`<a [^>]*class="[^"]*min-w-\\[44px\\][^"]*"[^>]*>${libelle}</a>`), libelle);
  });

  test("le focus clavier se voit sur l'encre : la règle .ton-encre passe le contour au papier", () => {
    assert.match(lire("app/globals.css"), /\.ton-encre :focus-visible \{ outline-color: var\(--color-fond\); \}/);
  });
});

describe("gabarit : une feuille fermée rend le focus (relecture des lots B et C)", () => {
  test("l'élément qui avait le focus à l'ouverture le retrouve, s'il est encore dans la page ; jamais <body>", () => {
    const appels: string[] = [];
    const element = (tagName: string, isConnected = true) => ({ tagName, isConnected, focus: (o?: FocusOptions) => appels.push(`${tagName}:${o?.preventScroll}`) });
    retenirLeFocus(element("BUTTON"))();
    retenirLeFocus(element("A"))();
    retenirLeFocus(element("BUTTON", false))();
    retenirLeFocus(element("BODY"))();
    retenirLeFocus(null)();
    retenirLeFocus(undefined)();
    assert.deepEqual(appels, ["BUTTON:true", "A:true"], "rendu sans défilement ; ni un élément retiré, ni le corps de la page");
  });

  test("la feuille retient le focus avant de le prendre, et le rend après avoir libéré la page (Échap, « Fermer », retour)", () => {
    const feuille = lire("components/simulation/Feuille.tsx");
    assert.match(feuille, /const rendreLeFocus = retenirLeFocus\(document\.activeElement as HTMLElement \| null\);\s*boite\.current\?\.focus\(\{ preventScroll: true \}\);/);
    assert.match(feuille, /window\.removeEventListener\("keydown", surTouche\);\s*liberer\(\);\s*rendreLeFocus\(\);/);
    // « Être rappelé » ouvre une Feuille : il en profite (le bouton qui l'ouvre reprend le focus).
    // Lot F7 : la feuille est dans `FeuilleRappel` (chargée au premier geste) ; le bouton la ferme par `onFermer`.
    assert.match(lire("components/accueil/FeuilleRappel.tsx"), /<Feuille\s+ouverte=\{ouverte\}\s+onFermer=\{onFermer\}/);
    assert.match(lire("components/accueil/FormulaireRappel.tsx"), /<FeuilleRappel depuis=\{depuis\} ouverte=\{ouverte\} onFermer=\{\(\) => setOuverte\(false\)\}/);
  });
});

describe("gabarit : le bouton collé s'efface pendant une saisie (accueil seulement)", () => {
  test("un champ où l'on tape : texte, téléphone, e-mail, zone de texte, liste, élément éditable", () => {
    for (const el of [{ tagName: "INPUT" }, { tagName: "INPUT", type: "tel" }, { tagName: "input", type: "email" }, { tagName: "INPUT", type: "number" }, { tagName: "TEXTAREA" }, { tagName: "SELECT" }, { tagName: "DIV", isContentEditable: true }]) assert.equal(estChampDeSaisie(el), true, JSON.stringify(el));
    for (const el of [null, undefined, { tagName: "BODY" }, { tagName: "A" }, { tagName: "BUTTON" }, { tagName: "INPUT", type: "checkbox" }, { tagName: "INPUT", type: "radio" }, { tagName: "INPUT", type: "submit" }, { tagName: "INPUT", type: "range" }, { tagName: "INPUT", type: "file" }]) assert.equal(estChampDeSaisie(el), false, JSON.stringify(el));
  });

  test("masqué pendant une saisie ou tant qu'une feuille est ouverte, visible sinon", () => {
    assert.equal(masquerPendantSaisie(false, { tagName: "BODY" }), false);
    assert.equal(masquerPendantSaisie(true, { tagName: "BODY" }), true);
    assert.equal(masquerPendantSaisie(false, { tagName: "INPUT", type: "tel" }), true);
  });

  test("les feuilles et les pleins écrans modaux posent l'attribut sur <html>, le bouton l'observe", () => {
    assert.equal(ATTRIBUT_FEUILLE_OUVERTE, "data-feuille-ouverte");
    const feuille = lire("components/simulation/Feuille.tsx");
    assert.match(feuille, /html\.setAttribute\(ATTRIBUT_FEUILLE_OUVERTE, ""\)/);
    assert.match(feuille, /restaurer = \(\) => \{\s*html\.removeAttribute\(ATTRIBUT_FEUILLE_OUVERTE\);/);
    const bouton = lire("components/simulation/BoutonColle.tsx");
    assert.match(bouton, /masquerSurSaisie = false/);
    assert.match(bouton, /addEventListener\("focusin", relire\)/);
    assert.match(bouton, /addEventListener\("focusout", relire\)/);
    assert.match(bouton, /attributeFilter: \[ATTRIBUT_FEUILLE_OUVERTE\]/);
    assert.match(bouton, /if \(cibleVisible \|\| enSaisie\) return null;/);
  });

  test("l'accueil le demande ; le bouton « Voir le résultat » de l'écran des matières ne change pas", () => {
    assert.match(lire("app/page.tsx"), /<BoutonColle mobileSeulement masquerSurSaisie cibles=\{CIBLES_BOUTON_COLLE\}>/);
    const matieres = lire("app/simulateur/_components/EcranMatieres.tsx");
    assert.match(matieres, /<BoutonColle>\s*<Bouton plein[^>]*>\s*Voir le résultat/);
    for (const f of ["app/simulateur/_components/EcranMatieres.tsx", "app/simulateur/_components/Simulateur.tsx"]) assert.doesNotMatch(lire(f), /masquerSurSaisie/, f);
  });
});
