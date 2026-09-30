import { parcoursIdValide } from "@/lib/parcours";
import { estCreneauRappel, type CreneauRappel } from "@/lib/rappel";

/**
 * Ce que `POST /api/simulation/contact` accepte (mission 16, partie 4) — fonction PURE, testée : le prénom (un seul
 * mot suffit : le CRM prend le prénom pour nom) et le téléphone sont exigés ; l'e-mail est FACULTATIF (vérifié s'il
 * est donné) ; le créneau de rappel doit être l'un des trois ; la fourchette vue n'est gardée qu'entière et dans
 * l'ordre ; les textes sont coupés à leur longueur. Aucune bibliothèque de validation : la route n'en avait pas.
 */

export type ContactSimulation = {
  nom: string;
  telephone: string;
  email?: string;
  ville?: string;
  codePostal?: string;
  projet?: string;
  parcoursId?: string;
  simulationIds: string[];
  referenceChoisie?: string;
  references?: string;
  echec?: string;
  photoAvant?: string;
  campagne?: string;
  publicite?: string;
  formulaire?: string;
  canal?: string;
  pageEntree?: string;
  estimationMin?: number;
  estimationMax?: number;
  formatPiece?: string;
  rappelCreneau?: CreneauRappel;
  /** Le navigateur affichera le lien de l'espace (formulaire après un rendu) ; jamais avec une demande après échec. */
  afficherLienEspace?: true;
  consentementMail?: boolean;
  consentementTexte?: string;
};

export type ResultatValidation = { ok: true; contact: ContactSimulation } | { ok: false; erreur: string };

const texte = (v: unknown, max: number): string | undefined => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const entier = (v: unknown): number | undefined => (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 1_000_000 ? v : undefined);

export function validerContactSimulation(brut: unknown): ResultatValidation {
  const body = brut && typeof brut === "object" ? (brut as Record<string, unknown>) : {};
  const nom = texte(body.name, 120);
  const telephone = texte(body.phone, 30);
  if (!nom || !telephone) return { ok: false, erreur: "Votre prénom et votre téléphone sont nécessaires pour vous rappeler." };
  if (telephone.replace(/\D/g, "").length < 9) return { ok: false, erreur: "Numéro de téléphone incomplet." };
  const email = texte(body.email, 200);
  if (email && !EMAIL.test(email)) return { ok: false, erreur: "Adresse e-mail invalide : corrigez-la ou laissez le champ vide." };
  const creneau = body.rappelCreneau;
  if (creneau !== undefined && creneau !== null && creneau !== "" && !estCreneauRappel(creneau)) return { ok: false, erreur: "Créneau de rappel inconnu : choisissez-en un autre." };

  const min = entier(body.estimationMin);
  const max = entier(body.estimationMax);
  const fourchette = min && max && min <= max ? { estimationMin: min, estimationMax: max, formatPiece: texte(body.formatPiece, 40) } : {};
  const photoAvant = typeof body.photoAvant === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(body.photoAvant) && body.photoAvant.length < 8_000_000 ? body.photoAvant : undefined;
  return {
    ok: true,
    contact: {
      nom,
      telephone,
      email,
      ville: texte(body.ville, 120),
      codePostal: texte(body.codePostal, 12),
      projet: texte(body.project_type, 40),
      parcoursId: parcoursIdValide(body.parcoursId),
      // Mission 15 : toutes les simulations du parcours, par identifiant — le CRM a les images.
      simulationIds: Array.isArray(body.simulationIds) ? body.simulationIds.filter((s): s is string => typeof s === "string" && /^[a-z0-9]{10,40}$/i.test(s)).slice(0, 10) : [],
      referenceChoisie: texte(body.referenceChoisie, 80),
      references: texte(body.references, 500),
      echec: texte(body.simulationEchouee, 60),
      photoAvant,
      campagne: texte(body.campagne, 120),
      publicite: texte(body.publicite, 120),
      formulaire: texte(body.formulaire, 200),
      canal: texte(body.canal, 60),
      pageEntree: texte(body.pageEntree, 200),
      ...fourchette,
      rappelCreneau: estCreneauRappel(creneau) ? creneau : undefined,
      afficherLienEspace: body.afficherLienEspace === true && !texte(body.simulationEchouee, 60) ? true : undefined,
      ...(typeof body.consentementMail === "boolean" ? { consentementMail: body.consentementMail, consentementTexte: texte(body.consentementTexte, 1000) } : {}),
    },
  };
}
