"use client";

import { lazy, Suspense, useState } from "react";
import { adresseVideo, type VideoSite } from "@/lib/videos";

/**
 * Le bouton qui ouvre une vidéo du site dans la visionneuse plein écran (mission 22, partie B) : « Voir en 15 s »,
 * « Voir en 30 s », « Voir le présentoir en 20 s », « Voir la démo · 20 s ». Rien d'autre ne part avec la page : le
 * plein écran (et son code) n'est chargé qu'au premier geste vers le bouton (survol, focus, au plus tard le clic,
 * comme « Plein écran » du curseur, lot F7), et le fichier vidéo n'est demandé qu'à l'ouverture, par le `<video>` du
 * plein écran (`PleinEcran video`). Aucun `<video>` dans la page tant qu'on n'a pas cliqué.
 *
 * Quatre dessins, tous à l'encre sur le papier (le rouge reste au bouton principal de la page) :
 *  - `bouton` : le bouton blanc des outils du curseur (« Comparer », « Plein écran »), 44 px ;
 *  - `sur-affiche` : posé sur l'affiche d'un cadre vidéo, tout le cadre est le bouton, la pastille blanche au centre ;
 *  - `pastille` : un petit bouton blanc en bas à droite d'une image (l'ouverture au téléphone), 44 px ;
 *  - `lien` : un lien de texte souligné (« Le présentoir », « Par où commencer ? », le simulateur au téléphone).
 */
export type FilmBouton = { video: VideoSite; /** L'affiche (JPEG préparé) : le `poster` du plein écran. */ affiche: string; libelle: string };

const chargerPleinEcran = () => import("./PleinEcran");
const PleinEcran = lazy(() => chargerPleinEcran().then((m) => ({ default: m.PleinEcran })));

const DESSINS = {
  bouton: "inline-flex min-h-[44px] items-center gap-2 rounded-[var(--rayon-sm)] border border-trait bg-white px-4 text-[15px] font-medium text-encre transition-colors duration-[var(--duree-courte)] active:bg-fond-2",
  "sur-affiche": "group absolute inset-0 flex items-center justify-center",
  pastille: "absolute right-3 bottom-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-[var(--rayon-sm)] bg-white/85 px-3 text-[13.5px] font-medium text-encre transition-colors duration-[var(--duree-courte)] active:bg-white",
  lien: "inline-flex min-h-[44px] items-center gap-2 text-[16px] font-medium text-encre underline underline-offset-4 transition-colors duration-[var(--duree-courte)] hover:text-encre-2",
};

export type DessinBoutonVideo = keyof typeof DESSINS;

function Lecture({ taille = 16 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function BoutonVideo({ video, affiche, libelle, variante = "bouton", className }: FilmBouton & { variante?: DessinBoutonVideo; className?: string }) {
  const [ouvert, setOuvert] = useState(false);
  const contenu = (
    <>
      <Lecture taille={variante === "pastille" ? 14 : 16} />
      {libelle}
    </>
  );
  return (
    <>
      <button
        type="button"
        aria-label={`${libelle} : ${video.titre}`}
        onClick={(e) => {
          // Posé sur le curseur avant / après : un clic n'y déplace pas le curseur.
          e.stopPropagation();
          setOuvert(true);
        }}
        onPointerEnter={chargerPleinEcran}
        onFocus={chargerPleinEcran}
        className={`${DESSINS[variante]}${className ? ` ${className}` : ""}`}
      >
        {variante === "sur-affiche" ? (
          <span className="inline-flex min-h-[48px] items-center gap-2 rounded-[var(--rayon-sm)] border border-trait bg-white px-5 text-[16px] font-medium text-encre shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-colors duration-[var(--duree-courte)] group-hover:bg-fond-2 group-active:bg-fond-2">
            {contenu}
          </span>
        ) : (
          contenu
        )}
      </button>
      {ouvert ? (
        <Suspense fallback={null}>
          <PleinEcran ouvert onFermer={() => setOuvert(false)} apres={affiche} avant={null} alt={video.titre} libelle={video.titre} modale video={{ src: adresseVideo(video) }} />
        </Suspense>
      ) : null}
    </>
  );
}
