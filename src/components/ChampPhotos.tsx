"use client";

import type { Dispatch, SetStateAction } from "react";
import { FOCUS_FICHIER } from "@/components/simulation/Bouton";
import { MAX_PHOTOS, reduirePhotos } from "@/lib/photos-formulaire";

const ETIQUETTE = "mb-1 block text-[14px] font-medium text-encre";

/**
 * Les photos d'un formulaire (contact, /pro) : jusqu'à 4, choisies ou déposées sur la zone, réduites avant l'envoi
 * (`lib/photos-formulaire`), chacune retirable (bouton 44 px). Extrait de `DevisForm` (mission 16, partie 4) : le
 * formulaire pro a la même zone, rien n'est redessiné.
 */
export function ChampPhotos({
  photos,
  setPhotos,
  occupe,
  setOccupe,
  titre = "Photos du projet",
  precision = "(recommandé — accélère votre devis)",
}: {
  photos: string[];
  setPhotos: Dispatch<SetStateAction<string[]>>;
  occupe: boolean;
  setOccupe: (occupe: boolean) => void;
  titre?: string;
  precision?: string;
}) {
  async function ajouter(fichiers: File[]) {
    if (fichiers.length === 0 || occupe) return;
    setOccupe(true);
    try {
      const nouvelles = await reduirePhotos(fichiers, photos.length);
      if (nouvelles.length) setPhotos((avant) => [...avant, ...nouvelles].slice(0, MAX_PHOTOS));
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div>
      <p className={ETIQUETTE}>
        {titre} <span className="font-normal text-encre-2">{precision}</span>
      </p>

      {photos.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-[var(--rayon-sm)] border border-trait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((avant) => avant.filter((_, j) => j !== i))}
                aria-label={`Retirer la photo ${i + 1}`}
                className="absolute top-1 right-1 flex h-11 w-11 items-center justify-center rounded-full bg-encre/70 text-blanc transition-colors duration-[var(--duree-courte)] hover:bg-encre"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < MAX_PHOTOS && (
        <label
          // Une photo glissée sur la zone est ajoutée (sans cela, le navigateur l'ouvrirait et quitterait la page).
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void ajouter(Array.from(e.dataTransfer.files || []));
          }}
          className={`flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-[var(--rayon-sm)] border-2 border-dashed border-trait bg-fond transition-colors duration-[var(--duree-courte)] hover:border-encre ${FOCUS_FICHIER}`}
        >
          <svg className="mb-1 h-8 w-8 text-encre-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[14px] text-encre-2">{occupe ? "Traitement..." : `Ajoutez vos photos (jusqu'à ${MAX_PHOTOS})`}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              const champ = e.target;
              await ajouter(Array.from(champ.files || []));
              champ.value = ""; // permet de re-sélectionner le même fichier
            }}
            disabled={occupe}
            className="sr-only"
          />
        </label>
      )}
    </div>
  );
}
