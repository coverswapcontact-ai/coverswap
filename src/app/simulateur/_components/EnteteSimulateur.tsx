import EnteteSite from "@/components/EnteteSite";

/**
 * L'en-tête du simulateur (mission 15, partie 4) : le logo et un retour vers
 * l'accueil, rien d'autre — l'en-tête collant du site et son menu sont masqués
 * sur cette page (`HorsSimulateur`). Mission 16 : c'est la variante compacte
 * de l'en-tête du site (un seul composant, deux rendus) ; le lien du logo
 * porte le nom visible « CoverSwap ».
 */
export function EnteteSimulateur() {
  return <EnteteSite compact />;
}
