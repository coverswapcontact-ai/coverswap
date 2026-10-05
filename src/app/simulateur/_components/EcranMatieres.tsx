"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Bouton } from "@/components/simulation/Bouton";
import { BoutonColle } from "@/components/simulation/BoutonColle";
import { RESERVE_BOUTON_COLLE } from "@/components/simulation/reserve-bouton-colle";
import { TuileFilm } from "@/components/simulation/TuileFilm";
import { urlVignette } from "@/lib/simulateur/generation-client";
import { MESSAGE_ANALYSE_SAUTEE, TITRES_VERDICT, zoneNonVisible, type EtatAnalyse, type EtatSimulateur } from "@/lib/simulateur/reprise";
import { composantesDe, type PieceSimulateur } from "@/lib/simulateur/zones";

/**
 * Écran 3 — les matières : la photo en haut (rapport réel, jamais rognée) avec
 * « Reprendre », le conseil de qualité de l'analyse (« Continuer quand même »),
 * puis les zones de la pièce en rangées : nom, état (« à choisir » ou le film),
 * « Choisir » / « Modifier », « Retirer ». Une zone que l'analyse ne voit pas
 * est grisée (« non visible sur la photo ») ; un refus 409 du CRM s'affiche en
 * clair sur la zone. Le bouton principal « Voir le résultat » est collé en
 * bas, au-dessus de la zone de sécurité de l'iPhone. Aucun défilement
 * programmé : après un choix, le focus revient sur « Modifier » sans bouger la
 * page.
 */
export type Selections = EtatSimulateur["selections"];

type Props = {
  piece: PieceSimulateur;
  photo: string;
  /** `aspect-ratio` de la photo (« 1600 / 1200 ») : la place est réservée avant le décodage de l'image ; null si inconnu. */
  rapport: string | null;
  selections: Selections;
  analyse: EtatAnalyse | null;
  conseilIgnore: boolean;
  onIgnorerConseil: () => void;
  onReprendrePhoto: () => void;
  onOuvrir: (zoneId: string) => void;
  onRetirer: (zoneId: string) => void;
  /** La zone dont le bouton doit reprendre le focus (après un choix), sans défilement. */
  focusZone: string | null;
  zonesRefusees: string[];
  messageRefus: string | null;
  peutGenerer: boolean;
  raisonBloque: string | null;
  occupe: boolean;
  onGenerer: () => void;
  zonesMax: number;
  captcha?: ReactNode;
};

export function EcranMatieres({ piece, photo, rapport, selections, analyse, conseilIgnore, onIgnorerConseil, onReprendrePhoto, onOuvrir, onRetirer, focusZone, zonesRefusees, messageRefus, peutGenerer, raisonBloque, occupe, onGenerer, zonesMax, captcha }: Props) {
  const boutons = useRef(new Map<string, HTMLButtonElement>());
  useEffect(() => {
    // Le seul focus programmé : le bouton de la zone qui vient d'être choisie, SANS défilement.
    if (focusZone) boutons.current.get(focusZone)?.focus({ preventScroll: true });
  }, [focusZone]);

  const choisies = piece.zones.filter((z) => selections[z.id]);
  const plafond = choisies.length >= zonesMax;
  const conseil = analyse?.statut === "PRETE" && analyse.verdict && analyse.verdict !== "bonne" && !conseilIgnore ? { titre: TITRES_VERDICT[analyse.verdict], texte: analyse.conseil } : null;

  return (
    <section aria-labelledby="etape-matieres" className={`space-y-5 ${RESERVE_BOUTON_COLLE}`}>
      <div className="overflow-hidden rounded-[var(--rayon-md)] border border-trait bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- photo du visiteur (mémoire locale), au rapport réel */}
        <img src={photo} alt="Votre photo" className="block w-full bg-fond-2" style={rapport ? { aspectRatio: rapport } : undefined} />
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
        <div role="status" className="rounded-[var(--rayon-md)] border border-trait bg-white p-4">
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
        <h2 id="etape-matieres" className="font-display text-[26px] leading-tight font-semibold tracking-tight text-balance">
          Quelles matières ?
        </h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-encre-2">Choisissez une matière pour chaque zone à transformer, jusqu&apos;à {zonesMax}. Les autres restent telles quelles.</p>
      </div>

      {messageRefus ? (
        <p role="alert" className="rounded-[var(--rayon-sm)] border border-alerte-texte/40 bg-alerte-fond px-4 py-3 text-[14.5px] leading-relaxed text-alerte-texte">
          {messageRefus}
        </p>
      ) : null}

      <ul className="space-y-2.5">
        {piece.zones.map((zone) => {
          const sel = selections[zone.id] ?? null;
          const nonVisible = zoneNonVisible(analyse, composantesDe(piece, zone.id));
          const refusee = zonesRefusees.includes(zone.id);
          const bloque = !sel && plafond;
          const raison = nonVisible ? "Non visible sur la photo" : bloque ? `${zonesMax} zones au plus par rendu` : null;
          return (
            <li key={zone.id} className={`rounded-[var(--rayon-md)] border bg-white p-3 transition-colors duration-[var(--duree-courte)] ${refusee ? "border-alerte-texte" : sel ? "border-encre" : "border-trait"} ${nonVisible ? "opacity-60" : ""}`}>
              <div className="flex min-h-[56px] items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {sel ? (
                    <TuileFilm ref={sel.ref} nom={sel.nom} libelle={zone.libelle} vignette={urlVignette(sel.ref)} />
                  ) : (
                    <>
                      <p className="text-[15.5px] font-semibold text-encre">{zone.libelle}</p>
                      <p className="truncate text-[13px] text-encre-2">{raison ?? (refusee ? "Non visible sur la photo d'après le rendu" : zone.description)}</p>
                    </>
                  )}
                  {sel && raison ? <p className="mt-0.5 text-[13px] text-encre-2">{raison}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {sel ? (
                    <button type="button" onClick={() => onRetirer(zone.id)} className="min-h-[44px] px-2 text-[14px] text-encre-2 underline-offset-4 hover:underline">
                      Retirer
                    </button>
                  ) : null}
                  <button
                    type="button"
                    ref={(el) => {
                      if (el) boutons.current.set(zone.id, el);
                      else boutons.current.delete(zone.id);
                    }}
                    disabled={!sel && (nonVisible || bloque)}
                    aria-label={`${sel ? "Modifier" : "Choisir"} la matière : ${zone.libelle}`}
                    onClick={() => onOuvrir(zone.id)}
                    className={`min-h-[44px] rounded-[var(--rayon-sm)] px-4 text-[14.5px] font-medium transition-colors duration-[var(--duree-courte)] disabled:cursor-not-allowed disabled:opacity-50 ${sel ? "border border-encre bg-white text-encre hover:bg-fond-2" : "bg-encre text-blanc hover:bg-encre-survol"}`}
                  >
                    {sel ? "Modifier" : "Choisir"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {captcha}

      {/* Le bouton principal, collé en bas, au-dessus de la zone de sécurité. */}
      <BoutonColle>
        <Bouton plein occupe={occupe} libelleOccupe="Lancement…" raisonDesactive={peutGenerer ? null : raisonBloque} onClick={onGenerer}>
          Voir le résultat
        </Bouton>
      </BoutonColle>
    </section>
  );
}
