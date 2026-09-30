/**
 * Les textes courts de /pro (mission 16, partie 4), hors de `page.tsx` (une page Next n'exporte que ses champs
 * connus) : le titre, l'ancre du formulaire, les trois références (images d'ambiance générées, étiquetées comme
 * telles — jamais des chantiers) et les trois arguments. Relus par le test de la page.
 */
export const ANCRE_DEVIS_PRO = "devis-pro";
export const TITRE_PRO = "Vos espaces professionnels, rénovés sans fermer.";
/**
 * La ligne de l'ouverture : courte (deux lignes à 390 px), tirée de l'accroche de l'ancienne page, qui reste en entier
 * sous « en détail » (et dans le balisage HowTo) : aucun texte perdu.
 */
export const LIGNE_PRO = "Comptoirs, mobilier, portes et murs, recouverts hors heures d'ouverture.";

export const REFERENCES_PRO = [
  { nom: "pro-hotel", titre: "Hôtel", ligne: "Chambres et têtes de lit.", alt: "Chambre d'hôtel, tête de lit et placards effet chêne clair, image d'ambiance" },
  { nom: "pro-restaurant", titre: "Restaurant", ligne: "Bar et salle.", alt: "Salle de restaurant, bar effet noyer au plateau effet pierre, image d'ambiance" },
  { nom: "pro-commerce", titre: "Commerce", ligne: "Mobilier et comptoir.", alt: "Boutique, comptoir et mobilier blanc mat et chêne clair, image d'ambiance" },
] as const;

export const ARGUMENTS_PRO = [
  { titre: "Sans fermeture", texte: "De nuit ou hors service." },
  { titre: "Résistant", texte: "Film conçu pour l'usage intensif, nettoyage courant." },
  { titre: "Sur devis", texte: "Après une visite ou sur vos photos." },
] as const;

/** Le formulaire : le type de lieu (liste fermée) et la source CRM, explicite (le CRM n'a rien à deviner). */
export const TYPES_DE_LIEU = ["Hôtel", "Restaurant", "Commerce", "Bureaux", "Autre"] as const;
export const SOURCE_FORMULAIRE_PRO = "SITE_PRO";
