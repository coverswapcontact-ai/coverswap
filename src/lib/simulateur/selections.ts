import revetements from "@/data/revetements.json";
import { pieceDe, type ZonesSimulateur } from "@/lib/simulateur/zones";

/**
 * Lecture des sélections du visiteur par `prepare` (mission 15, partie 4) :
 * `[{ surface, ref }]`, validées contre la liste de zones servie par le CRM
 * (zones de la pièce, limite, incompatibilités) et le catalogue du site
 * (référence connue). Le CRM refait les mêmes contrôles à la réception ; ici
 * on refuse tôt, avec une phrase claire, avant de signer.
 */

const REFERENCES = new Set((revetements as { id: string }[]).map((r) => r.id));

export type SelectionValidee = { surface: string; ref: string };
export type LectureSelections = { ok: true; selections: SelectionValidee[] } | { ok: false; erreur: string; raison: string };

export function validerSelections(zones: ZonesSimulateur, projetId: string, brut: unknown, references: Set<string> = REFERENCES): LectureSelections {
  if (!zones.pieces.some((p) => p.id === projetId)) return { ok: false, erreur: "Pièce inconnue : rechargez la page.", raison: "projet" };
  if (!Array.isArray(brut)) return { ok: false, erreur: "Choisissez au moins une zone et sa matière.", raison: "aucune-zone" };
  const piece = pieceDe(zones, projetId);
  const vues = new Set<string>();
  const selections: SelectionValidee[] = [];
  for (const item of brut as { surface?: unknown; ref?: unknown }[]) {
    if (typeof item?.surface !== "string" || typeof item?.ref !== "string") continue;
    const zone = piece.zones.find((z) => z.id === item.surface);
    if (!zone) return { ok: false, erreur: "Une zone choisie n'existe plus pour cette pièce : rechargez la page.", raison: "zone-inconnue" };
    if (vues.has(zone.id)) continue;
    if (!references.has(item.ref)) return { ok: false, erreur: `La référence ${item.ref.slice(0, 12)} n'est plus au catalogue : choisissez-en une autre.`, raison: "reference-inconnue" };
    vues.add(zone.id);
    selections.push({ surface: zone.id, ref: item.ref });
  }
  if (selections.length === 0) return { ok: false, erreur: "Choisissez au moins une zone et sa matière.", raison: "aucune-zone" };
  if (selections.length > zones.zonesMax) return { ok: false, erreur: `Au plus ${zones.zonesMax} zones par rendu : retirez-en une, vous pourrez relancer une simulation ensuite.`, raison: "trop-de-surfaces" };
  for (const s of selections) {
    const zone = piece.zones.find((z) => z.id === s.surface)!;
    const conflit = zone.exclut.find((id) => vues.has(id));
    if (conflit) {
      const autre = piece.zones.find((z) => z.id === conflit);
      return { ok: false, erreur: `« ${zone.libelle} » et « ${autre?.libelle ?? conflit} » couvrent les mêmes meubles : gardez l'une ou l'autre.`, raison: "surfaces-incompatibles" };
    }
  }
  return { ok: true, selections };
}
