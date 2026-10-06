"use client";

import { PICTOS_ELEMENTS, Picto } from "@/components/espace/Illustrations";
import { CartesPieces } from "@/components/simulation/CartesPieces";
import { PHOTOS_PIECES } from "@/lib/images-pieces";
import { ELEMENTS, type IdElement } from "@/lib/simulateur/elements";
import type { ZonesSimulateur } from "@/lib/simulateur/zones";

/**
 * L'écran 1 est le premier écran de /simulateur (rendu serveur) : les photos des trois premières cartes chargent tout
 * de suite (l'une d'elles est le LCP probable à 390 × 660 : une carte de ≈ 175 px de côté), les deux autres en `lazy`.
 */
const PHOTOS_IMMEDIATES = 3;

/**
 * Écran 1 — « Quelle pièce transformons-nous ? » : cinq cartes, la pièce choisie passe en couleur. Mission 16
 * (partie 2) : les photos d'ambiance des pièces (`lib/images-pieces`), le picto tant qu'une image n'est pas préparée.
 *
 * Site 3.0, lot E2 : dessous, « Un élément précis ? » — les sept pictos des éléments (`lib/simulateur/elements`, ceux
 * de l'accueil), 64 px, libellé visible. Toucher un élément choisit sa pièce (`onChoisir(piece, element)`) et ouvre
 * d'abord sa zone à l'écran des matières ; la porte d'entrée et le réfrigérateur sont rattachés côté site (portes du
 * dressing, façades de cuisine). Des raccourcis : ils font avancer, sans état « choisi » à eux.
 */
export function EcranPiece({ zones, projet, onChoisir }: { zones: ZonesSimulateur; projet: string | null; onChoisir: (id: string, element?: IdElement) => void }) {
  // Un élément dont la pièce n'est plus publiée par le CRM n'est pas proposé.
  const elements = ELEMENTS.filter((e) => zones.pieces.some((p) => p.id === e.piece));
  return (
    <section aria-labelledby="etape-piece" className="space-y-5">
      <div>
        <h2 id="etape-piece" className="font-display text-[26px] leading-tight font-semibold tracking-tight text-balance">
          Quelle pièce transformons-nous ?
        </h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-encre-2">Choisissez, puis prenez une photo : le rendu se fait sur votre propre photo, sans inscription.</p>
      </div>
      <CartesPieces pieces={zones.pieces.map((p) => ({ id: p.id, libelle: p.libelle, description: p.zones.map((z) => z.libelle).join(", ") }))} valeur={projet} onChoisir={onChoisir} photosImmediates={PHOTOS_IMMEDIATES} photos={PHOTOS_PIECES} />
      {elements.length > 0 ? (
        <div className="pt-2">
          <h3 id="etape-element" className="text-[17px] font-semibold text-encre">
            Un élément précis ?
          </h3>
          <ul aria-labelledby="etape-element" className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-7 sm:gap-2">
            {elements.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onChoisir(e.piece, e.id)}
                  className="flex h-full min-h-[44px] w-full flex-col items-center gap-1.5 rounded-[var(--rayon-md)] border border-trait bg-white pt-2 pb-2.5 text-center transition-colors duration-[var(--duree-courte)] ease-[var(--ease)] hover:border-encre-2"
                >
                  <Picto nom={PICTOS_ELEMENTS[e.id]} className="h-16 w-16" />
                  <span className="text-[12px] leading-tight font-medium hyphens-auto [overflow-wrap:anywhere] text-encre sm:text-[13.5px]">{e.libelle}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
