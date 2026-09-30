"use client";

import { CartesPieces } from "@/components/simulation/CartesPieces";
import { PHOTOS_PIECES } from "@/lib/images-pieces";
import type { ZonesSimulateur } from "@/lib/simulateur/zones";

/**
 * L'écran 1 est le premier écran de /simulateur (rendu serveur) : les photos des trois premières cartes chargent tout
 * de suite (l'une d'elles est le LCP probable à 390 × 660 : une carte de ≈ 175 px de côté), les deux autres en `lazy`.
 */
const PHOTOS_IMMEDIATES = 3;

/**
 * Écran 1 — « Quelle pièce transformons-nous ? » : cinq cartes, la pièce choisie passe en couleur. Mission 16
 * (partie 2) : les photos d'ambiance des pièces (`lib/images-pieces`), le dessin tant qu'une image n'est pas préparée.
 */
export function EcranPiece({ zones, projet, onChoisir }: { zones: ZonesSimulateur; projet: string | null; onChoisir: (id: string) => void }) {
  return (
    <section aria-labelledby="etape-piece" className="space-y-5">
      <div>
        <h2 id="etape-piece" className="font-display text-[26px] leading-tight font-semibold tracking-tight text-balance">
          Quelle pièce transformons-nous ?
        </h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-encre-2">Choisissez, puis prenez une photo : le rendu se fait sur votre propre photo, sans inscription.</p>
      </div>
      <CartesPieces pieces={zones.pieces.map((p) => ({ id: p.id, libelle: p.libelle, description: p.zones.map((z) => z.libelle).join(", ") }))} valeur={projet} onChoisir={onChoisir} photosImmediates={PHOTOS_IMMEDIATES} photos={PHOTOS_PIECES} />
    </section>
  );
}
