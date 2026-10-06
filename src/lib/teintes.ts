/**
 * Les teintes des matières (site 3.0, lot D1) : de l'hexadécimal du catalogue (`revetements.json › hex`) à Lab, la
 * différence de couleur ΔE 2000 (CIEDE2000), le rangement d'un nuancier et les matières proches. Fonctions pures,
 * sans dépendance ni « use client » : la page Matières, les fiches et les familles les lisent côté serveur, le
 * présentoir les lit aussi dans le navigateur (tri des matières filtrées). Testées par `teintes.test.ts`.
 *
 * `lib/ambiances` en tire sa conversion (`lab`) pour la teinte du filtre de /inspirations (`teinteDe`) : une seule
 * conversion pour tout le site.
 */

export type Lab = readonly [number, number, number];

const lineaire = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** sRGB → Lab (illuminant D65), depuis « #RRGGBB » (le dièse et la casse sont indifférents). */
export function labDeHex(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(lineaire);
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const fx = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047);
  const fy = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b);
  const fz = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Clarté, chroma et angle de teinte (LCh, en degrés de 0 à 360). */
export function lchDeHex(hex: string): { L: number; C: number; h: number } {
  const [L, a, b] = labDeHex(hex);
  return { L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/**
 * La différence de couleur CIEDE2000 (CIE 142-2001, kL = kC = kH = 1), comme le relevé des ambiances (ΔE 2000 ≤ 12)
 * et le CRM. Symétrique, nulle pour deux couleurs identiques ; un écart sous 2 ne se voit presque pas.
 */
export function deltaE(lab1: Lab, lab2: Lab): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const Cmoy = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cmoy ** 7 / (Cmoy ** 7 + 25 ** 7)));
  const ap1 = (1 + G) * a1;
  const ap2 = (1 + G) * a2;
  const Cp1 = Math.hypot(ap1, b1);
  const Cp2 = Math.hypot(ap2, b2);
  const angle = (b: number, ap: number) => (b === 0 && ap === 0 ? 0 : (deg(Math.atan2(b, ap)) + 360) % 360);
  const hp1 = angle(b1, ap1);
  const hp2 = angle(b2, ap2);

  const dL = L2 - L1;
  const dC = Cp2 - Cp1;
  let dh = 0;
  if (Cp1 * Cp2 !== 0) {
    dh = hp2 - hp1;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(rad(dh / 2));

  const Lmoy = (L1 + L2) / 2;
  const Cpmoy = (Cp1 + Cp2) / 2;
  let hmoy = hp1 + hp2;
  if (Cp1 * Cp2 !== 0) {
    if (Math.abs(hp1 - hp2) <= 180) hmoy /= 2;
    else hmoy = hp1 + hp2 < 360 ? (hmoy + 360) / 2 : (hmoy - 360) / 2;
  }
  const T = 1 - 0.17 * Math.cos(rad(hmoy - 30)) + 0.24 * Math.cos(rad(2 * hmoy)) + 0.32 * Math.cos(rad(3 * hmoy + 6)) - 0.2 * Math.cos(rad(4 * hmoy - 63));
  const dTheta = 30 * Math.exp(-(((hmoy - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(Cpmoy ** 7 / (Cpmoy ** 7 + 25 ** 7));
  const SL = 1 + (0.015 * (Lmoy - 50) ** 2) / Math.sqrt(20 + (Lmoy - 50) ** 2);
  const SC = 1 + 0.045 * Cpmoy;
  const SH = 1 + 0.015 * Cpmoy * T;
  const RT = -Math.sin(rad(2 * dTheta)) * RC;
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}

/** ΔE 2000 entre deux hexadécimaux. */
export const deltaEHex = (hex1: string, hex2: string) => deltaE(labDeHex(hex1), labDeHex(hex2));

/** Les teintes du filtre de /inspirations et du présentoir de /matieres, dans l'ordre des pastilles. */
export const TEINTES = ["Bois clair", "Bois foncé", "Vert", "Bleu", "Blanc", "Noir", "Beige et taupe", "Terre cuite", "Pierre et marbre"] as const;
export type Teinte = (typeof TEINTES)[number];

/**
 * La teinte d'une matière, pour les filtres : la famille d'abord (bois clair ou foncé, sauf un bois teinté de vert ;
 * pierre et marbre), puis la couleur (clarté, saturation, angle de teinte en Lab). Venue de `lib/ambiances` (lot D2).
 */
export function teinteDe(famille: string, hex: string): Teinte {
  const { L, C, h } = lchDeHex(hex);
  // Un bois teinté de vert (Smokey Green) se cherche avec les verts.
  if (famille === "bois") return C >= 5 && h >= 95 && h < 200 ? "Vert" : L >= 55 ? "Bois clair" : "Bois foncé";
  if (famille === "pierre") return L >= 85 && C < 6 ? "Blanc" : "Pierre et marbre";
  const vert = h >= 95 && h < 200;
  const bleu = h >= 200 && h < 300;
  if (L >= 85 && C < 8) return "Blanc";
  // Lot D2 : un vert ou un bleu très foncé mais franc (Deep Green NF13, Midnight Blue M9, Deep Blue NF14) se cherche
  // avec sa couleur, plus avec les noirs.
  if (L < 22 && C < 12 && !(C >= 6 && (vert || bleu))) return "Noir";
  if (C >= 5 && vert) return "Vert";
  if (C >= (L < 22 ? 6 : 8) && bleu) return "Bleu";
  if (C >= 14 && (h < 70 || h >= 330)) return "Terre cuite";
  return "Beige et taupe";
}

/** Sous ce chroma, une matière est un neutre (blanc, gris, noir) : son angle de teinte ne veut rien dire. */
export const CHROMA_NEUTRE = 8;
/** La largeur d'une case de teinte du nuancier, en degrés : dans une case, du plus clair au plus foncé. */
export const PAS_DE_TEINTE = 15;

/**
 * La place d'une couleur dans le nuancier : d'abord les couleurs, case de teinte après case de teinte (15°, du rouge
 * à l'orangé, au jaune, au vert, au bleu, au violet), du plus clair au plus foncé dans chaque case ; puis les neutres
 * à part, du blanc au noir. Les couleurs passent avant les neutres : le premier écran du présentoir montre des
 * teintes, pas trente blancs.
 */
export function cleDeTeinte(hex: string): [number, number, number] {
  const { L, C, h } = lchDeHex(hex);
  return C < CHROMA_NEUTRE ? [1, 0, -L] : [0, Math.floor(h / PAS_DE_TEINTE), -L];
}

/**
 * Range des matières comme un nuancier (`cleDeTeinte`), sans toucher à la liste reçue. À clé égale, l'ordre reçu est
 * gardé (tri stable) : le résultat ne dépend que des données.
 */
export function trierParTeinte<T extends { hex: string }>(liste: readonly T[]): T[] {
  const cles = new Map(liste.map((m) => [m, cleDeTeinte(m.hex)] as const));
  return [...liste].sort((x, y) => {
    const a = cles.get(x)!;
    const b = cles.get(y)!;
    return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  });
}

/**
 * Les `nombre` matières les plus proches d'une référence (ΔE 2000 croissant, puis référence), sans elle-même ; dans
 * sa famille seulement avec `memeFamille`. Une référence inconnue n'a pas de proches.
 */
export function matieresProches<T extends { id: string; hex: string; famille: string }>(ref: string, catalogue: readonly T[], nombre = 6, { memeFamille = false }: { memeFamille?: boolean } = {}): (T & { deltaE: number })[] {
  const source = catalogue.find((m) => m.id === ref);
  if (!source) return [];
  const lab = labDeHex(source.hex);
  return catalogue
    .filter((m) => m.id !== ref && (!memeFamille || m.famille === source.famille))
    .map((m) => ({ ...m, deltaE: deltaE(lab, labDeHex(m.hex)) }))
    .sort((a, b) => a.deltaE - b.deltaE || a.id.localeCompare(b.id))
    .slice(0, nombre);
}
