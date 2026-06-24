/**
 * Zones d'intervention CoverSwap — données SEO locales par ville.
 *
 * Chaque entrée alimente :
 *  - la route dynamique /zones/[ville]
 *  - le JSON-LD areaServed du LocalBusiness
 *  - la colonne "Zones d'intervention" du footer
 *  - le sitemap.xml
 *
 * Règle d'or : pas de phrases dupliquées entre villes. Le `intro`, les
 * `quartiers`, le `pourquoi` et la `faqLocale` doivent être uniques.
 */

export interface Zone {
  /** Slug URL (sera préfixé par "covering-" : /zones/covering-montpellier) */
  slug: string;
  /** Nom affiché tel que dans le titre */
  ville: string;
  /** Code(s) postal(aux) couverts */
  codePostal: string;
  /** Distance approximative depuis Pérols (en km) — pour SEO local */
  distanceKm: number;
  /** Latitude / longitude approximative du centre-ville */
  lat: number;
  lng: number;
  /** Quartiers / lieux-dits cités dans le contenu (au moins 3) */
  quartiers: string[];
  /** Paragraphe d'intro spécifique à la ville (200-300 mots) */
  intro: string;
  /** Section "Pourquoi choisir CoverSwap à [Ville]" (3-4 phrases uniques) */
  pourquoi: string;
  /** Caractéristique habitat locale (immeubles, vieux centre, lotissement, etc.) */
  habitat: string;
  /** FAQ spécifique à la ville (3-5 entrées) */
  faqLocale: { q: string; a: string }[];
}

export const ZONES: Zone[] = [
  {
    slug: "montpellier",
    ville: "Montpellier",
    codePostal: "34000 / 34070 / 34080 / 34090",
    distanceKm: 8,
    lat: 43.6108,
    lng: 3.8767,
    quartiers: [
      "Antigone",
      "Port Marianne",
      "Comédie",
      "Écusson",
      "Beaux-Arts",
      "Boutonnet",
      "Aiguelongue",
      "Hôpitaux-Facultés",
      "Croix d'Argent",
      "Mosson",
    ],
    intro:
      "Montpellier est notre terrain de jeu naturel. Située à seulement 8 kilomètres de notre atelier de Pérols, nous y intervenons quasi quotidiennement, du cœur historique de l'Écusson aux résidences neuves du quartier Port Marianne. " +
      "La diversité du parc immobilier montpelliérain — appartements haussmanniens de la Comédie, immeubles modernes d'Antigone, maisons des Beaux-Arts, lofts du quartier Boutonnet — fait du covering adhésif Cover Styl' une solution particulièrement pertinente. Il s'adapte à tous les supports : carrelage des années 70, mélaminé des cuisines IKEA, plans de travail en stratifié, façades de meubles laquées. " +
      "À Montpellier, nombre de copropriétés interdisent les gros travaux bruyants ou poussiéreux. Le covering contourne ce problème : pose silencieuse, en une journée, sans démolition. Idéal aussi pour les locataires du centre-ville qui veulent personnaliser leur intérieur sans risquer la restitution de leur caution.",
    pourquoi:
      "Notre proximité avec Montpellier nous permet de livrer un devis sous 24 heures et d'intervenir dès la semaine suivante, sans frais de déplacement majorés. Lucas connaît parfaitement les contraintes des logements montpelliérains : escaliers étroits de l'Écusson, accès véhicule difficile près de la place Jean-Jaurès, créneaux d'intervention adaptés aux résidences d'Antigone. Nos clients montpelliérains apprécient cette connaissance du terrain qui fait gagner du temps à toutes les étapes du chantier.",
    habitat:
      "Studios d'étudiants à rénover, appartements familiaux de Port Marianne, maisons de ville aux Aiguerelles, lofts industriels du quartier Cambacérès",
    faqLocale: [
      {
        q: "Intervenez-vous dans toute l'agglomération de Montpellier ?",
        a: "Oui, nous couvrons l'ensemble de la métropole : centre-ville (Écusson, Comédie, Antigone), quartiers résidentiels (Beaux-Arts, Hôpitaux-Facultés, Boutonnet), zones plus récentes (Port Marianne, Ovalie, République) et communes limitrophes (Castelnau-le-Lez, Lattes, Pérols). Aucune zone n'est trop éloignée — nous sommes basés à 10 minutes du centre-ville.",
      },
      {
        q: "Comment se passe l'accès au logement dans le centre historique ?",
        a: "Nous gérons cela en amont avec vous. Pour les rues piétonnes de l'Écusson, nous organisons une plage horaire d'accès véhicule (généralement le matin avant 11h). Tout notre matériel tient dans un fourgon utilitaire compact. Si l'accès est vraiment complexe, nous pouvons stationner à proximité et transporter en main jusqu'à votre porte.",
      },
      {
        q: "Combien de temps pour un devis à Montpellier ?",
        a: "Pour un projet montpelliérain, nous proposons généralement une visite technique gratuite sur place dans les 48 heures, suivie d'un devis détaillé sous 24 heures après la visite. Pour les petits projets, la simulation IA en ligne suffit souvent à établir un devis sans déplacement.",
      },
      {
        q: "Travaillez-vous avec des syndics ou bailleurs montpelliérains ?",
        a: "Oui, nous intervenons régulièrement pour des syndics de copropriété et des bailleurs sociaux montpelliérains. Nous fournissons toutes les attestations nécessaires (assurance décennale, conformité produit Cover Styl'), et nos interventions sans nuisances sont particulièrement appréciées en milieu collectif.",
      },
      {
        q: "Pouvez-vous intervenir dans des locaux professionnels montpelliérains ?",
        a: "Absolument. Nous avons déjà transformé des comptoirs d'accueil de cabinets dentaires aux Beaux-Arts, des espaces de coworking à Cambacérès, des vitrines de boutiques de la rue de la Loge, et des salles de réunion d'entreprises de Port Marianne. Intervention possible en soirée ou week-end pour ne pas perturber votre activité.",
      },
    ],
  },
  {
    slug: "perols",
    ville: "Pérols",
    codePostal: "34470",
    distanceKm: 0,
    lat: 43.5567,
    lng: 3.9514,
    quartiers: [
      "Centre-ville",
      "Saint-Sébastien",
      "Les Caunelles",
      "La Cougourlude",
      "Zone de l'Ecoparc",
      "Domaine de la Cougourlude",
    ],
    intro:
      "Pérols, c'est chez nous. Notre atelier est situé au 73 rue Simone Veil, en plein cœur de la commune. Cette proximité est un atout majeur pour nos clients pérolens : aucun frais de déplacement, intervention possible dans la journée pour les urgences, et une vraie réactivité quand il faut revenir vérifier un détail ou ajuster une finition. " +
      "Nous connaissons parfaitement la typologie des logements de Pérols. Les pavillons individuels de la zone du Levant, les résidences récentes du quartier Saint-Sébastien, les maisons de ville du centre ancien, les villas avec piscine vers la Cougourlude : chaque configuration appelle un savoir-faire différent que nous maîtrisons. " +
      "L'autre particularité de Pérols, c'est sa population : un mix de jeunes actifs travaillant à Montpellier, de familles installées, et de nombreux retraités venus profiter du climat méditerranéen. Tous partagent un même besoin : moderniser leur intérieur sans engager des travaux lourds qui les obligeraient à déménager pendant des semaines.",
    pourquoi:
      "À Pérols, vous êtes nos voisins directs. Nous nous engageons à intervenir en moins de 72 heures sur tout projet validé, et à vous offrir un suivi personnalisé dans les semaines qui suivent la pose. Aucune surcharge transport, aucune contrainte de planning : nous sommes littéralement à 5 minutes en voiture. Nos clients pérolens bénéficient également d'un tarif préférentiel sur les petits projets de moins de 15 mètres linéaires.",
    habitat:
      "Maisons individuelles des années 80, villas modernes avec terrasse, appartements résidence récente, locaux commerciaux de la zone d'activité",
    faqLocale: [
      {
        q: "Êtes-vous vraiment basés à Pérols ?",
        a: "Oui, notre atelier officiel se situe au 73 rue Simone Veil, à Pérols. C'est ici que nous stockons nos rouleaux Cover Styl', notre matériel de pose, et que nous préparons les chantiers. Nous sommes immatriculés à Pérols (SIRET 945 180 362 00010, code APE 4334Z) et déclarons l'ensemble de notre activité depuis cette adresse.",
      },
      {
        q: "Puis-je passer voir des échantillons en direct ?",
        a: "Sur rendez-vous, oui. Nous avons un mur d'échantillons des principales familles Cover Styl' (marbre, bois, béton, couleurs, métal) à notre atelier. C'est utile quand vous hésitez entre plusieurs finitions et que vous voulez les voir en grand format avant de valider votre choix. Prenez juste contact par téléphone pour fixer un créneau.",
      },
      {
        q: "Faites-vous des tarifs préférentiels pour les habitants de Pérols ?",
        a: "Oui, pour tout projet pérolen nous appliquons 0 € de frais de déplacement (au lieu de 50-150 € sur d'autres communes), et nous proposons une remise commerciale sur les petits projets (moins de 15 mètres linéaires) qui ne seraient pas rentables ailleurs. C'est notre manière de soutenir le voisinage.",
      },
      {
        q: "Intervenez-vous dans les commerces de Pérols ?",
        a: "Oui, plusieurs commerces et professionnels pérolens nous ont fait confiance : cabinet d'orthodontie, agence immobilière, salle d'esthétique, restaurant du centre. Nous adaptons nos horaires d'intervention pour ne pas impacter votre activité (souvent dimanche ou nuit pour les commerces).",
      },
    ],
  },
  {
    slug: "lattes",
    ville: "Lattes",
    codePostal: "34970",
    distanceKm: 4,
    lat: 43.5642,
    lng: 3.9081,
    quartiers: [
      "Centre-ville",
      "Maurin",
      "Boirargues",
      "Solas",
      "Port Ariane",
      "Lattes Sud",
    ],
    intro:
      "Lattes est notre voisine immédiate, à seulement 4 kilomètres de notre atelier. La commune connaît depuis 15 ans une forte expansion résidentielle, particulièrement dans le secteur de Port Ariane et de Maurin, avec des constructions neuves dont les propriétaires souhaitent personnaliser rapidement les intérieurs livrés en standard. " +
      "Le covering adhésif Cover Styl' apporte ici une solution idéale : il permet de transformer une cuisine d'entrée de gamme livrée par le promoteur en cuisine signature, sans toucher au gros œuvre. Même chose pour les salles de bain : remplacer un carrelage standard par un effet marbre haut de gamme prend une journée, pour un budget équivalent à un seul mur peint par un peintre. " +
      "Nous intervenons aussi régulièrement dans les villas plus anciennes du centre historique de Lattes, près de l'église, où les propriétaires veulent moderniser leur cuisine ou leur SDB sans dénaturer le caractère méditerranéen de leur maison.",
    pourquoi:
      "Notre intervention à Lattes se distingue par une grande souplesse d'horaires. Nombre de nos clients latois sont des couples qui travaillent à Montpellier ou Sète : nous pouvons donc commencer tôt le matin (7h30) ou démarrer en début d'après-midi selon votre planning. Notre connaissance des résidences Port Ariane et Maurin nous permet de présenter directement des références adaptées au style architectural moderne dominant dans ces quartiers.",
    habitat:
      "Maisons neuves de Port Ariane, villas méditerranéennes du centre ancien, appartements en résidence sécurisée à Maurin, locaux commerciaux de la ZAC Solas",
    faqLocale: [
      {
        q: "Le promoteur de mon logement neuf à Lattes vous accepte-t-il ?",
        a: "Le covering n'altère pas le bâti et ne nécessite aucune autorisation du promoteur. Nous restons en surface, sans démolir, sans percer. Vous restez dans les conditions de garantie de votre logement neuf. C'est l'un des intérêts majeurs de notre solution pour les habitants de Port Ariane ou Maurin qui ont investi dans le neuf.",
      },
      {
        q: "Peut-on rénover une SDB carrelée à Lattes sans casser le carrelage ?",
        a: "Oui, c'est précisément ce que nous proposons. Nos films Cover Styl' Wet Areas sont conçus pour le carrelage de salle de bain : ils adhèrent parfaitement après préparation, résistent à l'humidité et aux projections, et donnent un rendu lisse moderne (effet marbre, béton ciré ou couleur unie) en quelques heures, sans poussière ni dépose.",
      },
      {
        q: "Vous déplacez-vous pour les studios étudiants de Lattes ?",
        a: "Oui, les petits projets ne nous font pas peur. Un studio (15-20 m²) peut être complètement repensé en covering pour 1 500 à 2 500 € : façades cuisine, plan, peut-être la crédence et un mur de chambre. Idéal pour les parents d'étudiants qui veulent valoriser leur bien locatif.",
      },
      {
        q: "Avez-vous des références de chantiers à Port Ariane ?",
        a: "Plusieurs. Nous avons rénové des cuisines en façade laquée mate sur des appartements T3 du quai des Frégates, transformé une SDB en effet marbre Calacatta sur le quai Charles-de-Foucauld, et appliqué un covering bois clair sur les portes intérieures de plusieurs villas du domaine. Nous pouvons partager des photos sur demande.",
      },
    ],
  },
  {
    slug: "mauguio",
    ville: "Mauguio",
    codePostal: "34130",
    distanceKm: 6,
    lat: 43.6175,
    lng: 4.0089,
    quartiers: [
      "Centre",
      "Carnon",
      "Carnon-Plage",
      "Mauguio-Plage",
      "Pisciculture",
      "Vauguières-le-Haut",
    ],
    intro:
      "Mauguio, c'est à la fois une commune historique et un secteur littoral en plein essor avec Carnon et Carnon-Plage. Cette dualité crée deux types de demandes très différents que nous traitons régulièrement : la rénovation patrimoniale en cœur de village ancien, et la résidence secondaire à rafraîchir face à la mer. " +
      "Les résidences secondaires de Carnon-Plage subissent un cycle d'usure particulier : exposition au sel marin, locations saisonnières répétées, mobilier qui vieillit vite. Le covering Cover Styl' offre une réponse économique : redonner un coup de neuf à une cuisine ou un séjour entre deux saisons, pour un investissement marginal par rapport au revenu locatif annuel. " +
      "En centre de Mauguio, nos chantiers portent davantage sur des maisons anciennes avec des cuisines des années 80-90 qu'il faut moderniser sans toucher à la structure (souvent classée ou contrainte par le PLU local).",
    pourquoi:
      "Notre maîtrise des contraintes spécifiques au littoral (sel, humidité, exposition UV) nous permet de recommander les références Cover Styl' les plus durables pour chaque pièce. Pour Carnon et Carnon-Plage, nous privilégions les gammes 'Exterior' et 'High-Resistant' qui supportent l'environnement marin. Notre disponibilité hors saison touristique est totale : décembre à mars, nous offrons des créneaux dédiés aux propriétaires de résidences secondaires.",
    habitat:
      "Maisons de pêcheurs réhabilitées au centre, villas balnéaires à Carnon, appartements vue mer au front de mer, mas languedociens en périphérie",
    faqLocale: [
      {
        q: "Le covering résiste-t-il à l'air marin de Carnon ?",
        a: "Oui, à condition de bien choisir la référence. Cover Styl' propose des gammes spécifiquement résistantes à la corrosion saline (gammes Exterior et High-Resistant). Pour les cuisines de résidences secondaires à Carnon, nous recommandons systématiquement ces gammes premium, avec un joint mastic anti-UV sur les bordures les plus exposées.",
      },
      {
        q: "Pouvez-vous rénover ma résidence secondaire entre deux locations ?",
        a: "C'est même notre spécialité dans le secteur. Nous proposons des forfaits 'rotation locative' : intervention en 1 à 2 jours entre votre départ et l'arrivée du locataire suivant, avec un mini-pack 'rafraîchissement' (façades cuisine + plan + une zone SDB) pour 2 500 à 4 500 €. Particulièrement adapté aux résidences Airbnb / Booking à Carnon-Plage.",
      },
      {
        q: "Travaillez-vous avec les agences de location de Mauguio ?",
        a: "Oui, nous avons des partenariats informels avec plusieurs agences de gestion locative du littoral. Si vous nous indiquez le nom de votre agence, nous pouvons coordonner directement avec eux les accès et les créneaux, sans vous obliger à faire l'aller-retour entre Mauguio et votre domicile principal.",
      },
      {
        q: "Le covering tient-il sur du carrelage humide de salle de bain littoral ?",
        a: "Oui, après une préparation adaptée. Nous traitons l'humidité résiduelle avec un primaire d'accroche spécifique, puis posons une référence Cover Styl' classée 'Wet Areas'. La pose dure une journée, et la garantie 10 ans s'applique normalement même en environnement humide marin. Plusieurs SDB à Carnon-Plage tiennent parfaitement depuis 3-4 ans.",
      },
    ],
  },
  {
    slug: "castelnau-le-lez",
    ville: "Castelnau-le-Lez",
    codePostal: "34170",
    distanceKm: 11,
    lat: 43.6346,
    lng: 3.9054,
    quartiers: [
      "Centre",
      "Les Mazes",
      "Domaine du Lez",
      "Sablassou",
      "Mejanelle",
      "Caylus",
    ],
    intro:
      "Castelnau-le-Lez est une commune limitrophe de Montpellier, avec un parc immobilier mixte qui va du cœur de village ancien aux résidences neuves haut de gamme des bords du Lez. Cette diversité fait de Castelnau un terrain particulièrement intéressant pour le covering, car nous y rencontrons à la fois des cuisines des années 70 à moderniser, et des cuisines neuves à customiser dès la livraison. " +
      "Le quartier du Domaine du Lez et les résidences récentes près du tramway concentrent une clientèle active, jeune, exigeante sur le design. Nous y proposons des projets ambitieux : îlots centraux laqués noir mat, plans de travail effet marbre Calacatta brillant, façades bois texturé. " +
      "Le centre historique de Castelnau, autour de l'église et du parc Vert-Parc, abrite des maisons plus anciennes où le covering vient sublimer des éléments d'origine (poutres, carrelages anciens) en apportant un contraste moderne sur la cuisine ou la SDB.",
    pourquoi:
      "Castelnau bénéficie d'un accès direct par la rocade Est, ce qui nous permet d'y arriver en 20 minutes depuis Pérols. Pour les résidences avec parking souterrain (Sablassou, Domaine du Lez), nous gérons facilement l'accès véhicule. Notre expérience des cuisines équipées Schmidt, Mobalpa et Ixina (très présentes à Castelnau) nous permet de proposer des projections de rendu immédiates sur photos de catalogue.",
    habitat:
      "Maisons anciennes du centre village, résidences haut de gamme bords du Lez, pavillons Sablassou, copropriétés tramway Caylus",
    faqLocale: [
      {
        q: "Travaillez-vous sur les cuisines équipées des résidences neuves de Castelnau ?",
        a: "Oui, c'est même une demande fréquente. Les cuisines livrées en standard par les promoteurs sont souvent en mélaminé blanc ou gris, supports parfaits pour le covering. Nous transformons régulièrement des cuisines Schmidt entrée de gamme en cuisines effet bois ou laqué noir mat, pour 2 000 à 4 000 €, avec un résultat indistinguable d'une cuisine haut de gamme.",
      },
      {
        q: "Puis-je faire poser un covering dans mon appartement loué au Domaine du Lez ?",
        a: "Oui, sous réserve de l'accord écrit de votre propriétaire (que nous vous aidons à formuler si besoin). Le covering étant réversible et retirable sans dommage, il est généralement bien accepté par les bailleurs, surtout quand il valorise visuellement le bien. Nous pouvons aussi proposer un contrat 'covering temporaire' avec retrait à la fin du bail.",
      },
      {
        q: "Le tram passe près de chez moi, c'est gênant pour le chantier ?",
        a: "Pas du tout. La pose de covering est silencieuse et ne nécessite pas de couper l'eau ou l'électricité. Les passages de tramway n'ont aucun impact sur notre travail. Nous avons posé des covering dans des appartements à 30 mètres du tracé du tram à Sablassou sans aucun souci.",
      },
      {
        q: "Avez-vous une preuve sociale à Castelnau-le-Lez ?",
        a: "Plusieurs chantiers réalisés ces 6 derniers mois, dont une cuisine complète en marbre Calacatta sur l'avenue de l'Europe, et une SDB en béton ciré gris anthracite près du parc Bocaud. Nous pouvons partager des photos sur demande et, dans certains cas (avec accord du client), organiser une visite de référence.",
      },
    ],
  },
  {
    slug: "beziers",
    ville: "Béziers",
    codePostal: "34500",
    distanceKm: 65,
    lat: 43.3441,
    lng: 3.2192,
    quartiers: [
      "Centre historique",
      "Cathédrale Saint-Nazaire",
      "Iranget",
      "La Devèze",
      "Les Oliviers",
      "Marquerose",
    ],
    intro:
      "Béziers est la deuxième ville de l'Hérault, à environ une heure de notre atelier. Nous y intervenons régulièrement et nous y déplaçons sans difficulté, avec un minimum de planning pour optimiser le trajet. Le parc immobilier biterrois est très différent de celui de Montpellier : davantage de maisons individuelles, de l'habitat plus ancien dans le centre historique (souvent classé), et des projets de rénovation patrimoniaux plus fréquents. " +
      "Le centre de Béziers, avec ses immeubles haussmanniens et ses appartements aux beaux volumes, se prête particulièrement bien au covering : nous pouvons moderniser une cuisine vieillissante sans toucher aux moulures, aux parquets anciens ou aux cheminées d'époque qui font le charme de ces logements. C'est exactement le compromis que recherchent nos clients biterrois — moderniser sans dénaturer. " +
      "Les quartiers plus périphériques (Iranget, Marquerose) hébergent des maisons familiales des années 60-80 dont les cuisines et SDB méritent un coup de jeune, mais où une rénovation classique serait disproportionnée par rapport au reste du logement.",
    pourquoi:
      "Pour les chantiers biterrois, nous proposons une formule 'chantier groupé' : si vous nous mettez en contact avec un voisin, un ami ou un proche qui a aussi un projet covering, nous regroupons les déplacements et appliquons une remise commerciale partagée. C'est une manière de compenser la distance Pérols-Béziers tout en restant compétitifs. Notre interface en ligne (simulateur IA + devis à distance) nous permet par ailleurs de réduire au strict nécessaire les déplacements de visite technique.",
    habitat:
      "Appartements haussmanniens du centre, maisons de ville du centre ancien, pavillons familiaux périphériques, mas viticoles en campagne biterroise",
    faqLocale: [
      {
        q: "Vous déplacez-vous vraiment jusqu'à Béziers ?",
        a: "Oui, sans hésitation. Béziers fait partie de notre zone naturelle d'intervention en Hérault. Nous y allons typiquement 1 à 2 fois par mois pour des chantiers. Pour les projets >15 mètres linéaires, le déplacement est inclus dans le devis. Pour les petits projets isolés, nous proposons un forfait déplacement réduit (80-120 €) ou regroupons avec d'autres clients du secteur.",
      },
      {
        q: "Le centre historique de Béziers a des contraintes patrimoniales, est-ce un problème ?",
        a: "Non, justement le covering est idéal en zone patrimoniale. Il n'altère pas le bâti, ne modifie pas les volumes, ne nécessite aucune autorisation d'urbanisme (puisqu'il s'applique en surface, à l'intérieur). C'est même une solution mise en avant par les architectes du patrimoine pour moderniser sans dénaturer.",
      },
      {
        q: "Faites-vous des visites technique à distance pour Béziers ?",
        a: "Oui, c'est notre approche standard pour optimiser les déplacements. Vous nous envoyez 5-10 photos précises de votre cuisine ou SDB (vue d'ensemble + détails des supports + mesures), nous établissons un devis détaillé sous 48h. Si tout est validé, nous nous déplaçons une seule fois pour le chantier complet.",
      },
      {
        q: "Puis-je grouper avec mes voisins biterrois pour un meilleur tarif ?",
        a: "Tout à fait, c'est même encouragé. Si vous fédérez 2-3 voisins ou amis biterrois qui ont aussi un projet covering, nous proposons une réduction de 10 à 15% sur chaque chantier et regroupons les déplacements. Cela peut transformer un projet hésitant en projet abordable.",
      },
    ],
  },
  {
    slug: "nimes",
    ville: "Nîmes",
    codePostal: "30000 / 30900",
    distanceKm: 55,
    lat: 43.8367,
    lng: 4.3601,
    quartiers: [
      "Écusson",
      "Carmes",
      "Gambetta",
      "Jean-Jaurès",
      "Hoche-Université",
      "Pissevin",
      "Mas de Mingue",
    ],
    intro:
      "Nîmes est la seconde grande ville de notre zone d'intervention, dans le département voisin du Gard. Bien que située à 55 km de Pérols, nous y intervenons régulièrement grâce à l'autoroute A9. Le marché nîmois est dynamique avec une forte demande de rénovation, notamment dans le centre historique autour des arènes et de la Maison Carrée. " +
      "Les maisons du centre ancien de Nîmes, avec leurs murs en pierre apparente et leurs cuisines parfois vétustes, sont un terrain de jeu idéal pour le covering : nous modernisons les plans et façades sans toucher au cachet architectural. Les appartements du quartier des Carmes et Gambetta, souvent rénovés par des investisseurs locatifs, demandent aussi des solutions rapides et économiques que seul le covering peut offrir. " +
      "Plus récemment, nous voyons émerger une demande des nouveaux quartiers (Hoche, près de l'université) où une population jeune cherche à personnaliser des logements neufs livrés en standard.",
    pourquoi:
      "Notre maillage Nîmes-Pérols passe par l'A9, ce qui nous permet d'organiser des journées d'intervention groupées : un chantier le matin à Nîmes, un autre l'après-midi à Lunel ou Vauvert. Cette logistique optimisée nous permet de maintenir des tarifs compétitifs malgré la distance. Notre simulateur IA en ligne, accessible 24/7, permet à nos clients nîmois de valider leurs choix de finitions à distance avant même que nous ne nous déplacions.",
    habitat:
      "Maisons en pierre du centre historique, immeubles haussmanniens Gambetta, résidences récentes Hoche-Université, mas en campagne nîmoise",
    faqLocale: [
      {
        q: "Vous déplacez-vous depuis Pérols jusqu'à Nîmes ?",
        a: "Oui, régulièrement. Nîmes est notre deuxième ville de prédilection en termes de chantiers hors Hérault. L'A9 nous permet d'y être en 45-50 minutes. Le frais de déplacement est compris dans tout devis supérieur à 1 500 € HT ; pour les petits projets, nous proposons un forfait déplacement de 100 € ou un regroupement avec d'autres chantiers du Gard.",
      },
      {
        q: "Les maisons en pierre du centre nîmois peuvent-elles recevoir un covering ?",
        a: "Oui, sur les supports lisses ou rendus lisses. Si votre cuisine ou SDB est en pierre apparente brute, nous ne pouvons pas appliquer directement (la surface est trop poreuse). Mais nous pouvons couvrir les façades de meubles, plans de travail, crédences, portes intérieures, qui ne sont presque jamais en pierre brute, même dans le centre historique.",
      },
      {
        q: "Y a-t-il un délai supplémentaire pour les chantiers à Nîmes ?",
        a: "Très peu. Nous nous engageons à intervenir sous 7 à 10 jours après validation du devis pour les chantiers nîmois (vs 5 à 7 jours pour Montpellier/Pérols). C'est juste le temps que nous trouvions un créneau qui s'intègre bien dans une journée de déplacement vers le Gard.",
      },
      {
        q: "Peut-on rénover un studio étudiant nîmois en covering ?",
        a: "Tout à fait. Nîmes a une population étudiante importante (université, écoles), et nous avons rénové plusieurs studios meublés destinés à la location. Budget typique : 1 200 à 2 000 € pour une rénovation cuisine + un mur ou une porte. Particulièrement adapté aux propriétaires bailleurs qui veulent valoriser rapidement leur bien.",
      },
    ],
  },
  {
    slug: "sete",
    ville: "Sète",
    codePostal: "34200",
    distanceKm: 35,
    lat: 43.4053,
    lng: 3.6976,
    quartiers: [
      "Île de Thau",
      "Mont Saint-Clair",
      "Frontignan-plage limite",
      "Quartier Haut",
      "Pointe-Courte",
      "Cayenne",
    ],
    intro:
      "Sète est une ville à l'identité forte, à 35 km de notre atelier. Ses spécificités architecturales (immeubles aux façades colorées, maisons de pêcheurs étroites, appartements en hauteur sur le Mont Saint-Clair) en font un terrain d'intervention particulier qui demande une vraie capacité d'adaptation. Le covering adhésif y trouve toute sa pertinence : nombreuses maisons anciennes avec cuisines à moderniser, sans pour autant pouvoir lancer des travaux structurels (escaliers étroits, accès rues piétonnes, immeubles classés). " +
      "Le climat marin sétois impose une vigilance particulière : nous sélectionnons les références Cover Styl' les plus résistantes à l'humidité et au sel pour les logements proches du port ou en bord de mer. Nos chantiers sur le Mont Saint-Clair, avec des vues exceptionnelles, nous demandent souvent de transporter le matériel à pied sur quelques mètres — nous y sommes préparés. " +
      "Nous avons également une clientèle de propriétaires de résidences secondaires sétoises (Île de Thau, Quartier Haut) qui veulent rafraîchir leur bien sans engagement de longs travaux.",
    pourquoi:
      "Notre familiarité avec les contraintes architecturales sétoises (accès étroits, escaliers en colimaçon, dénivelés) nous permet d'organiser les chantiers de manière optimale. Nous arrivons systématiquement avec un kit 'transport manuel' (chariot pliable, sangles de portage) pour les accès difficiles. Notre choix des références Cover Styl' tient compte de l'exposition marine de chaque logement.",
    habitat:
      "Maisons de pêcheurs étroites du Quartier Haut, appartements vue mer Mont Saint-Clair, résidences récentes Île de Thau, maisons de ville Cayenne",
    faqLocale: [
      {
        q: "Vos films résistent-ils à l'air marin de Sète ?",
        a: "Pour les logements directement exposés (front de mer, balcons côté étang), nous utilisons des références Cover Styl' classées 'Exterior' ou 'High-Resistant', conçues pour résister au sel et aux UV. Pour les logements à l'intérieur des terres ou protégés (Quartier Haut, intérieur des immeubles), les références standard suffisent largement.",
      },
      {
        q: "Comment gérez-vous les accès difficiles au Mont Saint-Clair ?",
        a: "Nous repérons toujours l'accès en amont du chantier, soit par street view, soit par photos que vous nous envoyez. Si l'accès véhicule s'arrête à 50 mètres, ce n'est pas un problème : nos rouleaux Cover Styl' (1,22 m de large, 5 à 10 kg pièce) sont transportables manuellement. Pour les escaliers très étroits, nous adaptons la découpe en amont pour ne monter que des sections gérables.",
      },
      {
        q: "Pouvez-vous intervenir sur une maison sétoise classée ou en zone patrimoniale ?",
        a: "Oui, sans souci. Le covering est une intervention intérieure non-structurelle. Il ne nécessite aucune autorisation auprès des Architectes des Bâtiments de France (ABF) puisqu'il ne modifie en rien l'extérieur ni la structure. Nous avons travaillé sur plusieurs maisons protégées du Quartier Haut sans aucune démarche administrative à votre charge.",
      },
      {
        q: "Acceptez-vous les chantiers en résidence secondaire sétoise ?",
        a: "Oui, c'est même un cas fréquent. Vous nous donnez les clés ou un code d'accès, nous intervenons sur 1 à 2 jours en votre absence, vous envoyons des photos d'avancement et de réception, et vous récupérez votre logement transformé à votre prochain passage. Plusieurs propriétaires lyonnais ou parisiens d'appartements sétois fonctionnent ainsi avec nous.",
      },
    ],
  },
];

/** Helper pour les liens : prefixe "covering-" */
export function getZoneSlug(zone: Zone): string {
  return `covering-${zone.slug}`;
}

/** Helper pour récupérer une zone par son slug d'URL (avec ou sans prefix) */
export function getZoneBySlug(slug: string): Zone | undefined {
  const cleaned = slug.replace(/^covering-/, "");
  return ZONES.find((z) => z.slug === cleaned);
}
