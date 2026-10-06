"use client";

import { PICTOS_ELEMENTS, Picto } from "@/components/espace/Illustrations";
import { BoutonVideo } from "@/components/simulation/BoutonVideo";
import { CadreVideo } from "@/components/simulation/CadreVideo";
import { CartesPieces } from "@/components/simulation/CartesPieces";
import type { PieceId } from "@/lib/images-pieces";
import type { SourcesPhoto } from "@/lib/images-preparees";
import type { PhotoCarte } from "@/lib/photos-cartes";
import { ELEMENTS, type IdElement } from "@/lib/simulateur/elements";
import type { ZonesSimulateur } from "@/lib/simulateur/zones";
import type { VideoSite } from "@/lib/videos";

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
 *
 * Mission 22 (partie B), `demo` : la démo du simulateur en vidéo (21 s, verticale), au clic — dans un cadre de
 * téléphone, colonne de droite dès 1 024 px (`CadreVideo`) ; au téléphone, un lien « Voir la démo · 20 s » sous les
 * cartes (`BoutonVideo`). L'affiche arrive résolue par la page (comme les photos des cartes) : ni manifeste ni vidéo
 * dans le JavaScript du simulateur, aucun octet de vidéo avant le clic.
 */
export type DemoSimulateur = { video: VideoSite; affiche: SourcesPhoto | null; libelle: string };
export function EcranPiece({ zones, projet, onChoisir, photos, demo }: { zones: ZonesSimulateur; projet: string | null; onChoisir: (id: string, element?: IdElement) => void; /** Les photos des cartes, résolues par la page (lot F7 : `photosDesCartes(PHOTOS_PIECES)`). */ photos?: Partial<Record<PieceId, PhotoCarte>>; demo?: DemoSimulateur }) {
  // Un élément dont la pièce n'est plus publiée par le CRM n'est pas proposé.
  const elements = ELEMENTS.filter((e) => zones.pieces.some((p) => p.id === e.piece));
  return (
    <section aria-labelledby="etape-piece" className={demo ? "lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:items-start lg:gap-8" : undefined}>
      <div className="space-y-5">
        <div>
          {/* Lot F6 : deux lignes réservées sous 640 px (2 × 1,25 em) : en Playfair le titre passe sur deux lignes à 412 px, en
              police de repli sur une ; la grille des pièces sautait de 32 px à l'arrivée de la police (CLS 0,027 mesuré). */}
          <h2 id="etape-piece" className="font-display text-[26px] leading-tight font-semibold tracking-tight text-balance max-sm:min-h-[2.5em]">
            Quelle pièce transformons-nous ?
          </h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-encre-2">Choisissez, puis prenez une photo : le rendu se fait sur votre propre photo, sans inscription.</p>
        </div>
        <CartesPieces pieces={zones.pieces.map((p) => ({ id: p.id, libelle: p.libelle, description: p.zones.map((z) => z.libelle).join(", ") }))} valeur={projet} onChoisir={onChoisir} photosImmediates={PHOTOS_IMMEDIATES} photos={photos} />
        {demo ? (
          <div className="lg:hidden">
            <BoutonVideo video={demo.video} affiche={demo.affiche?.src ?? ""} libelle={demo.libelle} variante="lien" />
          </div>
        ) : null}
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
      </div>
      {demo ? (
        <div className="hidden lg:block">
          <CadreVideo video={demo.video} affiche={demo.affiche} mode="clic" libelle={demo.libelle} tailles="200px" cadre="telephone" />
        </div>
      ) : null}
    </section>
  );
}
