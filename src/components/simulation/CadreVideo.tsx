import type { SourcesPhoto } from "@/lib/images-preparees";
import { ratioVideo, type VideoSite } from "@/lib/videos";
import { BoutonVideo } from "./BoutonVideo";
import { CadrePhoto } from "./CadrePhoto";
import { VideoBoucle } from "./VideoBoucle";

/**
 * Le cadre d'une vidéo du site, ses sources déjà résolues (mission 22, partie B) — le pendant de `CadrePhoto` pour
 * `revue/Video` : l'affiche (AVIF préparé, étiquette d'honnêteté, place réservée au rapport du film, 16/9 ou 9/16),
 * puis selon le mode :
 *  - `clic` : tout le cadre est un bouton (« Voir en 30 s »…) qui ouvre le film dans la visionneuse plein écran
 *    (`BoutonVideo`) ; aucun `<video>` dans la page avant le clic ;
 *  - `boucle` : le film joue en boucle, muet, quand le cadre est à l'écran (`VideoBoucle`).
 * `cadre="telephone"` : un cadre de téléphone (bord d'encre arrondi) autour d'un film vertical (la démo du simulateur).
 * Sans état, sans « use client » : la page du simulateur le rend dans un composant client avec des sources résolues
 * par le serveur, sans emporter le manifeste des images.
 */
export type ProprietesCadreVideo = {
  video: VideoSite;
  /** Les sources de l'affiche (`sourcesPhoto`) ; `null` : pas encore préparée (le cadre garde sa place). */
  affiche: SourcesPhoto | null;
  mode: "clic" | "boucle";
  /** Le texte du bouton (« Voir en 30 s », « Lire »). */
  libelle: string;
  /** L'affiche est l'image prioritaire de la page (le LCP de `/comment-ca-marche`). */
  priorite?: boolean;
  immediat?: boolean;
  /** L'attribut `sizes` de l'affiche. */
  tailles?: string;
  className?: string;
  cadre?: "telephone";
};

export function CadreVideo({ video, affiche, mode, libelle, priorite = false, immediat = false, tailles, className, cadre }: ProprietesCadreVideo) {
  if (mode === "boucle") {
    return <VideoBoucle video={video} affiche={affiche} libelle={libelle} tailles={tailles} className={className} priorite={priorite} immediat={immediat} />;
  }
  const telephone = cadre === "telephone";
  return (
    <div className={`relative${telephone ? " rounded-[28px] border-[6px] border-encre bg-encre shadow-[0_8px_24px_rgba(0,0,0,0.18)]" : ""}${className ? ` ${className}` : ""}`}>
      <CadrePhoto sources={affiche} ratio={ratioVideo(video)} alt="" etiquette={video.etiquette} tailles={tailles} priorite={priorite} immediat={immediat} className={telephone ? "rounded-[22px]" : "rounded-[var(--rayon-md)]"} />
      <BoutonVideo video={video} affiche={affiche?.src ?? ""} libelle={libelle} variante="sur-affiche" />
    </div>
  );
}
