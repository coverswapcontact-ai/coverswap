"use client";

import { useState } from "react";
import { creneauxRappel, type CreneauRappel } from "@/lib/rappel";

/**
 * « Être rappelé » (mission 16, partie 4), sous le formulaire : trois créneaux en boutons de 44 px, un seul choisi à
 * la fois, facultatif (un second toucher le retire). Libellés calculés en heure de Paris (`lib/rappel`) : « Lundi
 * 10 h » le week-end. Rien n'est envoyé au client : le CRM date le rappel, Lucas appelle.
 */
export function Rappel({ choisi, onChoisir }: { choisi: CreneauRappel | null; onChoisir: (creneau: CreneauRappel | null) => void }) {
  // Calculés une fois à l'affichage de l'écran (jamais rendu côté serveur : l'écran du résultat suit une génération).
  const [options] = useState(() => creneauxRappel(new Date()));
  return (
    <fieldset className="space-y-2">
      <legend className="text-[17px] font-semibold text-encre">Être rappelé</legend>
      <p className="text-[14px] text-encre-2">Facultatif : choisissez un moment, Lucas vous appelle.</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const actif = choisi === o.code;
          return (
            <button
              key={o.code}
              type="button"
              aria-pressed={actif}
              onClick={() => onChoisir(actif ? null : o.code)}
              className={`min-h-[44px] rounded-[var(--rayon-sm)] border px-4 text-[15px] font-medium transition-colors duration-[var(--duree-courte)] ${actif ? "border-encre bg-encre text-blanc" : "border-trait bg-white text-encre hover:border-encre"}`}
            >
              {o.libelle}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
