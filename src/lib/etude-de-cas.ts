import { DUREE_POSE_TEXTE, euros } from "@/lib/offre-legere";
import { libelleProjet, type Publication } from "@/lib/publications";

/**
 * Une réalisation publiée par le CRM mise en carte d'étude de cas (mission 16,
 * partie 3) — UNE carte (`components/CarteRealisation`) pour l'accueil (« Ils
 * l'ont fait ») et `/realisations` : avant / après, légende (type · ville),
 * texte, matières posées, prix et durée (énoncé § 3.5 et § 5 : « prix réel ou
 * fourchette, durée »).
 *  - Prix et durée : ceux que le CRM publie. À défaut de durée, la durée
 *    HABITUELLE d'`offre.ts` (une journée pour une cuisine ou une salle de bain),
 *    libellée comme telle (« … en général ») ; rien d'habituel pour un meuble,
 *    un local pro ou « autre ».
 *  - À défaut de prix : aucun (site 3.0, relecture des lots B et C). La
 *    fourchette par pièce d'`offre.ts` (« Prix habituel : … »)
 *    contredisait les tarifs du CRM ; les tarifs se lisent dans le bloc des prix.
 */
export type EtudeReelle = {
  id: string;
  titre: string;
  /** « Cuisine · Lattes » : le type de projet et la ville, s'ils sont connus. */
  legende: string | null;
  ville: string | null;
  texte: string | null;
  avant: string | null;
  apres: string | null;
  /** Matières posées : montrées si elles sont publiées. */
  matieres: { ref: string; nom: string }[];
  /** Prix et durée publiés par le CRM. */
  prix: number | null;
  duree: string | null;
  /** À défaut : la durée habituelle d'`offre.ts` pour ce type de projet (jamais de prix habituel). */
  dureeHabituelle: string | null;
};

/** `offre.ts` : « une journée pour une cuisine ou une salle de bain courante ». */
const POSE_EN_UNE_JOURNEE = new Set(["CUISINE", "SDB"]);

export function versEtudeReelle(p: Publication): EtudeReelle {
  const legende = [libelleProjet(p.typeProjet), p.ville].filter(Boolean).join(" · ");
  return {
    id: p.id,
    titre: p.titre,
    legende: legende || null,
    ville: p.ville,
    texte: p.texte,
    avant: p.photoAvant,
    apres: p.photoApres,
    matieres: Array.isArray(p.matieres) ? p.matieres.filter((m) => !!m && typeof m.ref === "string" && typeof m.nom === "string") : [],
    prix: typeof p.prix === "number" && Number.isFinite(p.prix) && p.prix > 0 ? p.prix : null,
    duree: typeof p.duree === "string" && p.duree.trim() ? p.duree.trim() : null,
    dureeHabituelle: p.typeProjet && POSE_EN_UNE_JOURNEE.has(p.typeProjet) ? DUREE_POSE_TEXTE : null,
  };
}

/** La ligne « prix · durée » d'une carte : les chiffres publiés, sinon la durée habituelle libellée comme telle ; `null` sans rien. */
export function lignePrixDuree(e: EtudeReelle): string | null {
  const prix = e.prix !== null ? euros(e.prix) : null;
  const duree = e.duree ?? (e.dureeHabituelle ? `pose en ${e.dureeHabituelle} en général` : null);
  const morceaux = [prix, duree].filter((m): m is string => !!m);
  return morceaux.length > 0 ? morceaux.join(" · ") : null;
}
