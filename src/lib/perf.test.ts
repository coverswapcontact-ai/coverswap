import assert from "node:assert/strict";
import { MEDIA_ECRAN_LARGE, MEDIA_TELEPHONE, plafonnerSrcset } from "@/lib/images-preparees";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, mock, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import nextConfig from "../../next.config";
import { FORMAT_CAPTURE, HAUTEUR_MAX_CAPTURE, LARGEUR_CONTROLE, LARGEURS_CAPTURES, PAGE_RESULTAT, PAGES_CAPTURES, cheminsDuPlan, echelle, hotesCrm, lireOptions, nomCapture, nomDeChemin, requeteCoupee, tranchesCapture } from "../../scripts/captures.mjs";
import { comparerCaptures, lireNomCapture, resumeMarkdown } from "../../scripts/comparer-captures.mjs";
import { ContenuAvisPrix } from "@/components/accueil/AvisPrix";
import { CommentOnTravaille } from "@/components/accueil/CommentOnTravaille";
import { CuisinesCommeLaVotre } from "@/components/accueil/CuisinesCommeLaVotre";
import { IMAGE_OUVERTURE, TAILLES_OUVERTURE, adresseMoyenne, choisirOuverture, prechargementsOuverture } from "@/components/accueil/etudes";
import { Ouverture } from "@/components/accueil/Ouverture";
import { ParOuCommencer } from "@/components/accueil/ParOuCommencer";
import { Presentoir } from "@/components/accueil/Presentoir";
import { ProAccueil } from "@/components/accueil/ProAccueil";
import { QuestionsAccueil } from "@/components/accueil/QuestionsAccueil";
import { RealisationsAccueil } from "@/components/accueil/RealisationsAccueil";
import { ImagePreparee } from "@/components/simulation/ImagePreparee";
import { Section } from "@/components/simulation/Section";
import { differer } from "./differer";
import { urlEvenements } from "./evenements-site";
import { MANIFESTE_IMAGES } from "./images-manifeste";
import { sourcesPhoto, type ManifesteImages } from "./images-preparees";
import { DELAI_RECHERCHE_MS } from "./matieres";
import { APRES_CHARGEMENT_MS, GESTES, adressePrechargeable, attendreLeMoment } from "./prechargement-liens";
import { sourcesPhotoCrm, type Publication } from "./publications";

/**
 * Mission 16 (partie 6) — performance, mesure, intégration continue. Ce que Lighthouse mesure en CI, ces tests le
 * GARDENT dans le code : aucun script tiers hors Turnstile (ni GTM, ni GA4, ni pixel Meta, ni Clarity, ni Vercel
 * Analytics), plus de bandeau cookies ; « use client » seulement sur la liste blanche ; l'« avant » de l'ouverture
 * préchargé sur `/` et les prestations seulement ; `globals.css` ≤ 200 lignes ; sections sous la ligne de flottaison en
 * `content-visibility: auto` ; images préparées en cache immuable, adresse versionnée ; recherche des matières
 * différée ; `lighthouserc.json` et le workflow de CI tels que la conception les décrit ; la comparaison des captures.
 */

const RACINE = process.cwd();
/** Fins de ligne ramenées à LF : sous Windows (`core.autocrlf`), git réécrit les fichiers en CRLF au checkout. */
const lire = (f: string) => readFileSync(path.join(RACINE, f), "utf8").replace(/\r\n/g, "\n");

function fichiers(dossier: string): string[] {
  const sortie: string[] = [];
  for (const nom of readdirSync(path.join(RACINE, dossier))) {
    const relatif = `${dossier}/${nom}`;
    if (statSync(path.join(RACINE, relatif)).isDirectory()) sortie.push(...fichiers(relatif));
    else if (/\.(ts|tsx)$/.test(nom) && !/\.test\.ts$/.test(nom)) sortie.push(relatif);
  }
  return sortie;
}
const SOURCES = fichiers("src");

/**
 * Les SEULS composants clients (mission 16, partie 6, énoncé § 6 : rendu serveur par défaut). Un dossier entier se
 * termine par « / ». Tout autre fichier qui déclare « use client » fait échouer le test : il passe serveur, ou il
 * entre ici avec sa raison.
 */
const CLIENTS_ADMIS: Record<string, string> = {
  "src/app/simulateur/_components/": "le simulateur (mission 15)",
  "src/components/espace/": "l'espace client (hors mission 16 : importé sans y écrire)",
  "src/components/MenuMobile.tsx": "le menu du téléphone",
  "src/components/SuiviParcours.tsx": "les pages vues, sans cookie",
  "src/components/OppositionMesure.tsx": "« Ne pas compter mes visites » : lit et écrit le refus dans le stockage local (mission 17)",
  "src/components/simulation/AvantApres.tsx": "le curseur avant / après",
  "src/components/simulation/PleinEcran.tsx": "le plein écran",
  "src/components/simulation/ZoomImage.tsx": "le zoom du plein écran",
  "src/components/simulation/Feuille.tsx": "les feuilles",
  "src/components/simulation/FeuilleCatalogue.tsx": "la feuille du catalogue (simulateur, espace)",
  "src/components/simulation/BoutonColle.tsx": "le bouton collé (observe ses cibles)",
  "src/components/simulation/EcranAttente.tsx": "l'attente du rendu (simulateur, espace)",
  "src/components/simulation/FilEtapes.tsx": "le fil des étapes (simulateur, espace)",
  "src/components/simulation/FonduRendu.tsx": "l'arrivée du rendu (simulateur, espace)",
  "src/components/simulation/TuileFilm.tsx": "un état : la vignette qui ne répond pas",
  "src/components/DevisForm.tsx": "formulaire (/contact)",
  "src/components/ChampPhotos.tsx": "formulaire : les photos",
  "src/components/CaseConsentement.tsx": "formulaire : le consentement",
  "src/components/Turnstile.tsx": "formulaire : le captcha au premier geste",
  "src/components/Desinscription.tsx": "formulaire : la désinscription",
  "src/app/contact/_components/FormulaireContact.tsx": "formulaire (/contact)",
  "src/app/pro/_components/FormulairePro.tsx": "formulaire (/pro)",
  "src/app/matieres/_components/Matieres.tsx": "le catalogue : familles, recherche, favoris, matière en grand",
  "src/components/accueil/BoutonWhatsApp.tsx": "le clic compté (WHATSAPP_CLIQUE)",
  "src/components/accueil/FormulaireRappel.tsx": "formulaire : « Être rappelé » de l'accueil, dans une feuille (site 3.0, lot B6)",
  "src/components/HorsEspaceClient.tsx": "lit l'adresse (usePathname) ; ses enfants restent serveur",
  "src/components/HorsSimulateur.tsx": "lit l'adresse (usePathname) ; ses enfants restent serveur",
  "src/components/ScrollToTop.tsx": "remet la page en haut à chaque navigation",
  "src/components/Prechargements.tsx": "le préchargement de l'image du premier écran, hors de la charge RSC (site 3.0, lot F6)",
  "src/components/PrechargementDiffere.tsx": "le préchargement des liens, au geste puis après le chargement (site 3.0, lot F7)",
  "src/components/accueil/FeuilleRappel.tsx": "la feuille « Être rappelé », chargée au premier geste vers son bouton (site 3.0, lot F7)",
  "src/components/simulation/BoutonVideo.tsx": "le bouton qui ouvre une vidéo dans le plein écran, chargé au premier geste (mission 22, partie B)",
  "src/components/simulation/VideoBoucle.tsx": "la vidéo en boucle de /matieres : lecture à l'écran seulement, jamais avec moins de mouvement (mission 22, partie B)",
};
/** La directive seule sur sa ligne (une mention dans un commentaire ne compte pas). */
const estClient = (source: string) => /^["']use client["'];?\s*$/m.test(source);
const admis = (f: string) => Object.keys(CLIENTS_ADMIS).some((cle) => (cle.endsWith("/") ? f.startsWith(cle) : f === cle));

describe("JavaScript client : « use client » sur la liste blanche seulement", () => {
  test("aucun composant client hors liste ; aucune entrée périmée ; rien de client dans src/lib", () => {
    const clients = SOURCES.filter((f) => estClient(lire(f)));
    const horsListe = clients.filter((f) => !admis(f));
    assert.deepEqual(horsListe, [], `« use client » hors liste blanche : ${horsListe.join(", ")}`);
    for (const cle of Object.keys(CLIENTS_ADMIS).filter((c) => !c.endsWith("/"))) {
      assert.ok(existsSync(path.join(RACINE, cle)), `${cle} n'existe plus : retirer l'entrée`);
      assert.ok(estClient(lire(cle)), `${cle} n'est plus client : retirer l'entrée`);
    }
    assert.deepEqual(clients.filter((f) => f.startsWith("src/lib/")), []);
  });

  test("les cartes de pièces (sans état) passent serveur : /realisations les rend sans JavaScript", () => {
    const cartes = lire("src/components/simulation/CartesPieces.tsx");
    assert.ok(!estClient(cartes));
    assert.match(cartes, /onClick=\{onChoisir \? \(\) => onChoisir\(p\.id\) : undefined\}/, "un bouton sans onChoisir n'a pas de gestionnaire");
    // Les composants de page qui n'ont pas d'état restent serveur.
    for (const f of ["src/components/EnteteSite.tsx", "src/components/PiedDePage.tsx", "src/components/simulation/Section.tsx", "src/components/simulation/Lien.tsx", "src/components/simulation/Photo.tsx", "src/components/simulation/Bouton.tsx", "src/components/accueil/Ouverture.tsx", "src/components/accueil/AvisPrix.tsx", "src/components/accueil/ParOuCommencer.tsx", "src/components/accueil/CuisinesCommeLaVotre.tsx", "src/components/accueil/CommentOnTravaille.tsx", "src/components/accueil/Presentoir.tsx", "src/components/accueil/RealisationsAccueil.tsx", "src/components/accueil/ProAccueil.tsx", "src/components/accueil/QuestionsAccueil.tsx", "src/components/accueil/DernierAppel.tsx", "src/components/BlocPrix.tsx", "src/components/Logo.tsx", "src/components/revue/Cartel.tsx", "src/components/revue/BandeMatiere.tsx", "src/components/revue/GrandNumero.tsx", "src/components/revue/Pastille497.tsx", "src/components/revue/Echantillon.tsx"]) assert.ok(!estClient(lire(f)), f);
  });
});

describe("scripts tiers et cookies : plus rien hors Turnstile", () => {
  const RETIRES = ["src/components/Analytics.tsx", "src/components/CookieBanner.tsx", "src/components/BoutonCookies.tsx", "src/lib/cookies.ts", "src/lib/analytics.ts"];

  test("next/script seulement pour Turnstile ; aucun domaine de mesure dans le code", () => {
    const avecScript = SOURCES.filter((f) => /from "next\/script"/.test(lire(f)));
    assert.deepEqual(avecScript, ["src/components/Turnstile.tsx"]);
    const domaines = new Set<string>();
    for (const f of avecScript) for (const m of lire(f).matchAll(/src="https:\/\/([^/"]+)/g)) domaines.add(m[1]);
    assert.deepEqual([...domaines], ["challenges.cloudflare.com"]);
    for (const f of SOURCES) {
      const source = lire(f);
      assert.doesNotMatch(source, /googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|clarity\.ms|_vercel\/insights|@vercel\/analytics|\bgtag\(|\bfbq\(|window\.dataLayer/, f);
      assert.doesNotMatch(source, /<script[^>]+src=/, `${f} : un <script src> à la main`);
    }
  });

  test("les variables des traceurs ne sont plus lues ; @vercel/analytics désinstallé ; les composants retirés ne reviennent pas", () => {
    for (const f of [...SOURCES, "next.config.ts"]) assert.doesNotMatch(lire(f), /NEXT_PUBLIC_(GTM_ID|GA_ID|META_PIXEL_ID|CLARITY_ID)/, f);
    assert.doesNotMatch(lire("src/app/api/health/route.ts"), /GTM|GA_ID|PIXEL|CLARITY/);
    // Le modèle de configuration (commité, sans valeurs) ne les déclare plus : cités en commentaire, à retirer de Vercel.
    assert.doesNotMatch(lire(".env.example"), /^NEXT_PUBLIC_(GTM_ID|GA_ID|META_PIXEL_ID|CLARITY_ID)=/m);
    const paquet = JSON.parse(lire("package.json"));
    assert.equal(paquet.dependencies["@vercel/analytics"], undefined);
    assert.equal(paquet.devDependencies?.["@vercel/analytics"], undefined);
    for (const f of RETIRES) assert.ok(!existsSync(path.join(RACINE, f)), `${f} est revenu`);
    const gabarit = lire("src/app/layout.tsx");
    assert.doesNotMatch(gabarit, /<noscript|<iframe|<CookieBanner|<Analytics|<VercelAnalytics|import (CookieBanner|Analytics)/);
    assert.match(gabarit, /<SuiviParcours \/>/, "la mesure première partie, sans cookie, reste");
  });

  test("plus de bandeau cookies : ni « Gérer les cookies », ni stockage du choix ; la politique le dit", () => {
    assert.doesNotMatch(lire("src/components/PiedDePage.tsx"), /Gérer les cookies|BoutonCookies/);
    assert.doesNotMatch(lire("src/app/mentions-legales/page.tsx"), /Gérer les cookies/);
    for (const f of SOURCES) assert.doesNotMatch(lire(f), /cookie-consent/, f);
    const politique = lire("src/app/politique-confidentialite/page.tsx");
    assert.match(politique, /ne dépose aucun cookie de mesure d&apos;audience ni de publicité/);
    assert.match(politique, /IndexedDB/, "le stockage local du simulateur, en une phrase");
    assert.match(politique, /Vos matières favorites \(simulateur et page Matières\) restent dans son stockage local/, "les favoris : localStorage");
    assert.doesNotMatch(politique, /Tag Manager|Analytics|Clarity|pixel\)|bandeau cookies\)|Gérer les cookies/);
  });

  test("la politique dit ce qui part vraiment : photo dès son choix, Turnstile du simulateur, envoi à Meta de toute demande qui avance", () => {
    const politique = lire("src/app/politique-confidentialite/page.tsx");
    // La photo part au CRM dès son choix (analyse, conversion HEIC), pas au lancement (`useAnalyse`, `convertirPhotoParLeCrm`).
    assert.match(politique, /Votre photo part vers notre outil de gestion dès que vous la choisissez/);
    assert.doesNotMatch(politique, /ne quittent votre appareil que lorsque/);
    // Le simulateur rend Turnstile sans attendre un geste (écran des matières, résultat) : la politique ne dit plus « formulaire seulement ».
    assert.match(politique, /Cloudflare Turnstile ne sert qu&apos;à protéger le simulateur et nos formulaires des robots/);
    assert.doesNotMatch(politique, /chargé seulement quand vous commencez à remplir un formulaire/);
    // Le CRM envoie à Meta l'étape, le montant et les coordonnées hachées de TOUTE demande qui avance, quelle que soit sa source.
    const meta = politique.split("\n").find((l) => l.includes('nom: "Meta Platforms'));
    assert.ok(meta, "ligne Meta des sous-traitants");
    assert.match(meta, /quand votre demande avance/);
    assert.match(meta, /forme hachée/);
    assert.doesNotMatch(meta, /—/, "le « — » sépare nom, rôle et lieu dans la liste");
    assert.doesNotMatch(politique, /si votre demande nous vient d(&apos;|')une publicité/);
    assert.match(politique, /Intérêt légitime \(mesure de nos campagnes\)/);
    // Les pages vues gardées par le CRM ont leur ligne de durée : 25 mois (mission 17, purge du CRM).
    assert.match(politique, /Pages vues et étapes du simulateur dans notre outil de gestion/);
  });

  test("mission 17 : la mesure d'audience exemptée est décrite, bornée, et on peut s'y opposer", () => {
    const politique = lire("src/app/politique-confidentialite/page.tsx");
    assert.match(politique, /id="mesure-audience"/);
    assert.match(politique, /Intérêt légitime \(mesure d&apos;audience, exemptée de consentement/);
    // Ce qui part, ce que le CRM en fait, combien de temps.
    for (const mot of ["la page", "fuseau horaire", "campagne", "visiteur du jour", "détruite chaque jour", "Votre adresse IP et le détail de votre navigateur ne sont jamais conservés"]) assert.ok(politique.includes(mot), mot);
    assert.match(politique, /le pays, déduit du\s+fuseau horaire, sans géolocalisation/);
    assert.match(politique, /\(page, provenance, visiteur du jour, type d&apos;appareil, pays\) :\s+25 mois, puis supprimées/);
    assert.doesNotMatch(politique, /sans durée\s+maximale/, "plus de conservation illimitée");
    assert.doesNotMatch(politique, /identifiant de visite tiré au hasard/, "plus d'identifiant de mesure sur l'appareil");
    // Le parcours du simulateur n'est plus persistant : 7 jours au plus, jamais prolongés.
    assert.match(politique, /7 jours au plus/);
    // L'opposition : le bouton est sur la page ; il envoie un drapeau lu par envoyerEvenement (evenements-site.test.ts).
    assert.match(politique, /<OppositionMesure \/>/);
    assert.match(politique, /Global Privacy Control/);
    const bouton = lire("src/components/OppositionMesure.tsx");
    assert.match(bouton, />\s*Ne pas compter mes visites\s*</);
    assert.match(lire("src/lib/evenements-site.ts"), /if \(mesureRefuseeIci\(\)\) return false;/);
  });

  test("les événements du parcours ne partent qu'au CRM ; coupés en intégration continue", () => {
    assert.equal(urlEvenements("https://crm.coverswap.fr/api/simulate", undefined), "https://crm.coverswap.fr/api/site/evenements");
    assert.equal(urlEvenements("https://crm.coverswap.fr/api/simulate/", ""), "https://crm.coverswap.fr/api/site/evenements");
    assert.equal(urlEvenements("https://crm.coverswap.fr/api/simulate", "1"), "");
    assert.equal(urlEvenements(undefined, undefined), "");
  });
});

describe("l'ouverture : l'« avant » préchargé sur / et les prestations seulement", () => {
  test("simulation : deux préchargements AVIF (téléphone plafonné à 960 px, écran large entier), mêmes sizes et media que le <picture>", () => {
    const choix = choisirOuverture([]);
    assert.ok(choix);
    const [telephone, large, ...rien] = prechargementsOuverture(choix);
    assert.ok(telephone && large);
    assert.deepEqual(rien, []);
    const avant = sourcesPhoto(IMAGE_OUVERTURE.avant)!;
    const v = MANIFESTE_IMAGES[IMAGE_OUVERTURE.avant].empreinte;
    const plafonne = plafonnerSrcset(avant.avif!);
    assert.ok(!plafonne.includes("1536w") && plafonne.includes("960w"));
    assert.deepEqual(telephone.options, { as: "image", fetchPriority: "high", referrerPolicy: "no-referrer", imageSrcSet: plafonne, imageSizes: TAILLES_OUVERTURE, type: "image/avif", media: MEDIA_TELEPHONE });
    assert.deepEqual(large.options, { as: "image", fetchPriority: "high", referrerPolicy: "no-referrer", imageSrcSet: avant.avif, imageSizes: TAILLES_OUVERTURE, type: "image/avif", media: MEDIA_ECRAN_LARGE });
    assert.equal(telephone.href, `/images/prep/${IMAGE_OUVERTURE.avant}-960.avif?v=${v}`);
    // Le <picture> de l'ouverture annonce les mêmes séries, sizes et media : le préchargement sert la même image.
    const html = renderToStaticMarkup(createElement(Ouverture, { choix }));
    assert.ok(html.includes(`<source media="${MEDIA_TELEPHONE}" type="image/avif" srcSet="${plafonne}" sizes="${TAILLES_OUVERTURE}"/>`));
    assert.ok(html.includes(`<source type="image/avif" srcSet="${avant.avif}" sizes="${TAILLES_OUVERTURE}"/>`));
    // Les deux images de l'ouverture (l'« après » est le LCP) en priorité haute.
    assert.equal((html.match(/fetchPriority="high"/g) ?? []).length, 2);
  });

  test("plafonnerSrcset : garde jusqu'à 960 px, jamais vide", () => {
    assert.equal(plafonnerSrcset("/a-480.avif 480w, /a-960.avif 960w, /a-1536.avif 1536w"), "/a-480.avif 480w, /a-960.avif 960w");
    assert.equal(plafonnerSrcset("/a-480.avif 480w, /a-960.avif 960w"), "/a-480.avif 480w, /a-960.avif 960w");
    assert.equal(plafonnerSrcset("/a-1200.avif 1200w, /a-1600.avif 1600w"), "/a-1200.avif 1200w");
  });

  test("réalisation du CRM : les WebP réduits ; sans image : rien", () => {
    const reelle: Publication = { id: "b", type: "REALISATION", titre: "Chantier", texte: null, ville: "Lattes", typeProjet: "CUISINE", note: null, auteur: null, photoAvant: "https://crm.example.test/api/site/photos/b/avant", photoApres: "https://crm.example.test/api/site/photos/b/apres", publieLe: "2026-09-01T00:00:00.000Z" };
    const [telephone, large] = prechargementsOuverture(choisirOuverture([reelle]));
    assert.ok(telephone && large);
    assert.equal(telephone.options.type, "image/webp");
    assert.equal(large.options.imageSrcSet, sourcesPhotoCrm(reelle.photoAvant!).webp);
    assert.equal(telephone.options.imageSrcSet, plafonnerSrcset(sourcesPhotoCrm(reelle.photoAvant!).webp!));
    assert.equal(telephone.href, "https://crm.example.test/api/site/photos/b/avant?l=960");
    assert.deepEqual(prechargementsOuverture(null), []);
    assert.deepEqual(prechargementsOuverture(choisirOuverture([], {} as ManifesteImages)), []);
    assert.equal(adresseMoyenne("/a-480.avif 480w, /a-960.avif 960w, /a-1536.avif 1536w"), "/a-960.avif");
    assert.equal(adresseMoyenne("/a-1200.avif 1200w, /a-1600.avif 1600w"), "/a-1200.avif");
  });

  test("appelé par la page d'accueil, les pages de prestation (lot C1) et /pro (lot C2), qui ouvrent sur un curseur, par elles seules ; l'ancien préchargement du poster n'existe plus", () => {
    // Lot F6 : par le composant client `Prechargements` (jamais `preload` dans un composant serveur : voir le test suivant).
    const accueil = lire("src/app/page.tsx");
    assert.match(accueil, /<Prechargements liste=\{prechargementsOuverture\(ouverture\)\} \/>/);
    // La page de prestation précharge l'« avant » de SON ouverture, avec les `sizes` de son `<picture>`.
    const prestation = lire("src/app/prestations/[slug]/page.tsx");
    assert.match(prestation, /<Prechargements liste=\{prechargementsOuverture\(ouverture, TAILLES_OUVERTURE_PRESTATION\)\} \/>/);
    assert.match(lire("src/components/ContenuPrestation.tsx"), /preparees=\{\{ \.\.\.ouverture\.preparees, tailles: TAILLES_OUVERTURE_PRESTATION \}\}/);
    // Lot C2 : /pro ouvre aussi sur un curseur (le comptoir, ou une réalisation PRO) : même préchargement, mêmes `sizes`.
    const pro = lire("src/app/pro/page.tsx");
    assert.match(pro, /<Prechargements liste=\{prechargementsOuverture\(ouverture, TAILLES_OUVERTURE_PRESTATION\)\} \/>/);
    assert.match(pro, /preparees=\{\{ \.\.\.ouverture\.preparees, tailles: TAILLES_OUVERTURE_PRESTATION \}\}/);
    // Lot F6 : la fiche d'une matière précharge son échantillon du CRM (le LCP), de la même façon.
    assert.match(lire("src/app/matieres/[famille]/[ref]/page.tsx"), /<Prechargements liste=\{\[\{ href: urlEchantillon\(m\.id\), options: \{ as: "image", fetchPriority: "high", referrerPolicy: "no-referrer" \} \}\]\} \/>/);
    const avecPrechargement = ["src/app/page.tsx", "src/app/prestations/[slug]/page.tsx", "src/app/pro/page.tsx", "src/app/matieres/[famille]/[ref]/page.tsx"];
    assert.deepEqual(SOURCES.filter((f) => /<Prechargements /.test(lire(f))).sort(), [...avecPrechargement].sort());
    const autres = SOURCES.filter((f) => f !== "src/components/Prechargements.tsx" && /\bpreload\(|rel="preload"|hero-poster/.test(lire(f)));
    assert.deepEqual(autres, []);
  });

  test("lot F6 : aucun préchargement d'image dans la charge RSC — le préchargement de « / » (logo) ne télécharge plus l'image de l'accueil sur les autres pages", () => {
    // Le serveur RSC de React transforme en indice de préchargement (`HL`) tout `preload()`, tout `<link rel="preload">` et
    // tout `<img>` non différé (hors `<picture>`, hors `fetchPriority="low"`) d'un composant SERVEUR ; le routeur de Next
    // exécute ces indices dès qu'il précharge une page depuis un lien visible. Le composant client les garde hors de la charge.
    const composant = lire("src/components/Prechargements.tsx");
    assert.match(composant, /^"use client";/);
    assert.match(composant, /for \(const p of liste\) preload\(p\.href, p\.options\);/);
    assert.match(composant, /return null;/);
    for (const f of SOURCES.filter((s) => !estClient(lire(s)))) assert.doesNotMatch(lire(f), /import \{[^}]*\bpreload\b[^}]*\} from "react-dom"/, `${f} : preload dans un composant serveur`);
    // La grande vignette de la fiche, seul <img> prioritaire d'un composant serveur, est posée dans un <picture>.
    const fiche = lire("src/app/matieres/[famille]/[ref]/page.tsx");
    assert.match(fiche, /<picture>\s*<img src=\{urlEchantillon\(m\.id\)\}[^>]*loading="eager" fetchPriority="high"[^>]*\/>\s*<\/picture>/);
  });

  test("les polices du site 3.0 : Playfair Display et Libre Franklin par next/font, préchargées, en swap ; l'italique des cartels à la demande ; aucun appel à Google Fonts", () => {
    const gabarit = lire("src/app/layout.tsx");
    assert.match(gabarit, /import \{ Libre_Franklin, Playfair_Display \} from "next\/font\/google";/);
    assert.match(gabarit, /const playfair = Playfair_Display\(\{\s*subsets: \["latin"\],\s*variable: "--font-playfair",\s*display: "swap",\s*\}\);/);
    assert.match(gabarit, /Libre_Franklin\(\{[^}]*variable: "--font-franklin",\s*display: "swap"/);
    // Lot F6 : l'italique (38 Ko, le nom des matières des cartels seulement) n'est plus préchargée ; elle seule.
    // Lot F7 : en graisse 400 seulement (un fichier fixe de 22 Ko), la seule que portent les cartels (`font-normal`).
    assert.match(gabarit, /const playfairItalique = Playfair_Display\(\{\s*subsets: \["latin"\],\s*(?:\/\/[^\n]*\n\s*)*weight: "400",\s*style: \["italic"\],\s*variable: "--font-playfair-italique",\s*display: "swap",\s*preload: false,\s*\}\);/);
    assert.equal((gabarit.match(/preload:\s*false/g) ?? []).length, 1);
    assert.doesNotMatch(gabarit, /adjustFontFallback:\s*false/);
    assert.match(gabarit, /className=\{`\$\{playfair\.variable\} \$\{playfairItalique\.variable\} \$\{franklin\.variable\}`\}/);
    assert.match(lire("src/app/globals.css"), /--font-display-italique: var\(--font-playfair-italique\), Georgia, serif;/);
    // L'italique n'est demandée qu'avec sa famille : aucun `italic` sur la famille droite (l'italique serait imitée).
    for (const f of SOURCES) for (const l of lire(f).split("\n").filter((l) => /className=.*\bitalic\b/.test(l))) assert.match(l, /font-display-italique/, `${f} : ${l.trim().slice(0, 100)}`);
    assert.doesNotMatch(gabarit, /Space_Grotesk|\bInter\(/, "les anciennes polices sont parties");
    const css = lire("src/app/globals.css");
    assert.match(css, /--font-display: var\(--font-playfair\)/);
    assert.match(css, /--font-sans: var\(--font-franklin\)/);
    for (const f of [...SOURCES, "src/app/globals.css"]) assert.doesNotMatch(lire(f), /fonts\.googleapis|fonts\.gstatic/, `${f} appelle Google Fonts`);
  });
});

describe("CSS et rendu différé", () => {
  test("globals.css : 200 lignes au plus, plus d'utilitaire inutilisé, `sous-la-ligne` en content-visibility", () => {
    const css = lire("src/app/globals.css");
    assert.ok(css.split("\n").length <= 200, `${css.split("\n").length} lignes`);
    assert.doesNotMatch(css, /section-padding|container-custom/);
    assert.match(css, /@utility sous-la-ligne \{\s+content-visibility: auto;\s+contain-intrinsic-size: auto 640px;\s+\}/);
  });

  test("Section differee → sous-la-ligne ; les sections 2 à 9 de l'accueil le sont (site 3.0, lot B6), pas l'ouverture", () => {
    assert.match(renderToStaticMarkup(createElement(Section, { differee: true, titre: "T" })), /<section[^>]* class="[^"]*\bsous-la-ligne\b/);
    assert.doesNotMatch(renderToStaticMarkup(createElement(Section, { titre: "T" })), /sous-la-ligne/);
    const racine = (html: string) => html.slice(0, html.indexOf(">"));
    for (const [nom, element] of [
      ["2. par où commencer", createElement(ParOuCommencer)],
      ["3. des cuisines comme la vôtre", createElement(CuisinesCommeLaVotre)],
      ["4. comment on travaille", createElement(CommentOnTravaille, { depuis: "accueil-etapes", preuve: true })],
      ["5. le présentoir", createElement(Presentoir)],
      ["6. réalisations", createElement(RealisationsAccueil, { reelles: [] })],
      ["7. professionnels", createElement(ProAccueil)],
      ["8. avis et prix", createElement(ContenuAvisPrix, { avis: null, tarifs: null })],
    ] as const) assert.match(racine(renderToStaticMarkup(element)), /sous-la-ligne/, nom);
    // 9. Les questions, puis le dernier appel : deux sections, différées toutes deux (le balisage FAQPage les précède).
    const questions = renderToStaticMarkup(createElement(QuestionsAccueil));
    assert.equal((questions.match(/<section[^>]* class="[^"]*\bsous-la-ligne\b/g) ?? []).length, 2, "9. questions et dernier appel");
    assert.doesNotMatch(renderToStaticMarkup(createElement(Ouverture, { choix: choisirOuverture([]) })), /sous-la-ligne/);
    // Jamais sur une section qui porte un élément fixe ou collant (la barre des familles de /matieres).
    assert.doesNotMatch(lire("src/app/matieres/page.tsx"), /differee/);
  });
});

describe("cache et images", () => {
  test("next.config : /images/prep, /fonts et /videos (mission 22) en cache immuable d'un an ; images.unoptimized reste", async () => {
    const entetes = await nextConfig.headers!();
    for (const source of ["/images/prep/:path*", "/fonts/:path*", "/videos/:path*"]) {
      const regle = entetes.find((r) => r.source === source);
      assert.ok(regle, source);
      assert.deepEqual(regle.headers, [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]);
    }
    assert.equal(nextConfig.images?.unoptimized, true);
    assert.match(lire("next.config.ts"), /unoptimized: true,/);
  });

  test("lot F6 : une image du dépôt s'écrit en AVIF et JPEG seulement (trois séries, plus six) ; une photo du CRM garde ses WebP", () => {
    const avant = sourcesPhoto(IMAGE_OUVERTURE.avant)!;
    const html = renderToStaticMarkup(createElement(ImagePreparee, { sources: avant, tailles: TAILLES_OUVERTURE, alt: "x" }));
    assert.deepEqual([...html.matchAll(/<source ([^>]*)\/>/g)].map((m) => m[1].match(/type="([^"]+)"/)?.[1] ?? "jpg"), ["image/avif", "image/avif"]);
    assert.ok(html.includes(`<source media="${MEDIA_TELEPHONE}" type="image/avif" srcSet="${plafonnerSrcset(avant.avif)}"`), "le téléphone garde sa série plafonnée");
    assert.ok(html.includes(`<img src="${avant.src}" srcSet="${avant.jpg}"`), "le JPEG en repli, dans l'<img>");
    assert.doesNotMatch(html, /\.webp/);
    const crm = sourcesPhotoCrm("https://crm.example.test/api/site/photos/b/apres");
    const photo = renderToStaticMarkup(createElement(ImagePreparee, { sources: crm, tailles: TAILLES_OUVERTURE, alt: "x" }));
    assert.deepEqual([...photo.matchAll(/<source ([^>]*)\/>/g)].map((m) => m[1].match(/type="([^"]+)"/)?.[1]), ["image/webp", "image/webp"]);
  });

  test("une image préparée porte l'empreinte de son original (`?v=`) : une image refaite change d'adresse", () => {
    const manifeste: ManifesteImages = { a: { largeur: 1000, hauteur: 500, largeurs: [480, 960, 1000], empreinte: "0123456789ab" }, b: { largeur: 800, hauteur: 400, largeurs: [480, 800] }, c: { largeur: 800, hauteur: 400, largeurs: [480], empreinte: "../x" } };
    const a = sourcesPhoto("a", manifeste)!;
    assert.equal(a.src, "/images/prep/a-960.jpg?v=0123456789ab");
    assert.equal(a.avif, "/images/prep/a-480.avif?v=0123456789ab 480w, /images/prep/a-960.avif?v=0123456789ab 960w, /images/prep/a-1000.avif?v=0123456789ab 1000w");
    assert.equal(sourcesPhoto("b", manifeste)!.src, "/images/prep/b-800.jpg", "sans empreinte : l'adresse nue");
    assert.equal(sourcesPhoto("c", manifeste)!.src, "/images/prep/c-480.jpg", "une empreinte illisible n'entre pas dans l'adresse");
    for (const [nom, entree] of Object.entries(MANIFESTE_IMAGES)) assert.ok(sourcesPhoto(nom)!.src.endsWith(`?v=${entree.empreinte}`), nom);
  });
});

describe("INP : la recherche des matières est différée, les vignettes en lazy", () => {
  test("differer : seul le dernier appel part, 150 ms après ; annuler n'envoie rien", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      const recus: string[] = [];
      const recherche = differer((v: string) => recus.push(v), DELAI_RECHERCHE_MS);
      assert.equal(DELAI_RECHERCHE_MS, 150);
      recherche.appeler("n");
      mock.timers.tick(100);
      recherche.appeler("no");
      mock.timers.tick(100);
      recherche.appeler("noi");
      mock.timers.tick(149);
      assert.deepEqual(recus, []);
      mock.timers.tick(1);
      assert.deepEqual(recus, ["noi"]);
      recherche.appeler("noir");
      recherche.annuler();
      mock.timers.tick(500);
      assert.deepEqual(recus, ["noi"]);
    } finally {
      mock.timers.reset();
    }
  });

  test("/matieres : le champ suit la frappe, le filtre attend ; les vignettes des échantillons sont en lazy, sauf la première rangée", () => {
    const page = lire("src/app/matieres/_components/Matieres.tsx");
    assert.match(page, /useState\(\(\) => differer\(setRecherche, DELAI_RECHERCHE_MS\)\)/);
    assert.match(page, /value=\{saisie\} onChange=\{\(e\) => saisir\(e\.target\.value\)\}/);
    assert.match(page, /onClick=\{effacer\}/);
    // « Effacer » disparaît avec la saisie : le focus revient dans le champ (sinon il tombe sur <body>).
    assert.match(page, /<input ref=\{champRecherche\} id="recherche-matieres"/);
    assert.match(page, /const effacer = \(\) => \{[^}]*champRecherche\.current\?\.focus\(\);\n  \};/);
    // Site 3.0, lot D2 : l'affinage (teinte, finition, ambiance) passe par le même filtre ; le tri par teinte, hors du filtre, se fait une fois par changement (`useMemo`).
    assert.match(page, /useMemo\(\(\) => \(catalogue \? trierParTeinte\(filtrerMatieres\(catalogue, \{ filtre, recherche, favoris, teinte, finition, ambiance \}\)\) : null\)/);
    assert.match(page, /const PREMIERE_RANGEE = 5;/);
    assert.match(page, /<VignetteEchantillon matiere=\{m\} priorite=\{rang < PREMIERE_RANGEE\}/);
    assert.match(lire("src/components/revue/Echantillon.tsx"), /width=\{320\} height=\{320\} loading=\{priorite \? "eager" : "lazy"\}/);
    assert.match(lire("src/components/simulation/TuileFilm.tsx"), /width=\{320\} height=\{320\} loading="lazy"/);
  });
});

describe("intégration continue", () => {
  const rc = JSON.parse(lire("lighthouserc.json"));

  test("lighthouserc.json : les huit pages (lot F6 : + une prestation et une fiche de matière), mobile, deux passages, les seuils, rapports sur disque", () => {
    assert.deepEqual(rc.ci.collect.url, PAGES_CAPTURES.map((p: { chemin: string }) => `http://localhost:3100${p.chemin}`));
    assert.equal(rc.ci.collect.url.length, 8);
    assert.equal(rc.ci.collect.numberOfRuns, 2);
    assert.equal(rc.ci.collect.settings?.preset, undefined, "mobile par défaut, jamais le préréglage desktop");
    assert.deepEqual(rc.ci.assert.assertions, {
      // Plancher bloquant (mesure du 30/09 : 89 à 93, LCP 2,8 à 3,6 s) ; la cible de la mission reste 0,95 et 2 s (docs/SUIVI.md).
      "categories:performance": ["error", { minScore: 0.85 }],
      "categories:accessibility": ["error", { minScore: 0.95 }],
      "categories:best-practices": ["error", { minScore: 0.95 }],
      "categories:seo": ["error", { minScore: 0.95 }],
      "largest-contentful-paint": ["error", { maxNumericValue: 4000 }],
      "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
      "total-blocking-time": ["error", { maxNumericValue: 400 }],
    });
    assert.deepEqual(rc.ci.upload, { target: "filesystem", outputDir: "./lhci" });
    assert.doesNotMatch(lire("lighthouserc.json"), /temporary-public-storage/);
  });

  test("package.json : scripts lighthouse et captures, outils en devDependencies", () => {
    const paquet = JSON.parse(lire("package.json"));
    assert.equal(paquet.scripts.lighthouse, "lhci autorun --config=lighthouserc.json");
    assert.equal(paquet.scripts.captures, "node scripts/captures.mjs");
    for (const outil of ["@lhci/cli", "playwright", "pixelmatch"]) {
      assert.ok(paquet.devDependencies[outil], outil);
      assert.equal(paquet.dependencies[outil], undefined, `${outil} hors des dépendances de production`);
    }
    for (const dossier of ["/lhci/", "/.lighthouseci/", "/captures/", "/captures-precedentes/"]) assert.ok(lire(".gitignore").includes(dossier), dossier);
  });

  test("site.yml : push main + pull request, Node 22, lint, tests, build, next start 3100, Lighthouse, captures, comparaison ; aucun secret", () => {
    const flux = lire(".github/workflows/site.yml");
    assert.match(flux, /on:\n  push:\n    branches: \[main\]\n  pull_request:/);
    assert.match(flux, /uses: actions\/setup-node@v4\n        with:\n          node-version: 22\n          cache: npm/);
    const ordre = ["run: npm ci", "run: npm run lint", "run: npm test", "run: npm run build", "npx next start -p 3100", "npx lhci collect", "npx lhci upload", "npx lhci assert", "npx playwright install --with-deps chromium", "run: npm run captures", "dawidd6/action-download-artifact", "node scripts/comparer-captures.mjs captures-precedentes captures", "- name: Publier les captures"];
    let position = -1;
    for (const etape of ordre) {
      const i = flux.indexOf(etape);
      assert.ok(i > position, `${etape} manquante ou hors de l'ordre`);
      position = i;
    }
    assert.match(flux, /NEXT_PUBLIC_SIMULATE_URL: https:\/\/crm\.coverswap\.fr\/api\/simulate/);
    assert.match(flux, /NEXT_PUBLIC_SANS_EVENEMENTS: "1"/);
    assert.doesNotMatch(flux, /secrets\./, "aucun secret");
    // La comparaison n'échoue jamais le job ; Lighthouse, si (pas de continue-on-error sur l'assertion).
    const comparaison = flux.slice(flux.indexOf("- name: Comparaison"), flux.indexOf("- name: Publier les captures"));
    assert.match(comparaison, /continue-on-error: true/);
    const assertion = flux.slice(flux.indexOf("- name: Lighthouse — seuils"), flux.indexOf("- name: Publier les rapports Lighthouse"));
    assert.doesNotMatch(assertion, /continue-on-error/);
    assert.match(flux, /workflow_conclusion: success/);
    assert.match(flux, /branch: main/);
  });

  test("captures : huit pages × 390 / 768 / 1440, les mêmes que Lighthouse ; JPEG qualité 80, échelle 2 sous 768 px", () => {
    assert.deepEqual(PAGES_CAPTURES.map((p: { nom: string }) => p.nom), ["accueil", "simulateur", "matieres", "realisations", "comment-ca-marche", "pro", "prestation-cuisine", "matiere-fiche-nf13"]);
    assert.deepEqual(LARGEURS_CAPTURES.map((l: { largeur: number }) => l.largeur), [390, 768, 1440]);
    assert.deepEqual(LARGEURS_CAPTURES.map((l: { mobile: boolean }) => l.mobile), [true, false, false]);
    assert.deepEqual([360, 390, 767, 768, 1440].map(echelle), [2, 2, 2, 1, 1]);
    assert.deepEqual(FORMAT_CAPTURE, { type: "jpeg", quality: 80 });
    assert.equal(LARGEUR_CONTROLE, 360);
    assert.equal(nomCapture("comment-ca-marche", 768), "comment-ca-marche-768.jpg");
    assert.deepEqual(lireNomCapture("comment-ca-marche-768.jpg"), { page: "comment-ca-marche", largeur: 768 });
    assert.deepEqual(lireNomCapture("comment-ca-marche-768.png"), { page: "comment-ca-marche", largeur: 768 }, "les captures d'avant le site 3.0 se lisent encore");
    assert.equal(lireNomCapture("diff-accueil-390.png"), null, "une image de différence ne se compare pas");
    assert.equal(lireNomCapture("notes.txt"), null);
    // Le contrôle à 360 px existe et fait échouer le script ; le script finit en erreur après les captures.
    const script = lire("scripts/captures.mjs");
    assert.match(script, /scrollWidth/);
    assert.match(script, /process\.exit\(1\)/);
    assert.match(script, /serviceWorkers: "block"/, "un service worker ne doit pas contourner la coupure des requêtes");
  });

  test("captures : options --pages et --largeurs ; une page par son nom ou son adresse ; erreurs dites", () => {
    const defaut = lireOptions([]);
    assert.equal(defaut.dossier, "captures");
    assert.equal(defaut.pages, PAGES_CAPTURES);
    assert.equal(defaut.largeurs, LARGEURS_CAPTURES);
    const o = lireOptions(["sortie", "--pages=accueil,prestation-cuisine,/matieres?ref=NF13,/zones/montpellier", "--largeurs", "1440,390"]);
    assert.equal(o.dossier, "sortie");
    assert.deepEqual(o.pages, [
      { nom: "accueil", chemin: "/" },
      { nom: "prestation-cuisine", chemin: "/prestations/cuisine" },
      { nom: "matieres-nf13", chemin: "/matieres?ref=NF13" },
      { nom: "zones-montpellier", chemin: "/zones/montpellier" },
    ]);
    assert.deepEqual(o.largeurs.map((l: { largeur: number }) => l.largeur), [390, 1440], "triées");
    assert.deepEqual(lireOptions(["--largeurs=414"]).largeurs, [{ largeur: 414, hauteur: 844, mobile: true }]);
    assert.equal(nomDeChemin("/"), "accueil");
    assert.equal(nomDeChemin("/Matières/Bois?ref=W12"), "matieres-bois-ref-w12");
    assert.match(nomCapture(nomDeChemin("/matieres?ref=NF13"), 390), /^[a-z0-9]+(?:-[a-z0-9]+)*-390\.jpg$/, "lisible par la comparaison");
    assert.throws(() => lireOptions(["--pages=inconnue"]), /page inconnue/);
    assert.throws(() => lireOptions(["--largeurs=200"]), /largeur invalide/);
    assert.throws(() => lireOptions(["--pages"]), /attend une liste/);
    assert.throws(() => lireOptions(["--hauteur=3"]), /option inconnue/);
    assert.throws(() => lireOptions(["a", "b"]), /argument en trop/);
    assert.throws(() => lireOptions(["--etat-resultat=oui"]), /ne prend pas de valeur/);
  });

  test("captures, lot G1 : --etat-resultat (le résultat, seul ou en plus des pages), --controle-plan (le plan du site à 360 px)", () => {
    assert.deepEqual(lireOptions(["--etat-resultat"]).pages, [PAGE_RESULTAT], "seul : le résultat seulement");
    assert.equal(PAGE_RESULTAT.nom, "simulateur-resultat");
    assert.equal(PAGE_RESULTAT.chemin, "/simulateur");
    const avec = lireOptions(["sortie", "--pages=accueil,simulateur-exemples", "--etat-resultat", "--largeurs=390,1440"]);
    assert.deepEqual(avec.pages.map((p: { nom: string }) => p.nom), ["accueil", "simulateur-exemples", "simulateur-resultat"]);
    assert.equal(avec.pages[1].chemin, "/simulateur?projet=cuisine&choix=1", "l'écran Photo, cuisine choisie (« Pas de photo sous la main ? »)");
    assert.equal(lireOptions([]).controlePlan, false);
    assert.equal(lireOptions(["--controle-plan"]).controlePlan, true);
    assert.throws(() => lireOptions(["--controle-plan=1"]), /ne prend pas de valeur/);
    const xml = "<urlset><url><loc>https://coverswap.fr</loc></url><url><loc> https://coverswap.fr/matieres/couleur/NF13 </loc></url><url><loc>https://coverswap.fr/zones/montpellier?a=1&amp;b=2</loc></url></urlset>";
    assert.deepEqual(cheminsDuPlan(xml), ["/", "/matieres/couleur/NF13", "/zones/montpellier?a=1&b=2"], "les chemins, ouverts sur le site mesuré");
    assert.deepEqual(cheminsDuPlan(""), []);
    const script = lire("scripts/captures.mjs");
    // L'état est écrit là où le simulateur le lit (lib/simulateur/stockage.ts), et l'écran ouvert par « Reprendre ».
    const stockage = lire("src/lib/simulateur/stockage.ts");
    assert.match(stockage, /const BASE = "coverswap-simulateur";/);
    assert.match(stockage, /const MAGASIN = "etat";/);
    assert.match(stockage, /const CLE = "courant";/);
    assert.match(stockage, /const VERSION = 2;/);
    assert.match(script, /indexedDB\.open\("coverswap-simulateur", 2\)/);
    assert.match(script, /objectStore\("etat"\)\.put\(\{ \.\.\.etatSansPhoto, photo \}, "courant"\)/);
    assert.match(script, /getByRole\("button", \{ name: "Reprendre", exact: true \}\)/);
    assert.ok(!/Recevoir mon devis|Essayer d'autres matières|\.fill\(|\.check\(/.test(script), "aucun formulaire touché, aucune génération");
  });

  test("captures, lot G1 : une page trop haute pour une capture d'un seul tenant est prise par tranches recollées", () => {
    // Passé 16 384 px d'image, le navigateur recommence le haut de la page dans le bas de la capture (accueil à 390 px).
    assert.ok(HAUTEUR_MAX_CAPTURE <= 16_384);
    for (const [hauteur, echelleRendu] of [[14_886, 2], [5_100, 1], [8_000, 2], [1, 1], [40_001, 2]]) {
      const tranches = tranchesCapture(hauteur, echelleRendu);
      assert.equal(tranches[0].y, 0);
      assert.equal(tranches.reduce((total: number, t: { hauteur: number }) => total + t.hauteur, 0), hauteur, "toute la page, sans trou ni recouvrement");
      tranches.forEach((t: { y: number; hauteur: number }, i: number) => {
        if (i > 0) assert.equal(t.y, tranches[i - 1].y + tranches[i - 1].hauteur);
        assert.ok(t.hauteur * echelleRendu <= HAUTEUR_MAX_CAPTURE, `${hauteur} px × ${echelleRendu}`);
      });
    }
    const script = lire("scripts/captures.mjs");
    assert.match(script, /capturerPageEntiere\(page, fichier, echelle\(format\.largeur\)\)/);
    assert.match(script, /hauteur \* echelleRendu <= HAUTEUR_MAX_CAPTURE/);
    assert.match(script, /\.jpeg\(\{ quality: FORMAT_CAPTURE\.quality \}\)/, "même format que la capture d'un seul tenant");
  });

  test("captures : rien ne part (aucun POST, aucun appel au CRM ni à la génération) ; les images du CRM passent en lecture", () => {
    const hotes = hotesCrm({ NEXT_PUBLIC_SIMULATE_URL: "https://crm-essai.example.org/api/simulate", NEXT_PUBLIC_CRM_URL: "pas une adresse" });
    assert.deepEqual([...hotes].sort(), ["crm-essai.example.org", "crm.coverswap.fr"]);
    const coupee = (methode: string, url: string, type = "fetch") => requeteCoupee({ methode, url, type }, hotes);
    for (const methode of ["POST", "PUT", "PATCH", "DELETE", "post"]) assert.equal(coupee(methode, "http://localhost:3100/api/contact"), true, methode);
    assert.equal(coupee("POST", "https://crm.coverswap.fr/api/site/evenements", "ping"), true, "sendBeacon");
    assert.equal(coupee("GET", "https://crm.coverswap.fr/api/site/tarifs"), true);
    assert.equal(coupee("GET", "https://crm-essai.example.org/api/site/zones"), true);
    assert.equal(coupee("GET", "https://coverswap-crm.up.railway.app/api/health"), true);
    assert.equal(coupee("GET", "https://crm.coverswap.fr/api/site/echantillons/NF13?l=320", "image"), false, "vignettes des matières");
    for (const chemin of ["/api/simulate", "/api/simulate-v2", "/api/simulation/abc"]) assert.equal(coupee("GET", `http://localhost:3100${chemin}`), true, chemin);
    assert.equal(coupee("GET", "http://localhost:3100/api/site/evenements?x=1"), true);
    for (const [url, type] of [["http://localhost:3100/", "document"], ["http://localhost:3100/_next/static/chunks/a.js", "script"], ["http://localhost:3100/images/prep/a-640.avif", "image"], ["http://localhost:3100/api/tarifs", "fetch"]]) assert.equal(coupee("GET", url, type), false, url);
    assert.equal(coupee("HEAD", "http://localhost:3100/"), false);
  });

  test("comparaison : pixels changés, hauteur changée, image de différence, résumé ; rien à comparer sans référence", async () => {
    const racine = mkdtempSync(path.join(tmpdir(), "coverswap-captures-"));
    try {
      const avant = path.join(racine, "avant");
      const apres = path.join(racine, "apres");
      const png = async (fichier: string, largeur: number, hauteur: number, bloc?: { x: number; y: number }) => {
        const fond = sharp({ create: { width: largeur, height: hauteur, channels: 4, background: { r: 245, g: 244, b: 241, alpha: 1 } } });
        const composes = bloc ? [{ input: await sharp({ create: { width: 10, height: 10, channels: 4, background: { r: 26, g: 26, b: 26, alpha: 1 } } }).png().toBuffer(), left: bloc.x, top: bloc.y }] : [];
        writeFileSync(fichier, await fond.composite(composes).png().toBuffer());
      };
      mkdirSync(avant);
      mkdirSync(apres);
      await png(path.join(avant, "accueil-375.png"), 50, 40);
      await png(path.join(apres, "accueil-375.png"), 50, 40);
      await png(path.join(avant, "pro-375.png"), 50, 40);
      await png(path.join(apres, "pro-375.png"), 50, 40, { x: 5, y: 5 });
      await png(path.join(avant, "matieres-375.png"), 50, 40);
      await png(path.join(apres, "matieres-375.png"), 50, 50);
      await png(path.join(apres, "simulateur-375.png"), 50, 40);
      await png(path.join(avant, "diff-accueil-375.png"), 50, 40);

      const r = await comparerCaptures({ avant, apres });
      assert.equal(r.reference, true);
      type Comparee = { page: string; largeur: number; changes: number; pourcent: number; avant: string; apres: string; erreur?: string };
      const ligne = (page: string): Comparee => {
        const trouvee = r.lignes.find((l: { page: string }) => l.page === page) as Comparee | undefined;
        assert.ok(trouvee && !trouvee.erreur, `${page} : ${trouvee?.erreur ?? "absente"}`);
        return trouvee;
      };
      assert.equal(ligne("accueil").changes, 0);
      assert.equal(ligne("pro").changes, 100, "le bloc de 10 × 10");
      assert.equal(ligne("pro").pourcent, 5);
      assert.equal(ligne("matieres").changes, 500, "la bande en plus compte comme changée");
      assert.equal(ligne("matieres").avant, "50×40");
      assert.equal(ligne("matieres").apres, "50×50");
      assert.deepEqual(r.nouvelles, ["simulateur-375.png"]);
      assert.deepEqual(r.disparues, []);
      for (const page of ["accueil", "pro", "matieres"]) assert.ok(existsSync(path.join(apres, `diff-${page}-375.png`)), page);
      const texte = resumeMarkdown(r);
      assert.match(texte, /\| Page \| Largeur \| Pixels changés \| Taille \(avant → après\) \|/);
      assert.match(texte, /\| accueil \| 375 \| aucun \| 50×40 \|/);
      assert.match(texte, /\| pro \| 375 \| 5 % \| 50×40 \|/);
      assert.match(texte, /\| matieres \| 375 \| [\d,]+ % \| 50×40 → 50×50 \|/);
      assert.match(texte, /Nouvelles : simulateur-375\.png\./);
      assert.match(texte, /Information seulement/);
      // Sans capture de référence (premier passage) : rien à comparer, et le dit.
      const vide = await comparerCaptures({ avant: path.join(racine, "absent"), apres });
      assert.equal(vide.reference, false);
      assert.match(resumeMarkdown(vide), /Aucune capture de référence/);
    } finally {
      rmSync(racine, { recursive: true, force: true });
    }
  });

  test("docs/SUIVI.md dit comment lire la CI, où sont les artefacts, ce que veut dire un échec Lighthouse", () => {
    const suivi = lire("docs/SUIVI.md");
    assert.match(suivi, /## 11\. /);
    for (const mot of ["lighthouserc.json", "artefact", "lighthouse", "captures", "diff-", "NEXT_PUBLIC_SANS_EVENEMENTS"]) assert.ok(suivi.includes(mot), mot);
    assert.doesNotMatch(suivi, /GTM-PGBZT75T|dataLayer/);
    // Les variables des traceurs ne sont citées que pour être retirées de Vercel.
    const lignes = suivi.split("\n").filter((l) => /NEXT_PUBLIC_(GTM_ID|GA_ID|META_PIXEL_ID|CLARITY_ID)/.test(l));
    assert.equal(lignes.length, 1);
    assert.match(lignes[0], /Plus lues depuis la mission 16 \(partie 6\)\*\*, à retirer de Vercel/);
  });
});

/**
 * Site 3.0, lot F7 — le JavaScript chargé au démarrage. Un composant client n'entre dans le JavaScript d'une page que
 * par les imports STATIQUES de ses modules serveur : ces tests suivent ces imports (un `import()` dynamique n'en est
 * pas un, c'est le chargement à la demande) et verrouillent ce que le lot a retiré.
 */
const EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];
function resoudreImport(depuis: string, specificateur: string): string | null {
  let base: string;
  if (specificateur.startsWith("@/")) base = `src/${specificateur.slice(2)}`;
  else if (specificateur.startsWith(".")) base = path.posix.normalize(path.posix.join(path.posix.dirname(depuis), specificateur));
  else return null;
  for (const e of EXTENSIONS) {
    const f = base + e;
    if (/\.(ts|tsx)$/.test(f) && existsSync(path.join(RACINE, f)) && statSync(path.join(RACINE, f)).isFile()) return f;
  }
  return null;
}
/** Les modules atteints par imports statiques (hors `import type`, hors `import()`), le départ compris. */
function grapheStatique(depart: string): Set<string> {
  const vus = new Set<string>([depart]);
  const file = [depart];
  while (file.length > 0) {
    const f = file.pop()!;
    const source = lire(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const m of source.matchAll(/(?:^|\n)\s*(import|export)\s+(?!type\b)([^"';]*?)\s*(?:from\s+)?["']([^"']+)["']/g)) {
      const clause = m[2].trim();
      if (/^\{\s*(?:type\s+\w+\s*,?\s*)+\}$/.test(clause)) continue;
      const cible = resoudreImport(f, m[3]);
      if (cible && !vus.has(cible)) {
        vus.add(cible);
        file.push(cible);
      }
    }
  }
  return vus;
}
const clientsDe = (depart: string) => [...grapheStatique(depart)].filter((f) => estClient(lire(f))).sort();

describe("lot F7 : le JavaScript du démarrage", () => {
  test("le suivi des imports voit ce qu'il doit voir (contrôle)", () => {
    const g = grapheStatique("src/components/ambiances/CarteAmbiance.tsx");
    assert.ok(g.has("src/components/simulation/AvantApres.tsx"), "la carte rend le curseur");
    assert.ok(g.has("src/components/ambiances/cas.ts"));
    assert.ok(!grapheStatique("src/components/accueil/FormulaireRappel.tsx").has("src/components/accueil/FeuilleRappel.tsx"), "un import() n'est pas suivi");
    assert.ok(clientsDe("src/app/simulateur/page.tsx").includes("src/app/simulateur/_components/Simulateur.tsx"));
  });

  test("le gabarit et `metadonneesPage` n'emportent plus le curseur : seuls le menu, le suivi des pages et les liens partent sur toutes les pages", () => {
    // Avant F7 : layout → lib/partage → inspirations/_components/ordre → CarteAmbiance → AvantApres (avec le plein écran,
    // le calque des matières, le client de la génération et le manifeste des images) : 14 Ko compressés sur chaque page.
    assert.deepEqual(clientsDe("src/app/layout.tsx"), [
      "src/components/HorsEspaceClient.tsx",
      "src/components/HorsSimulateur.tsx",
      "src/components/MenuMobile.tsx",
      "src/components/PrechargementDiffere.tsx",
      "src/components/ScrollToTop.tsx",
      "src/components/SuiviParcours.tsx",
      "src/components/simulation/Feuille.tsx",
    ]);
    for (const f of ["src/lib/metadonnees.ts", "src/lib/partage.ts", "src/components/ambiances/cas.ts", "src/app/inspirations/_components/ordre.ts", "src/app/pro/vue.ts", "src/app/realisations/paires.ts", "src/app/blog/[slug]/illustration.ts"]) {
      assert.deepEqual(clientsDe(f), [], `${f} n'importe aucun composant client`);
      assert.ok(!grapheStatique(f).has("src/components/ambiances/CarteAmbiance.tsx"), `${f} : resoudreCas se lit dans ./cas`);
    }
    // Une page sans curseur n'a que les clients du gabarit (plus les siens).
    for (const page of ["src/app/cgv/page.tsx", "src/app/contact/page.tsx", "src/app/mentions-legales/page.tsx"]) assert.ok(!clientsDe(page).includes("src/components/simulation/AvantApres.tsx"), page);
  });

  test("le curseur avant / après : ni le manifeste des images, ni le client de la génération, ni le plein écran au démarrage", () => {
    const g = grapheStatique("src/components/simulation/AvantApres.tsx");
    for (const absent of ["src/lib/images-manifeste.ts", "src/lib/images-preparees.ts", "src/lib/simulateur/generation-client.ts", "src/lib/simulateur/reprise.ts", "src/components/simulation/PleinEcran.tsx", "src/components/simulation/ZoomImage.tsx"]) assert.ok(!g.has(absent), absent);
    const source = lire("src/components/simulation/AvantApres.tsx");
    assert.match(source, /const chargerPleinEcran = \(\) => import\("\.\/PleinEcran"\);/);
    assert.match(source, /const PleinEcran = lazy\(\(\) => chargerPleinEcran\(\)\.then\(\(m\) => \(\{ default: m\.PleinEcran \}\)\)\);/);
    assert.match(source, /onClick=\{\(\) => setPleinEcran\(true\)\} onPointerEnter=\{chargerPleinEcran\} onFocus=\{chargerPleinEcran\}/);
    assert.match(source, /\{pleinEcran \? \(\s*<Suspense fallback=\{null\}>\s*<PleinEcran ouvert onFermer=\{\(\) => setPleinEcran\(false\)\}/);
    // Les adresses du CRM et les constantes du <picture> vivent dans des modules sans import.
    for (const f of ["src/lib/sources-image.ts", "src/lib/simulateur/adresses-crm.ts"]) assert.doesNotMatch(lire(f), /^import /m, f);
    assert.match(lire("src/lib/images-preparees.ts"), /export \{ LARGEUR_MAX_TELEPHONE, MEDIA_ECRAN_LARGE, MEDIA_TELEPHONE, plafonnerSrcset \} from "\.\/sources-image";/);
    assert.match(lire("src/lib/simulateur/generation-client.ts"), /export \{ baseCrm, urlEchantillon, urlVignette \} from "\.\/adresses-crm";/);
  });

  test("« Être rappelé » : au démarrage, le bouton seul ; la feuille, le formulaire et le captcha au premier geste", () => {
    const g = grapheStatique("src/components/accueil/FormulaireRappel.tsx");
    for (const absent of ["src/components/accueil/FeuilleRappel.tsx", "src/components/Turnstile.tsx", "src/components/simulation/Feuille.tsx", "src/components/CaseConsentement.tsx", "src/app/simulateur/_components/Formulaires.tsx"]) assert.ok(!g.has(absent), absent);
    const bouton = lire("src/components/accueil/FormulaireRappel.tsx");
    assert.match(bouton, /const chargerFeuille = \(\) => import\("\.\/FeuilleRappel"\);/);
    assert.match(bouton, /onClick=\{ouvrir\} onPointerEnter=\{chargerFeuille\} onFocus=\{chargerFeuille\} onTouchStart=\{chargerFeuille\}/);
    assert.match(bouton, /\{demandee \? \(\s*<Suspense fallback=\{null\}>\s*<FeuilleRappel depuis=\{depuis\} ouverte=\{ouverte\}/);
    // Les pages qui l'emploient ne chargent plus le captcha au démarrage.
    for (const page of ["src/app/page.tsx", "src/app/prestations/[slug]/page.tsx", "src/app/comment-ca-marche/page.tsx"]) assert.ok(!clientsDe(page).includes("src/components/Turnstile.tsx"), page);
  });

  test("`next/link` n'est importé que par LienSite, sans préchargement automatique ; un seul composant précharge, au geste puis après le chargement", async () => {
    assert.deepEqual(SOURCES.filter((f) => /from "next\/link"/.test(lire(f))), ["src/components/LienSite.tsx"]);
    const lienSite = lire("src/components/LienSite.tsx");
    assert.ok(!estClient(lienSite), "une fonction autour de next/link : aucun composant de plus à hydrater");
    assert.match(lienSite, /<Link \{\.\.\.props\} prefetch=\{false\} \{\.\.\.\(prefetch === false \? \{ \[SANS_PRECHARGEMENT\]: "" \} : \{\}\)\} \/>/);
    // Le rendu d'un lien ne change pas (l'attribut n'apparaît que sur un prefetch={false} écrit dans le code).
    const LienSite = (await import("@/components/LienSite")).default;
    const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
    const rendre = (props: Record<string, unknown>) => renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: { back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, prefetch() {} } as never }, createElement(LienSite, props as never, "Simuler")));
    assert.equal(rendre({ href: "/simulateur", className: "x" }), '<a class="x" href="/simulateur">Simuler</a>');
    assert.equal(rendre({ href: "/matieres/couleur/NF13", prefetch: false }), '<a data-sans-prechargement="" href="/matieres/couleur/NF13">Simuler</a>');
    // Le composant est posé une fois par le gabarit.
    assert.match(lire("src/app/layout.tsx"), /<main id="main-content">\{children\}<\/main>\s*\{\/\*[^*]*\*\/\}\s*<PrechargementDiffere \/>/);
    const composant = lire("src/components/PrechargementDiffere.tsx");
    assert.match(composant, /useEffect\(\(\) => attendreLeMoment\(window, document, \(\) => setLibre\(true\)\), \[\]\);/);
    assert.match(composant, /for \(const t of \["pointerover", "touchstart", "focusin"\]\) document\.addEventListener\(t, surIntention, \{ passive: true \}\);/);
    assert.match(composant, /new IntersectionObserver\([\s\S]*\{ rootMargin: MARGE_VISIBLE \}/);
    assert.match(composant, /router\.prefetch\(adresse\);/);
  });

  test("ce qui se précharge : les pages du site seulement, une fois chacune", () => {
    const ici = { origin: "https://coverswap.fr", pathname: "/prestations/cuisine", search: "" };
    assert.equal(adressePrechargeable({ href: "/simulateur?projet=cuisine&depuis=prestation-cuisine" }, ici), "/simulateur?projet=cuisine&depuis=prestation-cuisine");
    assert.equal(adressePrechargeable({ href: "https://coverswap.fr/realisations#cuisine" }, ici), "/realisations");
    assert.equal(adressePrechargeable({ href: "../matieres" }, ici), "/matieres");
    for (const lien of [{ href: null }, { href: "#questions" }, { href: "/prestations/cuisine" }, { href: "https://wa.me/33600000000" }, { href: "tel:+33600000000" }, { href: "mailto:a@b.fr" }, { href: "/api/contact" }, { href: "/llms.txt" }, { href: "/images/og/a.jpg" }, { href: "/pro", cible: "_blank" }, { href: "/pro", telechargement: true }, { href: "/matieres/couleur/NF13", sansPrechargement: true }]) {
      assert.equal(adressePrechargeable(lien, ici), null, JSON.stringify(lien));
    }
    assert.equal(adressePrechargeable({ href: "/pro", cible: "_self" }, ici), "/pro");
  });

  test("le moment : rien avant `load` + 3 s, sauf un geste ; une seule fois ; tout se défait", () => {
    assert.equal(APRES_CHARGEMENT_MS, 3000);
    assert.deepEqual([...GESTES], ["pointerdown", "keydown", "touchstart", "wheel", "scroll"]);
    const fabriquer = () => {
      const ecouteurs: Record<string, (() => void)[]> = {};
      const minuteries: { f: () => void; ms: number; annulee: boolean }[] = [];
      const fenetre = {
        addEventListener: (t: string, f: () => void) => void (ecouteurs[t] ??= []).push(f),
        removeEventListener: (t: string, f: () => void) => void (ecouteurs[t] = (ecouteurs[t] ?? []).filter((x) => x !== f)),
        setTimeout: (f: () => void, ms: number) => minuteries.push({ f, ms, annulee: false }) - 1,
        clearTimeout: (id: never) => void (minuteries[id as unknown as number] && (minuteries[id as unknown as number].annulee = true)),
      };
      return { ecouteurs, minuteries, fenetre };
    };
    // Par le temps : load, puis 3 s.
    const a = fabriquer();
    let pretA = 0;
    attendreLeMoment(a.fenetre, { readyState: "loading" }, () => pretA++);
    assert.deepEqual(Object.keys(a.ecouteurs).sort(), ["keydown", "load", "pointerdown", "scroll", "touchstart", "wheel"]);
    assert.equal(a.minuteries.length, 0, "rien avant load");
    for (const f of a.ecouteurs.load) f();
    assert.deepEqual(a.minuteries.map((m) => m.ms), [3000]);
    assert.equal(pretA, 0);
    a.minuteries[0].f();
    assert.equal(pretA, 1);
    for (const g of GESTES) assert.equal(a.ecouteurs[g].length, 0, `${g} retiré`);
    // Par un geste, avant la fin des 3 s : une seule fois, la minuterie annulée.
    const b = fabriquer();
    let pretB = 0;
    attendreLeMoment(b.fenetre, { readyState: "complete" }, () => pretB++);
    assert.deepEqual(b.minuteries.map((m) => m.ms), [3000], "page déjà chargée : 3 s tout de suite");
    b.ecouteurs.scroll[0]();
    assert.equal(pretB, 1);
    assert.equal(b.minuteries[0].annulee, true);
    b.minuteries[0].f();
    assert.equal(pretB, 1, "une seule fois");
    // Défait avant tout : plus rien ne part.
    const c = fabriquer();
    let pretC = 0;
    const defaire = attendreLeMoment(c.fenetre, { readyState: "loading" }, () => pretC++);
    defaire();
    assert.equal((c.ecouteurs.load ?? []).length, 0);
    for (const g of GESTES) assert.equal(c.ecouteurs[g].length, 0);
    assert.equal(pretC, 0);
  });

  test("l'icône de l'onglet en 64 px (≈ 2 Ko au lieu de 12) ; le logo entier reste l'icône de l'écran d'accueil", async () => {
    const gabarit = lire("src/app/layout.tsx");
    assert.match(gabarit, /icons: \{\s*icon: \{ url: "\/icone-64\.png", type: "image\/png", sizes: "64x64" \},\s*apple: "\/logo\.png",\s*\}/);
    const icone = path.join(RACINE, "public/icone-64.png");
    const meta = await sharp(icone).metadata();
    assert.deepEqual([meta.width, meta.height, meta.format], [64, 64, "png"]);
    assert.ok(statSync(icone).size <= 4096, `${statSync(icone).size} octets`);
    assert.match(lire("scripts/generate-assets.mjs"), /resize\(64, 64\)[^\n]*icone-64\.png/);
  });

  test("le simulateur au démarrage : l'écran Pièce sans le manifeste ni les ambiances ; attente, résultat et feuille chargés à part", () => {
    const g = grapheStatique("src/app/simulateur/_components/Simulateur.tsx");
    for (const absent of ["src/lib/images-manifeste.ts", "src/data/ambiances.ts", "src/data/ambiances-serie-2.ts", "src/app/simulateur/_components/EcranGeneration.tsx", "src/app/simulateur/_components/EcranResultat.tsx", "src/app/simulateur/_components/DemandeApresRendu.tsx", "src/components/simulation/FeuilleCatalogue.tsx", "src/components/simulation/Photo.tsx"]) assert.ok(!g.has(absent), absent);
    for (const present of ["src/app/simulateur/_components/EcranPiece.tsx", "src/app/simulateur/_components/EcranPhoto.tsx", "src/app/simulateur/_components/EcranMatieres.tsx", "src/app/simulateur/_components/ecrans-differes.ts"]) assert.ok(g.has(present), present);
    // L'espace client rend les mêmes cartes : sans le manifeste non plus.
    assert.ok(!grapheStatique("src/components/espace/CreationEcrans.tsx").has("src/lib/images-manifeste.ts"));
  });

  test("l'italique en graisse 400 seulement : le nom du cartel est en font-normal", () => {
    assert.match(lire("src/components/revue/Cartel.tsx"), /className=\{`block font-display-italique text-\[19px\] leading-tight font-normal italic \$\{v\.nom\}`\}/);
  });
});
