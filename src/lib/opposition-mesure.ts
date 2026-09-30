/**
 * Mission 17 (partie B) : s'opposer à la mesure d'audience.
 *
 * La mesure du site repose sur l'exemption de consentement de la CNIL (mesure
 * d'audience pour notre seul compte, statistiques anonymes, rien vers un tiers)
 * ; l'exemption exige qu'on puisse s'y opposer simplement. Deux voies, lues par
 * `envoyerEvenement` avant chaque envoi :
 *  - le bouton « Ne pas compter mes visites » (politique de confidentialité,
 *    `components/OppositionMesure.tsx`) pose un drapeau dans le stockage local
 *    du navigateur (`localStorage`, clé `coverswap_sans_mesure`, valeur « 1 »).
 *    Ce drapeau est STRICTEMENT NÉCESSAIRE : c'est lui qui retient le refus (sans
 *    lui, le refus serait oublié à la page suivante). Il ne contient rien d'autre,
 *    ne part jamais au serveur, et s'efface par « Compter à nouveau mes visites »
 *    ou en vidant les données du site ;
 *  - le signal Global Privacy Control du navigateur (`navigator.globalPrivacyControl`)
 *    vaut refus, sans rien à cliquer.
 * Un refus coupe TOUS les événements (pages vues, étapes du simulateur, clics) ;
 * il ne change rien à une demande de devis (le service demandé).
 */
export const CLE_OPPOSITION = "coverswap_sans_mesure";

/** Événement de la fenêtre émis quand le drapeau change dans cet onglet (l'événement `storage` ne vient que des autres). */
export const EVENEMENT_OPPOSITION = "coverswap:opposition-mesure";

/** Pure : la mesure est refusée si le drapeau est posé ou si le navigateur envoie Global Privacy Control. */
export function mesureRefusee(drapeau: string | null | undefined, globalPrivacyControl: unknown): boolean {
  return drapeau === "1" || globalPrivacyControl === true;
}

/** Le signal Global Privacy Control du navigateur (false s'il n'existe pas). */
export function gpcActif(): boolean {
  try {
    return typeof navigator !== "undefined" && (navigator as Navigator & { globalPrivacyControl?: unknown }).globalPrivacyControl === true;
  } catch {
    return false;
  }
}

function lireDrapeau(): string | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(CLE_OPPOSITION) : null;
  } catch {
    return null; // stockage bloqué : seul GPC compte
  }
}

/** Le drapeau posé par le bouton (false si le stockage est bloqué : alors seul GPC compte). */
export function drapeauOpposition(): boolean {
  return lireDrapeau() === "1";
}

/** Ce navigateur refuse-t-il la mesure ? (drapeau ou GPC) */
export function mesureRefuseeIci(): boolean {
  return mesureRefusee(lireDrapeau(), gpcActif());
}

/** Pose (true) ou retire (false) le drapeau ; rend false si le stockage local est bloqué. */
export function poserOpposition(refus: boolean): boolean {
  try {
    if (refus) localStorage.setItem(CLE_OPPOSITION, "1");
    else localStorage.removeItem(CLE_OPPOSITION);
    window.dispatchEvent(new Event(EVENEMENT_OPPOSITION));
    return true;
  } catch {
    return false;
  }
}
