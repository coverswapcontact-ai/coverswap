/**
 * Les feuilles et le geste retour du navigateur (mission 15, partie 4 ;
 * extrait de `Feuille.tsx` par la mission 16 pour être testé sans navigateur,
 * `historique-feuilles.test.ts`). Aucune dépendance à React.
 *  - une feuille ouverte = une entrée d'historique (`pushState`, l'état de
 *    Next gardé, sinon son routeur recharge la page au retour) ; le geste
 *    retour ferme la feuille du dessus ;
 *  - une feuille fermée autrement (bouton, Échap, glisser) rend son entrée
 *    par `history.go(-n)`, au tour suivant, une fois pour plusieurs
 *    fermetures ; si l'adresse a changé entre-temps (un bouton de la feuille
 *    a navigué), l'entrée n'est pas défaite ;
 *  - `apresHistorique` (mission 16) : ce qui doit attendre que ce retour soit
 *    fait. Naviguer depuis une feuille (un lien du menu du téléphone) : la
 *    navigation part APRÈS le retour d'historique ; partie avant, elle serait
 *    abandonnée par Next au `popstate` (restauration de la page courante).
 */

type EntreeFeuille = { id: number; fermer: () => void };

const pileFeuilles: EntreeFeuille[] = [];
const dansHistorique: number[] = [];
let compteurFeuilles = 0;
let ecouteRetour = false;
let synchronisationPrevue = false;
let retourEnCours = false;
let filet: ReturnType<typeof setTimeout> | null = null;
let enAttente: (() => void)[] = [];

/** Au-delà, le `popstate` d'un `history.go` n'arrivera plus : on n'attend pas davantage. */
const ATTENTE_MAX_RETOUR_MS = 1000;

const niveauDe = (etat: unknown) => Number((etat as { feuille?: number } | null)?.feuille) || 0;

function executerEnAttente() {
  const rappels = enAttente;
  enAttente = [];
  for (const rappel of rappels) rappel();
}

function retourTermine() {
  retourEnCours = false;
  if (filet !== null) {
    clearTimeout(filet);
    filet = null;
  }
  executerEnAttente();
}

function surRetourNavigateur(evenement: PopStateEvent) {
  const niveau = niveauDe(evenement.state);
  while (dansHistorique.length > 0 && dansHistorique[dansHistorique.length - 1] > niveau) dansHistorique.pop();
  while (pileFeuilles.length > 0 && pileFeuilles[pileFeuilles.length - 1].id > niveau) pileFeuilles.pop()!.fermer();
  if (retourEnCours) retourTermine();
}

function synchroniserHistorique() {
  synchronisationPrevue = false;
  const haut = pileFeuilles.length > 0 ? pileFeuilles[pileFeuilles.length - 1].id : 0;
  // Un bouton de la feuille a changé d'onglet : on ne le défait pas.
  const surNosEntrees = dansHistorique.length > 0 && niveauDe(window.history.state) === dansHistorique[dansHistorique.length - 1];
  let entrees = 0;
  while (dansHistorique.length > 0 && dansHistorique[dansHistorique.length - 1] > haut) {
    dansHistorique.pop();
    entrees++;
  }
  if (entrees > 0 && surNosEntrees) {
    retourEnCours = true;
    filet = setTimeout(retourTermine, ATTENTE_MAX_RETOUR_MS);
    window.history.go(-entrees);
    return;
  }
  executerEnAttente();
}

/**
 * Ouvre l'entrée d'historique d'une feuille (le geste retour appellera
 * `fermer`) ; rend la fonction à appeler quand la feuille se ferme autrement.
 */
export function entrerFeuille(fermer: () => void): () => void {
  const entree: EntreeFeuille = { id: ++compteurFeuilles, fermer };
  pileFeuilles.push(entree);
  dansHistorique.push(entree.id);
  window.history.pushState({ ...(window.history.state ?? {}), feuille: entree.id }, "");
  if (!ecouteRetour) {
    window.addEventListener("popstate", surRetourNavigateur);
    ecouteRetour = true;
  }
  return () => {
    const rang = pileFeuilles.indexOf(entree);
    if (rang < 0) return; // déjà fermée par le geste retour
    pileFeuilles.splice(rang, 1);
    if (!synchronisationPrevue) {
      synchronisationPrevue = true;
      setTimeout(synchroniserHistorique, 0);
    }
  };
}

/**
 * Lance `rappel` une fois l'historique rendu par les feuilles qui viennent
 * de se fermer (après le `popstate` de leur `history.go`), tout de suite si
 * rien n'est en cours. À appeler APRÈS la fermeture (dans un effet).
 */
export function apresHistorique(rappel: () => void) {
  if (synchronisationPrevue || retourEnCours) enAttente.push(rappel);
  else rappel();
}
