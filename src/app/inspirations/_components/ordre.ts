import { resoudreCas, type CasAmbiance } from "@/components/ambiances/cas";
import type { PieceAmbiance } from "@/data/ambiances";
import { PIECES_INSPIRATION, inspirations, type AmbianceResolue } from "@/lib/ambiances";

/**
 * L'ordre de /inspirations (site 3.0, lot C4), pur. Les ambiances arrivent dans l'ordre de `data/ambiances` (la série 1,
 * puis la série 2, pièce par pièce) : 25 cuisines d'affilée, et les premières cartes ne montreraient qu'une pièce.
 * Ici :
 *  1. en tête, la première ambiance SIMPLE de la première pièce (une photo seule : c'est la seule image prioritaire de
 *     la page, et une paire n'est jamais prioritaire — ses deux images passeraient devant tout) ;
 *  2. puis une pièce après l'autre, dans l'ordre des pièces (cuisine, salle de bain, meubles, murs, pro) : les douze
 *     premières cartes montrent toutes les pièces ;
 *  3. dans une pièce, le premier « après » de chaque avant passe avant le second : les deux versions d'une même pièce
 *     d'origine ne se suivent jamais, et la seconde vient loin derrière.
 * Rien n'est retiré ni dupliqué (testé).
 */
export function ordreInspirations<T extends { piece: PieceAmbiance; avant?: string }>(liste: readonly T[], pieces: readonly PieceAmbiance[]): T[] {
  const tete = liste.find((a) => a.piece === pieces[0] && !a.avant) ?? liste.find((a) => !a.avant);
  const reste = liste.filter((a) => a !== tete);
  // Le rang d'une ambiance parmi celles qui partagent son avant (0 : la première, ou une photo seule).
  const vus = new Map<string, number>();
  const passe = new Map<T, number>();
  for (const a of reste) {
    const n = a.avant ? (vus.get(a.avant) ?? 0) : 0;
    if (a.avant) vus.set(a.avant, n + 1);
    passe.set(a, n);
  }
  const parPiece = pieces.map((p) => reste.filter((a) => a.piece === p).sort((x, y) => passe.get(x)! - passe.get(y)!));
  const autres = reste.filter((a) => !pieces.includes(a.piece));
  const sortie: T[] = tete ? [tete] : [];
  for (let rang = 0; parPiece.some((l) => rang < l.length); rang++) {
    for (const l of parPiece) if (rang < l.length) sortie.push(l[rang]);
  }
  return [...sortie, ...autres];
}

/** Les cartes de /inspirations, dans l'ordre : l'ambiance et sa carte (`depuis=inspirations` ; une image non préparée n'a pas de carte). */
export function cartesInspirations(): { ambiance: AmbianceResolue; cas: CasAmbiance }[] {
  return ordreInspirations(
    inspirations(),
    PIECES_INSPIRATION.map((p) => p.id),
  ).flatMap((ambiance) => {
    const cas = resoudreCas(ambiance.image, { depuis: "inspirations" });
    return cas ? [{ ambiance, cas }] : [];
  });
}
