/**
 * Les textes courts de /pro (mission 16, partie 4), hors de `page.tsx` (une page Next n'exporte que ses champs
 * connus) : le titre, l'ancre du formulaire, le comptoir de l'ouverture et les lieux de la série 1 (images d'ambiance
 * générées, étiquetées comme telles — jamais des chantiers), les trois arguments. Relus par le test de la page. Rien
 * de lourd ici : le formulaire (client) en lit le type de lieu et la source.
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

/**
 * Site 3.0 (lot C2 ; énoncé, § C.2) : l'ouverture de la page, l'avant / après du comptoir d'accueil d'un cabinet (série 2),
 * l'après « bois » — Classic Walnut D1 et Black Mat K1, les deux teintes du professionnel ; le même que sur l'accueil.
 * Une réalisation PRO publiée par le CRM passe devant (le comptoir descend alors en tête des lieux).
 */
export const PAIRE_COMPTOIR_PRO = {
  avant: "pro-comptoir-accueil-avant",
  apres: "pro-comptoir-accueil-apres-bois",
  titre: "Un comptoir d'accueil, avant et après",
  legende: "Comptoir d'accueil effet hêtre au dessus gris → façade Classic Walnut D1, dessus Black Mat K1.",
} as const;

/**
 * Site 3.0 (lot F5, maillage : trois avant / après par prestation) : l'autre « après » du même comptoir (série 2), vert
 * sauge et marbre — une autre direction pour le même accueil, jamais l'image de l'ouverture répétée.
 */
export const PAIRE_COMPTOIR_PRO_COULEUR = {
  apres: "pro-comptoir-accueil-apres-couleur",
  titre: "Le même comptoir, en clair",
  ligne: "Le même accueil, autre direction : vert sauge et marbre blanc. On compare les deux sur échantillons, sur place.",
} as const;

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
