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
  /** Une étape peut repartir (relecture D, E, F : la photo change de source, l'exemple change la pièce). */
  oublier: (etape: EtapeEntonnoir) => void;
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
    oublier: (etape) => {
      faites.delete(etape);
    },
  };
}

/** D'où vient la photo du parcours : `exemple` = le nom de la pièce d'exemple, null = la photo du visiteur. */
export type SourcePhoto = { exemple: string | null; projet: string };

/**
 * Relecture des phases D, E, F : une photo d'une AUTRE source (photo du visiteur ↔ pièce d'exemple, ou un autre
 * exemple) réarme PHOTO_CHARGEE — elle repart avec sa méta `exemple` ; un exemple d'une autre pièce change le projet
 * sans passer par l'écran Pièce : PIECE_CHOISIE repart pour la nouvelle pièce (`exemple` dans sa méta). La même source
 * rechargée ne recompte rien (une fois par parcours, comme avant). À appeler AVANT de marquer PHOTO_CHARGEE.
 */
export function changerDeSource(emetteur: Emetteur, avant: SourcePhoto, apres: SourcePhoto): void {
  if (apres.projet !== avant.projet && apres.exemple) {
    emetteur.oublier("PIECE_CHOISIE");
    emetteur.marquer("PIECE_CHOISIE", { projet: apres.projet, exemple: apres.exemple });
  }
  if (apres.exemple !== avant.exemple) emetteur.oublier("PHOTO_CHARGEE");
}

/**
 * Le `?depuis=` d'un lien vers le simulateur (mission 16, partie 3 : `accueil-ouverture`, `accueil-final`…), repris
 * dans le `meta` de PIECE_CHOISIE pour savoir quel bouton a amené la personne. Minuscules, chiffres et tirets, 40
 * caractères au plus : tout autre texte est ignoré (rien de ce que l'adresse porte d'autre ne part au CRM).
 */
export function lireDepuis(valeur: string | null | undefined): string | null {
  return typeof valeur === "string" && /^[a-z0-9-]{1,40}$/.test(valeur) ? valeur : null;
}

/** Une génération relancée (« Réessayer », « Essayer d'autres matières ») recompte une génération et un résultat, pas la pièce ni la photo. */
export function rouvrirGeneration(emetteur: Emetteur, envoyer: Envoi): Emetteur {
  return creerEmetteur(
    envoyer,
    emetteur.emises().filter((e) => e === "PIECE_CHOISIE" || e === "PHOTO_CHARGEE")
  );
}
