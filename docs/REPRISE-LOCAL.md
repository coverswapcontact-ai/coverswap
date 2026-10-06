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
- C2, `/pro` : fait (réalisations PRO d'abord, comptoir en ouverture, lieux de la série 1, teinte K1 + D1, formulaire inchangé).
- C5, `/realisations` : fait (les vraies d'abord, puis « Avant / après en ambiance », quatre paires).
- C3, `/comment-ca-marche` : fait (étapes de l'accueil, déroulé et délais, en place, entretien, « Quand rénover ? », blocs aux filets).
- C4, `/inspirations` : fait (52 ambiances en cartes de prestation, pièces mêlées, 12 premières puis « Voir toutes les ambiances », sans JavaScript).
- C0, C6, C7 : à venir.

## Phase D : le catalogue des matières

- D1, teinte, ΔE, indexation : fait (`lib/teintes.ts`, `lib/indexation-matieres.ts` : 52 fiches indexées).
- D2, `/matieres` le présentoir : fait (7 tiroirs, filtres teinte / finition / ambiance, échantillons rangés par teinte ; `docs/DESIGN.md` « Le présentoir »).
- D3, `/matieres/<famille>` : fait (sept pages, textes, bande des teintes, ambiances, vedettes, toutes les références).
- D4, `/matieres/<famille>/<REF>` : fait (497 fiches, 52 indexées avec leur note, les autres en `noindex, follow` ; `docs/DESIGN.md` « La fiche d'une matière »).
- D5, plan du site et `llms.txt` : fait (les sept familles et les 52 fiches indexées au plan du site, les familles dans `llms.txt`).

## Phase E : le simulateur

- E1, alléger `Simulateur.tsx` : fait (594 → 522 lignes ; `EcranGeneration.tsx`, `useFeuilleCatalogue.ts`).
- E2, les pictos partout : fait (écrans Pièce, Photo, Matières, Estimation ; `CuisineDeFace` supprimé ; `docs/DESIGN.md` « Les pictos du simulateur »).
- E3 à E5 : à venir.

## Phase F : SEO et performance

- F1, `docs/SEO.md` : fait (carte des intentions, une ligne par page indexée ; image de partage et hôte unique décrits).
- F2 à F6 : à venir. Mesures « avant » : `docs/SEO.md`.

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

## C2 — `/pro` (06/10/2026)

**Fait** (aucune image régénérée, aucun envoi ; `docs/DESIGN.md` « La page Pro », captures
`docs/captures/site-3-0/pro-390.jpg` et `pro-1440.jpg`)
- `src/app/pro/vue.ts` (`vueDuPro`, pur) : l'ouverture par `choisirOuverture(…, { typeProjet: "PRO", paire:
  PAIRE_COMPTOIR_PRO })` — la première réalisation PRO publiée qui a ses deux photos, sinon le comptoir d'accueil
  avant → après bois (`pro-comptoir-accueil-apres-bois`, D1 + K1, légende dans `contenu.ts`) ; les autres réalisations
  PRO (6 au plus) ; les lieux : le comptoir s'il a cédé l'ouverture, puis le bar du restaurant (paire), l'hôtel, la
  boutique (« Commerce »), les bureaux, par `resoudreCas`.
- `page.tsx` devient asynchrone (`chargerPublications`, `revalidate = 300`, comme les prestations) : ouverture dans la
  grille de `ContenuPrestation` (mêmes `TAILLES_OUVERTURE_PRESTATION`, « avant » préchargé), « Des lieux comme le vôtre »
  (« Nos chantiers » puis `CarteAmbiance sansLien` avec la ligne de chaque lieu), bande Classic Walnut D1, trois
  arguments entre filets, formulaire **inchangé** (`FormulairePro` non touché), « En détail » inchangé, dernier appel
  en encre (« Demander un devis pro » + « Être rappelé » `depuis=pro`).
- `CarteAmbiance` : `sansLien` (pas de lien vers le simulateur) et `children` (une ligne sous les cartels).
- `docs/SUIVI.md` : /pro, `RAPPEL_DEMANDE` / `CONTACT_ENVOYE` `depuis: pro` ; aucun type d'événement nouveau.

**Décisions prises seul**
1. Le comptoir **ouvre** la page (curseur dans la grille des prestations), au lieu d'une ouverture texte seule : c'est
   la paire que l'énoncé place en tête de `/pro`, et la page ressemble aux autres pages de prestation.
2. Après « bois » (D1 + K1) plutôt que « couleur » : ce sont les deux teintes du professionnel, et l'accueil montre le
   même (l'après couleur reste sur `/inspirations`).
3. Teinte : K1 sur les filets (`--teinte`), D1 sur le filet des cartels et la bande (`--teinte-2`) — K1, presque noir,
   ne se distingue pas de l'encre sur un cartel.
4. Pas de pastille « Ambiance » en tête des lieux : l'intro le dit, et chaque image porte son étiquette (le test garde
   ses trois « Ambiance » exacts, plus deux « Ambiance · avant / après »).
5. Dernier appel ajouté (encre, comme partout) avec « Être rappelé » (`depuis=pro`, nouvelle valeur) ; le formulaire
   reste la seule action principale (le lien de l'ouverture, « Envoyer ma demande », le lien du dernier appel).
6. Préchargement de l'« avant » de l'ouverture sur `/pro` aussi (`perf.test.ts` : accueil, prestations, /pro).
7. « Commerce » gardé comme titre de la boutique (c'est le type de lieu du formulaire).

**Tests** : `tunnel.test.ts` « /pro et /contact » : le test de la page rendu en asynchrone avec le CRM simulé (aucune
requête réseau), mêmes intentions (titre, ligne courte dans l'ouverture, **3 `>Ambiance<`** + 2 « Ambiance · avant /
après », jamais « Simulation » ni « Réalisation », arguments, ancre `#devis-pro`, textes de l'ancienne page, FAQ,
**jamais le mot « simulateur »**) + un principal avant le formulaire, deux liens « Demander un devis pro », dernier appel
en encre ; + 2 tests : comptoir en ouverture (seul couple prioritaire, légende, cartels D1 / K1), ordre des lieux, pas de
« Essayer », teinte K1 + D1, bande D1, formulaire posé tel quel ; réalisation PRO d'abord (ouverture « Réalisation,
Lattes », « Nos chantiers », comptoir descendu, cuisine publiée exclue). `ambiances.test.ts` (intégration /pro) : rendu
asynchrone, CRM simulé, matières lues dans les cartels (texte sans balises). `perf.test.ts` : préchargement de /pro.

**Vérification visuelle** : build local comme la CI (`NEXT_PUBLIC_SIMULATE_URL` de production,
`NEXT_PUBLIC_SANS_EVENEMENTS=1`), `next start -p 3100` (arrêté ensuite), Playwright + Edge à 360 × 660, 390 × 660 / 844
et 1 440 × 900, sections différées forcées : aucun débordement à 360 px, 0 image cassée, 0 requête coupée (rien
envoyé, formulaire jamais rempli), LCP = l'après du comptoir (256 à 376 ms ; 644 ms à 360 px). Corrigé après la
première capture : le principal tombait à 661-709 px à 390 × 660 → la ligne passe sous le bouton (591-639 px).

**Problèmes** : le préchargement de l'image de l'accueil arrive aussi sur /pro par le préchargement Next de « / » (connu
depuis C1, F6). Les cartes blanches de `BlocsPrestation` (« En détail ») ne sont toujours pas restylées.

## C5 — `/realisations` (06/10/2026)

**Fait**
- `src/app/realisations/paires.ts` (pur) : `PAIRES_REALISATIONS` — les ouvertures des trois pages de prestation
  (`CAS_PRESTATIONS[…].ouverture.apres`) et le comptoir de `/pro` —, `prixHabituel` (fourchette d'`offre.ts` « fourni
  et posé », durée habituelle pour cuisine et salle de bain, « Sur devis » pour le pro), `pairesRealisations` (paires
  préparées seulement, `depuis=realisations`).
- `page.tsx` : les vraies d'abord (inchangé : `CarteRealisation`, h2 masqué, « Simuler ma pièce »), sinon « Les
  premières réalisations arrivent » sans images ; puis la section séparée **« Avant / après en ambiance »**
  (`id="en-ambiance"`, étiquette en tête, quatre `<article>` en `CarteAmbiance` à la teinte de leur prestation, prix
  habituel, « Essayer cette composition chez moi ») ; avis ; les cinq pièces. Description : « des exemples en
  ambiance, étiquetés comme tels ».
- Retirés (plus rien ne les lisait) : `choisirEtudes`, `etudeCuisineSimulee`, `PAIRES_ETUDES`, `EtudeSimulee` et
  `ALT_AVANT_ETUDE_CUISINE` (`accueil/etudes.ts`), `CarteSimulee` (`RealisationsAccueil.tsx`). Les images de la mission
  19 (`ouverture-cuisine-apres`, `etude-*`) restent : d'autres pages les lisent.
- `docs/SUIVI.md` : `/realisations` décrite à neuf, valeur `realisations` de `PIECE_CHOISIE`.

**Décisions prises seul**
1. Titre « Avant / après en ambiance » (barre espacée, comme partout sur le site) pour la section de l'énoncé.
2. Les quatre paires = les ouvertures des prestations + le comptoir (le plan : cuisine, salle de bain, meubles, pro) ;
   pas de nouvelle sélection.
3. Le prix habituel reste sur chaque paire (la description promet « les prix par projet »), libellé « Prix habituel ».
4. Le bouton principal garde `/simulateur` sans `depuis` (le test l'exige) ; seuls les « Essayer » portent
   `depuis=realisations`.

**Tests** : `autres-pages.test.ts` « /realisations » : le test sans publication réécrit (h1 exact, 4 `<article>`, 4 + 1
« Ambiance · avant / après », jamais « Simulation » ni « simulé », prix, un seul principal `/simulateur`, jamais une
ville, description « exemples en ambiance ») ; + 1 test : la section séparée après les vrais chantiers (avec et sans
publication), 4 curseurs, 4 articles, cartels, prix, teinte, 4 « Essayer » `depuis=realisations` parsés, aucun
principal dedans, `SUIVI.md` ; avec publications : `<article` 2 + 4, les vraies avant la section. `accueil.test.ts` :
le test des études simulées retiré avec le code (son intention — images générées étiquetées « Ambiance », prix
d'`offre.ts`, jamais une ville — passe dans les tests de `/realisations`).

**Tests C2 + C5** : 396 → 398, tous réussis ; `npx eslint .` et `npm run build` passent.

**Vérification visuelle** : même build, 360 × 660 à 1 440 × 900 : aucun débordement, 0 image cassée, 4 curseurs, un
seul principal. Captures hors dépôt dans `scratchpad/m21/c2c5/captures`.

## C3 — `/comment-ca-marche` (06/10/2026)

**Fait** (aucune image régénérée, aucun envoi ; `docs/DESIGN.md` « La page Comment ça marche » et « Les blocs aux
filets », captures `docs/captures/site-3-0/comment-ca-marche-390.jpg` et `comment-ca-marche-1440.jpg`)
- `page.tsx` réécrit, dans l'ordre : titre ; **`CommentOnTravaille`** de l'accueil (ancre `#comment-ca-marche` gardée,
  titre « De la photo à la pose », la ligne « Pas de démontage… » en `note`, preuve `detail-chant` et garanties,
  principal) ; **le déroulé et ses délais** (`#deroule`, six moments : tout de suite, sous 48 h, sur rendez-vous, à la
  commande, le jour de la pose, le soir même ; `mesure-visite` et `outils-pose`) ; **ce qui reste en place** et ce que
  vous préparez (`#en-place`) ; **l'entretien** (`#entretien`, quatre gestes, le guide) ; bande de chêne AG13 ; le
  prix (`#prix`, tableau entre filets) ; « Vos questions » (`#objections`, `#faq`, un seul `FAQPage`) ; l'encart
  **« Quand rénover ? »** (`#quand-renover`, `usure-detail`) ; le devis en ligne (`#devis`) ; les guides (`#guides`) ;
  le **dernier appel en encre** (`#dernier-appel` : « Simuler ma pièce », « Être rappelé » `depuis=comment-ca-marche`).
- Les huit photos : 4 étapes (`etape-photo` « Ambiance », `etape-simulation` « Simulation », `echantillons-table`,
  `pose-mains`), `detail-chant`, `mesure-visite`, `outils-pose`, `usure-detail` — chacune une fois, les six photos
  utiles en « Ambiance » ; celles du déroulé et de l'encart décrites par le texte alternatif de la bibliothèque.
- Textes (`contenu.ts` : `DEROULE`, `RESTE_EN_PLACE`, `A_PREPARER`, `ENTRETIEN`, `QUAND_RENOVER_*`) tirés des guides
  « Comment se passe une pose » et « Entretenir un revêtement adhésif » et des chiffres d'`offre.ts`.
- `CommentOnTravaille` : `id`, `intro` (`null` : sans la phrase sur le covering, que la FAQ de la page dit déjà),
  `note`, `enTete` (section non différée, photo de la première étape prioritaire : c'est le LCP de la page), `depuis`
  accepte `comment-ca-marche`. L'accueil inchangé.
- **Cartes blanches harmonisées** (signalé par C1 / C2) : `BlocsPrestation` (surfaces, atouts, étapes, questions) passe
  aux filets à la teinte de la page (`.filet`), sans fond ni cadre ; étapes à grand numéro ; questions repliées entre
  filets, comme l'accueil. Vaut pour les prestations, `/pro` (« En détail ») et `/comment-ca-marche`.
- Retirés : `components/accueil/CommentCaMarche.tsx` (les trois étapes d'avant) et `lienSimulerCuisine`. `docs/SUIVI.md` :
  valeur `comment-ca-marche` (PIECE_CHOISIE, RAPPEL_DEMANDE, CONTACT_ENVOYE), page décrite à neuf.

**Décisions prises seul**
1. « Simuler ma pièce » (`/simulateur?depuis=comment-ca-marche`) remplace « Simuler ma cuisine » (`projet=cuisine`) :
   la page parle de toutes les pièces, comme l'accueil ; « Estimer sur ma photo » prend la même adresse.
2. Deux principaux (sous les étapes, au dernier appel), comme le plan ; pas de bouton dans le titre (la page se lit).
   Au téléphone, le premier arrive vers 3 150 px — à revoir avec les retouches si Lucas le veut plus haut.
3. Les six moments du déroulé suivent le guide de la pose (photo, devis, visite, commande, pose, vérification) ; aucun
   délai hors d'`offre.ts` : le temps entre la commande et la pose n'est pas promis (« on fixe la date avec vous »).
4. « Ce qui reste en place » s'en tient à ce que le site dit déjà (rien démonté, poignées et charnières en place, plan
   habillé sans dépose, carrelage recouvert) ; « Quand rénover ? » dit aussi quand le film ne suffit pas (panneau
   gonflé), honnêtement.
5. L'objection « Comment l'entretenir ? » reste (FAQ balisée), la section « L'entretien » détaille sans répéter sa
   réponse mot pour mot.
6. Une bande de matière (chêne AG13) entre l'entretien et le prix, pour couper la page.

**Tests** : 398 → 401, tous réussis. `autres-pages.test.ts` « /comment-ca-marche » : le test d'ordre réécrit (les six
ancres d'avant dans le même ordre, plus `deroule`, `en-place`, `entretien`, `quand-renover`, `dernier-appel` ; deux
principaux « Simuler ma pièce » `depuis=comment-ca-marche` au lieu de « Simuler ma cuisine » ; `<picture` 3 → 8,
chaque image une fois) ; « Estimer sur ma photo » à la nouvelle adresse ; + 3 tests : étiquettes (7 « Ambiance », 1
« Simulation », jamais « Réalisation », photos dans leur section, textes alternatifs, une seule image prioritaire,
étapes non différées), délais d'`offre.ts` seulement / en place / entretien / encart / dernier appel en encre, filets
au lieu des cartes (page et `BlocsPrestation`, grand numéro, `CommentCaMarche` retiré). `accueil.test.ts` : l'assertion
sur `lienSimulerCuisine` remplacée par celle de `depuis=comment-ca-marche`. `tunnel.test.ts` inchangé (passe).

**Vérification visuelle** : build local comme la CI, `next start -p 3100` (arrêté ensuite), Playwright + Edge à
360 × 660, 390 × 660 / 844, 1 024 et 1 440 px, sections différées forcées : aucun débordement, 0 image cassée, 0 requête
coupée (rien envoyé), 2 principaux, LCP = la photo de la première étape (188 à 312 ms ; 564 ms à 360 px). Blocs
restylés regardés sur `/prestations/cuisine` et `/pro`. Corrigé après la première capture : les guides alignés sur les
autres sections (`large`), la première photo des étapes prioritaire.

**Problèmes** : la page est longue au téléphone (13 800 px : c'est la page qu'on lit). Restent en cartes blanches
(hors de ce lot) : formulaires, avis, cartes de réalisation, pages zones / CGV / blog.

## C4 — `/inspirations` (06/10/2026)

**Fait** (aucune image régénérée, aucun envoi ; `docs/DESIGN.md` « La page Inspirations »)
- **Toutes les ambiances**, 52 : les 14 de la série 1, les 36 « après » de la série 2, les 2 ambiances ; un « avant »
  n'apparaît que dans le curseur de ses « après ».
- **La carte des pages de prestation** (`CarteAmbiance`) sur chacune : titre en `h2`, curseur « Ambiance · avant /
  après » pour les 41 paires (36 de la série 2, 5 de la série 1), photo « Ambiance » pour les 11 autres, cartels de la
  composition (chacun mène à `/matieres?ref=`), « Essayer cette composition chez moi » (`depuis=inspirations`).
  `CarteAmbiance` gagne `balise`, `priorite` (photo seule seulement) et `liensMatieres`.
- **Praticable** : grille dense (1, 2 puis 3 colonnes), pièces mêlées (`_components/ordre.ts`, `ordreInspirations` :
  une photo seule de cuisine en tête, puis une pièce après l'autre, le premier « après » de chaque avant avant le
  second), **12 premières du choix en cours** puis « Voir toutes les ambiances » (« 40 de plus »). Sans JavaScript :
  une case à cocher et des règles écrites par le serveur (`reglesSuite`, `suitesDesAmbiances`, `data-suite`), comme
  les filtres ; rien dans `globals.css` (194 lignes, plafond 200). Le serveur rend les 52 ; la suite masquée ne charge
  pas ses images (4 à 16 images au premier chargement, 21 après défilement complet). 18 800 → 3 734 px à 1 440 px,
  8 787 px à 390 px.
- **Ancres** : une ambiance visée par l'adresse (`#<id>`, `:target`) se montre même dans la suite (vérifié à 390 et
  1 440 px). La rangée « Ambiances » de l'accueil y mène par un lien de page (`<a>`), plus par `Link` (la navigation du
  routeur ne pose pas `:target`).
- Retirés (plus rien ne les lisait) : `PhotoAmbiance` et `LegendeMatieres` (le calque d'étiquettes sur la photo et sa
  légende) ; `CalqueMatieres` reste (curseur, tests). `docs/SUIVI.md` : valeur `inspirations`, page décrite.

**Décisions prises seul**
1. « Voir toutes les ambiances » plutôt qu'une pagination par adresse : les filtres restent sans JavaScript et
   combinables, la page reste statique et entière pour le référencement. 12 premières : 4 rangées à 1 440 px, environ
   6 000 px au téléphone.
2. La composition en cartels sous l'image, comme partout au site 3.0, au lieu des étiquettes posées sur la photo
   (illisibles sur une carte de 360 px).
3. Ordre : la première ambiance simple de la cuisine en tête (`cuisine-ilot-vert`), seule image prioritaire ; aucune
   autre image en chargement immédiat (en colonnes, les cartes 2 et 3 ne sont pas au premier écran du téléphone).
4. Les cartels sur deux colonnes à toutes les largeurs (cartes plus courtes), au prix d'une finition renvoyée à la
   ligne à 1 440 px.

**Tests** : 401 → 410, tous réussis. Nouveau `src/app/inspirations/inspirations.test.ts` (9) : l'ordre (mêmes 52,
photo seule de cuisine en tête, toutes les pièces dans les 12 premières, jamais deux « après » d'un même avant à la
suite) ; la suite (jetons par combinaison, règles : masquée sauf `:target`, bouton et reste comptés, rien pour une
combinaison courte) ; la page rendue (52 cartes, ancres et données de filtre, 52 `h2`, grille ; une étiquette par
carte, 41 curseurs, un avant seulement dans un curseur, 93 `<picture`, jamais « Simulation » ni « Réalisation » ;
« Essayer » parsé par `lireDepuis` / `lireComposition` et cartels vers leur matière ; une seule image prioritaire, la
première carte, aucune autre en `eager` ; 40 cartes dans la suite, règle `:not(:target)`, « 40 de plus », la case ;
aucun « use client », plus de `PhotoAmbiance`, l'accueil sans `Link` vers les ancres). `ambiances.test.ts` inchangé
(52 inspirations, filtres sans JavaScript, rangée `relative` : passent).

**Vérification visuelle** : même build, `next start -p 3100` (arrêté ensuite), Playwright + Edge à 360 × 660,
390 × 660 / 844, 1 024 et 1 440 px : aucun débordement de page (les pastilles de filtre défilent dans leur rangée),
0 image cassée, 0 requête coupée ; 12 cartes visibles, « Salle de bain » → 8 sans bouton, « Cuisine » → 12 et « 13 de
plus », la case → 52 ; ancre dans la suite montrée en haut d'écran. Captures hors dépôt dans `scratchpad/m21/c3c4`.

**Problèmes** : le « Vue dans » de `/matieres` navigue par le routeur (`router.push`) : une ambiance de la suite n'y est
pas montrée à l'arrivée (on reste en haut de /inspirations) — à passer en lien de page avec la phase D, qui refait les
fiches. Le HTML de la page pèse ≈ 400 Ko non compressé (93 `<picture` avec leurs sources) ; à surveiller en F6.

## C6 — Espace client (06/10/2026)

**Fait** (aucune génération, aucun envoi ; `docs/DESIGN.md` « L'espace client », table écrite avant le remplacement)
- **Les jetons partout dans `src/components/espace/`** : 522 couleurs écrites en dur remplacées par la table (neutres →
  `encre` / `encre-2` / `trait` / `fond` / `fond-2` / `blanc`, verts → `succes*`, ambres et rouges d'erreur →
  `alerte-*`, `black/…` → `encre` / `sombre`), puis les cas tranchés à la main. Formes, tailles, textes et logique de la
  mission 18 (étapes, `devisASigner`, `prochainPas`, paiement) inchangés.
- **Le rouge sur les boutons principaux seulement** : `BoutonPrincipal`, `LienPrincipal` et « Réessayer » prennent
  `TEINTE_PRINCIPALE` de `Bouton.tsx` ; tout le reste du rouge passe à l'encre (icône du téléphone, trait de l'onglet
  actif, point « prochaine étape », puces, étoiles, « Ouvrir », lien du PDF, pastilles « Nouveau » et « À vous »,
  « Copier »), la croix d'un mauvais exemple photo au brun. Surtitre `ton="rouge"` → `ton="fort"` (encre).
- **Montants** en `font-sans tabular-nums` (devis, lignes, acompte, solde, paiement), comme `BlocPrix` ; dans une phrase,
  `tabular-nums`.
- **Pictos** : « Quelles photos prendre » (cuisine) montre `picto-cuisine` (`picto-plan-de-travail` pour la prise du
  plan) à 96 px ; les cartes de pièce sans photo (`CartesPieces`, l'espace) montrent le picto de la famille
  (`DessinFamille enSvg`, toujours un `<svg>` par carte). Supprimés : `SalleDeBainDeFace`, `MobilierDeFace`,
  `ProfessionnelDeFace`, `MursDeFace` ; `CuisineDeFace` reste pour l'écran Photo du simulateur (lot E2), passé aux
  `var(--color-*)` (zone allumée en voile d'encre).
- La signature trace à la couleur calculée de sa toile (`text-encre`) au lieu d'un hexa.

**Décisions prises seul**
1. « Contact » avait deux boutons rouges : « Envoyer mon message » reste principal, « Appeler » passe à l'encre pleine.
2. Les pastilles de « Mes projets » : « À vous » en encre pleine, « CoverSwap prépare » en fond-2, « En cours » en
   brun (alerte), « Terminé » en vert. Le point « prochaine étape » de la barre d'onglets est à l'encre.
3. Les gris trop pâles des textes (`#8A857E`, 3,6:1 ; `#9A958E`, 2,9:1) montent à `encre-2` (6,14:1) et `encre-2/70`
   (3,16:1, onglet pas encore ouvert) ; les contours des cases à cocher carrées à `encre-2`.
4. Les ombres (`rgba(26,26,26,…)`) et le reflet du « contre-jour » restent en `rgba()` : des effets, pas des couleurs ;
   le test ne vise que l'hexa et la palette Tailwind. Aucune exception hexa.
5. Les sous-parties (« Meubles hauts », « Crédence »…) n'avaient pas de dessin : pas de picto ajouté (rien d'autre ne
   change).

**Tests** : 410 → 415, tous réussis. `theme.test.ts` : le « rouge réservé » relit maintenant l'espace (même liste de
quatre fichiers permis) ; nouveau bloc « lot C6 » (4) : aucun hexa ni palette Tailwind dans `components/espace/`, le
rouge sur `BoutonPrincipal` / `LienPrincipal` / « Réessayer » seulement et plus de surtitre rouge, dessins des pièces
retirés et pictos posés, montants en `tabular-nums` sans `font-display`. `cartes-pieces.test.ts` : + 1 (le picto de la
famille de chaque pièce, fichier présent). Tests existants de l'espace (`lib/espace/*`, `ambiances`, `elements`)
inchangés et verts. `npx eslint .` et `npm run build` passent.

**Vérification visuelle** : build local, `next start -p 3100` (arrêté ensuite), Playwright + Edge avec un état d'essai
injecté par interception (un client fictif, deux scénarios : devis à signer, acompte à régler) ; TOUTES les requêtes
hors de localhost interceptées (le GET de l'espace répondu par l'état d'essai, les images par des images du dépôt, les
gestes POST répondus en local) : aucun espace réel, rien envoyé au CRM. Accueil, photos, projet, simulations (et
« Créer une simulation »), devis, devis signé, paiement verrouillé et ouvert, mes projets, contact à 390 et 1 440 px,
cinq écrans à 360 px : aucun débordement, un seul bouton rouge plein par écran (plus le losange du logo). Captures hors
dépôt dans `scratchpad/m21/c6/captures`, script `c6/espace-essai.mjs`.

**Problèmes** : aucun bloquant. L'espace garde son dessin propre (cartes blanches arrondies, 17 px) : seules les
couleurs ont changé, comme demandé ; son fond est le papier uni (`bg-fond` posé sur le grain du `body`), comme avant.

## C7 — Le blog (06/10/2026)

**Fait** (aucune image régénérée, aucun envoi ; `docs/DESIGN.md` « Les guides du blog », `docs/SEO.md`, `docs/SUIVI.md`)
- **Trois guides** en tête de `src/data/blog-articles.ts`, à la première personne du pluriel, sans aucun montant écrit :
  « Cuisine bordeaux brillante : la rénover sans la changer » (621 mots), « Cuisine blanche qui a jauni : que faire ? »
  (603 mots), « Covering, peinture ou remplacement : le vrai comparatif » (528 mots) — titre, intro, sections, astuce
  et conclusion comptés. Prix : la section « Comment se fait le prix » / « Le prix » montre les tarifs publiés de la
  cuisine (`ContenuPrix`, « Sur devis » quand le CRM n'en publie pas, son repli documenté s'il ne répond pas) ; la
  peinture et le remplacement : « demandez des devis », aucun chiffre.
- **La bibliothèque** : `paire` (l'« après » d'une paire, curseur « Ambiance · avant / après » d'ouverture,
  prioritaire, avec sa phrase, ses cartels et « Essayer cette composition chez moi »), `imagePreparee` (photo utile
  « Ambiance » d'ouverture), `image` d'une section (le second « après » en `CarteAmbiance`, ou une photo utile) ;
  `image` (photo de fond) devient optionnelle par un type union (une seule ouverture par guide). Bordeaux : les deux
  après de la paire ; jaunie : les deux après et `usure-detail` ; comparatif : `pose-mains`, `outils-pose`.
- **`src/app/blog/[slug]/illustration.ts`** (pur, testé) : `illustrationDe` (une paire seulement pour un « après »
  nommé, jamais un avant seul), `imageDuBalisage` (`Article.image` = `/images/prep/<nom>-1536.jpg`, la plus grande
  largeur préparée ; photo de fond 1600 px pour les neuf premiers guides), `actionDuGuide`, `insecables`.
- **La page** passe au papier du gabarit, sans carte blanche (filets d'encre ; colonne de lecture de 768 px, colonne
  de 300 px dès 1 024 px), pour les douze guides. Un seul principal : « Simuler ma cuisine » (`?projet=cuisine&depuis=blog`)
  pour les trois guides de cuisine, « Simuler ma pièce » (`?depuis=blog`) pour les autres (avant : « Simuler mon
  projet », `/simulateur` sans `depuis`). « Pour aller plus loin » : prestation cuisine, simulateur, guides voisins.
  Les tarifs ne sont lus au CRM que pour un guide qui les montre (les neuf autres : aucun appel).
- **Maillage** : comparatif ↔ `covering-adhesif-vs-peinture-cuisine` et ↔ `prix-renovation-cuisine-covering`
  (`relatedSlugs` des deux côtés, plus deux liens du comparatif) ; bordeaux ↔ jaunie ↔ comparatif. Les trois sont listés
  à `/comment-ca-marche#guides` (en tête), au plan du site et dans `llms.txt` (automatique).

**Décisions prises seul**
1. Deux curseurs dans les articles de cuisine (les deux « après » de la paire) : « deux directions pour la même
   cuisine » est le cœur utile de l'article ; l'ouverture prend l'après « couleur » (bordeaux → vert profond, comme
   l'accueil) ou « bois » (jaunie → chêne pâle).
2. Le comparatif ne cannibalise pas ses voisins : trois options, quatre critères (délai, poussière, réversibilité,
   durée) et « quand ne pas choisir le covering » ; le face-à-face film/peinture (rendu, tenue) et la lecture du devis
   restent dans les deux guides existants, vers lesquels il renvoie (intentions dans `docs/SEO.md`).
3. Le texte ne nomme pas les références (elles sont dans les cartels sous l'image) : il ne peut pas diverger des
   données de la bibliothèque.
4. Le restyle de la page vaut pour les douze guides (le lot précédent laissait le blog en cartes blanches) ; les photos
   de fond des neuf premiers restent sans étiquette (de vraies photos, décoratives, comme avant).
5. Espace insécable devant « : ; ? ! » dans tout ce que la page affiche (`String.fromCharCode(160)`, aucun caractère
   invisible tapé) : le titre ne casse plus avant son deux-points.
6. Dates des trois guides : 6 octobre 2026 ; temps de lecture « 3 min ». Pas d'image de partage propre (lot F2 : les
   images de partage composées et étiquetées).

**Tests** : 415 → 427, tous réussis. Nouveau `src/app/blog/guides.test.ts` (12) : titres de l'énoncé et images prévues
(les deux après de chaque paire), une seule ouverture par guide et chaque image résolue (un avant seul jamais), 400 à
800 mots et description ≤ 155, aucun « € » dans leur texte ni `\d+ €` dans les sources du blog, liens réciproques et
les quatre critères ; page rendue : 2 curseurs « Ambiance · avant / après » (bordeaux, jaunie), « Ambiance » sur les
photos utiles, jamais « Réalisation » / « Simulation », images prioritaires = l'ouverture seule ; « Essayer » parsé par
`lireDepuis` / `lireComposition`, un seul principal, prestation et voisins ; prix du CRM tels quels / « Sur devis » /
repli, aucun appel pour un guide sans prix ; `ArticleSchema` sur l'image `-1536.jpg` du manifeste (fichier présent) ou la
photo de fond ; page sans carte blanche ; typographie. `autres-pages.test.ts` : la boucle de l'illustration ne vise plus
que les 9 guides à photo de fond, `sizes` de la nouvelle colonne (768 px, `calc(100vw - 32px)`). `npx eslint .` et
`npm run build` passent (les trois guides en statique, revalidés à l'heure pour les prix).

**Vérification visuelle** : build local, `next start -p 3100` (arrêté ensuite), Playwright + Edge à 360 × 660,
390 × 660 / 844, 1 024 et 1 440 px sur les trois guides et un ancien (`entretenir-revetement-adhesif`) : aucun
débordement, 0 image cassée, 0 requête coupée (rien envoyé), un principal par page, LCP = l'ouverture (188 à 260 ms ;
696 ms à 360 px pour bordeaux). Corrigé après la première capture : le « : » du titre seul en début de ligne à 1 440 px.
Captures hors dépôt dans `scratchpad/m21/c7/cap`.

**Problèmes** : au téléphone, le principal de la colonne arrive après l'article (≈ 5 100 px) ; les liens « Essayer »
et « Pour aller plus loin » le relaient plus haut. Le guide `prix-renovation-cuisine-covering` (d'avant le site 3.0)
écrit encore des fourchettes par `euros(900)` … `euros(1200)` dans son texte, hors des tarifs du CRM : à revoir avec
F1 / les tarifs.

## D1 — teinte, ΔE, indexation (06/10/2026)

**Fait** (fonctions pures, aucun affichage changé)
- `src/lib/teintes.ts` : `labDeHex` (sRGB → Lab D65, la conversion de `lib/ambiances` déplacée ici ; `lab` y reste
  comme alias), `lchDeHex`, `deltaE` (CIEDE2000, kL = kC = kH = 1 : il n'existait encore nulle part dans le site, le
  relevé des ambiances vivait au CRM) et `deltaEHex` ; `cleDeTeinte` / `trierParTeinte` (le nuancier) ;
  `matieresProches(ref, catalogue, 6, { memeFamille })` (ΔE croissant puis référence, sans elle-même).
- `src/lib/indexation-matieres.ts` : `vueDans()` (déplacée de `lib/ambiances`, qui la réexporte ; chaque entrée porte
  maintenant `image` et `piece` en plus de `id` et `titre`, pour les fiches de D4), `referencesVedettes()` (les 8 de
  l'accueil et les vedettes des pages de prestation), `fichesIndexees()` / `estFicheIndexee()`,
  `prestationsDeFamille()` (bois, couleurs, pierres, bétons → cuisine, salle de bain, meubles ; métaux, textiles,
  paillettes → meubles, `/pro`).
- `Matiere` (`lib/matieres.ts`) gagne `hex` (déjà dans `revetements.json`).

**Décisions prises seul**
1. **52 fiches indexées au lieu des 40 de l'énoncé** (décision déjà prise au plan) : toutes les matières qui
   apparaissent dans une ambiance d'inspiration des séries 1 et 2 (49 : 22 dans la série 1, 39 dans la série 2, des communes aux deux) et
   les vedettes qui n'y sont pas (NF27, J3, Q1). Les vedettes des pages de prestation sont toutes déjà dans une
   ambiance. AF02 n'est vue que dans `pose-mains` (photo utile, `inspiration: false`) : ni « Vue dans », ni indexée.
   Les 445 autres fiches : `noindex, follow` (D4).
2. **Nuancier** : les couleurs d'abord, par cases de teinte de 15° (rouge → orangé → jaune → vert → bleu → violet), du
   plus clair au plus foncé dans chaque case ; puis les neutres à part (chroma < 8, 160 matières), du blanc au noir. Le
   plan mettait les neutres « à part » sans dire où : au bout, pour que le premier écran du présentoir montre des
   teintes (terracotta, rouges, bois roux) plutôt que trente blancs. Les cases (et non l'angle brut) font des dégradés
   lisibles dans les 267 bois, presque tous entre 60° et 90°.
3. Matières proches : sur tout le catalogue par défaut (une couleur proche d'un bois se montre), `memeFamille` pour
   les fiches qui le voudront.

**Tests** : 427 → 436, tous réussis. Nouveau `src/lib/teintes.test.ts` (9) : Lab du blanc et du noir, une seule
conversion ; CIEDE2000 sur neuf paires de référence de Sharma, Wu et Dalal (2005) à 1e-4 ; zéro, symétrie ; un
nuancier connu (rouge → violet, puis blanc, gris, noir ; trois bois d'une même case du clair au foncé) ; le catalogue
rangé (permutation, liste reçue intacte, couleurs avant neutres, clé croissante) ; 6 proches sans la référence, aucun
oubli, `memeFamille` ; 52 fiches (écrit en dur), AF02 absente, NF27 / J3 / Q1 présentes, les 49 vues ; « Vue dans »
sur les deux séries, inspiration seulement, image et pièce exactes, ordre de `data/ambiances` ; prestations par
famille. `ambiances.test.ts` inchangé et vert (réexport de `vueDans`).

## D2 — `/matieres`, le présentoir (06/10/2026)

**Fait** (aucune image générée, aucun envoi ; `docs/DESIGN.md` « Le présentoir », `docs/SUIVI.md`)
- **Les tiroirs** (`tiroirs()` de `lib/matieres`) : « Tout », puis bois 267, couleurs 89, textiles 41, pierres 36,
  métaux 31, bétons et stucs 17, paillettes 16 (vérifiés dans `revetements.json`, écrits en dur dans le test), puis
  « Favoris » ; quatre teintes du nuancier de chaque famille en pastilles CSS. Barre collée, qui défile au téléphone et
  passe sur deux rangées dès 1 024 px (sur une seule, Paillettes et Favoris sortaient de l'écran à 1 440 px).
- **Filtres** : teinte (`<select>`, les neuf teintes de /inspirations), finition (`choixFinitions` : Structurée 6,
  Rustique 1, Pailletée 16), « Vue dans une ambiance » (49), combinables entre eux, avec le tiroir et la recherche par
  nom ou référence (inchangée, différée de 150 ms) ; « Effacer les filtres » ; le compte dit l'affinage.
- **Les échantillons** : `VignetteEchantillon` (extraite d'`Echantillon`, rendu inchangé) dans un bouton, avec le
  `Cartel` (nouvelle option `balise="span"`) ; 2 / 3 / 5 colonnes (`GRILLE_ECHANTILLONS` remplace
  `GRILLE_TUILES_GRANDES`, squelette au gabarit du cartel) ; 5 premières vignettes en chargement immédiat, le reste
  `lazy` ; 30 par 30. Tri `trierParTeinte(filtrerMatieres(…))`, hors du filtre (la feuille du simulateur garde l'ordre
  du catalogue) ; le serveur rend `premieresDuPresentoir` (les 30 premières du nuancier).
- **La matière en grand** : son cartel, « Vue dans » en **liens de page** `<a href="/inspirations#<id>">` (signalé en
  C4 : une ambiance de la suite masquée s'ouvre maintenant ; vérifié avec `amb-couloir-portes`, affichée en haut
  d'écran), « Essayer sur ma photo » → `lienEssayer(ref, "matieres")` (`&depuis=matieres` ; `lienEssayer("K1")`
  inchangé).
- Page : plus de `bg-fond` (le grain du gabarit passe), h1 et intro gardés (« … rangées par teinte. Touchez-en une pour
  la voir. »), bande de matière Original Oak AA14 en fin de page. `teinteDe` et `TEINTES` passent dans `lib/teintes`
  (réexportés par `lib/ambiances`) : le présentoir les lit dans le navigateur sans tirer les ambiances ni le catalogue.

**Décisions prises seul**
1. La bande de matière **ferme** le présentoir au lieu de l'ouvrir : en tête, elle repoussait la première rangée
   d'échantillons hors du premier écran à 390 px (elle commence à 652 px) et risquait de devenir le LCP (image du CRM,
   chargée en différé).
2. Grille à **2 colonnes au téléphone** (3 avant) : le cartel « Nom · RÉF · famille · finition » a besoin de 170 px.
3. **Teinte des verts et bleus très foncés** : Deep Green NF13, Midnight Blue M9 et Deep Blue NF14 étaient classés
   « Noir » (clarté < 22) ; ils vont maintenant avec « Vert » / « Bleu » (chroma ≥ 6 dans ces teintes). Vaut aussi pour
   les filtres de /inspirations (la cuisine vert profond se trouve sous « Vert »). K1 et Black Disco restent noirs.
4. Pas de « Voir la fiche » dans la matière en grand : les fiches arrivent en D4 (le lien y sera ajouté), un lien vers
   une page qui n'existe pas encore serait cassé sur la prévisualisation.
5. Noms des tiroirs au pluriel (`TIROIRS`), libellés de l'énoncé ; les familles du simulateur (`FAMILLES`) gardent les
   leurs. Les finitions disent seulement le mot français (« Structurée ») : le terme du fabricant n'apporte rien au
   visiteur.
6. `TuileFilm taille="grand"` n'est plus utilisé par /matieres ; laissé tel quel (son test de chargement différé reste).

**Tests** : 436 → 440, tous réussis. `matieres.test.ts` (+3, adaptés en gardant leur intention) : l'affinage (teinte,
finition — les 6 structurées, AA15 rustique, 16 pailletées —, « vue dans » = les 49 références, combinés, ordre du
catalogue gardé par le filtre), les tiroirs et finitions écrits en dur, un affinage avant le catalogue attend et son
message ; page rendue : grille seule comptée (30 vignettes), ordre du nuancier, 5 `eager` / 25 `lazy`, échantillon
arrondi à l'ombre sur la couleur de la matière, cartel dans le bouton (aucun `<p>`), tiroirs et 32 pastilles, filtres,
bande AA14 après la grille, « Voir plus (467) » ; regex « Essayer » avec `depuis`, `Cartel`, « Vue dans » en lien de
page (plus par `aller`) ; squelette au gabarit du cartel ; `scroll-mt` à 200 px dès 1 024 px. `perf.test.ts` : la
nouvelle signature (tri hors du filtre, en `useMemo`), première rangée immédiate, vignettes de l'échantillon en `lazy`.
`teintes.test.ts` +1 (verts et bleus très foncés). `npx eslint .` et `npm run build` passent.

**Vérification visuelle** : build local construit comme la CI (`NEXT_PUBLIC_SIMULATE_URL` = CRM de production, en
lecture : vignettes ; `NEXT_PUBLIC_SANS_EVENEMENTS=1`), `next start -p 3100` arrêté ensuite ; `scripts/captures.mjs`
(Edge) à 390 et 1 440 px → `docs/captures/site-3-0/matieres-390.jpg` et `matieres-1440.jpg` ; aucun débordement à
360 px, 0 requête coupée. Essai scripté (Playwright + Edge, POST et routes du simulateur coupés : rien n'est parti) à
390 et 1 440 px : vignettes de la première rangée chargées (320 px), Bois 267 → Bois clair 172 → vues dans une ambiance
7, Structurée 6, recherche « NF13 » 1, matière en grand avec ses 4 « Vue dans », lien vers `#amb-couloir-portes`
(dans la suite masquée) montré, `?ref=D1` ouvre la matière, aucune erreur de page.

**Problèmes** : aucun bloquant. Le menu de la teinte au téléphone est le `<select>` natif (lisible, accessible, sans
JavaScript de plus) ; à revoir seulement si Lucas veut des pastilles.


## Relecture adverse des phases B et C — corrections (06/10/2026)

Les constats de la relecture (a7dd5a6..1b271b4), un par un, et leur sort. Aucune image générée, aucun appel d'API
d'images, aucun formulaire envoyé.

**Importants**
1. **Prix écrits en dur contre le CRM** — corrigé. `tarifDeLaFamille` (`BlocPrix.tsx`) donne le tarif d'une famille
   lu au CRM (« 110 €/ml », « dès 50 €/ml », `null` = « Sur devis », la plage au mètre linéaire sans le CRM) ; les
   paires de `/realisations` l'affichent (« Notre tarif : … », `chargerTarifs` dans la page). `/comment-ca-marche` :
   la table des fourchettes est remplacée par `ContenuPrix` (les tarifs de l'accueil ; page `async`, revalidée à
   l'heure). Repli de `BlocPrix` : la plage au mètre linéaire seule et une phrase, plus de fourchette par pièce (et
   plus de `<p>` dans le `<dl>`). Vérifiés au passage et corrigés de même : le texte, la FAQ et la description des
   pages de prestation (la salle de bain disait « 1 200 € à 2 500 € » juste au-dessus du « Sur devis » du CRM), la
   FAQ générale, `llms.txt`, les guides (`prix-renovation-cuisine-covering` : section « Nos tarifs publiés » avec
   `prix: ["CUISINE"]`, plus de `euros(900)`… ; peinture, salle de bain, location : idem), et la carte d'un chantier
   publié sans prix (plus de « Prix habituel : fourchette », la durée habituelle reste). `FOURCHETTES` ne sert plus
   qu'au repli de l'estimation du simulateur (`lib/estimation.ts`, testé).
2. **Blog : ambiance présentée comme un essai réel** — corrigé : « Ces deux images d'ambiance montrent deux partis… »,
   « comme sur ces images », « Une cuisine en L, façades et plan de travail… », « Sur ces deux images d'ambiance, le
   carrelage à frise reste tel quel », et « Sur cette image d'ambiance, trois choses à repérer » (usure-detail).
3. **/inspirations sans action principale** — corrigé : « Simuler ma pièce » (`depuis=inspirations`) après la grille,
   « Voir les matières » à côté en secondaire.
4. **`etape-simulation` montrait « Cuisine : 1200 à 3 500 € »** — corrigé par recadrage local (sharp, `extract` 195,
   185, 538 × 359, au rapport 3/2 du cadre) sur le curseur avant / après seul ; source remplacée dans
   `public/images/sources`, `npm run images` (480 et 538 px, manifeste réécrit, empreinte `73d354f50b42`).
   Limite : 538 px de large, un peu doux sur un écran de téléphone à forte densité ; l'étiquette « Simulation » du
   site recouvre le « Avant » de la capture.

**Mineurs**
1. **Accueil : la réalisation de l'ouverture répétée en 1re carte** — corrigé : `realisationsAccueil(realisations,
   ouverture?.idPublication)` ; si c'était la seule, la section dit « Nos réalisations » (plus « arrivent ») et garde
   « Voir les réalisations » (`ouvertureReelle`).
2. **Pied de page : « Pro » 25 × 44, « CGV » 30 × 44** — corrigé : `min-w-[44px]` sur tous les liens (mesuré 44 × 44).
3. **/realisations : « Simuler ma pièce » sans `depuis`** — corrigé : `lienSimuler({ depuis: "realisations" })`.
4. **Pas de principal au premier écran** — corrigé : `/comment-ca-marche` le pose sous le titre (bas du bouton à
   363 px à 1 440, dans le premier écran à 390) ; les guides le posent sous le titre jusqu'à 1 024 px (`lg:hidden`, à
   298 px à 390), la colonne le garde au-delà (478 px à 1 440).
5. **Focus perdu à la fermeture d'« Être rappelé »** — corrigé pour toutes les feuilles : `retenirLeFocus`
   (`simulation/saisie.ts`) retient l'élément actif à l'ouverture et le lui rend après `liberer()` (s'il est encore
   dans la page, jamais `<body>`). Vérifié : Échap → `BUTTON « Être rappelé »` à 390 et 1 440 px.
6. **« Hêtre des années 2000 » contre « Cuisine en L des années 1970 »** — corrigé dans
   `scripts/bibliotheque/reglages.json` (l'avant et ses deux après), `npm run bibliotheque` (0 image produite, seul
   `ambiances-serie-2.ts` change ; il reste égal à la sortie du script, `bibliotheque.test.ts`).
7. **`suite=1` mort** — corrigé : retiré de `Simulateur.tsx` et de `decisionAuMontage` (`depuisAccueil`), l'émetteur
   n'est plus pré-marqué ; `docs/SUIVI.md` le dit (`PHOTO_CHARGEE` ne part que du simulateur, sans `depuis`).
8. **Picto sans effet avec une photo en mémoire** — gardé (décision la plus simple) : ce n'est pas « sans effet » —
   la pièce de l'adresse est présélectionnée et le bandeau de reprise passe d'abord, rien n'est écrasé ; photo trop
   vieille : écran 1, pièce présélectionnée. Documenté dans `reprise.ts` et `SUIVI.md`, verrouillé par les tests.
9. **Onglet verrouillé de l'espace à 2,91:1** — corrigé : `text-encre-2` plein (≥ 4,5:1 sur blanc, papier, fond-2),
   le cadenas et l'`aria-label` « pas encore ouvert » disent l'état.

**Noté, non corrigé** : l'ordre du § C.1 (« Des cuisines comme la vôtre » avant les réalisations) reste celui de
l'énoncé.

**Tests** : 440 → 451, tous réussis. Nouveaux : tarif d'une famille ; `FOURCHETTES` limité à l'estimation et absent de
la FAQ ; tarifs du CRM sur les paires, `/comment-ca-marche` (plus de table) et le repli ; aucun montant par pièce dans
les prestations ni les guides, tarifs publiés dans les quatre guides de prix ; aucune ambiance présentée comme un
essai ; principal de `/inspirations` ; Hêtre / années 2000 ; capture recadrée (538 × 359, empreinte) ; pied à 44 px ;
focus rendu (fonction et branchement) ; onglet verrouillé ; `suite=1` retiré. Adaptés en gardant leur intention :
`/realisations` (principal avec `depuis`, tarif du CRM), `/comment-ca-marche` (trois principaux, le premier sous le
titre ; page `async`), guides (le même principal deux fois, sous le titre et en colonne), réalisations de l'accueil
(sans prix publié : aucun prix), `reprise.test.ts` (sans `depuisAccueil`), `tunnel.test.ts` (page `async`, CRM coupé).
`npx eslint .` et `npm run build` passent.

**Vérification visuelle** : build local (CRM de production en lecture), `next start -p 3100` arrêté ensuite ;
`scripts/captures.mjs` (Edge) à 390 et 1 440 px sur l'accueil, `/realisations`, `/comment-ca-marche`, `/inspirations`,
deux guides et `/prestations/salle-de-bain` : aucun débordement à 360 px, 0 requête coupée. Captures de référence
`accueil-*` et `comment-ca-marche-*` de `docs/captures/site-3-0` refaites ; les autres dans `scratchpad/m21/rbc`.

## D3 — `/matieres/<famille>` (06/10/2026)

**Fait** (aucune image générée, aucun envoi ; `docs/DESIGN.md` « Les pages de famille », `docs/SUIVI.md`)
- **Sept pages statiques** `src/app/matieres/[famille]/page.tsx` : `bois`, `couleur`, `textile`, `pierre`, `metal`,
  `beton`, `paillettes` (les identifiants du catalogue, ceux de `?famille=` et des futures fiches
  `/matieres/<famille>/<REF>` ; `SLUGS_FAMILLES`, écrits en dur dans le test). `dynamicParams = false` et `notFound()`
  par sûreté : `/matieres/inconnue`, `/matieres/bois/x` → 404 (vérifié sur le build).
- **Les textes** `src/data/textes-familles.ts`, écrits à la main, « on » / « nous », quatre parties (ce que c'est, où
  ça se pose, l'entretien, les limites). Mots (accroche + texte / texte seul, rendu dans la page) : bois 419 / 398,
  couleurs 408 / 388, textiles 346 / 330, pierres 375 / 353, métaux 347 / 331, bétons et stucs 365 / 351, paillettes
  349 / 329. Rien sur les performances techniques (ni norme, ni épaisseur, ni durée, ni tenue chiffrée) : ce qu'on
  fait (échantillons chez vous, cas par cas près des plaques), ce qu'on déconseille (métaux, textiles, paillettes ni
  sur un plan de travail ni près de l'eau, comme `prestationsDeFamille`), ce que le film n'est pas. Entretien repris
  de `/comment-ca-marche`. Aucun montant. Les détails de catalogue sont vérifiés dans `revetements.json` (six chênes
  structurés et un rustique, deux unis laqués, trois rayés, la série de cuirs LP, les noms cités).
- **La page** : fil d'Ariane visible + `BreadcrumbList` (Accueil › Matières › famille), titre ≤ 60 et description ≤ 155
  (`metadonneesPage`, canonique `/matieres/<famille>`), principal « Essayer un bois sur ma photo »…, « Les voir en vrai
  chez moi », la bande de toutes ses teintes (un dégradé CSS à arrêts francs, `degradeDeTeintes`), le texte, une bande
  de matière (sa première vedette), trois ambiances (`ambiancesDeFamille` : la plus grande part de surfaces de la
  famille d'abord, une pièce chacune tant que possible), ses vedettes (`vedettesDeFamille`), toutes ses références dans
  l'ordre du nuancier, où on les pose, les six autres familles, le dernier appel en encre.
- **`/matieres` mène aux sept** : section « Les familles, une par une » (pastilles des tiroirs, nombre) entre le
  présentoir et la bande AA14 ; dans le présentoir, un tiroir ouvert affiche « Tout savoir sur les <famille> »
  (`cheminFamille`, dans `lib/familles-matieres`, module léger lu par le client).

**Décisions prises seul**
1. **Action principale = le simulateur sans famille** (`/simulateur?depuis=matiere-famille`) : le simulateur ne lit
   que `ref`, `projet`, `element`, `choix` ; présélectionner une référence au hasard de la famille aurait trompé.
   Nouvelle valeur `depuis` seulement (SUIVI.md), aucun événement nouveau.
2. **« Les voir en vrai chez moi » → `/contact?visite=1&famille=<id>`** : pertinent pour une famille (on vient avec
   les échantillons). Aujourd'hui le formulaire ignore `visite` et `famille` (il ne lit que `ref`) : **pour D4**, faire
   lire `visite=1` à `FormulaireContact.tsx` (message prérempli) et y gérer `famille` (« les échantillons de bois »).
3. **Liens des références vers `/matieres?ref=<REF>`** par `lienMatiere`, puisque D4 n'est pas dans ce commit. **Pour
   D4** : changer `lienMatiere` (la seule source, comme le prévoit le plan) suffit à faire passer toutes les listes,
   vedettes et cartels de ces pages aux fiches ; adapter alors l'expression des liens de `familles.test.ts`
   (`/^\/matieres\?ref=…$/` dans « les liens mènent tous à une page qui existe »).
4. **Vedettes** : celles du site (accueil, prestations) puis les plus vues dans une ambiance, huit au plus ; textiles
   et paillettes n'en ont aucune → quatre teintes prises dans le nuancier, sous le titre « Pour commencer » (pas
   « Nos vedettes ») ; métaux (Q1) et bétons (NE24, NH12) sont complétés à quatre, et l'intro le dit.
5. **Ambiances** : section omise pour textiles, métaux, paillettes (aucune ambiance) ; deux pour les bétons (les deux
   seules) ; les textes de ces familles le disent (« Nous n'avons pas encore d'image d'ambiance avec … »).
6. **Liste repliée au-delà de 41 références** (bois 267, couleurs 89 : `<details>`, toujours dans la page pour le
   référencement) ; dépliée pour les cinq autres. Lignes de 44 px, deux colonnes dès 360 px.
7. Le plan du site et `llms.txt` ne listent pas encore les familles : c'est D5 (`sitemap.test.ts` compare la liste
   exacte).
8. `insecables` (blog) reprise pour la typographie (espace insécable avant « : ; ? ! »).

**Tests** : 451 → 471, tous réussis. Nouveau `src/app/matieres/familles.test.ts` (20) : les sept slugs écrits en dur,
`generateStaticParams`, `dynamicParams = false` ; 404 et aucune métadonnée pour `inconnue`, `Bois`, `tout`, `favoris`,
`bois-clair`, vide ; textes (quatre parties, 300 mots au moins, le compte juste, aucun montant ni promesse chiffrée,
seuls nombres permis, « on ») ; titres ≤ 60 et distincts, descriptions ≤ 155 non coupées, canonique ; chaque page
rendue (h1, texte entier et ≥ 300 mots rendus, fil visible et `BreadcrumbList` exact, bande des teintes, deux
principaux identiques vers le simulateur avec `depuis`, visite, ambiances étiquetées ou section omise, vedettes,
toutes les références dans l'ordre du nuancier, repli) ; tous les liens mènent à une page qui existe ; aucune image
prioritaire ni donnée du CRM ; règles (nuancier, dégradé, choix des ambiances sur une liste connue, vedettes, compte des
mots) ; le lien du tiroir ouvert. `matieres.test.ts` adapté en gardant son intention : les 32 pastilles se comptent
dans la barre des tiroirs (la page en a 28 de plus, celles des familles, vérifiées avec leurs liens).
`npx eslint .` et `npm run build` passent (7 pages `●` sous `/matieres/[famille]`).

**Vérification visuelle** : build local comme la CI (CRM de production en lecture, `NEXT_PUBLIC_SANS_EVENEMENTS=1`),
`next start -p 3100` arrêté ensuite. `scripts/captures.mjs` (Edge) à 390 et 1 440 px sur bois, textiles, bétons,
paillettes et `/matieres` : aucun débordement à 360 px, 0 requête coupée. Captures de référence
`docs/captures/site-3-0/matieres-bois-390.jpg`, `matieres-bois-1440.jpg`, `matieres-390.jpg`, `matieres-1440.jpg`
(refaites : section des familles). Dans le navigateur : `/matieres?famille=metal` montre « Tout savoir sur les
métaux » → `/matieres/metal`.

**Problèmes**
- `scripts/captures.mjs` rend en blanc les sections `differee` (`content-visibility: auto`) hors du dernier écran : il
  remonte en haut avant la capture pleine page, et le navigateur ne peint plus ces sections. Les captures de référence
  de ce lot sont faites avec un script temporaire qui force `content-visibility: visible` (non commité). À corriger
  dans `captures.mjs` (une ligne `addStyleTag`) quand un lot y touche ; les captures `prestation-*` et
  `comment-ca-marche-*` déjà commitées sont peut-être concernées.
- En local sous Windows, `/matieres/Bois` répond 200 (le système de fichiers ne distingue pas la casse : le fichier
  prérendu `bois.html` est trouvé, la page servie est celle du 404 sans le statut) ; `/matieres/BOIS` répond 404. Même
  chose pour `/prestations/Cuisine`, avant ce lot. Sur Vercel (Linux), la casse compte : 404.

## D4 — `/matieres/<famille>/<REF>` (06/10/2026)

**Fait** (aucune image générée, aucun envoi ; `docs/DESIGN.md` « La fiche d'une matière », `docs/SUIVI.md`)
- **497 fiches statiques** `src/app/matieres/[famille]/[ref]/page.tsx` (`generateStaticParams` = une par référence,
  sous SA famille ; `dynamicParams = false`, `notFound()` par sûreté) : `/matieres/bois/K1` (autre famille),
  `/matieres/bois/ZZZ` → 404 ; référence en majuscules, sans redirection de casse. Revalidées à 300 s comme
  `/realisations` (elles lisent `chargerPublications`).
- **La page** : fil d'Ariane visible + `BreadcrumbList` (Accueil › Matières › famille › « Nom RÉF ») ; le nom du
  fabricant en `h1` ; la **grande vignette** = l'échantillon entier du CRM (`urlEchantillon`, 595 × 790,
  `fetchPriority="high"`, `preconnect` vers le CRM ; 4/3 au téléphone, entière dès 768 px) ; « Essayer chez moi »
  (principal, `lienEssayer(ref, "matiere-fiche")` : le simulateur pose la matière, `matiere-demandee`) et « La voir en
  vrai chez moi » (`/contact?ref=<REF>&visite=1`) ; cartel, teinte (`teinteDe` + couleur moyenne), finition glosée,
  famille, référence ; la note (fiches indexées) ; « Nom chez vous » (où la poser + ses prestations, l'entretien, à
  savoir, la voir en vrai) ; « Vue dans » (les réalisations publiées qui la portent d'abord — `realisationsDeLaMatiere`,
  vide tant que le CRM ne publie pas les matières d'un chantier —, puis TOUTES ses ambiances des séries 1 et 2 :
  photo « Ambiance », « Ici : », « Avec : » vers leurs fiches, « Voir l'ambiance », « Essayer cette composition chez
  moi » `depuis=matiere-fiche` ; section omise sans rien) ; six voisines de teinte (ΔE, « Écart 1,1 ») ; sa famille et
  les autres ; dernier appel en encre.
- **Indexation** : les 52 de `fichesIndexees` indexées ; les 445 autres `noindex, follow` (nouvelle option
  `indexer: false` de `metadonneesPage`). Titre ≤ 60 (`titreFiche` : « Deep Green NF13 : film adhésif uni |
  CoverSwap », plus court pour les noms longs), description ≤ 155 (`descriptionFiche`), canonique = la fiche.
- **Les notes** `src/data/notes-matieres.ts` : 52 notes écrites à la main, 62 à 88 mots, toutes distinctes (aucune
  phrase de six mots ou plus reprise), d'après le nom du fabricant, la couleur moyenne, les ambiances où on l'a posée
  et ses voisines ΔE ; aucune promesse technique, aucun montant ; chaque référence citée existe sous son vrai nom
  (testé). Avec les repères de famille et le reste de la page : 300 mots rendus au moins sur les 52 (testé).
- **Une seule règle des liens** : `cheminMatiere(ref, famille)` (`lib/familles-matieres`, module léger) ;
  `lienMatiere(ref)` la suit en lisant la famille au catalogue (côté serveur). Le double de `CalqueMatieres.tsx` est
  supprimé : le calque (client) appelle `cheminMatiere` avec la famille de l'ambiance résolue. Toutes les listes,
  vedettes, cartels (accueil, prestations, familles, inspirations, réalisations) mènent donc aux fiches ; le présentoir
  ajoute « Voir la fiche de … » dans la matière en grand. `/matieres?ref=` et `?famille=` restent servies (le
  présentoir les lit toujours ; une référence hors catalogue garde cette adresse).
- **La visite** : `lib/visite.ts` (`lienVisiteMatiere`, `lienVisiteFamille` déplacé de la page de famille,
  `messageVisite`) ; `FormulaireContact` préremplit le message quand l'adresse porte `visite=1` (« Bonjour, j'aimerais
  voir la matière NF13 en vrai, chez moi… » ou « vos bétons et stucs ») ; `DevisForm` gagne `messageInitial`
  (`defaultValue`). Rien n'est envoyé seul ; aucun événement nouveau.
- `TIROIRS` passe dans `lib/familles-matieres` (réexporté par `lib/matieres`) ; `scripts/captures.mjs` force
  `content-visibility: visible` avant la capture pleine page (le défaut signalé en D3) et connaît
  `matiere-fiche-nf13`.

**Décisions prises seul**
1. **« Vue dans » en cartes légères** (photo « après » seule, 4/3, étiquette « Ambiance ») plutôt que `CarteAmbiance`
   et son curseur : Original Oak AA14 est dans 12 ambiances, douze curseurs client sur une fiche étaient trop lourds.
   « Voir l'ambiance » mène au curseur de /inspirations.
2. **Réalisations lues au CRM** (`chargerPublications`, en cache 300 s) : la fiche passe d'entièrement statique à
   revalidée toutes les 5 minutes (ISR), comme /realisations. Au build, la requête au CRM est partagée par les pages.
3. Voisines **toutes familles confondues** (une couleur proche d'un bois se montre : c'est l'intérêt) ; l'écart est
   écrit (« Écart 0,0 » existe : deux références de même couleur moyenne).
4. Vignette **recadrée en 4/3 au téléphone** (entière, elle repoussait les deux actions hors du premier écran) ; les
   actions finissent à 674 px à 390 × 844.
5. « La voir en vrai chez moi » d'une fiche : `/contact?ref=<REF>&visite=1` (le plan) ; le message ne cite que la
   référence (le formulaire, côté client, n'a pas le catalogue) ; la référence s'affiche et part comme avant.
6. Titre court pour les noms longs (« Pietra di Cardoso Grigio NH39 | CoverSwap ») plutôt que tronqué.

**Volume du CRM** (contrôlé avant de pousser, comme le demandait le plan : chaque échantillon entier demandé est mis
en cache sur le volume, ≈ 120 Ko × 497 au pire, 60 Mo) : `etat_crm` SANTE (lecture) → disque 15 % utilisé,
3 789 Mo libres sur 4 469 (le volume a été agrandi). Rien n'attend.

**Tests** : 471 → 486, tous réussis. Nouveau `src/app/matieres/fiches.test.ts` (15) : 497 adresses sous leur famille,
`dynamicParams`, `revalidate` ; 404 et aucune métadonnée (autre famille, casse, inconnue) ; 52 indexées / 445 en
`noindex, follow` (en dur), titres ≤ 60 et tous distincts, descriptions ≤ 155 non coupées, canonique ; `indexer`
de `metadonneesPage` ; notes (52, 60 à 90 mots, aucune phrase reprise, honnêtes, références citées réelles, « on ») ;
repères et gloses complets ; NF13 rendue (fil et `BreadcrumbList`, vignette 595 × 790 seule prioritaire, deux
principaux identiques, visite ×2, cartel, teinte, finition, note, quatre ambiances étiquetées, six voisines avec
écart) ; les 52 indexées ≥ 300 mots rendus et toutes leurs ambiances ; une fiche non indexée ; réalisation avant les
ambiances (`fetch` remplacé : aucune requête) ; tous les liens mènent à une page qui existe ; source (`preconnect`,
pas de `preload`) ; liens des autres pages et visite préremplie. Adaptés en gardant leur intention : `accueil.test.ts`
(la vedette mène à sa fiche, `?ref=` toujours relu), `ambiances.test.ts` (l'étiquette du calque → la fiche),
`inspirations.test.ts` (cartels → fiches), `familles.test.ts` (liens des références → fiches de leur famille).
`npx eslint .` et `npm run build` passent : **546 pages** générées (49 + 497), build depuis zéro en 44 s (33 s avec
le cache), dont 12 s de génération ; `.next` 203 Mo, dont 117 Mo pour `server/app/matieres` (fiche HTML ≈ 90 Ko,
14 à 18 Ko compressée).

**Vérification visuelle** : build local comme la CI (CRM de production en lecture, `NEXT_PUBLIC_SANS_EVENEMENTS=1`),
`next start -p 3100` arrêté ensuite. `scripts/captures.mjs` (Edge) à 390 et 1 440 px sur NF13 (indexée), Brown Wenge
A1 (textile, non indexée), Original Oak AA14 (12 ambiances) et `/matieres/couleur` : aucun débordement à 360 px,
0 requête coupée ; captures de référence `docs/captures/site-3-0/matiere-fiche-390.jpg` et `-1440.jpg`. Essai scripté
(Playwright + Edge, POST coupés : rien n'est parti) : « Voir la fiche de Deep Green » du présentoir mène à la fiche ;
vignette chargée (595 × 790) ; robots `noindex, follow` sur A1, `preconnect` et préchargement de la vignette sur NF13 ;
`/contact?ref=NF13&visite=1` prérempli, référence NF13 ; `?visite=1&famille=beton` prérempli ; aucune erreur de page.

**Problèmes**
- En local sous Windows, `/matieres/bois/d1` répond 200 (même cause qu'en D3 : le système de fichiers ignore la casse,
  la page servie est le 404 sans le statut) ; sur Vercel (Linux) : 404.
- Le catalogue range quelques décors à l'aspect bois hors des bois (Brown Wenge A1 est un « textile ») : la fiche suit
  le catalogue, et `teinteDe` le classe « Beige et taupe » ; rien changé.
- Le LCP de la fiche dépend du CRM (autre domaine) : à mesurer en F6 (le plan prévoit `?l=640` côté CRM si > 2,5 s).

## D5 — plan du site et `llms.txt` (06/10/2026)

**Fait**
- `src/app/sitemap.ts` : les sept familles (`/matieres/<famille>`, priorité 0,7) et les 52 fiches indexées
  (`fichesIndexees()` → `lienMatiere`, priorité 0,5), et rien d'autre : les 445 fiches en `noindex, follow` n'y sont
  pas. 36 → 95 adresses (vérifié dans le `sitemap.xml` construit).
- `src/app/llms.txt/route.ts` : section « Familles de matières » (les sept, avec leur accroche de
  `data/textes-familles`) ; la ligne « Matières » dit le rangement par teinte, l'adresse d'une fiche
  (`/matieres/<famille>/<référence>`, exemple NF13) et « Essayer chez moi ».

**Décisions prises seul**
1. **Dates** : les familles et les fiches portent `DATE_CATALOGUE` (06/10/2026, le jour de ces pages), les autres pages
   gardent `LAST_BUILD` (30/09). Le plan voulait « la date de fusion », inconnue avant G3 : **en G3, passer
   `LAST_BUILD` et `DATE_CATALOGUE` au jour de la mise en ligne** (et adapter les deux dates de `sitemap.test.ts`).
2. Priorités : familles 0,7 (comme `/inspirations`, `/contact`), fiches 0,5 (comme les guides), sous les pages du
   tunnel.

**Tests** : 486 → 487, tous réussis. `sitemap.test.ts` : la liste exacte des pages gagne les sept familles et les 52
fiches, **écrites en dur** (jamais reconstruites par `fichesIndexees()`), 95 adresses ; nouveau test « lot D5 » :
présentes `/matieres/couleur/NF13`, `/matieres/bois/D1`, NE31, Q1, NF27, J3 et les familles ; absentes deux fiches
non indexées (A1, Q2), AF02 et `/matieres?ref=NF13` ; 52 fiches au motif d'une fiche ; dates et priorités ; le test
des dates garde son intention hors des matières ; `llms.txt` : les sept familles, la section, l'exemple de fiche.
`npx eslint .` et `npm run build` passent (546 pages, 34 s avec le cache).

**Problèmes** : aucun.

## E1 — alléger `Simulateur.tsx` (06/10/2026)

**Fait** (aucun changement de comportement, aucune image générée, aucun envoi)
- `Simulateur.tsx` : **594 → 522 lignes** (plafond de `tunnel.test.ts` : 600).
- `src/app/simulateur/_components/EcranGeneration.tsx` : l'écran 3 pendant une génération et après son échec
  (`EcranAttente`, la « simulation à la main » — formulaire de secours, Turnstile `simulateur-secours` —, « Revenir à
  mes matières », « Nouvelle simulation » sans photo, la confirmation « Demande bien reçue »). Les films choisis et la
  lecture de la photo (« Vu sur votre photo : … ») y sont calculés depuis la pièce, les sélections et l'analyse, dans
  le même ordre qu'avant. `EcranSansPhoto` : « Commencez par une photo » (écran 3 sans photo sur l'appareil).
- `src/app/simulateur/_components/useFeuilleCatalogue.ts` : le branchement de `FeuilleCatalogue` (zone ouverte, focus
  rendu à « Modifier » sans défilement, favoris, choix d'une teinte avec les zones « aussi » et les incompatibles
  vidées, retrait, autres zones proposées) ; le simulateur rend `<FeuilleCatalogue {...feuille} />`. Le refus 409
  d'une zone choisie s'efface par le rappel `surChoix`.
- Restent dans `Simulateur.tsx`, mot pour mot : les lignes lues par `tunnel.test.ts` (`?ref=`, ESTIMATION_VUE,
  RAPPEL_DEMANDE, `lienEspace`, « Nouvelle simulation ») et `entonnoir.test.ts` (`depuisLien.current` trois fois,
  PIECE_CHOISIE), `reprise.test.ts` (montage, `marquerPiece`, `useMatiereDemandee(…, zoneDemandee, setZoneOuverte)`)
  et le message d'erreur en `alerte-*` de `theme.test.ts`.

**Décisions prises seul**
1. Le hook rend les **propriétés** de la feuille (`ProprietesFeuilleCatalogue | null`) plutôt que du JSX : il reste
   un `.ts`, comme le voulait le plan.
2. `films` et `lecturePhoto` passent dans `EcranGeneration` (seul écran qui s'en sert).

**Tests** : 487 → 491, tous réussis. Nouveau `src/app/simulateur/_components/ecran-generation.test.ts` (4) :
`Simulateur.tsx` sous 560 lignes, importe `EcranGeneration` et `useFeuilleCatalogue`, ne contient plus l'attente, le
secours, `choisirTeinte` ni les favoris ; les règles de la feuille gardées (incompatibles vidées, focus, autres
zones) ; rendu pendant la génération (films dans l'ordre des zones, lecture de la photo, pas de secours) ; après un
échec (« Réessayer », « Revenir à mes matières », formulaire), demande envoyée (confirmation seule), sans photo
(« Nouvelle simulation ») ; `EcranSansPhoto`. `npx eslint .` et `npm run build` passent (546 pages).

**Problèmes** : aucun. Vérification visuelle des écrans 1 à 3 faite avec E2 (l'écran d'attente et le secours ne
s'atteignent pas en local sans lancer de génération : couverts par les rendus des tests).

## E2 — les pictos partout (06/10/2026)

**Fait** (aucune image générée ni régénérée : les 17 pictos préparés en B4 et à la mission 19 ; aucun envoi)
- `lib/simulateur/projets.ts` : `picto` par pièce (série 1) et `pictoDeLaPiece` (cuisine à défaut, comme
  `getProject`). `lib/simulateur/zones.ts` : `PICTO_DE_ZONE` (8 zones : plan de travail, meuble vasque, murs carrelés,
  portes du dressing, commode/buffet, mobilier et rangements pro, habillage mural) et `pictoDeZone` (repli sur le
  picto de la pièce pour toute autre zone ou une zone nouvelle du CRM).
- **Écran 1** : `CartesPieces` prend `pictoDeLaPiece` (plus de table de familles à part) ; sous les cartes,
  « Un élément précis ? » : les sept éléments de `lib/simulateur/elements` (ceux de l'accueil), boutons de 64 px de
  picto + libellé, 4 colonnes au téléphone, 7 dès 640 px. Toucher un élément = `choisirPiece(piece, element)` :
  PIECE_CHOISIE inchangé (aucune méta nouvelle), et `zoneDemandee` reçoit sa zone, ouverte d'abord à l'écran 3 comme
  `?element=` (vérifié : « Placards » → la feuille « Portes du dressing » s'ouvre). Un élément dont la pièce n'est
  plus publiée par le CRM n'est pas proposé.
- **Écran 2** : le conseil « Toute la zone visible » montre le picto de la pièce choisie (64 px, 128 dès 640 px) au
  lieu de la cuisine au trait, et son texte vaut pour toutes les pièces (« Tout ce qui recevra le film doit être dans
  le cadre, en entier. » ; il citait « Meubles, plan, crédence » même pour une salle de bain). « De face » et
  « Lumière du jour » restent des schémas d'interface, en `currentColor` et jetons (plus aucun hexadécimal).
- **Écran 3** : chaque zone sans matière montre son picto (64 px) ; une matière choisie prend sa place (vignette du
  film) ; rangées de 64 px dans les deux états.
- **Estimation** : `FORMES_CUISINE` gagne `parallele` (picto `plan-parallele`), affiché seulement si le CRM publie un
  format `parallele` — aujourd'hui il publie `une-rangee`, `en-l`, `ilot` (`tarifs-publics.ts`).
- `CuisineDeFace` (et `ZoneCuisine`) supprimés d'`espace/Illustrations.tsx` : plus aucun dessin de pièce au trait.
- `docs/DESIGN.md` : « Les pictos du simulateur » ; la note de l'espace client mise à jour.

**Décisions prises seul**
1. Les éléments de l'écran 1 sont des **raccourcis** sans état « choisi » (ils font avancer, comme les pictos de
   l'accueil) ; la carte de la pièce reste marquée choisie au retour.
2. Choisir une carte de pièce **sans** élément efface la zone demandée (avant : une zone venue de `?element=`
   survivait à un nouveau clic sur la carte) : le dernier choix l'emporte.
3. Picto d'une zone **remplacé** par la vignette du film une fois la matière choisie (les deux côte à côte ne
   tenaient pas à 390 px avec « Retirer » et « Modifier »).
4. Libellés en `text-[12px]` au téléphone avec `hyphens-auto` : « Réfrigérateur » coupait en « Réfrigérateu / r ».
5. Les schémas « De face » et « Lumière du jour » gardés (le plan : « schémas en currentColor ») : ce ne sont pas des
   choix de pièce, d'élément ni de forme, et aucun picto ne les montre.

**Pour Lucas** : pour montrer la cuisine en couloir dans l'estimation, publier un format `parallele` côté CRM
(`modifier_tarifs` / `tarifs-publics.ts`). Risque signalé (plan) : l'analyse du CRM peut griser une zone rattachée
(réfrigérateur sur « Façades » qui exclut l'électroménager inox ou verre ; porte d'entrée sur « Portes du dressing ») ;
le message « non visible sur la photo » existe déjà, consignes inchangées.

**Tests** : 491 → 499, tous réussis. Nouveau `src/lib/simulateur/pictos.test.ts` (8) : picto de chaque pièce et
repli, mêmes pictos que les familles de l'espace, 17 pictos utilisés et leurs 4 fichiers (AVIF/WebP, 128/256) ;
chaque élément → pièce et zone de `ZONES_REPLI`, porte d'entrée et réfrigérateur rattachés ; `PICTO_DE_ZONE` sur des
zones connues, repli pour une zone ou une pièce nouvelles, fichiers de toutes les zones ; écran 1 (sept boutons,
picto 64 px `alt=""`, libellé, 44 px, élément masqué sans sa pièce, `choisirPiece(piece, element)` →
`zoneDeLElement`) ; écran 3 (picto des zones sans matière, rangées de 64 px) ; écran 2 (picto de la pièce, texte
général, deux schémas `currentColor`, aucun hexadécimal) ; estimation (3 `<svg>` pour les formats publiés
aujourd'hui, `plan-parallele` seulement avec `parallele`, famille sinon) ; 64 px à chacun des 6 appels ; plus aucun
`CuisineDeFace` dans les sources. Adapté en gardant son intention : `theme.test.ts` (cartes → `pictoDeLaPiece` ;
`CuisineDeFace` rejoint la liste des dessins retirés). `npx eslint .` et `npm run build` passent (546 pages).
`Simulateur.tsx` : 522 → 524 lignes.

**Vérification visuelle** : build local, `next start -p 3100` arrêté ensuite ; Playwright + Edge (toute requête
hors GET/HEAD, `/api/simulate*`, `/api/simulation/*` et le CRM hors images coupés : **0 requête coupée**, aucune
erreur de page). À 390 et 1 440 px : écran 1 (cartes + éléments), « Placards » → écran 2 (« Votre photo du
meuble », picto du mobilier), une image de la bibliothèque (`prep/meubles-dressing-avant-1024.jpg`, un avant généré
de la série 2, jamais une photo de client) chargée par « Choisir dans mes photos » → écran 3 : la feuille « Portes du
dressing » ouverte d'abord, puis les trois zones et leurs pictos (placard coulissant, mobilier, commode) à 64 px.
Aucun bouton de génération touché. Aucun débordement à 360, 390 ni 1 440 px ; les sept libellés tiennent à 360 px.
Captures dans le dossier de travail (pas dans le dépôt).

**Problèmes**
- En local, la feuille des matières affiche « Visuel indisponible » (vignettes du CRM non servies à ce build local) :
  sans rapport avec le lot, à revoir sur la prévisualisation.
- L'écran 4 (estimation) ne s'atteint pas sans génération : couvert par les rendus des tests.

## E3 — « Pas de photo sous la main ? » (06/10/2026)

**Fait** (aucune image générée, aucune génération lancée, aucun envoi ; l'analyse déclenchée par l'essai local a été
coupée avant de partir)
- `src/lib/exemples-simulateur.ts` (serveur) : les 18 avants de `PAIRES_SERIE_2` (cuisine 11, salle de bain 3, meubles
  3, pro 1, murs 0), chacun avec son **aspect** et sa **forme** écrits à la main (« Hêtre · Cuisine en L », « Blanc
  jauni · Cuisine sur un mur », « Bordeaux brillant · Cuisine en L », « Merisier · Cuisine sur un mur »…), ses deux
  après résolus (titre, texte alternatif, sources préparées, cartels du catalogue et lien de leur fiche), et
  `fichier`, l'avant en pleine taille pris au manifeste (`fichierPleineTaille` : `-1536.jpg` en paysage, `-1024.jpg`
  en portrait, `?v=` de l'empreinte). `simulateur/page.tsx` les passe au simulateur, filtrés sur les pièces publiées
  par le CRM ; le catalogue et le manifeste ne partent pas dans le navigateur (≈ 72 Ko de données, 8 Ko compressés).
- `ExemplesPhoto.tsx` (sous les conseils de l'écran Photo, `id="exemples"`, et un lien vers lui dans le cadre des
  boutons) : pastilles de pièce (`aria-pressed`, la pièce choisie à l'écran 1 d'abord, la cuisine pour les murs),
  vignettes « Ambiance » (2 colonnes, 3 dès 640 px) ; un exemple choisi = **état local** : « Version 1 / Version 2 »,
  curseur « Ambiance · avant / après », cartels liés aux fiches (`prefetch={false}`), « Voir les autres pièces ».
  Jamais `etat.photo`, ni analyse, ni CRM, ni événement.
- « Essayer d'autres matières sur cette pièce » (secondaire ; le principal reste « Prendre une photo ») →
  `useExemple.ts` : `fetch` de l'image du site, `fichierExemple` (JPEG), puis `choisirPhoto(fichier, { id, piece })`
  dans `Simulateur.tsx` : la préparation, l'analyse, Turnstile, `limite-abus.ts` et les quotas d'une photo de visiteur.
  La pièce de l'exemple devient celle du parcours (choix vidés si elle change). `PHOTO_CHARGEE` porte
  `exemple: <nom>` (`docs/SUIVI.md`).
- `EtatSimulateur.exemple?` et `RenduSimulateur.exemple?` (facultatifs ; `migrerEtat` ne les écrit que s'ils sont
  lisibles, et l'exemple de l'état seulement avec une photo) ; le rendu arrivé garde l'exemple de la photo.
- Résultat (`EcranResultat`) : `etiquetteDuRendu` → « Ambiance · avant / après » sur une pièce d'exemple (jamais
  « Simulation »), « Simulation » sur la photo du visiteur (nouvelle pastille, aussi pendant le chargement) ; texte de
  l'image, avant, fichier téléchargé (`coverswap-ambiance-…`), partage et note sous l'image le disent.
- Demande de devis : `messageDemande` → `message` « Simulation sur une pièce d'exemple : <nom> » (la route le
  transmet déjà au CRM ; aucun changement côté CRM).
- `AvantApres` : l'étiquette d'honnêteté passe au-dessus du trait du curseur (à 390 px il la coupait).
- `docs/DESIGN.md` : « Les pièces d'exemple du simulateur ».

**Décisions prises seul**
1. Choix « par pièce et par aspect » : des pastilles de pièce au-dessus des vignettes, la pièce de l'écran 1 d'abord ;
   un exemple d'une autre pièce essayé change la pièce du parcours (sinon les zones ne correspondraient pas).
2. Le plan citait `LegendeMatieres`, retiré au lot C4 : les cartels (`revue/Cartel`) liés aux fiches le remplacent,
   comme sur `/inspirations`.
3. `<nom>` de l'exemple = l'avant sans « -avant » (`cuisine-bordeaux-brillante`), lisible par Lucas dans le CRM.
4. Les après sont pré-résolus côté serveur (8 Ko compressés de plus sur `/simulateur`) plutôt que de charger le
   manifeste ou le catalogue dans le navigateur.
5. « Simulation » s'affiche désormais sur le rendu d'une photo de visiteur (il n'y avait aucune pastille) : la règle
   d'honnêteté vaut dans les deux sens.

**Tests** : 499 → 513, tous réussis. Nouveau `src/app/simulateur/_components/exemples.test.ts` (11) : 18 avants × 2
après et la répartition 11/3/3/1/0, aspects et formes, filtre par pièces publiées, pleine taille prise au manifeste
(et un manifeste factice à 2 000 px), fichiers présents sur le disque, liens des cartels vers les fiches ; grille
(11 « Ambiance », 4 pastilles, aucun principal, rien de « Simulation ») ; exemple choisi (versions `aria-pressed`,
curseur, avant et après, liens, bouton secondaire) ; sources sans `fetch(`, `sendBeacon`, `etat.photo`, analyse ni
événement, un seul `fetch` dans `useExemple` vers l'image du site ; écran Photo (lien, ordre, un principal) ;
`Simulateur.tsx` (chemin d'une photo, PHOTO_CHARGEE `exemple`, Turnstile, un seul `lancerGeneration`) ; étiquette du
résultat ; message de la demande. Ajoutés : `entonnoir.test.ts` (méta `exemple`, une fois par parcours),
`reprise.test.ts` (un état d'avant le lot se relit sans `exemple`, exemple illisible ou sans photo écarté),
`photo.test.ts` (`fichierExemple`). `npx eslint .` et `npm run build` passent (546 pages).

**Vérification visuelle** : build local comme la CI, `next start -p 3100` arrêté ensuite ; Playwright + Edge, toute
requête hors GET/HEAD, `/api/simulate*`, `/api/simulation/*` et le CRM hors images coupés (et **tout** le CRM dans le
contexte à 390 px où l'on essaie l'exemple). À 360, 390 et 1 440 px : aucun débordement ; 11 vignettes chargées ;
« Bordeaux brillant » choisi → **0 requête** hors ses images, focus sur son titre, Version 1 puis 2, curseur au
clavier, cartels NF13 / AG13 vers leurs fiches. À 390 px, « Essayer d'autres matières sur cette pièce » → écran des
matières avec la photo de 1 536 × 1 024, mémoire `exemple: cuisine-bordeaux-brillante` ; la seule requête vers le CRM,
`POST /api/simulate/analyse`, a été coupée (le chemin est bien celui d'une photo de visiteur). Aucun bouton de
génération touché. Captures : `docs/captures/site-3-0/simulateur-exemples-390.jpg` et `-1440.jpg`.

**Problèmes**
- Une capture pleine page d'Edge laissait la première vignette vide à 1 440 px alors qu'elle était chargée (artefact
  de capture, l'image s'affiche) : captures refaites à la hauteur de la fenêtre.
- Coût en production : chaque essai d'exemple lance une vraie analyse puis, si la personne génère, une vraie
  génération (comptées comme celles d'un visiteur) ; la note du devis permet de les reconnaître.

## E4 — après le rendu (06/10/2026)

**Fait** (aucune génération, aucun envoi)
- `src/app/simulateur/_components/CartelComposition.tsx` : sous l'image du résultat, « La composition » — pour chaque
  film du rendu, la zone, la vignette, le nom et la référence réels (`TuileFilm`, gardé), la famille et la finition
  (`familleDuCartel`, `libelleFinition`) quand la sélection de la zone est bien ce film, et le lien de sa fiche
  (`cheminMatiere` : `/matieres/<famille>/<REF>`, sinon `/matieres?ref=`), sans préchargement. Remplace la liste
  « Films utilisés » (même `aria-label`).
- « Recevoir ces échantillons chez moi » (l'équivalent, après le rendu, d'« Essayer cette composition chez moi ») :
  lien secondaire vers `#demande` qui coche la case des échantillons (`formulaire.echantillons`, `onEchantillons`) ;
  absent après l'envoi.
- `DemandeApresRendu` : `id="demande"` à sa racine (avant et après l'envoi) ; la case « Recevoir les échantillons de
  ces matières chez moi » avec les zones et références dessous. Estimation inchangée, toujours un seul principal.
- `demande.ts` : `messageDemande` ajoute « Souhaite recevoir les échantillons : NF13 (Façades), AG13 (Plan de
  travail) » au `message` de la demande (jamais après un échec ; la route le transmet déjà au CRM).
- `docs/DESIGN.md` : « Après le rendu ».

**Décisions prises seul**
1. Les échantillons passent par une **case** de la demande plutôt que par un envoi à part : un seul formulaire, un seul
   principal ; le lien ne fait que la cocher et y mener. Rien n'est promis sur le mode d'envoi (Lucas rappelle).
2. Famille et finition lues dans les choix courants, et seulement si la zone porte encore ce film (un rendu plus
   ancien du parcours peut en porter un autre) : rien n'est deviné, le lien retombe sur le présentoir.
3. `TuileFilm` gardé dans un cadre-lien plutôt que le `Cartel` de la revue : la vignette réelle du film compte plus
   ici que le filet de teinte, et le nom n'est pas répété.

**Tests** : 513 → 517, tous réussis. Nouveau `src/app/simulateur/_components/composition.test.ts` (4) : références
réelles, zones, vignettes, famille et finition, lien de fiche (et le repli `?ref=` quand la zone porte un autre
film), aucun principal ; le lien `#demande` seulement avant l'envoi, pas d'« Essayer cette composition chez moi » ;
`id="demande"` avant et après l'envoi, case décochée puis cochée, un principal, estimation présente ; message
(échantillons, exemple et échantillons sur deux lignes, rien sans case ou sans film, aucun champ à part), et les
lignes de `Simulateur.tsx` (jamais après un échec, lien absent après l'envoi). `npx eslint .` et `npm run build`
passent (546 pages). `Simulateur.tsx` : 530 lignes.

**Vérification visuelle** : build local comme la CI, `next start -p 3100` arrêté ensuite ; Playwright + Edge, toute
requête hors GET/HEAD, `/api/simulate*`, `/api/simulation/*` et le CRM hors images coupés. **Écran de résultat sans
aucune génération** : un état injecté dans la mémoire locale (IndexedDB) — photo = l'avant « bordeaux » de la
bibliothèque, rendu = son après « couleur » de la bibliothèque, références NF13 et AG13, `exemple` posé —, puis
« Reprendre ». À 360, 390 et 1 440 px : aucun débordement ; pastille « Ambiance · avant / après » ; liens
`/matieres/couleur/NF13` et `/matieres/bois/AG13` ; un seul principal (« Recevoir mon devis ») ; « Recevoir ces
échantillons chez moi » → `#demande` en haut de l'écran, case cochée. Formulaire jamais envoyé. Seule requête coupée :
l'analyse que la mémoire injectée (photo sans analyse) redemandait au CRM. Captures :
`docs/captures/site-3-0/simulateur-resultat-390.jpg` et `-1440.jpg`.

**Problèmes** : aucun. À vérifier par Lucas : la note « Souhaite recevoir les échantillons » arrive dans le message
du lead (champ `message` du CRM, déjà transmis par la route).

## F1 — `docs/SEO.md` (06/10/2026)

**Fait** (documentation seule, aucun code)
- `docs/SEO.md`, « Carte des intentions » : les quatre familles d'intentions (locale, produit, informationnelle,
  commerciale) et qui porte quoi ; une ligne par page indexée (intention, requête cible, H1, title et description que
  F2 pose avec leurs longueurs, pages qui y mènent, pages où elle mène — relevés sur le build) ; les 12 guides dans un
  second tableau ; les pages qui manquent de texte pour F6 ; les règles de l'image de partage (F2) et de l'hôte unique
  (F3).
- Relevé fait sur un build local (inventaire du `<main>` de chaque page construite : title, description, canonical,
  H1, mots, liens internes) : tous les canonicals sont justes sur les pages indexées, le plan du site cite exactement
  les 95 pages indexées, **la 404 et les pages privées héritent du canonical de l'accueil** (corrigé en F3).

**Décisions prises seul**
1. **Montpellier, un propriétaire par requête** : « covering cuisine Montpellier » → `/prestations/cuisine` ;
   « covering adhésif Montpellier » → `/zones/covering-montpellier` ; l'accueil porte « rénover sa cuisine sans
   travaux », sans ville dans le title.
2. **« avis » → `/realisations` seulement quand le CRM publie des avis** : sans avis, le title dit « Réalisations de
   covering à Montpellier ».
3. H1 inchangés (posés aux lots B à D) ; seuls les titles et quelques descriptions changent en F2.
4. Mots comptés dans le `<main>` rendu : **`/contact` (205) et `/matieres` (287) sont sous 300**, notés pour F6.

**Tests** : 517, inchangés (documentation seule).

**Problèmes** : aucun.
