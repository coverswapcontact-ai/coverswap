"use client";

import { useRef, useState } from "react";
import { Bouton, FOCUS_FICHIER, TEINTE_PRINCIPALE } from "@/components/simulation/Bouton";
import { CuisineDeFace } from "@/components/espace/Illustrations";
import type { ProjectType } from "@/lib/simulateur/projets";

/**
 * Écran 2 — la photo : « Prendre une photo » (appareil, `capture`) et « Choisir
 * dans mes photos » (galerie, sans `capture`) de même rang, glisser-déposer
 * sur ordinateur, trois conseils avec un schéma en trait, 25 Mo. Une photo
 * déjà en mémoire (retour arrière) reste visible avec « Garder cette photo ».
 */
const TRAIT = "#1A1A1A";

function SchemaDeFace() {
  return (
    <svg viewBox="0 0 120 92" className="h-full w-full" aria-hidden fill="none" strokeLinejoin="round" strokeLinecap="round">
      <rect x="18" y="14" width="84" height="56" rx="2" fill="#F7F6F3" stroke={TRAIT} strokeWidth="1.1" />
      <rect x="26" y="22" width="68" height="40" rx="1" fill="#ECEAE5" stroke="#CFCBC4" strokeWidth="0.9" />
      <circle cx="60" cy="84" r="4" fill="#FFFFFF" stroke={TRAIT} strokeWidth="1.1" />
      <path d="M60 80 v-6" stroke={TRAIT} strokeWidth="1.1" />
      <path d="M56 76 l4 -4 l4 4" stroke={TRAIT} strokeWidth="1.1" />
    </svg>
  );
}

function SchemaLumiere() {
  return (
    <svg viewBox="0 0 120 92" className="h-full w-full" aria-hidden fill="none" strokeLinejoin="round" strokeLinecap="round">
      <rect x="14" y="14" width="40" height="52" rx="1.5" fill="#F7F6F3" stroke={TRAIT} strokeWidth="1.1" />
      <path d="M34 14 v52 M14 40 h40" stroke="#CFCBC4" strokeWidth="0.9" />
      <circle cx="90" cy="30" r="9" fill="#FFFFFF" stroke={TRAIT} strokeWidth="1.1" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1={90 + Math.cos((a * Math.PI) / 180) * 13} y1={30 + Math.sin((a * Math.PI) / 180) * 13} x2={90 + Math.cos((a * Math.PI) / 180) * 17} y2={30 + Math.sin((a * Math.PI) / 180) * 17} stroke={TRAIT} strokeWidth="1.1" />
      ))}
      <path d="M64 60 h44" stroke="#9C978F" strokeWidth="1" />
      <path d="M70 54 l6 6 l-6 6" stroke="#9C978F" strokeWidth="1" />
    </svg>
  );
}

const CONSEILS = [
  { titre: "De face", texte: "Placez-vous face à la surface, sans pencher le téléphone.", schema: <SchemaDeFace /> },
  { titre: "Toute la zone visible", texte: "Meubles, plan, crédence : tout ce qui recevra le film doit être dans le cadre.", schema: <CuisineDeFace cadre="ensemble" className="h-full w-full" /> },
  { titre: "Lumière du jour", texte: "Volets ouverts, lumière allumée, sans contre-jour.", schema: <SchemaLumiere /> },
];

const ENTREE = "sr-only";
/** Contour à l'encre : « Choisir dans mes photos », et « Reprendre une photo » quand « Garder cette photo » est l'action principale (un seul rouge par écran). */
const CONTOUR_FICHIER = "border border-encre bg-white text-encre hover:bg-fond-2";
const BOUTON_FICHIER = `flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[var(--rayon-sm)] text-[16px] font-medium transition-colors duration-[var(--duree-courte)] ease-[var(--ease)] ${FOCUS_FICHIER}`;

export function EcranPhoto({ projet, photo, rapport, occupe, onFichier, onGarder }: { projet: ProjectType; photo: string | null; /** `aspect-ratio` de la photo en mémoire, null si inconnu. */ rapport: string | null; occupe: boolean; onFichier: (file: File) => void; onGarder: () => void }) {
  const [survol, setSurvol] = useState(false);
  const appareil = useRef<HTMLInputElement>(null);
  const galerie = useRef<HTMLInputElement>(null);
  const prendre = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFichier(f);
    e.target.value = "";
  };
  return (
    <section
      aria-labelledby="etape-photo"
      className="space-y-5"
      onDragOver={(e) => {
        e.preventDefault();
        setSurvol(true);
      }}
      onDragLeave={() => setSurvol(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSurvol(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFichier(f);
      }}
    >
      <div>
        <h2 id="etape-photo" className="font-display text-[26px] leading-tight font-semibold tracking-tight text-balance">
          {projet.uploadHint}
        </h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-encre-2">{projet.uploadTip}. Vos coordonnées ne sont pas demandées à cette étape.</p>
      </div>

      {photo ? (
        <div className="overflow-hidden rounded-[var(--rayon-md)] border border-trait bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- photo du visiteur (mémoire locale) */}
          <img src={photo} alt="Votre photo actuelle" className="mx-auto block max-h-[46vh] w-full object-contain bg-fond-2" style={rapport ? { aspectRatio: rapport } : undefined} />
          <div className="p-3">
            <Bouton plein onClick={onGarder}>
              Garder cette photo
            </Bouton>
          </div>
        </div>
      ) : null}

      <div className={`rounded-[var(--rayon-md)] border-2 border-dashed p-3 transition-colors duration-[var(--duree-courte)] sm:p-4 ${survol ? "border-encre bg-white" : "border-trait"}`} aria-busy={occupe}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`${BOUTON_FICHIER} ${photo ? CONTOUR_FICHIER : TEINTE_PRINCIPALE} ${occupe ? "pointer-events-none opacity-60" : ""}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            {occupe ? "Préparation de la photo…" : photo ? "Reprendre une photo" : "Prendre une photo"}
            <input ref={appareil} type="file" accept="image/*" capture="environment" className={ENTREE} disabled={occupe} onChange={prendre} />
          </label>
          <label className={`${BOUTON_FICHIER} ${CONTOUR_FICHIER} ${occupe ? "pointer-events-none opacity-60" : ""}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
            </svg>
            Choisir dans mes photos
            <input ref={galerie} type="file" accept="image/*,.heic,.heif" className={ENTREE} disabled={occupe} onChange={prendre} />
          </label>
        </div>
        <p className="mt-3 text-center text-[13.5px] text-encre-2">
          JPEG, PNG ou HEIC, 25 Mo au plus. <span className="hidden sm:inline">Ou glissez votre photo ici.</span> La photo est réduite avant l&apos;envoi.
        </p>
      </div>

      <ul className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Trois conseils pour la photo">
        {CONSEILS.map((c) => (
          <li key={c.titre} className="rounded-[var(--rayon-sm)] border border-trait bg-white p-2 sm:p-3">
            <span className="block aspect-[120/92] w-full overflow-hidden rounded-[4px] bg-fond">{c.schema}</span>
            <span className="mt-2 block text-[14px] leading-snug font-semibold text-encre">{c.titre}</span>
            <span className="mt-0.5 block text-[12.5px] leading-snug text-encre-2">{c.texte}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
