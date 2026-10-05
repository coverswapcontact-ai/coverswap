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
- B2 à B7 : à venir.

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
