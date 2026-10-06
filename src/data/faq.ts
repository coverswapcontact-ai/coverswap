import { DELAI_RENDU, DELAI_REPONSE, GARANTIE_ANS, PRIX_EXPLICATION, PRIX_PLAGE } from "@/lib/offre";
import { ENTREPRISE } from "@/lib/entreprise";

export type QuestionReponse = { q: string; a: string };

/*
 * Trois réponses de la FAQ générale sont AUSSI des objections de « Vos
 * questions » (/comment-ca-marche, `app/comment-ca-marche/contenu.ts`) : les
 * objections les lisent ici (une seule source), et la FAQ repliée de cette page
 * ne les répète pas (`FAQ_RESTANTE`).
 */
export const FAQ_EAU_CHALEUR: QuestionReponse = {
  q: "Le covering résiste-t-il à l'eau et à la chaleur ?",
  a: "Les films Cover Styl' sont conçus pour les cuisines et les salles de bain : ils résistent à l'humidité, aux projections et au nettoyage courant. Pour la chaleur, ils supportent l'usage quotidien d'une cuisine ; à proximité immédiate des plaques de cuisson, nous validons la faisabilité au cas par cas et posons les références prévues pour les hautes températures.",
};
export const FAQ_RETRAIT: QuestionReponse = {
  q: "Peut-on retirer le film sans abîmer le support ?",
  a: "Oui : le film se retire à chaud, proprement, et le support retrouve son état d'origine. C'est ce qui rend le covering adapté aux locataires et aux logements en gestion locative.",
};
export const FAQ_GARANTIE: QuestionReponse = {
  q: "Quelle garantie ?",
  a: `La pose et les films sont garantis ${GARANTIE_ANS} ans contre le décollement et la décoloration en usage normal. Les exclusions (chocs, coupures, produits abrasifs) sont écrites dans nos conditions générales de vente.`,
};

/**
 * Questions fréquentes — vraies réponses, sans promesse invérifiable.
 * Servies sur /comment-ca-marche (#faq) : les objections de « Vos questions »
 * en reprennent trois (ci-dessus), la FAQ repliée montre les autres, et le
 * balisage FAQPage porte chaque question une fois (mission 16, partie 5).
 * Site 3.0 (lot B6) : l'accueil en reprend six (`QUESTIONS_ACCUEIL`), avec son
 * propre balisage FAQPage.
 */
export const FAQ_GENERALE: QuestionReponse[] = [
  {
    q: "Qu'est-ce que le covering adhésif ?",
    a: "Un film adhésif épais et texturé, posé à chaud sur une surface existante (façades de meubles, plan de travail, crédence, carrelage mural, porte). Il imite le bois, la pierre, le béton, le métal ou une couleur unie, et se retire sans abîmer le support. Nous posons les films Cover Styl'.",
  },
  {
    q: "Combien coûte une rénovation par covering ?",
    a: `Nous facturons au mètre linéaire de film posé, fourni et posé : ${PRIX_PLAGE}. ${PRIX_EXPLICATION} Le prix d'une pièce se construit surface par surface, à nos tarifs publiés : le devis est gratuit, il vous répond ${DELAI_REPONSE} et détaille chaque surface.`,
  },
  {
    q: "Combien de temps dure la pose ?",
    a: "Une cuisine ou une salle de bain courante se pose en une journée. Un meuble seul prend quelques heures. Pour un projet qui cumule plusieurs pièces, comptez deux jours. La pièce est utilisable le soir même : pas de séchage, pas de gravats.",
  },
  FAQ_EAU_CHALEUR,
  FAQ_RETRAIT,
  FAQ_GARANTIE,
  {
    q: "Où intervenez-vous ?",
    a: `Notre zone principale est ${ENTREPRISE.zone.principale} (${ENTREPRISE.zone.departement}). Nous nous déplaçons sur devis partout en France métropolitaine ; les frais de déplacement éventuels sont écrits dans le devis.`,
  },
  {
    q: "Comment fonctionne le simulateur ?",
    a: `Vous envoyez une photo de votre pièce, vous choisissez un revêtement du catalogue Cover Styl' pour chaque surface, et une intelligence artificielle applique ce revêtement sur votre photo en ${DELAI_RENDU}. Le rendu est une illustration : le devis et les échantillons font foi pour les teintes exactes.`,
  },
];

export const FAQ_SIMULATEUR: QuestionReponse[] = [
  {
    q: "Dois-je laisser mes coordonnées pour essayer ?",
    a: "Non. Vous simulez d'abord. Vos coordonnées ne sont demandées que si vous voulez recevoir votre rendu et un devis.",
  },
  {
    q: "Quelle photo donne le meilleur résultat ?",
    a: "Une photo prise de face, bien éclairée, qui cadre toute la pièce ou tout le meuble, sans personne dessus. Les photos d'iPhone et d'Android sont acceptées telles quelles ; nous les réduisons automatiquement avant l'envoi.",
  },
  {
    q: "Le rendu est-il fidèle ?",
    a: "Il donne une idée réaliste de l'effet d'une finition sur vos surfaces. Les teintes exactes se valident sur les échantillons que nous présentons avant la pose.",
  },
  {
    q: "Que deviennent mes photos ?",
    a: "Elles servent uniquement à produire le rendu et à préparer votre devis. Une simulation sans demande de devis est effacée après 30 jours. Le détail est dans notre politique de confidentialité.",
  },
];

const question = (liste: QuestionReponse[], q: string): QuestionReponse => {
  const trouvee = liste.find((x) => x.q === q);
  if (!trouvee) throw new Error(`Question absente de la FAQ : ${q}`);
  return trouvee;
};

/**
 * « Questions avant de se lancer » (site 3.0, lot B6) : six questions de la FAQ, telles quelles (une seule source),
 * dans l'ordre où on se les pose — la durée, le retrait, l'eau et la chaleur, les coordonnées, la garantie, la zone.
 */
export const QUESTIONS_ACCUEIL: QuestionReponse[] = [
  question(FAQ_GENERALE, "Combien de temps dure la pose ?"),
  FAQ_RETRAIT,
  FAQ_EAU_CHALEUR,
  question(FAQ_SIMULATEUR, "Dois-je laisser mes coordonnées pour essayer ?"),
  FAQ_GARANTIE,
  question(FAQ_GENERALE, "Où intervenez-vous ?"),
];
