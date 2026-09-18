import revetements from "@/data/revetements.json";
import type { ProjectType } from "@/lib/simulateur/projets";
import { SURFACES, SURFACES_MAX } from "@/lib/simulateur/surfaces";
import type { SurfaceChoisie } from "@/lib/simulation-prompt";

interface Reference {
  id: string;
  nom: string;
  famille: string;
  categorie: string;
  finition: string;
  image: string;
  tags: string[];
}

const CATALOGUE = new Map((revetements as Reference[]).map((r) => [r.id, r]));

export type LectureSelections = { ok: true; choix: SurfaceChoisie[]; swatchUrls: string[] } | { ok: false; erreur: string; raison: string };

/**
 * Lit les surfaces choisies par le visiteur : [{ surface, ref }]. Le nom, la
 * famille et l'adresse de l'échantillon viennent du catalogue du site, jamais
 * du navigateur : la consigne envoyée au modèle ne contient que du texte à nous.
 */
export function lireSelections(body: Record<string, unknown>, projet: ProjectType): LectureSelections {
  const brut = body.selections;
  if (!Array.isArray(brut)) {
    // Ancien format (zone1_ref…) : page ouverte avant une mise à jour du simulateur.
    const ancien = Object.keys(body).some((k) => /^zone\d_ref$/.test(k));
    return ancien
      ? { ok: false, erreur: "Le simulateur vient d'être mis à jour : rechargez la page, votre photo est conservée.", raison: "version" }
      : { ok: false, erreur: "Choisissez au moins une surface et sa finition.", raison: "aucune-zone" };
  }

  const autorisees = new Set(projet.elements.map((e) => e.key));
  const choix: SurfaceChoisie[] = [];
  const swatchUrls: string[] = [];
  const vues = new Set<string>();
  for (const item of brut as { surface?: unknown; ref?: unknown }[]) {
    if (typeof item?.surface !== "string" || typeof item?.ref !== "string") continue;
    const surface = SURFACES[item.surface];
    const reference = CATALOGUE.get(item.ref);
    if (!surface || !autorisees.has(surface.id) || vues.has(surface.id)) continue;
    if (!reference?.image) return { ok: false, erreur: `La référence ${item.ref.slice(0, 12)} n'est plus au catalogue : choisissez-en une autre.`, raison: "reference-inconnue" };
    vues.add(surface.id);
    // Un même film sur deux surfaces : un seul échantillon joint.
    let index = swatchUrls.indexOf(reference.image);
    if (index < 0) {
      index = swatchUrls.length;
      swatchUrls.push(reference.image);
    }
    choix.push({
      surface,
      revetement: { ref: reference.id, name: reference.nom, famille: reference.famille, finition: reference.finition, categorie: reference.categorie, tags: reference.tags, imageUrl: reference.image },
      indexEchantillon: index,
    });
  }

  if (choix.length === 0) return { ok: false, erreur: "Choisissez au moins une surface et sa finition.", raison: "aucune-zone" };
  if (choix.length > SURFACES_MAX) return { ok: false, erreur: `Au plus ${SURFACES_MAX} surfaces par rendu : retirez-en une, vous pourrez relancer une simulation ensuite.`, raison: "trop-de-surfaces" };
  for (const c of choix) {
    const conflit = (c.surface.exclut ?? []).find((id) => vues.has(id));
    if (conflit) return { ok: false, erreur: `« ${c.surface.label} » et « ${SURFACES[conflit].label} » couvrent les mêmes meubles : gardez l'un ou l'autre.`, raison: "surfaces-incompatibles" };
  }
  return { ok: true, choix, swatchUrls };
}
