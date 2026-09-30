/**
 * L'entonnoir du simulateur (mission 15, partie 4) : un événement par étape,
 * envoyé une fois par parcours et par étape (un retour en arrière ne recompte
 * pas), dans l'ordre PIECE_CHOISIE → PHOTO_CHARGEE → GENERATION_LANCEE →
 * RESULTAT_VU → CONTACT (le formulaire du simulateur envoie DEVIS_DEMANDE, que
 * le CRM range à la dernière étape). Pur : l'envoi est injecté.
 */
export type EtapeEntonnoir = "PIECE_CHOISIE" | "PHOTO_CHARGEE" | "GENERATION_LANCEE" | "RESULTAT_VU";

export const ORDRE_ENTONNOIR: readonly EtapeEntonnoir[] = ["PIECE_CHOISIE", "PHOTO_CHARGEE", "GENERATION_LANCEE", "RESULTAT_VU"];

export type Envoi = (type: EtapeEntonnoir, meta: Record<string, string | number | boolean | undefined>) => void;

export type Emetteur = {
  /** Émet l'étape si elle n'a pas encore été émise pour ce parcours ; rend vrai si elle est partie. */
  marquer: (etape: EtapeEntonnoir, meta?: Record<string, string | number | boolean | undefined>) => boolean;
  /** Les étapes déjà émises, dans l'ordre de l'entonnoir. */
  emises: () => EtapeEntonnoir[];
  /** Nouveau parcours (« Nouvelle simulation ») : tout peut repartir. */
  reinitialiser: () => void;
};

export function creerEmetteur(envoyer: Envoi, dejaEmises: EtapeEntonnoir[] = []): Emetteur {
  const faites = new Set<EtapeEntonnoir>(dejaEmises);
  return {
    marquer(etape, meta = {}) {
      if (faites.has(etape)) return false;
      faites.add(etape);
      envoyer(etape, meta);
      return true;
    },
    emises: () => ORDRE_ENTONNOIR.filter((e) => faites.has(e)),
    reinitialiser: () => faites.clear(),
  };
}

/** Une génération relancée (« Réessayer », « Essayer d'autres matières ») recompte une génération et un résultat, pas la pièce ni la photo. */
export function rouvrirGeneration(emetteur: Emetteur, envoyer: Envoi): Emetteur {
  return creerEmetteur(
    envoyer,
    emetteur.emises().filter((e) => e === "PIECE_CHOISIE" || e === "PHOTO_CHARGEE")
  );
}
