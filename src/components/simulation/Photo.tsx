import { sourcesPhoto } from "@/lib/images-preparees";
import { Etiquette } from "./Etiquette";
import { ImagePreparee } from "./ImagePreparee";

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
 */
type ProprietesCommunes = {
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
  etiquette?: "Ambiance" | "Simulation";
  /** Cadre en `span` (bloc) au lieu d'un `div` : pour une photo posée dans un bouton ou un lien, qui n'admettent pas de `div`. */
  enLigne?: boolean;
};

export type ProprietesPhoto = ProprietesCommunes &
  (
    | { /** Nom de l'image dans le manifeste. */ nom: string; src?: never; largeur?: never; hauteur?: never }
    | { /** Image non préparée (servie telle quelle), ses dimensions réservées. */ src: string; largeur: number; hauteur: number; nom?: never }
    | { src: string; ratio: string; largeur?: number; hauteur?: number; nom?: never }
  );

/** Un nom absent du manifeste (image pas encore préparée) : le cadre garde une place visible. */
const RATIO_DE_REPLI = "4 / 3";

const TAILLES_PAR_DEFAUT = "(min-width: 1024px) 50vw, 100vw";

export function Photo({ nom, src, largeur, hauteur, alt, ratio, priorite = false, immediat = false, tailles = TAILLES_PAR_DEFAUT, className, etiquette, enLigne = false }: ProprietesPhoto) {
  const sources = nom ? sourcesPhoto(nom) : null;
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
      {/* Image décorative (`alt=""`) : son étiquette non plus n'est pas lue, sinon il resterait un mot isolé (« Ambiance »). */}
      {etiquette ? (
        <Etiquette className="absolute top-3 left-3" muette={!alt}>
          {etiquette}
        </Etiquette>
      ) : null}
    </Cadre>
  );
}
