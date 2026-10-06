"use client";

import { useState } from "react";
import type { ProprietesFeuilleCatalogue, Teinte } from "@/components/simulation/FeuilleCatalogue";
import { urlEchantillon, urlVignette } from "@/lib/simulateur/generation-client";
import type { EtatSimulateur } from "@/lib/simulateur/stockage";
import { composantesDe, type PieceSimulateur } from "@/lib/simulateur/zones";
import { useFavoris } from "./useFavoris";

type Selections = EtatSimulateur["selections"];

/**
 * Le branchement de la feuille des matières de l'écran 3 (site 3.0, lot E1 : sorti de `Simulateur.tsx`, sans changer
 * le comportement) : la zone ouverte, le focus rendu à « Modifier » après un choix (sans défilement), les favoris,
 * le choix d'une teinte (sur la zone et sur celles cochées « aussi », les zones incompatibles vidées), le retrait.
 * `surChoix` reçoit les zones qui viennent d'être choisies (le simulateur y efface un refus du CRM).
 * `feuille` : les propriétés de `FeuilleCatalogue` quand une zone est ouverte, sinon null.
 */
export function useFeuilleCatalogue(piece: PieceSimulateur, selections: Selections, mettreAJour: (maj: Partial<EtatSimulateur>) => void, surChoix: (zones: string[]) => void) {
  const [zoneOuverte, setZoneOuverte] = useState<string | null>(null);
  const [focusZone, setFocusZone] = useState<string | null>(null);
  const { favoris, charger: chargerFavoris, basculer: basculerFavori } = useFavoris();

  const choisirTeinte = (zoneId: string, teinte: Teinte, aussi: string[]) => {
    const suivantes: Selections = { ...selections };
    for (const id of [zoneId, ...aussi]) {
      suivantes[id] = { ref: teinte.id, nom: teinte.nom, famille: teinte.famille, finition: teinte.finition, categorie: teinte.categorie, tags: teinte.tags, image: teinte.image };
      // « Façades (toutes) » et « Meubles hauts / bas » couvrent les mêmes meubles : le dernier choix l'emporte.
      for (const autre of piece.zones.find((z) => z.id === id)?.exclut ?? []) suivantes[autre] = null;
    }
    mettreAJour({ selections: suivantes });
    surChoix([zoneId, ...aussi]);
    setZoneOuverte(null);
    setFocusZone(null);
    // Le focus revient sur « Modifier » de la zone, sans défilement (posé après la fermeture de la feuille).
    window.setTimeout(() => setFocusZone(zoneId), 0);
  };
  const retirer = (zoneId: string) => mettreAJour({ selections: { ...selections, [zoneId]: null } });

  const zone = zoneOuverte ? piece.zones.find((z) => z.id === zoneOuverte) ?? null : null;
  const feuille: ProprietesFeuilleCatalogue | null = zone
    ? {
        ouverte: true,
        onFermer: () => setZoneOuverte(null),
        zone: { id: zone.id, libelle: zone.libelle },
        autresZones: piece.zones.filter((z) => z.id !== zone.id && !zone.exclut.includes(z.id) && !z.exclut.includes(zone.id) && !composantesDe(piece, zone.id).includes(z.id)).map((z) => ({ id: z.id, libelle: z.libelle })),
        choisie: selections[zone.id]?.ref ?? null,
        favoris,
        onFavori: basculerFavori,
        onChoisir: (teinte, aussi) => choisirTeinte(zone.id, teinte, aussi),
        urlVignette,
        urlEchantillon,
      }
    : null;

  return { zoneOuverte, setZoneOuverte, focusZone, retirer, chargerFavoris, feuille };
}
