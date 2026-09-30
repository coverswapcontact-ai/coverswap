"use client";

import { useId } from "react";
import { ECRANS, type Ecran } from "@/lib/simulateur/ecrans";

/**
 * Le fil « Pièce · Photo · Matières · Résultat » (mission 15, partie 4) : l'étape
 * courante en encre, les étapes faites cliquables (retour arrière sans
 * perte), les étapes à venir en gris lisible (jamais effacées). Pendant une
 * génération, le fil DIT pourquoi rien ne bouge : la raison est écrite sous le
 * fil (lisible au toucher et par un lecteur d'écran, pas seulement un
 * `title`) et rattachée aux étapes verrouillées. Hauteur fixe : il ne fait
 * jamais sauter la page.
 */
export function FilEtapes({ courant, atteignable, onAller, verrou }: { courant: Ecran; atteignable: (e: Ecran) => boolean; onAller: (e: Ecran) => void; verrou?: string | null }) {
  const idVerrou = useId();
  return (
    <nav aria-label="Étapes de la simulation" className="min-h-[64px]">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[14px]">
        {ECRANS.map((e, i) => {
          const courante = e.numero === courant;
          const faite = e.numero < courant;
          const cliquable = !courante && atteignable(e.numero);
          return (
            <li key={e.numero} className="flex items-center">
              {i > 0 ? (
                <span aria-hidden className="mx-1 text-trait">
                  ·
                </span>
              ) : null}
              <button
                type="button"
                disabled={!cliquable}
                aria-describedby={!cliquable && verrou && faite ? idVerrou : undefined}
                aria-current={courante ? "step" : undefined}
                onClick={() => onAller(e.numero)}
                className={`min-h-[44px] rounded-[var(--rayon-sm)] px-1.5 transition-colors duration-[var(--duree-courte)] disabled:cursor-default ${courante ? "font-medium text-encre underline decoration-2 underline-offset-[6px]" : faite ? "font-medium text-encre-2 hover:text-encre" : "font-normal text-encre-2"}`}
              >
                {e.libelle}
                {faite ? <span className="sr-only"> (fait)</span> : null}
              </button>
            </li>
          );
        })}
      </ol>
      <p id={idVerrou} role="status" className="min-h-[20px] text-[13px] leading-[20px] text-encre-2">
        {verrou ?? ""}
      </p>
    </nav>
  );
}
