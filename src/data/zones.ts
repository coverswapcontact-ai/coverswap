/**
 * Zones d'intervention CoverSwap — données SEO locales par ville.
 *
 * Chaque entrée alimente :
 *  - la route dynamique /zones/[ville]
 *  - le JSON-LD areaServed du LocalBusiness
 *  - la colonne "Zones d'intervention" du footer
 *  - le sitemap.xml
 *
 * Règle d'or : rien d'inventé. Aucun chantier, client, partenaire, atelier,
 * forfait ou remise qui n'existe pas. Les délais, garanties et compteurs
 * viennent de src/lib/offre (marqueurs {NB} et {DELAI} remplacés à l'affichage).
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
    quartiers: ["Antigone", "Port Marianne", "Comédie", "Écusson", "Beaux-Arts", "Boutonnet", "Aiguelongue", "Hôpitaux-Facultés", "Croix d'Argent", "Mosson"],
    intro:
      "Montpellier est à une dizaine de minutes de Pérols : nous y intervenons sur devis, comme partout en France, sans surcoût caché. Le covering adhésif Cover Styl' transforme une cuisine, une salle de bain, des meubles ou un local professionnel à Montpellier en une journée de pose, sans démolition, sans poussière et sans changer ce qui fonctionne déjà. Le film se pose sur les façades, plans de travail, crédences, portes, carrelages muraux et mobilier existants, avec près de {NB} finitions au choix : bois, pierre, béton, métal, couleurs unies, textile.\nConcrètement, vous nous envoyez quelques photos ou lancez la simulation en ligne, vous recevez un devis détaillé {DELAI}, et la pose est planifiée à une date qui vous convient. Les quartiers cités ci-dessous ne sont qu'un repère : nous couvrons toute la commune et ses alentours.",
    pourquoi:
      "Montpellier est à une dizaine de minutes de Pérols : nous nous déplaçons facilement pour une visite, une prise de mesures ou une retouche, et nous connaissons les contraintes des logements du secteur (accès, stationnement, copropriétés). Le devis est gratuit et vous répond {DELAI}.",
    habitat: "Studios d'étudiants à rénover, appartements familiaux de Port Marianne, maisons de ville aux Aiguerelles, lofts industriels du quartier Cambacérès",
    faqLocale: [
      {
        q: "Intervenez-vous vraiment à Montpellier ?",
        a: "Oui. Montpellier est à une dizaine de minutes de Pérols, et nous intervenons partout en France sur devis. Les éventuels frais de déplacement sont indiqués dans le devis avant toute décision.",
      },
      {
        q: "Combien de temps pour obtenir un devis à Montpellier ?",
        a: "Vous recevez un devis détaillé {DELAI} après votre demande, à partir de vos photos ou de votre simulation en ligne. Il est gratuit et sans engagement ; une visite sur place est proposée quand les mesures l'exigent.",
      },
      {
        q: "Comment se passe la pose à Montpellier ?",
        a: "Une cuisine ou une salle de bain courante se pose en une journée. Nous protégeons la pièce, nettoyons et dégraissons les surfaces, posons le film Cover Styl' puis vérifions chaque finition avec vous. Pas de démolition, pas de gravats : vous réutilisez la pièce le soir même.",
      },
      {
        q: "Quels projets réalisez-vous à Montpellier ?",
        a: "Studios d'étudiants à rénover, appartements familiaux de Port Marianne, maisons de ville aux Aiguerelles, lofts industriels du quartier Cambacérès : façades et plans de travail de cuisine, murs carrelés de salle de bain, meubles, portes, comptoirs et mobilier de locaux professionnels. Si une surface est lisse et saine, elle peut probablement être recouverte.",
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
    quartiers: ["Centre-ville", "Saint-Sébastien", "Les Caunelles", "La Cougourlude", "Zone de l'Ecoparc", "Domaine de la Cougourlude"],
    intro:
      "Pérols, c'est notre commune : CoverSwap y est domicilié, et c'est de là que partent toutes nos interventions. Le covering adhésif Cover Styl' transforme une cuisine, une salle de bain, des meubles ou un local professionnel à Pérols en une journée de pose, sans démolition, sans poussière et sans changer ce qui fonctionne déjà. Le film se pose sur les façades, plans de travail, crédences, portes, carrelages muraux et mobilier existants, avec près de {NB} finitions au choix : bois, pierre, béton, métal, couleurs unies, textile.\nConcrètement, vous nous envoyez quelques photos ou lancez la simulation en ligne, vous recevez un devis détaillé {DELAI}, et la pose est planifiée à une date qui vous convient. Les quartiers cités ci-dessous ne sont qu'un repère : nous couvrons toute la commune et ses alentours.",
    pourquoi:
      "Nous sommes installés à Pérols même : pas de trajet à prévoir, une réactivité maximale pour les visites et les retouches, et un artisan que vous pouvez recontacter simplement après la pose. Le devis est gratuit et vous répond {DELAI}.",
    habitat: "Maisons individuelles des années 80, villas modernes avec terrasse, appartements résidence récente, locaux commerciaux de la zone d'activité",
    faqLocale: [
      {
        q: "Intervenez-vous vraiment à Pérols ?",
        a: "Oui, c'est notre commune : CoverSwap est domicilié à Pérols et toutes nos interventions partent d'ici.",
      },
      {
        q: "Combien de temps pour obtenir un devis à Pérols ?",
        a: "Vous recevez un devis détaillé {DELAI} après votre demande, à partir de vos photos ou de votre simulation en ligne. Il est gratuit et sans engagement ; une visite sur place est proposée quand les mesures l'exigent.",
      },
      {
        q: "Comment se passe la pose à Pérols ?",
        a: "Une cuisine ou une salle de bain courante se pose en une journée. Nous protégeons la pièce, nettoyons et dégraissons les surfaces, posons le film Cover Styl' puis vérifions chaque finition avec vous. Pas de démolition, pas de gravats : vous réutilisez la pièce le soir même.",
      },
      {
        q: "Quels projets réalisez-vous à Pérols ?",
        a: "Maisons individuelles des années 80, villas modernes avec terrasse, appartements résidence récente, locaux commerciaux de la zone d'activité : façades et plans de travail de cuisine, murs carrelés de salle de bain, meubles, portes, comptoirs et mobilier de locaux professionnels. Si une surface est lisse et saine, elle peut probablement être recouverte.",
      },
      {
        q: "Peut-on voir des échantillons avant de choisir ?",
        a: "Oui : nous apportons des échantillons Cover Styl' des finitions présélectionnées lors de la visite, pour les comparer sur place, dans votre lumière. La simulation en ligne donne un premier aperçu du rendu sur votre propre photo.",
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
    quartiers: ["Centre-ville", "Maurin", "Boirargues", "Solas", "Port Ariane", "Lattes Sud"],
    intro:
      "Lattes est à cinq minutes de Pérols : nous y intervenons sur devis, comme partout en France, sans surcoût caché. Le covering adhésif Cover Styl' transforme une cuisine, une salle de bain, des meubles ou un local professionnel à Lattes en une journée de pose, sans démolition, sans poussière et sans changer ce qui fonctionne déjà. Le film se pose sur les façades, plans de travail, crédences, portes, carrelages muraux et mobilier existants, avec près de {NB} finitions au choix : bois, pierre, béton, métal, couleurs unies, textile.\nConcrètement, vous nous envoyez quelques photos ou lancez la simulation en ligne, vous recevez un devis détaillé {DELAI}, et la pose est planifiée à une date qui vous convient. Les quartiers cités ci-dessous ne sont qu'un repère : nous couvrons toute la commune et ses alentours.",
    pourquoi:
      "Lattes est à cinq minutes de Pérols : nous nous déplaçons facilement pour une visite, une prise de mesures ou une retouche, et nous connaissons les contraintes des logements du secteur (accès, stationnement, copropriétés). Le devis est gratuit et vous répond {DELAI}.",
    habitat: "Maisons neuves de Port Ariane, villas méditerranéennes du centre ancien, appartements en résidence sécurisée à Maurin, locaux commerciaux de la ZAC Solas",
    faqLocale: [
      {
        q: "Intervenez-vous vraiment à Lattes ?",
        a: "Oui. Lattes est à cinq minutes de Pérols, et nous intervenons partout en France sur devis. Les éventuels frais de déplacement sont indiqués dans le devis avant toute décision.",
      },
      {
        q: "Combien de temps pour obtenir un devis à Lattes ?",
        a: "Vous recevez un devis détaillé {DELAI} après votre demande, à partir de vos photos ou de votre simulation en ligne. Il est gratuit et sans engagement ; une visite sur place est proposée quand les mesures l'exigent.",
      },
      {
        q: "Comment se passe la pose à Lattes ?",
        a: "Une cuisine ou une salle de bain courante se pose en une journée. Nous protégeons la pièce, nettoyons et dégraissons les surfaces, posons le film Cover Styl' puis vérifions chaque finition avec vous. Pas de démolition, pas de gravats : vous réutilisez la pièce le soir même.",
      },
      {
        q: "Quels projets réalisez-vous à Lattes ?",
        a: "Maisons neuves de Port Ariane, villas méditerranéennes du centre ancien, appartements en résidence sécurisée à Maurin, locaux commerciaux de la ZAC Solas : façades et plans de travail de cuisine, murs carrelés de salle de bain, meubles, portes, comptoirs et mobilier de locaux professionnels. Si une surface est lisse et saine, elle peut probablement être recouverte.",
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
    quartiers: ["Centre", "Carnon", "Carnon-Plage", "Mauguio-Plage", "Pisciculture", "Vauguières-le-Haut"],
    intro:
      "Mauguio est à dix minutes de Pérols : nous y intervenons sur devis, comme partout en France, sans surcoût caché. Le covering adhésif Cover Styl' transforme une cuisine, une salle de bain, des meubles ou un local professionnel à Mauguio en une journée de pose, sans démolition, sans poussière et sans changer ce qui fonctionne déjà. Le film se pose sur les façades, plans de travail, crédences, portes, carrelages muraux et mobilier existants, avec près de {NB} finitions au choix : bois, pierre, béton, métal, couleurs unies, textile.\nConcrètement, vous nous envoyez quelques photos ou lancez la simulation en ligne, vous recevez un devis détaillé {DELAI}, et la pose est planifiée à une date qui vous convient. Les quartiers cités ci-dessous ne sont qu'un repère : nous couvrons toute la commune et ses alentours.",
    pourquoi:
      "Mauguio est à dix minutes de Pérols : nous nous déplaçons facilement pour une visite, une prise de mesures ou une retouche, et nous connaissons les contraintes des logements du secteur (accès, stationnement, copropriétés). Le devis est gratuit et vous répond {DELAI}.",
    habitat: "Maisons de pêcheurs réhabilitées au centre, villas balnéaires à Carnon, appartements vue mer au front de mer, mas languedociens en périphérie",
    faqLocale: [
      {
        q: "Intervenez-vous vraiment à Mauguio ?",
        a: "Oui. Mauguio est à dix minutes de Pérols, et nous intervenons partout en France sur devis. Les éventuels frais de déplacement sont indiqués dans le devis avant toute décision.",
      },
      {
        q: "Combien de temps pour obtenir un devis à Mauguio ?",
        a: "Vous recevez un devis détaillé {DELAI} après votre demande, à partir de vos photos ou de votre simulation en ligne. Il est gratuit et sans engagement ; une visite sur place est proposée quand les mesures l'exigent.",
      },
      {
        q: "Comment se passe la pose à Mauguio ?",
        a: "Une cuisine ou une salle de bain courante se pose en une journée. Nous protégeons la pièce, nettoyons et dégraissons les surfaces, posons le film Cover Styl' puis vérifions chaque finition avec vous. Pas de démolition, pas de gravats : vous réutilisez la pièce le soir même.",
      },
      {
        q: "Quels projets réalisez-vous à Mauguio ?",
        a: "Maisons de pêcheurs réhabilitées au centre, villas balnéaires à Carnon, appartements vue mer au front de mer, mas languedociens en périphérie : façades et plans de travail de cuisine, murs carrelés de salle de bain, meubles, portes, comptoirs et mobilier de locaux professionnels. Si une surface est lisse et saine, elle peut probablement être recouverte.",
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
    quartiers: ["Centre", "Les Mazes", "Domaine du Lez", "Sablassou", "Mejanelle", "Caylus"],
    intro:
      "Castelnau-le-Lez est à un quart d'heure de Pérols par la rocade : nous y intervenons sur devis, comme partout en France, sans surcoût caché. Le covering adhésif Cover Styl' transforme une cuisine, une salle de bain, des meubles ou un local professionnel à Castelnau-le-Lez en une journée de pose, sans démolition, sans poussière et sans changer ce qui fonctionne déjà. Le film se pose sur les façades, plans de travail, crédences, portes, carrelages muraux et mobilier existants, avec près de {NB} finitions au choix : bois, pierre, béton, métal, couleurs unies, textile.\nConcrètement, vous nous envoyez quelques photos ou lancez la simulation en ligne, vous recevez un devis détaillé {DELAI}, et la pose est planifiée à une date qui vous convient. Les quartiers cités ci-dessous ne sont qu'un repère : nous couvrons toute la commune et ses alentours.",
    pourquoi:
      "Castelnau-le-Lez est à un quart d'heure de Pérols par la rocade : nous nous déplaçons facilement pour une visite, une prise de mesures ou une retouche, et nous connaissons les contraintes des logements du secteur (accès, stationnement, copropriétés). Le devis est gratuit et vous répond {DELAI}.",
    habitat: "Maisons anciennes du centre village, résidences haut de gamme bords du Lez, pavillons Sablassou, copropriétés tramway Caylus",
    faqLocale: [
      {
        q: "Intervenez-vous vraiment à Castelnau-le-Lez ?",
        a: "Oui. Castelnau-le-Lez est à un quart d'heure de Pérols par la rocade, et nous intervenons partout en France sur devis. Les éventuels frais de déplacement sont indiqués dans le devis avant toute décision.",
      },
      {
        q: "Combien de temps pour obtenir un devis à Castelnau-le-Lez ?",
        a: "Vous recevez un devis détaillé {DELAI} après votre demande, à partir de vos photos ou de votre simulation en ligne. Il est gratuit et sans engagement ; une visite sur place est proposée quand les mesures l'exigent.",
      },
      {
        q: "Comment se passe la pose à Castelnau-le-Lez ?",
        a: "Une cuisine ou une salle de bain courante se pose en une journée. Nous protégeons la pièce, nettoyons et dégraissons les surfaces, posons le film Cover Styl' puis vérifions chaque finition avec vous. Pas de démolition, pas de gravats : vous réutilisez la pièce le soir même.",
      },
      {
        q: "Quels projets réalisez-vous à Castelnau-le-Lez ?",
        a: "Maisons anciennes du centre village, résidences haut de gamme bords du Lez, pavillons Sablassou, copropriétés tramway Caylus : façades et plans de travail de cuisine, murs carrelés de salle de bain, meubles, portes, comptoirs et mobilier de locaux professionnels. Si une surface est lisse et saine, elle peut probablement être recouverte.",
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
    quartiers: ["Centre historique", "Cathédrale Saint-Nazaire", "Iranget", "La Devèze", "Les Oliviers", "Marquerose"],
    intro:
      "Béziers est à une heure de Pérols par l'A9 : nous y intervenons sur devis, comme partout en France, sans surcoût caché. Le covering adhésif Cover Styl' transforme une cuisine, une salle de bain, des meubles ou un local professionnel à Béziers en une journée de pose, sans démolition, sans poussière et sans changer ce qui fonctionne déjà. Le film se pose sur les façades, plans de travail, crédences, portes, carrelages muraux et mobilier existants, avec près de {NB} finitions au choix : bois, pierre, béton, métal, couleurs unies, textile.\nConcrètement, vous nous envoyez quelques photos ou lancez la simulation en ligne, vous recevez un devis détaillé {DELAI}, et la pose est planifiée à une date qui vous convient. Le déplacement est prévu et écrit dans le devis : aucune surprise à la fin du chantier.",
    pourquoi:
      "Nous intervenons à Béziers sur devis, à une heure de Pérols par l'A9. Les photos et la simulation en ligne permettent de préparer l'intervention à distance, puis nous venons poser en une journée pour la plupart des projets. Le déplacement figure noir sur blanc dans le devis, qui est gratuit et vous répond {DELAI}.",
    habitat: "Appartements haussmanniens du centre, maisons de ville du centre ancien, pavillons familiaux périphériques, mas viticoles en campagne biterroise",
    faqLocale: [
      {
        q: "Intervenez-vous vraiment à Béziers ?",
        a: "Oui. Béziers est à une heure de Pérols par l'A9, et nous intervenons partout en France sur devis. Les éventuels frais de déplacement sont indiqués dans le devis avant toute décision.",
      },
      {
        q: "Combien de temps pour obtenir un devis à Béziers ?",
        a: "Vous recevez un devis détaillé {DELAI} après votre demande, à partir de vos photos ou de votre simulation en ligne. Il est gratuit et sans engagement ; une visite sur place est proposée quand les mesures l'exigent.",
      },
      {
        q: "Comment se passe la pose à Béziers ?",
        a: "Une cuisine ou une salle de bain courante se pose en une journée. Nous protégeons la pièce, nettoyons et dégraissons les surfaces, posons le film Cover Styl' puis vérifions chaque finition avec vous. Pas de démolition, pas de gravats : vous réutilisez la pièce le soir même. Pour les projets éloignés, nous regroupons la visite et la pose autant que possible pour limiter les déplacements.",
      },
      {
        q: "Quels projets réalisez-vous à Béziers ?",
        a: "Appartements haussmanniens du centre, maisons de ville du centre ancien, pavillons familiaux périphériques, mas viticoles en campagne biterroise : façades et plans de travail de cuisine, murs carrelés de salle de bain, meubles, portes, comptoirs et mobilier de locaux professionnels. Si une surface est lisse et saine, elle peut probablement être recouverte.",
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
    quartiers: ["Écusson", "Carmes", "Gambetta", "Jean-Jaurès", "Hoche-Université", "Pissevin", "Mas de Mingue"],
    intro:
      "Nîmes est à cinquante minutes de Pérols par l'A9 : nous y intervenons sur devis, comme partout en France, sans surcoût caché. Le covering adhésif Cover Styl' transforme une cuisine, une salle de bain, des meubles ou un local professionnel à Nîmes en une journée de pose, sans démolition, sans poussière et sans changer ce qui fonctionne déjà. Le film se pose sur les façades, plans de travail, crédences, portes, carrelages muraux et mobilier existants, avec près de {NB} finitions au choix : bois, pierre, béton, métal, couleurs unies, textile.\nConcrètement, vous nous envoyez quelques photos ou lancez la simulation en ligne, vous recevez un devis détaillé {DELAI}, et la pose est planifiée à une date qui vous convient. Le déplacement est prévu et écrit dans le devis : aucune surprise à la fin du chantier.",
    pourquoi:
      "Nous intervenons à Nîmes sur devis, à cinquante minutes de Pérols par l'A9. Les photos et la simulation en ligne permettent de préparer l'intervention à distance, puis nous venons poser en une journée pour la plupart des projets. Le déplacement figure noir sur blanc dans le devis, qui est gratuit et vous répond {DELAI}.",
    habitat: "Maisons en pierre du centre historique, immeubles haussmanniens Gambetta, résidences récentes Hoche-Université, mas en campagne nîmoise",
    faqLocale: [
      {
        q: "Intervenez-vous vraiment à Nîmes ?",
        a: "Oui. Nîmes est à cinquante minutes de Pérols par l'A9, et nous intervenons partout en France sur devis. Les éventuels frais de déplacement sont indiqués dans le devis avant toute décision.",
      },
      {
        q: "Combien de temps pour obtenir un devis à Nîmes ?",
        a: "Vous recevez un devis détaillé {DELAI} après votre demande, à partir de vos photos ou de votre simulation en ligne. Il est gratuit et sans engagement ; une visite sur place est proposée quand les mesures l'exigent.",
      },
      {
        q: "Comment se passe la pose à Nîmes ?",
        a: "Une cuisine ou une salle de bain courante se pose en une journée. Nous protégeons la pièce, nettoyons et dégraissons les surfaces, posons le film Cover Styl' puis vérifions chaque finition avec vous. Pas de démolition, pas de gravats : vous réutilisez la pièce le soir même. Pour les projets éloignés, nous regroupons la visite et la pose autant que possible pour limiter les déplacements.",
      },
      {
        q: "Quels projets réalisez-vous à Nîmes ?",
        a: "Maisons en pierre du centre historique, immeubles haussmanniens Gambetta, résidences récentes Hoche-Université, mas en campagne nîmoise : façades et plans de travail de cuisine, murs carrelés de salle de bain, meubles, portes, comptoirs et mobilier de locaux professionnels. Si une surface est lisse et saine, elle peut probablement être recouverte.",
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
    quartiers: ["Île de Thau", "Mont Saint-Clair", "Frontignan-plage limite", "Quartier Haut", "Pointe-Courte", "Cayenne"],
    intro:
      "Sète est à une demi-heure de Pérols par le littoral : nous y intervenons sur devis, comme partout en France, sans surcoût caché. Le covering adhésif Cover Styl' transforme une cuisine, une salle de bain, des meubles ou un local professionnel à Sète en une journée de pose, sans démolition, sans poussière et sans changer ce qui fonctionne déjà. Le film se pose sur les façades, plans de travail, crédences, portes, carrelages muraux et mobilier existants, avec près de {NB} finitions au choix : bois, pierre, béton, métal, couleurs unies, textile.\nConcrètement, vous nous envoyez quelques photos ou lancez la simulation en ligne, vous recevez un devis détaillé {DELAI}, et la pose est planifiée à une date qui vous convient. Le déplacement est prévu et écrit dans le devis : aucune surprise à la fin du chantier.",
    pourquoi:
      "Nous intervenons à Sète sur devis, à une demi-heure de Pérols par le littoral. Les photos et la simulation en ligne permettent de préparer l'intervention à distance, puis nous venons poser en une journée pour la plupart des projets. Le déplacement figure noir sur blanc dans le devis, qui est gratuit et vous répond {DELAI}.",
    habitat: "Maisons de pêcheurs étroites du Quartier Haut, appartements vue mer Mont Saint-Clair, résidences récentes Île de Thau, maisons de ville Cayenne",
    faqLocale: [
      {
        q: "Intervenez-vous vraiment à Sète ?",
        a: "Oui. Sète est à une demi-heure de Pérols par le littoral, et nous intervenons partout en France sur devis. Les éventuels frais de déplacement sont indiqués dans le devis avant toute décision.",
      },
      {
        q: "Combien de temps pour obtenir un devis à Sète ?",
        a: "Vous recevez un devis détaillé {DELAI} après votre demande, à partir de vos photos ou de votre simulation en ligne. Il est gratuit et sans engagement ; une visite sur place est proposée quand les mesures l'exigent.",
      },
      {
        q: "Comment se passe la pose à Sète ?",
        a: "Une cuisine ou une salle de bain courante se pose en une journée. Nous protégeons la pièce, nettoyons et dégraissons les surfaces, posons le film Cover Styl' puis vérifions chaque finition avec vous. Pas de démolition, pas de gravats : vous réutilisez la pièce le soir même. Pour les projets éloignés, nous regroupons la visite et la pose autant que possible pour limiter les déplacements.",
      },
      {
        q: "Quels projets réalisez-vous à Sète ?",
        a: "Maisons de pêcheurs étroites du Quartier Haut, appartements vue mer Mont Saint-Clair, résidences récentes Île de Thau, maisons de ville Cayenne : façades et plans de travail de cuisine, murs carrelés de salle de bain, meubles, portes, comptoirs et mobilier de locaux professionnels. Si une surface est lisse et saine, elle peut probablement être recouverte.",
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
