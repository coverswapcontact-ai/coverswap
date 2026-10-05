# Reprise locale du site — mission 21, site 3.0

Branche `site-3-0`, créée depuis `main` (a7dd5a6, mission 18 fusionnée). Énoncé : phases B à G de la mission 21
(direction « La Revue »). Un lot = un commit « Site 3.0, <lot> : … » qui passe `npm test`, `npx eslint .` et
`npm run build`, puis `git push origin site-3-0` (prévisualisation Vercel, le site en ligne n'est pas touché ; jamais de
push sur `main` avant G3).

Les sections de phase ci-dessous donnent l'état ; chaque lot ajoute ses notes (ce qui est fait, décisions prises seul,
tests avant → après, problèmes) dans une sous-section **à la fin du fichier**, sous « Notes des lots ».

Règles tenues partout : aucun appel à l'API d'images, aucun formulaire envoyé en local ou en prévisualisation, aucun
nom ni photo de client, aucun secret ; « Ambiance » sur toute image générée ; téléphone d'abord (390 px), aucun
débordement à 360 px ; rouge #B3261E réservé aux actions.

## Phase B : direction artistique, composants, accueil

- B0, mise en place : fait (Lighthouse avant dans `docs/SEO.md`, `scripts/captures.mjs` revu).
- B1, jetons et polices : fait (`docs/DESIGN.md` commencé).
- B2, le rouge réservé aux actions : fait.
- B3, composants de base : fait (`src/components/revue/`, `lib/teintes-prestations.ts`, `docs/DESIGN.md` complet).
- B4 à B7 : à venir.

## Phase C : le tunnel, page par page

À venir (C0 à C7).

## Phase D : le catalogue des matières

À venir (D1 à D5).

## Phase E : le simulateur

À venir (E1 à E5).

## Phase F : SEO et performance

À venir (F1 à F6). Mesures « avant » : `docs/SEO.md`.

## Phase G : livraison

À venir (G1 à G4).

---

# Notes des lots

## B0 — mise en place (05/10/2026)

**Fait**
- Branche `site-3-0` (créée avant ce lot depuis `main` a7dd5a6, `Matieres.tsx` déjà remis à l'identique).
- Ce fichier, et le squelette de `docs/SEO.md` (objectifs, carte des intentions à remplir en F1, Lighthouse avant,
  Lighthouse après à remplir en F6 et G3).
- **Lighthouse avant**, mobile, 8 adresses (les 6 de la CI, `/prestations/cuisine`, `/matieres?ref=NF13`), meilleur
  de 3 passages, sur coverswap.fr et sur le build local de la branche : tableaux dans `docs/SEO.md`. En bref :
  accessibilité, bonnes pratiques et SEO à 100, CLS 0 partout ; performance 85 à 97 en ligne, 85 à 95 en local ;
  LCP 2,5 à 3,9 s en ligne, 2,8 à 4,0 s en local : c'est le chantier.
- **`scripts/captures.mjs`** revu :
  - largeurs 390 / 768 / 1440 (au lieu de 375), `deviceScaleFactor: 2` sous 768 px ;
  - JPEG qualité 80 (`<page>-<largeur>.jpg`) ;
  - options `--pages=accueil,prestation-cuisine,/matieres?ref=NF13` (un nom connu ou une adresse) et
    `--largeurs=390,1440` ; le dossier de sortie reste l'argument positionnel ;
  - contrôle à 360 px sur chaque page capturée : `scrollWidth` > 360 → les éléments qui débordent sont nommés et le
    script finit en code 1, après les captures ;
  - `context.route` coupe toute requête autre que GET/HEAD, `/api/simulate*`, `/api/simulation/*`,
    `/api/site/evenements`, et les appels au CRM (`crm.coverswap.fr`, `*.railway.app`, hôtes des variables
    `NEXT_PUBLIC_*`) sauf ses images ; service workers bloqués ; le compte et la liste des requêtes coupées s'affichent ;
  - Edge installé si le Chromium de Playwright manque (cas du poste).
- `scripts/comparer-captures.mjs` lit les `.jpg` (et encore les `.png` d'avant) ; l'image de différence reste
  `diff-<page>-<largeur>.png`.
- CI (`site.yml`) : étape « Captures 390 / 768 / 1440, contrôle à 360 px » ; la référence, la comparaison et la
  publication des captures tournent même si le contrôle à 360 px a fait échouer l'étape. `docs/SUIVI.md` § 11 à jour.
- Essais : 18 captures des 6 pages (1 min 05), aucun débordement à 360 px ; `--pages` et `--largeurs` essayés ; sur
  coverswap.fr, 2 envois d'événements coupés (`POST …/api/site/evenements`), rien d'autre ; vignettes du CRM affichées.

**Décisions prises seul**
1. `--etat-resultat` reporté au lot G1 : il dépend de la bibliothèque (B4) et de l'état du simulateur après E ;
   l'option répond aujourd'hui par un message clair (code 2) au lieu d'être ignorée.
2. Les images du CRM (vignettes d'échantillons) ne sont pas coupées : sans elles `/matieres` et les fiches seraient
   vides. Tout le reste du CRM l'est.
3. `PAGES_CAPTURES` reste à 6 (= `lighthouserc.json`, la CI) ; le passage à 8 est celui de F6. Les 2 pages en plus
   s'appellent par leur nom avec `--pages`.
4. Lighthouse : réglage mobile par défaut (412 × 823, celui de la CI et de PageSpeed), pas 390 px ; « meilleur » =
   performance la plus haute, puis LCP le plus court ; envois d'événements bloqués pendant la mesure en ligne.
5. Build local de mesure construit comme la CI (`NEXT_PUBLIC_SIMULATE_URL` = CRM de production,
   `NEXT_PUBLIC_SANS_EVENEMENTS=1`) : sans la première, les vignettes partent vers `localhost` et font 404.
6. `matieres.test.ts` normalise les fins de ligne en lecture (comme `perf.test.ts`) : `Matieres.tsx`, repris par git,
   est en CRLF sur le poste et faisait échouer « la matière en grand est un vrai dialogue modal ». Intention intacte.

**Tests** : 288 (287 réussis, 1 en échec à cause du CRLF) → 290 réussis. `perf.test.ts` : le test des captures passe
à 390 / JPEG / échelle / 360 px ; + « options --pages et --largeurs », + « rien ne part ». Lint et build passent.

**Problèmes** : Chromium de Playwright absent du poste (Edge sert) ; la CI ne tourne pas sur la branche (constat 11
du plan), la première comparaison sur `main` après G3 n'aura pas de référence (PNG 375 contre JPEG 390) ; écart
jusqu'à 12 points de performance entre deux passages d'une même page.

## B1 — jetons et polices, une seule source (05/10/2026)

**Fait**
- `globals.css`, bloc `@theme` (mêmes noms, valeurs changées) : papier `#F4EDE2`, fond-2 `#EBE2D4`, encre `#1B1613`,
  gris chaud `#6E5F52`, trait `#D9CDBD`, rouge `#B3261E` ; nouveaux : `accent-survol`, `sur-encre-2`, `alerte-fond`,
  `alerte-texte` (brun), `succes`, `succes-fond` ; `encre-survol` et `sombre` réchauffés. `--color-google` et
  `--font-google` intacts. 194 lignes (plafond 200 tenu sans le relever) : bloc v3 en une ligne vers `trait`, barre
  de défilement, focus et mouvement réduit compactés ; ajouts `--titre-0` (44 / 96 px), `.titre-0`, `.grand-numero`,
  `.filet`, `.cartel`, `.ton-encre :focus-visible`, `.papier`.
- `scripts/jetons.mjs` : `lireJetons()` (les couleurs hexadécimales du bloc `@theme`), `versRgb()`, `contraste()`.
  `generate-assets.mjs` et le fond d'aplatissement de `preparer-images.mjs` le lisent ; plus aucune couleur en dur.
- Polices : `Playfair_Display` (variable 400 à 900, droit et italique, `--font-playfair`) et `Libre_Franklin`
  (`--font-franklin`) par `next/font/google`, `display: swap`, préchargées, repli ajusté par défaut. Inter et Space
  Grotesk retirés. Aucune adresse Google Fonts dans `src/` ni dans le HTML servi (vérifié sur le build).
- Grain : SVG `feTurbulence` (0,7 ; 3 octaves ; désaturé ; opacité 0,16) en tuile de 160 px dans `--grain`, multiplié
  au papier, sur `body` et `.papier` seulement.
- `themeColor: "#F4EDE2"` dans `layout.tsx` et `e/[jeton]/page.tsx` ; le test vérifie maintenant les deux.
- `components/Logo.tsx` (serveur, jetons `accent`, `encre`, `blanc`, Playfair 900) sorti d'`espace/Illustrations.tsx`,
  qui le réexporte ; `EnteteSite` et `Desinscription` l'importent directement.
- `ok-fond` / `ok-texte` renommés `succes-fond` / `succes` (un seul emploi, `Simulateur.tsx:490`).
- `docs/DESIGN.md` commencé : section « Jetons et contrastes » (couleurs, contrastes, polices, tailles, grain, focus,
  logo).

**Contrastes mesurés** (WCAG, `contraste()`, figés par `theme.test.ts`) : encre/papier 15,42 ; encre/fond-2 13,98 ;
gris chaud/papier **5,28** ; gris chaud/fond-2 **4,78** ; gris chaud/encre 2,92 (interdit) ; sur-encre-2/encre 6,69 ;
rouge/papier 5,62 ; rouge/fond-2 5,09 ; blanc/rouge 6,54 ; blanc/rouge survolé 8,87 ; alerte 6,74 (7,39 sur papier) ;
succès 5,41 (5,76 sur papier) ; gris Google/papier 5,58. **Sous le grain** (rendu sharp et capture Edge concordants) :
papier moyen `#EFE8DD`, gris chaud 5,04 ; 5ᵉ centile 4,90 ; pixel le plus sombre 4,69. Sur fond-2, le grain le
ferait tomber à 4,25 : d'où la règle « jamais de grain sur fond-2 ».

**Vérification visuelle** : build local (`next start -p 3100`), captures 390 et 1 440 px de l'accueil, du
simulateur, de `/pro` et de l'espace client (`/e/…` sans CRM : écran « Pas de réseau », logo compris) ; tout reste
lisible, titres en Playfair, texte en Libre Franklin ; aucun débordement à 360 px ; 3 requêtes coupées (CRM). Grain
vérifié dans Edge en posant `.papier` sur l'ouverture (dans le navigateur de test seulement).

**Décisions prises seul**
1. Polices en version variable (une seule fonte par style, toutes les graisses) plutôt qu'en graisses statiques :
   3 fichiers préchargés (Playfair droit 38 Ko, italique 39 Ko, Libre Franklin 29 Ko). L'italique est préchargé
   aussi (le plan interdit `preload: false`) ; à revoir en F6 si le LCP le demande.
2. `accent-fond` / `accent-texte` gardés tels quels jusqu'à B2, qui les renomme en `alerte-*` dans les 16 fichiers.
3. Les dessins au trait (`espace/Illustrations.tsx`, `EcranPhoto.tsx`) et l'espace client gardent leurs hexadécimaux :
   leur table de correspondance et leur remplacement sont ceux des lots C6 et E2. L'espace client garde donc son fond
   `#F5F4F1` sous une barre de navigateur `#F4EDE2` jusqu'à C6 (écart invisible).
4. `public/logo.png` et `public/og-image.jpg` ne sont pas regénérés : les polices du site ne sont pas installées sur
   le poste (sharp retomberait sur une autre serif) et l'image de partage est recomposée en F2. Le script, lui, lit
   déjà les jetons.
5. Les pages posent encore `bg-fond` (papier uni) sur leur enveloppe : le grain ne s'y voit qu'avec le gabarit (B5)
   et les pages refaites, qui prendront `.papier`. Le test interdit `.papier` combiné à un fond non papier.
6. Logo en Playfair 900 (le mot à 21 px, au lieu de Space Grotesk 700 à 19 px), comme la maquette.

**Tests** : 290 → 299, tous réussis. `theme.test.ts` 5 → 14 (valeurs « La Revue », `lireJetons()`, aucune source en
double, contrastes, grain : SVG, opacité, tuile, sélecteurs, `.papier` jamais sur un autre fond ; logo ; `themeColor`
de l'espace ; nouvelles classes). `perf.test.ts` : le test des polices passe à Playfair / Libre Franklin, sans
`preload: false` ni `adjustFontFallback: false`, aucune adresse Google Fonts dans `src/` ; `Logo.tsx` dans la liste
des composants serveur. `tunnel.test.ts` : la confirmation de `DevisForm` sans `bg-ok-fond` ni `bg-succes-fond`.
Lint et build passent.

**Problèmes** : les captures pleine page à 1 440 px laissent blanches les sections en `content-visibility: auto`
de l'accueil (déjà le cas en B0, pas lié à ce lot : à regarder avec `--etat-resultat` en G1) ; Chromium de Playwright
toujours absent (Edge sert).

## B2 — le rouge réservé aux actions (05/10/2026)

**Fait**
- `components/simulation/Bouton.tsx` : `principal` passe au rouge (`bg-accent text-blanc hover:bg-accent-survol`,
  aussi à l'appui), `secondaire` reste le contour à l'encre, nouvelle variante **`sur-encre`** (`border-fond
  text-fond hover:bg-fond/10`, focus au papier) pour les blocs encre ; 48 px gardés. Les teintes du principal sont
  exportées (`TEINTE_PRINCIPALE`) pour un libellé-bouton qui a sa propre forme.
- Erreurs au brun dans 10 fichiers : `bg-accent-fond` → `bg-alerte-fond`, `text-accent-texte` → `text-alerte-texte`,
  `border-accent/40` → `border-alerte-texte/40` (FormulairePro, DevisForm, HomeClient, Simulateur, EcranMatieres,
  EcranResultat, EcranAttente, FeuilleCatalogue, Desinscription) ; zone refusée de l'écran Matières en
  `border-alerte-texte`. Les jetons `accent-fond` et `accent-texte` sont retirés de `@theme` (globals.css 191 lignes).
- Sélections et favoris à l'encre : carte de pièce choisie (`border-encre ring-1 ring-encre`), cœur des tuiles
  (`text-encre`), cœur des boutons « Ajouter à mes favoris » (`/matieres`, feuille du catalogue) à la couleur du
  bouton.
- En-tête : « Simuler » devient un **lien rouge** en gras avec sa flèche (comme la maquette), plus un bouton
  secondaire ; le principal de l'écran reste celui de la page.
- Écran Photo du simulateur : « Prendre une photo » prend le rouge du principal ; quand une photo est déjà là,
  « Garder cette photo » est le principal et « Reprendre une photo » passe au contour (un seul rouge).
- `BoutonWhatsApp` accepte `variante="sur-encre"` (dernier appel sur l'encre, B5 / B6), `secondaire` par défaut.
- `docs/DESIGN.md` : section « Le rouge réservé aux actions » (où il apparaît, les quatre variantes de bouton, ce qui
  n'est pas rouge).

**Vérification visuelle** (build local construit comme la CI, `next start -p 3100`, Edge) : accueil, simulateur,
`/pro`, `/matieres` à 390 et 1 440 px ; aucun débordement à 360 px ; 0 requête coupée. Écran Photo du simulateur
(carte Cuisine cliquée) et **erreur du formulaire `/pro`** à 390 et 1 440 px : formulaire rempli de valeurs d'essai,
envoi coupé dans le navigateur (2 `POST /api/contact` arrêtés par Playwright avant de partir, rien n'a atteint le
serveur) → « Connexion interrompue… » en brun sur `alerte-fond`, au-dessus du bouton rouge. Le rouge ne se voit plus
que sur les boutons principaux, « Simuler » et le logo.

**Décisions prises seul**
1. Les liens de texte des pages légales, de la désinscription (adresse e-mail) et de l'opposition à la mesure
   étaient en `text-accent-texte` sans être des erreurs : ils passent en `text-encre underline` (gris chaud au
   survol), la forme des autres liens du site, plutôt qu'au brun d'alerte qui les ferait lire comme des avertissements.
2. Zone refusée par l'analyse (`EcranMatieres`) : brun d'alerte plutôt qu'encre (le plan la rangeait parmi les
   sélections), parce que c'est un refus, et que l'encre est déjà la bordure d'une zone choisie.
3. « Simuler » de l'en-tête en lien rouge (texte), pas en bouton plein : l'énoncé dit « lien », la maquette le
   dessine ainsi, et un bouton plein ferait deux principaux par écran.
4. Le libellé-bouton « Prendre une photo » passe au rouge par `TEINTE_PRINCIPALE` (exportée de `Bouton.tsx`) pour que
   le rouge reste écrit dans les seuls fichiers permis.
5. Les boutons « Choisir » de chaque zone (écran Matières) restent en encre plein : il y en a un par zone, ce ne sont
   pas l'action de l'écran.
6. Le test « rouge réservé » relit les `.ts` et `.tsx` (pas seulement les `.tsx`), cherche aussi `--color-accent`,
   `#B3261E` et `#8F1E18`, et liste `revue/Pastille497.tsx` (lot B3) dès maintenant.

**Tests** : 299 → 306, tous réussis. `theme.test.ts` 14 → 19 (rouge réservé sur 4 fichiers ; le motif lui-même ;
le rouge des fichiers permis ; erreurs au brun, anciens jetons absents, `alerte-texte`/`alerte-fond` ≥ 4,5:1 ;
sélections et favoris à l'encre) ; le plancher de couleurs de `@theme` passe de 18 à 16 (les deux jetons retirés).
`lien.test.ts` : principal `bg-accent`/`text-blanc`/`hover:bg-accent-survol`, secondaire `border-encre`, `sur-encre`
`border-fond`/`text-fond`/`hover:bg-fond/10`, rouge absent des trois autres variantes, toujours ni hexadécimal, ni
`bg-rouge`, ni `text-white` ; `sur-encre` ajouté aux classes partagées et à la cible de 44 px. `tunnel.test.ts` :
`principaux()` compte les éléments qui portent les teintes de `classesBouton("principal")`, et chaque écran contient
bien `classesBouton("principal")` (toujours un seul principal). `accueil.test.ts` : + WhatsApp en `sur-encre`.
Lint et build passent.

**Problèmes** : `espace/Illustrations.tsx` dessine encore le cadre « Toute la zone visible » (conseils de l'écran
Photo) en rouge `#CC0000` écrit en dur : hors champ du test jusqu'au lot C6 / E2, qui remplacent ses couleurs.
`HomeClient.tsx` garde son libellé-bouton de fichier en encre plein (il disparaît en B6).

## B3 — composants de base (05/10/2026)

**Fait**
- `src/components/revue/` (5 composants serveur, aucun JavaScript envoyé, ajoutés à la liste de `perf.test.ts`) :
  - `Cartel` : « Nom · RÉF · famille · finition » (nom en Playfair italique, puis « RM20 · Couleur · Standard » en
    `.cartel`), filet vertical de 3 px à la teinte (celle de la prestation, sinon la couleur de la matière, liseré
    d'encre à 15 % pour les matières blanches) ; variantes `clair`, `encre`, `sur-photo` ;
  - `BandeMatiere` : l'échantillon du CRM étiré en fond (`srcSet` vignette 320 w / échantillon entier 595 w,
    `object-cover`), hauteur réservée (96 / 128 px, ou 160 / 240 px), couleur `hex` en attendant, `loading="lazy"`,
    `role="img"` nommé par le cartel, cartel `sur-photo` muet posé dessus ;
  - `GrandNumero` : `<span class="grand-numero …" aria-hidden="true">`, deux chiffres, encre (papier sur l'encre) ou
    teinte là où elle tient 4,5:1, jamais rouge ;
  - `Pastille497` : lien rouge vers `/matieres`, nombre = `NB_REFERENCES`, 112 / 144 px, légèrement penché ;
  - `Echantillon` : vignette `?l=320` carrée, arrondie, ombre légère, sur la couleur de la matière, cartel dessous,
    lien facultatif nommé par le cartel.
- `src/lib/cartel.ts` (pur) : famille au singulier, finitions en français (Soft « Standard », Structured
  « Structurée », Rustic « Rustique », Glitter « Pailletée »), `ligneCartel`, `texteCartel`.
- `src/lib/teintes-prestations.ts` (pur, sans import du catalogue) : cuisine RM20, salle de bain M6, meubles NH12,
  portes et placards NF13, murs NF99, professionnel K1 + D1, vitrages sans teinte ; contrastes déclarés (papier,
  papier granulé, fond-2, encre) et `texteAutorise` ; `teintePrestation(id)` (slugs, `mur-plafond`, éléments portes
  et placards), `styleTeinte` (`--teinte`, `--teinte-2`), `classeTexteTeinte`.
- `Etiquette` : six textes (« Réalisation », « Simulation », « Ambiance », « Ambiance · avant / après », « Avant »,
  « Après », `TEXTES_ETIQUETTE`), classes inchangées.
- `AvantApres` : clavier par `curseur-clavier.ts` (← → ↑ ↓ 5 %, Page ↑ / ↓ 25 %, Début, Fin), `preventDefault` sur
  toute touche gérée ; `ratio` obligatoire hors espace client (vérifié sur les appels existants, tous conformes).
- `Section` : `ton` = `papier` (transparent, le papier et le grain de la page), `papier-2` (`bg-fond-2`), `encre`
  (`ton-encre bg-encre text-fond`, titre au papier) ; `fond="fond-2"` reste accepté (= `papier-2`).
- `globals.css` (194 lignes) : sur `.ton-encre`, `.surtitre` et `.texte-2` passent en `sur-encre-2`, les liens nus
  au papier.
- `docs/DESIGN.md` complet : teintes des prestations et leurs contrastes, les règles, les composants de base (boutons,
  cartel, échantillon, bande, filet, grand numéro, pastille, étiquette d'honnêteté, curseur, tons de section), ce
  qu'on a jeté de la maquette.

**Vérification visuelle** : page de contrôle temporaire `/controle-revue` (jamais commitée, supprimée avant le build
final) sur un build local construit comme la CI, captures 390 et 1 440 px (Edge) ; tous les composants, les trois
tons, les six étiquettes, le curseur. Aucun débordement à 360 px (contrôle, accueil, `/comment-ca-marche`, `/pro`),
0 requête coupée. **Clavier dans Edge** à 390 et 1 440 px : → 55, ↑ 60, ← 55, ↓ 50, Page ↑ 75 puis 100 (borné),
Page ↓ 75, Début 0, Fin 100 ; la page ne défile pas (scrollY inchangé) ; contour de focus 3 px à l'encre ; Tab sort
du curseur. La capture a montré une pastille ovale à 1 440 px (112 × 144) : `md:w-36` collé à `${className…}`
n'était pas généré par Tailwind ; corrigé (chaîne entière) et testé, 144 × 144 ensuite.

**Décisions prises seul**
1. **Steel Blue M6 n'écrit pas sur le papier** (le plan le permettait à 4,65) : sous le grain (5ᵉ centile `#EBE5DA`,
   mesuré en B1), il tombe à 4,31. La règle « texte en teinte ≥ 4,5:1 » est prise au pire du papier uni et granulé.
   RM20 tient (4,52 sous le grain). `texteAutorise` est calculé couple par couple plutôt que « jamais sur fond-2 » :
   NF13, K1 et D1 y tiennent (10,21, 12,38, 6,46), NH12 et NF99 tiennent sur l'encre (6,37, 6,50).
2. La bande de matière **étire** l'échantillon (énoncé : « étirée en fond ») au lieu de répéter la vignette (plan) :
   l'échantillon entier (595 px) évite les raccords visibles d'une tuile ; la vignette de 320 px sert aux petits
   écrans à densité 1. Hauteurs : 96 / 128 px (`fine`), 160 / 240 px (`haute`).
3. Le grand numéro en teinte suit le même seuil 4,5:1 que le texte courant (pas le 3:1 des grands textes) : une seule
   règle.
4. `Section ton="papier"` est **transparente** (le papier et le grain de la page, sans raccord) plutôt que `.papier`
   ou `bg-fond` : rien ne change sur les pages qui ont encore une enveloppe `bg-fond` ; sur l'accueil (sans
   enveloppe), les sections papier montrent déjà le grain, l'ouverture (`bg-fond`) pas encore — écart de 5 niveaux
   (244 → 239), réglé par le gabarit B5 et l'accueil B6.
5. Finition « Soft » glosée « Standard » (le plan D1 : « Standard (Soft) ») : des matières laquées sont « Soft », on
   ne peut pas écrire « mat ». La famille passe au singulier sur le cartel (« Couleur »), comme la maquette.
6. `ton.test.ts` affine les formules du plan pour épargner les sens propres déjà au site : « la couverture
   géographique » (mentions légales) et « du numéro de téléphone » (espace client). Il attrape aussi les saisons,
   « faisait la couverture », le code-barres et « le nuancier du numéro ».
7. Teintes recopiées dans `teintes-prestations.ts` (avec un test de parité) plutôt que lues dans
   `revetements.json` : un composant client qui l'importerait tirerait les 497 matières dans son JavaScript.

**Tests** : 306 → 341, tous réussis. `components/revue/revue.test.ts` (28) : serveur et sans hexadécimal ni classe
collée à une expression ; rendu du cartel (3 variantes), de l'échantillon (avec et sans lien), de la bande (nom,
hauteur, `srcSet`, différé) ; teintes de l'énoncé, parité avec `revetements.json`, contrastes recalculés depuis les
jetons et `texteAutorise` pour chacune des 7 références ; grand numéro jamais rouge (source et rendu, 21
combinaisons) ; pastille ; six étiquettes au même dessin ; trois tons de section et règles `.ton-encre`.
`composants.test.ts` +5 (touches, touches non gérées, `preventDefault`, attributs du curseur, `ratio` partout hors
espace). `src/app/ton.test.ts` (2) : 0 constat sur les sources, formules attrapant la maquette et épargnant les sens
propres. `perf.test.ts` : les 5 composants dans la liste serveur. Lint et build passent.

**Problèmes** : les captures pleine page à 1 440 px laissent toujours blanches les sections en `content-visibility`
de l'accueil (connu depuis B0) ; les vignettes et échantillons viennent du CRM de production (GET seulement, comme
en B0) ; le cartel d'une matière blanche (NE31) a un filet très pâle, gardé lisible par le liseré.
