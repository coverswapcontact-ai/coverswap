/**
 * La place que le conteneur d'une page réserve sous son contenu quand elle
 * porte un `BoutonColle` (7 rem : rien ne reste caché dessous). Dans un module
 * sans « use client » : une page SERVEUR peut les importer (exportées depuis
 * `BoutonColle.tsx`, module client, elles y deviendraient des références
 * client au lieu de chaînes, et la classe ne s'appliquerait pas).
 */
export const RESERVE_BOUTON_COLLE = "pb-28";
/** La réserve quand le bouton n'existe que sur mobile (`mobileSeulement`). */
export const RESERVE_BOUTON_COLLE_MOBILE = "pb-28 md:pb-0";
