"use client";

import { useEffect } from "react";
import { chargerCatalogue } from "@/components/simulation/FeuilleCatalogue";
import { appliquerComposition, appliquerMatiereDemandee, lireComposition } from "@/lib/simulateur/matiere-demandee";
import type { EtatSimulateur, Selection } from "@/lib/simulateur/reprise";
import type { PieceSimulateur } from "@/lib/simulateur/zones";

/**
 * Mission 16 (partie 4) : la matière demandée par `?ref=` est posée quand l'écran des matières s'affiche (`actif`),
 * une seule fois — la demande est oubliée ensuite, qu'elle ait été posée ou non (référence absente du catalogue).
 * Le catalogue n'est chargé qu'à ce moment-là, comme à l'ouverture de la feuille.
 * Mission 19 : une composition (`?ref=zone:REF,…`, sous une photo d'ambiance) pose chaque référence sur sa zone.
 */
export function useMatiereDemandee(actif: boolean, etat: Pick<EtatSimulateur, "refDemandee" | "selections">, piece: PieceSimulateur, mettreAJour: (maj: Partial<EtatSimulateur>) => void) {
  const { refDemandee, selections } = etat;
  useEffect(() => {
    if (!actif || !refDemandee) return;
    let annule = false;
    chargerCatalogue()
      .then((catalogue) => {
        if (annule) return;
        const enSelection = (t: (typeof catalogue)[number]): Selection => ({
          ref: t.id,
          nom: t.nom,
          famille: t.famille,
          finition: t.finition,
          categorie: t.categorie,
          tags: t.tags,
          image: t.image,
        });
        const composition = lireComposition(refDemandee);
        let suivantes: EtatSimulateur["selections"] | null;
        if (composition) {
          const matieres = new Map(catalogue.filter((t) => composition.some((c) => c.ref === t.id)).map((t) => [t.id, enSelection(t)]));
          suivantes = appliquerComposition(selections, piece, composition, matieres);
        } else {
          const t = catalogue.find((x) => x.id === refDemandee);
          suivantes = t ? appliquerMatiereDemandee(selections, piece, enSelection(t)) : null;
        }
        mettreAJour({ refDemandee: null, ...(suivantes ? { selections: suivantes } : {}) });
      })
      .catch(() => undefined);
    return () => {
      annule = true;
    };
    // Une seule pose par demande : les sélections lues sont celles du moment où l'écran s'ouvre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif, refDemandee, piece.id]);
}
