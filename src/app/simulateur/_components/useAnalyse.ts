"use client";

import { useEffect, useRef } from "react";
import { demanderAnalyse, sonderAnalyse } from "@/lib/simulateur/generation-client";
import { reduireAnalyse, type EtatAnalyse } from "@/lib/simulateur/reprise";

/**
 * L'analyse de la photo (mission 15, partie 4), demandée au CRM DÈS que la
 * photo est chargée, pendant que la personne choisit ses matières ; suivie
 * toutes les 3 s tant qu'elle est en cours (au plus 2 min), relancée au retour
 * de la page. Le résultat (zones vues, conseil de qualité) est écrit dans la
 * mémoire du parcours par `onAnalyse`. Jamais bloquant : sans réponse, le
 * simulateur marche sans analyse.
 */
const INTERVALLE_MS = 3_000;
const ATTENTE_MAX_MS = 2 * 60_000;

export function useAnalyse(photo: string | null, parcoursId: string | null, projet: string, analyse: EtatAnalyse | null, onAnalyse: (analyse: EtatAnalyse | null) => void) {
  const rappel = useRef(onAnalyse);
  useEffect(() => {
    rappel.current = onAnalyse;
  }, [onAnalyse]);
  // La photo déjà demandée (par contenu) : un rendu du parent ne redemande rien.
  const demandee = useRef<string | null>(null);
  const empreinte = analyse?.empreinte ?? null;
  const enCours = analyse?.statut === "EN_COURS";

  useEffect(() => {
    if (!photo || !parcoursId) return;
    if (demandee.current === photo && analyse) return;
    // Au montage (reprise, rechargement, retour depuis l'accueil) : une analyse déjà faite ou sautée appartient à
    // cette photo (elle est remise à null à chaque nouvelle photo et à chaque changement de pièce) — rien à renvoyer.
    if (demandee.current === null && analyse && analyse.statut !== "EN_COURS") {
      demandee.current = photo;
      return;
    }
    demandee.current = photo;
    let actif = true;
    void demanderAnalyse({ parcoursId, projet, photo }).then((resultat) => {
      if (!actif) return;
      if (resultat.ok) rappel.current(reduireAnalyse(resultat.reponse));
      else rappel.current(null);
    });
    return () => {
      actif = false;
    };
    // Une demande par photo (et par pièce) ; l'analyse en mémoire n'est pas une dépendance : elle change à la réponse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, parcoursId, projet]);

  useEffect(() => {
    if (!enCours || !empreinte || !parcoursId) return;
    let actif = true;
    let occupe = false;
    const debut = Date.now();
    const verifier = async () => {
      if (!actif || occupe || document.visibilityState === "hidden") return;
      occupe = true;
      const resultat = await sonderAnalyse(empreinte, parcoursId);
      occupe = false;
      if (!actif) return;
      if (resultat.ok) {
        const lue = reduireAnalyse(resultat.reponse);
        if (lue.statut !== "EN_COURS" || Date.now() - debut > ATTENTE_MAX_MS) {
          actif = false;
          rappel.current(lue.statut === "EN_COURS" ? { ...lue, statut: "SAUTEE", raison: "delai" } : lue);
        }
      } else if (resultat.raison === "http-404" || Date.now() - debut > ATTENTE_MAX_MS) {
        actif = false;
        rappel.current({ empreinte, statut: "SAUTEE", zonesVisibles: [], zonesNonVisibles: [], verdict: null, conseil: null, raison: resultat.raison });
      }
    };
    const minuterie = window.setInterval(() => void verifier(), INTERVALLE_MS);
    const surVisible = () => {
      if (document.visibilityState === "visible") void verifier();
    };
    document.addEventListener("visibilitychange", surVisible);
    return () => {
      actif = false;
      window.clearInterval(minuterie);
      document.removeEventListener("visibilitychange", surVisible);
    };
  }, [enCours, empreinte, parcoursId]);
}
