"use client";

import { useEffect, useRef } from "react";
import { Bouton, FOCUS_FICHIER } from "@/components/simulation/Bouton";
import { CartesPieces } from "@/components/simulation/CartesPieces";
import { TuileFilm } from "@/components/simulation/TuileFilm";
import { idDePiece, zonesOrdonnees, type ChoixCreation } from "@/lib/espace/creation";
import { MESSAGE_ANALYSE_SAUTEE, TITRES_VERDICT, zoneNonVisible, type EtatAnalyse } from "@/lib/simulateur/reprise";
import type { Piece } from "./api";
import { IconeCoche } from "./Illustrations";
import { cx } from "./ui";

/**
 * Les trois écrans de « Créer une simulation » dans l'espace (mission 15,
 * partie 5) — les mêmes composants que le simulateur du site : les cartes des
 * pièces (`CartesPieces`, dessins au trait, murs compris), la photo (celles du
 * dossier OU une nouvelle par les deux boutons), les matières en rangées avec
 * la photo en haut, l'analyse (zones non visibles grisées, conseil de qualité)
 * et le bouton collé « Lancer ma simulation » avec le quota lisible. Aucun
 * appel réseau ici : tout passe par les fonctions reçues.
 */

const TITRE = "font-display text-[24px] leading-tight font-semibold tracking-tight text-balance text-encre";
const SOUS_TITRE = "mt-1.5 text-[15px] leading-relaxed text-encre-2";

export function EcranPieceEspace({ pieces, valeur, onChoisir }: { pieces: Piece[]; valeur: string | null; onChoisir: (piece: string) => void }) {
  const cartes = pieces.map((p) => ({ id: idDePiece(p), libelle: p.libelle, description: p.duProjet ? `Votre projet · ${p.aide || p.zones.map((z) => z.libelle).join(", ")}` : p.aide || p.zones.map((z) => z.libelle).join(", ") }));
  const choisie = pieces.find((p) => p.piece === valeur);
  return (
    <section aria-labelledby="creation-piece" className="space-y-5">
      <div>
        <h2 id="creation-piece" className={TITRE}>
          Quelle pièce transformons-nous ?
        </h2>
        <p className={SOUS_TITRE}>Choisissez, puis la photo : le rendu se fait sur votre propre photo, avec le même moteur que sur coverswap.fr.</p>
      </div>
      <CartesPieces pieces={cartes} valeur={choisie ? idDePiece(choisie) : null} onChoisir={(id) => onChoisir(pieces.find((p) => idDePiece(p) === id)?.piece ?? pieces[0].piece)} />
    </section>
  );
}

const BOUTON_FICHIER = `flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[var(--rayon-sm)] text-[16px] font-medium transition-colors duration-[var(--duree-courte)] ease-[var(--ease)] ${FOCUS_FICHIER}`;

export function EcranPhotoEspace({ photos, photoId, urlPhoto, envoi, apercu, onApercu, onChoisirPhoto, onFichier, onGarder }: { photos: { id: string }[]; photoId: string | null; urlPhoto: (id: string) => string; /** Part de l'envoi en cours (0 à 1), null sinon. */ envoi: number | null; apercu: boolean; /** Aperçu depuis le CRM : chaque geste le dit (« rien n'est enregistré »), aucun bouton muet. */ onApercu: () => void; onChoisirPhoto: (id: string) => void; onFichier: (file: File) => void; onGarder: () => void }) {
  const prendre = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFichier(f);
    e.target.value = "";
  };
  const occupe = envoi !== null;
  // En aperçu, le sélecteur de fichier ne s'ouvre pas : le message remplace le geste.
  const toucher = (e: React.MouseEvent<HTMLLabelElement>) => {
    if (!apercu) return;
    e.preventDefault();
    onApercu();
  };
  return (
    <section aria-labelledby="creation-photo" className="space-y-5" aria-busy={occupe}>
      <div>
        <h2 id="creation-photo" className={TITRE}>
          Sur quelle photo ?
        </h2>
        <p className={SOUS_TITRE}>Une photo déjà dans votre espace, ou une nouvelle. De face, en plein jour, toute la pièce dans l&apos;image : la simulation n&apos;en sera que plus juste.</p>
      </div>

      {photoId ? (
        <Bouton plein onClick={onGarder}>
          Garder cette photo
        </Bouton>
      ) : null}

      {photos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2" aria-label="Les photos de votre espace">
          {photos.map((p) => {
            const choisie = photoId === p.id;
            return (
              <li key={p.id}>
                <button type="button" onClick={() => onChoisirPhoto(p.id)} aria-pressed={choisie} aria-label={choisie ? "Photo choisie" : "Choisir cette photo"} className={cx("relative block aspect-square w-full overflow-hidden rounded-[var(--rayon-sm)] bg-fond-2 transition-[opacity] duration-[var(--duree-courte)]", choisie ? "ring-2 ring-encre ring-offset-2 ring-offset-fond" : "ring-1 ring-encre/10", !choisie && photoId && "opacity-70")}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- photo privée servie par le CRM */}
                  <img src={urlPhoto(p.id)} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                  {choisie ? (
                    <span className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-encre text-blanc">
                      <IconeCoche />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="rounded-[var(--rayon-md)] border-2 border-dashed border-trait p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label onClick={toucher} className={`${BOUTON_FICHIER} bg-encre text-blanc hover:bg-encre-survol ${occupe ? "pointer-events-none opacity-60" : ""}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            {envoi !== null ? `Envoi… ${Math.round(envoi * 100)} %` : "Prendre une photo"}
            <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={occupe} onChange={prendre} />
          </label>
          <label onClick={toucher} className={`${BOUTON_FICHIER} border border-encre bg-blanc text-encre hover:bg-fond-2 ${occupe ? "pointer-events-none opacity-60" : ""}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
            </svg>
            Choisir dans mes photos
            <input type="file" accept="image/*,.heic,.heif" className="sr-only" disabled={occupe} onChange={prendre} />
          </label>
        </div>
        <p className="mt-3 text-center text-[13.5px] text-encre-2">La photo rejoint votre espace : CoverSwap la voit aussi. Elle est réduite avant l&apos;envoi.</p>
      </div>
    </section>
  );
}

type PropsMatieres = {
  piece: Piece;
  choix: ChoixCreation;
  photo: string;
  analyse: EtatAnalyse | null;
  conseilIgnore: boolean;
  onIgnorerConseil: () => void;
  onReprendrePhoto: () => void;
  onOuvrir: (zone: string) => void;
  onRetirer: (zone: string) => void;
  /** La zone dont le bouton doit reprendre le focus (après un choix), sans défilement. */
  focusZone: string | null;
  urlVignette: (ref: string) => string;
  zonesMax: number;
  raisonBloque: string | null;
  occupe: boolean;
  onLancer: () => void;
  /** « Il vous en reste 3 sur 5 », sous le bouton collé. */
  texteQuota: string;
};

export function EcranMatieresEspace({ piece, choix, photo, analyse, conseilIgnore, onIgnorerConseil, onReprendrePhoto, onOuvrir, onRetirer, focusZone, urlVignette, zonesMax, raisonBloque, occupe, onLancer, texteQuota }: PropsMatieres) {
  const boutons = useRef(new Map<string, HTMLButtonElement>());
  useEffect(() => {
    // Le seul focus programmé : le bouton de la zone qui vient d'être choisie, SANS défilement.
    if (focusZone) boutons.current.get(focusZone)?.focus({ preventScroll: true });
  }, [focusZone]);
  const zones = zonesOrdonnees(piece);
  const choisies = zones.filter((z) => choix.teintes[z.zone]);
  const plafond = choisies.length >= zonesMax;
  const conseil = analyse?.statut === "PRETE" && analyse.verdict && analyse.verdict !== "bonne" && !conseilIgnore ? { titre: TITRES_VERDICT[analyse.verdict], texte: analyse.conseil } : null;

  return (
    <section aria-labelledby="creation-matieres" className="space-y-5 pb-36">
      <div className="overflow-hidden rounded-[var(--rayon-md)] border border-trait bg-blanc">
        {/* Le CRM ne donne pas les dimensions de la photo : une boîte au rapport fixe (bornée en hauteur) réserve la place,
            la photo s'y inscrit entière — rien ne bouge quand elle arrive. */}
        <div className="aspect-[4/3] max-h-[46vh] w-full bg-fond-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- photo privée servie par le CRM */}
          <img src={photo} alt="Votre photo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <p className="min-h-[20px] text-[13.5px] text-encre-2" aria-live="polite">
            {analyse?.statut === "EN_COURS" ? "Lecture de votre photo…" : analyse?.statut === "PRETE" ? "Photo lue : les zones visibles sont proposées ci-dessous." : analyse?.statut === "SAUTEE" || analyse?.statut === "ECHEC" ? MESSAGE_ANALYSE_SAUTEE : ""}
          </p>
          <Bouton variante="discret" onClick={onReprendrePhoto} className="min-h-[44px] shrink-0 px-2">
            Reprendre
          </Bouton>
        </div>
      </div>

      {conseil ? (
        <div role="status" className="rounded-[var(--rayon-md)] border border-trait bg-blanc p-4">
          <p className="text-[16px] font-semibold text-encre">{conseil.titre}</p>
          {conseil.texte ? <p className="mt-1 text-[14.5px] leading-relaxed text-encre-2">{conseil.texte}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Bouton variante="secondaire" onClick={onReprendrePhoto}>
              Reprendre la photo
            </Bouton>
            <Bouton variante="discret" onClick={onIgnorerConseil}>
              Continuer quand même
            </Bouton>
          </div>
        </div>
      ) : null}

      <div>
        <h2 id="creation-matieres" className={TITRE}>
          Quelles matières ?
        </h2>
        <p className={SOUS_TITRE}>Choisissez une matière pour chaque zone à transformer, jusqu&apos;à {zonesMax}. Les autres restent telles quelles.</p>
      </div>

      <ul className="space-y-2.5">
        {zones.map((zone) => {
          const teinte = choix.teintes[zone.zone] ?? null;
          const nonVisible = zoneNonVisible(analyse, [zone.zone]);
          const bloque = !teinte && plafond;
          const raison = nonVisible ? "Non visible sur la photo" : bloque ? `${zonesMax} zones au plus par simulation` : null;
          return (
            <li key={zone.zone} className={cx("rounded-[var(--rayon-md)] border bg-blanc p-3 transition-colors duration-[var(--duree-courte)]", teinte ? "border-encre" : "border-trait", nonVisible && "opacity-60")}>
              <div className="flex min-h-[56px] items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {teinte ? (
                    <TuileFilm ref={teinte.ref} nom={teinte.nom} libelle={zone.libelle} vignette={urlVignette(teinte.ref)} />
                  ) : (
                    <>
                      <p className="text-[15.5px] font-semibold text-encre">{zone.libelle}</p>
                      <p className="truncate text-[13px] text-encre-2">{raison ?? zone.description ?? ""}</p>
                    </>
                  )}
                  {teinte && raison ? <p className="mt-0.5 text-[13px] text-encre-2">{raison}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {teinte ? (
                    <button type="button" onClick={() => onRetirer(zone.zone)} className="min-h-[44px] px-2 text-[14px] text-encre-2 underline-offset-4 hover:underline">
                      Retirer
                    </button>
                  ) : null}
                  <button
                    type="button"
                    ref={(el) => {
                      if (el) boutons.current.set(zone.zone, el);
                      else boutons.current.delete(zone.zone);
                    }}
                    disabled={!teinte && (nonVisible || bloque)}
                    aria-label={`${teinte ? "Modifier" : "Choisir"} la matière : ${zone.libelle}`}
                    onClick={() => onOuvrir(zone.zone)}
                    className={cx("min-h-[44px] rounded-[var(--rayon-sm)] px-4 text-[14.5px] font-medium transition-colors duration-[var(--duree-courte)] disabled:cursor-not-allowed disabled:opacity-50", teinte ? "border border-encre bg-blanc text-encre hover:bg-fond-2" : "bg-encre text-blanc hover:bg-encre-survol")}
                  >
                    {teinte ? "Modifier" : "Choisir"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Le bouton qui lance, collé au-dessus des onglets de l'espace et de la zone de sécurité, avec le quota lisible. */}
      <div className="fixed inset-x-0 bottom-[calc(3.9rem+env(safe-area-inset-bottom))] z-20 border-t border-trait bg-fond/95 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-xl px-4 pt-3 pb-2">
          <Bouton plein occupe={occupe} libelleOccupe="Lancement…" raisonDesactive={raisonBloque} onClick={onLancer}>
            Lancer ma simulation
          </Bouton>
          <p className="mt-1 text-center text-[13px] text-encre-2">{texteQuota}</p>
        </div>
      </div>
    </section>
  );
}
