"use client";

import { useEffect, useRef, useState } from "react";
import { sonderTravail, type ReponseSuiviComplete } from "@/lib/simulateur/generation-client";
import { debuterSondage, INTERVALLE_SONDAGE_MS, reduireSondage, type EtatSondage, type TravailEnCours } from "@/lib/simulateur/reprise";

/**
 * Sondage d'un travail de simulation (mission 15, partie 1) : toutes les 3 s,
 * relancé quand la page redevient visible et au retour du réseau ; arrêt à
 * PRETE ou ECHEC. La décision est dans `reduireSondage` (fonction pure) ; ici
 * seulement le temps et les événements du navigateur.
 */
export type Gestionnaires = { onPret: (travailId: string, reponse: ReponseSuiviComplete) => void; onEchec: (travailId: string, raison: string, message: string) => void };

export function useSondage(travail: TravailEnCours | null, parcoursId: string | null, gestionnaires: Gestionnaires): EtatSondage | null {
  const [etat, setEtat] = useState<EtatSondage | null>(null);
  const refs = useRef(gestionnaires);
  useEffect(() => {
    refs.current = gestionnaires;
  }, [gestionnaires]);
  const travailId = travail?.travailId ?? null;

  useEffect(() => {
    if (!travail || !parcoursId) return;
    let courant = debuterSondage(travail);
    let actif = true;
    let enCours = false;

    const verifier = async () => {
      if (!actif || enCours) return;
      if (document.visibilityState === "hidden") return;
      enCours = true;
      const evenement = await sonderTravail(travail.travailId, parcoursId);
      enCours = false;
      if (!actif) return;
      const transition = reduireSondage(courant, evenement);
      courant = transition.etat;
      setEtat(courant);
      if (transition.suite === "pret") {
        actif = false;
        refs.current.onPret(travail.travailId, evenement.type === "reponse" ? (evenement.reponse as ReponseSuiviComplete) : transition.reponse);
      } else if (transition.suite === "echec") {
        actif = false;
        refs.current.onEchec(travail.travailId, transition.raison, transition.message);
      }
    };
    void verifier();
    const minuterie = window.setInterval(() => void verifier(), INTERVALLE_SONDAGE_MS);
    const surVisible = () => {
      if (document.visibilityState === "visible") void verifier();
    };
    document.addEventListener("visibilitychange", surVisible);
    window.addEventListener("online", surVisible);
    return () => {
      actif = false;
      window.clearInterval(minuterie);
      document.removeEventListener("visibilitychange", surVisible);
      window.removeEventListener("online", surVisible);
    };
    // Relancé seulement quand le travail change (pas à chaque rendu du parent).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travailId, parcoursId]);

  // Avant la première réponse (ou pour un autre travail), l'état de départ est dérivé : aucun setState dans l'effet.
  if (!travail) return null;
  return etat && etat.travailId === travail.travailId ? etat : debuterSondage(travail);
}
