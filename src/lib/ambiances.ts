import { AMBIANCES, type Ambiance, type PieceAmbiance, type SurfaceAmbiance } from "@/data/ambiances";
import revetements from "@/data/revetements.json";

/**
 * Ce qu'on tire des ambiances (mission 19, `data/ambiances.ts`) : les matières de chaque photo résolues dans le
 * catalogue (nom, famille, couleur), le texte alternatif, le lien « Essayer cette composition chez moi », les teintes
 * de /inspirations et le « Vue dans » de /matieres. Fonctions pures, appelées côté serveur : le catalogue entier ne
 * part pas dans le navigateur, seulement les matières d'une image (`AmbianceResolue`).
 */
type Revetement = { id: string; nom: string; famille: string; hex: string };
const CATALOGUE = revetements as Revetement[];
const PAR_ID = new Map(CATALOGUE.map((r) => [r.id, r]));

export type MatiereAmbiance = Omit<SurfaceAmbiance, "prevue"> & {
  nom: string;
  famille: string;
  hex: string;
  teinte: Teinte;
};
export type AmbianceResolue = Omit<Ambiance, "surfaces"> & {
  surfaces: MatiereAmbiance[];
  alt: string;
  lienComposition: string;
};

/* ── Teintes ─────────────────────────────────────────────────────── */

export const TEINTES = ["Bois clair", "Bois foncé", "Vert", "Bleu", "Blanc", "Noir", "Beige et taupe", "Terre cuite", "Pierre et marbre"] as const;
export type Teinte = (typeof TEINTES)[number];

const lineaire = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** sRGB → Lab (D65). */
export function lab(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(lineaire);
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const fx = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047);
  const fy = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b);
  const fz = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * La teinte d'une matière, pour le filtre de /inspirations : la famille d'abord (bois clair ou foncé, sauf un bois
 * teinté de vert ; pierre et marbre), puis la couleur (clarté, saturation, angle de teinte en Lab).
 */
export function teinteDe(famille: string, hex: string): Teinte {
  const [L, a, b] = lab(hex);
  const C = Math.hypot(a, b);
  const h = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  // Un bois teinté de vert (Smokey Green) se cherche avec les verts.
  if (famille === "bois") return C >= 5 && h >= 95 && h < 200 ? "Vert" : L >= 55 ? "Bois clair" : "Bois foncé";
  if (famille === "pierre") return L >= 85 && C < 6 ? "Blanc" : "Pierre et marbre";
  if (L >= 85 && C < 8) return "Blanc";
  if (L < 22 && C < 12) return "Noir";
  if (C >= 5 && h >= 95 && h < 200) return "Vert";
  if (C >= 8 && h >= 200 && h < 300) return "Bleu";
  if (C >= 14 && (h < 70 || h >= 330)) return "Terre cuite";
  return "Beige et taupe";
}

/* ── Résolution ─────────────────────────────────────────────────── */

/** Le lien du simulateur avec la pièce et les références posées par zone (`?ref=zone:REF,…`, `lib/simulateur/matiere-demandee`). */
export function lienComposition(piece: PieceAmbiance, surfaces: readonly Pick<SurfaceAmbiance, "zone" | "ref">[]): string {
  const posees = surfaces.filter((s): s is { zone: string; ref: string } => !!s.zone);
  const vues = new Set<string>();
  const uniques = posees.filter((s) => (vues.has(s.zone) ? false : (vues.add(s.zone), true)));
  return `/simulateur?projet=${piece}${uniques.length ? `&ref=${uniques.map((s) => `${s.zone}:${s.ref}`).join(",")}` : ""}`;
}

/** « Sage Green RM20 » : le nom et la référence, comme sur l'étiquette. */
export const nomMatiere = (m: Pick<MatiereAmbiance, "nom" | "ref">) => `${m.nom} ${m.ref}`;

/** Le texte alternatif : la scène, puis chaque surface et sa matière ; il dit que c'est une image d'ambiance. */
export function altAmbiance(scene: string, surfaces: readonly Pick<MatiereAmbiance, "surface" | "nom" | "ref">[]): string {
  const liste = surfaces.map((s) => `${s.surface} ${nomMatiere(s)}`).join(", ");
  return `${scene}. ${liste.charAt(0).toUpperCase()}${liste.slice(1)}. Image d'ambiance aux teintes du catalogue.`;
}

export function resoudre(a: Ambiance): AmbianceResolue {
  const surfaces = a.surfaces.map(({ prevue: _prevue, ...s }) => {
    void _prevue;
    const r = PAR_ID.get(s.ref);
    if (!r) throw new Error(`Ambiance ${a.id} : référence ${s.ref} absente du catalogue.`);
    return {
      ...s,
      nom: r.nom,
      famille: r.famille,
      hex: r.hex.toUpperCase(),
      teinte: teinteDe(r.famille, r.hex),
    };
  });
  return {
    ...a,
    surfaces,
    alt: altAmbiance(a.scene, surfaces),
    lienComposition: lienComposition(a.piece, surfaces),
  };
}

/** Toutes les ambiances résolues, dans l'ordre de `data/ambiances`. */
export function ambiances(liste: readonly Ambiance[] = AMBIANCES): AmbianceResolue[] {
  return liste.map(resoudre);
}

/** L'ambiance d'une image (nom du manifeste, « après » ou « avant »), si elle en a une. */
export function ambianceDeLImage(nom: string, liste: readonly Ambiance[] = AMBIANCES): AmbianceResolue | null {
  const a = liste.find((x) => x.image === nom || x.avant === nom);
  return a ? resoudre(a) : null;
}

/** Les ambiances de /inspirations. */
export const inspirations = (liste: readonly Ambiance[] = AMBIANCES) => ambiances(liste).filter((a) => a.inspiration);

/** Les pièces de /inspirations, dans l'ordre du simulateur, avec leur libellé. */
export const PIECES_INSPIRATION: readonly {
  id: PieceAmbiance;
  libelle: string;
}[] = [
  { id: "cuisine", libelle: "Cuisine" },
  { id: "salle-de-bain", libelle: "Salle de bain" },
  { id: "meubles", libelle: "Meubles" },
  { id: "mur-plafond", libelle: "Murs" },
  { id: "professionnel", libelle: "Pro" },
];

/** « Vue dans » de /matieres : pour chaque référence, les ambiances (d'inspiration) où elle apparaît. */
export function vueDans(liste: readonly Ambiance[] = AMBIANCES): Record<string, { id: string; titre: string }[]> {
  const parRef: Record<string, { id: string; titre: string }[]> = {};
  for (const a of liste) {
    if (!a.inspiration) continue;
    for (const s of a.surfaces) {
      const deja = (parRef[s.ref] ??= []);
      if (!deja.some((x) => x.id === a.id)) deja.push({ id: a.id, titre: a.titre });
    }
  }
  return parRef;
}

/** L'ancre d'une ambiance sur /inspirations. */
export const lienInspiration = (id: string) => `/inspirations#${id}`;
