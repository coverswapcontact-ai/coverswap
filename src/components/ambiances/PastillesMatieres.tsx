import { AMBIANCES } from "@/data/ambiances";
import { Pastilles } from "./Pastilles";

/**
 * Les matières d'une petite carte (mission 19, cartes de pièces) : pas de trait, une rangée de pastilles rondes de la
 * vraie matière qui se chevauchent dans le coin haut droit de la photo (l'étiquette « Ambiance » est en bas) ; les noms apparaissent au survol, au focus, ou tant que
 * le doigt appuie sur la carte (`group-active`). La carte est déjà un bouton ou un lien : les pastilles ne sont pas
 * interactives elles-mêmes, et restent muettes pour les lecteurs d'écran (la photo de la carte est décorative).
 * Lit `data/ambiances` (pas le catalogue) ; le rendu est `Pastilles` (lot F7 : le simulateur lui passe des matières déjà
 * résolues par sa page, `lib/photos-cartes`, sans emporter les ambiances). Sans état.
 * Lot F7 (`Pastilles`) : `fetchPriority="low"` — des pastilles de 22 px ne passent jamais devant la photo de la carte (sans cette
 * mention, le navigateur hisse en priorité haute toute image visible : huit vignettes de 320 px, ≈ 80 Ko, au
 * premier écran du simulateur).
 */
export function matieresDeLImage(nom: string) {
  return AMBIANCES.find((a) => a.image === nom)?.surfaces ?? [];
}

export function PastillesMatieres({ image, className }: { image: string; className?: string }) {
  return <Pastilles matieres={matieresDeLImage(image)} className={className} />;
}
