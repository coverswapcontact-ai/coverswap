/**
 * Les adresses du menu et du pied de page (mission 16) : une seule liste, lue
 * par l'en-tête (`EnteteSite`), le menu du téléphone (`MenuMobile`) et le
 * pied de page (`PiedDePage`). Changer une adresse ici la change partout.
 *  - le menu : cinq entrées (site 3.0, lot B5 : Inspirations y entre, comme dans
 *    la maquette validée) ; « Simuler ma pièce » est un lien rouge à part, qui
 *    dit d'où il vient (`depuis=entete`, lu par le simulateur : docs/SUIVI.md) ;
 *  - l'espace client n'a pas d'index (`/e/<jeton>` arrive par SMS ou e-mail) :
 *    le pied mène à la carte « Votre espace client » de `/contact`. Pas au
 *    menu (énoncé § 5).
 */
export type EntreeNavigation = { href: string; libelle: string };

export const ENTREES_MENU: readonly EntreeNavigation[] = [
  { href: "/matieres", libelle: "Matières" },
  { href: "/inspirations", libelle: "Inspirations" },
  { href: "/realisations", libelle: "Réalisations" },
  { href: "/comment-ca-marche", libelle: "Comment ça marche" },
  { href: "/pro", libelle: "Pro" },
];

export const LIEN_SIMULER: EntreeNavigation = { href: "/simulateur?depuis=entete", libelle: "Simuler ma pièce" };
export const LIEN_CONTACT: EntreeNavigation = { href: "/contact", libelle: "Contact" };
export const LIEN_ESPACE_CLIENT: EntreeNavigation = { href: "/contact#espace", libelle: "Espace client" };
export const LIEN_ZONES: EntreeNavigation = { href: "/zones", libelle: "Zones d'intervention" };

/** Le pied de page : le contact et l'espace client d'abord, puis le menu (qui porte les inspirations depuis le lot B5) et les zones. */
export const LIENS_PIED: readonly EntreeNavigation[] = [LIEN_CONTACT, LIEN_ESPACE_CLIENT, ...ENTREES_MENU, LIEN_ZONES];
