import { estimationPourEnvoi, type Estimation } from "@/lib/estimation";
import type { CreneauRappel } from "@/lib/rappel";

/**
 * La demande de devis du simulateur (mission 16, partie 4) : le corps envoyé à `POST /api/simulation/contact`,
 * construit ici (pur, testé) plutôt que dans l'écran. Ville et code postal : ceux du formulaire, sinon ceux déjà
 * connus du parcours (le formulaire ne les redemande pas). Partent aussi la fourchette vue et sa taille, le créneau
 * de rappel choisi, l'origine de la visite (`acquisitionPourEnvoi`) et le consentement (`consentementPourEnvoi`), et,
 * après un rendu seulement, `afficherLienEspace` (le lien de l'espace sera affiché : le CRM peut l'ouvrir).
 * Site 3.0 (lot E3) : une simulation faite sur une pièce d'exemple le dit dans le message de la demande (« Simulation
 * sur une pièce d'exemple : cuisine-bordeaux-brillante ») ; la route le transmet au CRM tel quel (`message`).
 * Lot E4 : la case des échantillons de la demande après un rendu y ajoute « Souhaite recevoir les échantillons :
 * NF13 (Façades), AG13 (Plan de travail) ».
 * Relecture des phases D, E, F : `exemple` part aussi en champ (le CRM marque la simulation, ne range pas l'avant
 * comme photo du client) ; après un échec sur un exemple, l'avant d'exemple ne part JAMAIS comme photo du visiteur.
 */

export type ExtraDemande = { estimation: Estimation | null; rappelCreneau: CreneauRappel | null };

export type EntreeDemande = {
  formulaire: { name: string; phone: string; email: string; ville: string; codePostal: string };
  connus: { ville: string | null; codePostal: string | null };
  projet: string;
  parcoursId: string | null;
  simulationIds: string[];
  references: readonly { libelle: string; ref: string; nom: string }[];
  /** Après un échec de génération : la photo part, pour une simulation faite à la main. */
  echec: { photo: string; raison: string } | null;
  /** Lot E3 : la pièce d'exemple de la simulation (absente sur la photo du visiteur). */
  exemple?: string | null;
  /** Lot E4 : la personne veut les échantillons des matières du rendu (« Recevoir ces échantillons chez moi »). */
  echantillons?: boolean;
  jetonCaptcha: string | null;
  acquisition: Record<string, string | undefined>;
  consentement: Record<string, unknown>;
  page: string;
  extra?: ExtraDemande;
};

/** Les lignes du message joint à la demande (lots E3 et E4) ; vide pour une demande ordinaire. */
export function messageDemande(e: Pick<EntreeDemande, "exemple" | "echantillons"> & { references?: EntreeDemande["references"] }): string {
  const echantillons = e.echantillons && e.references?.length ? `Souhaite recevoir les échantillons : ${e.references.map((r) => `${r.ref} (${r.libelle})`).join(", ")}` : null;
  return [e.exemple ? `Simulation sur une pièce d'exemple : ${e.exemple}` : null, echantillons].filter(Boolean).join("\n");
}

export function corpsDemandeSimulation(e: EntreeDemande): Record<string, unknown> {
  const { formulaire: f, extra } = e;
  const message = messageDemande(e);
  return {
    name: f.name.trim(),
    phone: f.phone.trim(),
    email: f.email.trim(),
    ville: f.ville.trim() || e.connus.ville || "",
    codePostal: f.codePostal.trim() || e.connus.codePostal || "",
    project_type: e.projet,
    parcoursId: e.parcoursId,
    // Toutes les simulations du parcours : le CRM les a, avec leurs images.
    simulationIds: e.simulationIds,
    referenceChoisie: e.references[0]?.ref,
    references: e.references.map((r) => `${r.libelle} : ${r.ref} (${r.nom})`).join(" | "),
    // Après un rendu, le navigateur AFFICHERA le lien de l'espace : le CRM ne l'ouvre que sur cette demande. Après un
    // échec (la photo seule, simulation faite à la main), rien n'est affiché : pas de drapeau, pas d'espace ouvert d'ici.
    ...(e.echec ? { ...(e.exemple ? {} : { photoAvant: e.echec.photo }), simulationEchouee: e.echec.raison } : { afficherLienEspace: true }),
    ...(e.exemple ? { exemple: e.exemple } : {}),
    turnstileToken: e.jetonCaptcha,
    ...e.acquisition,
    formulaire: `simulateur · ${e.page}`,
    ...e.consentement,
    ...estimationPourEnvoi(extra?.estimation ?? null),
    ...(extra?.rappelCreneau ? { rappelCreneau: extra.rappelCreneau } : {}),
    ...(message ? { message } : {}),
  };
}
