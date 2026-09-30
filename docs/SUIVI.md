# Suivi du site : événements, sources, mesure

Ce que le site émet, où ça part, et ce qu'il reste à brancher.

## 1. Deux canaux, un seul vocabulaire

| Canal | Où | Qui l'écoute |
|---|---|---|
| `dataLayer` (Google Tag Manager `GTM-PGBZT75T`) | navigateur, `src/lib/analytics.ts` (`track`) | GA4, Google Ads, Meta via les tags GTM — **à configurer dans GTM** |
| Événements de parcours du CRM | `POST https://crm.coverswap.fr/api/site/evenements` (`src/lib/evenements-site.ts`) | Synthèse du CRM, bloc « Site » (par source, par page, taux de complétion) |

Le CRM ne reçoit **aucune donnée personnelle** par ce canal : un identifiant de parcours (UUID de session), le type, la page, l'origine utm.

## 2. Événements émis

| Événement CRM | dataLayer (`event`) | Quand |
|---|---|---|
| `PAGE_VUE` | — | chaque page (SuiviParcours), le simulateur avec `projet` |
| `PIECE_CHOISIE` | — | une pièce choisie (simulateur ou module d'accueil, `depuis: accueil`) — une fois par parcours ; arrivé par un bouton « Simuler ma cuisine » de l'accueil, le simulateur y ajoute `depuis` lu dans `?depuis=` (`accueil-ouverture`, `accueil-colle`, `accueil-etapes`, `accueil-final` ; minuscules, chiffres et tirets seulement, `lireDepuis`) |
| `PHOTO_CHARGEE` | `simulation_photo_uploaded` | photo prête (poids, largeur) — une fois par parcours |
| `GENERATION_LANCEE` | `simulation_textures_selected` | clic « Voir le résultat » — une fois par génération |
| `RESULTAT_VU` | `simulation_generated` | rendu affiché (durée, gardé côté CRM ou non) — une fois par génération |
| `SIMULATION_ECHEC` | `simulation_failed` | `etape` : `photo` (illisible), `lancement` (prepare ou création du travail refusée : quota, captcha, CRM injoignable), `generation` (le travail a échoué ou n'a pas été retrouvé) ; `raison` |
| `DEVIS_DEMANDE` | `devis_form_submitted` | formulaire /devis ou demande après simulation |
| `CONTACT_ENVOYE` | `contact_form_submitted` | formulaire /contact |
| `FORMULAIRE_ECHEC` | — | envoi refusé ou coupé (`raison`, `statut`) |
| `WHATSAPP_CLIQUE` | `whatsapp_clicked` | « Écrire sur WhatsApp », bouton secondaire du dernier appel de l'accueil (`depuis: accueil-final`) ; message prérempli court, sans donnée personnelle (`lib/whatsapp.ts`). Mission 16, partie 3 : type ajouté d'abord à la liste blanche du CRM (ligne « Clics WhatsApp » de la synthèse) |
| — | `cta_clicked` | boutons du module d'accueil ; `phone_clicked` n'a pas d'émetteur |

L'entonnoir du simulateur (mission 15, partie 4) = `PIECE_CHOISIE` → `PHOTO_CHARGEE` → `GENERATION_LANCEE` → `RESULTAT_VU` → `DEVIS_DEMANDE` ; le CRM l'affiche emboîté, avec les abandons par étape, dans « Sur le site cette semaine » (Leads). Les anciens noms (`SIMULATION_PHOTO`, `SIMULATION_LANCEE`, `SIMULATION_RESULTAT`) restent lus par le CRM.

Meta : `track` mappe `simulation_generated`, `devis_form_submitted` → `Lead`, `contact_form_submitted` → `Contact`, `simulation_photo_uploaded` → `InitiateCheckout` (pixel chargé seulement avec l'accord « Publicité » du bandeau, si `NEXT_PUBLIC_META_PIXEL_ID` est posée).

## 3. Ce qui part avec chaque contact (webhook CRM)

Nom, téléphone, e-mail, ville, code postal, projet, message, style, photos (formulaire), simulations du parcours (identifiants, rattachées par le CRM), consentement mail daté (`consentementMail`, `consentementTexte`), identifiant de parcours, origine (`campaign_name` = utm_campaign, `ad_name` = utm_content, `form_name` = formulaire ou page), adresse IP du visiteur (limite anti-abus). Réponse du CRM journalisée côté Vercel : `[CRM] lead enregistré id=… photos=… consentement=… simulations=…`.

## 4. À faire dans Google Tag Manager (Lucas)

1. Déclencheurs « Événement personnalisé » sur `devis_form_submitted`, `contact_form_submitted`, `simulation_generated`.
2. Tags GA4 « événement » (conversions) et, si campagnes Meta : tag Pixel Meta `Lead` sur les deux premiers, ou poser `NEXT_PUBLIC_META_PIXEL_ID` sur Vercel pour que le site charge le pixel lui-même (après accord cookies).
3. Le consent mode v2 est initialisé par le site (tout refusé par défaut, mis à jour par le bandeau) : ne pas le redéfinir dans GTM.

## 5. Variables d'environnement liées

- Vercel : `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID` (optionnel), `NEXT_PUBLIC_CLARITY_ID` (optionnel), `NEXT_PUBLIC_SIMULATE_URL` (`https://crm.coverswap.fr/api/simulate`, sert aussi à trouver `/api/site/evenements`), `SIMULATE_TOKEN_SECRET`, `CRM_WEBHOOK_URL`, `CRM_WEBHOOK_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (captcha, inactif sans clés).
- Railway : `SIMULATE_TOKEN_SECRET`, `OPENAI_API_KEY`, `WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` (expéditeur vérifié chez Resend : sans lui, l'accusé de réception au visiteur ne part pas), `LEAD_NOTIFICATION_EMAIL`, `GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID` (facultatives : les avis Google de l'accueil, § 8 ; sans elles, le bloc « Note Google » n'existe pas).
- Depuis la mission 15, le site ne génère plus aucune image : `OPENAI_API_KEY` et `OPENAI_IMAGE_MODEL` ne lui servent plus (à retirer des variables Vercel ; elles restent sur Railway).

## 6. Simulateur : génération asynchrone (mission 15, partie 1), le site simple client (partie 4)

1. Le navigateur appelle `POST /api/simulation/prepare` (site : pot de miel, limite d'abus, captcha Turnstile, sélections `{ surface, ref }` validées contre la liste de zones du CRM — `GET <CRM>/api/site/simulateur`, une heure en cache, repli figé dans `lib/simulateur/zones.ts` — et le catalogue, puis signature HMAC de `{ parcoursId, projet, selections, exp }`). Le site ne construit plus aucun prompt : le CRM relit zones et références et son moteur construit la consigne.
2. Il envoie la photo et les sélections signées au CRM, `POST /api/simulate` avec `asynchrone: true` → **202** `{ travailId, attenteEstimeeS }` : un `TravailSimulation` est créé, la génération tourne en tâche de fond (voie longue, deux en parallèle). Un **409 `zone-non-visible`** (zone choisie que l'analyse de la photo ne voit pas) s'affiche tel quel sur la zone.
3. Il sonde `GET /api/simulate?id=<travailId>&p=<parcoursId>` toutes les 3 s (relancé quand la page redevient visible et au retour du réseau) jusqu'à `PRETE` ou `ECHEC` ; les images se lisent par adresse (`/api/simulate/image?id=&p=&quoi=apres|avant`), plus jamais en base64 dans la mémoire du navigateur.
4. La mémoire locale (IndexedDB v2) garde la photo, les choix, le parcours, le travail en cours et l'historique des rendus : quitter la page ne perd rien. « Me prévenir quand c'est prêt » (`POST /api/simulate/prevenir`) laisse une adresse ou un numéro ; le mail « simulation prête » porte le lien `/simulateur?reprise=<travailId>&p=<parcoursId>`, qui retrouve le rendu même sur un autre appareil.
5. Un travail EN_COURS depuis plus de 10 min (`demarreLe` du CRM) se lit en échec « delai » ; en file d'attente, le navigateur attend tant que le CRM ne dit pas ECHEC. Le CRM garde les rendus 30 jours (simulations et travaux archivés ensuite).
6. **Analyse de la photo** (partie 4) : dès la photo chargée, `POST <CRM>/api/simulate/analyse` `{ parcoursId, projet, photo_base64 }` → `{ empreinte, statut, analyse? }` (202 : tâche mise en file ; 200 : photo déjà analysée), suivie par `GET ?e=&p=` toutes les 3 s. Le site en garde les zones vues / non vues (griser « non visible sur la photo »), le verdict de qualité et son conseil (« Continuer quand même »), et une phrase neutre quand elle est sautée (jamais le détail).
7. **Photo HEIC** : si le navigateur ne la décode pas, le fichier part tel quel au CRM, `POST <CRM>/api/simulate/photo` (multipart `parcoursId` + `photo`, 25 Mo) → `{ photo_base64 }` JPEG réduit, rien n'est gardé côté CRM.
8. **Vignettes du catalogue** : `GET <CRM>/api/site/echantillons/<ref>?l=320` (grille) et sans `?l=` (vue agrandie), cache d'une semaine.

`scripts/verifier-simulateur.mjs` suit ce contrat (202 puis sondage) ; `--sans-generation` ne coûte rien.

## 7. Images (mission 16, partie 2)

Le site n'utilise pas l'optimiseur d'images de Vercel (`images.unoptimized`, quota épuisé → 402) : chaque image est préparée en local, une fois, et servie telle quelle.

- **Originaux** : `public/images/sources/<nom>.<jpg|jpeg|png>` (commités ; nom en minuscules, chiffres et tirets). Aujourd'hui : `ouverture-provisoire` (l'ancienne affiche de la vidéo d'ouverture), `pro-bureaux`, `meubles-armoire`, `mur-salon` (les trois images de la racine du dépôt : origine inconnue, banque d'images ou générées, **à confirmer par Lucas** ; étiquetées « Ambiance » si elles servent).
- **Préparation** : `npm run images` (`scripts/preparer-images.mjs`, sharp, sans coût) → `public/images/prep/<nom>-<largeur>.<avif|webp|jpg>` aux largeurs 480 / 960 / 1600 plafonnées à l'origine (jamais agrandie : une image de 1536 px sort en 480, 960 et 1536), AVIF qualité 50, WebP 78, JPEG mozjpeg 80. Ne fait que ce qui manque (`npm run images -- --tout` refait tout), **sauf pour un original remplacé sous le même nom** : son empreinte (sha1 des octets, 12 caractères, écrite au manifeste) ne correspond plus, et toutes ses sorties sont refaites (la date de modification n'est pas un signe : une copie par l'Explorateur la garde). Retire de `prep/` ce qu'aucun original ne demande plus, et regénère **`src/lib/images-manifeste.ts`** (fichier généré, ne pas éditer : dimensions, largeurs et empreinte de chaque image, trié).
- **Affichage** : `Photo` (`src/components/simulation/Photo.tsx`) lit le manifeste (`sourcesPhoto`, `src/lib/images-preparees.ts`) : `<picture>` AVIF + WebP + JPEG, `width` / `height` réservés, `sizes` par défaut `(min-width: 1024px) 50vw, 100vw`, `priorite` (une seule image par page, l'ouverture) → `loading="eager"` + `fetchpriority="high"` ; `immediat` (les autres images du premier écran) → `loading="eager"` sans `fetchpriority` ; sinon `lazy`. `enLigne` : cadre `span` pour une photo posée dans un bouton.
- **Honnêteté** (énoncé § 1.1) : une image générée est une **« Ambiance »** (`Etiquette`), jamais un chantier ; un rendu du moteur est une **« Simulation »** ; une réalisation ne vient que de `GET <CRM>/api/site/publications` (accord écrit du client). Jamais une photo de client du CRM (`uploads/`, `/api/uploads`, `/api/dossiers/*/photos`) dans le site ni dans les tests.
- **Cartes de pièces** : `src/lib/images-pieces.ts` (`PHOTOS_PIECES`, un seul endroit) est passé par le simulateur (`EcranPiece`) et le module d'accueil ; une carte montre la photo si elle est au manifeste (carré, « Ambiance » en bas à gauche), sinon son dessin au trait. Sur `/simulateur` (les cartes sont le premier écran), les photos des trois premières cartes chargent tout de suite (`photosImmediates`) ; à l'accueil (module sous l'ouverture), toutes en `lazy`. **Intérim** : les photos de réalisation des cinq pièces restent à fournir. L'espace client garde ses dessins.
- **Images d'ambiance générées** (≤ 12, `gpt-image-1` qualité high) : produites UNE fois depuis le CRM par `node --import tsx scripts/generer-ambiances.ts` (prompts dans `scripts/ambiances.json` du CRM, `--estimer` pour le plan et le coût, `--essai` sans réseau ; coût compté dans `GenerationImage`, origine CRM, phase `ambiance`, et relu par phase en dernière ligne du script), puis copiées dans `public/images/sources/` et préparées par `npm run images`.

| Nom | Format | Usage prévu |
|---|---|---|
| `ouverture-cuisine-avant` | 1536 × 1024 | ouverture de l'accueil, côté « avant » du curseur (partie 3) |
| `ouverture-cuisine-apres` | 1536 × 1024 | rendu du moteur V2 sur l'image précédente (`--rendu`), côté « après », étiqueté « Simulation » |
| `piece-cuisine`, `piece-salle-de-bain`, `piece-meubles`, `piece-murs`, `piece-pro` | 1024 × 1024 | les cinq cartes de pièces (accueil, simulateur, réalisations), études simulées de l'accueil |
| `pro-hotel`, `pro-restaurant`, `pro-commerce` | 1536 × 1024 | `/pro`, trois références d'ambiance (partie 4) |
| `etape-photo`, `etape-pose` | 1536 × 1024 | « Comment ça marche », étapes 1 et 3 (partie 3) |
| `ouverture-salle-de-bain-avant` | 1536 × 1024 | réserve : seconde ouverture si la première déçoit (générée seulement sur demande, `--seulement`) |

- **Fonds Unsplash** : `public/images/fonds/` garde les paires encore servies (guides, pages par pièce, exemple de l'espace client) ; les 11 paires que plus rien ne servait sont retirées du dépôt (9 orphelines d'avant, 2 devenues orphelines à la partie 1 : fond des pages locales et texture marbre du catalogue). La partie 5 tranche le reste.
- **Vidéo d'ouverture retirée** (`public/videos/`) : vidéo d'ambiance non prouvée (ni chantier filmé, ni simulation étiquetée), remplacée par une image et le curseur avant / après.
- **Tests** : `src/lib/images-manifeste.test.ts` (sorties planifiées, manifeste trié et identique au fichier, empreintes ; la préparation dans un dossier temporaire : original remplacé sous le même nom à date égale → sorties refaites, largeurs d'avant retirées), `src/lib/images-depot.test.ts` (chaque original au manifeste, avec son empreinte, et ses fichiers dans `prep/`, rien d'autre ; aucun fond orphelin ; pas de vidéo, pas d'image à la racine), `src/components/simulation/cartes-pieces.test.ts` (dont le chargement immédiat des premières cartes).

## 8. L'accueil (mission 16, partie 3)

Huit sections, dans l'ordre de `sectionsAccueil()` (`src/components/accueil/sections.ts`), rien d'autre : ouverture, « Essayez sur votre photo » (le module de la mission 15), trois faits, matières, réalisations, comment ça marche, confiance, dernier appel. Un seul geste : « Simuler ma cuisine » → `/simulateur?projet=cuisine&depuis=…`.

- **Ouverture** : `choisirOuverture` (`etudes.ts`) prend la première réalisation publiée par le CRM qui a une photo avant ET après (« Réalisation, <ville> ») ; sinon le rendu du moteur sur l'image d'ambiance (`ouverture-cuisine-avant` / `-apres`, étiquette « Simulation »). L'« avant » est le LCP : AVIF (≤ 80 Ko, testé), `fetchpriority="high"`, hauteur ≤ `100svh` moins l'en-tête ; une réalisation passe en WebP réduit par le CRM (`sourcesPhotoCrm` : `srcset` de `/api/site/photos/<id>/<avant|apres>?l=480|960|1600`).
- **Réalisations** : `choisirEtudes` — les réalisations publiées (3 au plus, avec leur photo après ; `CarteRealisation`, la même carte que `/realisations` : matières si elles sont publiées, prix et durée publiés, sinon la fourchette et la durée habituelles d'`offre.ts` pour ce type de projet, libellées « Prix habituel : … » / « … en général », `lib/etude-de-cas.ts` ; bouton « Voir les réalisations »), sinon trois études simulées : la cuisine de l'ouverture (« Simulation »), la salle de bain et les meubles en image d'ambiance (« Ambiance »), chacune avec la fourchette d'`offre.ts` et la durée de pose, jamais une ville, sans bouton vers `/realisations` (vide).
- **Matières** : 8 références réelles (`src/lib/matieres-vedettes.ts`, une par famille d'usage), vignettes de 320 px du CRM, lien `/matieres?ref=<ref>` : le catalogue relit `ref` (`referenceDeLAdresse`), ouvre la fiche et filtre sa famille.
- **Confiance** : `GET <CRM>/api/site/avis-google` (relu toutes les heures, `src/lib/avis-google.ts`) ; le bloc « Note Google » n'existe que si la réponse porte une note ET un nombre (`blocAvis`). Attribution exigée par les règles de la Places API : chaque extrait porte l'avatar et le nom de l'auteur tel que Google le donne (lien vers son profil) et un lien « Voir l'avis » vers Google Maps ; sous les extraits, l'ordre des avis (`ORDRE_AVIS`) et la mention « Google Maps » (jetons `font-google`, `text-google`). Toujours : la zone (lien `/zones`) et la garantie d'`offre.ts`.
- **Bouton collé** (téléphone) : apparaît quand le bouton de l'ouverture sort de l'écran ; s'efface sur le module de simulation, « Comment ça marche », le dernier appel et le pied de page (`CIBLES_BOUTON_COLLE`).
