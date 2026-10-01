# Direction artistique, série 2 (v2, budget 10 $) : de vrais cas, de beaux après

La série 1 reste pour les ambiances. La série 2 montre **de vrais logements ordinaires mais agréables**, avec des avants qu'on reconnaît (cuisine bordeaux brillante, blanc jauni, hêtre, merisier, chêne doré, gris brillant, wengé) et de beaux après en vraies références du catalogue.

## Les règles

- **Ultra-réaliste** : photographe d'intérieur, lumière du jour, logement bien tenu, rien de luxueux.
- **On part de l'avant**, puis **deux après** par édition, avec les vignettes réelles du catalogue. Seules les surfaces couvertes changent.
- **Façades planes uniquement.**
- **Teintes vérifiées** (ΔE 2000 ≤ 12), sinon réétiquetage vers la référence la plus proche.
- **Priorités** si le budget se resserre : 1 les avant/après, 2 les photos utiles au site, 3 les pictos.

## Volume

70 images, 140 essais, environ 8.2 $ au coût réel de la mission 19. Plafond strict : 10 $.

## 1. Avant/après : 18 pièces, un avant et deux après

| Pièce | Après 1 | Après 2 |
|---|---|---|
| cuisine-bordeaux-brillante | façades Egg White NE56 + plan de travail Original Oak AA14 | façades Deep Green NF13 + plan de travail Pale Oak AG13 |
| cuisine-blanche-jaunie | façades Pale Oak AG13 + plan de travail Nero Marquina U50 | façades Midnight Blue M9 + plan de travail Original Oak AA14 |
| cuisine-kitchenette-studio | façades Pale Oak AG13 + plan de travail Statuary White NE31 | façades Soft Green NH21 + plan de travail Original Oak AA14 |
| cuisine-l-hetre | meubles bas Royal Blue RM23 + meubles hauts Pale Oak AG13 + plan de travail Statuary White NE31 | meubles bas Jade Green NE83 + meubles hauts Jade Green NE83 + plan de travail Lombarda Grigio NF99 |
| cuisine-u-pavillon | façades Grayed Beige NH26 + plan de travail Opal Beige NH47 | façades Beige Line Oak AA17 + plan de travail Onyx RM29 |
| cuisine-couloir | façades Pearl Grey RM02 + plan de travail Original Oak AA14 | façades Steel Blue M6 + plan de travail Pale Oak AG13 |
| cuisine-ouverte-bar | façades Original Oak AA14 + plan de travail Nero Marquina U50 | façades Olive Green RM19 + plan de travail Raw Travertine MK15 |
| cuisine-merisier | façades Linen White RM01 + plan de travail Beige Line Oak AA17 | façades Antique Rose NF02 + plan de travail Original Oak AA14 |
| cuisine-grise-brillante | façades Bleach Oak AL28 + plan de travail Lombarda Nero NE71 | façades Deep Blue NF14 + plan de travail Beige Line Oak AA17 |
| cuisine-maison-de-village | façades Oat Milk M10 + plan de travail Raw Grey NE24 | façades Army Green RM21 + plan de travail Original Oak AA14 |
| cuisine-ilot-maison | façades Egg White NE56 + îlot Black Mat K1 + plan de travail Original Oak AA14 | façades Grayed Beige NH26 + îlot Deep Green NF13 + plan de travail Pale Oak AG13 |
| sdb-petit-meuble-vasque | meuble vasque Original Oak AA14 | meuble vasque Jade Green NE83 |
| sdb-double-vasque-wenge | meuble vasque Creamy White RM26 | meuble vasque Pale Oak AG13 |
| sdb-baignoire-tablier | meuble vasque Warm Gray NH22 + tablier de baignoire Warm Gray NH22 | meuble vasque Deep Green NF13 + tablier de baignoire Deep Green NF13 |
| placard-coulissant-chambre | portes Original Oak AA14 | portes Dry Branch NH28 |
| portes-couloir | portes Classic Walnut D1 | portes Bordeaux Red NF04 |
| buffet-salle-a-manger | façades Bird Nest NH29 + dessus Original Oak AA14 | façades Honey Mustard RM16 + dessus Pale Oak AG13 |
| pro-comptoir-accueil | façade Classic Walnut D1 + dessus Black Mat K1 | façade Sage Green RM20 + dessus Statuary White NE31 |

## 2. Photos utiles au site : 8

- `detail-chant` : un chant parfait en gros plan (preuve de finition)
- `pose-mains` : la pose, film à moitié posé
- `echantillons-table` : la visite avec les vrais échantillons
- `mesure-visite` : la prise de mesures
- `usure-detail` : un blanc jauni qui s'écaille (pages et blog « pourquoi rénover »)
- `outils-pose` : les outils du poseur
- `amb-cuisine-familiale` : meubles bas Midnight Blue M9 + meubles hauts Pale Oak AG13 + plan de travail Statuary White NE31
- `amb-couloir-portes` : portes Deep Green NF13

## 3. 8 nouveaux pictos (même style que la série 1)

- `picto-porte-interieure`
- `picto-placard-coulissant`
- `picto-plan-de-travail`
- `picto-commode`
- `picto-meuble-vasque`
- `picto-porte-entree`
- `picto-refrigerateur`
- `picto-plan-parallele`

## Les prompts

Tous dans `scripts/photos-serie-2.json` (CRM).

Avant :
```
Ultra-realistic photograph of a real, ordinary French home: a pleasant, well-kept, bright space with good proportions, the kind of apartment or house seen in a good real-estate listing in Montpellier, nothing luxurious. Taken by a professional interior photographer with a full-frame camera and a 24 mm lens at about 1.5 m height, perfectly straight verticals, natural perspective, no fisheye. Soft natural daylight from the existing window, gentle realistic shadows, true-to-life colours with a very light warm grade, crisp detail and real material textures. Standard-quality fittings: ordinary ceiling, white sockets and switches, a radiator, PVC or painted wooden windows with a roller-shutter box. Clean and tidy, genuinely lived-in: a few everyday objects (a kettle, a tea towel, a fruit bowl, a plant), nothing staged. Indistinguishable from a real photograph. No people, no text, no readable labels, no logos, no brand names, no watermark. Avoid: luxury magazine styling, designer furniture, CGI or 3D-render look, plastic-looking surfaces, oversaturated colours, HDR halos, bent or wavy lines, duplicated or floating handles, dirt or mess.
```
Après (édition) :
```
Edit this exact photo, the first image. Keep everything identical: camera position, framing, light, shadows, walls, floor, ceiling, window, {garder}, appliances, sink, taps, handles and every object. Change only these surfaces: {surfaces}. Each new surface reproduces its material sample exactly (colour, pattern, grain direction and texture at a realistic scale), as a premium self-adhesive architectural film applied over the existing panels: perfectly smooth, tight wrapped edges, realistic sheen, following the existing light, shadows and reflections. Door and drawer shapes, gaps, edges and handles stay exactly the same. No other change.
```
Détails :
```
Ultra-realistic close-up photograph taken with a full-frame camera and a 90 mm macro lens, soft natural side daylight, shallow depth of field, true-to-life colours, real material textures, in an ordinary French home. No faces, no text, no readable numbers, no logos, no brand names, no watermark. Avoid: CGI look, plastic surfaces, oversaturation.
```