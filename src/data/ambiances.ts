/**
 * Les ambiances du site (mission 19) : la SOURCE UNIQUE de ce que montre chaque photo d'ambiance générée — ses
 * revêtements (référence du catalogue `revetements.json`), la zone du simulateur de chacun, et où poser l'étiquette
 * matière par-dessus l'image (couche HTML : nette, lisible par Google, modifiable ici sans refaire l'image).
 * Les textes alternatifs, la page /inspirations, les étiquettes, le lien « Essayer cette composition chez moi » et le
 * « Vue dans » de /matieres en sont tirés (`lib/ambiances`).
 *
 * Les références sont celles relevées sur les photos le 01/10/2026 : couleur médiane mesurée (ΔE 2000 ≤ 12 contre le
 * hex du catalogue, après balance des blancs), texture comparée à la vignette réelle. Quand l'étiquette a remplacé
 * la référence de la direction artistique (`docs/direction-artistique-photos.md`), `prevue` garde celle-ci.
 * Relevé et outil : `crm-coverswap/scripts/teintes-site-v2.json`, `scripts/teintes-ambiances.ts`.
 *
 * Coordonnées en % de l'image (0 = bord gauche / haut) :
 *  - `ancre` : un point SUR la surface (le point de l'étiquette ; le numéro sur téléphone) ;
 *  - `etiquette` : où poser l'étiquette, dans un vide (mur, plafond, sol), jamais sur une façade ; `vers` : le côté
 *    vers lequel elle s'étend depuis ce point.
 * Trois étiquettes au plus par image.
 */
export type PieceAmbiance = "cuisine" | "salle-de-bain" | "meubles" | "mur-plafond" | "professionnel";

export type SurfaceAmbiance = {
  /** Ce que désigne l'étiquette, en français (« meubles hauts et colonne »). */
  surface: string;
  ref: string;
  /** Le nom de la référence au catalogue (vérifié par les tests) : les cartes l’affichent sans charger le catalogue. */
  nom: string;
  /** La référence de la direction artistique, quand l'étiquette en a changé. */
  prevue?: string;
  /** La zone du simulateur (`lib/simulateur/zones`) qui reçoit cette référence ; absente si le simulateur ne la sépare pas. */
  zone?: string;
  ancre: { x: number; y: number };
  etiquette: { x: number; y: number; vers: "droite" | "gauche" };
};

export type Ambiance = {
  id: string;
  /** L'image « après » (nom du manifeste `lib/images-manifeste`). */
  image: string;
  /** L'image « avant » d'une paire calée (même cadrage, matières d'origine). */
  avant?: string;
  /** La pièce du simulateur (`?projet=`), et le filtre « pièce » de /inspirations. */
  piece: PieceAmbiance;
  /** Le titre de la carte d'inspiration. */
  titre: string;
  /** Ce que montre la photo (début du texte alternatif). */
  scene: string;
  /** Montrée sur /inspirations (une photo d'étape ne l'est pas). */
  inspiration: boolean;
  surfaces: SurfaceAmbiance[];
};

export const AMBIANCES: readonly Ambiance[] = [
  {
    id: "cuisine-sauge-bois-clair",
    image: "ouverture-cuisine-apres",
    avant: "ouverture-cuisine-avant",
    piece: "cuisine",
    titre: "Cuisine en U, sauge et bois clair",
    scene: "Cuisine en U baignée de lumière, meubles bas vert sauge, meubles hauts et colonnes en bois clair, plan de travail marbre blanc",
    inspiration: true,
    surfaces: [
      {
        surface: "meubles bas et tiroirs",
        ref: "RM20",
        nom: "Sage Green",
        zone: "meubles-bas",
        ancre: { x: 58, y: 64 },
        etiquette: { x: 55, y: 88, vers: "droite" },
      },
      {
        surface: "meubles hauts et colonne",
        ref: "I14",
        nom: "Legno",
        prevue: "AG13",
        zone: "meubles-hauts",
        ancre: { x: 88, y: 30 },
        etiquette: { x: 58, y: 5, vers: "droite" },
      },
      {
        surface: "plan de travail",
        ref: "NE31",
        nom: "Statuary White",
        zone: "plan-de-travail",
        ancre: { x: 69, y: 50.3 },
        etiquette: { x: 67, y: 45, vers: "gauche" },
      },
    ],
  },
  {
    id: "salle-de-bain-taupe-marbre",
    image: "etude-salle-de-bain-apres",
    avant: "etude-salle-de-bain-avant",
    piece: "salle-de-bain",
    titre: "Salle de bain taupe et marbre",
    scene: "Salle de bain claire, meuble double vasque suspendu aux tiroirs taupe, plan marbre blanc, douche à l'italienne",
    inspiration: true,
    surfaces: [
      {
        surface: "tiroirs",
        ref: "K4",
        nom: "Khaki",
        prevue: "NH26",
        zone: "meuble-vasque",
        ancre: { x: 63, y: 66 },
        etiquette: { x: 52, y: 93, vers: "droite" },
      },
      {
        surface: "plan vasque",
        ref: "NE31",
        nom: "Statuary White",
        zone: "plan-vasque",
        ancre: { x: 62, y: 51.5 },
        etiquette: { x: 60, y: 20, vers: "droite" },
      },
    ],
  },
  {
    id: "meuble-tv-terre-cuite",
    image: "etude-meubles-apres",
    avant: "etude-meubles-avant",
    piece: "meubles",
    titre: "Meuble TV terre cuite et chêne clair",
    scene: "Salon lumineux, meuble TV et deux colonnes aux façades terre cuite mates, dessus en chêne clair",
    inspiration: true,
    surfaces: [
      {
        surface: "façades",
        ref: "NH12",
        nom: "Terracotta Stucco",
        zone: "meuble-tv",
        ancre: { x: 79, y: 35 },
        etiquette: { x: 72, y: 12, vers: "gauche" },
      },
      {
        surface: "dessus",
        ref: "AA17",
        nom: "Beige Line Oak",
        prevue: "AG13",
        ancre: { x: 58, y: 54.6 },
        etiquette: { x: 40, y: 73, vers: "droite" },
      },
    ],
  },
  {
    id: "dressing-vert-tendre",
    image: "meubles-armoire",
    avant: "meubles-dressing-avant",
    piece: "meubles",
    titre: "Dressing vert tendre, poignées dorées",
    scene: "Chambre claire, dressing du sol au plafond aux portes vert tendre et poignées dorées",
    inspiration: true,
    surfaces: [
      {
        surface: "portes",
        ref: "RM30",
        nom: "Pastel Olive Green",
        zone: "portes-dressing",
        ancre: { x: 68, y: 45 },
        etiquette: { x: 96, y: 5, vers: "gauche" },
      },
    ],
  },
  {
    id: "bar-noir-pierre",
    image: "pro-restaurant",
    avant: "pro-restaurant-avant",
    piece: "professionnel",
    titre: "Bar noir mat, pierre et noyer",
    scene: "Restaurant aux grandes fenêtres, bar et arrière-bar noir mat, dessus effet pierre grise, étagères en noyer",
    inspiration: true,
    surfaces: [
      {
        surface: "façade du bar et arrière-bar",
        ref: "K1",
        nom: "Black Mat",
        zone: "comptoir-habillage",
        ancre: { x: 58, y: 57 },
        etiquette: { x: 55, y: 76, vers: "droite" },
      },
      {
        surface: "dessus du bar",
        ref: "NF99",
        nom: "Lombarda Grigio",
        zone: "comptoir-plateau",
        ancre: { x: 62, y: 47.2 },
        etiquette: { x: 63, y: 5, vers: "droite" },
      },
      {
        surface: "étagères",
        ref: "D1",
        nom: "Classic Walnut",
        zone: "mobilier-pro",
        ancre: { x: 52, y: 30 },
        etiquette: { x: 54, y: 13, vers: "droite" },
      },
    ],
  },
  {
    id: "cuisine-ilot-vert",
    image: "piece-cuisine",
    piece: "cuisine",
    titre: "Îlot vert de gris, colonnes grège",
    scene: "Cuisine ouverte sur les collines, îlot vert de gris, colonnes grège, plan et joue en chêne",
    inspiration: true,
    surfaces: [
      {
        surface: "îlot",
        ref: "NH15",
        nom: "Smokey Green",
        zone: "meubles-bas",
        ancre: { x: 55, y: 74 },
        etiquette: { x: 4, y: 93, vers: "droite" },
      },
      {
        surface: "colonnes",
        ref: "NH26",
        nom: "Grayed Beige",
        zone: "meubles-hauts",
        ancre: { x: 70, y: 25 },
        etiquette: { x: 47, y: 5, vers: "gauche" },
      },
      {
        surface: "plan et joue",
        ref: "AA14",
        nom: "Original Oak",
        prevue: "AG13",
        zone: "plan-de-travail",
        ancre: { x: 77, y: 72 },
        etiquette: { x: 97, y: 95, vers: "gauche" },
      },
    ],
  },
  {
    id: "salle-de-bain-chene-pierre",
    image: "piece-salle-de-bain",
    piece: "salle-de-bain",
    titre: "Meuble vasque chêne, plan pierre beige",
    scene: "Salle de bain méditerranéenne, meuble vasque suspendu en chêne, plan effet pierre beige",
    inspiration: true,
    surfaces: [
      {
        surface: "tiroirs",
        ref: "B4",
        nom: "Weathered Oak",
        prevue: "AG13",
        zone: "meuble-vasque",
        ancre: { x: 55, y: 70 },
        etiquette: { x: 22, y: 86, vers: "droite" },
      },
      {
        surface: "plan",
        ref: "MK15",
        nom: "Raw Travertine",
        zone: "plan-vasque",
        ancre: { x: 45, y: 55.5 },
        etiquette: { x: 21, y: 22, vers: "droite" },
      },
    ],
  },
  {
    id: "buffet-bleu-nuit",
    image: "piece-meubles",
    piece: "meubles",
    titre: "Buffet bleu nuit, dessus chêne",
    scene: "Salle à manger face à la mer, buffet bas aux portes bleu nuit, dessus en chêne clair",
    inspiration: true,
    surfaces: [
      {
        surface: "portes",
        ref: "RM23",
        nom: "Royal Blue",
        prevue: "M9",
        zone: "meuble-complet",
        ancre: { x: 45, y: 56 },
        etiquette: { x: 40, y: 76, vers: "droite" },
      },
      {
        surface: "dessus",
        ref: "AG13",
        nom: "Pale Oak",
        ancre: { x: 60, y: 40 },
        etiquette: { x: 23, y: 8, vers: "droite" },
      },
    ],
  },
  {
    id: "chambre-pierre",
    image: "piece-murs",
    piece: "mur-plafond",
    titre: "Tête de lit effet pierre",
    scene: "Chambre apaisante, mur de tête de lit habillé d'un effet pierre grège",
    inspiration: true,
    surfaces: [
      {
        surface: "mur",
        ref: "NF99",
        nom: "Lombarda Grigio",
        zone: "mur-principal",
        ancre: { x: 55, y: 25 },
        etiquette: { x: 40, y: 5, vers: "droite" },
      },
    ],
  },
  {
    id: "comptoir-noyer",
    image: "piece-pro",
    piece: "professionnel",
    titre: "Comptoir noyer, dessus noir",
    scene: "Entrée d'un local aux murs blancs, comptoir en noyer au dessus noir",
    inspiration: true,
    surfaces: [
      {
        surface: "façade",
        ref: "D1",
        nom: "Classic Walnut",
        zone: "comptoir-habillage",
        ancre: { x: 50, y: 65 },
        etiquette: { x: 24, y: 88, vers: "droite" },
      },
      {
        surface: "dessus",
        ref: "RM29",
        nom: "Onyx",
        prevue: "K1",
        zone: "comptoir-plateau",
        ancre: { x: 62, y: 44.8 },
        etiquette: { x: 22, y: 10, vers: "droite" },
      },
    ],
  },
  {
    id: "hotel-noyer",
    image: "pro-hotel",
    piece: "professionnel",
    titre: "Chambre d'hôtel, noyer et taupe",
    scene: "Chambre d'hôtel lumineuse, mur de tête de lit en noyer, placards taupe",
    inspiration: true,
    surfaces: [
      {
        surface: "mur de tête de lit",
        ref: "D1",
        nom: "Classic Walnut",
        zone: "habillage-mural",
        ancre: { x: 30, y: 15 },
        etiquette: { x: 30, y: 5, vers: "droite" },
      },
      {
        surface: "placards",
        ref: "NE55",
        nom: "Caffe Latte",
        prevue: "NH26",
        zone: "rangements-pro",
        ancre: { x: 57, y: 25 },
        etiquette: { x: 95, y: 92, vers: "gauche" },
      },
    ],
  },
  {
    id: "boutique-bois-blond",
    image: "pro-commerce",
    piece: "professionnel",
    titre: "Boutique bois blond et blanc",
    scene: "Boutique de décoration sous voûte, comptoir central en bois blond, meubles blancs",
    inspiration: true,
    surfaces: [
      {
        surface: "façades bois",
        ref: "NE68",
        nom: "Freijo Laurel",
        prevue: "AG13",
        zone: "comptoir-habillage",
        ancre: { x: 32, y: 62 },
        etiquette: { x: 26, y: 5, vers: "droite" },
      },
      {
        surface: "façades blanches",
        ref: "NH27",
        nom: "White Fog",
        zone: "rangements-pro",
        ancre: { x: 55, y: 58 },
        etiquette: { x: 50, y: 84, vers: "droite" },
      },
    ],
  },
  {
    id: "bureaux-sauge-bois-blond",
    image: "pro-bureaux",
    piece: "professionnel",
    titre: "Salle de réunion vert sauge et bois blond",
    scene: "Salle de réunion lumineuse, rangements muraux vert sauge rythmés de panneaux en bois blond",
    inspiration: true,
    surfaces: [
      {
        surface: "rangements verts",
        ref: "RM20",
        nom: "Sage Green",
        zone: "rangements-pro",
        ancre: { x: 41, y: 22 },
        etiquette: { x: 46, y: 5, vers: "droite" },
      },
      {
        surface: "rangements bois",
        ref: "AL26",
        nom: "Beige Brown Ash",
        prevue: "AG13",
        zone: "habillage-mural",
        ancre: { x: 31, y: 25 },
        etiquette: { x: 2, y: 80, vers: "droite" },
      },
    ],
  },
  {
    id: "salon-marbre",
    image: "mur-salon",
    piece: "mur-plafond",
    titre: "Mur effet marbre blanc",
    scene: "Salon lumineux, mur TV habillé d'un effet marbre blanc veiné de gris",
    inspiration: true,
    surfaces: [
      {
        surface: "mur",
        ref: "NE31",
        nom: "Statuary White",
        zone: "mur-principal",
        ancre: { x: 76, y: 22 },
        etiquette: { x: 55, y: 5, vers: "droite" },
      },
    ],
  },
  {
    id: "pose-sauge",
    image: "etape-pose",
    piece: "cuisine",
    titre: "La pose du film",
    scene: "Pose d'un film vert sauge sur une façade de cuisine, à la raclette",
    inspiration: false,
    surfaces: [
      {
        surface: "film posé",
        ref: "RM20",
        nom: "Sage Green",
        zone: "meubles-bas",
        ancre: { x: 30, y: 30 },
        etiquette: { x: 4, y: 8, vers: "droite" },
      },
    ],
  },
];
