import { FAQ_EAU_CHALEUR, FAQ_GARANTIE, FAQ_GENERALE, FAQ_RETRAIT, type QuestionReponse } from "@/data/faq";
import { ENTREPRISE } from "@/lib/entreprise";
import { ACOMPTE_POURCENT, DELAI_RENDU, DELAI_REPONSE, FOURCHETTES, GARANTIE_ANS, PRIX_EXPLICATION, PRIX_PLAGE, VALIDITE_DEVIS_JOURS, fourchette } from "@/lib/offre";

/**
 * Les textes de « Comment ça marche » (mission 16, partie 5) : le procédé, le prix, les objections, les guides.
 * Chiffres lus dans `offre.ts` et `entreprise.ts`, jamais écrits ici. Reprises (règle « aucun texte SEO retiré sans
 * reprise ») : « Ce que ça change », le tableau des tarifs et sa phrase, les conditions du devis (ancien accueil,
 * partie 3) ; l'intro de l'index /blog (301 ici) ; la section `#devis` (ancienne /devis, `devis-en-ligne.ts`).
 */

export const TITRE_PAGE = "Comment ça marche — covering adhésif, de la photo à la pose | CoverSwap";
export const DESCRIPTION_PAGE = `Une photo, une simulation en ${DELAI_RENDU}, un devis ${DELAI_REPONSE}, une journée de pose. ${PRIX_PLAGE} fourni et posé, garantie ${GARANTIE_ANS} ans. Vos questions.`;

/** L'ouverture (l'ouverture provisoire et « Pas de travaux » de l'ancien accueil). */
// Trois lignes au plus sur un téléphone (énoncé § 1). Phrase de l'ancien accueil, gardée pour le référencement ;
// « pas de démontage… » passe sous les étapes, la réversibilité et la garantie sont dites dans « Vos questions ».
export const INTRO_PAGE = "Cuisine, salle de bain, meubles, locaux professionnels : un film Cover Styl' posé sur vos surfaces existantes.";

/** Sous les trois étapes (l'habillage du module de simulation de l'ancien accueil). */
export const NOTE_ETAPES = "Pas de démontage, pas de poussière, pas de séchage : la pièce sert le soir même. Pendant le rendu, vous pouvez quitter la page : la simulation continue.";

/** Le prix (« Un prix lisible » et « Des prix au mètre linéaire » de l'ancien accueil). */
export const PRIX_MESURE = `Nous mesurons le film réellement posé et le facturons au mètre linéaire, fourni et posé : ${PRIX_PLAGE}.`;
export const PRIX_REGLE = PRIX_EXPLICATION;
export const PRIX_COMPRIS = "Compris : le film, le nettoyage des surfaces, la pose et les finitions. Les teintes se valident sur échantillons avant la commande ; les frais de déplacement éventuels sont écrits dans le devis.";
export const PRIX_CONDITIONS = `${ENTREPRISE.tvaMention}. Devis gratuit, valable ${VALIDITE_DEVIS_JOURS} jours, acompte de ${ACOMPTE_POURCENT} % à la commande.`;

/** Les ordres de grandeur par pièce, fourni et posé (`FOURCHETTES`). */
export const LEGENDE_FOURCHETTES = "Ordres de grandeur par type de projet, fourni et posé";
const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);
export const LIGNES_FOURCHETTES: { projet: string; prix: string }[] = [
  { projet: majuscule(FOURCHETTES.cuisine.libelle), prix: fourchette("cuisine") },
  { projet: majuscule(FOURCHETTES.sdb.libelle), prix: fourchette("sdb") },
  { projet: majuscule(FOURCHETTES.meuble.libelle), prix: fourchette("meuble") },
  // « local professionnel : sur devis après visite » : le projet, puis le prix.
  { projet: majuscule(FOURCHETTES.pro.libelle.split(" : ")[0]), prix: majuscule(FOURCHETTES.pro.libelle.split(" : ")[1] ?? fourchette("pro")) },
];

/** Une objection : sa question en une ligne, sa réponse ; `reprend` = l'entrée de `FAQ_GENERALE` dont elle lit la réponse. */
export type Objection = QuestionReponse & { sujet: string; reprend?: QuestionReponse };

/**
 * Les objections, une ligne chacune, une réponse de deux phrases au plus (matière : `FAQ_GENERALE` et le guide
 * « combien de temps ça tient »). La garantie, la chaleur et l'eau, la location LISENT leur réponse dans
 * `FAQ_GENERALE` (une seule source) : la FAQ repliée ne les répète pas (`FAQ_RESTANTE`).
 */
const reprise = (sujet: string, q: string, entree: QuestionReponse): Objection => ({ sujet, q, a: entree.a, reprend: entree });

export const OBJECTIONS: Objection[] = [
  { sujet: "durabilité", q: "Est-ce que ça dure ?", a: `Posé à chaud sur un support sain, avec des chants finis, le film tient au moins la durée de sa garantie de ${GARANTIE_ANS} ans. Ensuite, il se retire ou se recouvre.` },
  { sujet: "entretien", q: "Comment l'entretenir ?", a: "Une éponge douce et un produit ménager courant. Pas d'éponge abrasive, pas de solvant." },
  reprise("garantie", FAQ_GARANTIE.q, FAQ_GARANTIE),
  reprise("chaleur et eau", "Et la chaleur, l'eau ?", FAQ_EAU_CHALEUR),
  { sujet: "cuisine neuve", q: "Et si ma cuisine est neuve ?", a: "Le film se pose sur l'existant et se retire à chaud sans abîmer le support. Vous changez de style sans toucher à votre cuisine, et vous pouvez revenir à l'origine." },
  reprise("location", "Je suis locataire : est-ce réversible ?", FAQ_RETRAIT),
];

/** La FAQ repliée sous les objections : les questions générales qu'aucune objection ne reprend déjà. */
export const FAQ_RESTANTE: QuestionReponse[] = FAQ_GENERALE.filter((entree) => !OBJECTIONS.some((o) => o.reprend === entree));

/** Le balisage `FAQPage` de la page : les objections puis la FAQ restante, chaque question une fois. */
export const QUESTIONS_BALISEES: QuestionReponse[] = [...OBJECTIONS.map(({ q, a }) => ({ q, a })), ...FAQ_RESTANTE].filter((x, i, liste) => liste.findIndex((y) => y.q === x.q) === i);

/** L'intro des guides (titre et phrase de l'ancien index /blog). */
export const INTRO_GUIDES = "Les vraies questions, les vraies réponses : ce que coûte un covering, combien de temps il tient, comment se passe la pose, quelle finition choisir, comment l'entretenir.";

/** Les mots-clés de l'ancien index /blog, ajoutés à ceux du devis en ligne. */
export const MOTS_CLES_GUIDES = "blog covering adhésif, conseils rénovation, tendances décoration, covering cuisine, covering salle de bain";
