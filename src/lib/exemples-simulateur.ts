import { PAIRES_SERIE_2, type PaireAmbiance, type PieceAmbiance } from "@/data/ambiances";
import { ambianceDeLImage } from "./ambiances";
import type { MatiereCartel } from "./cartel";
import { DOSSIER_IMAGES, sourcesPhoto, type ManifesteImages, type SourcesPhoto } from "./images-preparees";
import { MANIFESTE_IMAGES } from "./images-manifeste";
import { lienMatiere, matiereCartel } from "./matieres-vedettes";

/**
 * « Pas de photo sous la main ? » (site 3.0, lot E3) : les 18 avants de la série 2, proposés à l'étape Photo du
 * simulateur comme « une pièce comme la vôtre ». Chacun porte son aspect, écrit à la main (« Hêtre », « Blanc jauni »,
 * « Bordeaux brillant »…), sa forme (« Cuisine en L »), et ses deux après de la bibliothèque, résolus ici avec leurs
 * matières (cartels, liens vers les fiches). Côté SERVEUR : `simulateur/page.tsx` les passe en propriétés, le
 * catalogue et le manifeste entiers ne partent pas dans le navigateur.
 *
 * Choisir un exemple affiche ses deux après tout de suite, sans appel à l'API (`ExemplesPhoto`). « Essayer d'autres
 * matières sur cette pièce » charge l'avant en pleine taille (`fichier` : la plus grande largeur préparée, prise au
 * manifeste — 1536 px en paysage, 1024 px en portrait) et le fait passer par le chemin d'une photo de visiteur.
 * Toutes ces images sont générées : « Ambiance · avant / après », jamais « Simulation ».
 */

/** Ce qui distingue chaque pièce d'exemple à l'œil : son aspect d'aujourd'hui, puis sa forme. */
const ASPECTS: Readonly<Record<string, { aspect: string; forme: string }>> = {
  "cuisine-bordeaux-brillante-avant": { aspect: "Bordeaux brillant", forme: "Cuisine en L" },
  "cuisine-blanche-jaunie-avant": { aspect: "Blanc jauni", forme: "Cuisine sur un mur" },
  "cuisine-kitchenette-studio-avant": { aspect: "Blanc brillant", forme: "Kitchenette de studio" },
  "cuisine-l-hetre-avant": { aspect: "Hêtre", forme: "Cuisine en L" },
  "cuisine-u-pavillon-avant": { aspect: "Chêne doré", forme: "Cuisine en U" },
  "cuisine-couloir-avant": { aspect: "Blanc usé", forme: "Cuisine couloir" },
  "cuisine-ouverte-bar-avant": { aspect: "Taupe et blanc", forme: "Cuisine ouverte avec bar" },
  "cuisine-merisier-avant": { aspect: "Merisier", forme: "Cuisine sur un mur" },
  "cuisine-grise-brillante-avant": { aspect: "Anthracite brillant", forme: "Cuisine en L" },
  "cuisine-maison-de-village-avant": { aspect: "Orange", forme: "Maison de village" },
  "cuisine-ilot-maison-avant": { aspect: "Beige brillant", forme: "Cuisine avec îlot" },
  "sdb-petit-meuble-vasque-avant": { aspect: "Blanc", forme: "Petit meuble vasque" },
  "sdb-double-vasque-wenge-avant": { aspect: "Wengé", forme: "Double vasque" },
  "sdb-baignoire-tablier-avant": { aspect: "Érable", forme: "Baignoire et meuble vasque" },
  "placard-coulissant-chambre-avant": { aspect: "Blanc", forme: "Placard coulissant" },
  "portes-couloir-avant": { aspect: "Blanc jauni", forme: "Portes de couloir" },
  "buffet-salle-a-manger-avant": { aspect: "Teck orangé", forme: "Buffet bas" },
  "pro-comptoir-accueil-avant": { aspect: "Hêtre", forme: "Comptoir d'accueil" },
};

export type MatiereExemple = { surfaces: string; matiere: MatiereCartel; lien: string };

export type VersionExemple = { id: string; titre: string; alt: string; sources: SourcesPhoto; matieres: MatiereExemple[] };

export type ExempleSimulateur = {
  /** L'avant sans « -avant » (« cuisine-bordeaux-brillante ») : la méta `exemple` de PHOTO_CHARGEE et la note du devis. */
  id: string;
  piece: PieceAmbiance;
  aspect: string;
  forme: string;
  ratio: string;
  altAvant: string;
  avant: SourcesPhoto;
  /** L'avant en pleine taille (JPEG, adresse versionnée), chargé seulement par « Essayer d'autres matières sur cette pièce ». */
  fichier: string;
  versions: VersionExemple[];
};

/** L'avant en pleine taille : la plus grande largeur préparée au manifeste (jamais une largeur supposée), en JPEG. */
export function fichierPleineTaille(nom: string, manifeste: ManifesteImages = MANIFESTE_IMAGES): string | null {
  const entree = Object.prototype.hasOwnProperty.call(manifeste, nom) ? manifeste[nom] : undefined;
  if (!entree || entree.largeurs.length === 0) return null;
  const largeur = Math.max(...entree.largeurs);
  return `${DOSSIER_IMAGES}/${nom}-${largeur}.jpg${entree.empreinte ? `?v=${entree.empreinte}` : ""}`;
}

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Les matières d'un après, une fois chacune (les surfaces d'une même référence réunies), avec le lien de leur fiche. */
function matieresDe(surfaces: readonly { surface: string; ref: string; nom: string; famille: string; hex: string }[]): MatiereExemple[] {
  const parRef = new Map<string, { surfaces: string[]; ref: string; repli: MatiereCartel }>();
  for (const s of surfaces) {
    const deja = parRef.get(s.ref);
    if (deja) deja.surfaces.push(s.surface);
    else parRef.set(s.ref, { surfaces: [s.surface], ref: s.ref, repli: { id: s.ref, nom: s.nom, famille: s.famille, hex: s.hex } });
  }
  return [...parRef.values()].map((m) => ({ surfaces: majuscule(m.surfaces.join(" et ")), matiere: matiereCartel(m.ref) ?? m.repli, lien: lienMatiere(m.ref) }));
}

function exempleDe(paire: PaireAmbiance, manifeste: ManifesteImages): ExempleSimulateur {
  const nom = paire.avant;
  const reperes = ASPECTS[nom];
  const avant = sourcesPhoto(nom, manifeste);
  const fichier = fichierPleineTaille(nom, manifeste);
  if (!reperes || !avant || !fichier) throw new Error(`Exemple du simulateur ${nom} : aspect ou image manquants.`);
  const versions = paire.apres.map((id) => {
    const ambiance = ambianceDeLImage(id);
    const sources = ambiance ? sourcesPhoto(ambiance.image, manifeste) : null;
    if (!ambiance || !sources) throw new Error(`Exemple du simulateur ${nom} : l'après ${id} manque.`);
    return { id: ambiance.id, titre: ambiance.titre, alt: ambiance.alt, sources, matieres: matieresDe(ambiance.surfaces) };
  });
  return { id: nom.replace(/-avant$/, ""), piece: paire.piece, aspect: reperes.aspect, forme: reperes.forme, ratio: paire.ratio, altAvant: `${paire.scene}. Image d'ambiance.`, avant, fichier, versions };
}

/** Les 18 exemples, dans l'ordre de la bibliothèque ; `pieces` : seulement celles que le simulateur publie. */
export function exemplesSimulateur({ pieces, manifeste = MANIFESTE_IMAGES }: { pieces?: readonly string[]; manifeste?: ManifesteImages } = {}): ExempleSimulateur[] {
  return PAIRES_SERIE_2.filter((p) => !pieces || pieces.includes(p.piece)).map((p) => exempleDe(p, manifeste));
}
