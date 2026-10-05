# SEO et performance du site — site 3.0

Squelette posé au lot B0 (mission 21) ; la carte des intentions et les métadonnées se remplissent au lot F1, les
mesures « après » aux lots F6 et G3.

## Objectifs

- Téléphone : LCP ≤ 2,5 s, performance ≥ 90, accessibilité 100, SEO 100, CLS ≤ 0,05 (seuils bloquants de la CI dans
  `lighthouserc.json`, inchangés : performance ≥ 0,85, les trois autres axes ≥ 0,95, LCP ≤ 4 s, TBT ≤ 400 ms).
- Titres de 60 caractères au plus, descriptions de 155 au plus.
- 300 mots rendus sur chaque page indexée.

## Carte des intentions

À remplir au lot F1 : une ligne par page (intention, requête, H1, title, description, pages qui y mènent, pages où
elle mène).

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

À remplir aux lots F6 (build local) et G3 (coverswap.fr, après la fusion), avec la même méthode.
