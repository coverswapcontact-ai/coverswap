import { FAQ_EAU_CHALEUR, FAQ_GARANTIE, FAQ_GENERALE, FAQ_RETRAIT, type QuestionReponse } from "@/data/faq";
import { ENTREPRISE } from "@/lib/entreprise";
import { ACOMPTE_POURCENT, DELAI_RENDU, DELAI_REPONSE, DELAI_REPONSE_COURT, DUREE_POSE_TEXTE, GARANTIE_ANS, PRIX_EXPLICATION, PRIX_PLAGE, VALIDITE_DEVIS_JOURS } from "@/lib/offre";

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

/**
 * Site 3.0 (lot C3) : le déroulé complet, ses délais, ce qui reste en place, l'entretien, « Quand rénover ? ». Matière :
 * les guides « Comment se passe une pose » et « Entretenir un revêtement adhésif » (`data/blog-articles.ts`), les
 * chiffres d'`offre.ts` ; aucun délai qui n'y soit pas écrit (le temps entre la commande et la pose n'est pas promis :
 * la date se fixe avec le client). Les photos sont des images générées : étiquette « Ambiance », une fois chacune.
 */
export type EtapeDeroule = { quand: string; titre: string; texte: string; photo?: string };

export const TITRE_DEROULE = "Le déroulé, et ses délais";
export const INTRO_DEROULE = "De votre photo à la pièce finie : ce qui se passe, et quand.";
export const DEROULE: readonly EtapeDeroule[] = [
  { quand: "Tout de suite", titre: "Votre photo, votre simulation", texte: `Une photo de face, lumière allumée, et les matières de votre choix : le rendu arrive en ${DELAI_RENDU}.` },
  { quand: `Sous ${DELAI_REPONSE_COURT}`, titre: "Le devis", texte: `On relève les surfaces sur vos photos et on chiffre au mètre linéaire, surface par surface, avec la référence de chaque film. Gratuit, valable ${VALIDITE_DEVIS_JOURS} jours.` },
  { quand: "Sur rendez-vous", titre: "La visite : échantillons et mesures", texte: "On vient chez vous avec les vrais échantillons : vous choisissez à la lumière de votre pièce. On mesure chaque surface au passage.", photo: "mesure-visite" },
  { quand: "À la commande", titre: "Le film commandé", texte: `Devis signé et acompte de ${ACOMPTE_POURCENT} % : on commande le film au fabricant et on fixe la date de pose avec vous.` },
  { quand: "Le jour de la pose", titre: `La pose, en ${DUREE_POSE_TEXTE}`, texte: "On protège la pièce, on nettoie et on dégraisse chaque surface, puis on pose le film à chaud, panneau par panneau, chants compris. Un meuble seul prend quelques heures ; plusieurs pièces, deux jours.", photo: "outils-pose" },
  { quand: "Le soir même", titre: "La vérification, ensemble", texte: "On passe chaque surface en revue avec vous ; une réserve est notée par écrit, puis reprise. Rien ne sèche : la pièce sert tout de suite." },
];

/** Ce qui ne bouge pas, et le peu qu'on vous demande de préparer. */
export const TITRE_EN_PLACE = "Ce qui reste en place";
export const RESTE_EN_PLACE: readonly { titre: string; texte: string }[] = [
  { titre: "Vos meubles, leurs portes, leurs tiroirs", texte: "Rien n'est démonté ni emporté : on pose le film sur place, façade par façade." },
  { titre: "Les poignées et les charnières", texte: "Elles restent où elles sont : on pose autour." },
  { titre: "Le plan de travail, l'évier, la plaque", texte: "Le plan s'habille sans être déposé ; l'évier et la plaque ne bougent pas." },
  { titre: "Le carrelage", texte: "Il se recouvre tel quel, sans être cassé." },
];
export const A_PREPARER: readonly string[] = [
  "Vider les tiroirs et dégager les plans de travail.",
  "Laisser l'accès libre aux surfaces à couvrir.",
  "Nous signaler un défaut connu du support : un panneau qui gonfle, une peinture qui s'écaille.",
];

/** L'entretien, en quatre gestes (le guide « Entretenir un revêtement adhésif » donne le détail). */
export const TITRE_ENTRETIEN = "L'entretien";
export const ENTRETIEN: readonly { titre: string; texte: string }[] = [
  { titre: "Au quotidien", texte: "Un chiffon ou une éponge douce, de l'eau tiède, un nettoyant ménager sans solvant." },
  { titre: "À éviter", texte: "La laine d'acier et les éponges qui grattent, l'acétone, l'alcool à brûler, le nettoyeur vapeur sur les chants." },
  { titre: "Deux habitudes", texte: "Un dessous-de-plat pour ce qui sort du four, une planche pour couper : comme sur un stratifié." },
  { titre: "Le premier jour", texte: "Le film adhère complètement en quelques heures : on évite de mouiller les chants le jour de la pose. Dès le lendemain, usage normal." },
];
export const GUIDE_ENTRETIEN = "entretenir-revetement-adhesif";

/** L'encart « Quand rénover ? » (après « Vos questions »), avec `usure-detail`. */
export const TITRE_QUAND_RENOVER = "Quand rénover ?";
export const QUAND_RENOVER_OUI = "Le bon moment, c'est quand le meuble est sain mais que sa surface a vieilli :";
export const SIGNES_RENOVER: readonly string[] = ["un blanc qui a jauni, un bois qui a foncé ou viré à l'orange ;", "une couleur ou une finition brillante qui date ;", "des rayures et des marques d'usage en surface."];
export const QUAND_RENOVER_NON = "Un panneau qui a gonflé à l'eau ou qui s'effrite : le film ne le répare pas, il faut changer la pièce. Un chant qui se décolle, un petit éclat : montrez-les sur votre photo, on vous dit au devis ce qu'on peut reprendre.";

/** Le prix (« Un prix lisible » et « Des prix au mètre linéaire » de l'ancien accueil). */
export const PRIX_MESURE = `Nous mesurons le film réellement posé et le facturons au mètre linéaire, fourni et posé : ${PRIX_PLAGE}.`;
export const PRIX_REGLE = PRIX_EXPLICATION;
export const PRIX_COMPRIS = "Compris : le film, le nettoyage des surfaces, la pose et les finitions. Les teintes se valident sur échantillons avant la commande ; les frais de déplacement éventuels sont écrits dans le devis.";
export const PRIX_CONDITIONS = `${ENTREPRISE.tvaMention}. Devis gratuit, valable ${VALIDITE_DEVIS_JOURS} jours, acompte de ${ACOMPTE_POURCENT} % à la commande.`;

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
