import Link from "next/link";
import { Picto } from "@/components/espace/Illustrations";
import { photoDePiece, type PieceId } from "@/lib/images-pieces";
import { imagePreparee } from "@/lib/images-preparees";
import { pictoDeLaPiece } from "@/lib/simulateur/projets";
import { PastillesMatieres } from "@/components/ambiances/PastillesMatieres";
import { Etiquette } from "./Etiquette";
import { Photo } from "./Photo";

/**
 * Les cinq cartes « Quelle pièce transformons-nous ? » (mission 15, partie 4),
 * partagées par le simulateur, le module d'accueil et l'espace client. Une
 * carte = le dessin au trait fin de la pièce (`espace/Illustrations`), le
 * libellé et la description venus du CRM. Le dessin est en gris léger, et
 * passe en couleur avec le trait d'encre quand la carte est choisie. Jamais
 * un emoji. Hauteur fixe : les cartes ne font pas bouger la page. Des boutons
 * `aria-pressed` dans un groupe (pas un `radiogroup` : choisir une carte fait
 * avancer le parcours, les flèches n'auraient pas leur sens de radio).
 *
 * Mission 16 (partie 2) : `photos` (noms du manifeste, `lib/images-pieces`) —
 * si l'image d'une pièce est préparée, la carte la montre en carré, en
 * couleur, étiquetée « Ambiance » en bas à gauche (une illustration, jamais
 * une réalisation) ; sinon le dessin. INTÉRIM : les photos de réalisation des
 * cinq pièces restent à fournir. Sans `photos` (l'espace client) : les dessins.
 * `photosImmediates` : les N premières cartes chargent leur photo tout de suite
 * (`Photo immediat`) quand elles sont au premier écran de la page (le
 * simulateur : 3, le premier rang sur ordinateur, le premier et un peu du
 * second sur téléphone) ; les autres, et l'accueil (module sous l'ouverture),
 * en `lazy`.
 *
 * Site 3.0, lot C6 : sans photo, le pictogramme de la famille (`DessinFamille enSvg`, celui de l'espace client) au lieu
 * de l'ancien dessin au trait ; toujours un `<svg>` par carte, gris tant que la carte n'est pas choisie. Lot E2 : le picto
 * vient de la pièce (`pictoDeLaPiece`, `lib/simulateur/projets`), une seule table pour le simulateur et l'espace.
 *
 * Mission 19 : sur une photo, les pastilles des vraies matières de l'ambiance (`ambiances/PastillesMatieres`), en bas à
 * droite ; leurs noms au survol ou à l'appui.
 *
 * Mission 16 (partie 6) : sans état, donc sans « use client » — rendu serveur quand la page est serveur (les cartes
 * en liens de `/realisations` n'envoient aucun JavaScript), rendu dans le paquet client quand un composant client
 * l'importe (simulateur, module d'accueil, espace : inchangés). Un bouton sans `onChoisir` n'a pas de gestionnaire
 * (une fonction ne passe pas du serveur au navigateur).
 */
export type PieceCarte = { id: string; libelle: string; description: string };

/** L'attribut `sizes` d'une carte : deux colonnes sur téléphone, trois (≈ 240 px) à partir de 640 px. */
const TAILLES_CARTE = "(min-width: 640px) 240px, 45vw";

/**
 * Mission 16 (partie 5) : `liens` (pièce → adresse) fait de chaque carte un LIEN (`/realisations` mène aux pages par
 * pièce) au lieu d'un bouton de choix ; même dessin, même photo. Une pièce sans adresse garde son bouton.
 */
type ProprietesCartesPieces = { pieces: PieceCarte[]; nom?: string; photos?: Partial<Record<PieceId, string>>; photosImmediates?: number } & ({ valeur: string | null; onChoisir: (id: string) => void; liens?: undefined } | { liens: Partial<Record<string, string>>; valeur?: undefined; onChoisir?: undefined });

export function CartesPieces({ pieces, valeur = null, onChoisir, nom = "Pièce", photos, photosImmediates = 0, liens }: ProprietesCartesPieces) {
  return (
    <div role="group" aria-label={nom} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {pieces.map((p, rang) => {
        const choisie = valeur === p.id;
        const photo = photoDePiece(photos, p.id);
        const avecPhoto = photo !== null && imagePreparee(photo);
        const classes = `group flex min-h-[172px] flex-col items-stretch rounded-[var(--rayon-md)] border bg-white p-3 text-left transition-colors duration-[var(--duree-courte)] ease-[var(--ease)] ${choisie ? "border-encre ring-1 ring-encre" : "border-trait hover:border-encre-2"}`;
        const lien = liens && Object.prototype.hasOwnProperty.call(liens, p.id) ? liens[p.id] : undefined;
        const contenu = (
          <>
            {avecPhoto ? (
              <span className="relative block w-full overflow-hidden rounded-[var(--rayon-sm)]">
                <Photo nom={photo} alt="" ratio="1 / 1" tailles={TAILLES_CARTE} immediat={rang < photosImmediates} enLigne />
                <span aria-hidden="true">
                  <Etiquette className="absolute bottom-2 left-2">Ambiance</Etiquette>
                </span>
                <PastillesMatieres image={photo} />
              </span>
            ) : (
              <span className={`block aspect-[120/92] w-full overflow-hidden rounded-[var(--rayon-sm)] bg-fond transition-[filter,opacity] duration-[var(--duree-moyenne)] ease-[var(--ease)] ${choisie ? "" : "opacity-80 grayscale group-hover:opacity-100"}`}>
                <Picto nom={pictoDeLaPiece(p.id)} enSvg className="h-full w-full" />
              </span>
            )}
            <span className="mt-2 block text-[15.5px] leading-snug font-semibold text-encre">{p.libelle}</span>
            {/* Lot F6 : deux lignes réservées (2 × 1,375 em) : la carte garde sa hauteur quand Libre Franklin remplace la police de repli. */}
            <span className="mt-0.5 line-clamp-2 block min-h-[2.75em] text-[13px] leading-snug text-encre-2">{p.description}</span>
          </>
        );
        return lien ? (
          <Link key={p.id} href={lien} className={classes}>
            {contenu}
          </Link>
        ) : (
          <button key={p.id} type="button" aria-pressed={choisie} onClick={onChoisir ? () => onChoisir(p.id) : undefined} className={classes}>
            {contenu}
          </button>
        );
      })}
    </div>
  );
}
