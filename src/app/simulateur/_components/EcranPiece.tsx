"use client";

import { CartesPieces } from "@/components/simulation/CartesPieces";
import type { ZonesSimulateur } from "@/lib/simulateur/zones";

/** Écran 1 — « Quelle pièce transformons-nous ? » : cinq cartes, la pièce choisie passe en couleur. */
export function EcranPiece({ zones, projet, onChoisir }: { zones: ZonesSimulateur; projet: string | null; onChoisir: (id: string) => void }) {
  return (
    <section aria-labelledby="etape-piece" className="space-y-5">
      <div>
        <h2 id="etape-piece" className="font-display text-[26px] leading-tight font-semibold tracking-tight text-balance">
          Quelle pièce transformons-nous ?
        </h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-encre-2">Choisissez, puis prenez une photo : le rendu se fait sur votre propre photo, sans inscription.</p>
      </div>
      <CartesPieces pieces={zones.pieces.map((p) => ({ id: p.id, libelle: p.libelle, description: p.zones.map((z) => z.libelle).join(", ") }))} valeur={projet} onChoisir={onChoisir} />
    </section>
  );
}
