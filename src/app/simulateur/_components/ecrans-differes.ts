import { lazy } from "react";

/**
 * Lot F7 : les écrans qui ne sont jamais le premier — l'attente et l'échec de la génération (`EcranGeneration`,
 * `EcranSansPhoto`), le résultat et la demande qui le suit (`EcranResultat`, `DemandeApresRendu`), la feuille du
 * catalogue — sont chargés à part : leur JavaScript ne part plus avec la page. Ils sont préchargés dès que la personne
 * passe à l'écran Photo, ou au premier geste, ou trois secondes après `load` (`attendreLeMoment`) : prêts bien avant
 * d'être montrés (une génération dure plus de dix secondes). Le rendu de chaque écran ne change pas.
 */
const chargerGeneration = () => import("./EcranGeneration");
const chargerResultat = () => import("./EcranResultat");
const chargerDemande = () => import("./DemandeApresRendu");
const chargerCatalogue = () => import("@/components/simulation/FeuilleCatalogue");
export const EcranGeneration = lazy(() => chargerGeneration().then((m) => ({ default: m.EcranGeneration })));
export const EcranSansPhoto = lazy(() => chargerGeneration().then((m) => ({ default: m.EcranSansPhoto })));
export const EcranResultat = lazy(chargerResultat);
export const DemandeApresRendu = lazy(() => chargerDemande().then((m) => ({ default: m.DemandeApresRendu })));
export const FeuilleCatalogue = lazy(() => chargerCatalogue().then((m) => ({ default: m.FeuilleCatalogue })));
export function prechargerLesEcrans() {
  void chargerGeneration();
  void chargerResultat();
  void chargerDemande();
  void chargerCatalogue();
}
