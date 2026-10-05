/**
 * Ce que montre chaque page de prestation (site 3.0, lot C1 ; énoncé, § C.2) : son ouverture (une paire d'ambiance
 * avant / après, quand aucune réalisation publiée de la pièce n'a ses deux photos), ses cas (des images d'ambiance des
 * séries 1 et 2, chacune avec « Essayer cette composition chez moi ») et ses matières vedettes (des références du
 * catalogue, en vrais échantillons). Aucune image n'est à la fois l'ouverture et un cas.
 *
 *  - cuisine : la bordeaux brillante passée en Deep Green NF13 (la paire et la légende de l'accueil, énoncé § C.1),
 *    puis les dix autres cuisines de la série 2 et la cuisine familiale ;
 *  - salle de bain : les trois salles de bain de la série 2 (la baignoire en ouverture) ;
 *  - meubles : le buffet (série 2) en ouverture, puis le placard coulissant, les portes de couloir (paire et ambiance),
 *    le dressing et le meuble TV (série 1) ;
 *  - vitrages : rien (page inchangée) ; professionnel : `/pro` (301).
 *
 * Chaque avant de la série 2 a deux après : on montre celui dont le plus grand ΔE affiché est le plus petit (le plus
 * fidèle au catalogue, la règle de l'accueil, `scripts/bibliotheque/serie-2.json`), sauf la bordeaux, dont l'énoncé
 * fixe l'après. Les noms sont ceux du manifeste des images (`lib/images-manifeste`) ; un cas sans image préparée est
 * sauté au rendu.
 */
export type OuverturePrestation = {
  avant: string;
  apres: string;
  /** Ce que montre la paire, sous l'image : l'avant, puis les matières posées. */
  legende: string;
};

export type CasPrestation = {
  ouverture: OuverturePrestation;
  /** Le titre de la section des cas. */
  titreCas: string;
  /** La fin du titre des vedettes (« Des matières pour … »). */
  pourVotre: string;
  /** Les images « après » (ou seules) des cas, dans l'ordre de la page. */
  cas: readonly string[];
  /** Les références du catalogue montrées en échantillons. */
  vedettes: readonly string[];
};

export const CAS_PRESTATIONS: Readonly<Record<"cuisine" | "salle-de-bain" | "meubles", CasPrestation>> = {
  cuisine: {
    ouverture: {
      avant: "cuisine-bordeaux-brillante-avant",
      apres: "cuisine-bordeaux-brillante-apres-couleur",
      legende: "Cuisine des années 2000, façades bordeaux brillantes → Deep Green NF13, plan Pale Oak AG13. Posé en une journée.",
    },
    titreCas: "D'autres cuisines, transformées",
    pourVotre: "votre cuisine",
    cas: [
      "cuisine-blanche-jaunie-apres-bois",
      "cuisine-l-hetre-apres-couleur",
      "cuisine-merisier-apres-couleur",
      "cuisine-u-pavillon-apres-bois",
      "cuisine-grise-brillante-apres-couleur",
      "cuisine-maison-de-village-apres-couleur",
      "cuisine-kitchenette-studio-apres-couleur",
      "cuisine-couloir-apres-couleur",
      "cuisine-ouverte-bar-apres-bois",
      "cuisine-ilot-maison-apres-neutre",
      "amb-cuisine-familiale",
    ],
    vedettes: ["NF13", "RM20", "NF14", "NE83", "AA14", "AG13", "U50", "NE31"],
  },
  "salle-de-bain": {
    ouverture: {
      avant: "sdb-baignoire-tablier-avant",
      apres: "sdb-baignoire-tablier-apres-couleur",
      legende: "Salle de bain, tablier de baignoire blanc et meuble vasque effet érable → Deep Green NF13 sur les deux. La faïence reste en place.",
    },
    titreCas: "D'autres salles de bain, transformées",
    pourVotre: "votre salle de bain",
    cas: ["sdb-petit-meuble-vasque-apres-bois", "sdb-double-vasque-wenge-apres-neutre"],
    vedettes: ["NF13", "M6", "NE83", "RM26", "NH22", "AA14", "AG13", "NE31"],
  },
  meubles: {
    ouverture: {
      avant: "buffet-salle-a-manger-avant",
      apres: "buffet-salle-a-manger-apres-neutre",
      legende: "Buffet des années 1970 effet teck orangé → portes et tiroirs Bird Nest NH29, dessus Original Oak AA14, sans le démonter.",
    },
    titreCas: "D'autres meubles, transformés",
    pourVotre: "vos meubles",
    cas: ["placard-coulissant-chambre-apres-couleur", "portes-couloir-apres-bois", "amb-couloir-portes", "meubles-armoire", "etude-meubles-apres"],
    vedettes: ["NH12", "NH29", "RM16", "RM30", "NF13", "D1", "AA14", "NF04"],
  },
};

/** Les cas d'une page de prestation, ou `null` (vitrages, professionnel, inconnue). */
export function casDeLaPrestation(slug: string): CasPrestation | null {
  return Object.prototype.hasOwnProperty.call(CAS_PRESTATIONS, slug) ? CAS_PRESTATIONS[slug as keyof typeof CAS_PRESTATIONS] : null;
}
