/**
 * Les textes des pages de famille (`/matieres/<famille>`, site 3.0, lot D3 ; énoncé, phase D) : pour chacune des sept
 * familles du catalogue Cover Styl', ce que c'est, où ça se pose, l'entretien et les limites. Écrits à la main, à la
 * première personne du pluriel, 300 mots au moins chacun (testé : `src/app/matieres/familles.test.ts`).
 *
 * Rien d'inventé sur les performances techniques : pas de norme, pas d'épaisseur, pas de durée de vie, pas de tenue
 * chiffrée à la chaleur ou aux produits. On dit ce qu'on fait (on vient avec les échantillons, on valide au cas par
 * cas près des plaques), ce qu'on déconseille, et ce que le film n'est pas. L'entretien reprend celui de
 * `/comment-ca-marche` (`ENTRETIEN`). Aucun montant : les prix viennent du CRM. Les nombres de références sont ceux du
 * catalogue (vérifiés par le test).
 */

export type SectionTexteFamille = { titre: string; paragraphes: readonly string[] };

export type TexteFamille = {
  /** Le titre de la page (h1), comme le tiroir du présentoir. */
  titre: string;
  /** Le titre de l'onglet et du partage, « … | CoverSwap » compris : 60 caractères au plus. */
  titreSeo: string;
  /** 155 caractères au plus. */
  descriptionSeo: string;
  /** Sous le titre : deux phrases au plus. */
  accroche: string;
  /** Le libellé du bouton principal (le simulateur). */
  essayer: string;
  /** Le nom de la famille dans une phrase (« les bois », « les couleurs »). */
  dansUnePhrase: string;
  /** Ce que c'est, où ça se pose, l'entretien, les limites. */
  sections: readonly SectionTexteFamille[];
};

export const TITRES_SECTIONS = ["Ce que c'est", "Où ça se pose", "L'entretien", "Les limites"] as const;

const sections = (ceQueCEst: string[], ouCaSePose: string[], entretien: string[], limites: string[]): SectionTexteFamille[] =>
  [ceQueCEst, ouCaSePose, entretien, limites].map((paragraphes, i) => ({ titre: TITRES_SECTIONS[i], paragraphes }));

/** L'entretien commun à tout le catalogue (`/comment-ca-marche`), dit une fois par page. */
const ENTRETIEN_COURANT = "Un chiffon ou une éponge douce, de l'eau tiède, un nettoyant ménager sans solvant : c'est tout.";

export const TEXTES_FAMILLES: Readonly<Record<string, TexteFamille>> = {
  bois: {
    titre: "Bois",
    titreSeo: "Adhésif imitation bois : 267 références | CoverSwap",
    descriptionSeo: "Chêne, noyer, frêne, pin : 267 films adhésifs bois Cover Styl' posés sur vos meubles. Où les poser, l'entretien, les limites, et l'essai sur votre photo.",
    accroche: "Du chêne presque blanc au wengé, 267 bois à poser sur vos meubles sans les changer. On vient avec les échantillons.",
    essayer: "Essayer un bois sur ma photo",
    dansUnePhrase: "les bois",
    sections: sections(
      [
        "Un film adhésif imprimé d'un veinage de bois : chêne, noyer, frêne, pin, teck, érable, cerisier, des bois blanchis, grisés, fumés, et quelques bois peints. C'est la famille la plus fournie du catalogue Cover Styl' : 267 références, du chêne presque blanc au wengé le plus sombre.",
        "La plupart sont lisses au toucher. Six chênes sont structurés, avec un relief qui suit le fil du bois, et un septième est rustique, plus marqué encore. Le nom reste celui du fabricant (Original Oak, Classic Walnut) : c'est lui qu'on retrouve sur l'échantillon.",
      ],
      [
        "Partout où l'on veut du bois sans changer le meuble : façades de cuisine, plan de travail, portes intérieures, placards, dressing, meuble de salle de bain, tête de lit, bureau, comptoir d'un commerce. On pose sur un support lisse et sain, après l'avoir nettoyé et dégraissé.",
        "Sur une grande surface, on oriente toutes les pièces dans le même sens pour que le fil du bois se suive d'une porte à l'autre. Un bois clair sur les façades et un uni sur le plan, ou l'inverse : c'est souvent l'association la plus simple à vivre.",
      ],
      [
        `Comme un stratifié. ${ENTRETIEN_COURANT} On évite les éponges qui grattent, l'acétone et l'alcool à brûler.`,
        "Un bois adhésif ne se ponce pas, ne se cire pas, ne se vernit pas : il n'en a pas besoin. Sur un plan de travail, on coupe sur une planche et on pose un dessous-de-plat pour ce qui sort du four.",
      ],
      [
        "C'est une image du bois, pas du bois. À un mètre, on s'y trompe ; à quelques centimètres, un œil attentif voit que le veinage est imprimé, sauf peut-être sur les références structurées. Sur un très grand pan de mur, le motif finit par se répéter : pour un mur entier, on choisit plutôt un veinage calme.",
        "Un coup de couteau ou un choc franc marque le film, et une rayure ne se rattrape pas au ponçage : on refait la façade abîmée. Près d'une plaque de cuisson, on regarde au cas par cas. Le film ne répare pas non plus un panneau gonflé par l'eau : il faut d'abord changer la pièce. Enfin, un écran ne rend pas fidèlement un bois : on apporte les échantillons chez vous et on les pose contre vos meubles avant de commander.",
      ],
    ),
  },

  couleur: {
    titre: "Couleurs",
    titreSeo: "Couleurs unies adhésives : 89 teintes | CoverSwap",
    descriptionSeo: "89 couleurs unies Cover Styl', du blanc au noir mat, du vert sauge au bleu nuit, posées sur vos façades et vos murs. Où, comment entretenir, les limites.",
    accroche: "Du blanc au noir mat, du vert sauge au bleu nuit : 89 unis pour changer une pièce sans la charger.",
    essayer: "Essayer une couleur sur ma photo",
    dansUnePhrase: "les couleurs",
    sections: sections(
      [
        "Des unis, sans motif : 89 teintes, du blanc pur au noir mat, en passant par les beiges, les gris, les verts sauge et olive, les bleus, les roses, un bordeaux, un jaune moutarde. Trois références, deux gris et un blanc cassé, portent de fines rayures.",
        "Deux sont laquées, un blanc et un noir, pour qui veut du brillant ; les autres ont un aspect plus doux, et le reflet change d'une teinte à l'autre : on vous montre l'échantillon pour en juger. Un uni change une pièce sans la charger, et il s'accorde avec un plan de travail ou un sol qu'on garde.",
      ],
      [
        "Sur les façades de cuisine d'abord : un vert sauge, un bleu nuit, un noir mat transforment une cuisine des années 2000, en une journée de pose en général. Aussi sur les portes de placard, les meubles de salle de bain, les portes intérieures, un meuble ancien qu'on veut moderniser, et les murs : un pan de couleur derrière un lit ou un bureau.",
        "On peut mélanger : meubles hauts clairs et meubles bas foncés, ou une couleur sur l'îlot seulement. Avec un bois sur le plan de travail, un uni fait le reste de la cuisine.",
      ],
      [
        ENTRETIEN_COURANT,
        "Sur un uni foncé, un noir, un bleu nuit, un vert profond, les traces de doigts et les gouttes se voient davantage que sur un bois veiné : un passage de chiffon humide, puis sec, suffit. Pas d'éponge qui gratte : sur un uni, une rayure se remarque.",
      ],
      [
        "Un uni ne cache rien. Une bosse, un éclat mal rebouché, une rayure profonde du support se devinent sous le film, surtout en lumière rasante : on prépare le support avant de poser, et on vous dit au devis si une façade ne s'y prête pas.",
        "Les couleurs d'un écran sont approximatives : le même vert paraît plus froid sur un téléphone et plus chaud sous une ampoule. On apporte les échantillons et on les tient contre vos meubles, à la lumière de la pièce. Un blanc pur posé à côté d'un vieux blanc qui a jauni fait ressortir le jaune : si on ne refait qu'une partie, on choisit un blanc cassé. Près des plaques de cuisson, on valide au cas par cas.",
      ],
    ),
  },

  textile: {
    titre: "Textiles",
    titreSeo: "Textiles et cuirs adhésifs : 41 références | CoverSwap",
    descriptionSeo: "Lin, tissage, chevrons, cuirs : 41 films adhésifs Cover Styl' à l'aspect textile pour vos meubles et vos murs. Où les poser, l'entretien, les limites.",
    accroche: "Du lin, des tissages, des cuirs : 41 films pour la douceur d'un tissu, sans son entretien.",
    essayer: "Essayer un textile sur ma photo",
    dansUnePhrase: "les textiles",
    sections: sections(
      [
        "Des films qui reprennent le dessin d'un tissu ou d'un cuir : lins naturels, tissages, petits chevrons, losanges, mailles, toiles à fils dorés ou argentés, et une série de cuirs, cognac, caramel, ivoire, gris perle, indigo. 41 références en tout.",
        "Ce n'est pas du tissu : c'est un film, qui se nettoie comme le reste du catalogue. Le toucher varie d'une référence à l'autre ; c'est pour ça qu'on apporte l'échantillon, pour que vous jugiez du bout des doigts. Le nom du fabricant (Natural Linen, Cognac) est celui qu'on retrouve dessus.",
      ],
      [
        "Là où l'on veut de la douceur sans l'entretien d'un tissu : une tête de lit, des portes de placard ou de dressing dans une chambre, un mur derrière un canapé, une porte intérieure. Les cuirs vont bien sur un bureau, un caisson, la façade d'un meuble TV.",
        "Dans un local, on les pose sur un comptoir d'accueil, le mur d'une cabine d'essayage, le couloir d'un hôtel ou la tête de lit d'une chambre d'hôtes.",
      ],
      [
        `${ENTRETIEN_COURANT} Une tache de café s'essuie mieux tant qu'elle est fraîche.`,
        "Pas de brosse, pas de détachant pour textile, pas de nettoyeur vapeur : ce sont des produits faits pour un tissu, pas pour un film.",
      ],
      [
        "On ne les pose ni sur un plan de travail, ni dans une douche, ni autour d'un évier : ce sont des matières de meuble et de mur, pas de surface de travail. De près, on voit qu'il s'agit d'une imitation : l'effet est réussi sur une façade ou un mur, moins sur un objet qu'on touche tous les jours en s'attendant à sentir un tissu.",
        "Les reflets des toiles dorées ou argentées changent beaucoup avec la lumière : on regarde l'échantillon dans votre pièce, de jour comme le soir. Nous n'avons pas encore d'image d'ambiance avec un textile sur ce site : l'échantillon chez vous reste la meilleure façon de juger.",
      ],
    ),
  },

  pierre: {
    titre: "Pierres",
    titreSeo: "Adhésif effet marbre et pierre : 36 références | CoverSwap",
    descriptionSeo: "Marbres, travertin, granit, terrazzo : 36 films adhésifs Cover Styl' pour plan de travail, crédence, salle de bain. Où les poser, l'entretien, les limites.",
    accroche: "Marbres blancs et noirs, travertin, granits, terrazzos : 36 pierres pour un plan de travail ou une salle de bain, sans le poids.",
    essayer: "Essayer une pierre sur ma photo",
    dansUnePhrase: "les pierres",
    sections: sections(
      [
        "Des films imprimés d'un dessin de pierre : marbres blancs veinés de gris ou d'or, marbres noirs veinés de blanc, les Lombarda gris, noir et blanc, travertin, granits bruts, basaltes, terrazzos, un onyx doré. 36 références, du blanc presque uni au noir profond.",
        "Le film reprend les veines et les nuances de la pierre. Au toucher, c'est un film : il n'a ni le froid ni le poids d'une dalle, et c'est justement ce qui permet de le poser sur un meuble existant.",
      ],
      [
        "Plan de travail et crédence d'une cuisine, meuble vasque et murs d'une salle de bain, table basse, console, comptoir d'accueil ou de bar. Un marbre blanc éclaire une cuisine sombre ; un marbre noir donne du poids à un îlot ou à un comptoir.",
        "On l'associe volontiers à un uni sur les façades : la pierre sur le plan, la couleur sur les meubles. Sur un plan de travail, on habille aussi le chant, pour que le dessus et le devant se suivent.",
      ],
      [
        ENTRETIEN_COURANT,
        "Pas d'entretien de pierre : ni cire, ni produit pour marbre, ni imperméabilisant, le film n'en a pas besoin. Sur un plan de travail, une planche pour couper et un dessous-de-plat pour ce qui sort du four.",
      ],
      [
        "C'est l'image d'une pierre. Sur un plan de travail, le film habille le chant, proprement, mais le plan garde son épaisseur d'origine : il ne prend pas celle d'une vraie dalle. Le dessin se répète d'une pièce à l'autre : sur un grand plan, on place les veines pour qu'un même motif ne tombe pas deux fois côte à côte.",
        "Les coupures et la chaleur directe sont ses deux ennemis : un coup de couteau marque le film, une casserole brûlante posée à même le plan aussi. Près d'une plaque de cuisson, on valide au cas par cas. Dans une salle de bain, un meuble ou un mur, oui ; sous le jet d'une douche, on en parle avant. Comme pour toutes les matières, on apporte les échantillons avant de commander.",
      ],
    ),
  },

  metal: {
    titre: "Métaux",
    titreSeo: "Métaux adhésifs Cover Styl' : 31 références | CoverSwap",
    descriptionSeo: "Aluminium brossé, or, cuivre, bronze, corten : 31 films adhésifs Cover Styl' pour meubles et commerces. Où les poser, l'entretien, les limites.",
    accroche: "Aluminium brossé, or, cuivre, bronze patiné, corten : 31 métaux pour souligner un meuble ou un comptoir.",
    essayer: "Essayer un métal sur ma photo",
    dansUnePhrase: "les métaux",
    sections: sections(
      [
        "Des films à l'aspect du métal : aluminium brossé, argent, chrome, or, champagne, cuivre, bronze et anthracite patinés, fer noir, acier corten, et des versions rayées ou pointillées. 31 références.",
        "Ils prennent la lumière comme le métal, mais restent un film qu'on pose sur un meuble ou un mur, sans soudure, sans découpe de tôle, sans poids. Le nom du fabricant (Mat Aluminium, Corten, Bronze Patina) est celui qu'on retrouve sur l'échantillon.",
      ],
      [
        "Sur ce qu'on veut souligner : un caisson, des portes de placard, un bandeau, une colonne, le devant d'un comptoir. Chez les professionnels, un comptoir de bar, un présentoir de boutique, une porte de local, un habillage de colonne.",
        "Le corten et le bronze patiné vont bien avec un béton ou un bois foncé ; l'aluminium brossé avec un blanc ou un noir mat. Un métal se voit mieux en touche, sur un meuble ou une partie du mur, que sur toute une pièce. Sur une porte de local ou le bandeau d'une vitrine, il attire l'œil sans rien repeindre.",
      ],
      [
        `${ENTRETIEN_COURANT} Une microfibre laisse moins de traces sur les finitions brillantes.`,
        "Pas d'éponge qui gratte, et pas de produit pour l'inox ou le cuivre : ils sont faits pour le vrai métal, pas pour un film.",
      ],
      [
        "C'est l'aspect du métal, pas sa résistance : on ne les pose ni sur un plan de travail, ni derrière les plaques, ni autour d'un évier. Les finitions brillantes, le chrome, l'or, montrent la moindre bosse du support et marquent les traces de doigts ; les brossés et les patinés sont plus indulgents.",
        "Un métal sur une grande surface peut faire froid : on vous le dira si votre projet en prend le risque. Nous n'avons pas encore d'image d'ambiance avec un métal sur ce site : on apporte les échantillons, et vous les voyez sous votre lumière, qui change tout sur une matière qui reflète.",
      ],
    ),
  },

  beton: {
    titre: "Bétons et stucs",
    titreSeo: "Bétons et stucs adhésifs : 17 références | CoverSwap",
    descriptionSeo: "Béton brut, ciment, stuc, brique : 17 films adhésifs Cover Styl' pour cuisine, salle de bain et commerce. Où les poser, l'entretien, les limites.",
    accroche: "Béton brut, ciment, stucs, une brique : 17 matières d'atelier, sans chantier et sans poussière.",
    essayer: "Essayer un béton sur ma photo",
    dansUnePhrase: "les bétons et stucs",
    sections: sections(
      [
        "Des films à l'aspect du béton brut, du ciment, du stuc (un enduit lissé) et, pour une référence, de la brique rouge. Gris clair, gris anthracite, taupe, blanc cassé, terracotta : 17 références, plutôt sobres.",
        "Ils donnent l'allure d'un mur enduit ou d'un béton coulé sans les travaux qui vont avec : pas de coffrage, pas de séchage, pas de poids sur le meuble. Le film se pose sur l'existant, en une journée en général. Le nom du fabricant (Raw Grey, Terracotta Stucco) est celui qu'on retrouve sur l'échantillon.",
      ],
      [
        "Crédence et plan de travail d'une cuisine, façades pour une cuisine d'esprit atelier, meuble de salle de bain, mur derrière une télévision, comptoir de boutique ou de restaurant.",
        "Le stuc terracotta réchauffe un meuble ou une cuisine trop froide ; un béton gris clair calme une pièce chargée de couleurs. Avec un bois foncé ou un métal patiné, un béton fait vite une cuisine de caractère.",
      ],
      [
        ENTRETIEN_COURANT,
        "À la différence d'un vrai béton ciré, il n'y a ni cire ni vernis à refaire. Sur un plan de travail, on garde les deux habitudes de toujours : une planche pour couper, un dessous-de-plat pour ce qui sort du four.",
      ],
      [
        "C'est un dessin de béton : il n'a pas le relief d'un enduit taloché, ni la fraîcheur du ciment sous la main. Sur un grand mur, la répétition du motif peut se voir de près ; on le réserve plutôt à une crédence, un meuble, un pan de mur.",
        "La brique est une image de brique : sans joint en creux, elle s'apprécie à distance. Les couteaux et la chaleur directe restent à éviter sur un plan de travail ; près d'une plaque, on valide au cas par cas. Si la pièce a déjà un sol ou un mur en béton, on tient l'échantillon contre lui : deux gris presque pareils se remarquent plus que deux gris francs. La plupart de ces références n'ont pas encore d'image d'ambiance sur ce site : on vous apporte les échantillons.",
      ],
    ),
  },

  paillettes: {
    titre: "Paillettes",
    titreSeo: "Films pailletés adhésifs : 16 références | CoverSwap",
    descriptionSeo: "Or, argent, cuivre, rose, bleu nuit : 16 films pailletés Cover Styl' pour un bar, une niche ou une porte d'enfant. Où les poser, l'entretien, les limites.",
    accroche: "Or, argent, cuivre, rose, bleu nuit : 16 films pailletés, à poser par touches, là où l'on veut que ça brille.",
    essayer: "Essayer des paillettes sur ma photo",
    dansUnePhrase: "les paillettes",
    sections: sections(
      [
        "Des films pailletés : 16 références, de l'argent et de l'or façon boule à facettes aux paillettes rouges, roses, vertes, bleu nuit, cuivre, champagne, beurre ou noires. C'est la seule famille du catalogue à la finition pailletée. Le nom du fabricant (Gold Disco, Silver Disco) est celui qu'on retrouve sur l'échantillon.",
        "Elle accroche la lumière et scintille dès qu'on bouge autour : c'est tout son intérêt, et sa limite. Pour le reste, c'est un film adhésif comme les autres, qu'on pose sur un support lisse et sain, sans démonter le meuble.",
      ],
      [
        "Sur de petites surfaces qu'on veut faire briller : le devant d'un bar, une niche, une porte de chambre d'enfant, un meuble de rangement, une colonne ou un présentoir de boutique, un décor de vitrine.",
        "Elle fonctionne bien en touche, à côté d'un uni ou d'un bois calme : un caisson pailleté au milieu de façades blanches, le fond d'une étagère, le bandeau d'un comptoir. Pour une vitrine de saison, c'est aussi un décor qui se retire à chaud quand on veut passer à autre chose.",
      ],
      [
        `${ENTRETIEN_COURANT} On essuie sans frotter fort.`,
        "Pas de brosse ni d'éponge qui gratte. Un coup de chiffon de temps en temps leur garde leur éclat. Sur un comptoir où l'on pose des verres, on met la paillette sur le devant plutôt que sur le dessus.",
      ],
      [
        "Elle n'est pas faite pour une cuisine entière ni pour une surface de travail : ni plan de travail, ni crédence, ni près de l'eau. Sur une grande surface, le scintillement fatigue vite l'œil : on la réserve à un détail.",
        "Son effet dépend beaucoup de l'éclairage : très vif sous un spot, plus discret à la lumière du jour. Nous n'avons pas encore d'image d'ambiance avec des paillettes sur ce site : l'échantillon, tenu sous votre lumière, dit mieux que n'importe quelle photo ce que ça donnera chez vous.",
      ],
    ),
  },
};

/** Le texte d'une famille, ou `null`. */
export const texteFamille = (id: string): TexteFamille | null => TEXTES_FAMILLES[id] ?? null;
