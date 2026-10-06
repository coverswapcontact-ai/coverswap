"use client";

import { lazy, Suspense, useState } from "react";
import { classesBouton, type VarianteBouton } from "@/components/simulation/Bouton";
import { creneauxRappel, type OptionRappel } from "@/lib/rappel";

/**
 * « Être rappelé » (site 3.0, lot B6) : le bouton SECONDAIRE de l'ouverture (et du dernier appel, en `sur-encre`), qui
 * ouvre une feuille (`FeuilleRappel` : prénom, téléphone, un créneau, le consentement, le captcha au premier geste).
 *
 * Lot F7 : ce composant n'est plus que le bouton. La feuille, son formulaire et le captcha (`Turnstile`) sont chargés au
 * premier geste vers le bouton — survol, focus, toucher, au plus tard le clic — et non plus avec la page : sur
 * l'accueil, une prestation, `/pro` et « Comment ça marche », leur JavaScript ne part plus au démarrage. Le rendu du
 * bouton ne change pas ; la feuille s'ouvre au clic comme avant (sur un réseau lent, le temps de recevoir son code).
 */
export const FORMULAIRE_RAPPEL = "coverswap.fr/rappel";

const chargerFeuille = () => import("./FeuilleRappel");
const FeuilleRappel = lazy(() => chargerFeuille().then((m) => ({ default: m.FeuilleRappel })));

export function FormulaireRappel({ depuis, variante = "secondaire", className }: { depuis: string; variante?: Extract<VarianteBouton, "secondaire" | "sur-encre">; className?: string }) {
  const [ouverte, setOuverte] = useState(false);
  // Demandée une fois, la feuille reste montée (fermée) : ses réponses et sa confirmation restent.
  const [demandee, setDemandee] = useState(false);
  const [options, setOptions] = useState<OptionRappel[]>([]);

  const ouvrir = () => {
    // Les créneaux se calculent à l'ouverture (jamais au rendu serveur : « ce soir » dépend de l'heure).
    setOptions(creneauxRappel(new Date()));
    setDemandee(true);
    setOuverte(true);
  };

  return (
    <>
      <button type="button" onClick={ouvrir} onPointerEnter={chargerFeuille} onFocus={chargerFeuille} onTouchStart={chargerFeuille} className={`${classesBouton(variante)}${className ? ` ${className}` : ""}`}>
        Être rappelé
      </button>
      {demandee ? (
        <Suspense fallback={null}>
          <FeuilleRappel depuis={depuis} ouverte={ouverte} onFermer={() => setOuverte(false)} options={options} />
        </Suspense>
      ) : null}
    </>
  );
}
