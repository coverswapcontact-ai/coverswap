import { DELAI_REPONSE, FOURCHETTES, GARANTIE_ANS, PRIX_PLAGE, euros, fourchette } from "@/lib/offre";
import type { QuestionReponse } from "./faq";

/**
 * Les prestations : une entrée par page /prestations/<slug>, rendue par un
 * seul gabarit. Tout ce qui est écrit ici est vrai ou renvoie au devis.
 */
export type Prestation = {
  slug: string;
  nom: string;
  /** Titre court pour les cartes et le menu. */
  court: string;
  titreSeo: string;
  descriptionSeo: string;
  h1: string;
  accroche: string;
  intro: string[];
  fond: string;
  surfaces: { titre: string; texte: string }[];
  atouts: { titre: string; texte: string }[];
  deroulement: { titre: string; texte: string }[];
  prix: { texte: string; fourchette: string };
  faq: QuestionReponse[];
  /** Identifiant du projet dans le simulateur (null : pas de simulation). */
  simulateur: string | null;
  crmTypeProjet: "CUISINE" | "SDB" | "MEUBLES" | "PRO" | "AUTRE";
};

const DEROULEMENT_PARTICULIER = [
  { titre: "Photos ou simulation", texte: "Vous envoyez quelques photos, ou vous lancez la simulation en ligne pour voir l'effet d'une finition sur votre propre pièce." },
  { titre: `Devis ${DELAI_REPONSE}`, texte: "Nous chiffrons au mètre linéaire, finition par finition, avec le déplacement éventuel écrit noir sur blanc. Une visite est proposée si les mesures l'exigent." },
  { titre: "Choix sur échantillons", texte: "Les teintes se valident sur de vrais échantillons Cover Styl', dans votre lumière, avant la commande du film." },
  { titre: "Pose en une journée", texte: "Nettoyage et dégraissage des surfaces, pose à chaud, finitions vérifiées avec vous. Pas de gravats, pièce utilisable le soir même." },
];

export const PRESTATIONS: Prestation[] = [
  {
    slug: "cuisine",
    nom: "Covering cuisine",
    court: "Cuisine",
    titreSeo: "Covering cuisine à Montpellier — rénover sans casser",
    descriptionSeo: `Façades, plan de travail, crédence recouverts d'un film Cover Styl' en une journée. Prix au mètre linéaire, ${fourchette("cuisine")} pour une cuisine complète. Devis ${DELAI_REPONSE}.`,
    h1: "Rénover sa cuisine sans la casser",
    accroche: "Façades, plan de travail et crédence recouverts d'un film texturé, en une journée, sans démontage ni gravats.",
    intro: [
      "Une cuisine qui fonctionne n'a pas besoin d'être remplacée pour changer de style. Le covering recouvre les surfaces visibles — portes et tiroirs, plan de travail, crédence — d'un film adhésif Cover Styl' posé à chaud, qui imite le bois, la pierre, le béton, le métal ou une couleur mate.",
      "La structure, l'électroménager, l'évier et les poignées restent en place. Nous nettoyons, dégraissons, posons et finissons chaque arête. Vous cuisinez le soir même.",
    ],
    fond: "/images/fonds/photo-1758315417321-83eb30a39710",
    surfaces: [
      { titre: "Façades de meubles", texte: "Portes, tiroirs, panneaux d'îlot : chaque élément est recouvert individuellement, arêtes comprises, en gardant poignées et charnières." },
      { titre: "Plan de travail", texte: "Surface horizontale et chants. Le film résiste au nettoyage quotidien et aux projections ; nous validons au cas par cas les abords immédiats des plaques de cuisson." },
      { titre: "Crédence", texte: "Le mur entre le plan de travail et les meubles hauts, carrelé ou peint, recouvert d'un seul tenant quand la surface le permet." },
      { titre: "Portes de placard et électroménager encastré", texte: "Les façades d'un lave-vaisselle ou d'un réfrigérateur intégrés se recouvrent comme une porte de meuble." },
    ],
    atouts: [
      { titre: "Pas de travaux", texte: "Aucun démontage, aucune poussière, aucun délai de séchage." },
      { titre: "Réversible", texte: "Le film se retire à chaud sans abîmer les meubles : adapté aux locataires." },
      { titre: `Garanti ${GARANTIE_ANS} ans`, texte: "Décollement et décoloration en usage normal, films et pose." },
      { titre: "Une seule journée", texte: "Pour une cuisine courante, pose et finitions dans la journée." },
    ],
    deroulement: DEROULEMENT_PARTICULIER,
    prix: {
      texte: `Nous facturons au mètre linéaire de film posé, fourni et posé : ${PRIX_PLAGE} selon la gamme, la taille du chantier et la complexité. Une cuisine complète (façades, plan de travail, crédence) se situe généralement entre ${euros(FOURCHETTES.cuisine.min)} et ${euros(FOURCHETTES.cuisine.max)}.`,
      fourchette: fourchette("cuisine"),
    },
    faq: [
      { q: "Peut-on recouvrir des façades en mélaminé ou en stratifié ?", a: "Oui, ce sont les supports les plus courants et les mieux adaptés : lisses et stables. Les façades d'une cuisine en kit (mélaminé blanc ou gris) se recouvrent très bien." },
      { q: "Le film résiste-t-il aux projections et au nettoyage ?", a: "Oui. Les films Cover Styl' sont prévus pour les cuisines : humidité, projections d'eau et de graisse, nettoyage à l'éponge et au produit vaisselle. Évitez les éponges abrasives et les solvants." },
      { q: "Et la chaleur des plaques de cuisson ?", a: "Le film supporte la chaleur d'un usage courant. Pour la bande de plan de travail et de crédence située au contact direct des plaques, nous vérifions sur place ce qui est possible et utilisons les références prévues pour les hautes températures ; un dessous-de-plat reste conseillé pour les casseroles sortant du feu." },
      { q: "Peut-on ne recouvrir que les façades ?", a: "Oui. Beaucoup de projets ne concernent que les façades, ou seulement le plan de travail et la crédence. Le devis détaille chaque surface séparément." },
      { q: "Combien de temps dure un covering de cuisine ?", a: `Films et pose sont garantis ${GARANTIE_ANS} ans contre le décollement et la décoloration. Passé ce délai, le film peut être retiré ou recouvert à nouveau.` },
      { q: "Combien ça coûte ?", a: `Entre ${euros(FOURCHETTES.cuisine.min)} et ${euros(FOURCHETTES.cuisine.max)} pour une cuisine complète, façades + plan de travail + crédence, selon le métrage et la finition. Le devis est gratuit et vous répond ${DELAI_REPONSE}.` },
    ],
    simulateur: "cuisine",
    crmTypeProjet: "CUISINE",
  },
  {
    slug: "salle-de-bain",
    nom: "Covering salle de bain",
    court: "Salle de bain",
    titreSeo: "Covering salle de bain à Montpellier — sans casser le carrelage",
    descriptionSeo: `Meuble vasque, murs carrelés, contour de baignoire recouverts d'un film Cover Styl' résistant à l'humidité. ${fourchette("sdb")} selon le projet. Devis ${DELAI_REPONSE}.`,
    h1: "Rénover sa salle de bain sans casser le carrelage",
    accroche: "Meuble vasque, carrelage mural et tablier de baignoire recouverts d'un film résistant à l'humidité, posé en une journée.",
    intro: [
      "Casser un carrelage de salle de bain, c'est plusieurs jours de chantier, de la poussière et une pièce inutilisable. Le covering recouvre le carrelage mural existant, le meuble vasque et le tablier de baignoire d'un film Cover Styl' conçu pour les pièces humides.",
      "La robinetterie, la vasque, la paroi de douche et le sol restent en place. Les joints sont traités pour que l'eau ne s'infiltre pas derrière le film.",
    ],
    fond: "/images/fonds/photo-1754788358645-d6e6cca12e25",
    surfaces: [
      { titre: "Meuble vasque", texte: "Façades et côtés du meuble sous la vasque ; la vasque elle-même reste d'origine." },
      { titre: "Carrelage mural", texte: "Murs carrelés recouverts d'un seul tenant, hors zones d'immersion (intérieur de douche à l'italienne, bac)." },
      { titre: "Tablier de baignoire et coffrages", texte: "Le contour de la baignoire et les coffrages techniques, souvent en carrelage ou en panneau, se recouvrent bien." },
      { titre: "Portes et placards", texte: "Porte de la pièce, colonne de rangement, placard sous pente." },
    ],
    atouts: [
      { titre: "Sans casse", texte: "Le carrelage reste : pas de dépose, pas de gravats, pas de ragréage." },
      { titre: "Prévu pour l'humidité", texte: "Films Cover Styl' adaptés aux salles de bain, joints traités." },
      { titre: `Garanti ${GARANTIE_ANS} ans`, texte: "Décollement et décoloration en usage normal." },
      { titre: "Une journée", texte: "Salle de bain utilisable le soir même." },
    ],
    deroulement: DEROULEMENT_PARTICULIER,
    prix: {
      texte: `Au mètre linéaire de film posé, ${PRIX_PLAGE} fourni et posé. Une salle de bain (meuble vasque, murs carrelés, contour de baignoire) se situe généralement entre ${euros(FOURCHETTES.sdb.min)} et ${euros(FOURCHETTES.sdb.max)}.`,
      fourchette: fourchette("sdb"),
    },
    faq: [
      { q: "Le film tient-il sur du carrelage ?", a: "Oui, sur un carrelage sain et propre. Les joints creux sont lissés au préalable pour que le film reste plan ; un carrelage très en relief est étudié au cas par cas." },
      { q: "Peut-on recouvrir l'intérieur d'une douche ?", a: "Nous ne recouvrons pas les zones d'immersion permanente (bac et parois intérieures d'une douche à l'italienne). Les murs autour de la baignoire, le tablier et le meuble vasque, oui." },
      { q: "Comment l'entretenir ?", a: "Éponge douce et produit ménager courant. Pas d'abrasif, pas de solvant, pas de nettoyeur vapeur sur les joints." },
      { q: "Combien de temps dure la pose ?", a: "Une journée pour une salle de bain courante. La pièce est utilisable le soir même ; nous conseillons d'attendre 24 h avant une douche très chaude côté murs traités." },
      { q: "Combien ça coûte ?", a: `Entre ${euros(FOURCHETTES.sdb.min)} et ${euros(FOURCHETTES.sdb.max)} selon les surfaces retenues et la finition. Devis gratuit ${DELAI_REPONSE}.` },
    ],
    simulateur: "salle-de-bain",
    crmTypeProjet: "SDB",
  },
  {
    slug: "meubles",
    nom: "Covering meubles",
    court: "Meubles",
    titreSeo: "Covering meubles à Montpellier — relooker sans poncer ni peindre",
    descriptionSeo: `Commodes, buffets, dressings, meubles TV, têtes de lit recouverts d'un film Cover Styl'. ${fourchette("meuble")} par meuble. Devis ${DELAI_REPONSE}.`,
    h1: "Donner un nouveau style à un meuble, sans poncer ni peindre",
    accroche: "Commode, buffet, dressing, meuble TV, tête de lit : un film texturé posé sur place, sans odeur ni séchage.",
    intro: [
      "Un meuble solide mais démodé se recouvre en quelques heures. Le film adhésif Cover Styl' épouse les façades, les côtés, les plateaux et les moulures légères, en gardant poignées et charnières.",
      "Contrairement à la peinture, il n'y a ni ponçage, ni sous-couche, ni odeur, ni temps de séchage. Le meuble reste chez vous, dans sa pièce.",
    ],
    fond: "/images/fonds/photo-1764526624453-db32c24eca55",
    surfaces: [
      { titre: "Commodes, buffets, bibliothèques", texte: "Façades, tiroirs, côtés et plateaux ; les étagères visibles si vous le souhaitez." },
      { titre: "Armoires et dressings", texte: "Portes battantes ou coulissantes, recouvertes porte par porte." },
      { titre: "Meubles TV, consoles, bureaux", texte: "Plateaux et façades ; le plateau d'un bureau ou d'une table se recouvre aussi." },
      { titre: "Têtes de lit et portes intérieures", texte: "Une porte pleine ou une tête de lit en panneau se recouvre comme un meuble." },
    ],
    atouts: [
      { titre: "Sans ponçage ni sous-couche", texte: "Le film adhère sur mélaminé, stratifié, bois verni, métal." },
      { titre: "Sans odeur", texte: "Pas de solvant, pose en pièce habitée." },
      { titre: "Réversible", texte: "Retrait à chaud, sans trace." },
      { titre: "Quelques heures", texte: "Un meuble se recouvre en une demi-journée au plus." },
    ],
    deroulement: DEROULEMENT_PARTICULIER,
    prix: {
      texte: `Au mètre linéaire de film posé. Un meuble seul démarre à ${euros(FOURCHETTES.meuble.min)} ; le prix dépend du nombre de faces, de tiroirs et de la finition. Plusieurs meubles dans la même intervention font baisser le prix au mètre.`,
      fourchette: fourchette("meuble"),
    },
    faq: [
      { q: "Sur quels matériaux le film tient-il ?", a: "Sur les surfaces lisses et saines : mélaminé, stratifié, bois verni ou laqué, MDF peint, métal. Un bois brut ou une surface poreuse doit être préparé au préalable." },
      { q: "Les meubles en kit se recouvrent-ils ?", a: "Oui, c'est même le cas le plus fréquent : les panneaux mélaminés des meubles de grande distribution sont un support idéal." },
      { q: "Et les moulures ou les arrondis ?", a: "Le film se pose à chaud et suit les reliefs légers et les arrondis. Les moulures très profondes sont étudiées au cas par cas." },
      { q: "Peut-on recouvrir un plateau de table ?", a: "Oui. Le plateau résiste à l'usage courant et au nettoyage ; protégez-le des objets brûlants et des coupures." },
      { q: "Combien ça coûte ?", a: `${euros(FOURCHETTES.meuble.min)} et plus par meuble, selon sa taille et la finition. Devis gratuit ${DELAI_REPONSE} sur photos.` },
    ],
    simulateur: "meubles",
    crmTypeProjet: "MEUBLES",
  },
  {
    slug: "professionnel",
    nom: "Covering pour professionnels",
    court: "Professionnels",
    titreSeo: "Covering pour professionnels à Montpellier — hôtels, restaurants, cabinets, cuisinistes",
    descriptionSeo: `Comptoirs, mobilier, portes et murs de locaux professionnels recouverts d'un film Cover Styl', hors heures d'ouverture. Pose en sous-traitance pour cuisinistes et agenceurs. Devis ${DELAI_REPONSE}.`,
    h1: "Rénover un local professionnel sans fermer",
    accroche: "Hôtels, restaurants, cabinets, commerces : comptoirs, mobilier, portes et murs recouverts hors heures d'ouverture. Pose en sous-traitance pour les cuisinistes et agenceurs.",
    intro: [
      "Fermer un établissement pour rénover coûte plus que la rénovation. Le covering se pose hors heures d'ouverture, sans poussière ni odeur, et l'espace est exploitable dès la fin de la pose.",
      "Nous intervenons aussi en sous-traitance pour les cuisinistes, agenceurs et entreprises générales qui veulent proposer le covering à leurs clients sans monter une équipe : vous vendez, nous posons, sous votre marque ou la nôtre.",
    ],
    fond: "/images/fonds/photo-1767022724924-993b00fc04b3",
    surfaces: [
      { titre: "Comptoirs et bars", texte: "Façade et plateau de comptoir, recouverts en une nuit." },
      { titre: "Mobilier de chambres et de salles", texte: "Têtes de lit, bureaux, armoires, tables : une chambre d'hôtel se traite en quelques heures." },
      { titre: "Portes, placards, cloisons", texte: "Portes de chambre ou de bureau, façades de rangement, panneaux muraux." },
      { titre: "Cuisines de cabinets et de bureaux", texte: "Kitchenettes et espaces de pause, comme une cuisine de particulier." },
    ],
    atouts: [
      { titre: "Hors heures d'ouverture", texte: "Soir, nuit ou jour de fermeture : pas d'interruption d'activité." },
      { titre: "Sans poussière ni odeur", texte: "Compatible avec un établissement occupé." },
      { titre: "Fiches techniques", texte: "Classement au feu et caractéristiques de chaque référence fournis sur demande." },
      { titre: "Sous-traitance", texte: "Pose pour le compte de cuisinistes, agenceurs et entreprises générales." },
    ],
    deroulement: [
      { titre: "Visite ou photos", texte: "Nous relevons les surfaces sur place ou sur vos photos et plans." },
      { titre: `Devis ${DELAI_REPONSE}`, texte: "Chiffrage au mètre linéaire par surface, planning d'intervention hors heures d'ouverture." },
      { titre: "Échantillons et validation", texte: "Teintes validées sur échantillons, fiches techniques jointes si vous en avez besoin." },
      { titre: "Pose planifiée", texte: "Intervention aux créneaux convenus, espace exploitable dès la fin de la pose." },
    ],
    prix: {
      texte: `Au mètre linéaire de film posé, ${PRIX_PLAGE} fourni et posé ; les grands métrages font baisser le prix au mètre. Chaque projet professionnel est chiffré sur devis après visite ou sur plans.`,
      fourchette: fourchette("pro"),
    },
    faq: [
      { q: "Pouvez-vous intervenir de nuit ou le week-end ?", a: "Oui, le planning est fixé avec vous au devis : soirée, nuit ou jour de fermeture." },
      { q: "Le film supporte-t-il un usage intensif ?", a: "Les films Cover Styl' sont conçus pour les locaux recevant du public : résistance à l'usure, aux rayures et au nettoyage fréquent. Nous choisissons la gamme selon la sollicitation de la surface." },
      { q: "Avez-vous les documents pour un dossier ERP ?", a: "Les fiches techniques de chaque référence, avec leur classement au feu, sont disponibles sur demande et jointes au devis si vous le souhaitez." },
      { q: "Travaillez-vous en sous-traitance ?", a: "Oui, pour les cuisinistes, agenceurs et entreprises générales. Vous gardez la relation client ; nous assurons la pose et sa garantie." },
      { q: "Quel délai pour un projet professionnel ?", a: `Devis ${DELAI_REPONSE} après visite ou réception des plans, puis pose à la date convenue, selon la disponibilité des films chez le fabricant.` },
    ],
    simulateur: "professionnel",
    crmTypeProjet: "PRO",
  },
  {
    slug: "vitrages",
    nom: "Films pour vitrages",
    court: "Vitrages",
    titreSeo: "Films pour vitrages à Montpellier — intimité, décoration, protection solaire",
    descriptionSeo: `Films dépolis, décoratifs et solaires posés sur vos vitrages : intimité sans perdre la lumière, chaleur réduite, verre inchangé. Devis ${DELAI_REPONSE}.`,
    h1: "Habiller un vitrage : intimité, décoration, protection solaire",
    accroche: "Film dépoli, décoratif ou solaire posé côté intérieur sur vos vitres, sans changer le vitrage.",
    intro: [
      "Une baie vitrée trop exposée, une cloison vitrée de bureau, une vitrine à masquer : un film adhésif posé côté intérieur règle la question sans remplacer le verre.",
      "Le film dépoli garde la lumière et masque la vue ; le film décoratif habille une paroi ; le film solaire réduit la chaleur et les UV qui traversent le vitrage.",
    ],
    fond: "/images/fonds/photo-1737930172367-30621b8d5d75",
    surfaces: [
      { titre: "Cloisons vitrées et salles de réunion", texte: "Dépoli total ou en bandes, à hauteur de regard." },
      { titre: "Vitrines et portes vitrées", texte: "Masquage partiel, motif décoratif ou vitrophanie sobre." },
      { titre: "Baies vitrées et vérandas", texte: "Film solaire pour réduire la chaleur l'été et l'éblouissement." },
      { titre: "Salles de bain et chambres", texte: "Intimité sans store ni rideau." },
    ],
    atouts: [
      { titre: "Verre inchangé", texte: "Le film se retire proprement ; le vitrage reste d'origine." },
      { titre: "Lumière conservée", texte: "Un dépoli laisse passer la lumière tout en masquant la vue." },
      { titre: "Pose côté intérieur", texte: "À l'abri des intempéries, entretien simple." },
      { titre: "Fiche technique jointe", texte: "Les performances (lumière, chaleur, UV) sont celles de la fiche du film choisi." },
    ],
    deroulement: [
      { titre: "Photos et mesures", texte: "Dimensions des vitrages, exposition, besoin (intimité, décoration, chaleur)." },
      { titre: `Devis ${DELAI_REPONSE}`, texte: "Film proposé avec sa fiche technique, prix par vitrage." },
      { titre: "Pose", texte: "Vitre nettoyée, film posé à l'eau côté intérieur, séchage en quelques jours." },
      { titre: "Vérification", texte: "Contrôle des bords et de l'aspect avec vous." },
    ],
    prix: {
      texte: `Le prix dépend du film et de la surface : chaque vitrage est chiffré sur devis, avec la fiche technique du film proposé. Devis gratuit ${DELAI_REPONSE}.`,
      fourchette: "sur devis",
    },
    faq: [
      { q: "Voit-on à travers un film dépoli ?", a: "Non : il floute complètement la vue, dans les deux sens, tout en laissant passer la lumière. Pour garder une vue vers l'extérieur, un film solaire teinté est plus adapté ; il ne masque pas la vue la nuit, lumière allumée." },
      { q: "Le film solaire assombrit-il la pièce ?", a: "Un peu, selon le film : la transmission lumineuse est indiquée sur sa fiche technique, que nous joignons au devis pour que vous choisissiez en connaissance de cause." },
      { q: "Le film se pose-t-il à l'intérieur ou à l'extérieur ?", a: "À l'intérieur dans la quasi-totalité des cas : il est protégé des intempéries et s'entretient comme une vitre." },
      { q: "Peut-on le retirer ?", a: "Oui, proprement, sans résidu ni trace sur le verre." },
    ],
    simulateur: null,
    crmTypeProjet: "AUTRE",
  },
];

export function getPrestation(slug: string): Prestation | undefined {
  return PRESTATIONS.find((p) => p.slug === slug);
}
