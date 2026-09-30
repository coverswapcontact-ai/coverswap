"use client";

import { useEffect, useRef, useState } from "react";
import { reduireAnalyse, type EtatAnalyse } from "@/lib/simulateur/reprise";
import { ErreurEspace, type Client, type ReponseAnalyse } from "./api";

/**
 * L'analyse de la photo choisie (mission 15, partie 5) : demandée au CRM dès
 * qu'elle est choisie (`POST /simulations/analyse`, même moteur que la
 * génération, réutilisée par elle), suivie toutes les 3 s tant qu'elle est en
 * cours (au plus 2 min), relancée au retour de la page. Jamais bloquant : sans
 * réponse (aperçu, réseau, 404), la simulation se lance sans analyse. L'état
 * est gardé par photo ET pièce : changer l'une ou l'autre redemande.
 */
const INTERVALLE_MS = 3_000;
const ATTENTE_MAX_MS = 2 * 60_000;

const sautee = (empreinte: string, raison: string): EtatAnalyse => ({ empreinte, statut: "SAUTEE", zonesVisibles: [], zonesNonVisibles: [], verdict: null, conseil: null, raison });

export function useAnalyseEspace(client: Client, photoId: string | null, piece: string): EtatAnalyse | null {
  const [analyses, setAnalyses] = useState<Record<string, EtatAnalyse>>({});
  const cle = photoId ? `${photoId}:${piece}` : null;
  const analyse = cle ? (analyses[cle] ?? null) : null;
  const demandees = useRef(new Set<string>());
  const poser = (cleAnalyse: string, etat: EtatAnalyse | null) => setAnalyses((a) => (etat ? { ...a, [cleAnalyse]: etat } : a));

  useEffect(() => {
    if (!cle || !photoId || demandees.current.has(cle)) return;
    demandees.current.add(cle);
    let actif = true;
    void client
      .envoyerJson<ReponseAnalyse>("/simulations/analyse", "POST", { photoId, piece })
      .then((reponse) => actif && poser(cle, reduireAnalyse(reponse)))
      .catch((erreur: unknown) => {
        if (!actif) return;
        // Quota d'analyses du dossier atteint (429) : sautée, on ne redemande pas ; l'écran dit qu'on peut lancer sans.
        if (erreur instanceof ErreurEspace && erreur.status === 429) return poser(cle, sautee("", erreur.raison ?? "quota"));
        // Aperçu, réseau, photo retirée : on lance sans analyse (rien n'est dit, comme sur le site).
        demandees.current.delete(cle);
      });
    return () => {
      actif = false;
    };
  }, [cle, photoId, piece, client]);

  const enCours = analyse?.statut === "EN_COURS";
  const empreinte = analyse?.empreinte ?? null;
  useEffect(() => {
    if (!cle || !enCours || !empreinte) return;
    let actif = true;
    let occupe = false;
    const debut = Date.now();
    const verifier = async () => {
      if (!actif || occupe || document.visibilityState === "hidden") return;
      occupe = true;
      try {
        const reponse = await client.appeler<ReponseAnalyse>(`/simulations/analyse/${encodeURIComponent(empreinte)}`);
        const lue = reduireAnalyse(reponse);
        if (lue.statut !== "EN_COURS" || Date.now() - debut > ATTENTE_MAX_MS) {
          actif = false;
          poser(cle, lue.statut === "EN_COURS" ? { ...lue, statut: "SAUTEE", raison: "delai" } : lue);
        }
      } catch (erreur) {
        if ((erreur instanceof ErreurEspace && erreur.status === 404) || Date.now() - debut > ATTENTE_MAX_MS) {
          actif = false;
          poser(cle, sautee(empreinte, erreur instanceof ErreurEspace ? `http-${erreur.status}` : "reseau"));
        }
      }
      occupe = false;
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
  }, [cle, enCours, empreinte, client]);

  return analyse;
}
