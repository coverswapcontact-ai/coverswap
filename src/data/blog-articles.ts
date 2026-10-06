import { DELAI_RENDU, DELAI_REPONSE, DUREE_POSE_TEXTE, GARANTIE_ANS, PRIX_ML_MAX, PRIX_ML_MIN } from "@/lib/offre";
import { lienSimuler } from "@/lib/liens-simulateur";
import type { IdFamilleTarifs } from "@/lib/tarifs-site";

/**
 * Guides : les vraies questions que les gens posent avant un covering, avec
 * des réponses vérifiables. Les chiffres viennent de lib/offre (la plage au
 * mètre linéaire) ; ce qui n'est pas sûr n'est pas écrit. Aucun montant par
 * pièce (relecture des lots B et C : les fourchettes d'`offre.ts` contredisaient
 * les tarifs du CRM) : les guides qui parlent du prix montrent les tarifs
 * publiés (`prix` d'une section). Une image d'ambiance est dite telle quelle,
 * jamais présentée comme une pièce où l'on a posé.
 *
 * Site 3.0, lot C7 : trois guides écrits avec la bibliothèque d'images (`paire` : l'« après » d'une paire de la
 * série 2, en curseur « Ambiance · avant / après » ; `imagePreparee` : une photo utile, « Ambiance » ; noms du
 * manifeste) et les prix du site (`prix` d'une section : les tarifs du CRM de ces familles, `ContenuPrix`). Leur texte
 * ne porte AUCUN montant (testé) : un prix n'est jamais écrit à la main, seulement lu au CRM (ou son repli
 * documenté). 800 mots au plus chacun (testé).
 */
export type SectionArticle = {
  title: string;
  text: string;
  /** Lot C7 : une image de la bibliothèque sous le texte — l'« après » d'une paire (curseur, cartels, « Essayer ») ou une photo utile (« Ambiance »). */
  image?: string;
  /** Lot C7 : les prix publiés de ces familles sous le texte (« Sur devis » quand le CRM n'en publie pas). */
  prix?: readonly IdFamilleTarifs[];
};

/** L'image d'ouverture : la photo de fond des premiers guides, ou (lot C7) une image de la bibliothèque. */
type IllustrationArticle =
  | {
      /** Photo de fond locale : `/images/fonds/<id>` (paire 800/1600). */
      image: string;
      paire?: never;
      imagePreparee?: never;
    }
  | {
      image?: never;
      /** L'« après » d'une paire de la série 2 (nom du manifeste) : le curseur « Ambiance · avant / après » d'ouverture, l'image du balisage. */
      paire: string;
      imagePreparee?: never;
    }
  | {
      image?: never;
      paire?: never;
      /** Une photo utile de la bibliothèque (nom du manifeste) : la photo « Ambiance » d'ouverture, l'image du balisage. */
      imagePreparee: string;
    };

export type BlogArticle = IllustrationArticle & {
  slug: string;
  title: string;
  /**
   * Site 3.0 (lot F2) : le titre de l'onglet et des résultats, sans « | CoverSwap » (ajouté par la page), quand le
   * titre de la page ne tient pas en 60 caractères ou vise une autre requête (`docs/SEO.md`, carte des intentions).
   */
  titreSeo?: string;
  /** La description (155 caractères au plus, testé). */
  excerpt: string;
  category: string;
  /** Affichage. */
  date: string;
  /** Pour le balisage et le sitemap. */
  dateIso: string;
  dateModifiedIso: string;
  readTime: string;
  /** Lot C7 : la pièce du guide ; le bouton de la colonne devient « Simuler ma cuisine » (`?projet=`). */
  projet?: "cuisine";
  content: {
    intro: string;
    sections: SectionArticle[];
    tip?: string;
    conclusion: string;
  };
  /** Lot C7 : « Pour aller plus loin », sous la conclusion : la prestation, le simulateur, les guides voisins. */
  liens?: readonly { href: string; libelle: string }[];
  relatedSlugs: string[];
};

const MAJ = "2026-09-17";
const MAJ_TEXTE = "17 septembre 2026";

const C7 = "2026-10-06";
const C7_TEXTE = "6 octobre 2026";
const DEPUIS_GUIDE = "blog";
const SIMULER_CUISINE = lienSimuler({ projet: "cuisine", depuis: DEPUIS_GUIDE });

export const articles: BlogArticle[] = [
  {
    slug: "cuisine-bordeaux-brillante-renover-sans-changer",
    title: "Cuisine bordeaux brillante : la rénover sans la changer",
    titreSeo: "Rénover une cuisine bordeaux brillante",
    excerpt: "Façades bordeaux laquées, plan gris moucheté : ce qu'on garde, ce qu'on recouvre, deux directions possibles et comment se fait le prix.",
    category: "Cuisine",
    date: C7_TEXTE,
    dateIso: C7,
    dateModifiedIso: C7,
    readTime: "3 min",
    paire: "cuisine-bordeaux-brillante-apres-couleur",
    projet: "cuisine",
    content: {
      intro: `Le bordeaux brillant a équipé beaucoup de cuisines d'appartement dans les années 2000. Le plus souvent, les meubles vont bien : les caissons sont solides, les portes ferment, les tiroirs coulissent. Ce qui date, c'est la couleur et le reflet. Et c'est exactement ce que le covering change : on garde la cuisine, on change sa surface, en ${DUREE_POSE_TEXTE}.`,
      sections: [
        {
          title: "Ce qu'on regarde avant de parler couleur",
          text: "Une façade brillante est en général laquée ou en panneau polymère : lisse, peu poreuse, le film y adhère bien après un nettoyage et un dégraissage soignés. Ce qui nous arrête, c'est le support : un panneau qui a gonflé près de l'évier ou du lave-vaisselle, une laque qui s'écaille, un chant qui ne tient plus. Montrez-les sur vos photos : on vous dit au devis ce qu'on peut reprendre, et ce qu'il vaut mieux changer.",
        },
        {
          title: "Ce qui reste en place",
          text: "Les caissons, les portes, les tiroirs, les poignées et les charnières, l'évier, la plaque, la hotte, le carrelage. Rien n'est démonté ni emporté. On pose le film façade par façade, chants compris, puis on habille le plan de travail sans le déposer. Il n'y a ni poussière ni séchage : la cuisine sert le soir même.",
        },
        {
          title: "Deux directions pour la même cuisine",
          text: "Ces deux images d'ambiance montrent deux partis pour une même cuisine en L. En haut de page, un vert profond mat sur les façades et un chêne pâle sur le plan : la cuisine garde du caractère, sans le reflet. Ci-dessous, un gris clair mat et un chêne plus soutenu : la pièce paraît plus grande et plus calme. Dans les deux cas, le carrelage blanc et les poignées inox ne bougent pas. Les matières posées sont écrites sous chaque image ; vous pouvez les essayer sur la photo de votre cuisine.",
          image: "cuisine-bordeaux-brillante-apres-neutre",
        },
        {
          title: "Le mat change plus que la couleur",
          text: "Le brillant renvoie la lumière de la fenêtre et montre chaque trace de doigt. Une finition mate, ou un bois au léger relief, calme la pièce et marque beaucoup moins. Si vous aimez le rouge, rien n'interdit de le garder : un bordeaux mat ou une terracotta ne font pas le même effet qu'une laque. Dans tous les cas, on valide la teinte sur de vrais échantillons, chez vous, à la lumière de votre cuisine : un vert profond n'a pas le même rendu sous une fenêtre plein sud ou dans une pièce sombre.",
        },
        {
          title: "Le plan de travail et la crédence",
          text: "Le plan gris moucheté vieillit lui aussi la cuisine. Il s'habille sans dépose, en bois, en pierre ou en béton, chants finis. Près des plaques de cuisson, on vérifie sur place ce qui est possible et on pose les références prévues pour la chaleur. La crédence carrelée peut rester telle quelle, comme sur ces images, ou se recouvrir sans casser un carreau.",
        },
        {
          title: "Comment se fait le prix",
          text: `On facture au mètre linéaire de film posé, fourni et posé. Le prix dépend surtout de la pose (le nombre de découpes, l'accès, l'état du support, le métrage), bien plus que de la teinte choisie. Une cuisine en L, façades et plan de travail, se chiffre sur vos photos : le devis est gratuit, il arrive ${DELAI_REPONSE} et détaille chaque surface. Voici les prix que nous publions.`,
          prix: ["CUISINE"],
        },
      ],
      tip: `Prenez votre cuisine de face, à hauteur d'yeux, lumière allumée. Le simulateur pose la matière choisie sur votre propre photo en ${DELAI_RENDU}, et on chiffre ensuite sur la même photo.`,
      conclusion: `Une cuisine bordeaux brillante en bon état n'a pas besoin d'être remplacée. On garde ce qui fonctionne, on change la surface en ${DUREE_POSE_TEXTE}, et le film se retire à chaud le jour où vous voulez changer encore. Le plus simple pour commencer : essayer une teinte sur votre photo.`,
    },
    liens: [
      { href: "/prestations/cuisine", libelle: "Le covering de cuisine : ce qu'on recouvre, nos prix, nos cas" },
      { href: SIMULER_CUISINE, libelle: "Essayer une teinte sur la photo de ma cuisine" },
      { href: "/matieres", libelle: "Voir toutes les matières" },
    ],
    relatedSlugs: ["cuisine-blanche-jaunie-que-faire", "covering-peinture-remplacement-comparatif", "quelle-finition-choisir"],
  },
  {
    slug: "cuisine-blanche-jaunie-que-faire",
    title: "Cuisine blanche qui a jauni : que faire ?",
    excerpt: "Pourquoi le blanc jaunit, ce que le nettoyage peut faire, les signes qui comptent sur le meuble, et trois façons d'en sortir sans casser.",
    category: "Cuisine",
    date: C7_TEXTE,
    dateIso: C7,
    dateModifiedIso: C7,
    readTime: "3 min",
    paire: "cuisine-blanche-jaunie-apres-bois",
    projet: "cuisine",
    content: {
      intro: "Une cuisine blanche des années 1980 ou 1990 finit presque toujours par virer au crème, puis au jaune. Ce n'est pas forcément de la saleté : c'est souvent la surface elle-même qui a vieilli. Avant de penser à tout changer, il faut savoir ce qui a jauni, et si le meuble, dessous, est encore sain.",
      sections: [
        {
          title: "Pourquoi le blanc jaunit",
          text: "Les façades blanches de cette époque sont le plus souvent en mélaminé, en stratifié ou laquées. Au fil des années, la lumière du jour, la chaleur de la cuisson et les graisses en suspension changent la teinte de la surface. Le jaune est souvent plus marqué près de la fenêtre, de la hotte et du four. Ce qui a vieilli, c'est la couche du dessus : le panneau, lui, est en général intact.",
        },
        {
          title: "Ce que le nettoyage peut faire, et ce qu'il ne peut pas",
          text: "Commencez par un dégraissant doux et une éponge souple : le film gras jaunit aussi, et il part. Si la façade redevient blanche, c'était de la graisse. Si elle reste crème, la teinte est dans la surface, et aucun produit ne la rendra blanche. Les produits agressifs (javel pure, solvants, éponges qui grattent) abîment la surface sans la blanchir.",
        },
        {
          title: "Les signes à regarder de près",
          text: "Sur cette image d'ambiance, trois choses à repérer : le chant qui se décolle, de petits éclats, une poignée en plastique qui a jauni elle aussi. Un chant décollé ou un éclat se reprennent souvent avant la pose ; on vous le dit au devis, sur vos photos. Un panneau qui a gonflé à l'eau, sous l'évier par exemple, ou qui s'effrite, ne se répare pas avec un film : il faut changer la pièce. Les poignées restent en place pendant la pose ; si les vôtres ont jauni, c'est le bon moment pour les changer.",
          image: "usure-detail",
        },
        {
          title: "Trois façons d'en sortir",
          text: "Repeindre : c'est possible, mais sur un mélaminé il faut poncer, poser une sous-couche d'accroche, deux couches, et attendre le séchage entre chacune ; plusieurs jours, et la peinture s'use vite aux poignées et aux arêtes. Remplacer : justifié si les caissons sont abîmés, mais c'est le chantier le plus lourd. Recouvrir : un film posé à chaud sur les façades saines, sans démontage, la cuisine utilisable le soir même. Le comparatif complet des trois est dans un guide à part.",
        },
        {
          title: "Deux directions pour la même cuisine",
          text: "En haut de page, des façades en chêne pâle et un plan effet marbre noir : la cuisine des années 1980 prend la chaleur du bois. Ci-dessous, un bleu nuit mat et un plan en chêne. Sur ces deux images d'ambiance, le carrelage à frise reste tel quel : il peut se recouvrir aussi, mais rien n'y oblige. Et si vous tenez au blanc, un blanc neuf, mat ou satiné, se pose de la même façon.",
          image: "cuisine-blanche-jaunie-apres-couleur",
        },
        {
          title: "Comment se fait le prix",
          text: `On facture au mètre linéaire de film posé, fourni et posé : les façades seules, ou les façades et le plan de travail. Le prix dépend de la pose (découpes, accès, état du support, métrage) plus que de la teinte. Le devis est gratuit et arrive ${DELAI_REPONSE} après vos photos. Voici les prix que nous publions.`,
          prix: ["CUISINE"],
        },
      ],
      tip: "Photographiez une façade près de la fenêtre, une autre loin d'elle, et l'intérieur du meuble sous l'évier : on voit tout de suite si c'est la surface ou le panneau qui a vieilli.",
      conclusion: `Un blanc jauni n'est pas une raison de changer une cuisine dont les caissons tiennent. Nettoyez d'abord ; si la teinte reste, regardez les chants et le dessous de l'évier ; si le meuble est sain, un covering lui rend une surface neuve en ${DUREE_POSE_TEXTE}, garantie ${GARANTIE_ANS} ans.`,
    },
    liens: [
      { href: "/comment-ca-marche#quand-renover", libelle: "Quand rénover, et quand le film ne suffit pas" },
      { href: "/prestations/cuisine", libelle: "Le covering de cuisine : ce qu'on recouvre, nos prix, nos cas" },
      { href: SIMULER_CUISINE, libelle: "Essayer une teinte sur la photo de ma cuisine" },
    ],
    relatedSlugs: ["covering-peinture-remplacement-comparatif", "cuisine-bordeaux-brillante-renover-sans-changer", "entretenir-revetement-adhesif"],
  },
  {
    slug: "covering-peinture-remplacement-comparatif",
    title: "Covering, peinture ou remplacement : le vrai comparatif",
    titreSeo: "Covering, peinture ou remplacement de cuisine",
    excerpt: "Trois façons de changer une cuisine, comparées sur le délai, la poussière, la réversibilité et la durée. Et quand nous déconseillons le covering.",
    category: "Comparatif",
    date: C7_TEXTE,
    dateIso: C7,
    dateModifiedIso: C7,
    readTime: "3 min",
    imagePreparee: "pose-mains",
    projet: "cuisine",
    content: {
      intro: "Quand une cuisine ne plaît plus, il y a trois chemins : la recouvrir, la repeindre ou la remplacer. Nous posons du covering, nous ne sommes donc pas neutres. Voici quand même la comparaison telle que nous la faisons avec les gens qui nous appellent, critère par critère, y compris quand le covering n'est pas la bonne réponse.",
      sections: [
        {
          title: "Le délai",
          text: `Covering : ${DUREE_POSE_TEXTE} de pose pour une cuisine courante, après un devis qui arrive ${DELAI_REPONSE} et la commande du film. Peinture : plusieurs jours, entre le ponçage, la sous-couche, deux couches et les temps de séchage, avec les façades démontées ou la cuisine immobilisée. Remplacement : la fabrication et la livraison des meubles passent avant la pose, qui demande elle-même plusieurs jours, plomberie et électricité comprises.`,
        },
        {
          title: "La poussière et le bruit",
          text: "Covering : ni ponçage ni dépose. On nettoie, on dégraisse, puis on pose à chaud avec une raclette, un cutter et un décapeur thermique. Rien ne sèche, rien ne sent. Peinture : poncer un mélaminé fait une poussière fine qui se dépose partout, et la peinture sent pendant le séchage. Remplacement : dépose de l'ancienne cuisine, gravats, perçages ; la pièce devient un chantier.",
          image: "outils-pose",
        },
        {
          title: "La réversibilité",
          text: "Covering : le film se retire à chaud et le support retrouve son état d'origine ; on peut aussi le recouvrir à nouveau le jour où l'on veut changer. C'est ce qui le rend possible en location. Peinture : une façade peinte reste peinte, et revenir en arrière demande de décaper. Remplacement : par définition, rien ne revient.",
        },
        {
          title: "La durée",
          text: `Covering : films et pose garantis ${GARANTIE_ANS} ans contre le décollement et la décoloration, en usage normal ; il craint la lame d'un couteau et les éponges abrasives, comme un stratifié. Peinture : sa tenue dépend de la préparation et de l'usage ; sur des façades de cuisine, elle s'use d'abord aux poignées et aux arêtes. Remplacement : des meubles neufs, la durée la plus longue, au prix du neuf.`,
        },
        {
          title: "Le prix",
          text: "Nous ne donnons ici que nos prix, ceux du covering, au mètre linéaire de film posé, fourni et posé. Pour la peinture et le remplacement, les écarts entre un travail fait soi-même, un peintre et un cuisiniste sont trop grands pour qu'un chiffre soit honnête : demandez des devis, et comparez-les surface par surface avec le nôtre.",
          prix: ["CUISINE"],
        },
        {
          title: "Quand ne pas choisir le covering",
          text: "Si les caissons sont abîmés, si un panneau a gonflé à l'eau, si vous voulez changer l'implantation ou ajouter des meubles : remplacez. Si vous voulez garder un bois massif visible, ou s'il s'agit d'un mur : la peinture est plus adaptée. Le covering est fait pour une cuisine saine dont seule la surface a vieilli : mélaminé, stratifié, laqué, bois verni.",
        },
      ],
      tip: "Pour comparer deux devis, regardez trois lignes : ce qui est démonté, combien de jours la cuisine reste inutilisable, et ce que couvre la garantie.",
      conclusion: `Sur une cuisine saine, le covering l'emporte : ${DUREE_POSE_TEXTE}, sans poussière, réversible, garanti ${GARANTIE_ANS} ans. La peinture garde l'avantage du petit budget quand on la fait soi-même ; le remplacement, celui de tout changer, y compris ce qui est cassé. Pour le face-à-face détaillé avec la peinture, et pour lire un devis de covering ligne par ligne, deux guides vont plus loin.`,
    },
    liens: [
      { href: "/blog/covering-adhesif-vs-peinture-cuisine", libelle: "Covering adhésif ou peinture : le face-à-face détaillé" },
      { href: "/blog/prix-renovation-cuisine-covering", libelle: "Combien coûte un covering de cuisine, et ce que contient le devis" },
      { href: "/prestations/cuisine", libelle: "Le covering de cuisine : ce qu'on recouvre, nos prix, nos cas" },
      { href: SIMULER_CUISINE, libelle: "Essayer une matière sur la photo de ma cuisine" },
    ],
    relatedSlugs: ["covering-adhesif-vs-peinture-cuisine", "prix-renovation-cuisine-covering", "cuisine-blanche-jaunie-que-faire"],
  },
  {
    slug: "prix-renovation-cuisine-covering",
    title: "Combien coûte une rénovation de cuisine par covering ?",
    titreSeo: "Prix d'un covering de cuisine au mètre linéaire",
    excerpt: "Prix au mètre linéaire, nos tarifs publiés, ce qui fait varier le devis et ce qu'il contient.",
    category: "Prix",
    date: MAJ_TEXTE,
    dateIso: MAJ,
    dateModifiedIso: MAJ,
    readTime: "5 min",
    image: "/images/fonds/photo-1758315417321-83eb30a39710",
    content: {
      intro: `Le covering se facture au mètre linéaire de film posé, fourni et posé. Chez CoverSwap, le prix au mètre va de ${PRIX_ML_MIN} à ${PRIX_ML_MAX} € : il se détermine au devis selon la complexité de la pose, pas selon le seul revêtement choisi. Une cuisine se chiffre surface par surface — façades, plan de travail, crédence. Voici comment ce chiffre se construit, pour lire un devis sans surprise.`,
      sections: [
        {
          title: "Pourquoi au mètre linéaire, et pas au mètre carré",
          text: "Le film Cover Styl' est vendu en rouleaux d'une largeur fixe (1,22 m). Ce qui compte pour la pose, c'est la longueur de film déroulée sur chaque surface, chants et retours compris. Le mètre linéaire reflète donc le vrai coût de matière et de main-d'œuvre, là où un prix au mètre carré ferait payer de la surface qui n'existe pas ou oublierait les chants.",
        },
        {
          title: "Ce qui fait varier le prix au mètre",
          text: `La complexité de la pose, avant tout. Le nombre de découpes : des façades planes se posent vite ; des tiroirs nombreux, des moulures, des prises, un îlot avec retours prennent du temps. L'accessibilité : une surface dégagée à hauteur d'homme ne se travaille pas comme un dessus de meuble haut ou un recoin derrière une vasque. L'état du support : une surface saine et lisse est prête ; un support abîmé se répare et se prépare avant la pose. Le métrage : plus il est grand, plus le prix au mètre baisse. Le revêtement choisi compte aussi, mais moins qu'on ne le croit. Résultat : de grandes surfaces planes sans découpe se situent vers ${PRIX_ML_MIN} €/ml, une pose complexe monte jusqu'à ${PRIX_ML_MAX} €/ml, et aucun des deux n'est la règle. C'est pour cela que le devis détaille chaque surface avec son métrage.`,
        },
        {
          title: "Nos tarifs publiés",
          text: `Voici nos tarifs pour une cuisine, surface par surface, fournis et posés, TVA non applicable (article 293 B du CGI). Une surface sans prix se chiffre sur vos photos. Un devis précis demande vos photos ou une visite ; il est gratuit et vous répond ${DELAI_REPONSE}.`,
          prix: ["CUISINE"],
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
      conclusion: `Retenez l'ordre de grandeur : ${PRIX_ML_MIN} à ${PRIX_ML_MAX} € le mètre linéaire posé selon la complexité de la pose, et une cuisine chiffrée surface par surface. Pour un chiffre exact, le simulateur montre le rendu et le devis dit le prix, surface par surface.`,
    },
    relatedSlugs: ["covering-peinture-remplacement-comparatif", "covering-adhesif-vs-peinture-cuisine", "comment-se-passe-une-pose-de-covering", "covering-adhesif-durabilite"],
  },
  {
    slug: "comment-se-passe-une-pose-de-covering",
    title: "Comment se passe une pose de covering, concrètement",
    titreSeo: "Comment se passe une pose de covering",
    excerpt: "De la première photo à la vérification finale : les étapes d'un chantier de covering, ce que vous préparez, ce que nous faisons, combien de temps ça prend.",
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
          text: `Tout commence par des photos de la pièce ou du meuble, prises de face, bien éclairées. Le simulateur du site applique la finition de votre choix sur votre propre photo en ${DELAI_RENDU} ; c'est un aperçu, pas un engagement sur la teinte exacte.`,
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
    titreSeo: "Covering adhésif ou peinture en cuisine ?",
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
          text: `Repeindre soi-même coûte peu en matériel, beaucoup en temps et en risque de résultat inégal ; faire repeindre par un peintre revient souvent au niveau du covering. Le covering se chiffre au mètre linéaire, ${PRIX_ML_MIN} à ${PRIX_ML_MAX} € posé selon la complexité de la pose. Voici nos tarifs publiés pour une cuisine.`,
          prix: ["CUISINE"],
        },
        {
          title: "Quand la peinture reste le bon choix",
          text: "Sur du bois massif brut que l'on veut garder visible, sur des surfaces très irrégulières, ou pour un mur : là, la peinture est plus adaptée. Le covering excelle sur les surfaces lisses et planes — mélaminé, stratifié, laqué, métal, carrelage sain.",
        },
      ],
      conclusion: "Peinture : bon marché en matériel, long, résultat uni, définitif. Covering : une journée, textures réalistes, garanti, réversible. Pour des façades de cuisine en mélaminé, le covering est presque toujours le choix le plus durable.",
    },
    relatedSlugs: ["covering-peinture-remplacement-comparatif", "prix-renovation-cuisine-covering", "covering-adhesif-durabilite", "quelle-finition-choisir"],
  },
  {
    slug: "covering-adhesif-durabilite",
    title: "Covering adhésif : combien de temps ça tient, et à quoi ça résiste ?",
    titreSeo: "Covering adhésif : combien de temps ça tient ?",
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
    titreSeo: "Recouvrir un carrelage de salle de bain",
    excerpt: "Ce qui se recouvre dans une salle de bain (murs carrelés, meuble vasque, tablier de baignoire), ce qui ne se recouvre pas, et la tenue à l'humidité.",
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
          text: `Une journée de pose pour une salle de bain courante ; nous conseillons d'attendre 24 h avant une douche très chaude côté murs traités. Au mètre linéaire, fournie et posée, une salle de bain se chiffre surface par surface (meuble vasque, murs carrelés, contour de baignoire) : voici nos tarifs publiés.`,
          prix: ["SDB"],
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
    titreSeo: "Quelle finition de film adhésif choisir ?",
    excerpt: `Choisir parmi les familles du catalogue Cover Styl' selon la pièce, la lumière et l'usage, et pourquoi la teinte se valide toujours sur échantillon.`,
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
          text: "Inox brossé, laiton, cuivre pour un comptoir ou une crédence ; cuir et textile pour une tête de lit ou une porte ; paillettes pour un accent. Ces films demandent une pose plus soignée (sens du brossage, raccords visibles) : le devis en tient compte.",
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
    titreSeo: "Quel revêtement adhésif pour quelle pièce ?",
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
    titreSeo: "Entretenir un revêtement adhésif",
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
    titreSeo: "Rénover en location avec un film adhésif",
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
          text: `Au mètre linéaire, fourni et posé, de ${PRIX_ML_MIN} à ${PRIX_ML_MAX} € selon la complexité de la pose ; voici nos tarifs publiés. Devis gratuit ${DELAI_REPONSE} sur photos.`,
          prix: ["CUISINE", "SDB", "MEUBLES"],
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
