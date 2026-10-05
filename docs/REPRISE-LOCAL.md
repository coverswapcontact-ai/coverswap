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

- C1, `/prestations/[slug]` : fait (cas, vedettes, prix du CRM, villes, teinte ; `docs/DESIGN.md` « Les pages de prestation »).
- C0, C2 à C7 : à venir.

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

## B4 — la bibliothèque série 2 (05/10/2026)

**Fait** (aucune image régénérée, aucun appel d'API : tout vient des images déjà retenues)
- `scripts/bibliotheque/` (commité, aucun chemin personnel) : `serie-2.json` (les 70 lignes de `bibliotheque.json`,
  `fichier` réduit au nom, sans `essais`, `avant` ramené au nom de la ligne avant, « Illustration » devenue
  « Ambiance », pictos sans étiquette), `zones-serie-2.json` (copie de celle du CRM), `reglages.json` (titres,
  scènes, libellés, zones, ancres et étiquettes réglés à la main, nom de picto).
- `scripts/bibliotheque.mjs` / `npm run bibliotheque` : réencode les 62 photos en `public/images/sources/<nom>.jpg`
  (mozjpeg 88, progressif, 4:2:0), rogne les 8 pictos à leur dessin et les centre sur 512 px transparents (456 px de
  dessin, la marge de la série 1), écrit `src/data/ambiances-serie-2.ts` (FICHIER GÉNÉRÉ), puis lance
  `preparerImages()` et `npm run pictos`. Relançable : même contenu (sha1) = sauté, contenu différent = arrêt ; sans
  le dossier de la série (`--dossier`, par défaut `~/coverswap-photos/serie-2`), les images déjà importées suffisent.
  `--depuis <bibliotheque.json> --zones <…>` refait les entrées ; `--planche [dossier]` écrit les planches de
  contrôle des étiquettes hors dépôt (étiquettes à leur taille réelle sur une carte de 720 px, pastilles d'honnêteté
  dessinées). Un réglage qui manque, une zone inconnue ou deux zones qui s'excluent : sortie 1, chaque problème nommé.
- `src/data/ambiances.ts` reste la seule liste lue par le site : `AMBIANCES = [...série 1, ...série 2]`, plus
  `PAIRES_SERIE_2` (18 avants, chacun avec son `ratio`, sa scène, « Ambiance · avant / après » et ses 2 après) et
  `PHOTOS_UTILES` (6, « Ambiance », texte alternatif écrit). Types `PaireAmbiance` et `PhotoUtile`.
- `Illustrations.tsx` : `PICTOS_ELEMENTS` (7 éléments), `FormeCuisine` gagne `parallele` (picto `plan-parallele`, pas
  encore proposé par l'estimation : E2, quand le CRM publie ce format).
- `/inspirations` : `relative` sur la rangée de filtres qui défile. Les radios `sr-only` (en absolu) s'échappaient de
  la rangée et élargissaient la page à 1 061 px à 360 px de large (défaut d'avant, révélé par les 9 teintes qui
  remplissent maintenant la rangée) ; testé.

**Intégré** (70 sur 70)
- 18 avants (cuisine 11, salle de bain 3, meubles 3 dont les portes du couloir, pro 1) : `sources/` + `PAIRES_SERIE_2`,
  jamais en inspiration seuls.
- 36 après : ambiances `inspiration: true`, `avant` = leur avant (curseur prêt).
- 2 ambiances (`amb-cuisine-familiale`, `amb-couloir-portes`) : inspiration.
- 6 photos utiles : `sources/` + `PHOTOS_UTILES` ; `detail-chant` (RM20) et `pose-mains` (AF02<AG13) sont aussi des
  ambiances `inspiration: false` (AF02 garde ainsi sa photo).
- 8 pictos : `pictos/sources/` + 128 / 256 px AVIF / WebP ; `picto-plan-parallele` renommé `plan-parallele`.

**Pas intégré, volontairement** : `originaux/` (28, les bruts d'avant la retouche du 03/10), `essais-rates/` (2),
`planches/` (39 planches de contrôle), et tous les essais non retenus de `quotidien/`, `enrichissement/`,
`ambiances/`, `pictos/` : seul le `fichier` de chaque ligne retenue est lu. Aucun écran ne montre encore les paires,
les photos utiles ni les 7 nouveaux pictos : B6 (accueil), C (pages) et E2 / E3 (simulateur) les branchent.

**Poids ajouté au dépôt** : ≈ 38,6 Mo (sources 10,5 Mo pour 62 JPEG de 93 à 244 Ko, prep 26,1 Mo pour 558 fichiers,
pictos 2,0 Mo pour 8 sources et 32 sorties). Manifeste : 22 → 84 images.

**Décisions prises seul**
1. Les données de la série 2 sont générées dans `ambiances-serie-2.ts` et réunies dans `ambiances.ts` (le plan),
   plutôt que réécrire `ambiances.ts` à la main : `ambiances.ts` reste la source unique que lit le site.
2. Ordre = celui de la bibliothèque (la bordeaux en premier), pas l'ordre alphabétique : stable, et c'est l'ordre de la
   direction artistique. « Vue dans » : RM20 gagne `pro-comptoir-accueil-apres-couleur`, D1 `portes-couloir-apres-bois`
   et `pro-comptoir-accueil-apres-bois`.
3. `ratio` des paires tiré du format de la bibliothèque (pas un réglage de plus) ; libellés de surface par défaut par
   clé (« façades », « plan de travail »…), réglés seulement quand il le faut.
4. `ilot-maison` : `facades` → `meubles-hauts`, `ilot` → `meubles-bas` (le plan) ; l'ancre des façades est prise sur
   la 2ᵉ zone de mesure (meubles hauts), pas la 1ʳᵉ (meuble bas du pourtour), pour que le point soit sur la zone
   nommée. Sans ce réglage, le script refuse (`facades-cuisine` exclut `meubles-bas`).
5. Placement automatique des étiquettes, au-delà du « bord le plus proche » du plan : hors des pastilles d'honnêteté
   (« Avant », « Après », « Ambiance · avant / après », « Ambiance »), dans l'image, sans chevauchement (un cran de 7 %
   vers le centre sinon). Revue sur les 10 planches : 5 réglages à la main (plan des 2 cuisines de village sur la
   crédence, portes du couloir posées sur le sol, plan de la cuisine familiale au-dessus du plan, ancre de l'îlot).
6. Les pièces `portes` vont en `meubles` (zone `portes-dressing`) ; `pro` en `professionnel` ; les photos utiles à
   composition en `cuisine` (zone `facades-cuisine`).
7. Titres et scènes écrits d'après les planches, au ton du site, les teintes en français (« vert profond », « chêne
   pâle »), sans nom de référence dans le titre.

**Tests** : 341 → 360, tous réussis. `src/lib/bibliotheque.test.ts` (14, depuis les seules entrées commitées) : 70
lignes et leurs rôles, aucun chemin personnel ni « Illustration », 2 après par avant, 62 au manifeste + 8 pictos
(512 × 512 avec alpha, 4 sorties), le fichier généré égal à la sortie du script (fins de ligne normalisées), comptes et
ordre, aucune zone exclusive (table d'exclusions comparée à `ZONES_REPLI`), zones de la table au simulateur, ancres et
étiquettes hors des pastilles ; fonctions pures (entrées, ancre, placement, refus d'un réglage manquant ou de zones
exclusives, écriture sans écraser). `ambiances.test.ts` : 14 → 52 inspirations (ni avant, ni photo utile), « Vue
dans » RM20 / D1, les 5 `prevue` de la série 2, paires et photos utiles, pictos étendus aux 8 nouveaux, rangée de
filtres `relative`. `images-depot.test.ts` +2 (62 JPEG progressifs ≤ 400 Ko, 84 au manifeste, aucun brut / essai /
planche). `images-manifeste.test.ts` +1 (largeurs 1536 / 1024 plafonnées, source servie avec son empreinte).

**Vérification visuelle** : planches de contrôle (hors dépôt, `scratchpad/m21/b4/planches`) ; build local, `next start
-p 3100`, captures Edge 390 et 1 440 px de `/inspirations`, de l'accueil, de `/matieres?ref=D1` et de `/pro` ; aucun
débordement à 360 px après la correction de la rangée de filtres ; 0 requête coupée.

**Problèmes** : `/inspirations` passe à 52 cartes (18 800 px de haut à 1 440 px) : la page sera repensée en C4. Les
vignettes du CRM ne s'affichent pas sur le build local (adresse du CRM absente en local, comme en B3). Le picto
`plan-parallele` attend que le CRM publie le format couloir.

## B5 — le gabarit (05/10/2026)

**Fait** (repris d'un agent arrêté en cours de lot : son travail relu et gardé, une référence de test corrigée,
DESIGN.md complété)
- `EnteteSite.tsx` : 60 px plus le filet, `.papier` (le grain), filet d'encre dessous ; `Logo` ; dès 1 024 px le menu
  en petites capitales à l'encre (Matières, Inspirations, Réalisations, Comment ça marche, Pro) ; lien rouge
  « Simuler ma pièce » → `/simulateur?depuis=entete` (flèche dès 640 px, 14 px dessous pour tenir à 360 px).
- `MenuMobile.tsx` : bouton « MENU » en petites capitales (sous 1 024 px), feuille aux entrées en petites capitales
  entre filets d'encre, bouton principal « Simuler ma pièce » au pied de la feuille (ferme puis navigue).
- `PiedDePage.tsx` : `ton-encre bg-encre`, liens inchangés, texte au papier et `sur-encre-2`, filets `fond/20`,
  « Une question ? » en Playfair.
- `BoutonColle.tsx` : option `masquerSurSaisie` (focus dans un champ, ou `data-feuille-ouverte` posé sur `<html>` par
  `verrouillerLaPage()`), logique pure dans `simulation/saisie.ts` ; prise par l'accueil seul, l'écran Matières du
  simulateur inchangé.
- `lib/navigation.ts` : `ENTREES_MENU` à cinq entrées, `LIEN_INSPIRATIONS` retiré (le pied le garde par le menu),
  `LIEN_SIMULER` = « Simuler ma pièce », `depuis=entete`. `docs/SUIVI.md` : la valeur `entete` ajoutée, rien retiré.
- `docs/DESIGN.md` : section « Le gabarit », lien « Simuler ma pièce ».

**Décisions prises seul**
1. Inspirations entre au menu (cinq entrées, l'ordre de la consigne) : le test « le menu garde ses quatre entrées »
   devient « cinq entrées, dans l'ordre », et celui du pied exige la liste exacte, sans doublon.
2. Le menu d'ordinateur passe de 768 à 1 024 px : cinq entrées en capitales, le logo et le lien ne tiennent pas à
   768 px. Entre 768 et 1 023 px, le bouton « MENU » comme au téléphone.
3. Le menu du téléphone porte le bouton principal rouge « Simuler ma pièce » (même `depuis=entete`) : la feuille
   recouvre l'en-tête et son lien.
4. La feuille pose un attribut sur `<html>` (plutôt qu'un contexte React) : le bouton collé l'observe sans lien entre
   les composants, et les pleins écrans modaux (`PleinEcran`, même verrou) comptent aussi.
5. Le libellé du bouton collé de l'accueil (« Simuler ma cuisine ») n'est pas changé ici : l'accueil est refait en B6.

**Tests** : 360 → 375, tous réussis. `src/components/gabarit.test.ts` (14) : en-tête (60 px, `.papier`, filet,
petites capitales, seuil commun du menu et du bouton, lien rouge sans adresse en dur), menu du téléphone (style,
bouton principal au pied de la feuille), pied en encre (rendu serveur : liens inchangés, aucun `text-encre` ni
`border-trait`, contrastes ≥ 4,5:1, focus au papier), bouton collé (champs de saisie, feuille ouverte, attribut posé
et retiré, accueil seul, « Voir le résultat » inchangé). `navigation.test.ts` : cinq entrées, pied exact, `depuis=entete`
lu par `lireDepuis` et documenté au suivi. `accueil.test.ts` : `masquerSurSaisie` sur la page.

**Vérification visuelle** : build local, `next start -p 3100`, Playwright + Edge à 360, 390, 768, 1 024, 1 280 et
1 440 px sur l'accueil et `/comment-ca-marche` : en-tête 61 px (60 + filet), filet à l'encre, aucun débordement
(scrollWidth = largeur), lien rouge 44 px de haut ; menu ouvert à 360 / 390 / 768 (7 liens, attribut posé puis retiré
à la fermeture) ; focus clavier : contour 3 px à l'encre dans l'en-tête, au papier (#F4EDE2) sur le pied ; bouton
collé de l'accueil : visible → masqué au focus d'un champ → revenu → masqué menu ouvert → revenu. Requêtes POST et
API de simulation coupées. Captures hors dépôt (`scratchpad/m21/b5g/captures`).

**Problèmes** : aucun. Le premier agent du lot s'est arrêté avant la vérification visuelle et le commit ;
son travail était complet et juste, rien de perdu.

## B6 — l'accueil complet, dans l'ordre C.1 (05-06/10/2026)

**Fait** (neuf sections de `sectionsAccueil()`, bandes de matière entre elles, aucune image régénérée, aucun envoi)
1. **Ouverture** (`Ouverture.tsx`) : la paire `cuisine-bordeaux-brillante-avant` → `-apres-couleur` (`IMAGE_OUVERTURE`)
   en pleine largeur (1 152 px au plus, jamais plus haute que `100svh`), curseur, « Ambiance · avant / après », la
   légende exacte de l'énoncé en `figcaption` ; une réalisation publiée passe d'abord (« Réalisation, <ville> », sa
   légende = titre et ville). Titre `titre-0` (la promesse d'avant, « Votre cuisine, transformée en une journée. »),
   principal « Voir ma pièce transformée » (`depuis=accueil-ouverture`), secondaire « Être rappelé ». `ImageObject`
   (`imageObjetOuverture`) ; `generateMetadata` : l'image de partage suit une réalisation publiée (`partageOuverture`).
   Sous 768 px, plus d'outils sous l'image (`outilsMobile="aucun"`, nouvelle valeur d'`AvantApres`).
2. **Par où commencer ?** (`ParOuCommencer.tsx`, serveur) : 5 pièces + 7 éléments (`lib/simulateur/elements.ts`),
   pictos de 64 / 80 px, filet à la teinte de la prestation ; liens `lienSimuler({ projet, element, choix: true,
   depuis: "accueil" })`. Montage du simulateur : `decisionAuMontage(…, { choix })` rend `pieceChoisie` (pièce de
   l'adresse valide, ni `suite=1` ni photo en mémoire) → `marquerPiece` émet `PIECE_CHOISIE` et l'écran Photo s'ouvre ;
   `?element=` (`lireElementDemande`, `zoneDeLElement`) ouvre la feuille de sa zone à l'écran des matières
   (`useMatiereDemandee`, une fois). `entonnoir.test.ts` inchangé ; `Simulateur.tsx` 593 → 598 lignes (plafond 600).
   `HomeClient.tsx` supprimé.
3. **Des cuisines comme la vôtre** (`CuisinesCommeLaVotre.tsx`) : les six paires nommées, l'après au plus petit ΔE
   affiché, cartels des matières (une même référence sur deux surfaces = un cartel), « Essayer cette composition chez
   moi » (`depuis=accueil-cuisines`).
4. **Comment on travaille** (`CommentOnTravaille.tsx`) : 4 étapes à grand numéro et photo étiquetée (`etape-photo`,
   `etape-simulation` « Simulation », `echantillons-table`, `pose-mains`), preuve `detail-chant`, 4 garanties (devis
   `DELAI_REPONSE`), « Simuler ma pièce » `#etapes-simuler`. La phrase sur le covering y vit (seule sur l'accueil).
5. **Le présentoir** (`Presentoir.tsx`, remplace `MatieresAccueil`) : pastille 497, 8 vedettes en `Echantillon` vers
   leur fiche, « Voir les 497 matières » ; fermé par la bande NF13.
6. **Réalisations** (`RealisationsAccueil.tsx` réécrit, `CarteSimulee` gardé pour `/realisations` et les prestations) :
   les publiées d'abord (`realisationsAccueil`, 3 au plus), puis la rangée « Ambiances » (dressing-vert-tendre,
   salon-marbre, buffet-…-apres-couleur, amb-cuisine-familiale). Aujourd'hui aucune publiée : « Nos réalisations
   arrivent ». `InspirationsAccueil` et `TroisFaits` supprimés.
7. **Professionnels** (`ProAccueil.tsx`, ton encre) : comptoir avant → après bois (D1 + K1), cartels, « Voir l'offre
   pro » en `sur-encre`.
8. **Avis et prix** (`Confiance.tsx` → `AvisPrix.tsx`) : `blocAvis` inchangé (le CRM répond `disponible: false` :
   rien d'affiché), puis `BlocPrix` / `ContenuPrix` (`components/BlocPrix.tsx`, partageable) : tarifs du CRM tels quels
   (prix `null` masqués, famille sans prix « Sur devis »), repli `PRIX_PLAGE` + `FOURCHETTES` ; zone et garantie.
9. **Questions** (`QuestionsAccueil.tsx`) : six questions de `data/faq.ts` (`QUESTIONS_ACCUEIL`), `<details>`, un seul
   `FAQPage` ; puis **le dernier appel** en encre : « Simuler ma pièce » (`accueil-final`), « Être rappelé » et
   WhatsApp en `sur-encre`.
- **« Être rappelé »** (`FormulaireRappel.tsx`, client, ajouté à `CLIENTS_ADMIS`) : feuille, prénom, téléphone,
  créneau (`lib/rappel`), consentement, Turnstile au premier geste, pot de miel ; `/api/contact` avec
  `formulaire: "coverswap.fr/rappel"` ; la route transmet `rappelCreneau` (validé par `estCreneauRappel`).
  `CONTACT_ENVOYE` + `RAPPEL_DEMANDE {creneau, depuis}`. **Jamais envoyé en local** (ouvert seulement, champs vérifiés).
- Bandes (`BANDES_ACCUEIL`) : AG13 après les pictos, NE31 après « Comment on travaille », NF13 fermant le présentoir,
  NH12 après les réalisations, M9 après avis et prix. Bouton collé : « Simuler ma pièce » (`accueil-colle`),
  `masquerSurSaisie`, cibles `ouverture-simuler`, `par-ou-commencer`, `etapes-simuler`, `dernier-appel`, pied.
- `lib/liens-simulateur.ts` (`lienSimuler`, `avecDepuis`) ; `lienSimulerCuisine` gardé pour `/comment-ca-marche`.
- `matiereCartel(ref)` (`lib/matieres-vedettes.ts`) ; alias de teinte `placard-coulissant` → portes et placards.
- `docs/SUIVI.md` § 8 réécrit (+ lignes `PIECE_CHOISIE`, `RAPPEL_DEMANDE`, `CONTACT_ENVOYE`), `docs/DESIGN.md`
  « L'accueil », `data/faq.ts` (commentaire), captures `docs/captures/site-3-0/accueil-390.jpg` et `accueil-1440.jpg`.

**Décisions prises seul**
1. **Le titre reste hors de la photo, à toutes les largeurs** (repli prévu par le plan) : sur la capture, les façades
   NF13 occupent le tiers haut (meubles hauts) ; le voile d'encre les aurait noircies. Téléphone : photo, légende,
   titre, boutons (le principal tient dans 390 × 660 : 605-653 px) ; dès 768 px, titre pleine largeur au-dessus.
2. Photo de l'ouverture à la largeur des sections (1 152 px, `max-w-6xl`) plutôt que 1 392 : mêmes bords que l'en-tête
   et les sections ; et jamais plus haute que l'écran utile (`min(72rem, (100svh − 84px) × 1,5)`).
3. Les boutons de l'accueil ne fixent plus la pièce (`/simulateur?depuis=…`, libellé « Simuler ma pièce ») : la page
   parle de toutes les pièces ; les pictos fixent la pièce. `/comment-ca-marche` garde son « Simuler ma cuisine »
   (`CommentCaMarche`, trois étapes) jusqu'au lot C3, qui prendra `CommentOnTravaille`.
4. Image de partage : seule une réalisation publiée remplace l'image du site ; une image d'ambiance n'est jamais
   partagée brute (sans son étiquette) — les images composées et étiquetées viennent en F2. `metadonnees.test.ts` lit
   donc `generateMetadata()` pour « / ».
5. La bande vert profond **ferme** le présentoir (en tête, elle suivait la bande de marbre, deux bandes collées).
6. L'élément ouvre la **feuille** de sa zone à l'écran 3 (lecture de « ouvre d'abord la zone ») ; seulement si la zone
   est dans la pièce ouverte. `lib/simulateur/elements.ts` tient la table d'E2 (porte d'entrée et placards →
   `portes-dressing`, réfrigérateur → `facades-cuisine`, commode → `meuble-complet`).
7. Sans réalisation publiée, la section 6 le dit (« Nos réalisations arrivent ») et son secondaire mène à
   `/inspirations` ; avec, « Voir les réalisations ».
8. Avis : section sans titre de tête quand Google n'a pas de note (« Nos prix » porte le titre) ; aucune note écrite.
9. Six questions de la FAQ existante, telles quelles, plutôt que de nouvelles réponses.

**Tests** : 375 → 391, tous réussis. `accueil.test.ts` réécrit section par section (mêmes intentions : ordre exact,
un principal par écran compté par classe quelle que soit la balise, honnêteté, LCP, chaque lien qui dit d'où il
vient) : neuf identifiants, cinq bandes, ouverture (h1 avant `<picture>`, un seul couple `fetchPriority="high"`, aucun
`lazy`, AVIF ≤ 80 Ko, `100svh`, 1 principal + 1 secondaire, « Ambiance · avant / après », jamais « Simulation »,
légende exacte, partage et `ImageObject`), 12 pictos `choix=1&depuis=accueil` de 64 px `alt=""`, 6 curseurs et 6
compositions, 4 étapes, 8 vedettes + 1 secondaire, réelles avant ambiances, pro, prix du CRM tels quels / repli,
aucun montant écrit dans les sources de l'accueil, **FAQ exigée** (l'ancienne assertion « plus de FAQ » réécrite
ouvertement : un seul `FAQPage`), dernier appel 1 principal + 2 `sur-encre`, rappel (fermé = un bouton, envoi,
événements, route), suivi documenté. `elements.test.ts` (3), `reprise.test.ts` (+3 : avec / sans `choix`, photo en
mémoire, montage), `perf.test.ts` (sections 2 à 9 en `sous-la-ligne`, `IMAGE_OUVERTURE`, − `HomeClient`
+ `FormulaireRappel`, nouveaux composants serveur), `cartes-pieces.test.ts` (− `HomeClient`), `metadonnees.test.ts`
(« / » par `generateMetadata`). `entonnoir.test.ts` inchangé. Lint et build passent.

**Vérification visuelle** : build local construit comme la CI (`NEXT_PUBLIC_SIMULATE_URL` de production,
`NEXT_PUBLIC_SANS_EVENEMENTS=1`), `next start -p 3100`, Playwright + Edge à 360, 390 (660 et 844), 768, 1 024 et
1 440 px, sections différées forcées visibles pour la capture pleine page, prise par tranches de 6 000 px recollées
(au-delà de 16 384 px d'image, Edge répétait le haut de la page). Aucun débordement à 360 px (`captures.mjs` aussi),
0 requête coupée, 0 image cassée, LCP = l'« après » de l'ouverture (240 à 310 ms en local, 656 ms à 360 px). Feuille
de rappel ouverte à 390 px : `data-feuille-ouverte` posé, champs prénom / téléphone / 3 créneaux / consentement, rien
envoyé. Corrigé après les captures : légende et marges du premier écran (le principal descendait sous 660 px),
éléments en 3 colonnes sur téléphone (« Réfrigérateur » ne tient pas en 4), cartels en une colonne, liens de
composition alignés, NF13 déplacée, rangée « Ambiances » collée au bord (`scroll-px-4`), questions et dernier appel
alignés sur les bords des sections, photo d'ouverture alignée sur l'en-tête.

**Problèmes** : à 768-1 023 px, le titre de 96 px prend trois lignes et la photo commence vers 490 px (lisible, mais
le premier écran d'une tablette en paysage montre surtout le titre) — à revoir avec les retouches. Vignettes, prix et
publications lus au CRM de production (GET seulement). Les captures pleine page de `captures.mjs` laissent toujours
blanches les sections en `content-visibility` (connu depuis B0).

## C1 — `/prestations/[slug]` (06/10/2026)

**Fait par page** (aucune image régénérée, aucun envoi ; `docs/DESIGN.md` « Les pages de prestation »)
- **Commun** (`ContenuPrestation.tsx`, données `src/data/cas-prestations.ts`) : ouverture avant / après — la première
  réalisation publiée de la pièce qui a ses deux photos (`choisirOuverture` généralisée : `typeProjet`, `paire`), sinon
  la paire d'ambiance de la page, « Ambiance · avant / après », légende, cartels à la teinte —, titre court, UNE action
  principale (le simulateur de la pièce, `depuis=prestation-<slug>`, en haut et au dernier appel), « Demander un
  devis » en secondaire ; puis les autres réalisations publiées de la pièce (« Nos chantiers », 3 au plus), les cas
  d'ambiance (`components/ambiances/CarteAmbiance.tsx` : curseur ou photo seule étiquetés, cartels, « Essayer cette
  composition chez moi » `depuis=prestation-<slug>`), la bande de matière de la teinte, 8 vedettes en `Echantillon`,
  présentation / surfaces / atouts, déroulement, prix (texte de la page + `ContenuPrix` filtré sur la famille du
  CRM, tel quel), les 8 villes, FAQ, autres prestations à leur teinte, dernier appel en encre (principal, « Être
  rappelé » et devis en `sur-encre`). L'« avant » de l'ouverture est préchargé par la page, comme à l'accueil.
- **Cuisine** : bordeaux → Deep Green NF13 en ouverture (la paire et la légende de l'accueil) ; 11 cas : les 10 autres
  cuisines de la série 2 + `amb-cuisine-familiale` ; vedettes NF13, RM20, NF14, NE83, AA14, AG13, U50, NE31.
- **Salle de bain** : `sdb-baignoire-tablier` (après couleur, NF13) en ouverture ; cas : petit meuble vasque (bois),
  double vasque wengé (neutre) ; vedettes NF13, M6, NE83, RM26, NH22, AA14, AG13, NE31. La paire série 1 (Khaki K4) n'y est plus.
- **Meubles** : buffet (après neutre, NH29 + AA14) en ouverture ; cas : placard coulissant (couleur), portes de
  couloir (bois), `amb-couloir-portes`, dressing (`meubles-armoire`) et meuble TV (`etude-meubles-apres`) de la
  série 1 ; vedettes NH12, NH29, RM16, RM30, NF13, D1, AA14, NF04.
- **Vitrages** : contenu inchangé (ni image, ni cas, ni vedettes, ni teinte ; devis en principal) ; prend les tons
  de la page (papier / papier-2, dernier appel en encre) et les villes.
- **Professionnel** : `/prestations/professionnel` → `/pro` (301) gardé, page toujours non générée.
- `CuisinesCommeLaVotre` (accueil) passe par `resoudreCas` / `CarteAmbiance` (même rendu). `etudeDeLaPiece` et la
  paire « dressing » de `PAIRES_ETUDES` retirées (plus rien ne les lisait) ; l'étude cuisine de `/realisations` reste
  jusqu'à C5. `docs/SUIVI.md` : valeurs `prestation-cuisine`, `prestation-salle-de-bain`, `prestation-meubles`
  (PIECE_CHOISIE, RAPPEL_DEMANDE, CONTACT_ENVOYE), aucun type nouveau. Captures
  `docs/captures/site-3-0/prestation-cuisine-390.jpg` et `-1440.jpg`.

**Décisions prises seul**
1. L'après de chaque paire = le plus petit ΔE affiché maximal (règle de l'accueil, testée contre
   `scripts/bibliotheque/serie-2.json`), sauf la bordeaux (NF13, fixée par l'énoncé). Conséquence : cuisine et salle de
   bain ouvrent toutes deux sur du NF13 ; le buffet ouvre sur sa version neutre (la jaune moutarde reste sur l'accueil).
2. Les légendes des ouvertures salle de bain et meubles sont écrites dans `cas-prestations.ts` (avant → matières),
   sans promesse de durée ; celle de la cuisine est celle de l'énoncé.
3. Les boutons de la page portent `depuis=prestation-<slug>` (pas seulement les « Essayer ») ; l'offre du `Service`
   garde `/simulateur?projet=<pièce>` sans `depuis`. Pas de `choix=1` : la carte est présélectionnée comme avant.
4. Prix : `ContenuPrix` gagne `familles` et `sansIntro` ; la page ne montre que sa famille (le CRM répond aujourd'hui
   110 €/ml pour la cuisine, rien pour la salle de bain → « Sur devis ») ; le texte de la page (plage et fourchette
   d'`offre.ts`) reste au-dessus.
5. Les cas en colonnes (1, 2 puis 3 : les images portrait — couloir, portes, dressing — ne laissent pas de trou),
   cartels sur 2 colonnes au téléphone pour raccourcir la page.
6. Téléphone : l'accroche passe sous les boutons, pour que le principal tienne dans 390 × 660 (573-621 px ; 727 px
   sans cela).
7. Préchargement de l'« avant » de l'ouverture aussi sur les prestations (`perf.test.ts` : « / et les prestations
   seulement ») ; pas d'`ImageObject` (exactement 4 types JSON-LD, comme le plan).
8. Les cartes surfaces / atouts / étapes (`BlocsPrestation`, partagées avec `/pro`) ne sont pas restylées ici.

**Tests** : 391 → 396, tous réussis ; lint et build passent. `autres-pages.test.ts`, « pages par pièce » réécrit (4 →
9 tests) : h1 exact, 2 principaux `depuis=prestation-<slug>`, dernier appel en encre, 4 types JSON-LD (`Service` à
l'adresse sans `depuis`) ; ouverture = le seul couple `fetchPriority="high"`, légende, cartels à la teinte, jamais
« Simulation » ni « Réalisation » ; cas (curseurs, étiquettes, liens parsés par `lireDepuis` / `lireComposition`,
aucun doublon, bande, aucun principal dans les cas ; « Khaki · K4 » remplacé par les références de la série 2) ;
vedettes, villes, prix du CRM tels quels / masqués / repli / « Sur devis » ; teinte de la page et des autres
prestations ; la réalisation de la pièce d'abord (ouverture, « Nos chantiers », avis exclu, autre pièce exclue) ;
vitrages inchangée ; données (11 cuisines, 3 salles de bain, meubles, ΔE, 8 vedettes au catalogue) ; `SUIVI.md`.
`perf.test.ts` : préchargement sur `/` et les prestations seulement. `tunnel.test.ts` inchangé (passe).

**Vérification visuelle** : build local (comme la CI), `next start -p 3100`, Playwright + Edge, cuisine, salle de bain,
meubles et vitrages à 360 × 660, 390 × 660 / 844, 1 024 et 1 440 px, sections différées forcées : aucun débordement à
360 px, 0 image cassée, 0 requête coupée (rien envoyé), LCP = l'après de l'ouverture (216 à 324 ms ; 704 ms à 360 px
pour la cuisine, premier chargement). Captures hors dépôt dans `scratchpad/m21/c1/captures`.

**Problèmes** : la cuisine est longue au téléphone (11 cas, ≈ 15 600 px). Le préchargement de l'image d'accueil
arrive sur toutes les pages par le préchargement Next de « / » (lien du logo : la charge RSC porte l'indice
`preload`) — existait depuis B6, à traiter en F6 si le LCP en souffre. Les cartes blanches de `BlocsPrestation`
détonnent avec les filets : à reprendre avec C2 / C3.

