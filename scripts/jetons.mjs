/**
 * Les jetons du site, lus dans leur seule source : le bloc `@theme` de
 * `src/app/globals.css` (site 3.0, lot B1). Aucun fichier de jetons en double :
 * les composants passent par les classes Tailwind ou `var(--color-*)`, et les
 * scripts qui écrivent des images (`generate-assets.mjs`, `preparer-images.mjs`)
 * lisent les couleurs ici.
 *
 *   import { lireJetons, versRgb, contraste } from "./jetons.mjs";
 *   const { fond, encre, accent } = lireJetons();   // "#F4EDE2", …
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const FICHIER_THEME = path.join(RACINE, "src", "app", "globals.css");

/**
 * Les couleurs du bloc `@theme`, sans le préfixe `--color-` : `{ fond: "#F4EDE2", "encre-2": "#6E5F52", … }`.
 * Seules les valeurs hexadécimales sont rendues (une couleur écrite autrement ne sert pas aux images).
 * @param {string} [css] le contenu de globals.css (lu sur le disque par défaut)
 * @returns {Record<string, string>}
 */
export function lireJetons(css = readFileSync(FICHIER_THEME, "utf8")) {
  const bloc = css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1];
  if (!bloc) throw new Error("globals.css : bloc @theme introuvable");
  /** @type {Record<string, string>} */
  const jetons = {};
  for (const [, nom, valeur] of bloc.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) jetons[nom] = valeur.toUpperCase();
  return jetons;
}

/**
 * « #F4EDE2 » → { r: 244, g: 237, b: 226 }.
 * @param {string} hex
 */
export function versRgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`couleur illisible : ${hex}`);
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Luminance relative (WCAG 2.x). @param {string} hex */
export function luminance(hex) {
  const { r, g, b } = versRgb(hex);
  const lin = (/** @type {number} */ c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Le rapport de contraste WCAG entre deux couleurs, arrondi au centième (4,5 pour du texte courant).
 * @param {string} a
 * @param {string} b
 */
export function contraste(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
}
