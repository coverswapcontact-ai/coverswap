# Direction artistique du site — site 3.0, « La Revue »

Mission 21, lots B1 (jetons, polices, grain, contrastes), B2 (le rouge réservé aux actions), B3 (les teintes des
prestations, les règles, les composants de base, ce qu'on a jeté de la maquette), B5 (le gabarit) et B6 (l'accueil).

Le site est un artisan qui montre ce qu'il fait et donne envie d'essayer, pas un magazine : la maquette
(`maquette-11-la-revue.html`) donne la grammaire (titres serif très grands, filets fins, grands numéros, cartels de
matière, blocs papier et encre), pas un gabarit à recopier.

Plan : [Jetons et contrastes](#jetons-et-contrastes) · [Les règles](#les-règles) · [Le rouge
réservé aux actions](#le-rouge-réservé-aux-actions) · [Les composants de base](#les-composants-de-base) · [Ce qu'on a
jeté de la maquette](#ce-quon-a-jeté-de-la-maquette).

## Jetons et contrastes

### Une seule source

Les jetons vivent dans le bloc `@theme` de `src/app/globals.css`, et nulle part ailleurs :

- les composants passent par les classes Tailwind (`bg-fond`, `text-encre-2`, `border-trait`…) ou, dans un SVG du
  DOM, par `currentColor` ou `var(--color-*)` ; jamais une valeur hexadécimale ;
- les scripts qui écrivent des images (`scripts/generate-assets.mjs`, `scripts/preparer-images.mjs`, et ceux des
  lots suivants) lisent ce même bloc par `lireJetons()` de `scripts/jetons.mjs`, qui exporte aussi `contraste()` ;
- pas de `jetons.ts`, pas de `tailwind.config` : `theme.test.ts` y veille.

Exceptions connues, à résorber : l'espace client (`src/components/espace/`) écrit encore ses couleurs en dur (table
de correspondance et remplacement au lot C6) ; les dessins au trait d'`espace/Illustrations.tsx` et
d'`EcranPhoto.tsx` aussi (lots C6 et E2). `--color-google` garde le gris imposé par Google pour la mention « Google
Maps ».

### Les couleurs

| Jeton | Valeur | Rôle |
|---|---|---|
| `fond` | `#F4EDE2` | le papier : fond de page, avec le grain ; aussi la couleur de la barre du navigateur (`themeColor`) |
| `fond-2` | `#EBE2D4` | le papier foncé : cadres des photos, bandeaux ; **jamais de grain** |
| `encre` | `#1B1613` | le texte ; les blocs encre (dernier appel, pied de page, à partir de B5) |
| `encre-2` | `#6E5F52` | le gris chaud : texte secondaire sur papier ou fond-2, **jamais sur l'encre** |
| `trait` | `#D9CDBD` | filets et bordures par défaut ; jamais du texte (1,35:1) |
| `accent` | `#B3261E` | le rouge CoverSwap, celui du logo : **les actions seulement** (boutons principaux, lien « Simuler », pastille « 497 matières ») et la marque |
| `accent-survol` | `#8F1E18` | le rouge au survol et à l'appui |
| `sur-encre-2` | `#A99C8E` | le texte secondaire posé sur l'encre |
| `alerte-fond`, `alerte-texte` | `#F3E1CC`, `#7A3A14` | erreurs et avertissements : brun, pas rouge (ils ont remplacé `accent-fond` et `accent-texte` au lot B2) |
| `succes`, `succes-fond` | `#2E6741`, `#E1EAD8` | une confirmation (ex-`ok-texte`, `ok-fond`) |
| `encre-survol` | `#3B322B` | l'encre au survol des boutons encre |
| `sombre` | `#120E0C` | les feuilles sombres et le plein écran |
| `blanc` | `#FFFFFF` | le texte posé sur le rouge ; les cartes |

Les deux anciens jetons `accent-fond` (`#FBE9E7`) et `accent-texte` (`#8F1D12`) ont disparu au lot B2 (voir « Le rouge
réservé aux actions »).

### Contrastes mesurés

Rapport WCAG 2.x, calculé par `contraste()` de `scripts/jetons.mjs` et vérifié par `src/app/theme.test.ts` (un
changement de jeton qui fait passer un couple sous 4,5:1 fait échouer les tests). Seuil : 4,5:1 pour le texte courant.

| Texte | Fond | Rapport | Verdict |
|---|---|---|---|
| encre | papier | 15,42 | partout |
| encre | fond-2 | 13,98 | partout |
| **gris chaud (encre-2)** | **papier** | **5,28** | permis |
| **gris chaud (encre-2)** | **fond-2** | **4,78** | permis |
| gris chaud (encre-2) | encre | 2,92 | **interdit** : sur l'encre, `sur-encre-2` |
| sur-encre-2 | encre | 6,69 | permis |
| papier | encre | 15,42 | permis |
| rouge (accent) | papier | 5,62 | permis (lien « Simuler ») |
| rouge (accent) | fond-2 | 5,09 | permis |
| blanc | rouge | 6,54 | le bouton principal |
| blanc | rouge au survol | 8,87 | le bouton principal survolé |
| alerte-texte | alerte-fond | 6,74 | permis |
| alerte-texte | papier | 7,39 | permis |
| succes | succes-fond | 5,41 | permis |
| succes | papier | 5,76 | permis |
| gris Google | papier | 5,58 | permis |
| trait | papier | 1,35 | jamais du texte |

**Sous le grain.** Le grain assombrit le papier de 3 % en moyenne. Mesure faite deux fois et concordante : la tuile
rendue par sharp et composée au papier, puis une capture d'Edge à 390 px (échelle 2) d'une zone de papier granulé
sans texte (25 200 pixels) :

| Papier granulé | Couleur | encre-2 | rouge | encre |
|---|---|---|---|---|
| moyenne | `#EFE8DD` | 5,04 | 5,37 | 14,74 |
| 5ᵉ centile (les grains sombres) | `#EBE5DA` | 4,90 | 5,21 | 14,31 |
| pixel le plus sombre | `#E7E0D6` | 4,69 | 4,99 | 13,69 |

Le gris chaud reste au-dessus de 4,5:1 même sur le grain le plus sombre. Sur fond-2, le même grain le ferait tomber
à 4,25 au pire : c'est pourquoi fond-2 n'en porte jamais.

### Les teintes des prestations

Lot B3, `src/lib/teintes-prestations.ts`. Le site est coloré par les matières, pas par l'interface : chaque
prestation prend une vraie référence du catalogue, qui colore le cartel, les filets et les bandes de sa page **et de
ses cartes** (pictos de l'accueil, cartes des zones, « autres prestations »). Le bloc qui la porte pose
`styleTeinte(…)` (`--teinte`, et `--teinte-2` pour le pro) ; `.filet`, le cartel et le grand numéro la lisent.

| Prestation | Teinte | Hex | papier | papier granulé | fond-2 | encre | Texte en teinte |
|---|---|---|---|---|---|---|---|
| cuisine | Sage Green RM20 | `#616A57` | 4,87 | 4,52 | 4,41 | 3,17 | **sur le papier** |
| salle de bain | Steel Blue M6 | `#666A75` | 4,65 | 4,31 | 4,21 | 3,32 | jamais |
| meubles | Terracotta Stucco NH12 | `#AF9584` | 2,42 | 2,25 | 2,19 | 6,37 | **sur l'encre** |
| portes et placards | Deep Green NF13 | `#23342E` | 11,27 | 10,46 | 10,21 | 1,37 | papier et fond-2 |
| murs | Lombarda Grigio NF99 | `#A59A8E` | 2,37 | 2,20 | 2,15 | 6,50 | **sur l'encre** |
| professionnel | Black Mat K1 | `#232220` | 13,67 | 12,68 | 12,38 | 1,13 | papier et fond-2 |
| professionnel (seconde) | Classic Walnut D1 | `#654835` | 7,13 | 6,62 | 6,46 | 2,16 | papier et fond-2 |
| vitrages | aucune | | | | | | |

- **Texte en teinte seulement à 4,5:1** (`texteAutorise`, testé) ; sur le papier, le rapport retenu est le pire du
  papier uni et du papier granulé (5ᵉ centile, `#EBE5DA`). Ailleurs, la teinte ne fait que les filets, les cartels et
  les bandes, et le texte reste à l'encre (au papier sur l'encre) : `classeTexteTeinte(teinte, fond)` choisit.
- Steel Blue M6 passe 4,5:1 sur le papier uni (4,65) mais pas sous le grain (4,31) : la salle de bain n'écrit jamais
  en teinte. Sur fond-2, ni la cuisine (4,41) ni la salle de bain (4,21) n'écrivent.
- Les valeurs du catalogue et les rapports sont recopiés dans le fichier (un composant client ne doit pas tirer les
  497 matières) et vérifiés par `components/revue/revue.test.ts` contre `data/revetements.json` et les jetons.
- `teintePrestation(id)` accepte le slug de page, la pièce du simulateur (`mur-plafond`) et les éléments portes et
  placards (`placard`, `porte-entree`…) ; rend `null` pour les vitrages.

### Les polices

- **Playfair Display** pour les titres (`--font-display`, classes `titre-0`, `titre-1`, `titre-2`, `grand-numero`,
  `font-display`) : police variable 400 à 900, droite et italique. 400 pour un titre posé, 600 pour les titres de
  page et de section, 900 pour le grand titre d'ouverture et les grands numéros, l'italique pour un mot qui porte.
- **Libre Franklin** pour le texte (`--font-sans`, la police du corps de page).
- Chargées par `next/font/google` dans `src/app/layout.tsx` : téléchargées au build et servies par le site (aucun
  appel à Google Fonts depuis le navigateur), `display: swap`, préchargées, avec une police de repli ajustée
  (`adjustFontFallback`, par défaut) contre le décalage au chargement. Sous-ensemble latin préchargé : 3 fichiers
  (Playfair droit 38 Ko, Playfair italique 39 Ko, Libre Franklin 29 Ko).

### Les tailles

| Variable | Téléphone | À partir de 768 px | Usage |
|---|---|---|---|
| `--titre-0` | 44 px | 96 px | le grand titre posé sur une photo d'ouverture (`.titre-0`, Playfair 900) |
| `--titre-1` | 34 px | 48 px | le h1 d'une page (`.titre-1`) |
| `--titre-2` | 26 px | 32 px | les h2 de section (`.titre-2`) |
| `--texte` | 17 px | 17 px | le corps (`.texte`) |
| `--texte-2` | 15 px | 15 px | le secondaire (`.texte-2`, en gris chaud) |
| `--surtitre` | 13 px | 13 px | les capitales (`.surtitre`) |

Et trois classes de la grammaire éditoriale :

- `.grand-numero` : Playfair 900, 64 px, chiffres alignés ; encre ou teinte de la prestation, **jamais rouge** ;
- `.filet` : un filet de 1 px, à la teinte de la page (`--teinte`) ou à l'encre ;
- `.cartel` : les petites capitales espacées du cartel d'une matière (« Couleur · RM20 »), 12 px.

### Le grain du papier

- Un SVG `feTurbulence` (bruit fractal, fréquence 0,7, 3 octaves, raccords cousus), désaturé, d'opacité **0,16**
  (plafond 0,18), en tuile de 160 × 160 px, dans la variable `--grain` ; multiplié au papier
  (`background-blend-mode: multiply`).
- Posé sur **`body`** et sur la classe **`.papier`**, nulle part ailleurs. Il est derrière tout : une photo, un
  cadre `fond-2`, un bloc encre le recouvrent. Jamais `.papier` avec `bg-fond-2`, `bg-encre`, `bg-sombre`,
  `bg-accent` ou `bg-blanc` sur le même élément (testé).
- Les pages d'aujourd'hui posent encore `bg-fond` (papier uni) sur leur enveloppe : le grain n'y apparaît qu'avec le
  gabarit (B5) et les pages refaites (B6, phase C), qui prennent `.papier`.

### Le focus

Contour de 3 px à l'encre, décalé de 2 px, sur tout ce qui se focalise ; au papier dans un bloc `.ton-encre`, où
l'encre serait invisible.

### Le logo

`src/components/Logo.tsx` (composant serveur) : le losange rouge et son « C », « Cover » à l'encre, « Swap » au
rouge, en Playfair 900. `espace/Illustrations.tsx` le réexporte pour l'espace client. Les fichiers `public/logo.png`
et `public/og-image.jpg` n'ont pas été refaits au lot B1 (rouge et polices d'avant) : l'image de partage est
recomposée au lot F2.

## Les règles

1. **Le rouge pour les actions, et rien d'autre** : boutons principaux, lien « Simuler », pastille « 497 matières »
   (et la marque). Ni titre, ni numéro, ni surtitre, ni sélection, ni erreur (section suivante).
2. **Les fonds d'interface restent papier et encre.** Les blocs alternent papier clair, papier foncé et encre ;
   la couleur vient des photos en pleine largeur, des bandes de matière et des teintes des prestations.
3. **Le grain sur le papier seulement** : `body` et `.papier`. Jamais sur fond-2 (cadres des photos), l'encre, une
   photo, une bande de matière.
4. **Les teintes sur les filets, les cartels et les bandes.** Du texte en teinte seulement là où il tient 4,5:1
   (tableau plus haut).
5. **Toute image générée porte son étiquette** (« Ambiance », « Ambiance · avant / après ») ; « Simulation » pour les
   rendus du simulateur seulement ; « Réalisation » pour les vrais chantiers, qui passent toujours en premier.
6. **Téléphone d'abord** : chaque écran est pensé à 390 px avant 1 440 px, rien ne déborde à 360 px ; cibles
   tactiles de 44 px au moins.
7. **Le ton est direct et concret**, à la première personne du pluriel (« on pose en une journée », « on vient avec
   les échantillons »), sans jargon de décorateur (« écrin », « esprit », « signature », « tendance de la saison »),
   sans rien de « faux magazine » (dernière section ; `src/app/ton.test.ts` y veille).
8. **Les places sont réservées** : toute image, tout curseur, toute bande a sa hauteur avant de charger (aucun
   décalage de mise en page).

## Le rouge réservé aux actions

Lot B2. Le rouge CoverSwap (`accent`, `#B3261E`) sert à convertir, et à rien d'autre. Les fonds d'interface restent
papier et encre.

### Où il apparaît

- **Le bouton principal** : `classesBouton("principal")` de `src/components/simulation/Bouton.tsx`, partagé par
  `Bouton` (`<button>`) et `Lien` (`<a>`). Fond rouge, texte blanc (6,54:1), `accent-survol` (`#8F1E18`, 8,87:1) au
  survol et à l'appui ; désactivé, il passe au trait avec sa raison écrite dessous. **Un seul par écran** (testé sur
  les écrans du tunnel). Ses teintes seules (`TEINTE_PRINCIPALE`) habillent un libellé-bouton qui a sa propre forme :
  « Prendre une photo » de l'écran Photo du simulateur, qui repasse au contour quand « Garder cette photo » devient
  l'action principale.
- **Le lien « Simuler ma pièce »** de l'en-tête (`EnteteSite.tsx`, lot B5) : texte rouge en gras sur le papier
  (5,62:1) avec sa flèche dès 640 px, plus sombre et souligné au survol. Un lien, pas un bouton : le bouton principal
  reste celui de la page (voir « Le gabarit »).
- **La pastille « 497 matières »** (`revue/Pastille497.tsx`, lot B3).
- **La marque** : le logo (`Logo.tsx`), losange et « Swap ».

Nulle part ailleurs : ni un titre, ni un grand numéro, ni un surtitre, ni une sélection, ni un favori, ni une erreur.
`src/app/theme.test.ts` (« le rouge réservé aux actions ») relit toutes les sources `.ts`/`.tsx` hors tests et hors
espace client et échoue si une classe au rouge (`bg-`, `text-`, `border-`, `ring-`, `outline-`, `fill-`,
`stroke-`… `accent`), `--color-accent`, `#B3261E` ou `#8F1E18` paraît hors de ces quatre fichiers. L'espace client
(`src/components/espace/`) y entre au lot C6, quand ses couleurs écrites en dur passent aux jetons.

### Les boutons

| Variante | Classes | Où |
|---|---|---|
| `principal` | `bg-accent text-blanc hover:bg-accent-survol` | l'action de l'écran (simuler, envoyer, recevoir le devis) |
| `secondaire` | contour `border-encre text-encre`, plein à l'encre au survol | une seconde action sur le papier (WhatsApp, plein écran, favoris) |
| `sur-encre` | contour `border-fond text-fond`, `hover:bg-fond/10`, focus au papier | une action posée sur un bloc encre : dernier appel, pied de page, WhatsApp sur l'encre (à partir de B5 / B6) |
| `discret` | lien souligné en gris chaud | un retour, une action mineure |

Tous font 48 px de haut au moins (cible tactile ≥ 44 px). `BoutonWhatsApp` prend `variante="sur-encre"` sur
l'encre, `secondaire` ailleurs.

### Ce qui n'est pas rouge

- **Erreurs et avertissements** : le brun, `bg-alerte-fond text-alerte-texte` (6,74:1), bordure
  `border-alerte-texte/40` ; une zone refusée par l'analyse du simulateur prend `border-alerte-texte`. Une erreur ne
  doit pas ressembler à une action.
- **Sélections** (carte de pièce choisie, zone choisie, filtre actif, unité, créneau) : l'encre, en contour
  (`border-encre ring-1 ring-encre`) ou en plein (`bg-encre text-blanc`).
- **Favoris** : le cœur plein à l'encre (`text-encre`), vide en gris chaud ; dans un bouton secondaire il prend la
  couleur du texte du bouton (encre, blanc au survol).
- **Liens de texte** (pages légales, désinscription, opposition à la mesure) : `text-encre underline`, gris chaud au
  survol.

## Les composants de base

Lot B3. Les nouveaux sont dans `src/components/revue/` (composants serveur, aucun JavaScript envoyé) ; les communs
déjà là (`Bouton`, `Lien`, `Etiquette`, `AvantApres`, `Section`) restent dans `src/components/simulation/`. Tous sont
rendus et vérifiés par `components/revue/revue.test.ts` et `components/simulation/composants.test.ts`.

### Les boutons

`Bouton` (`<button>`) et `Lien` (`<a>`) partagent `classesBouton(variante)` : **principal rouge** (un seul par
écran : l'action de l'écran), **secondaire à l'encre en contour**, `sur-encre` (contour papier, sur un bloc encre),
`discret` (lien souligné). 48 px de haut au moins. Détail dans « Les boutons » plus haut.

### Le cartel de matière — `revue/Cartel.tsx`

L'étiquette d'un échantillon en boutique : **« Nom · RÉF · famille · finition »**. Le nom du fabricant en Playfair
italique 19 px (« Sage Green »), puis « RM20 · Couleur · Standard » en petites capitales espacées (`.cartel`, 12 px),
à côté d'un **filet vertical de 3 px à la teinte** (celle de la prestation passée en `teinte`, sinon la couleur de la
matière ; un liseré d'encre à 15 % le garde visible quand la matière est blanche). Le texte ne prend jamais la teinte.

- Famille au singulier (« Couleur », « Bois », « Pierre », « Béton »…), finition en français (`lib/cartel.ts`) :
  Soft → « Standard » (474 matières sur 497), Structured → « Structurée », Rustic → « Rustique », Glitter →
  « Pailletée ».
- Variantes : `clair` (papier ou fond-2 : encre et gris chaud), `encre` (bloc encre : papier et `sur-encre-2`),
  `sur-photo` (sur une image : voile d'encre à 80 %, tout en blanc).
- Usage : sous un échantillon, sur une bande, sous une ambiance pour dire ses matières, sur la fiche d'une matière.

### L'échantillon — `revue/Echantillon.tsx`

Une matière comme un échantillon physique : la **vraie vignette** du catalogue (`/api/site/echantillons/<REF>?l=320`
du CRM), carrée (place réservée), coin arrondi, ombre portée légère, posée sur la couleur de la matière tant qu'elle
charge (chargement différé, `priorite` pour le premier écran), et son cartel dessous. Avec `href`, tout l'échantillon
est un lien nommé par son cartel. Usage : le présentoir de l'accueil (8 vedettes), `/matieres`, les « matières
proches » d'une fiche.

### La bande de matière — `revue/BandeMatiere.tsx`

Elle **sépare les grandes sections** avec une vraie matière (chêne, marbre, vert profond, terracotta, bleu nuit) :
l'échantillon du CRM **étiré en fond** sur toute la largeur (`object-cover` ; la vignette de 320 px ou l'échantillon
entier de 595 px, au choix du navigateur), son cartel `sur-photo` posé en bas à gauche.

- Hauteur réservée : `fine` 96 px (128 px dès 768 px), `haute` 160 px (240 px) ; la couleur de la matière remplit la
  bande avant l'image.
- Chargement différé : une bande n'est jamais en haut de page.
- Une seule image pour les lecteurs d'écran (`role="img"`, nommée « Matière Classic Walnut · D1 · Bois · Standard »).
- Pas de grain dessus, pas de texte d'interface dessus : seulement le cartel.

### Le filet — `.filet`

Un trait de 1 px (`<hr class="filet">`, ou `border-top` d'un bloc) à la teinte de la page (`--teinte`), à l'encre
s'il n'y en a pas. Il sépare deux idées dans une section (étapes, questions, cartes), au lieu d'un cadre ou d'une
ombre. Les bordures neutres (champs, cartes) restent au `trait`.

### Le grand numéro — `revue/GrandNumero.tsx`

« 01 », « 02 »… en Playfair 900, 64 px (`.grand-numero`) : le numéro d'une étape de « Comment on travaille » ou du
déroulé d'une page. **À l'encre** (au papier sur l'encre), ou **à la teinte** de la prestation là où elle tient
4,5:1. **Jamais rouge** (testé : source et rendu). Décoratif (`aria-hidden`) : il se pose dans une liste ordonnée,
qui dit déjà l'ordre aux lecteurs d'écran. Jamais un numéro de page, jamais un « N° ».

### La pastille « 497 matières » — `revue/Pastille497.tsx`

Un disque rouge un peu penché (112 px, 144 px dès 768 px), le nombre du catalogue en Playfair 900 et « matières » en
petites capitales, blanc sur rouge : c'est une action, elle mène à `/matieres`. Le nombre vient de `NB_REFERENCES`
(compté dans `revetements.json`), jamais écrit à la main. Une par page au plus, sur une photo d'ouverture ou à côté du
présentoir.

### L'étiquette d'honnêteté — `simulation/Etiquette.tsx`

La pastille posée sur une image, un seul dessin partout (12,5 px, fond blanc à 85 % et encre ; encre à 70 % et blanc
pour « Avant ») :

| Texte | Sur quoi |
|---|---|
| Réalisation | un vrai chantier (toujours montré en premier) |
| Simulation | un rendu du simulateur, rien d'autre |
| Ambiance | une image générée (photos d'ambiance, photos utiles) |
| Ambiance · avant / après | un avant / après généré |
| Avant, Après | les deux côtés d'un curseur |

Les pictos (dessins) n'en portent pas. Une étiquette décorative sur une image `alt=""` est muette (`muette`).

### Le curseur avant / après — `simulation/AvantApres.tsx`

Les deux images superposées, l'« avant » découpé par le curseur ; poignée de 48 px qu'on glisse au doigt (la page
défile ailleurs), un toucher sur l'image place le curseur.

- **Au clavier** (`curseur-clavier.ts`) : ← → ↑ ↓ de 5 %, Page ↑ / Page ↓ de 25 %, Début (tout après), Fin (tout
  avant) ; ces touches ne font pas défiler la page pendant qu'on règle (`preventDefault`), les autres gardent leur
  effet. `role="slider"`, nommé « Comparer avant et après », valeur et texte de valeur annoncés.
- **Place réservée** : `ratio` obligatoire hors espace client (testé), les deux images remplissent le cadre de la même
  façon.
- Pastilles « Avant » / « Après » en haut, l'étiquette d'honnêteté en bas à gauche.

### Les sections et leurs tons — `simulation/Section.tsx`

Une idée par section, de l'air (64 px, 96 px dès 768 px), largeur de lecture ou large. Trois tons (`ton`) :

| Ton | Fond | Titre | Secondaire | Boutons |
|---|---|---|---|---|
| `papier` (par défaut) | transparent : le papier de la page et son grain, sans raccord | encre | gris chaud | principal, secondaire |
| `papier-2` | `bg-fond-2`, sans grain | encre | gris chaud (4,78) | principal, secondaire |
| `encre` | `ton-encre bg-encre text-fond`, sans grain | papier | `sur-encre-2` (6,69), automatique pour `.surtitre` et `.texte-2` | `sur-encre` |

Sur l'encre, les liens nus passent au papier et le contour de focus aussi (globals.css). Le dernier appel et le pied de
page sont en encre (lots B5 / B6), jamais en rouge. L'ancien `fond="fond-2"` vaut `ton="papier-2"`.

## Le gabarit

Lot B5. Ce qui entoure toutes les pages (hors simulateur, qui garde son en-tête `compact`). Testé par
`src/components/gabarit.test.ts`.

### L'en-tête — `EnteteSite.tsx` (serveur)

- Collé en haut (`sticky`), **60 px** plus le filet, le papier et son grain (`.papier`), un **filet d'encre** dessous ;
  ni ombre, ni verre, ni sous-menu. Le lien d'évitement « Aller au contenu » reste le premier arrêt du clavier.
- À gauche le `Logo`. À droite, dès **1 024 px**, le menu en **petites capitales** à l'encre (13 px, espacées de
  0,08 em, soulignées au survol, cibles de 44 px) : Matières, Inspirations, Réalisations, Comment ça marche, Pro
  (`ENTREES_MENU` de `lib/navigation.ts`, seule liste lue par l'en-tête, le menu du téléphone et le pied).
- Puis le **lien rouge « Simuler ma pièce »** vers `/simulateur?depuis=entete` (`LIEN_SIMULER`) : la valeur `entete`
  part avec `PIECE_CHOISIE` (docs/SUIVI.md). Sous 640 px, 14 px sans la flèche : avec le logo et « Menu », il tient
  sur une ligne dès 360 px.
- Sous 1 024 px, le menu laisse la place au bouton **« MENU »** (mêmes petites capitales) : cinq entrées en
  capitales, le logo et le lien ne tiennent pas sur une ligne à 768 px. Le menu d'ordinateur et le bouton basculent
  au même seuil (`lg`), jamais les deux, jamais aucun.

### Le menu du téléphone — `MenuMobile.tsx` (client)

Une `Feuille` : les cinq entrées et le contact en petites capitales (15 px) entre des filets d'encre, puis, au pied
de la feuille, le bouton principal rouge « Simuler ma pièce » (même adresse, `depuis=entete`). Chaque lien ferme la
feuille avant de naviguer (`useLiensDeFeuille`). L'espace client reste au pied de page, pas au menu.

### Le pied de page — `PiedDePage.tsx` (serveur)

`<footer id="pied-de-page">` en ton encre (`ton-encre bg-encre text-fond`, sans grain). « Une question ? » en
Playfair, le téléphone et l'e-mail au papier (15,42:1) ; les liens (inchangés : `LIENS_PIED`, réseaux, pages
légales) et le secondaire en `sur-encre-2` (6,69:1), au papier et soulignés au survol ; jamais le gris chaud
(2,92:1) ni l'encre en texte ; filets au papier à 20 %. Le focus passe au papier (`.ton-encre :focus-visible`).

### Le bouton collé — `simulation/BoutonColle.tsx`

Option **`masquerSurSaisie`**, prise par **l'accueil seul** : le bouton s'efface tant qu'un champ de saisie a le
focus (texte, téléphone, e-mail, nombre, zone de texte, liste, élément éditable ; pas une case, un bouton ou un
curseur) — le clavier du téléphone le collerait sur le formulaire — et tant qu'une feuille ou un plein écran modal est
ouvert : `verrouillerLaPage()` (`Feuille.tsx`) pose `data-feuille-ouverte` sur `<html>`, que le bouton observe. La
logique est dans `simulation/saisie.ts` (pure). Le bouton « Voir le résultat » de l'écran des matières du simulateur
ne la prend pas : son action doit rester sous le pouce.

## L'accueil

Lot B6, `src/app/page.tsx` et `src/components/accueil/`, dans l'ordre du tunnel (énoncé, § C.1). Captures de
référence : `docs/captures/site-3-0/accueil-390.jpg` et `accueil-1440.jpg`.

| Section | Ton | Ce qui la porte |
|---|---|---|
| 1. Ouverture | papier | l'avant / après en pleine largeur (1 152 px au plus, jamais plus haut que `100svh`), titre `titre-0` hors de la photo, principal + « Être rappelé » |
| — bande | chêne AG13 | |
| 2. Par où commencer ? | papier | douze pictos de 64 px (80 dès 768), un filet de 3 px à la teinte de la prestation au-dessus de chacun |
| 3. Des cuisines comme la vôtre | papier-2 | six curseurs, les cartels des matières sous chaque image |
| 4. Comment on travaille | papier | grands numéros à l'encre, photos étiquetées, preuve de finition, garanties entre filets d'encre, principal |
| — bande | marbre NE31 | |
| 5. Le présentoir | papier-2 | pastille « 497 matières », 8 échantillons, secondaire ; il se ferme sur la bande vert profond NF13 |
| 6. Réalisations | papier | les vraies d'abord, puis la rangée « Ambiances » (étiquette en tête de rangée et sur chaque image) |
| — bande | terracotta NH12 | |
| 7. Professionnels | encre | curseur, cartels `encre`, secondaire `sur-encre` |
| 8. Avis et prix | papier | note Google si elle existe, prix du CRM en `tabular-nums`, zone et garantie |
| — bande | bleu nuit M9 | |
| 9. Questions, dernier appel | papier-2, puis encre | `<details>` entre filets d'encre ; principal rouge + deux `sur-encre` |

- **Le titre reste hors de la photo** à toutes les largeurs : les façades vert profond occupent le tiers haut de
  l'image (meubles hauts) ; un voile d'encre les aurait noircies. Sur téléphone, la photo vient d'abord (ordre visuel),
  puis la légende, le titre et les deux boutons, tous au premier écran (390 × 660) ; dès 768 px, le titre court sur
  toute la largeur au-dessus de la photo.
- Deux bandes ne se suivent jamais : le vert profond ferme le présentoir au lieu de l'ouvrir (il aurait suivi le
  marbre).
- Une seule action principale par écran ; le bouton collé « Simuler ma pièce » du téléphone s'efface sur les autres
  appels, pendant une saisie et tant qu'une feuille est ouverte.

## Ce qu'on a jeté de la maquette

Tout ce qui fait « faux magazine » (énoncé, phase B) :

- « N° 01 », « Automne 2026 », « La revue des intérieurs qui changent » et son titre de 250 px ;
- le sommaire et ses grands numéros rouges (« 04 », « 12 »… renvoyant à des pages) ;
- « Dossier », « En couverture », « Grand format · Salon », « Le nuancier du numéro », « Et si votre pièce faisait la
  couverture ? » ;
- le surtitre rouge « Entretien » et la lettrine du paragraphe d'ouverture ;
- le grain posé sur toute la page, photos comprises (ici : le papier seulement) ;
- le code-barres, et le bloc rouge du dernier appel (ici : encre, avec un bouton principal rouge).

`src/app/ton.test.ts` relit toutes les sources (pages, composants, données, articles, hors tests) et échoue sur un
numéro de revue, une saison, « la revue », « sommaire », « ce numéro » / « du numéro », « à la une », « en
couverture », « faisait la couverture », « grand format » ou un code-barres. « Dossier » reste permis : l'espace
client l'emploie au sens propre (le dossier d'un client). Ce qu'on garde : la grammaire (titres serif très grands
posés sur une photo pleine largeur, filets fins, grands numéros, cartels, blocs papier et encre), les jetons, le
lien rouge « Simuler », la pastille.
