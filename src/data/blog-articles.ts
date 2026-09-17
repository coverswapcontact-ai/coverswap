import { DELAI_REPONSE, FOURCHETTES, GARANTIE_ANS, PRIX_ML_COURANT_MAX, PRIX_ML_MIN, euros } from "@/lib/offre";

/**
 * Guides : les vraies questions que les gens posent avant un covering, avec
 * des réponses vérifiables. Les chiffres viennent de lib/offre (grille réelle
 * au mètre linéaire) ; ce qui n'est pas sûr n'est pas écrit.
 */
export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  /** Affichage. */
  date: string;
  /** Pour le balisage et le sitemap. */
  dateIso: string;
  dateModifiedIso: string;
  readTime: string;
  /** Photo de fond locale : `/images/fonds/<id>` (paire 800/1600). */
  image: string;
  content: {
    intro: string;
    sections: { title: string; text: string }[];
    tip?: string;
    conclusion: string;
  };
  relatedSlugs: string[];
}

const MAJ = "2026-09-17";
const MAJ_TEXTE = "17 septembre 2026";
const cuisineMin = euros(FOURCHETTES.cuisine.min);
const cuisineMax = euros(FOURCHETTES.cuisine.max);
const sdbMin = euros(FOURCHETTES.sdb.min);
const sdbMax = euros(FOURCHETTES.sdb.max);

export const articles: BlogArticle[] = [
  {
    slug: "prix-renovation-cuisine-covering",
    title: "Combien coûte une rénovation de cuisine par covering ?",
    excerpt: `Prix au mètre linéaire, fourchettes réelles (${cuisineMin} à ${cuisineMax} pour une cuisine complète), ce qui fait varier le devis et ce qu'il contient.`,
    category: "Prix",
    date: MAJ_TEXTE,
    dateIso: MAJ,
    dateModifiedIso: MAJ,
    readTime: "5 min",
    image: "/images/fonds/photo-1758315417321-83eb30a39710",
    content: {
      intro: `Le covering se facture au mètre linéaire de film posé, fourni et posé. Chez CoverSwap, le prix au mètre va de ${PRIX_ML_MIN} à ${PRIX_ML_COURANT_MAX} € dans la plupart des cas ; une cuisine complète — façades, plan de travail, crédence — se situe entre ${cuisineMin} et ${cuisineMax}. Voici comment ce chiffre se construit, pour lire un devis sans surprise.`,
      sections: [
        {
          title: "Pourquoi au mètre linéaire, et pas au mètre carré",
          text: "Le film Cover Styl' est vendu en rouleaux d'une largeur fixe (1,22 m). Ce qui compte pour la pose, c'est la longueur de film déroulée sur chaque surface, chants et retours compris. Le mètre linéaire reflète donc le vrai coût de matière et de main-d'œuvre, là où un prix au mètre carré ferait payer de la surface qui n'existe pas ou oublierait les chants.",
        },
        {
          title: "Ce qui fait varier le prix au mètre",
          text: `Trois choses. La gamme du film : une couleur unie mate coûte moins qu'un bois texturé, une pierre ou un textile (jusqu'à environ 30 % d'écart). La taille du chantier : plus le métrage est grand, plus le prix au mètre baisse, par paliers (jusqu'à 10 m, 10 à 15 m, au-delà). La complexité : des façades planes se posent vite ; des tiroirs nombreux, des moulures, un îlot avec retours prennent plus de temps. C'est pour cela que le devis détaille chaque surface avec son métrage et sa finition.`,
        },
        {
          title: "Les fourchettes constatées",
          text: `Cuisine complète (façades + plan de travail + crédence) : ${cuisineMin} à ${cuisineMax}. Façades seules d'une cuisine courante : souvent ${euros(900)} à ${euros(1800)}. Plan de travail et crédence seuls : ${euros(600)} à ${euros(1200)}. Ces montants sont fournis et posés, TVA non applicable (article 293 B du CGI). Un devis précis demande vos photos ou une visite ; il est gratuit et vous répond ${DELAI_REPONSE}.`,
        },
        {
          title: "Ce que comprend le devis",
          text: "Le film Cover Styl' de la référence choisie, la préparation des surfaces (nettoyage, dégraissage, lissage léger si nécessaire), la pose à chaud, les finitions des chants et arêtes, la vérification avec vous, et le déplacement s'il y en a un — écrit sur une ligne à part. L'acompte est de 30 % à la commande, le solde à la fin de l'intervention.",
        },
        {
          title: "Comparer avec un remplacement",
          text: "Remplacer une cuisine, c'est le mobilier, l'électroménager parfois, la plomberie et l'électricité à reprendre, plusieurs jours sans cuisine, et des gravats. Le covering garde tout ce qui fonctionne et ne change que l'apparence : c'est pour cela qu'il coûte plusieurs fois moins cher. Il ne remplace pas une cuisine dont la structure est abîmée : dans ce cas, nous le disons au devis.",
        },
      ],
      tip: "Envoyez des photos de face avec un objet de taille connue (une feuille A4 posée sur le plan de travail) : le métrage se lit mieux et le devis est plus juste dès le premier envoi.",
      conclusion: `Retenez l'ordre de grandeur : ${PRIX_ML_MIN} à ${PRIX_ML_COURANT_MAX} € le mètre linéaire posé, ${cuisineMin} à ${cuisineMax} pour une cuisine complète. Pour un chiffre exact, le simulateur montre le rendu et le devis dit le prix, surface par surface.`,
    },
    relatedSlugs: ["covering-adhesif-vs-peinture-cuisine", "comment-se-passe-une-pose-de-covering", "covering-adhesif-durabilite"],
  },
  {
    slug: "comment-se-passe-une-pose-de-covering",
    title: "Comment se passe une pose de covering, concrètement",
    excerpt: "De la première photo à la vérification finale : les étapes réelles d'un chantier de covering, ce que vous préparez, ce que nous faisons, combien de temps ça prend.",
    category: "Déroulement",
    date: MAJ_TEXTE,
    dateIso: MAJ,
    dateModifiedIso: MAJ,
    readTime: "5 min",
    image: "/images/fonds/photo-1639405069836-f82aa6dcb900",
    content: {
      intro: "Une pose de covering ne ressemble pas à un chantier classique : pas de démontage, pas de poussière, pas de séchage. Voici le déroulé exact, du premier contact à la fin de l'intervention.",
      sections: [
        {
          title: "1. Vos photos, ou une simulation",
          text: "Tout commence par des photos de la pièce ou du meuble, prises de face, bien éclairées. Le simulateur du site applique la finition de votre choix sur votre propre photo en moins d'une minute ; c'est un aperçu, pas un engagement sur la teinte exacte.",
        },
        {
          title: `2. Le devis, ${DELAI_REPONSE}`,
          text: "Nous relevons les surfaces sur vos photos (ou sur place quand les mesures l'exigent) et chiffrons au mètre linéaire, finition par finition. Le devis liste chaque surface, sa référence Cover Styl', le déplacement éventuel, et il est valable 30 jours.",
        },
        {
          title: "3. Les échantillons et la commande",
          text: "Les teintes se valident sur de vrais échantillons, chez vous, dans votre lumière : un chêne clair n'a pas le même rendu sous une fenêtre plein sud ou dans une pièce sombre. Une fois la référence arrêtée et le devis signé avec l'acompte de 30 %, le film est commandé au fabricant.",
        },
        {
          title: "4. Le jour de la pose",
          text: "Nous protégeons la pièce, puis nettoyons et dégraissons chaque surface : c'est l'étape qui garantit l'adhérence. Le film se pose à chaud, panneau par panneau, avec les chants et les arêtes finis un à un ; les poignées et charnières restent en place. Une cuisine courante prend une journée, un meuble quelques heures, une salle de bain une journée.",
        },
        {
          title: "5. La vérification avec vous",
          text: "À la fin, nous passons chaque surface en revue avec vous. Les éventuelles réserves sont notées par écrit et reprises. La pièce est utilisable le soir même : rien ne sèche, rien ne dégage d'odeur.",
        },
        {
          title: "Ce que vous préparez",
          text: "Vider les tiroirs et dégager les plans de travail, libérer l'accès aux surfaces, signaler tout défaut connu du support (un panneau qui gonfle, une peinture qui s'écaille). Le reste, nous le faisons.",
        },
      ],
      conclusion: "Photos, devis, échantillons, une journée de pose, vérification : cinq étapes, aucune surprise. Le simulateur vous donne le point de départ.",
    },
    relatedSlugs: ["prix-renovation-cuisine-covering", "entretenir-revetement-adhesif", "covering-adhesif-durabilite"],
  },
  {
    slug: "covering-adhesif-vs-peinture-cuisine",
    title: "Covering adhésif ou peinture : quel choix pour votre cuisine ?",
    excerpt: "Deux façons de changer une cuisine sans la remplacer. Durée du chantier, tenue dans le temps, rendu, prix, réversibilité : la comparaison honnête.",
    category: "Comparatif",
    date: MAJ_TEXTE,
    dateIso: "2025-03-18",
    dateModifiedIso: MAJ,
    readTime: "5 min",
    image: "/images/fonds/photo-1722605090433-41d1183a792d",
    content: {
      intro: "Repeindre ou recouvrir ? Les deux évitent le remplacement de la cuisine. Ils ne donnent pas le même résultat ni la même tenue, et ne se prêtent pas aux mêmes surfaces.",
      sections: [
        {
          title: "Le chantier",
          text: "La peinture demande un dégraissage, un ponçage, une sous-couche d'accroche, deux couches et des temps de séchage entre chaque : plusieurs jours, avec les façades démontées ou la cuisine immobilisée, et des odeurs. Le covering se pose en une journée, à chaud, sur des surfaces nettoyées ; la cuisine sert le soir même.",
        },
        {
          title: "Le rendu",
          text: "La peinture donne une couleur unie, mate ou satinée, avec le risque de traces de pinceau ou de rouleau sur un mélaminé. Le covering propose aussi des couleurs unies, mais surtout des textures — bois, pierre, béton, métal, textile — avec un relief au toucher qu'une peinture ne peut pas imiter.",
        },
        {
          title: "La tenue",
          text: `Une peinture sur façades de cuisine s'use aux points de contact (poignées, arêtes) et s'écaille si l'accroche n'était pas parfaite. Le film Cover Styl' est prévu pour les cuisines : projections, nettoyage courant, chaleur d'usage. Films et pose sont garantis ${GARANTIE_ANS} ans contre le décollement et la décoloration.`,
        },
        {
          title: "La réversibilité",
          text: "Une façade peinte reste peinte : pour revenir en arrière, il faut décaper. Le film se retire à chaud, sans abîmer le support d'origine : un point décisif pour un locataire ou pour une cuisine que l'on veut pouvoir changer encore.",
        },
        {
          title: "Le prix",
          text: `Repeindre soi-même coûte peu en matériel, beaucoup en temps et en risque de résultat inégal ; faire repeindre par un peintre revient souvent au niveau du covering. Le covering se chiffre au mètre linéaire, ${PRIX_ML_MIN} à ${PRIX_ML_COURANT_MAX} € posé, soit ${cuisineMin} à ${cuisineMax} pour une cuisine complète.`,
        },
        {
          title: "Quand la peinture reste le bon choix",
          text: "Sur du bois massif brut que l'on veut garder visible, sur des surfaces très irrégulières, ou pour un mur : là, la peinture est plus adaptée. Le covering excelle sur les surfaces lisses et planes — mélaminé, stratifié, laqué, métal, carrelage sain.",
        },
      ],
      conclusion: "Peinture : bon marché en matériel, long, résultat uni, définitif. Covering : une journée, textures réalistes, garanti, réversible. Pour des façades de cuisine en mélaminé, le covering est presque toujours le choix le plus durable.",
    },
    relatedSlugs: ["prix-renovation-cuisine-covering", "covering-adhesif-durabilite", "quelle-finition-choisir"],
  },
  {
    slug: "covering-adhesif-durabilite",
    title: "Covering adhésif : combien de temps ça tient, et à quoi ça résiste ?",
    excerpt: `Eau, chaleur, rayures, soleil : ce que supporte un film Cover Styl' posé dans les règles, ce qui l'abîme, et ce que couvre la garantie de ${GARANTIE_ANS} ans.`,
    category: "Durabilité",
    date: MAJ_TEXTE,
    dateIso: "2025-02-14",
    dateModifiedIso: MAJ,
    readTime: "4 min",
    image: "/images/fonds/photo-1759238136854-913e5e383308",
    content: {
      intro: "La question revient toujours : est-ce que ça tient ? Oui, à condition de poser le bon film sur un support sain, à chaud, avec des chants finis. Voici ce qu'un covering supporte, et ce qu'il ne supporte pas.",
      sections: [
        {
          title: "L'eau et l'humidité",
          text: "Les films Cover Styl' sont conçus pour les cuisines et les salles de bain : projections, éclaboussures, humidité ambiante et nettoyage à l'éponge ne les affectent pas. La seule limite est l'immersion permanente : nous ne recouvrons pas l'intérieur d'un bac de douche ni le fond d'une baignoire.",
        },
        {
          title: "La chaleur",
          text: "Un film supporte la chaleur d'un usage courant de cuisine. Au contact direct des plaques de cuisson ou d'un plat sortant du four posé sans dessous-de-plat, il peut marquer : nous étudions cette bande au cas par cas et utilisons les références prévues pour les hautes températures. Un dessous-de-plat reste la bonne habitude, comme sur un stratifié.",
        },
        {
          title: "Les rayures et les chocs",
          text: "Le film résiste à l'usage quotidien : frottements, ongles, objets déplacés. Il n'est pas incassable : une coupure au couteau directement sur le plan de travail ou un choc violent sur une arête peuvent l'entailler. On découpe sur une planche, comme sur n'importe quel plan de travail.",
        },
        {
          title: "Le soleil",
          text: "Les films sont traités contre la décoloration ; une façade exposée plein sud garde sa teinte. Cette tenue fait partie de la garantie.",
        },
        {
          title: "Ce qui l'abîme vraiment",
          text: "Les éponges abrasives, les solvants (acétone, dissolvant), le nettoyeur vapeur sur les joints et un support qui bougeait déjà avant la pose (panneau gonflé par l'eau, peinture qui s'écaille). C'est pour cela que la préparation et le diagnostic du support comptent autant que le film.",
        },
        {
          title: "La garantie",
          text: `Films et pose sont garantis ${GARANTIE_ANS} ans contre le décollement et la décoloration en usage normal ; certaines références haute température ont une garantie fabricant étendue. Les exclusions (chocs, coupures, produits abrasifs, défaut du support signalé) sont écrites dans nos conditions générales.`,
        },
      ],
      conclusion: `Posé correctement sur une surface saine, un covering tient au moins la durée de sa garantie de ${GARANTIE_ANS} ans, et peut être retiré ou recouvert à nouveau le jour où l'on veut changer.`,
    },
    relatedSlugs: ["entretenir-revetement-adhesif", "covering-salle-de-bain-carrelage", "covering-adhesif-vs-peinture-cuisine"],
  },
  {
    slug: "covering-salle-de-bain-carrelage",
    title: "Recouvrir un carrelage de salle de bain sans le casser",
    excerpt: "Ce qui se recouvre dans une salle de bain (murs carrelés, meuble vasque, tablier de baignoire), ce qui ne se recouvre pas, et comment le film résiste à l'humidité.",
    category: "Salle de bain",
    date: MAJ_TEXTE,
    dateIso: MAJ,
    dateModifiedIso: MAJ,
    readTime: "4 min",
    image: "/images/fonds/photo-1754788358645-d6e6cca12e25",
    content: {
      intro: "Un carrelage de salle de bain démodé mais sain n'a pas besoin d'être cassé. Le covering le recouvre d'un film prévu pour les pièces humides, en une journée, sans gravats.",
      sections: [
        {
          title: "Ce qui se recouvre",
          text: "Les murs carrelés hors zone d'immersion, le meuble sous la vasque, le tablier et les coffrages de baignoire, les portes et placards, une colonne de rangement. Une salle de bain courante se traite en une journée.",
        },
        {
          title: "Ce qui ne se recouvre pas",
          text: "L'intérieur d'une douche à l'italienne (bac et parois immergées), le fond d'une baignoire, le sol. Ces zones restent d'origine ou relèvent d'une autre solution ; nous le disons dès le devis.",
        },
        {
          title: "Les joints du carrelage",
          text: "Des joints creux marqueraient le film. Ils sont lissés au préalable pour que la surface soit plane ; un carrelage très en relief est étudié au cas par cas. Les bords du film sont traités pour que l'eau ne s'infiltre pas derrière.",
        },
        {
          title: "Combien de temps, combien ça coûte",
          text: `Une journée de pose pour une salle de bain courante ; nous conseillons d'attendre 24 h avant une douche très chaude côté murs traités. Au mètre linéaire, une salle de bain (meuble vasque, murs carrelés, contour de baignoire) se situe généralement entre ${sdbMin} et ${sdbMax}, fournie et posée.`,
        },
        {
          title: "L'entretien",
          text: "Éponge douce et produit ménager courant. Pas d'abrasif, pas de solvant, pas de nettoyeur vapeur sur les joints.",
        },
      ],
      conclusion: "Murs carrelés, meuble vasque, tablier de baignoire : tout ce qui est hors immersion se recouvre, en une journée, sans casser. Une photo suffit pour savoir ce qui est possible chez vous.",
    },
    relatedSlugs: ["covering-adhesif-durabilite", "entretenir-revetement-adhesif", "comment-se-passe-une-pose-de-covering"],
  },
  {
    slug: "quelle-finition-choisir",
    title: "Quelle finition choisir : bois, pierre, béton, couleur unie ?",
    excerpt: `Comment choisir parmi les familles du catalogue Cover Styl' selon la pièce, la lumière et l'usage — et pourquoi la teinte se valide toujours sur échantillon.`,
    category: "Finitions",
    date: MAJ_TEXTE,
    dateIso: "2025-03-02",
    dateModifiedIso: MAJ,
    readTime: "5 min",
    image: "/images/fonds/photo-1704383014623-a6630096ff8c",
    content: {
      intro: "Le catalogue compte près de cinq cents références. Le bon choix dépend de trois choses : la pièce, la lumière et ce que la surface va vivre. Voici comment trancher.",
      sections: [
        {
          title: "Bois",
          text: "La famille la plus large : chênes clairs, noyers, teck, wengé, bois blanchis. Un bois clair agrandit une petite cuisine ; un bois foncé réchauffe une pièce très lumineuse. Sur des façades de cuisine, c'est le choix le plus courant ; sur un meuble, il redonne l'aspect d'un meuble massif.",
        },
        {
          title: "Pierre et marbre",
          text: "Carrare, Calacatta, Marquina, travertin, ardoise : pour un plan de travail, une crédence ou un meuble vasque. Le veinage se dessine à la pose ; sur une grande surface, nous orientons les lés pour qu'il reste cohérent.",
        },
        {
          title: "Béton et ciment",
          text: "Gris clair à anthracite, aspect ciré ou brut. Très bien sur une crédence, un îlot ou un comptoir professionnel ; à doser dans une pièce déjà sombre.",
        },
        {
          title: "Couleurs unies",
          text: "Mat, satiné ou brillant, du blanc cassé au noir profond en passant par le vert sauge ou le terracotta. C'est la famille la plus économique et la plus facile à marier ; un mat foncé montre davantage les traces de doigts qu'un satiné.",
        },
        {
          title: "Métal, textile, paillettes",
          text: "Inox brossé, laiton, cuivre pour un comptoir ou une crédence ; cuir et textile pour une tête de lit ou une porte ; paillettes pour un accent. Ce sont les gammes les plus hautes : le prix au mètre monte d'environ 20 à 30 % par rapport à une couleur unie.",
        },
        {
          title: "Pourquoi on valide sur échantillon",
          text: "Un écran n'affiche pas une teinte, il l'approche. Le simulateur donne un aperçu réaliste de l'effet d'ensemble ; la référence exacte se choisit sur un échantillon posé sur la surface, dans la lumière de la pièce, le matin et le soir.",
        },
      ],
      tip: "Deux finitions au plus dans une même pièce : une pour les façades, une pour le plan de travail ou la crédence. Au-delà, l'œil ne sait plus où se poser.",
      conclusion: "Bois pour la chaleur, pierre pour la matière, béton pour le caractère, couleur unie pour la simplicité et le budget. Le simulateur pour se décider, l'échantillon pour être sûr.",
    },
    relatedSlugs: ["marbre-bois-beton-quel-covering", "prix-renovation-cuisine-covering", "covering-adhesif-vs-peinture-cuisine"],
  },
  {
    slug: "marbre-bois-beton-quel-covering",
    title: "Quel revêtement pour quelle pièce ?",
    excerpt: "Cuisine, salle de bain, chambre, bureau, local professionnel : les finitions qui conviennent à chaque usage, et celles à éviter.",
    category: "Finitions",
    date: MAJ_TEXTE,
    dateIso: "2025-02-22",
    dateModifiedIso: MAJ,
    readTime: "4 min",
    image: "/images/fonds/photo-1566041510394-cf7c8fe21800",
    content: {
      intro: "Toutes les finitions ne conviennent pas à toutes les surfaces. L'usage décide avant le goût : un plan de travail ne vit pas comme une tête de lit.",
      sections: [
        {
          title: "Cuisine",
          text: "Façades : bois, couleur unie mate ou satinée. Plan de travail et crédence : pierre, béton, ou couleur unie foncée, dans une gamme résistante au nettoyage fréquent. Autour des plaques : références hautes températures, validées au devis.",
        },
        {
          title: "Salle de bain",
          text: "Murs carrelés : pierre claire, béton, couleur unie. Meuble vasque : bois ou couleur unie. On évite les textures très profondes près des points d'eau, plus longues à sécher et à nettoyer.",
        },
        {
          title: "Chambre et séjour",
          text: "Dressing, commode, tête de lit, meuble TV : bois, textile, cuir, couleur unie. Ces surfaces sont peu sollicitées : toutes les familles conviennent, y compris les plus décoratives.",
        },
        {
          title: "Bureau et local professionnel",
          text: "Comptoirs et plans de travail : gammes résistantes, béton, métal brossé, couleurs unies. Portes et cloisons : couleur unie ou bois. Les fiches techniques de chaque référence, avec leur classement au feu, sont disponibles pour un dossier d'établissement recevant du public.",
        },
        {
          title: "Portes et placards",
          text: "Une porte pleine se recouvre comme un meuble : bois pour l'assortir au parquet, couleur unie pour la faire disparaître dans le mur.",
        },
      ],
      conclusion: "Une règle simple : plus la surface est sollicitée (plan de travail, comptoir), plus la gamme doit être résistante ; plus elle est décorative (tête de lit, dressing), plus on peut oser.",
    },
    relatedSlugs: ["quelle-finition-choisir", "covering-salle-de-bain-carrelage", "renovation-locataire-covering"],
  },
  {
    slug: "entretenir-revetement-adhesif",
    title: "Entretenir un revêtement adhésif : les bons gestes",
    excerpt: "Ce qu'il faut faire, et surtout ne pas faire, pour qu'un covering garde son aspect : produits, éponges, chaleur, chocs.",
    category: "Entretien",
    date: MAJ_TEXTE,
    dateIso: "2025-03-10",
    dateModifiedIso: MAJ,
    readTime: "3 min",
    image: "/images/fonds/photo-1642505172378-a6f5e5b15580",
    content: {
      intro: "Un covering s'entretient comme un stratifié de bonne qualité : simplement, avec les bons produits. Trois règles suffisent.",
      sections: [
        {
          title: "Le nettoyage courant",
          text: "Un chiffon ou une éponge douce, de l'eau tiède et un produit ménager courant (liquide vaisselle, nettoyant multi-surfaces sans solvant). Rincer à l'eau claire sur un plan de travail, essuyer.",
        },
        {
          title: "Ce qu'il faut éviter",
          text: "Les éponges abrasives et la laine d'acier, l'acétone, le dissolvant, l'alcool à brûler et les dégraissants très agressifs, le nettoyeur vapeur sur les joints et les chants. Ils attaquent la surface ou décollent les bords.",
        },
        {
          title: "Chaleur et coupures",
          text: "Un dessous-de-plat pour les casseroles et plats sortant du four ; une planche pour découper. Ce sont les deux seules habitudes à garder, les mêmes que sur n'importe quel plan de travail stratifié.",
        },
        {
          title: "Les premières 24 heures",
          text: "Le film adhère complètement en quelques heures. Le jour de la pose, on évite de mouiller abondamment les chants et de tirer sur les arêtes ; dès le lendemain, usage normal.",
        },
        {
          title: "Une rayure ou un choc",
          text: "Une petite marque ne se répare pas comme une peinture. Selon l'endroit, la façade ou la bande concernée peut être recouverte à nouveau sans refaire l'ensemble ; nous le regardons sur photo.",
        },
      ],
      tip: "Un chiffon microfibre légèrement humide chaque semaine évite l'accumulation de graisse en cuisine, la seule chose qui ternit vraiment un film mat.",
      conclusion: "Doux, sans solvant, sans abrasif : avec ces gestes, le covering garde son aspect pendant toute la durée de sa garantie et au-delà.",
    },
    relatedSlugs: ["covering-adhesif-durabilite", "covering-salle-de-bain-carrelage", "quelle-finition-choisir"],
  },
  {
    slug: "renovation-locataire-covering",
    title: "Rénover en location : le covering, réversible et sans autorisation lourde",
    excerpt: "Pourquoi le film adhésif convient aux locataires et aux propriétaires bailleurs : retrait sans trace, pose en une journée, logement remis en l'état.",
    category: "Location",
    date: MAJ_TEXTE,
    dateIso: "2025-02-05",
    dateModifiedIso: MAJ,
    readTime: "4 min",
    image: "/images/fonds/photo-1742490382029-98357c08f3cd",
    content: {
      intro: "Un locataire ne peut pas casser une cuisine ; un bailleur ne veut pas immobiliser un logement plusieurs semaines entre deux locataires. Le covering répond aux deux : il change l'apparence sans toucher à la structure, et il se retire.",
      sections: [
        {
          title: "Pour le locataire",
          text: "Le film se pose sur les façades, le plan de travail ou le carrelage existants, sans démontage. Au départ, il se retire à chaud sans abîmer le support : le logement retrouve son état d'origine. Prévenez votre propriétaire par écrit avant de recouvrir des éléments qui lui appartiennent : c'est une question de bonne foi plus que d'autorisation formelle, et le caractère réversible rassure.",
        },
        {
          title: "Pour le bailleur",
          text: "Entre deux locataires, une cuisine ou une salle de bain vieillissantes se remettent au goût du jour en une journée, sans travaux lourds ni délai de séchage. Le logement se reloue plus vite, sans investissement de remplacement complet.",
        },
        {
          title: "Ce qui se recouvre dans un logement loué",
          text: "Façades et plan de travail de la cuisine, crédence, carrelage mural de salle de bain hors immersion, meuble vasque, portes intérieures, placards. Le sol et les zones immergées restent en dehors.",
        },
        {
          title: "Budget",
          text: `Au mètre linéaire, fourni et posé : ${cuisineMin} à ${cuisineMax} pour une cuisine complète, ${sdbMin} à ${sdbMax} pour une salle de bain, un meuble seul dès ${euros(FOURCHETTES.meuble.min)}. Devis gratuit ${DELAI_REPONSE} sur photos.`,
        },
      ],
      conclusion: "Réversible, rapide, sans gravats : le covering est la rénovation qui ne pose pas de problème à l'état des lieux de sortie.",
    },
    relatedSlugs: ["prix-renovation-cuisine-covering", "covering-adhesif-durabilite", "comment-se-passe-une-pose-de-covering"],
  },
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getRelatedArticles(slugs: string[]): BlogArticle[] {
  return slugs.map((s) => getArticleBySlug(s)).filter((a): a is BlogArticle => !!a);
}
