# SEO et performance du site — site 3.0

Squelette posé au lot B0 (mission 21) ; carte des intentions, image de partage et hôte unique écrits au lot F1 et
appliqués aux lots F2 et F3 ; données structurées au lot F4, maillage au lot F5 ; les mesures « après » aux lots F6 et G3.

## Objectifs

- Téléphone : LCP ≤ 2,5 s, performance ≥ 90, accessibilité 100, SEO 100, CLS ≤ 0,05 (seuils bloquants de la CI dans
  `lighthouserc.json`, inchangés : performance ≥ 0,85, les trois autres axes ≥ 0,95, LCP ≤ 4 s, TBT ≤ 400 ms).
- Titres de 60 caractères au plus, descriptions de 155 au plus.
- 300 mots rendus sur chaque page indexée.

## Carte des intentions (lot F1, 06/10/2026)

Une ligne par page indexée. Le title et la description sont ceux que le lot F2 pose (longueur entre parenthèses,
mesurée sur le build : `title` complet, suffixe « | CoverSwap » compris). Les liens « y mènent » et « mène à » sont
ceux du contenu de la page (`<main>`), relevés sur le build du 06/10 ; s'y ajoutent partout l'en-tête (« menu » :
Matières, Inspirations, Réalisations, Comment ça marche, Pro, « Simuler ma pièce ») et le pied de page (« pied » :
Zones d'intervention, Contact, Espace client, pages légales).

### Les quatre familles d'intentions, et qui porte quoi

- **Locale** (prestations × zones) : « covering cuisine Montpellier », « rénovation cuisine sans travaux Hérault ».
  Les pages de prestation portent « <prestation> à Montpellier » ; les pages de ville portent « covering adhésif
  <ville> » toutes prestations confondues ; `/zones` porte l'Hérault et le Gard. **Montpellier n'a qu'un propriétaire
  par requête** : « covering cuisine Montpellier » → `/prestations/cuisine` ; « covering adhésif Montpellier » →
  `/zones/covering-montpellier`, qui renvoie à la prestation. L'accueil porte « rénover sa cuisine sans travaux »,
  sans ville dans le titre (la ville est dans la description et dans le texte).
- **Produit** (familles de matières) : « film adhésif effet marbre » → `/matieres/pierre` ; « adhésif cuisine
  imitation bois » → `/matieres/bois` ; « film adhésif uni / couleur » → `/matieres/couleur`, etc. Une fiche porte
  « <nom> <référence> » (la requête de quelqu'un qui a vu la référence), `/matieres` porte « film adhésif Cover
  Styl' » et le catalogue entier.
- **Informationnelle** (le blog) : une question par guide, jamais deux guides sur la même ; le comparatif à trois
  options reste distinct du face-à-face covering / peinture et du guide des prix (tableau du lot C7 plus bas).
- **Commerciale** (« prix covering cuisine », « avis ») : le prix → le guide des prix (titre « Prix d'un covering de
  cuisine au mètre linéaire ») et les blocs de prix des prestations ; « avis » → `/realisations`, **seulement quand
  le CRM publie des avis** (sans avis, le titre dit « Réalisations de covering à Montpellier » : on ne promet pas ce
  que la page ne montre pas) ; « comment ça marche / devis covering en ligne » → `/comment-ca-marche` et `/simulateur`.

Pas de bourrage : un mot-clé par title, aucune liste de villes ni de matières dans un title ; les `keywords` existants
restent (sans effet sur Google, lus par d'autres moteurs), sans ajout.

### La carte

| Page | Intention | Requête cible | H1 (inchangé) | Title (car.) | Description (car.) | Y mènent | Mène à |
|---|---|---|---|---|---|---|---|
| `/` | locale + marque | « rénovation cuisine sans travaux », « covering adhésif Montpellier », « CoverSwap » | Votre cuisine, transformée en une journée. | Rénover sa cuisine sans travaux, en une journée \| CoverSwap (59) | Covering adhésif à Montpellier : votre cuisine rénovée en une journée, sans travaux. 50 à 150 €/ml fourni et posé. Simulation gratuite sur votre photo. (151) | toutes les pages (logo), les 12 guides, familles, prestations, villes | simulateur, `/matieres`, fiches vedettes, `/inspirations`, `/pro`, `/zones` |
| `/simulateur` | commerciale (outil) | « simulateur covering cuisine », « devis covering en ligne » | Simulateur de covering sur votre photo | Simulateur de covering sur votre photo, gratuit \| CoverSwap (59) | Votre pièce avec une matière Cover Styl', sur votre photo, en <délai>. Puis un devis covering en ligne, gratuit et sans engagement, sous 48 h. (151) | menu, accueil, guides, familles, fiches, prestations, villes, `/zones`, `/realisations`, `/inspirations` | accueil (le reste est l'outil) |
| `/matieres` | produit | « film adhésif Cover Styl' », « revêtement adhésif meuble » | Choisissez votre matière | Films adhésifs Cover Styl' : 497 matières \| CoverSwap (53) | 497 films adhésifs Cover Styl' rangés par teinte : bois, marbre, béton, couleurs unies, métal. Chaque référence a sa fiche et s'essaie sur votre photo. (151) | menu, accueil, guides, familles, fiches, prestations, villes, `/contact` | les 7 familles, les fiches (présentoir) |
| `/matieres/bois` | produit | « adhésif cuisine imitation bois », « film adhésif bois » | Bois | Adhésif imitation bois : 267 références \| CoverSwap (51) | Chêne, noyer, frêne, pin : 267 films adhésifs bois Cover Styl' posés sur vos meubles. Où les poser, l'entretien, les limites, et l'essai sur votre photo. (153) | `/matieres`, les autres familles, ses fiches | ses fiches, 3 prestations, simulateur, contact, les autres familles |
| `/matieres/couleur` | produit | « film adhésif couleur unie », « adhésif mat cuisine » | Couleurs | Couleurs unies adhésives : 89 teintes \| CoverSwap (49) | 89 couleurs unies Cover Styl', du blanc au noir mat, du vert sauge au bleu nuit, posées sur vos façades et vos murs. Où, comment entretenir, les limites. (153) | idem | idem |
| `/matieres/pierre` | produit | « film adhésif effet marbre », « adhésif plan de travail marbre » | Pierres | Adhésif effet marbre et pierre : 36 références \| CoverSwap (58) | Marbres, travertin, granit, terrazzo : 36 films adhésifs Cover Styl' pour plan de travail, crédence, salle de bain. Où les poser, l'entretien, les limites. (155) | idem | idem |
| `/matieres/textile` | produit | « film adhésif effet tissu », « adhésif simili cuir » | Textiles | Textiles et cuirs adhésifs : 41 références \| CoverSwap (54) | Lin, tissage, chevrons, cuirs : 41 films adhésifs Cover Styl' à l'aspect textile pour vos meubles et vos murs. Où les poser, l'entretien, les limites. (150) | idem | ses fiches, meubles, `/pro`, simulateur, contact, familles |
| `/matieres/metal` | produit | « film adhésif effet métal », « adhésif aluminium brossé » | Métaux | Métaux adhésifs Cover Styl' : 31 références \| CoverSwap (55) | Aluminium brossé, or, cuivre, bronze, corten : 31 films adhésifs Cover Styl' pour meubles et commerces. Où les poser, l'entretien, les limites. (143) | idem | idem |
| `/matieres/beton` | produit | « film adhésif effet béton », « adhésif béton ciré » | Bétons et stucs | Bétons et stucs adhésifs : 17 références \| CoverSwap (52) | Béton brut, ciment, stuc, brique : 17 films adhésifs Cover Styl' pour cuisine, salle de bain et commerce. Où les poser, l'entretien, les limites. (145) | idem | ses fiches, 3 prestations, simulateur, contact, familles |
| `/matieres/paillettes` | produit | « film adhésif pailleté » | Paillettes | Films pailletés adhésifs : 16 références \| CoverSwap (52) | Or, argent, cuivre, rose, bleu nuit : 16 films pailletés Cover Styl' pour un bar, une niche ou une porte d'enfant. Où les poser, l'entretien, les limites. (154) | idem | ses fiches, meubles, `/pro`, simulateur, contact, familles |
| `/matieres/<famille>/<REF>` (52 indexées ; les 445 autres en `noindex, follow`) | produit, précise | « <nom> <référence> », « Cover Styl' <référence> » | le nom de la matière (« Deep Green ») | `titreFiche` : « Deep Green NF13 : film adhésif uni \| CoverSwap » (39 à 60) | `descriptionFiche` : nom, référence, genre, finition, ambiances, les deux actions (114 à 155) | sa famille, `/inspirations`, les prestations (vedettes), l'accueil (vedettes), ses voisines | sa famille, `/matieres`, simulateur, contact, 3 prestations, `/inspirations`, ses voisines |
| `/prestations/cuisine` | locale | « covering cuisine Montpellier », « rénover cuisine sans changer » | Rénover sa cuisine sans la casser | Covering cuisine à Montpellier, sans travaux \| CoverSwap (56) | Façades, plan de travail, crédence recouverts d'un film Cover Styl' en une journée. Prix au mètre linéaire, fourni et posé. Devis sous 48 h. (140) | 3 guides, familles, fiches, autres prestations, `/realisations`, les 8 villes | `/realisations`, simulateur, contact, vedettes, `/matieres`, 8 villes, autres prestations, `/pro` |
| `/prestations/salle-de-bain` | locale | « covering salle de bain Montpellier », « recouvrir carrelage salle de bain » | Une salle de bain rénovée, sans casse | Covering salle de bain à Montpellier, sans casse \| CoverSwap (60) | Meuble vasque, murs carrelés, baignoire recouverts d'un film Cover Styl' qui résiste à l'humidité. Prix au mètre linéaire, fourni et posé. Devis sous 48 h. (155 ; l'ancienne, 164, était coupée à 147) | familles, fiches, autres prestations, `/realisations`, les 8 villes | idem cuisine |
| `/prestations/meubles` | locale | « relooking meuble adhésif Montpellier », « covering meuble » | Un meuble relooké, sans poncer ni peindre | Covering meubles à Montpellier, sans poncer \| CoverSwap (55) | Commodes, buffets, dressings, meubles TV, têtes de lit recouverts d'un film Cover Styl'. Prix au mètre linéaire, fourni et posé. Devis sous 48 h. (145) | les 7 familles, fiches, autres prestations, `/realisations`, les 8 villes | idem cuisine |
| `/prestations/vitrages` | locale | « film vitrage Montpellier », « film dépoli fenêtre » | Habiller un vitrage, sans changer le verre | Film dépoli ou solaire pour vitrage, Montpellier \| CoverSwap (60) | Films dépolis, décoratifs et solaires posés sur vos vitrages : intimité sans perdre la lumière, chaleur réduite, verre inchangé. Devis sous 48 h. (145) | `/comment-ca-marche`, prestations, `/pro`, `/realisations`, villes | `/realisations`, contact, 8 villes, autres prestations, `/pro` |
| `/pro` | locale, professionnelle | « covering professionnel Montpellier », « covering comptoir restaurant » | Vos espaces professionnels, rénovés sans fermer. | Covering pour professionnels à Montpellier \| CoverSwap (54) | Comptoirs, mobilier, portes et murs de vos locaux recouverts d'un film Cover Styl', hors heures d'ouverture. Aussi pour les cuisinistes. Devis sous 48 h. (153) | menu, accueil, prestations, familles métal / textile / paillettes, villes, `/realisations` | vitrages, confidentialité (formulaire) |
| `/comment-ca-marche` | commerciale + informationnelle | « covering adhésif comment ça marche », « devis covering en ligne », « délai pose covering » | Comment ça marche | Comment ça marche : covering, devis et pose \| CoverSwap (55) | Une photo, une simulation en <délai>, un devis sous 48 h, une journée de pose. 50 à 150 €/ml fourni et posé, garantie 10 ans. Vos questions. (149) | menu, les 12 guides | simulateur, les 12 guides, contact, vitrages, accueil |
| `/inspirations` | informationnelle (idées) | « idées cuisine film adhésif », « inspiration covering » | Inspirations | Inspirations covering : cuisines, bains, meubles \| CoverSwap (60) | 52 pièces composées avec les vraies matières Cover Styl', chaque surface avec sa référence. Filtrez par pièce et par teinte, puis essayez chez vous. (148) | menu, accueil, fiches | fiches, simulateur, `/matieres`, accueil |
| `/realisations` | commerciale (preuve) | « avis covering Montpellier », « covering avant après » | Ce que ça donne | avec avis : Réalisations et avis : covering à Montpellier \| CoverSwap (57) ; sans : Réalisations de covering à Montpellier \| CoverSwap (50) | avec chantiers : … photos après chantier publiées avec l'accord des clients[, et leurs avis]. (≤ 151) ; sans : … des exemples en ambiance, étiquetés comme tels, et nos tarifs. (141) | menu, 4 prestations | simulateur, 4 prestations, `/pro`, contact, accueil |
| `/zones` | locale (département) | « covering Hérault », « rénovation cuisine sans travaux Hérault » | Zones d'intervention CoverSwap | Covering adhésif dans l'Hérault et le Gard \| CoverSwap (54) | On pose à Montpellier, Pérols, Lattes, Mauguio, Castelnau-le-Lez, Béziers, Nîmes et Sète : cuisine, salle de bain et meubles rénovés sans travaux. (146) | pied, accueil, les 8 villes | les 8 villes, simulateur, contact, accueil |
| `/zones/<ville>` (8) | locale (ville) | « covering adhésif <ville> », « rénovation cuisine sans travaux <ville> » | Covering adhésif à <ville> — Cuisine, salle de bain, meubles : rénovés en 1 journée | « Covering adhésif à <ville>, sans travaux \| CoverSwap » (49 à 56) ; Castelnau-le-Lez, trop long : « Covering adhésif à Castelnau-le-Lez \| CoverSwap » (47) | Covering adhésif à <ville> (<code postal>) : cuisine, salle de bain et meubles rénovés en une journée, sans travaux. Devis gratuit sous 48 h, 50 à 150 €/ml. (145 à 152 ; Castelnau-le-Lez sans « gratuit », 149) | `/zones`, les 4 prestations, les 7 autres villes | 4 prestations, `/pro`, `/matieres`, simulateur, contact, `/zones`, les autres villes |
| `/contact` | navigationnelle | « CoverSwap contact », « devis covering » | Écrivez-nous | Contact — Devis gratuit covering adhésif \| CoverSwap (52) | Contactez CoverSwap pour un devis gratuit de covering adhésif. Rénovation cuisine, salle de bain, meubles et locaux pro. Réponse sous 48 h. (139) | pied, familles, fiches, prestations, villes, `/zones`, `/realisations`, `/comment-ca-marche` | `/matieres`, confidentialité |

Les 12 guides (intention informationnelle, sauf mention ; « y mènent » : `/comment-ca-marche#guides` et les guides
voisins ; « mène à » : accueil, `/comment-ca-marche`, simulateur, `/matieres`, ses guides voisins, et
`/prestations/cuisine` pour les trois guides cuisine du lot C7) :

| Guide | Requête cible | H1 (inchangé) | Title (car.) | Description (car.) |
|---|---|---|---|---|
| `/blog/cuisine-bordeaux-brillante-renover-sans-changer` | « rénover cuisine bordeaux brillante » | Cuisine bordeaux brillante : la rénover sans la changer | Rénover une cuisine bordeaux brillante \| CoverSwap (50) | Façades bordeaux laquées, plan gris moucheté : ce qu'on garde, ce qu'on recouvre, deux directions possibles et comment se fait le prix. (135) |
| `/blog/cuisine-blanche-jaunie-que-faire` | « cuisine blanche jaunie que faire » | Cuisine blanche qui a jauni : que faire ? | Cuisine blanche qui a jauni : que faire ? \| CoverSwap (53) | Pourquoi le blanc jaunit, ce que le nettoyage peut faire, les signes qui comptent sur le meuble, et trois façons d'en sortir sans casser. (137) |
| `/blog/covering-peinture-remplacement-comparatif` (commerciale) | « covering ou peinture ou changer cuisine » | Covering, peinture ou remplacement : le vrai comparatif | Covering, peinture ou remplacement de cuisine \| CoverSwap (57) | Trois façons de changer une cuisine, comparées sur le délai, la poussière, la réversibilité et la durée. Et quand nous déconseillons le covering. (145) |
| `/blog/covering-adhesif-vs-peinture-cuisine` (commerciale) | « covering ou peinture cuisine » | Covering adhésif ou peinture : quel choix pour votre cuisine ? | Covering adhésif ou peinture en cuisine ? \| CoverSwap (53) | Deux façons de changer une cuisine sans la remplacer. Durée du chantier, tenue dans le temps, rendu, prix, réversibilité : la comparaison honnête. (146) |
| `/blog/prix-renovation-cuisine-covering` (commerciale) | « prix covering cuisine » | Combien coûte une rénovation de cuisine par covering ? | Prix d'un covering de cuisine au mètre linéaire \| CoverSwap (59) | Prix au mètre linéaire, nos tarifs publiés, ce qui fait varier le devis et ce qu'il contient. (93) |
| `/blog/comment-se-passe-une-pose-de-covering` | « pose covering déroulement » | Comment se passe une pose de covering, concrètement | Comment se passe une pose de covering \| CoverSwap (49) | De la première photo à la vérification finale : les étapes d'un chantier de covering, ce que vous préparez, ce que nous faisons, combien de temps ça prend. (155) |
| `/blog/covering-adhesif-durabilite` | « covering adhésif durée de vie » | Covering adhésif : combien de temps ça tient, et à quoi ça résiste ? | Covering adhésif : combien de temps ça tient ? \| CoverSwap (58) | Eau, chaleur, rayures, soleil : ce que supporte un film Cover Styl' posé dans les règles, ce qui l'abîme, et ce que couvre la garantie de 10 ans. (145) |
| `/blog/covering-salle-de-bain-carrelage` | « recouvrir carrelage salle de bain sans casser » | Recouvrir un carrelage de salle de bain sans le casser | Recouvrir un carrelage de salle de bain \| CoverSwap (51) | Ce qui se recouvre dans une salle de bain (murs carrelés, meuble vasque, tablier de baignoire), ce qui ne se recouvre pas, et la tenue à l'humidité. (148) |
| `/blog/quelle-finition-choisir` | « quelle finition film adhésif » | Quelle finition choisir : bois, pierre, béton, couleur unie ? | Quelle finition de film adhésif choisir ? \| CoverSwap (53) | Choisir parmi les familles du catalogue Cover Styl' selon la pièce, la lumière et l'usage, et pourquoi la teinte se valide toujours sur échantillon. (148) |
| `/blog/marbre-bois-beton-quel-covering` | « quel revêtement adhésif pour quelle pièce » | Quel revêtement pour quelle pièce ? | Quel revêtement adhésif pour quelle pièce ? \| CoverSwap (55) | Cuisine, salle de bain, chambre, bureau, local professionnel : les finitions qui conviennent à chaque usage, et celles à éviter. (128) |
| `/blog/entretenir-revetement-adhesif` | « entretien film adhésif cuisine » | Entretenir un revêtement adhésif : les bons gestes | Entretenir un revêtement adhésif \| CoverSwap (44) | Ce qu'il faut faire, et surtout ne pas faire, pour qu'un covering garde son aspect : produits, éponges, chaleur, chocs. (119) |
| `/blog/renovation-locataire-covering` | « rénover en location sans travaux » | Rénover en location : le covering, réversible et sans autorisation lourde | Rénover en location avec un film adhésif \| CoverSwap (52) | Pourquoi le film adhésif convient aux locataires et aux propriétaires bailleurs : retrait sans trace, pose en une journée, logement remis en l'état. (148) |

Hors carte, indexées sans requête visée : `/cgv`, `/mentions-legales`, `/politique-confidentialite` (titles de 28 à
41 caractères, descriptions ≤ 155, inchangés). Jamais indexées : `/e/<jeton>`, `/desinscription` (`noindex`), la 404.

### 300 mots utiles par page indexée

**Lot F6 : fait.** `src/app/mots.test.ts` rend chaque adresse du plan du site (les 95 pages indexées) comme Next et
échoue sous 300 mots (contenu de la page sans en-tête ni pied, scripts et styles retirés). Textes écrits pour les deux
pages qui manquaient : `/contact` **205 → 465 mots** (« Après votre message » : qui répond et quand, le devis, la
visite, rien n'engage avant la signature ; ce qu'il est utile de joindre ; où l'on pose, avec les liens des zones et de
« comment ça marche ») et `/matieres` **287 → 533 mots** (« Choisir sans se tromper » : ce qu'est un film Cover Styl',
choisir par la teinte puis la finition, pourquoi l'échantillon chez soi). Les plus courtes restent au-dessus du seuil :
guide « marbre, bois, béton » 341, `/simulateur` 352, guide « entretenir » 361, `/zones` 385.

Relevé du lot F1, gardé pour mémoire — mots comptés dans le `<main>` rendu (build du 06/10, scripts et styles retirés) :

- **`/contact` : 205 mots** — le formulaire seul ; il manque une introduction (qui répond, sous quel délai, ce qu'il
  faut joindre, la zone d'intervention, ce qui se passe après l'envoi).
- **`/matieres` : 287 mots** — le présentoir est fait d'échantillons ; il manque un court texte d'ouverture (comment
  choisir, ce qu'est un film Cover Styl', l'échantillon chez soi).
- Juste au-dessus du seuil, à surveiller : `/simulateur` (350 ; le texte est hors de l'outil), `/blog/marbre-bois-
  beton-quel-covering` (336), `/blog/entretenir-revetement-adhesif` (358), `/zones` (385).
- Toutes les autres pages indexées dépassent 300 mots : accueil 1 093, `/comment-ca-marche` 1 763, familles 554 à
  1 566, fiches indexées 414 à 706, prestations 524 à 1 367, villes 732 à 775, guides 336 à 853.

### Image de partage (lot F2)

- **Une seule source** : `imagePartage(chemin, reelle?)` (`src/lib/partage.ts`), appelée par défaut par
  `metadonneesPage` ; le gabarit (`layout.tsx`) et `LocalBusinessSchema` lisent `IMAGE_PARTAGE` (plus aucune adresse
  d'image écrite à la main).
- **L'avant / après de la page** : composé par `npm run og` (`scripts/og.mjs`, sharp, à partir des images préparées de
  la bibliothèque, aucun appel d'API) en 1 200 × 630, l'avant à gauche, l'après à droite, et le bandeau « Ambiance ·
  avant / après » ; un fichier par paire, `public/images/og/<après>.jpg`, partagé par les pages qui montrent la même.
  - accueil, `/simulateur`, `/realisations`, `/prestations/cuisine`, le guide « bordeaux » : la bordeaux brillante en
    Deep Green NF13 (l'ouverture de l'accueil) ;
  - salle de bain, meubles, `/pro` : la paire de leur ouverture ;
  - `/inspirations` : la première ambiance de la page qui a un avant ;
  - une famille : la première de ses ambiances qui a un avant ; une fiche : la première ambiance de « Vue dans » qui
    a un avant ; un guide : sa paire (`paire`) ;
  - les autres pages (vitrages, `/comment-ca-marche`, `/matieres`, `/zones`, villes, contact, pages légales, fiches
    sans ambiance à avant) : l'image du site (`og-image.jpg`).
- **Une réalisation publiée la remplace** là où elle est montrée en premier : accueil, prestation de sa pièce, `/pro`
  (l'ouverture), `/realisations` (la première), la fiche d'une matière qu'elle porte : sa photo « après » du CRM.
- Une image d'ambiance n'est jamais partagée sans son étiquette : seule l'image composée (bandeau compris) part.
- **Résultat (build du 06/10)** : 33 images composées (2,8 Mo, JPEG qualité 82) pour 57 pages : accueil,
  simulateur, réalisations, cuisine et le guide « bordeaux » partagent la même ; salle de bain, meubles, `/pro`,
  `/inspirations`, le guide « jaunie », bois, couleur, pierre et béton, et 43 des 52 fiches indexées ont la leur ;
  les autres pages gardent `og-image.jpg`. Composition : l'avant à gauche, l'après à droite (recadrés au centre,
  filet papier entre les deux), pastilles « Avant » / « Après », bandeau papier « Ambiance · avant / après » et
  « coverswap.fr » ; Segoe UI (les polices du site ne sont pas installées sur le poste). Relancer `npm run og` après
  un changement de la bibliothèque ou des ouvertures : `partage.test.ts` échoue tant qu'une image manque ou traîne.

### Un seul hôte (lot F3)

- Production au 06/10 (`curl -I`) : `coverswap.fr`, `www.coverswap.fr` et `coverswap.vercel.app` répondent tous 200 ;
  `ENTREPRISE.site` et tous les canonicals disent `https://coverswap.fr`. **L'hôte gardé est donc `coverswap.fr`,
  sans www.**
- `vercel.json` : `www.coverswap.fr` et l'hôte **exact** `coverswap.vercel.app` (jamais de joker : les
  prévisualisations `*.vercel.app` restent servies, Vercel les marque `noindex`) → `https://coverswap.fr/<chemin>`
  en **301**, la requête gardée. Les routes `/api/` en sont exclues : une 301 casserait un `POST` (relais, formulaires)
  ou une tâche planifiée appelée sur l'un de ces hôtes ; elles ne sont pas indexées (`robots.txt`).
- `next.config.ts` : les 7 redirections d'anciennes adresses passent de 308 à **301** (`statusCode: 301`).
- Canonical : posé par chaque page (`metadonneesPage`), absolu, sur `ENTREPRISE.site` ; le canonical par défaut du
  gabarit (qui donnait l'accueil à la 404 et aux pages privées) est retiré ; `metadataBase` lit `ENTREPRISE.site`
  (plus de `NEXT_PUBLIC_SITE_URL`).
- Plan du site : toutes les pages indexées, rien d'autre (95 adresses, contrôlé contre le build) ; `robots.txt` :
  tout ouvert sauf `/api/`, `/e/`, `/desinscription`, et l'adresse du plan.
- Sonde en ligne après la fusion : `node scripts/verifier-redirections.mjs` (anciennes adresses en 301, et les deux
  hôtes vers `coverswap.fr`).
- **Vérifié sur le build local (06/10)** : les 7 anciennes adresses en 301 (sonde `SITE=http://localhost:3100`, 8/8),
  la requête gardée ; les 540 pages construites ont leur canonical absolu exact ; la 404 n'en a plus ; 95 adresses au
  plan du site. Les règles d'hôte de `vercel.json` ne jouent que chez Vercel : **à sonder en ligne après la fusion
  (G3)** — d'ici là la production répond encore 200 sur les trois hôtes et 308 sur les anciennes adresses.
- **Barre finale (relecture des phases D, E, F, écart accepté)** : `/pro/`, `/matieres/`… répondent **308** vers
  l'adresse sans barre — c'est Next lui-même, avant toute règle. Le passer en 301 demanderait
  `skipTrailingSlashRedirect` et une règle à nous qui retire la barre sur toutes les routes, sans toucher `/api/` ni
  les fichiers : un risque de boucle ou de route cassée pour aucun gain, Google traitant 308 comme 301 (permanente,
  signal transmis). `www` + barre finale fait deux sauts (301 de Vercel, puis 308), sans conséquence (Google en suit
  jusqu'à dix). Ce qui compte est verrouillé par `src/app/relecture-def.test.ts` : ni `trailingSlash` ni
  `skipTrailingSlashRedirect` dans `next.config.ts`, aucune adresse du plan du site et aucun lien interne des pages
  rendues ne finit par « / » (hors l'accueil).

### Données structurées (lot F4)

Tout le balisage part de `src/components/JsonLd.tsx` (et de `lib/donnees-images.ts` pour les images), en JSON-LD :

- **Une seule entreprise locale** : `HomeAndConstructionBusiness` (`@id` `https://coverswap.fr/#entreprise`) et
  `Organization`, posés par le gabarit, sur toutes les pages ; aucune page n'en écrit une autre. Chaque `Service` y
  renvoie (`provider`).
- **Un `Service` par prestation** (cuisine, salle de bain, meubles, vitrages, `/pro`), plus celui de l'accueil et un
  par ville (`areaServed` : la ville) : `@id` (`<adresse de la page>#service`) et `image` (une référence `{ "@id" }`
  à l'`ImageObject` de l'ouverture) juste après `@type` ; vitrages n'a pas d'image.
- **`FAQPage`** : accueil, comment-ça-marche, simulateur, prestations, `/pro`, villes ; une seule par page.
- **`BreadcrumbList`** : posé par le fil d'Ariane visible lui-même (`Breadcrumb.tsx`, une seule liste pour les deux :
  mêmes noms, même ordre, la dernière adresse est la page ; une ancre reste au lien visible). Fil visible sur toutes
  les pages intérieures, désormais aussi `/contact`, les trois pages légales et `/simulateur` (sous l'outil, pour
  laisser le premier écran au simulateur) ; celui d'un guide finit par le titre du guide (`titreSeo`), plus « Guide ».
- **`ImageObject` par avant / après rendu** (accueil, prestations, `/pro`, `/inspirations`, `/realisations`, familles,
  guides à paire) : `@id` (l'image suivie de `#image`), `contentUrl` (le plus grand JPEG préparé, 1 536 px, 1 024 en
  portrait), `caption` (la légende affichée, ou le titre de la carte et ses matières), `description` (l'étiquette, puis
  le texte alternatif), et sur les images générées `creditText` « Image d'ambiance générée aux teintes du catalogue ».
  Une réalisation publiée (vraie photo de chantier) n'a pas de `creditText` : on ne sait pas qui l'a prise.
- **Textes alternatifs** : une ambiance dit sa scène (la pièce), chaque surface avec sa matière (nom et référence) et
  « Image d'ambiance aux teintes du catalogue » ; un « avant » dit la pièce d'origine ; une réalisation, « Après la
  pose — <titre>, <matières publiées> ». Seules restent muettes (`alt=""`) les images posées dans un lien qui a déjà
  son texte (rangée « Ambiances » de l'accueil, cartes des pièces) et les pictos.

Types par page (rendu du 06/10/2026, gabarit en plus : `HomeAndConstructionBusiness`, `Organization`) :

| Page | Types |
|---|---|
| `/` | `Service`, `FAQPage`, `ImageObject` × 8 |
| `/simulateur` | `HowTo`, `FAQPage`, `BreadcrumbList` |
| `/matieres`, familles sans avant / après, fiches | `BreadcrumbList` |
| familles avec avant / après (bois, couleur…) | `BreadcrumbList`, `ImageObject` × curseurs |
| `/prestations/cuisine`, `salle-de-bain`, `meubles` | `Service`, `FAQPage`, `HowTo`, `BreadcrumbList`, `ImageObject` × 11 / 3 / 5 |
| `/prestations/vitrages` | `Service`, `FAQPage`, `HowTo`, `BreadcrumbList` |
| `/pro` | `Service`, `FAQPage`, `HowTo`, `BreadcrumbList`, `ImageObject` × 3 (2 au lot F4, 3 depuis F5) |
| `/comment-ca-marche` | `FAQPage`, `BreadcrumbList` |
| `/inspirations` | `BreadcrumbList`, `ImageObject` × 41 |
| `/realisations` | `BreadcrumbList`, `ImageObject` × 4 (+ un par chantier publié avec avant) |
| `/zones` | `BreadcrumbList` ; une ville : `Service`, `FAQPage`, `BreadcrumbList` |
| `/contact`, pages légales | `BreadcrumbList` |
| guide | `Article`, `BreadcrumbList` (+ `ImageObject` × 2 pour un guide à paire) |

Vérifié sur le build (542 fichiers HTML) : JSON valide partout, une entreprise locale par page (sauf `_global-error`,
hors gabarit), un `BreadcrumbList` exactement là où un fil est visible, un `ImageObject` par curseur.
`src/app/donnees-structurees.test.ts` le tient sur les pages rendues.

### Maillage (lot F5)

Vérifié sur les pages rendues par `src/app/maillage.test.ts` :

- **Toute ambiance → ses matières et sa prestation** : chaque carte d'ambiance (accueil, prestations, `/pro`,
  `/inspirations`, `/realisations`, familles, guides) a un lien vers la fiche de chacune de ses matières et vers sa
  prestation (`prestationDeLaPiece` : cuisine, salle de bain, meubles, `/pro` ; les murs n'en ont pas depuis la
  relecture des phases D, E, F — « Covering meubles » sous un mur de chambre était faux), sauf sur la page de cette
  prestation. Les 52 ambiances d'inspiration y passent toutes.
- **Toute matière → ses ambiances et sa prestation** : les 497 fiches mènent à leur famille et aux prestations de
  `prestationsDeFamille` (celles sans ambiance comprises, 448) ; les 49 vues dans une ambiance mènent à chacune
  (`/inspirations#<id>`) et, sous chaque ambiance, à la prestation de celle-ci.
- **Toute prestation → trois avant / après, ses vedettes, ses villes** : cuisine 11, salle de bain 3, meubles 5,
  `/pro` 3 (le comptoir dans ses deux directions et le bar) ; leurs vedettes en échantillons vers leur fiche (`/pro` :
  « Les matières de ces lieux », huit) ; les 8 villes (`VillesIntervention`, aussi sur `/pro`). Vitrages : pas
  d'avant / après, mais ses villes.
- **Toute ville → ses prestations et ses réalisations** : les cinq prestations et le catalogue (déjà là), puis « Nos
  réalisations » : les chantiers publiés par le CRM dans la ville (trois au plus ; la page est relue toutes les cinq
  minutes), sinon une phrase qui renvoie aux photos de chantier et aux ambiances étiquetées ; toujours
  `/realisations`.

### Les guides du lot C7 (posés en avance, repris dans la carte ci-dessus)

| Guide | Intention | Requête visée | Ce qui le distingue de ses voisins |
|---|---|---|---|
| `/blog/cuisine-bordeaux-brillante-renover-sans-changer` | informationnelle, cas précis | « rénover cuisine bordeaux brillante », « cuisine rouge laquée relooker » | une cuisine datée mais saine : ce qu'on garde, deux directions en curseur, le mat contre le brillant |
| `/blog/cuisine-blanche-jaunie-que-faire` | informationnelle, problème | « cuisine blanche jaunie que faire », « meuble cuisine blanc jauni » | le diagnostic (graisse ou surface, chant, panneau gonflé) avant la solution ; renvoie à « Quand rénover ? » |
| `/blog/covering-peinture-remplacement-comparatif` | commerciale, choix entre trois options | « covering ou peinture ou changer cuisine », « rénover ou remplacer cuisine » | trois options sur quatre critères (délai, poussière, réversibilité, durée) et quand ne pas choisir le covering ; pas de chiffre pour la peinture ni le remplacement |
| `/blog/covering-adhesif-vs-peinture-cuisine` (voisin) | commerciale, deux options | « covering ou peinture cuisine » | le face-à-face détaillé film contre peinture (rendu, tenue) ; lié au comparatif dans les deux sens |
| `/blog/prix-renovation-cuisine-covering` (voisin) | commerciale, prix | « prix covering cuisine » | la lecture d'un devis de covering ; lié au comparatif dans les deux sens |

Les trois guides mènent à `/prestations/cuisine`, au simulateur (`depuis=blog`) et entre eux ; ils sont listés à
`/comment-ca-marche#guides`, au plan du site et dans `llms.txt`. Balisage `Article` sur leur image de la bibliothèque
(`/images/prep/<nom>-1536.jpg`).

## Lighthouse avant (lot B0, 05/10/2026)

Mesure : Lighthouse 12.6.1 en ligne de commande, réglage mobile par défaut (le même que la CI : écran de 412 × 823,
réseau et processeur ralentis par simulation), Chrome 153 sans interface, sur le poste de Lucas. **Trois passages par
page, on garde le meilleur** (performance la plus haute, puis LCP le plus court) ; la dernière colonne donne la
performance des trois passages, du meilleur au moins bon. Les envois d'événements (`/api/site/evenements`) sont
bloqués pendant la mesure : aucune fausse visite n'arrive au CRM.

Les 8 adresses : les 6 de la CI (`lighthouserc.json`), plus `/prestations/cuisine` et `/matieres?ref=NF13`.

### coverswap.fr (production actuelle, `main` a7dd5a6)

| Page | Adresse | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Performance des 3 passages |
|---|---|---|---|---|---|---|---|---|---|
| accueil | `/` | 87 | 100 | 100 | 100 | 3,7 s | 0,000 | 168 ms | 87 / 86 / 85 |
| simulateur | `/simulateur` | 85 | 100 | 100 | 100 | 3,9 s | 0,000 | 206 ms | 85 / 80 / 78 |
| matieres | `/matieres` | 93 | 100 | 100 | 100 | 3,1 s | 0,000 | 81 ms | 93 / 92 / 91 |
| realisations | `/realisations` | 88 | 100 | 100 | 100 | 3,8 s | 0,000 | 123 ms | 88 / 83 / 83 |
| comment-ca-marche | `/comment-ca-marche` | 97 | 100 | 100 | 100 | 2,5 s | 0,000 | 94 ms | 97 / 97 / 97 |
| pro | `/pro` | 96 | 100 | 100 | 100 | 2,7 s | 0,000 | 64 ms | 96 / 84 / 84 |
| prestation-cuisine | `/prestations/cuisine` | 90 | 100 | 100 | 100 | 3,4 s | 0,000 | 157 ms | 90 / 88 / 87 |
| matieres-nf13 | `/matieres?ref=NF13` | 91 | 100 | 100 | 100 | 3,3 s | 0,000 | 105 ms | 91 / 84 / 83 |

### Build local de la branche `site-3-0` avant tout changement d'affichage (`next start -p 3100`)

Construit comme la CI : `NEXT_PUBLIC_SIMULATE_URL=https://crm.coverswap.fr/api/simulate` (le site lit les routes
publiques du CRM : tarifs, vignettes des matières) et `NEXT_PUBLIC_SANS_EVENEMENTS=1`.

| Page | Adresse | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Performance des 3 passages |
|---|---|---|---|---|---|---|---|---|---|
| accueil | `/` | 89 | 100 | 100 | 100 | 3,6 s | 0,000 | 127 ms | 89 / 88 / 87 |
| simulateur | `/simulateur` | 89 | 100 | 100 | 100 | 3,4 s | 0,000 | 173 ms | 89 / 89 / 89 |
| matieres | `/matieres` | 94 | 100 | 100 | 100 | 2,9 s | 0,000 | 93 ms | 94 / 94 / 93 |
| realisations | `/realisations` | 87 | 100 | 100 | 100 | 4,0 s | 0,000 | 103 ms | 87 / 86 / 86 |
| comment-ca-marche | `/comment-ca-marche` | 95 | 100 | 100 | 100 | 2,8 s | 0,000 | 94 ms | 95 / 95 / 91 |
| pro | `/pro` | 91 | 100 | 100 | 100 | 3,5 s | 0,000 | 104 ms | 91 / 85 / 85 |
| prestation-cuisine | `/prestations/cuisine` | 90 | 100 | 100 | 100 | 3,3 s | 0,000 | 168 ms | 90 / 90 / 89 |
| matieres-nf13 | `/matieres?ref=NF13` | 85 | 100 | 100 | 100 | 3,7 s | 0,000 | 222 ms | 85 / 84 / 83 |

### À retenir

- **CLS 0, accessibilité 100, SEO 100 partout**, en ligne comme en local ; bonnes pratiques 100 partout.
- **Le LCP est le point faible** : 2,5 à 3,9 s en ligne, 2,8 à 4,0 s en local ; seule `/comment-ca-marche` en ligne
  atteint l'objectif de 2,5 s. Les pages à photo d'ouverture (accueil, simulateur, réalisations, prestation cuisine)
  sont entre 3,3 et 4,0 s : c'est là que le site 3.0 doit gagner (couple d'ouverture, polices, AVIF).
- **Performance 85 à 97** en ligne (moyenne 91), 85 à 95 en local (moyenne 90) : toutes au-dessus du plancher de la
  CI (85), quatre pages sur huit sous l'objectif de 90 dans l'une ou l'autre mesure (accueil, simulateur, réalisations,
  `/matieres?ref=NF13`).
- **Écart entre passages** : jusqu'à 12 points sur une même page (`/pro` en ligne : 96, 84, 84) ; d'où le meilleur
  de trois. Comparer « avant » et « après » avec la même méthode, sur le même poste.
- **Piège de mesure** : un premier passage local, construit sans `NEXT_PUBLIC_SIMULATE_URL`, donnait bonnes pratiques
  96 sur sept pages : `baseCrm()` rend `""`, les vignettes des matières sont demandées à `localhost` et répondent 404
  (erreurs de console). Toujours construire comme la CI pour mesurer (c'est aussi le point de B7 sur la
  prévisualisation).

## Lighthouse après

### Lot F6 (06/10/2026) — build local de `site-3-0`, même méthode que B0

Lighthouse 12.6.1, réglage mobile par défaut (simulation « Lantern »), Chrome 153 sans interface, build construit comme
la CI (`NEXT_PUBLIC_SIMULATE_URL` = CRM de production, `NEXT_PUBLIC_SANS_EVENEMENTS=1`), `next start -p 3100`, trois
passages par page, le meilleur gardé. Les 8 pages de la CI (lot F6 : `lighthouserc.json` et les captures passent de
6 à 8 avec `/prestations/cuisine` et la fiche `/matieres/couleur/NF13`), plus `/matieres?ref=NF13` (comparaison avec
B0), `/inspirations` et `/contact`. `/simulateur` mesuré sur le dernier build du lot (titre de l'écran Pièce), les
autres sur l'avant-dernier (seule différence : deux hauteurs réservées sur cet écran).

| Page | Adresse | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Performance des 3 passages |
|---|---|---|---|---|---|---|---|---|---|
| accueil | `/` | 82 | 100 | 100 | 100 | 4,8 s | 0,000 | 108 ms | 82 / 82 / 81 |
| simulateur | `/simulateur` | 88 | 100 | 100 | 100 | 3,8 s | 0,000 | 109 ms | 88 / 87 / 85 |
| matieres | `/matieres` | 84 | 100 | 100 | 100 | 3,8 s | 0,000 | 199 ms | 84 / 84 / 83 |
| realisations | `/realisations` | 89 | 100 | 100 | 100 | 3,7 s | 0,000 | 99 ms | 89 / 85 / 84 |
| comment-ca-marche | `/comment-ca-marche` | 91 | 100 | 100 | 100 | 3,5 s | 0,000 | 91 ms | 91 / 90 / 87 |
| pro | `/pro` | 83 | 100 | 100 | 100 | 4,5 s | 0,000 | 91 ms | 83 / 80 / 79 |
| prestation-cuisine | `/prestations/cuisine` | 78 | 100 | 100 | 100 | 5,2 s | 0,000 | 161 ms | 78 / 78 / 78 |
| matieres-nf13 | `/matieres?ref=NF13` | 80 | 100 | 100 | 100 | 4,0 s | 0,000 | 231 ms | 80 / 79 / 79 |
| fiche-nf13 | `/matieres/couleur/NF13` | 91 | 100 | 100 | 100 | 3,2 s | 0,000 | 170 ms | 91 / 88 / 84 |
| inspirations | `/inspirations` | 77 | 100 | 100 | 100 | 4,6 s | 0,000 | 172 ms | 77 / 76 / 76 |
| contact | `/contact` | 89 | 100 | 100 | 100 | 3,3 s | 0,000 | 187 ms | 89 / 89 / 88 |

**Avant / après**, performance · accessibilité · SEO · LCP (bonnes pratiques à 100 partout) — B0 : le site d'avant le
3.0, sur le même poste ; F5 : la branche au début du lot (même mesure, mêmes pages) ; F6 : après le lot.

| Page | B0 (avant le site 3.0) | F5 (début du lot F6) | F6 (après) |
|---|---|---|---|
| `/` | 89 · 100 · 100 · 3,6 s | 81 · 100 · 100 · 4,8 s | 82 · 100 · 100 · 4,8 s |
| `/simulateur` | 89 · 100 · 100 · 3,4 s | 85 · 100 · 100 · 4,1 s | 88 · 100 · 100 · 3,8 s |
| `/matieres` | 94 · 100 · 100 · 2,9 s | 82 · 100 · 100 · 4,1 s | 84 · 100 · 100 · 3,8 s |
| `/realisations` | 87 · 100 · 100 · 4,0 s | 88 · 100 · 100 · 3,8 s | 89 · 100 · 100 · 3,7 s |
| `/comment-ca-marche` | 95 · 100 · 100 · 2,8 s | 90 · 100 · 100 · 3,5 s | 91 · 100 · 100 · 3,5 s |
| `/pro` | 91 · 100 · 100 · 3,5 s | 87 · 100 · 100 · 4,0 s | 83 · 100 · 100 · 4,5 s |
| `/prestations/cuisine` | 90 · 100 · 100 · 3,3 s | 85 · 100 · 100 · 4,0 s | 78 · 100 · 100 · 5,2 s |
| `/matieres?ref=NF13` | 85 · 100 · 100 · 3,7 s | 79 · 100 · 100 · 4,2 s | 80 · 100 · 100 · 4,0 s |
| `/matieres/couleur/NF13` | — | 92 · 100 · 100 · 3,2 s | 91 · 100 · 100 · 3,2 s |
| `/inspirations` | — | 78 · 100 · 100 · 4,7 s | 77 · 100 · 100 · 4,6 s |
| `/contact` | — | 88 · 96 · 100 · 3,1 s | 89 · 100 · 100 · 3,3 s |

**Sous ralentissement réel** (complément, pas la méthode de B0 : `--throttling-method=devtools`, le réseau et le
processeur sont vraiment ralentis pendant le chargement, le LCP est celui qui s'affiche ; 2 passages, le meilleur) :

| Page | Adresse | Performance | LCP | FCP | CLS | TBT |
|---|---|---|---|---|---|---|
| accueil | `/` | 77 | 3,3 s | 3,2 s | 0,000 | 396 ms |
| simulateur | `/simulateur` | 79 | 3,1 s | 3,1 s | 0,006 | 389 ms |
| matieres | `/matieres` | 81 | 3,3 s | 3,3 s | 0,000 | 261 ms |
| realisations | `/realisations` | 81 | 3,0 s | 3,1 s | 0,000 | 332 ms |
| comment-ca-marche | `/comment-ca-marche` | 84 | 2,9 s | 2,8 s | 0,000 | 294 ms |
| pro | `/pro` | 79 | 3,3 s | 3,2 s | 0,000 | 310 ms |
| prestation-cuisine | `/prestations/cuisine` | 74 | 3,5 s | 3,3 s | 0,000 | 421 ms |
| fiche-nf13 | `/matieres/couleur/NF13` | 86 | 2,9 s | 2,9 s | 0,000 | 233 ms |

### À retenir (lot F6)

- **Accessibilité 100, SEO 100, bonnes pratiques 100 sur les 11 pages** ; `/contact` remonte de 96 à 100 (un champ
  piège atteignable au clavier sous `aria-hidden`). **CLS 0** partout en simulation ; sous ralentissement réel,
  0,027 sur le simulateur (le titre de l'écran Pièce passait d'une à deux lignes à l'arrivée de Playfair à 412 px) →
  0,006 après réservation de la hauteur.
- **Performance ≥ 90 et LCP ≤ 2,5 s : non atteints.** Performance 77 à 91 (F5 : 78 à 92), LCP simulé 3,2 à 5,2 s.
  Sous ralentissement réel, le LCP est de 2,9 à 3,5 s et il est égal au premier affichage (FCP) : l'image d'ouverture
  arrive à temps, c'est l'aller-retour du document, de la feuille de style et des polices qui coûte.
- **Ce qui pèse sur le LCP simulé, mesuré** (accueil) : sans aucun JavaScript, le LCP simulé tombe de 4,8 à 2,6 s ;
  sans les polices, à 4,6 s ; sans les six curseurs de « Cuisines comme la vôtre », à 4,6 s ; sans les pictos, rien.
  La simulation compte tout le JavaScript chargé avant l'affichage observé (le cadre de Next et React, ~116 Ko
  compressés, plus ~45 Ko de composants) ; le navigateur, lui, affiche l'image avant d'exécuter ce JavaScript
  (sonde Edge, processeur ralenti 4 fois : premier affichage et LCP à 0,77 s, avec ou sans JavaScript). Descendre sous
  2,5 s en simulation demanderait de retirer l'hydratation des pages — hors du périmètre du site 3.0.
- **Écart de mesure** : jusqu'à 12 points entre deux passages d'une même page (prestation cuisine : 85 / 74 / 73 au
  début du lot, 78 / 78 / 78 à la fin). `/pro` et la prestation cuisine paraissent reculer ; leurs passages médians
  n'ont pas bougé (74 → 78, 76 → 80).
- **Ce qui a été fait** : l'image de l'accueil n'est plus téléchargée sur les autres pages (préchargement hors charge
  RSC, `Prechargements`) — ni l'« avant » des prestations et de `/pro`, ni l'échantillon d'une fiche dès qu'un lien y
  mène ; l'italique de Playfair (38 Ko) n'est plus préchargée ; une seule série AVIF et le JPEG de repli par image
  (plus de WebP) ; HTML : accueil 320 → 288 Ko, `/inspirations` 854 → 739 Ko (56 Ko compressés).
- **Essayé et écarté** : la feuille de style écrite dans la page (`experimental.inlineCss`) — le HTML de l'accueil
  passe de 288 à 516 Ko (la feuille est aussi recopiée dans la charge RSC), performance simulée 82 → 77 ; et
  `?l=640` au CRM pour la fiche : l'échantillon entier fait 595 px de large, une version à 640 px n'existe pas, et le
  LCP de la fiche (3,2 s simulé, 2,9 s réel) est celui de la page, pas de l'image (4 Ko pour NF13). Le CRM n'est pas
  touché.
- **`/inspirations`** : 739 Ko de HTML (52 cartes, chacune avec son curseur, ses cartels et son `ImageObject` ; la
  moitié est la charge RSC qui double le HTML). Pour aller plus loin, il faudrait alléger les 40 cartes de « Voir toutes
  les ambiances » (par exemple l'après seul jusqu'au clic) : un choix d'interface, laissé à Lucas.

### Lot G3 (coverswap.fr, après la fusion)

À remplir, avec la même méthode.
