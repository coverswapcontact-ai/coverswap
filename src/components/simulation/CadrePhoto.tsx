import type { ReactNode } from "react";
import type { SourcesPhoto } from "@/lib/images-preparees";
import { Etiquette } from "./Etiquette";
import { ImagePreparee } from "./ImagePreparee";

/**
 * Le cadre d'une photo (le rendu de `Photo`), ses sources déjà résolues — site 3.0, lot F7. `Photo` lit le manifeste des
 * images (`sourcesPhoto`) puis rend ce cadre ; un composant envoyé au navigateur (les cartes de pièces du simulateur)
 * rend ce cadre directement avec des sources résolues par la page serveur, sans emporter le manifeste dans son
 * JavaScript. Même rendu dans les deux cas. Sans état.
 */
export type ProprietesCommunes = {
  alt: string;
  /** Rapport réservé (« 4 / 3 ») ; par défaut celui de l'image. */
  ratio?: string;
  /** L'image de l'ouverture, une seule par page : `loading="eager"` + `fetchpriority="high"`. */
  priorite?: boolean;
  /** Une image du premier écran qui n'est pas l'ouverture : `loading="eager"`, sans `fetchpriority`. Sinon `lazy`. */
  immediat?: boolean;
  /** L'attribut `sizes`. */
  tailles?: string;
  className?: string;
  /** « Démonstration » (mission 22) : l'affiche de la démo du simulateur. */
  etiquette?: "Ambiance" | "Simulation" | "Démonstration";
  /** Mission 19 : un calque posé sur l'image, dans son cadre (les étiquettes matière, `ambiances/CalqueMatieres`). */
  calque?: ReactNode;
  /** Cadre en `span` (bloc) au lieu d'un `div` : pour une photo posée dans un bouton ou un lien, qui n'admettent pas de `div`. */
  enLigne?: boolean;
};

export type ProprietesCadrePhoto = ProprietesCommunes &
  (
    | { /** Les sources d'une image du manifeste (`sourcesPhoto`) ; `null` : nom absent du manifeste. */ sources: SourcesPhoto | null; src?: never; largeur?: never; hauteur?: never }
    | { /** Image non préparée (servie telle quelle), ses dimensions réservées. */ src: string; largeur: number; hauteur: number; sources?: never }
    | { src: string; ratio: string; largeur?: number; hauteur?: number; sources?: never }
  );

/** Un nom absent du manifeste (image pas encore préparée) : le cadre garde une place visible. */
const RATIO_DE_REPLI = "4 / 3";

const TAILLES_PAR_DEFAUT = "(min-width: 1024px) 50vw, 100vw";

export function CadrePhoto({ sources = null, src, largeur, hauteur, alt, ratio, priorite = false, immediat = false, tailles = TAILLES_PAR_DEFAUT, className, etiquette, enLigne = false, calque }: ProprietesCadrePhoto) {
  const l = sources?.largeur ?? largeur;
  const h = sources?.hauteur ?? hauteur;
  const rapport = ratio ?? (l && h ? `${l} / ${h}` : sources || src ? undefined : RATIO_DE_REPLI);
  const chargement = { loading: priorite || immediat ? ("eager" as const) : ("lazy" as const), fetchPriority: priorite ? ("high" as const) : undefined, decoding: "async" as const };
  // Sans rapport connu (ne devrait pas arriver : le type l'exige), l'image reste dans le flux et donne sa hauteur.
  const classesImage = rapport ? "absolute inset-0 h-full w-full object-cover" : "block h-auto w-full";
  const Cadre = enLigne ? "span" : "div";

  return (
    <Cadre className={`relative ${enLigne ? "block " : ""}overflow-hidden bg-fond-2${className ? ` ${className}` : ""}`} style={rapport ? { aspectRatio: rapport } : undefined}>
      {sources ? (
        <ImagePreparee sources={sources} tailles={tailles} alt={alt} className={classesImage} {...chargement} />
      ) : src ? (
        // eslint-disable-next-line @next/next/no-img-element -- image pas encore préparée, servie telle quelle
        <img src={src} width={largeur} height={hauteur} alt={alt} className={classesImage} {...chargement} />
      ) : (
        <span {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })} className="absolute inset-0" />
      )}
      {calque}
      {/* Image décorative (`alt=""`) : son étiquette non plus n'est pas lue, sinon il resterait un mot isolé (« Ambiance »). */}
      {etiquette ? (
        <Etiquette className="absolute top-3 left-3" muette={!alt}>
          {etiquette}
        </Etiquette>
      ) : null}
    </Cadre>
  );
}
