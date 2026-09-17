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
| `SIMULATION_PHOTO` | `simulation_photo_uploaded` | photo prête (poids, largeur) |
| `SIMULATION_LANCEE` | `simulation_textures_selected` | clic « Voir le résultat » |
| `SIMULATION_RESULTAT` | `simulation_generated` | rendu affiché (durée, gardé côté CRM ou non) |
| `SIMULATION_ECHEC` | `simulation_failed` | photo illisible, quota, génération, réseau (`raison`) |
| `DEVIS_DEMANDE` | `devis_form_submitted` | formulaire /devis ou demande après simulation |
| `CONTACT_ENVOYE` | `contact_form_submitted` | formulaire /contact |
| `FORMULAIRE_ECHEC` | — | envoi refusé ou coupé (`raison`, `statut`) |
| — | `cta_clicked`, `whatsapp_clicked`, `phone_clicked` | boutons |

Meta : `track` mappe `simulation_generated`, `devis_form_submitted` → `Lead`, `contact_form_submitted` → `Contact`, `simulation_photo_uploaded` → `InitiateCheckout` (pixel chargé seulement avec l'accord « Publicité » du bandeau, si `NEXT_PUBLIC_META_PIXEL_ID` est posée).

## 3. Ce qui part avec chaque contact (webhook CRM)

Nom, téléphone, e-mail, ville, code postal, projet, message, style, photos (formulaire), simulations du parcours (identifiants, rattachées par le CRM), consentement mail daté (`consentementMail`, `consentementTexte`), identifiant de parcours, origine (`campaign_name` = utm_campaign, `ad_name` = utm_content, `form_name` = formulaire ou page), adresse IP du visiteur (limite anti-abus). Réponse du CRM journalisée côté Vercel : `[CRM] lead enregistré id=… photos=… consentement=… simulations=…`.

## 4. À faire dans Google Tag Manager (Lucas)

1. Déclencheurs « Événement personnalisé » sur `devis_form_submitted`, `contact_form_submitted`, `simulation_generated`.
2. Tags GA4 « événement » (conversions) et, si campagnes Meta : tag Pixel Meta `Lead` sur les deux premiers, ou poser `NEXT_PUBLIC_META_PIXEL_ID` sur Vercel pour que le site charge le pixel lui-même (après accord cookies).
3. Le consent mode v2 est initialisé par le site (tout refusé par défaut, mis à jour par le bandeau) : ne pas le redéfinir dans GTM.

## 5. Variables d'environnement liées

- Vercel : `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID` (optionnel), `NEXT_PUBLIC_CLARITY_ID` (optionnel), `NEXT_PUBLIC_SIMULATE_URL` (`https://crm.coverswap.fr/api/simulate`, sert aussi à trouver `/api/site/evenements`), `SIMULATE_TOKEN_SECRET`, `CRM_WEBHOOK_URL`, `CRM_WEBHOOK_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (captcha, inactif sans clés).
- Railway : `SIMULATE_TOKEN_SECRET`, `OPENAI_API_KEY`, `WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` (expéditeur vérifié chez Resend : sans lui, l'accusé de réception au visiteur ne part pas), `LEAD_NOTIFICATION_EMAIL`.
