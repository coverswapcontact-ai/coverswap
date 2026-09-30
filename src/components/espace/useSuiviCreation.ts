"use client";

import { useEffect, useRef, useState } from "react";
import { INTERVALLE_SUIVI_MS, reduireSuivi, type DecisionSuivi } from "@/lib/espace/creation";
import { ErreurEspace, type Client, type SuiviCreation } from "./api";

/**
 * Suivi d'une simulation lancée depuis l'espace (mission 15, partie 5) : même
 * rythme que le site — toutes les 3 s, relancé quand la page redevient visible
 * et au retour du réseau, jamais pendant que la page est cachée ; arrêt à
 * PRETE, ECHEC, RELECTURE ou 404. UN SEUL sondage actif par espace (le CRM
 * limite à 400 requêtes par 10 min et par adresse : 3 s = 200) : une seule
 * simulation est suivie à la fois, la plus ancienne. La décision est une
 * fonction pure (`reduireSuivi`) ; ici seulement le temps et le navigateur.
 */
export type EtatSuivi = { id: string; etape: string | null; attenteEstimeeS: number | null; horsLigne: boolean };
export type Gestionnaires = { onPrete: (id: string, simulationId: string | null) => void; onRelecture: (id: string, simulationId: string | null, message: string) => void; onEchec: (id: string, raison: string, message: string) => void; onOubliee: (id: string) => void };

/** Les espaces (par racine d'API) dont un sondage tourne : un second montage n'en lance pas un autre. */
const sondagesActifs = new Set<string>();

export function useSuiviCreation(client: Client, suivie: { id: string } | null, gestionnaires: Gestionnaires): EtatSuivi | null {
  const [etat, setEtat] = useState<EtatSuivi | null>(null);
  const refs = useRef(gestionnaires);
  useEffect(() => {
    refs.current = gestionnaires;
  }, [gestionnaires]);
  const id = suivie?.id ?? null;

  useEffect(() => {
    if (!id) return;
    const cle = client.racine;
    if (sondagesActifs.has(cle)) return;
    sondagesActifs.add(cle);
    let actif = true;
    let enCours = false;
    const finir = (geste: () => void) => {
      actif = false;
      geste();
    };
    const verifier = async () => {
      if (!actif || enCours || document.visibilityState === "hidden") return;
      enCours = true;
      let decision: DecisionSuivi;
      try {
        const reponse = await client.appeler<SuiviCreation>(`/simulations/creation/${id}`);
        decision = reduireSuivi({ type: "reponse", reponse });
      } catch (erreur) {
        decision = reduireSuivi(erreur instanceof ErreurEspace ? { type: "http", status: erreur.status } : { type: "reseau" });
      }
      enCours = false;
      if (!actif) return;
      switch (decision.suite) {
        case "continuer":
          setEtat((e) => ({ id, etape: decision.etape ?? (e?.id === id ? e.etape : null), attenteEstimeeS: decision.attenteEstimeeS ?? (e?.id === id ? e.attenteEstimeeS : null), horsLigne: decision.horsLigne }));
          return;
        case "prete":
          return finir(() => refs.current.onPrete(id, decision.simulationId));
        case "relecture":
          return finir(() => refs.current.onRelecture(id, decision.simulationId, decision.message));
        case "echec":
          return finir(() => refs.current.onEchec(id, decision.raison, decision.message));
        case "oubliee":
          return finir(() => refs.current.onOubliee(id));
      }
    };
    void verifier();
    const minuterie = window.setInterval(() => void verifier(), INTERVALLE_SUIVI_MS);
    const surVisible = () => {
      if (document.visibilityState === "visible") void verifier();
    };
    document.addEventListener("visibilitychange", surVisible);
    window.addEventListener("online", surVisible);
    return () => {
      actif = false;
      sondagesActifs.delete(cle);
      window.clearInterval(minuterie);
      document.removeEventListener("visibilitychange", surVisible);
      window.removeEventListener("online", surVisible);
    };
    // Relancé seulement quand la simulation suivie change (pas à chaque rendu du parent).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, client.racine]);

  if (!id) return null;
  return etat && etat.id === id ? etat : { id, etape: null, attenteEstimeeS: null, horsLigne: false };
}
