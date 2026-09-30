"use client";

import { useEffect } from "react";
import { chargerCatalogue } from "@/components/simulation/FeuilleCatalogue";
import { appliquerMatiereDemandee } from "@/lib/simulateur/matiere-demandee";
import type { EtatSimulateur } from "@/lib/simulateur/reprise";
import type { PieceSimulateur } from "@/lib/simulateur/zones";

/**
 * Mission 16 (partie 4) : la matière demandée par `?ref=` est posée quand l'écran des matières s'affiche (`actif`),
 * une seule fois — la demande est oubliée ensuite, qu'elle ait été posée ou non (référence absente du catalogue).
 * Le catalogue n'est chargé qu'à ce moment-là, comme à l'ouverture de la feuille.
 */
export function useMatiereDemandee(actif: boolean, etat: Pick<EtatSimulateur, "refDemandee" | "selections">, piece: PieceSimulateur, mettreAJour: (maj: Partial<EtatSimulateur>) => void) {
  const { refDemandee, selections } = etat;
  useEffect(() => {
    if (!actif || !refDemandee) return;
    let annule = false;
    chargerCatalogue()
      .then((catalogue) => {
        if (annule) return;
        const t = catalogue.find((x) => x.id === refDemandee);
        const suivantes = t ? appliquerMatiereDemandee(selections, piece, { ref: t.id, nom: t.nom, famille: t.famille, finition: t.finition, categorie: t.categorie, tags: t.tags, image: t.image }) : null;
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
