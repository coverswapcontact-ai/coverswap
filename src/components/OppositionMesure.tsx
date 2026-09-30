"use client";

import { useSyncExternalStore } from "react";
import { EVENEMENT_OPPOSITION, drapeauOpposition, gpcActif, poserOpposition } from "@/lib/opposition-mesure";

/**
 * Mission 17 (partie B) : « Ne pas compter mes visites », sur la politique de
 * confidentialité. Pose (ou retire) le drapeau du stockage local que
 * `envoyerEvenement` lit avant chaque envoi (`lib/opposition-mesure.ts`) ; le
 * signal Global Privacy Control du navigateur vaut déjà refus, et le bouton le
 * dit. Composant client : il lit et écrit le stockage du navigateur.
 */
type Etat = "compte" | "refuse" | "gpc" | "inconnu";

function lireEtat(): Etat {
  if (gpcActif()) return "gpc";
  return drapeauOpposition() ? "refuse" : "compte";
}

function abonner(rappel: () => void): () => void {
  window.addEventListener(EVENEMENT_OPPOSITION, rappel);
  window.addEventListener("storage", rappel);
  return () => {
    window.removeEventListener(EVENEMENT_OPPOSITION, rappel);
    window.removeEventListener("storage", rappel);
  };
}

const BOUTON = "inline-flex min-h-[44px] items-center text-accent-texte underline underline-offset-4 hover:text-encre";

export default function OppositionMesure() {
  const etat = useSyncExternalStore<Etat>(abonner, lireEtat, () => "inconnu");

  if (etat === "gpc") {
    return <p role="status">Votre navigateur envoie le signal Global Privacy Control : vos visites ne sont pas comptées.</p>;
  }
  if (etat === "refuse") {
    return (
      <p role="status">
        Vos visites ne sont plus comptées sur ce navigateur.{" "}
        <button type="button" className={BOUTON} onClick={() => poserOpposition(false)}>
          Compter à nouveau mes visites
        </button>
      </p>
    );
  }
  return (
    <p>
      <button type="button" className={BOUTON} onClick={() => poserOpposition(true)}>
        Ne pas compter mes visites
      </button>
    </p>
  );
}
