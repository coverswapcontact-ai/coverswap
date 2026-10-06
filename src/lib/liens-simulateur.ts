/**
 * Les liens vers le simulateur (site 3.0, lot B6) : UNE fonction pour toutes les adresses `/simulateur?…` que les
 * pages écrivent. Module pur (testé : `components/accueil/accueil.test.ts`).
 *
 *  - `projet` : la pièce (`cuisine`, `salle-de-bain`, `meubles`, `mur-plafond`, `professionnel`), présélectionnée à
 *    l'écran 1 ;
 *  - `ref` : une référence ou une composition (`zone:REF,…`, `lib/simulateur/matiere-demandee`), posée à l'écran 3 ;
 *  - `element` : un élément précis (`lib/simulateur/elements`) ; sa zone s'ouvre d'abord à l'écran 3 ;
 *  - `choix` : la pièce est CHOISIE (un picto de l'accueil) — le simulateur émet `PIECE_CHOISIE` dès l'arrivée et
 *    ouvre l'écran Photo (`decisionAuMontage`). Sans lui, rien ne change : la carte est seulement présélectionnée ;
 *  - `depuis` : le bouton qui amène (`lireDepuis` : minuscules, chiffres, tirets), repris dans `PIECE_CHOISIE`.
 */
export type ParametresSimulateur = { projet?: string; ref?: string; element?: string; choix?: boolean; depuis?: string };

export function lienSimuler({ projet, ref, element, choix = false, depuis }: ParametresSimulateur = {}): string {
  const parametres = [projet ? `projet=${projet}` : null, ref ? `ref=${ref}` : null, element ? `element=${element}` : null, choix && projet ? "choix=1" : null, depuis ? `depuis=${depuis}` : null].filter(Boolean);
  return `/simulateur${parametres.length ? `?${parametres.join("&")}` : ""}`;
}

/** Ajoute `depuis` à un lien du simulateur déjà écrit (une composition d'ambiance, `lienComposition`). */
export function avecDepuis(lien: string, depuis: string): string {
  return `${lien}${lien.includes("?") ? "&" : "?"}depuis=${depuis}`;
}
