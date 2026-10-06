"use client";

import { DessinFamille, PlanCuisine } from "@/components/espace/Illustrations";
import { PRECISION_ESTIMATION, texteEstimation, type Estimation as ValeurEstimation } from "@/lib/estimation";
import type { FormatPiece, IdFamilleTarifs } from "@/lib/tarifs-site";

/**
 * Les formes de cuisine qui ont leur plan (picto vu de dessus). Site 3.0, lot E2 : `parallele` (cuisine en couloir,
 * `plan-parallele`) ne s'affiche que si le CRM publie un format de ce nom ; aujourd'hui il publie `une-rangee`, `en-l`
 * et `ilot` (`modifier_tarifs` pour l'ajouter). Un format sans plan prend le picto de la famille.
 */
const FORMES_CUISINE = ["une-rangee", "en-l", "en-u", "ilot", "parallele"] as const;
type FormeCuisine = (typeof FORMES_CUISINE)[number];
const estForme = (id: string): id is FormeCuisine => (FORMES_CUISINE as readonly string[]).includes(id);

/**
 * L'estimation après le rendu (mission 16, partie 4) : « Quelle taille ? » en un geste — les formats du CRM (deux ou
 * trois, une colonne chacun) en boutons de 44 px au moins, le plan vu de dessus pour la cuisine (`PlanCuisine`), le picto de la pièce sinon — puis
 * « Estimation : 1 500 à 1 900 € » et la phrase fixe. Sans format (mobilier, pro, murs, CRM injoignable) : la
 * fourchette de la pièce ou « Prix sur devis », tout de suite. Le calcul est ailleurs (`lib/estimation`).
 */
export function Estimation({ famille, formats, format, onFormat, estimation }: { famille: IdFamilleTarifs | null; formats: FormatPiece[]; format: string | null; onFormat: (id: string) => void; estimation: ValeurEstimation | null }) {
  return (
    <section aria-labelledby="estimation-titre" className="space-y-3 border-t border-trait pt-5">
      <h3 id="estimation-titre" className="text-[17px] font-semibold text-encre">
        {formats.length > 0 ? "Quelle taille ?" : "Combien ça coûte ?"}
      </h3>
      {formats.length > 0 ? (
        // Autant de colonnes que de formats (la salle de bain n'en a que deux) : pas de case vide à droite.
        <div role="group" aria-label="Taille de la pièce" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${formats.length}, minmax(0, 1fr))` }}>
          {formats.map((f) => {
            const choisi = f.id === format;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={choisi}
                onClick={() => onFormat(f.id)}
                className={`flex min-h-[44px] flex-col items-center gap-1 rounded-[var(--rayon-sm)] border bg-white px-2 py-3 text-center transition-colors duration-[var(--duree-courte)] ${choisi ? "border-encre ring-1 ring-encre" : "border-trait hover:border-encre"}`}
              >
                {famille === "CUISINE" && estForme(f.id) ? <PlanCuisine forme={f.id} className="h-16 w-16" enSvg /> : <DessinFamille famille={famille ?? "CUISINE"} className="h-16 w-16" enSvg />}
                <span className="text-[15px] font-medium text-encre">{f.libelle}</span>
                <span className="text-[12.5px] leading-snug text-encre-2">{f.aide}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <p aria-live="polite" className={estimation ? "font-display text-[20px] font-semibold text-encre" : "text-[14.5px] text-encre-2"}>
        {estimation ? texteEstimation(estimation) : "Choisissez une taille : l'estimation s'affiche."}
      </p>
      <p className="text-[14px] text-encre-2">{PRECISION_ESTIMATION}</p>
    </section>
  );
}
