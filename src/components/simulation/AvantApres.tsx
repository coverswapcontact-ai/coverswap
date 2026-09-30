"use client";

import { useCallback, useRef, useState, type ImgHTMLAttributes, type ReactNode } from "react";
import type { SourcesImage } from "@/lib/images-preparees";
import { Etiquette } from "./Etiquette";
import { ImagePreparee } from "./ImagePreparee";
import { PleinEcran } from "./PleinEcran";

/**
 * Avant / après sur la photo du visiteur (mission 15, partie 4 ; déplacé
 * depuis l'espace client, qui l'importe d'ici) : la simulation en plein
 * cadre au rapport de l'image, la photo d'origine par-dessus, découpée par
 * un curseur. Le curseur se glisse depuis sa POIGNÉE (`touch-action: none`
 * dessus seulement : ailleurs, la page défile normalement au doigt), à la
 * souris, au clavier (flèches, Début, Fin). « Comparer » alterne entre tout
 * avant et tout après ; « Plein écran » ouvre l'image à pincer.
 * `altAvant` (mission 16) : le texte de la photo « avant » quand ce n'est pas
 * celle du visiteur (une réalisation publiée).
 * `ratio` : le cadre est réservé à ce rapport et les DEUX images le
 * remplissent recadrées au centre (`object-cover`) ; le simulateur passe le
 * rapport réel de la photo (rien n'est coupé), une carte de réalisation un
 * rapport fixe (une photo d'un autre format est recadrée pareil avant et
 * après, jamais coupée en bas d'un seul côté). Sans `ratio`, l'image « après »
 * donne sa hauteur naturelle.
 * Les pastilles « Avant » / « Après » sont l'`Etiquette` commune.
 *
 * Mission 16 (partie 3), pour l'ouverture de l'accueil (rien ne change sans
 * ces options) :
 *  - `preparees` : les sources de chaque image (`ImagePreparee`) — images du
 *    dépôt en AVIF / WebP / JPEG (`sourcesPhoto`, `width` / `height`
 *    réservés), ou photos publiées par le CRM en WebP réduit
 *    (`sourcesPhotoCrm`) ; `<picture>` au lieu d'un `<img>` seul ; `apres` /
 *    `avant` restent les images du plein écran ;
 *  - `priorite` : l'image du premier écran (LCP) — « avant » en `eager` +
 *    `fetchpriority="high"`, « après » en `eager` ;
 *  - `outilsMobile="comparer"` : sous 768 px, seul « Comparer » reste (l'image
 *    occupe déjà l'écran) ;
 *  - `etiquette` : la pastille « Simulation » ou « Réalisation, <ville> » en bas
 *    à gauche de l'image (les pastilles « Avant » / « Après » sont en haut).
 */
export type ImagesPreparees = { avant?: SourcesImage | null; apres?: SourcesImage | null; /** L'attribut `sizes`. */ tailles: string };

type ProprietesImage = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "width" | "height"> & { src: string; alt: string; sources?: SourcesImage | null; tailles?: string };

/** Un `<img>` (la photo du visiteur, telle quelle), ou le `<picture>` commun (`ImagePreparee`) quand les sources sont connues. */
function ImageCadre({ src, sources, tailles, alt, ...props }: ProprietesImage) {
  if (!sources) {
    // eslint-disable-next-line @next/next/no-img-element -- image servie par le CRM, pas d'optimisation
    return <img src={src} alt={alt} {...props} />;
  }
  return <ImagePreparee sources={sources} tailles={tailles} alt={alt} {...props} />;
}

export function AvantApres({ apres, avant, alt, altAvant = "Votre pièce aujourd'hui", className, ratio, sansOutils = false, preparees, priorite = false, outilsMobile = "tous", etiquette }: { apres: string; avant: string | null; alt: string; altAvant?: string; className?: string; ratio?: string; sansOutils?: boolean; preparees?: ImagesPreparees; priorite?: boolean; outilsMobile?: "tous" | "comparer"; etiquette?: ReactNode }) {
  const [position, setPosition] = useState(50);
  const [glisse, setGlisse] = useState(false);
  const [pleinEcran, setPleinEcran] = useState(false);
  const boite = useRef<HTMLDivElement>(null);
  const reserve = ratio ? { aspectRatio: ratio } : undefined;
  // Avec un rapport réservé, l'image « après » remplit le cadre comme l'« avant » ; sinon elle le dimensionne.
  const classesApres = ratio ? "absolute inset-0 h-full w-full object-cover" : "block w-full";
  // L'« après » recouvre l'« avant » : c'est lui que Lighthouse retient comme LCP — priorité haute aussi.
  const chargementApres = priorite ? ({ loading: "eager", fetchPriority: "high" } as const) : ({ loading: "lazy" } as const);
  const chargementAvant = priorite ? ({ loading: "eager", fetchPriority: "high" } as const) : ({ loading: "lazy" } as const);
  const pastille = etiquette ? <Etiquette className="pointer-events-none absolute bottom-3 left-3">{etiquette}</Etiquette> : null;

  const suivre = useCallback((clientX: number) => {
    const rect = boite.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPosition(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const outils = sansOutils ? null : (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {avant ? (
        <button type="button" onClick={() => setPosition((p) => (p > 50 ? 0 : 100))} className="min-h-[44px] rounded-[var(--rayon-sm)] border border-trait bg-white px-4 text-[15px] font-medium text-encre transition-colors duration-[var(--duree-courte)] active:bg-fond-2">
          Comparer
        </button>
      ) : null}
      <button type="button" onClick={() => setPleinEcran(true)} className={`min-h-[44px] rounded-[var(--rayon-sm)] border border-trait bg-white px-4 text-[15px] font-medium text-encre transition-colors duration-[var(--duree-courte)] active:bg-fond-2${outilsMobile === "comparer" ? " max-md:hidden" : ""}`}>
        Plein écran
      </button>
      <PleinEcran ouvert={pleinEcran} onFermer={() => setPleinEcran(false)} apres={apres} avant={avant} alt={alt} />
    </div>
  );

  if (!avant) {
    return (
      <div className={className}>
        <div className="relative overflow-hidden rounded-[var(--rayon-md)] bg-fond-2" style={reserve}>
          <ImageCadre src={apres} sources={preparees?.apres} tailles={preparees?.tailles} alt={alt} className={classesApres} {...chargementApres} referrerPolicy="no-referrer" />
          {pastille}
        </div>
        {outils}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={boite}
        className="relative touch-pan-y overflow-hidden rounded-[var(--rayon-md)] bg-fond-2 select-none"
        style={reserve}
        onClick={(e) => {
          // Un toucher sur l'image place le curseur là ; le glissement se fait depuis la poignée.
          if (!glisse) suivre(e.clientX);
        }}
      >
        <ImageCadre src={apres} sources={preparees?.apres} tailles={preparees?.tailles} alt={alt} className={classesApres} draggable={false} {...chargementApres} referrerPolicy="no-referrer" />
        <ImageCadre
          src={avant}
          sources={preparees?.avant}
          tailles={preparees?.tailles}
          alt={altAvant}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)`, transition: glisse ? "none" : "clip-path var(--duree-moyenne) var(--ease)" }}
          draggable={false}
          {...chargementAvant}
          referrerPolicy="no-referrer"
        />
        <Etiquette ton="sombre" className="pointer-events-none absolute top-3 left-3">
          Avant
        </Etiquette>
        <Etiquette className="pointer-events-none absolute top-3 right-3">Après</Etiquette>
        {pastille}
        <div className="pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_4px_rgba(0,0,0,0.35)]" style={{ left: `${position}%`, transition: glisse ? "none" : "left var(--duree-moyenne) var(--ease)" }} />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Comparer avant et après"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-valuetext={position < 15 ? "Après" : position > 85 ? "Avant" : "Moitié avant, moitié après"}
          onPointerDown={(e) => {
            e.stopPropagation();
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            setGlisse(true);
            suivre(e.clientX);
          }}
          onPointerMove={(e) => {
            if (glisse) suivre(e.clientX);
          }}
          onPointerUp={() => setGlisse(false)}
          onPointerCancel={() => setGlisse(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 5));
            if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 5));
            if (e.key === "Home") setPosition(0);
            if (e.key === "End") setPosition(100);
          }}
          className="absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full bg-white text-encre shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
          style={{ left: `${position}%`, transition: glisse ? "none" : "left var(--duree-moyenne) var(--ease)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m9 18-6-6 6-6" />
            <path d="m15 6 6 6-6 6" />
          </svg>
        </div>
      </div>
      {outils}
    </div>
  );
}
