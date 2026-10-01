/**
 * Les adresses du menu et du pied de page (mission 16) : une seule liste, lue
 * par l'en-tête (`EnteteSite`), le menu du téléphone (`MenuMobile`) et le
 * pied de page (`PiedDePage`). Changer une adresse ici la change partout.
 *  - le menu : quatre entrées (énoncé § 2) ; « Simuler » est un bouton à part ;
 *  - l'espace client n'a pas d'index (`/e/<jeton>` arrive par SMS ou e-mail) :
 *    le pied mène à la carte « Votre espace client » de `/contact`. Pas au
 *    menu (énoncé § 5).
 */
export type EntreeNavigation = { href: string; libelle: string };

export const ENTREES_MENU: readonly EntreeNavigation[] = [
  { href: "/matieres", libelle: "Matières" },
  { href: "/realisations", libelle: "Réalisations" },
  { href: "/comment-ca-marche", libelle: "Comment ça marche" },
  { href: "/pro", libelle: "Pro" },
];

export const LIEN_SIMULER: EntreeNavigation = { href: "/simulateur", libelle: "Simuler" };
export const LIEN_CONTACT: EntreeNavigation = { href: "/contact", libelle: "Contact" };
export const LIEN_ESPACE_CLIENT: EntreeNavigation = { href: "/contact#espace", libelle: "Espace client" };
export const LIEN_ZONES: EntreeNavigation = { href: "/zones", libelle: "Zones d'intervention" };
/** Mission 19 : /inspirations, au pied de page seulement (le menu garde ses quatre entrées). */
export const LIEN_INSPIRATIONS: EntreeNavigation = { href: "/inspirations", libelle: "Inspirations" };

/** Le pied de page : le contact et l'espace client d'abord, puis le menu, les inspirations et les zones. */
export const LIENS_PIED: readonly EntreeNavigation[] = [LIEN_CONTACT, LIEN_ESPACE_CLIENT, ...ENTREES_MENU, LIEN_INSPIRATIONS, LIEN_ZONES];
