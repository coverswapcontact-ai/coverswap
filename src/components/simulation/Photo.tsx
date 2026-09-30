import { sourcesPhoto } from "@/lib/images-manifeste";
import { Etiquette } from "./Etiquette";

/**
 * Une photo du site (mission 16) : `<picture>` AVIF + WebP + JPEG d'après le
 * manifeste (`src/lib/images-manifeste.ts`), `width` / `height` réservés,
 * `alt` obligatoire, `loading` / `fetchpriority` selon la priorité (une seule
 * image prioritaire par page : l'ouverture). La place est réservée par
 * `aspect-ratio` sur le fond `fond-2` tant que l'image n'est pas là.
 * Une image pas encore préparée passe par `src` + `largeur` / `hauteur` (ou
 * `ratio`) : le type l'exige, sinon le cadre n'aurait pas de hauteur.
 * `etiquette` : « Ambiance » (illustration) ou « Simulation » (rendu du
 * moteur) — jamais une image présentée comme un chantier. Composant serveur.
 */
type ProprietesCommunes = {
  alt: string;
  /** Rapport réservé (« 4 / 3 ») ; par défaut celui de l'image. */
  ratio?: string;
  priorite?: boolean;
  /** L'attribut `sizes`. */
  tailles?: string;
  className?: string;
  etiquette?: "Ambiance" | "Simulation";
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

export function Photo({ nom, src, largeur, hauteur, alt, ratio, priorite = false, tailles = TAILLES_PAR_DEFAUT, className, etiquette }: ProprietesPhoto) {
  const sources = nom ? sourcesPhoto(nom) : null;
  const l = sources?.largeur ?? largeur;
  const h = sources?.hauteur ?? hauteur;
  const rapport = ratio ?? (l && h ? `${l} / ${h}` : sources || src ? undefined : RATIO_DE_REPLI);
  const chargement = { loading: priorite ? ("eager" as const) : ("lazy" as const), fetchPriority: priorite ? ("high" as const) : undefined, decoding: "async" as const };
  // Sans rapport connu (ne devrait pas arriver : le type l'exige), l'image reste dans le flux et donne sa hauteur.
  const classesImage = rapport ? "absolute inset-0 h-full w-full object-cover" : "block h-auto w-full";

  return (
    <div className={`relative overflow-hidden bg-fond-2${className ? ` ${className}` : ""}`} style={rapport ? { aspectRatio: rapport } : undefined}>
      {sources ? (
        <picture>
          <source type="image/avif" srcSet={sources.avif} sizes={tailles} />
          <source type="image/webp" srcSet={sources.webp} sizes={tailles} />
          <img src={sources.src} srcSet={sources.jpg} sizes={tailles} width={sources.largeur} height={sources.hauteur} alt={alt} className={classesImage} {...chargement} />
        </picture>
      ) : src ? (
        // eslint-disable-next-line @next/next/no-img-element -- image pas encore préparée, servie telle quelle
        <img src={src} width={largeur} height={hauteur} alt={alt} className={classesImage} {...chargement} />
      ) : (
        <span {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })} className="absolute inset-0" />
      )}
      {etiquette ? <Etiquette className="absolute top-3 left-3">{etiquette}</Etiquette> : null}
    </div>
  );
}
