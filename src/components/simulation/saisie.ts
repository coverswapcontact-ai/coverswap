/**
 * Site 3.0, lot B5 : quand le bouton collé de l'accueil (`BoutonColle masquerSurSaisie`) doit-il s'effacer ? Pendant
 * une saisie (le clavier du téléphone monte et le bouton viendrait se coller au-dessus, sur le champ ou le bouton
 * d'envoi), et tant qu'une feuille ou un panneau modal est ouvert. Logique pure, sans « use client » : testée par
 * `src/components/gabarit.test.ts`.
 */

/** L'attribut que `verrouillerLaPage()` (Feuille.tsx) pose sur `<html>` tant qu'une feuille ou un plein écran modal est ouvert. */
export const ATTRIBUT_FEUILLE_OUVERTE = "data-feuille-ouverte";

/** Les `<input>` qui ne sont pas une saisie : pas de clavier, rien à cacher. */
const TYPES_SANS_SAISIE = new Set(["button", "submit", "reset", "image", "checkbox", "radio", "range", "color", "file", "hidden"]);

/** Ce qu'il faut savoir de l'élément qui a le focus (un `Element` du DOM convient). */
export type ElementFocalise = { tagName: string; type?: string; isContentEditable?: boolean } | null | undefined;

/** Un champ où l'on tape : `<textarea>`, `<select>`, un `<input>` de texte (texte, téléphone, e-mail, nombre…), un élément éditable. */
export function estChampDeSaisie(el: ElementFocalise): boolean {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const balise = el.tagName.toUpperCase();
  if (balise === "TEXTAREA" || balise === "SELECT") return true;
  if (balise !== "INPUT") return false;
  return !TYPES_SANS_SAISIE.has((el.type || "text").toLowerCase());
}

/** Le bouton collé s'efface-t-il ? Oui pendant une saisie, ou tant qu'une feuille est ouverte. */
export function masquerPendantSaisie(feuilleOuverte: boolean, focus: ElementFocalise): boolean {
  return feuilleOuverte || estChampDeSaisie(focus);
}
