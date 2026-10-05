# Direction artistique du site — site 3.0, « La Revue »

Commencé au lot B1 (mission 21) : les jetons, les polices, le grain et les contrastes. Les composants de base
(boutons, cartel, bande de matière, filet, grand numéro, étiquette d'honnêteté, curseur avant / après) et ce qu'on
jette de la maquette s'ajoutent au lot B3.

Le site est un artisan qui montre ce qu'il fait, pas un magazine : la maquette (`maquette-11-la-revue.html`) donne
la grammaire (titres serif très grands, filets fins, grands numéros, cartels de matière, blocs papier et encre),
pas un gabarit à recopier.

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
| `alerte-fond`, `alerte-texte` | `#F3E1CC`, `#7A3A14` | erreurs et avertissements : brun, pas rouge (ils remplacent `accent-fond` et `accent-texte` au lot B2) |
| `succes`, `succes-fond` | `#2E6741`, `#E1EAD8` | une confirmation (ex-`ok-texte`, `ok-fond`) |
| `encre-survol` | `#3B322B` | l'encre au survol des boutons encre |
| `sombre` | `#120E0C` | les feuilles sombres et le plein écran |
| `blanc` | `#FFFFFF` | le texte posé sur le rouge ; les cartes |

Les deux anciens jetons `accent-fond` (`#FBE9E7`) et `accent-texte` (`#8F1D12`) restent le temps du lot B2, qui les
renomme dans les 16 fichiers qui les emploient.

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

Les teintes de prestation (cuisine RM20, salle de bain M6…) et leurs contrastes s'ajoutent au lot B3
(`src/lib/teintes-prestations.ts`).

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
