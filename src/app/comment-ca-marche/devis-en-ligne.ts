import { DELAI_REPONSE } from "@/lib/offre-legere";

/**
 * Les textes de l'ancienne page /devis (301 vers /simulateur depuis la mission 16, partie 4) et de l'ancien titre de
 * /contact, repris ici tels quels pour ne perdre aucun texte référencé : titre, présentation, étapes et avantages du
 * devis en ligne. Rendus par la section « Votre devis covering en ligne, gratuit » de /comment-ca-marche (que la
 * partie 5 réécrit : elle garde ces textes ou les déplace, jamais ne les efface).
 */

export const TITRE_DEVIS_EN_LIGNE = "Votre devis covering en ligne, gratuit";

export const INTRO_DEVIS_EN_LIGNE = `Cuisine, salle de bain, meubles ou local pro : décrivez votre projet, joignez quelques photos et recevez une estimation personnalisée ${DELAI_REPONSE}. Sans engagement.`;

export const ETAPES_DEVIS_EN_LIGNE = [
  { titre: "Décrivez votre projet", texte: "Type de surface, dimensions approximatives, style souhaité." },
  { titre: "On étudie votre demande", texte: "Chiffrage au mètre linéaire selon la complexité de la pose : découpes, accès, état du support, métrage." },
  { titre: "Vous recevez votre devis", texte: `Détaillé, gratuit, ${DELAI_REPONSE}. Vous décidez ensuite.` },
];

export const AVANTAGES_DEVIS_EN_LIGNE = [
  { titre: `Réponse ${DELAI_REPONSE}`, texte: "Devis détaillé et personnalisé par email." },
  { titre: "100 % gratuit", texte: "Sans engagement, sans frais cachés." },
  { titre: "Devis détaillé", texte: "Fourniture + pose incluses, un prix clair et sans surprise." },
  { titre: "France entière", texte: "Intervention partout en France métropolitaine." },
];

/** Le lien vers le formulaire (l'ancien titre de /contact, « Demandez votre devis gratuit »). */
export const LIEN_DEVIS_EN_LIGNE = "Demandez votre devis gratuit";

export const MOTS_CLES_DEVIS_EN_LIGNE = "devis covering en ligne, devis covering gratuit, devis rénovation cuisine, devis covering Montpellier, estimation covering adhésif, prix covering Hérault";
