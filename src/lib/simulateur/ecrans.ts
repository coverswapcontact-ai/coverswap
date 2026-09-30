/**
 * La machine d'état des quatre écrans du simulateur (mission 15, partie 4) :
 * Pièce · Photo · Matières · Résultat. Fonctions PURES : quel écran est
 * atteignable d'après ce que la personne a déjà fait, où l'on va après un
 * geste, et le retour en arrière SANS PERTE (revenir à la photo ne vide pas
 * les matières ; changer de pièce vide seulement les matières, jamais la
 * photo ni l'historique des rendus).
 */
import type { EtatSimulateur } from "./reprise";

export type Ecran = 1 | 2 | 3 | 4;

export const ECRANS: readonly { numero: Ecran; libelle: string }[] = [
  { numero: 1, libelle: "Pièce" },
  { numero: 2, libelle: "Photo" },
  { numero: 3, libelle: "Matières" },
  { numero: 4, libelle: "Résultat" },
];

export type Progression = Pick<EtatSimulateur, "photo" | "rendus" | "travailEnCours"> & { generationEnCours?: boolean };

const aUnRendu = (p: Progression) => p.rendus.some((r) => r.urlApres);

/** Le dernier écran que la personne peut voir, d'après ce qu'elle a déjà fait. */
export function ecranMax(p: Progression): Ecran {
  if (aUnRendu(p)) return 4;
  if (p.photo) return 3;
  return 1;
}

/** Peut-on aller à cet écran ? Toujours en arrière ; en avant seulement jusqu'à ce qui est fait. Pendant une génération, rien ne bouge. */
export function ecranAtteignable(p: Progression, cible: Ecran, courant: Ecran): boolean {
  if (p.travailEnCours || p.generationEnCours) return cible === courant;
  if (cible <= courant) return true;
  return cible <= ecranMax(p);
}

export type Geste =
  | { type: "piece-choisie"; projet: string; projetPrecedent: string }
  | { type: "photo-chargee" }
  | { type: "photo-reprise" }
  | { type: "generation-lancee" }
  | { type: "resultat-recu" }
  | { type: "autres-matieres" }
  | { type: "retour"; vers: Ecran };

export type Transition = { ecran: Ecran; viderSelections: boolean };

/** L'écran suivant après un geste, et s'il faut vider les matières choisies (jamais autre chose). */
export function reduireEcran(courant: Ecran, geste: Geste, p: Progression): Transition {
  switch (geste.type) {
    case "piece-choisie":
      // Même pièce : rien ne change ; autre pièce : ses matières ne valent plus, la photo reste.
      return { ecran: 2, viderSelections: geste.projet !== geste.projetPrecedent };
    case "photo-chargee":
      return { ecran: 3, viderSelections: false };
    case "photo-reprise":
      return { ecran: 2, viderSelections: false };
    case "generation-lancee":
      return { ecran: 3, viderSelections: false };
    case "resultat-recu":
      return { ecran: 4, viderSelections: false };
    case "autres-matieres":
      // La photo et l'analyse restent : on revient aux matières avec les choix du rendu.
      return { ecran: p.photo ? 3 : 2, viderSelections: false };
    case "retour":
      return { ecran: ecranAtteignable(p, geste.vers, courant) ? geste.vers : courant, viderSelections: false };
  }
}

/** L'écran de départ au montage, d'après la décision de reprise (étape 1 → pièce, 2 → matières, 3 → résultat). */
export function ecranDepuisEtape(etape: 1 | 2 | 3, p: Progression): Ecran {
  if (etape === 3 && aUnRendu(p)) return 4;
  if (etape >= 2 && p.photo) return 3;
  return 1;
}
