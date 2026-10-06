import { IconeCoeur } from "@/components/espace/Illustrations";
import { cx } from "./Feuille";

/**
 * Les pièces communes aux deux catalogues Cover Styl' (mission 16, partie 5) : la feuille du simulateur et de
 * l'espace (`FeuilleCatalogue`) et la page Matières (`app/matieres/_components/Matieres`). Un seul dessin, deux
 * écrans ; la page n'embarque pas la feuille pour autant (ce module est léger).
 */

/** Le champ de recherche (16 px : pas de zoom automatique sur iPhone), la loupe à gauche ; la marge de droite est ajoutée par l'écran. */
export const CHAMP_RECHERCHE = "min-h-[48px] w-full rounded-[var(--rayon-sm)] border border-trait bg-white pl-11 text-[16px] text-encre placeholder:text-encre-2/70 focus:border-encre focus:outline-none";

/** Le cœur d'une tuile (cible de 44 px, pastille blanche de 32 px), posé en haut à droite de la vignette. */
export function BoutonFavori({ nom, favori, onBasculer, className }: { nom: string; favori: boolean; onBasculer: () => void; className?: string }) {
  return (
    <button type="button" aria-pressed={favori} aria-label={favori ? `Retirer ${nom} de mes favoris` : `Ajouter ${nom} à mes favoris`} onClick={onBasculer} className={cx("absolute top-0 right-0 flex h-11 w-11 items-center justify-center rounded-full", favori ? "text-encre" : "text-encre-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
        <IconeCoeur taille={18} plein={favori} />
      </span>
    </button>
  );
}
