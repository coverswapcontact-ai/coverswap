import { sourcesPhoto } from "@/lib/images-preparees";
import { CadrePhoto, type ProprietesCommunes } from "./CadrePhoto";

/**
 * Une photo du site (mission 16) : `<picture>` AVIF + WebP + JPEG d'après le
 * manifeste généré (`src/lib/images-manifeste.ts`, lu par `sourcesPhoto` de
 * `src/lib/images-preparees.ts`), `width` / `height` réservés,
 * `alt` obligatoire, `loading` / `fetchpriority` selon la priorité (une seule
 * image prioritaire par page : l'ouverture ; `immediat` pour les autres images
 * du premier écran : chargées tout de suite, sans passer devant l'ouverture —
 * une image du premier écran en `lazy` retarde le LCP). La place est réservée par
 * `aspect-ratio` sur le fond `fond-2` tant que l'image n'est pas là.
 * Une image pas encore préparée passe par `src` + `largeur` / `hauteur` (ou
 * `ratio`) : le type l'exige, sinon le cadre n'aurait pas de hauteur.
 * `etiquette` : « Ambiance » (illustration) ou « Simulation » (rendu du
 * moteur) — jamais une image présentée comme un chantier. Sans état : rendu
 * serveur, ou dans un composant client (les cartes de pièces, partie 2).
 * Lot F7 : le rendu est dans `CadrePhoto` (sources déjà résolues) ; ce composant-ci lit le manifeste.
 */
export type ProprietesPhoto = ProprietesCommunes &
  (
    | { /** Nom de l'image dans le manifeste. */ nom: string; src?: never; largeur?: never; hauteur?: never }
    | { /** Image non préparée (servie telle quelle), ses dimensions réservées. */ src: string; largeur: number; hauteur: number; nom?: never }
    | { src: string; ratio: string; largeur?: number; hauteur?: number; nom?: never }
  );

export function Photo(props: ProprietesPhoto) {
  if (props.nom !== undefined) {
    const { nom, ...reste } = props;
    return <CadrePhoto {...reste} sources={sourcesPhoto(nom)} />;
  }
  return <CadrePhoto {...props} />;
}
