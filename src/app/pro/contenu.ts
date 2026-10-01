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
  { nom: "pro-hotel", titre: "Hôtel", ligne: "Chambres, têtes de lit et placards." },
  { nom: "pro-commerce", titre: "Commerce", ligne: "Comptoir et mobilier." },
  { nom: "pro-bureaux", titre: "Bureaux", ligne: "Rangements et salles de réunion." },
] as const;

/** Mission 19 : la paire avant / après du restaurant (l'« après » ; son « avant » est dans `data/ambiances`). */
export const PAIRE_PRO = { nom: "pro-restaurant", titre: "Un bar, avant et après", ligne: "Le même bar en pin verni des années 2000, puis habillé de noir mat, de pierre et de noyer." } as const;

export const ARGUMENTS_PRO = [
  { titre: "Sans fermeture", texte: "De nuit ou hors service." },
  { titre: "Résistant", texte: "Film conçu pour l'usage intensif, nettoyage courant." },
  { titre: "Sur devis", texte: "Après une visite ou sur vos photos." },
] as const;

/** Le formulaire : le type de lieu (liste fermée) et la source CRM, explicite (le CRM n'a rien à deviner). */
export const TYPES_DE_LIEU = ["Hôtel", "Restaurant", "Commerce", "Bureaux", "Autre"] as const;
export const SOURCE_FORMULAIRE_PRO = "SITE_PRO";
