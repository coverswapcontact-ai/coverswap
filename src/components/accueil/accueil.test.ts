import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import revetements from "@/data/revetements.json";
import { FAQ_GENERALE, FAQ_SIMULATEUR, QUESTIONS_ACCUEIL } from "@/data/faq";
import { ORDRE_AVIS, blocAvis, formaterNote, lienHttps } from "@/lib/avis-google";
import { resolveSource } from "@/lib/crm";
import { lignePrixDuree, versEtudeReelle } from "@/lib/etude-de-cas";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import type { ManifesteImages } from "@/lib/images-preparees";
import { avecDepuis, lienSimuler } from "@/lib/liens-simulateur";
import { ficheDe } from "@/lib/fiches-matieres";
import { MATIERES_VEDETTES, lienMatiere, matiereCartel, matieresVedettes, referenceDeLAdresse } from "@/lib/matieres-vedettes";
import { DELAI_REPONSE, DUREE_POSE, DUREE_POSE_TEXTE, FOURCHETTES, GARANTIE_ANS, NB_REFERENCES, PRIX_PLAGE, euros, fourchette } from "@/lib/offre";
import { LARGEURS_PHOTO_CRM, sourcesPhotoCrm, type Publication } from "@/lib/publications";
import { lireDepuis } from "@/lib/simulateur/entonnoir";
import { lireComposition, lireRefDemandee } from "@/lib/simulateur/matiere-demandee";
import { ZONES_REPLI } from "@/lib/simulateur/zones";
import type { TarifsSite } from "@/lib/tarifs-site";
import { MESSAGE_WHATSAPP_DEVIS, lienWhatsApp } from "@/lib/whatsapp";
import { ContenuPrix, REPLI_PAR_PIECE, prixAffiche, tarifDeLaFamille } from "@/components/BlocPrix";
import { classesBouton } from "@/components/simulation/Bouton";
import { ContenuAvisPrix, LIGNE_GARANTIE, LIGNE_ZONE } from "./AvisPrix";
import { BoutonWhatsApp } from "./BoutonWhatsApp";
import { CommentOnTravaille, ETAPES_TRAVAIL, GARANTIES, PHRASE_COVERING } from "./CommentOnTravaille";
import { CUISINES_ACCUEIL, CuisinesCommeLaVotre, cuisinesAccueil } from "./CuisinesCommeLaVotre";
import { DernierAppel } from "./DernierAppel";
import { ALT_AVANT_OUVERTURE, ALT_OUVERTURE, IMAGE_OUVERTURE, LEGENDE_OUVERTURE, choisirOuverture, imageObjetOuverture, partageOuverture } from "./etudes";
import { FORMULAIRE_RAPPEL, FormulaireRappel } from "./FormulaireRappel";
import { LARGEUR_OUVERTURE, Ouverture } from "./Ouverture";
import { PICTOS_ACCUEIL, ParOuCommencer } from "./ParOuCommencer";
import { Presentoir } from "./Presentoir";
import { ProAccueil } from "./ProAccueil";
import { QuestionsAccueil } from "./QuestionsAccueil";
import { AMBIANCES_ACCUEIL, RealisationsAccueil, realisationsAccueil } from "./RealisationsAccueil";
import { ANCRES_ACCUEIL, BANDES_ACCUEIL, CIBLES_BOUTON_COLLE, DESCRIPTION_META_ACCUEIL, LIGNE_ACCUEIL, TITRE_ACCUEIL, TITRE_META_ACCUEIL, lienSimulerAccueil, sectionsAccueil, type DepuisAccueil } from "./sections";

/**
 * L'accueil du site 3.0 (lot B6 ; énoncé, § C.1), réécrit section par section avec les intentions de la mission 16 :
 * l'ordre exact des sections et rien d'autre, une seule action principale par écran (les boutons comptés par leurs
 * classes, quelle que soit la balise), les règles d'honnêteté codées (réalisation publiée d'abord, sinon « Ambiance » ;
 * « Simulation » pour les rendus du moteur seulement ; avis Google seulement avec une note ET un nombre ; prix lus au
 * CRM, jamais écrits), le LCP de l'ouverture, et chaque lien vers le simulateur qui dit d'où il vient.
 */

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(path.join(RACINE, f), "utf8");
const rendre = (element: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(element);
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;
/** Les éléments (lien ou bouton) qui portent les classes exactes d'une variante de bouton. */
const boutons = (html: string, variante: "principal" | "secondaire" | "sur-encre") => compter(html, `class="${classesBouton(variante)}`);
/** Les sources de l'accueil : ses composants, la page, le bloc des prix. */
const SOURCES_ACCUEIL = [...readdirSync(path.join(RACINE, "src/components/accueil")).filter((f) => f.endsWith(".tsx") || (f.endsWith(".ts") && !f.endsWith(".test.ts"))).map((f) => `src/components/accueil/${f}`), "src/app/page.tsx", "src/components/BlocPrix.tsx"];
const CATALOGUE = revetements as { id: string; nom: string; famille: string }[];

function publication(p: Partial<Publication> & { id: string }): Publication {
  return { type: "REALISATION", titre: `Chantier ${p.id}`, texte: null, ville: null, typeProjet: "CUISINE", note: null, auteur: null, photoAvant: null, photoApres: null, publieLe: "2026-09-01T00:00:00.000Z", ...p };
}

describe("les neuf sections, dans l'ordre de l'énoncé (§ C.1)", () => {
  test("sectionsAccueil() rend 9 entrées dans l'ordre du tunnel", () => {
    assert.deepEqual(
      sectionsAccueil().map((s) => s.id),
      ["ouverture", "par-ou-commencer", "cuisines", "comment", "presentoir", "realisations", "pro", "avis-prix", "questions"]
    );
  });

  test("la page rend cette liste et rien d'autre, avec les bandes de matière entre les sections", () => {
    const page = lire("src/app/page.tsx");
    assert.match(page, /sectionsAccueil\(\)\.map/);
    assert.match(page, /const sections: Record<IdSectionAccueil, ReactNode>/);
    assert.match(page, /\{sections\[s\.id\]\}\s+\{bandeApres\(s\.id\)\}/);
    for (const retire of ["QuestionsFrequentes", "CommentCaSePasse", "PRESTATIONS", "ZONES", "TEMOINS", "<table", "/devis", "SimulationSection", "HomeClient", "TroisFaits", "MatieresAccueil", "InspirationsAccueil"]) assert.ok(!page.includes(retire), retire);
    for (const parti of ["src/components/HomeClient.tsx", "src/components/accueil/TroisFaits.tsx", "src/components/accueil/MatieresAccueil.tsx", "src/components/accueil/InspirationsAccueil.tsx"]) assert.ok(!existsSync(path.join(RACINE, parti)), parti);
    assert.match(page, /revalidate = 300/);
    // Le Service de l'accueil pointe vers le simulateur.
    assert.match(page, /urlOffre=\{`\$\{ENTREPRISE\.site\}\/simulateur`\}/);
  });

  test("cinq bandes de matière : chêne, marbre, vert profond (dans le présentoir), terracotta, bleu nuit — de vraies références", () => {
    assert.deepEqual(
      BANDES_ACCUEIL.map((b) => [b.ref, b.apres]),
      [
        ["AG13", "par-ou-commencer"],
        ["NE31", "comment"],
        ["NF13", "dans-presentoir"],
        ["NH12", "realisations"],
        ["M9", "avis-prix"],
      ]
    );
    const ordre = sectionsAccueil().map((s) => s.id);
    const rangs = BANDES_ACCUEIL.map((b) => (b.apres === "dans-presentoir" ? ordre.indexOf("presentoir") - 0.5 : ordre.indexOf(b.apres)));
    assert.deepEqual([...rangs].sort((a, b) => a - b), rangs, "dans l'ordre de la page");
    assert.ok(rangs.every((r) => r >= 0));
    for (const b of BANDES_ACCUEIL) assert.ok(matiereCartel(b.ref), `${b.ref} absente du catalogue`);
    assert.deepEqual(BANDES_ACCUEIL.map((b) => CATALOGUE.find((r) => r.id === b.ref)?.nom), ["Pale Oak", "Statuary White", "Deep Green", "Terracotta Stucco", "Midnight Blue"]);
    // Le vert profond ferme le présentoir.
    assert.match(rendre(createElement(Presentoir)), /<div role="img" aria-label="Matière Deep Green · NF13[^"]*"[^>]*>.*<\/div><\/section>$/);
  });

  test("métadonnées : titre ≤ 60, description ≤ 155 caractères avec le prix et Montpellier ; l'image de partage suit l'ouverture", () => {
    // Site 3.0 (lot F2) : le titre vise « rénover sa cuisine sans travaux » (docs/SEO.md), 60 caractères au plus.
    assert.equal(TITRE_META_ACCUEIL, "Rénover sa cuisine sans travaux, en une journée | CoverSwap");
    assert.ok(TITRE_META_ACCUEIL.length <= 60, `${TITRE_META_ACCUEIL.length} caractères`);
    assert.ok(DESCRIPTION_META_ACCUEIL.length <= 155, `${DESCRIPTION_META_ACCUEIL.length} caractères`);
    assert.ok(DESCRIPTION_META_ACCUEIL.includes(PRIX_PLAGE));
    assert.ok(DESCRIPTION_META_ACCUEIL.includes("Montpellier"));
    const page = lire("src/app/page.tsx");
    assert.match(page, /metadonneesPage\(\{ titre: TITRE_META_ACCUEIL, description: DESCRIPTION_META_ACCUEIL, chemin: "\/", image \}\)/);
    assert.match(page, /const image = partageOuverture\(choisirOuverture\(realisations\)\);/);
  });

  test("le titre : 7 mots au plus, la durée d'offre.ts", () => {
    assert.equal(TITRE_ACCUEIL, "Votre cuisine, transformée en une journée.");
    assert.ok(TITRE_ACCUEIL.split(/\s+/).length <= 7);
    assert.equal(DUREE_POSE, "1 journée");
    assert.equal(DUREE_POSE_TEXTE, "une journée", "même durée que DUREE_POSE, en lettres");
  });

  test("chaque lien vers le simulateur dit d'où il vient, et le simulateur sait le lire", () => {
    const depuis: DepuisAccueil[] = ["accueil-ouverture", "accueil-colle", "accueil-etapes", "accueil-final", "accueil", "accueil-cuisines"];
    for (const d of depuis) {
      assert.equal(lienSimulerAccueil(d), `/simulateur?depuis=${d}`);
      assert.equal(lireDepuis(new URLSearchParams(lienSimulerAccueil(d).split("?")[1]).get("depuis")), d);
    }
    // Site 3.0, lot C3 : /comment-ca-marche ne garde plus « Simuler ma cuisine » (`lienSimulerCuisine` retiré) ; ses
    // boutons disent d'où ils viennent, comme ceux de l'accueil.
    assert.equal(lienSimuler({ depuis: "comment-ca-marche" }), "/simulateur?depuis=comment-ca-marche");
    assert.equal(lireDepuis("comment-ca-marche"), "comment-ca-marche");
    assert.equal(lienSimuler(), "/simulateur");
    assert.equal(lienSimuler({ projet: "cuisine", element: "plan-de-travail", choix: true, depuis: "accueil" }), "/simulateur?projet=cuisine&element=plan-de-travail&choix=1&depuis=accueil");
    assert.equal(lienSimuler({ choix: true }), "/simulateur", "pas de choix sans pièce");
    assert.equal(avecDepuis("/simulateur?projet=cuisine&ref=facades-cuisine:NF13", "accueil-cuisines"), "/simulateur?projet=cuisine&ref=facades-cuisine:NF13&depuis=accueil-cuisines");
    assert.equal(avecDepuis("/simulateur", "x"), "/simulateur?depuis=x");
    // Les nouvelles valeurs et le paramètre `choix` sont documentés au suivi (aucun type d'événement nouveau).
    const suivi = lire("docs/SUIVI.md");
    for (const texte of ["`accueil-cuisines`", "`accueil`", "choix=1", "coverswap.fr/rappel", "## 8. L'accueil (site 3.0, lot B6"]) assert.ok(suivi.includes(texte), texte);
  });

  test("le bouton collé du téléphone : « Simuler ma pièce », masqué pendant une saisie, et ses cibles existent toutes", () => {
    const page = lire("src/app/page.tsx");
    assert.match(page, /<BoutonColle mobileSeulement masquerSurSaisie cibles=\{CIBLES_BOUTON_COLLE\}>\s+<Lien href=\{lienSimulerAccueil\("accueil-colle"\)\} plein>\s+Simuler ma pièce/);
    assert.deepEqual(CIBLES_BOUTON_COLLE, ["ouverture-simuler", "par-ou-commencer", "etapes-simuler", "dernier-appel", "pied-de-page"]);
    assert.match(rendre(createElement(Ouverture, { choix: choisirOuverture([]) })), /id="ouverture-simuler"/);
    assert.match(rendre(createElement(ParOuCommencer)), /^<section id="par-ou-commencer"/);
    assert.match(rendre(createElement(CommentOnTravaille, { idBouton: ANCRES_ACCUEIL.boutonEtapes, preuve: true })), /id="etapes-simuler"/);
    assert.match(rendre(createElement(DernierAppel)), /id="dernier-appel"/);
    assert.match(lire("src/components/PiedDePage.tsx"), /<footer id="pied-de-page"/);
  });
});

describe("1. Ouverture", () => {
  test("sans réalisation publiée : la cuisine bordeaux → Deep Green NF13, « Ambiance · avant / après », la légende exacte", () => {
    const choix = choisirOuverture([]);
    assert.ok(choix && choix.type === "ambiance");
    assert.deepEqual(IMAGE_OUVERTURE, { avant: "cuisine-bordeaux-brillante-avant", apres: "cuisine-bordeaux-brillante-apres-couleur" });
    assert.equal(choix.etiquette, "Ambiance · avant / après", "« Simulation » est réservé aux rendus du moteur");
    assert.equal(choix.legende, "Cuisine des années 2000, façades bordeaux brillantes → Deep Green NF13, plan Pale Oak AG13. Posé en une journée.");
    assert.equal(LEGENDE_OUVERTURE, choix.legende);
    assert.deepEqual(choix.matieres?.map((m) => m.ref), ["NF13", "AG13"]);
    assert.equal(choix.ratio, "1536 / 1024");
    const html = rendre(createElement(Ouverture, { choix }));
    assert.match(html, /<h1 id="titre-accueil" class="titre-0[^"]*">Votre cuisine, transformée en une journée\.<\/h1>/);
    assert.ok(html.includes(LIGNE_ACCUEIL));
    assert.match(html, new RegExp(`<figcaption class="[^"]*">${LEGENDE_OUVERTURE}</figcaption>`));
    assert.match(html, />Ambiance · avant \/ après<\/span>/);
    assert.ok(!html.includes(">Simulation<") && !html.includes(">Réalisation"));
    // L'adresse porte l'empreinte de l'original (`?v=`, cache immuable d'un an).
    const v = MANIFESTE_IMAGES[IMAGE_OUVERTURE.avant].empreinte;
    assert.ok(v && /^[0-9a-f]{12}$/.test(v));
    assert.ok(html.includes(`<source type="image/avif" srcSet="/images/prep/${IMAGE_OUVERTURE.avant}-480.avif?v=${v} 480w`));
    // Un seul couple en priorité haute (l'« après », qui recouvre l'« avant », est le LCP), rien de différé.
    assert.equal(compter(html, 'fetchPriority="high"'), 2, "les deux images de l'ouverture, et elles seules");
    assert.ok(!/loading="lazy"/.test(html), "rien de différé au premier écran");
    // Une action principale, une secondaire (« Être rappelé », un <button>), comptées par leurs classes.
    assert.equal(boutons(html, "principal"), 1);
    assert.equal(boutons(html, "secondaire"), 1);
    assert.match(html, new RegExp(`id="${ANCRES_ACCUEIL.boutonOuverture}"[^>]*><a [^>]*href="/simulateur\\?depuis=accueil-ouverture"[^>]*>Voir ma pièce transformée</a><button type="button" class="`));
    assert.ok(html.includes(`<button type="button" class="${classesBouton("secondaire")} w-full sm:w-auto">Être rappelé</button>`));
    // Dans le document : le titre et le bouton d'abord (clavier, lecteur d'écran) ; sur téléphone, la photo en haut.
    assert.ok(html.indexOf("<h1") < html.indexOf("<picture>") && html.indexOf("Voir ma pièce transformée") < html.indexOf('role="slider"'));
    assert.match(html, /<figure class="[^"]*max-md:order-first/);
    // Sur téléphone, plus d'outils sous l'image (la poignée suffit).
    assert.match(html, /mt-2 flex flex-wrap items-center gap-2 max-md:hidden/);
    // La photo ne dépasse jamais l'écran utile : 100svh, jamais 100vh.
    assert.ok(!html.includes("100vh"));
    assert.ok(LARGEUR_OUVERTURE.includes("100svh") && html.includes("100svh"));
    // L'« après » vient d'abord dans le document (et seul en plein écran) : son texte se lit seul.
    const altApres = `alt="${ALT_OUVERTURE.replace(/'/g, "&#x27;")}"`;
    assert.ok(html.indexOf(altApres) > 0 && html.indexOf(altApres) < html.indexOf(`alt="${ALT_AVANT_OUVERTURE.replace(/'/g, "&#x27;")}"`));
    assert.ok(/^Cuisine en L d'appartement/.test(ALT_OUVERTURE) && ALT_OUVERTURE.includes("Deep Green NF13") && ALT_OUVERTURE.endsWith("Image d'ambiance aux teintes du catalogue."), ALT_OUVERTURE);
    assert.ok(ALT_AVANT_OUVERTURE.includes("bordeaux brillantes") && ALT_AVANT_OUVERTURE.endsWith("Image d'ambiance."), ALT_AVANT_OUVERTURE);
  });

  test("l'image « avant » pèse 80 Ko au plus en AVIF (le LCP)", () => {
    for (const l of MANIFESTE_IMAGES[IMAGE_OUVERTURE.avant].largeurs) {
      const octets = readFileSync(path.join(RACINE, "public", "images", "prep", `${IMAGE_OUVERTURE.avant}-${l}.avif`)).length;
      assert.ok(octets <= 80 * 1024, `${l} : ${octets} octets`);
    }
  });

  test("la première réalisation publiée avec avant ET après passe d'abord : « Réalisation, <ville> », sa légende, son image de partage", () => {
    const sansAvant = publication({ id: "a", photoApres: "https://crm.example.test/api/site/photos/a/apres", ville: "Sète" });
    const complete = publication({ id: "b", titre: "Cuisine en chêne", photoAvant: "https://crm.example.test/api/site/photos/b/avant", photoApres: "https://crm.example.test/api/site/photos/b/apres", ville: "Lattes" });
    const choix = choisirOuverture([sansAvant, complete, publication({ id: "c", photoAvant: "x", photoApres: "y" })]);
    assert.ok(choix && choix.type === "realisation");
    assert.equal(choix.etiquette, "Réalisation, Lattes");
    assert.equal(choix.legende, "Cuisine en chêne, Lattes.");
    assert.equal(choix.apres, complete.photoApres);
    assert.deepEqual(choix.preparees, { avant: sourcesPhotoCrm(complete.photoAvant!), apres: sourcesPhotoCrm(complete.photoApres!) });
    assert.equal(choisirOuverture([{ ...complete, ville: null }])?.etiquette, "Réalisation");
    assert.equal(choisirOuverture([{ ...complete, type: "AVIS" }])?.type, "ambiance", "un avis n'est pas une réalisation");
    const html = rendre(createElement(Ouverture, { choix }));
    assert.match(html, />Réalisation, Lattes<\/span>/);
    assert.ok(!html.includes(">Simulation<") && !html.includes("Ambiance"));
    // Le LCP n'est pas la photo entière du CRM : WebP réduits en srcset, sizes, un seul couple prioritaire.
    assert.match(html, /<source type="image\/webp" srcSet="https:\/\/crm\.example\.test\/api\/site\/photos\/b\/avant\?l=480 480w, [^"]*\?l=960 960w, [^"]*\?l=1600 1600w" sizes="\(min-width: 1200px\) 1152px/);
    assert.match(html, /<img src="https:\/\/crm\.example\.test\/api\/site\/photos\/b\/avant"[^>]*fetchPriority="high"/);
    assert.equal(compter(html, 'fetchPriority="high"'), 2);
    assert.ok(!/loading="lazy"/.test(html));
    // L'image de partage et l'ImageObject suivent l'image retenue.
    assert.deepEqual(partageOuverture(choix), { url: "https://crm.example.test/api/site/photos/b/apres?l=1600", largeur: 1600, hauteur: 1067, alt: "Cuisine en chêne, Lattes." });
    // Site 3.0 (lot F4) : `@id` (le Service y renvoie) ; une vraie photo de chantier ne porte pas le creditText d'ambiance.
    assert.deepEqual(imageObjetOuverture(choix), { "@context": "https://schema.org", "@type": "ImageObject", "@id": `${complete.photoApres}#image`, contentUrl: complete.photoApres, caption: "Cuisine en chêne, Lattes.", description: `Réalisation, Lattes. ${choix.alt}` });
  });

  test("une image d'ambiance n'est jamais partagée sans son étiquette ; son ImageObject dit « Ambiance · avant / après »", () => {
    const choix = choisirOuverture([]);
    // Site 3.0 (lot F2) : l'avant / après composé avec son bandeau « Ambiance · avant / après » (scripts/og.mjs), jamais l'après seul.
    assert.deepEqual(partageOuverture(choix), {
      url: "https://coverswap.fr/images/og/cuisine-bordeaux-brillante-apres-couleur.jpg",
      largeur: 1200,
      hauteur: 630,
      alt: "Ambiance · avant / après, image d'ambiance : Cuisine en L d'appartement des années 2000, façades bordeaux brillantes, plan de travail gris moucheté",
    });
    assert.ok(!partageOuverture(choix).url.includes("/images/prep/"), "jamais une image de la bibliothèque sans son étiquette");
    const objet = imageObjetOuverture(choix);
    assert.equal(objet?.["@type"], "ImageObject");
    assert.equal(objet?.caption, LEGENDE_OUVERTURE);
    // Site 3.0 (lot F4) : l'image la plus grande préparée, et le creditText honnête d'une image d'ambiance.
    assert.match(String(objet?.contentUrl), /^https:\/\/coverswap\.fr\/images\/prep\/cuisine-bordeaux-brillante-apres-couleur-1536\.jpg\?v=/);
    assert.equal(objet?.creditText, "Image d'ambiance générée aux teintes du catalogue");
    assert.ok(String(objet?.description).startsWith("Ambiance · avant / après. "));
    assert.equal(imageObjetOuverture(null), null);
    assert.match(lire("src/app/page.tsx"), /const imageOuverture = imageObjetOuverture\(ouverture\);/);
    assert.match(lire("src/app/page.tsx"), /<DonneesStructurees data=\{imageOuverture\} \/>/);
    assert.match(lire("src/app/page.tsx"), /image=\{refImage\(imageOuverture\)\}/, "le Service de l'accueil renvoie à l'image de l'ouverture");
  });

  test("sourcesPhotoCrm : les largeurs demandées au CRM (?l=), la photo entière en repli", () => {
    assert.deepEqual(LARGEURS_PHOTO_CRM, [480, 960, 1600]);
    assert.deepEqual(sourcesPhotoCrm("https://crm.example.test/api/site/photos/b/apres"), {
      webp: "https://crm.example.test/api/site/photos/b/apres?l=480 480w, https://crm.example.test/api/site/photos/b/apres?l=960 960w, https://crm.example.test/api/site/photos/b/apres?l=1600 1600w",
      src: "https://crm.example.test/api/site/photos/b/apres",
    });
  });

  test("ni réalisation ni image préparée : pas d'image (jamais une photo au hasard), l'action reste", () => {
    assert.equal(choisirOuverture([], {} as ManifesteImages), null);
    const html = rendre(createElement(Ouverture, { choix: null }));
    assert.ok(!html.includes("<img"));
    assert.equal(boutons(html, "principal"), 1);
  });
});

describe("2. Par où commencer ?", () => {
  test("douze pictos dans l'ordre de l'énoncé : les cinq pièces, puis sept éléments", () => {
    assert.deepEqual(
      PICTOS_ACCUEIL.map((p) => p.libelle),
      ["Cuisine", "Salle de bain", "Meubles", "Murs", "Pro", "Portes", "Placards", "Plan de travail", "Meuble vasque", "Commode", "Porte d'entrée", "Réfrigérateur"]
    );
  });

  test("chacun ouvre le simulateur avec la pièce choisie (choix=1, depuis=accueil) ; un élément mène à une zone de sa pièce", () => {
    const html = rendre(createElement(ParOuCommencer));
    assert.equal(compter(html, "<a "), 12);
    assert.equal(compter(html, 'choix=1&amp;depuis=accueil"'), 12);
    for (const p of PICTOS_ACCUEIL) {
      const href = lienSimuler({ projet: p.projet, element: p.element, choix: true, depuis: "accueil" });
      assert.ok(html.includes(`href="${href.replaceAll("&", "&amp;")}"`), p.libelle);
      const parametres = new URLSearchParams(href.split("?")[1]);
      assert.equal(lireDepuis(parametres.get("depuis")), "accueil");
      const piece = ZONES_REPLI.pieces.find((x) => x.id === parametres.get("projet"));
      assert.ok(piece, `${p.libelle} : pièce inconnue`);
      if (p.element) assert.ok(piece.zones.length > 0);
    }
    // Pictos de 64 px au moins, décoratifs (alt=""), libellé visible ; aucune action principale ici.
    assert.equal(compter(html, 'class="object-contain h-16 w-16 md:h-20 md:w-20"'), 12);
    assert.equal(compter(html, 'alt=""'), 12);
    for (const p of PICTOS_ACCUEIL) assert.ok(html.includes(`>${p.libelle.replace("'", "&#x27;")}</span>`), p.libelle);
    assert.equal(boutons(html, "principal"), 0);
    // Plus de module photo de la mission 15 ni de cartes : des liens, sans JavaScript.
    assert.doesNotMatch(lire("src/components/accueil/ParOuCommencer.tsx"), /use client|CartesPieces|onClick/);
  });
});

describe("3. Des cuisines comme la vôtre", () => {
  test("relecture des lots B et C : « Hêtre des années 2000 » (le nom de l'énoncé) et sa scène disent la même décennie", () => {
    const reglages = JSON.parse(lire("scripts/bibliotheque/reglages.json")) as { images: Record<string, { scene?: string }> };
    const hetre = Object.entries(reglages.images).filter(([nom]) => nom.startsWith("cuisine-l-hetre-"));
    assert.equal(hetre.length, 3, "l'avant et ses deux après");
    for (const [nom, r] of hetre) assert.match(r.scene ?? "", /^Cuisine en L des années 2000, /, nom);
    // Le fichier généré suit (src/lib/bibliotheque.test.ts vérifie qu'il est exactement la sortie du script).
    const donnees = lire("src/data/ambiances-serie-2.ts");
    assert.equal((donnees.match(/Cuisine en L des années 2000/g) ?? []).length, 3);
    assert.doesNotMatch(donnees, /Cuisine en L des années 1970/);
  });

  test("six avant / après nommés par ce que les gens ont chez eux, l'après au plus petit ΔE affiché", () => {
    assert.deepEqual(
      CUISINES_ACCUEIL.map((c) => [c.nom, c.apres]),
      [
        ["Hêtre des années 2000", "cuisine-l-hetre-apres-couleur"],
        ["Blanc qui a jauni", "cuisine-blanche-jaunie-apres-bois"],
        ["Merisier", "cuisine-merisier-apres-couleur"],
        ["Chêne doré", "cuisine-u-pavillon-apres-bois"],
        ["Gris brillant", "cuisine-grise-brillante-apres-couleur"],
        ["Pin orangé", "cuisine-maison-de-village-apres-couleur"],
      ]
    );
    const cuisines = cuisinesAccueil();
    assert.equal(cuisines.length, 6);
    for (const c of cuisines) {
      assert.equal(c.ratio, "1536 / 1024");
      assert.ok(c.preparees.avant.src.includes(c.ambiance.avant!), c.nom);
      assert.ok(c.altAvant.endsWith("Image d'ambiance."), c.nom);
    }
    // Une même référence sur deux surfaces ne fait qu'un cartel.
    assert.deepEqual(cuisines[0].matieres.map((m) => [m.surfaces, m.matiere.id]), [["Meubles bas et meubles hauts", "NE83"], ["Plan de travail", "NH38"]]);
  });

  test("le curseur, l'étiquette, les cartels sous l'image, « Essayer cette composition chez moi » (depuis=accueil-cuisines)", () => {
    const cuisines = cuisinesAccueil();
    const html = rendre(createElement(CuisinesCommeLaVotre, { cuisines }));
    assert.equal(compter(html, 'role="slider"'), 6);
    assert.equal(compter(html, ">Ambiance · avant / après</span>"), 6);
    assert.equal(compter(html, ">Essayer cette composition chez moi</a>"), 6);
    assert.ok(!html.includes('fetchPriority="high"'), "un seul couple prioritaire par page : l'ouverture");
    for (const c of cuisines) {
      assert.ok(html.includes(`>${c.nom}</h3>`), c.nom);
      assert.ok(html.includes(`href="${c.lien.replaceAll("&", "&amp;")}"`), c.nom);
      const parametres = new URLSearchParams(c.lien.split("?")[1]);
      assert.equal(lireDepuis(parametres.get("depuis")), "accueil-cuisines");
      assert.equal(parametres.get("projet"), "cuisine");
      assert.ok(lireComposition(lireRefDemandee(parametres.get("ref")))?.length, c.nom);
      for (const m of c.matieres) assert.ok(html.includes(`${m.matiere.id} · `), `${c.nom} : ${m.matiere.id}`);
    }
    assert.equal(boutons(html, "principal"), 0);
  });
});

describe("4. Comment on travaille", () => {
  test("quatre étapes numérotées en grand, chacune avec sa photo étiquetée ; la preuve de finition ; les garanties", () => {
    assert.deepEqual(ETAPES_TRAVAIL.map((e) => [e.image, e.etiquette]), [["etape-photo", "Ambiance"], ["etape-simulation", "Simulation"], ["echantillons-table", "Ambiance"], ["pose-mains", "Ambiance"]]);
    // Relecture des lots B et C : la capture du simulateur montrait une fourchette de prix écrite dans l'image, qui
    // contredisait les tarifs du CRM ; elle est recadrée en local (sharp, sans génération) sur le curseur avant / après
    // seul. Le manifeste suit (`npm run images`) : 538 × 359, au rapport 3 / 2 du cadre, plus jamais l'écran entier.
    const capture = MANIFESTE_IMAGES["etape-simulation"];
    assert.deepEqual([capture.largeur, capture.hauteur, capture.largeurs], [538, 359, [480, 538]]);
    assert.ok(Math.abs(capture.largeur / capture.hauteur - 3 / 2) < 0.01);
    assert.equal(capture.empreinte, "73d354f50b42", "l'original recadré, commité dans public/images/sources");
    assert.deepEqual(ETAPES_TRAVAIL.map((e) => e.titre), ["Votre photo", "La simulation", "Les échantillons chez vous", `La pose en ${DUREE_POSE_TEXTE}`]);
    assert.deepEqual(GARANTIES.map((g) => g.titre), ["Sans démontage", "Sans poussière", "Devis gratuit", "Un seul interlocuteur"]);
    assert.ok(GARANTIES[2].texte.includes(DELAI_REPONSE) && DELAI_REPONSE === "sous 48 h");
    const html = rendre(createElement(CommentOnTravaille, { depuis: "accueil-etapes", idBouton: ANCRES_ACCUEIL.boutonEtapes, preuve: true }));
    assert.equal(compter(html, "<li"), 4);
    for (const n of ["01", "02", "03", "04"]) assert.ok(html.includes(`aria-hidden="true">${n}</span>`), n);
    assert.equal(compter(html, 'class="grand-numero '), 4);
    assert.equal(compter(html, "<picture>"), 5, "quatre étapes et la preuve de finition");
    assert.ok(html.includes("/images/prep/detail-chant-"));
    // Images décoratives (le texte de l'étape dit tout) : leur étiquette n'est pas lue seule.
    assert.equal(compter(html, 'alt=""'), 5);
    assert.equal(compter(html, ">Simulation</span>"), 1, "la capture du simulateur, seule");
    assert.equal(compter(html, ">Ambiance</span>"), 4);
    assert.equal(boutons(html, "principal"), 1);
    assert.match(html, /id="etapes-simuler"[^>]*><a [^>]*href="\/simulateur\?depuis=accueil-etapes"[^>]*>Simuler ma pièce<\/a>/);
    // Sans la preuve (une autre page) : les quatre étapes et le bouton.
    assert.equal(compter(rendre(createElement(CommentOnTravaille, {})), "<picture>"), 4);
  });

  test("le covering n'est expliqué qu'une fois sur l'accueil : dans « Comment on travaille »", () => {
    assert.ok(PHRASE_COVERING.startsWith("Le covering, c'est un film adhésif"));
    const avec = SOURCES_ACCUEIL.filter((f) => /film adhésif|c'est un film/i.test(lire(f)));
    assert.deepEqual(avec, ["src/components/accueil/CommentOnTravaille.tsx"]);
  });
});

describe("5. Le présentoir", () => {
  test("8 références réelles du catalogue, une par famille d'usage", () => {
    assert.equal(MATIERES_VEDETTES.length, 8);
    assert.equal(new Set(MATIERES_VEDETTES.map((v) => v.famille)).size, 8, "familles distinctes");
    assert.deepEqual([...new Set(MATIERES_VEDETTES.map((v) => v.famille))].sort(), ["beton", "blanc-mat", "bois-clair", "bois-fonce", "couleur", "marbre", "metal", "noir-mat"]);
    const catalogue = new Map(CATALOGUE.map((r) => [r.id, r]));
    for (const v of MATIERES_VEDETTES) {
      assert.ok(catalogue.has(v.ref), `${v.ref} absente du catalogue`);
      assert.equal(catalogue.get(v.ref)?.famille, v.familleCatalogue, v.ref);
    }
    assert.equal(matieresVedettes().length, 8);
    assert.deepEqual(matieresVedettes([{ id: "K1", nom: "Black Mat", famille: "couleur" }]).map((v) => v.nom), ["Black Mat"], "une référence disparue n'est pas montrée");
    assert.deepEqual(matiereCartel("RM20"), { id: "RM20", nom: "Sage Green", famille: "couleur", finition: "Soft", hex: "#616A57" });
    assert.equal(matiereCartel("ZZZ999"), null);
  });

  test("la bande vert profond, la pastille « 497 matières », 8 vrais échantillons vers leur fiche, l'entrée du catalogue en secondaire", () => {
    const html = rendre(createElement(Presentoir));
    for (const v of MATIERES_VEDETTES) {
      assert.ok(html.includes(`href="${lienMatiere(v.ref)}"`), v.ref);
      assert.ok(html.includes(`/api/site/echantillons/${v.ref}?l=320`), v.ref);
    }
    assert.equal(compter(html, 'width="320" height="320"'), 8);
    assert.equal(compter(html, "aspect-square"), 8);
    assert.equal(compter(html, `aria-label="Voir les ${NB_REFERENCES} matières"`), 1, "une pastille");
    assert.ok(html.includes(`>Voir les ${NB_REFERENCES} matières</a>`));
    assert.equal(boutons(html, "principal"), 0);
    assert.equal(boutons(html, "secondaire"), 1);
    assert.ok(html.includes('role="img" aria-label="Matière Deep Green · NF13'));
  });

  test("la destination : la fiche de la matière (lot D4) ; la page Matières relit toujours ?ref=, ouvre la matière et filtre sa famille", () => {
    for (const v of MATIERES_VEDETTES) {
      // Site 3.0, lot D4 : l'échantillon mène à la fiche, sous la famille du catalogue, et la fiche existe.
      assert.equal(lienMatiere(v.ref), `/matieres/${v.familleCatalogue}/${v.ref}`, v.ref);
      assert.equal(ficheDe(v.familleCatalogue, v.ref)?.id, v.ref, v.ref);
      // L'ancienne adresse reste servie : le présentoir l'ouvre toujours.
      const ref = new URLSearchParams(`ref=${v.ref}`).get("ref");
      assert.equal(referenceDeLAdresse(ref, CATALOGUE)?.id, v.ref, v.ref);
      assert.equal(referenceDeLAdresse(ref, CATALOGUE)?.famille, v.familleCatalogue, v.ref);
    }
    assert.equal(lienMatiere("ZZZ999"), "/matieres?ref=ZZZ999", "une référence hors catalogue garde l'ancienne adresse");
    for (const inconnue of [null, undefined, "", "  ", "ZZZ999"]) assert.equal(referenceDeLAdresse(inconnue, CATALOGUE), null, String(inconnue));
    const client = lire("src/app/matieres/_components/Matieres.tsx");
    assert.match(client, /const rechercheAdresse = useSyncExternalStore\(ecouterAdresse, rechercheDeLAdresse, rechercheServeur\);/);
    assert.match(client, /const adresse = lireAdresseMatieres\(rechercheAdresse, catalogue\);/);
    assert.match(client, /setAgrandie\(adresse\.ouverte\)/);
    assert.match(lire("src/lib/matieres.ts"), /referenceDeLAdresse\(parametres\.get\("ref"\), catalogue\)/);
  });
});

describe("6. Réalisations : les vraies d'abord, puis la rangée « Ambiances »", () => {
  test("sans réalisation publiée : la section le dit, et la rangée « Ambiances » seule, étiquetée, vers /inspirations", () => {
    assert.deepEqual(realisationsAccueil([]), []);
    const html = rendre(createElement(RealisationsAccueil, { reelles: [] }));
    assert.ok(html.includes("Nos réalisations arrivent"));
    assert.equal(compter(html, "<article"), 0);
    assert.ok(!html.includes(">Réalisation") && !html.includes(">Simulation<"));
    assert.equal(compter(html, ">Ambiance</span>"), 5, "le titre de la rangée et ses quatre images");
    for (const id of AMBIANCES_ACCUEIL) assert.ok(html.includes(`href="/inspirations#${id}"`), id);
    assert.equal(boutons(html, "principal"), 0);
    assert.equal(boutons(html, "secondaire"), 1);
    assert.match(html, /href="\/inspirations"/);
    assert.ok(!html.includes('href="/realisations"'), "pas de lien vers /realisations tant qu'elle n'a rien à montrer");
  });

  test("avec des réalisations publiées : elles d'abord (3 au plus, avec leur photo après), puis les ambiances", () => {
    const pubs = [
      publication({ id: "sans-photo" }),
      publication({ id: "p1", photoApres: "/a1", photoAvant: "/b1", ville: "Mauguio", prix: 2400, duree: "1 journée", matieres: [{ ref: "K1", nom: "Black Mat" }] }),
      publication({ id: "p2", photoApres: "/a2" }),
      publication({ id: "avis", type: "AVIS", photoApres: "/a3" }),
      publication({ id: "p3", photoApres: "/a4" }),
      publication({ id: "p4", photoApres: "/a5" }),
    ];
    const reelles = realisationsAccueil(pubs);
    assert.deepEqual(reelles.map((e) => e.id), ["p1", "p2", "p3"]);
    // Relecture des lots B et C : la réalisation de l'ouverture n'est pas répétée en première carte (comme sur les pages
    // de prestation et /pro).
    assert.deepEqual(realisationsAccueil(pubs, "p1").map((e) => e.id), ["p2", "p3", "p4"]);
    assert.match(lire("src/app/page.tsx"), /<RealisationsAccueil reelles=\{realisationsAccueil\(realisations, ouverture\?\.idPublication\)\} ouvertureReelle=\{ouverture\?\.type === "realisation"\} \/>/);
    // La seule réalisation est à l'ouverture : la section ne dit pas « en préparation » et garde « Voir les réalisations ».
    const seule = rendre(createElement(RealisationsAccueil, { reelles: [], ouvertureReelle: true }));
    assert.ok(seule.includes(">Nos réalisations</h2>") && !seule.includes("arrivent") && !seule.includes("en préparation"));
    assert.match(seule, /href="\/realisations"/);
    assert.equal(compter(seule, "<article"), 0);
    const html = rendre(createElement(RealisationsAccueil, { reelles }));
    assert.equal(compter(html, "<article"), 3);
    assert.ok(html.indexOf("<article") < html.indexOf('href="/inspirations#'), "les vraies avant les ambiances");
    assert.ok(html.includes(`${euros(2400)} · 1 journée`), "les chiffres publiés passent avant");
    assert.equal(compter(html, `>pose en ${DUREE_POSE_TEXTE} en général<`), 2, "sans prix publié : la durée habituelle seule, libellée comme telle");
    assert.ok(!html.includes("Prix habituel"), "jamais une fourchette fixe à la place du prix d'un chantier (relecture des lots B et C)");
    assert.ok(html.includes(`href="${lienMatiere("K1")}"`));
    assert.match(html, /srcSet="\/a1\?l=480 480w, \/a1\?l=960 960w, \/a1\?l=1600 1600w"/, "WebP réduits par le CRM");
    assert.equal(boutons(html, "secondaire"), 1);
    assert.match(html, /href="\/realisations"/);
    assert.ok(!html.includes('fetchPriority="high"'), "une seule image prioritaire par page : l'ouverture");
  });

  test("prix et durée d'une réalisation : publiés ; sans prix publié, aucun (relecture des lots B et C), la durée habituelle selon le type de projet, rien pour un local pro", () => {
    const etude = (p: Partial<Publication>) => versEtudeReelle(publication({ id: "e", photoApres: "/a", ...p }));
    assert.equal(lignePrixDuree(etude({ prix: 2400, duree: "2 jours" })), `${euros(2400)} · 2 jours`);
    assert.equal(lignePrixDuree(etude({ prix: 2400 })), `${euros(2400)} · pose en ${DUREE_POSE_TEXTE} en général`);
    assert.equal(lignePrixDuree(etude({ typeProjet: "SDB" })), `pose en ${DUREE_POSE_TEXTE} en général`, "le CRM met la salle de bain « Sur devis » : aucune fourchette inventée");
    assert.equal(lignePrixDuree(etude({ typeProjet: "MEUBLES" })), null, "aucune durée habituelle annoncée pour un meuble, aucun prix habituel");
    assert.equal(lignePrixDuree(etude({ typeProjet: "MEUBLES", prix: 480 })), euros(480));
    for (const typeProjet of ["PRO", "AUTRE", null]) assert.equal(lignePrixDuree(etude({ typeProjet })), null, String(typeProjet));
    for (const prix of [0, -5, Number.NaN]) assert.equal(etude({ prix }).prix, null);
  });

  test("une seule carte de réalisation, pour l'accueil et /realisations", () => {
    const realisations = lire("src/app/realisations/page.tsx");
    assert.match(realisations, /<CarteRealisation key=\{p\.id\} etude=\{versEtudeReelle\(p\)\} avecTexte tailles=\{TAILLES_CARTE\} \/>/);
    assert.match(lire("src/components/accueil/RealisationsAccueil.tsx"), /<CarteRealisation /);
    assert.ok(!/<source type=/.test(lire("src/components/simulation/AvantApres.tsx")) && !/<source type=/.test(lire("src/components/simulation/Photo.tsx")), "un seul <picture> : ImagePreparee");
  });
});

describe("7. Professionnels", () => {
  test("le comptoir d'accueil avant → après bois, étiqueté, ses matières, l'offre pro en secondaire sur l'encre", () => {
    const html = rendre(createElement(ProAccueil));
    assert.match(html, /^<section id="pro"[^>]*class="ton-encre bg-encre text-fond/);
    assert.equal(compter(html, 'role="slider"'), 1);
    assert.ok(html.includes("/images/prep/pro-comptoir-accueil-avant-") && html.includes("/images/prep/pro-comptoir-accueil-apres-bois-"));
    assert.ok(html.includes(">Ambiance · avant / après</span>"));
    assert.ok(html.includes("D1 · Bois"), "le noyer Classic Walnut, la seconde teinte du pro");
    assert.equal(boutons(html, "principal"), 0);
    assert.equal(boutons(html, "sur-encre"), 1);
    assert.match(html, /href="\/pro"/);
  });
});

describe("8. Avis Google et prix", () => {
  test("blocAvis rend null sans note ET nombre valides", () => {
    for (const donnees of [null, undefined, "4,9", [], { disponible: false }, { note: 4.9 }, { nombre: 12 }, { note: 0, nombre: 3 }, { note: 5.2, nombre: 3 }, { note: 4.9, nombre: 0 }, { note: 4.9, nombre: 2.5 }, { note: "4.9", nombre: "12" }, { note: Number.NaN, nombre: 12 }]) {
      assert.equal(blocAvis(donnees), null, JSON.stringify(donnees));
    }
  });

  test("avec une note et un nombre : le bloc, trois extraits valides au plus", () => {
    const bloc = blocAvis({
      disponible: true,
      note: 4.9,
      nombre: 23,
      avis: [
        { auteur: "Camille R.", note: 5, texte: "Cuisine méconnaissable.", date: "2026-08-12T09:00:00.000Z" },
        { auteur: "", note: 5, texte: "Sans auteur" },
        { auteur: "Paul", texte: "Sans note ni date" },
        { auteur: "Inès M.", note: 7, texte: "Note hors bornes gardée sans note", date: "pas une date" },
        { auteur: "Quatrième", texte: "Au-delà de trois" },
      ],
    });
    assert.ok(bloc);
    assert.deepEqual([bloc.note, bloc.nombre, bloc.avis.length], [4.9, 23, 3]);
    assert.deepEqual(bloc.avis.map((a) => a.auteur), ["Camille R.", "Paul", "Inès M."]);
    assert.deepEqual([bloc.avis[2].note, bloc.avis[2].date], [null, null]);
    assert.equal(formaterNote(4.9), "4,9");
    const liens = blocAvis({ note: 5, nombre: 1, avis: [{ auteur: "A", texte: "T", lienAuteur: "javascript:alert(1)", photoAuteur: "http://lh3.googleusercontent.com/a", lienAvis: "https://www.google.com/maps/reviews/1" }] });
    assert.deepEqual([liens?.avis[0].lienAuteur, liens?.avis[0].photoAuteur, liens?.avis[0].lienAvis], [null, null, "https://www.google.com/maps/reviews/1"]);
    assert.equal(lienHttps("data:text/html,x"), null);
  });

  test("sans avis : ni note ni nombre à l'écran ; les prix, la zone et la garantie toujours", () => {
    const html = rendre(createElement(ContenuAvisPrix, { avis: null, tarifs: null }));
    assert.ok(!/Note Google|sur 5|avis Google/.test(html));
    assert.ok(html.includes(">Nos prix</h2>"));
    assert.equal(LIGNE_ZONE, "Pérols, Montpellier et l'Hérault");
    assert.ok(html.includes("Pérols, Montpellier et l&#x27;Hérault"));
    assert.match(html, /href="\/zones"/);
    assert.equal(LIGNE_GARANTIE, `${GARANTIE_ANS} ans sur la pose et le film`);
    assert.ok(html.includes(LIGNE_GARANTIE));
    assert.ok(!/<img|<svg/.test(html), "pas de logo");
    assert.match(html, /^<section id="avis-prix"/);
  });

  test("avec avis : la note, le nombre exact, les extraits avec leur mois et l'attribution exigée par Google", () => {
    const extrait = {
      auteur: "Camille Rousselet",
      lienAuteur: "https://www.google.com/maps/contrib/essai-1/reviews",
      photoAuteur: "https://lh3.googleusercontent.com/a/essai-1=s128",
      lienAvis: "https://www.google.com/maps/reviews/data=essai-1",
      note: 5,
      texte: "Parfait.",
      date: "2026-08-12T09:00:00.000Z",
    };
    const html = rendre(createElement(ContenuAvisPrix, { avis: { note: 4.9, nombre: 1234, avis: [extrait] }, tarifs: null }));
    assert.ok(html.includes("Note Google"));
    assert.ok(html.includes("4,9 sur 5"));
    assert.ok(html.includes(`D&#x27;après ${(1234).toLocaleString("fr-FR")} avis Google.`));
    assert.ok(html.indexOf("Note Google") < html.indexOf("Nos prix"), "les avis, puis les prix");
    assert.match(html, /<a href="https:\/\/www\.google\.com\/maps\/contrib\/essai-1\/reviews" target="_blank" rel="noopener noreferrer"[^>]*>Camille Rousselet<\/a> · 5 sur 5 · août 2026/);
    assert.match(html, /<img src="https:\/\/lh3\.googleusercontent\.com\/a\/essai-1=s128" alt="" width="32" height="32" loading="lazy"/);
    assert.match(html, /<a href="https:\/\/www\.google\.com\/maps\/reviews\/data=essai-1" target="_blank" rel="noopener noreferrer" aria-label="Voir l&#x27;avis de Camille Rousselet sur Google Maps"[^>]*>Voir l&#x27;avis<\/a>/);
    assert.match(html, /<span class="font-google text-\[14px\] font-normal whitespace-nowrap text-google">Google Maps<\/span>/);
    assert.ok(html.includes(ORDRE_AVIS.replaceAll("'", "&#x27;")));
    assert.match(lire("src/app/globals.css"), /--color-google: #5e5e5e;/);
    assert.match(lire("src/app/globals.css"), /--font-google: Roboto, sans-serif;/);
    const nu = rendre(createElement(ContenuAvisPrix, { avis: { note: 4.9, nombre: 3, avis: [{ ...extrait, lienAuteur: null, photoAuteur: null, lienAvis: null }] }, tarifs: null }));
    assert.ok(!/<img|<a href="https:\/\/www\.google/.test(nu));
    assert.ok(nu.includes(">Camille Rousselet</span> · 5 sur 5"));
    const sansExtrait = rendre(createElement(ContenuAvisPrix, { avis: { note: 4.9, nombre: 3, avis: [] }, tarifs: null }));
    assert.ok(sansExtrait.includes(">Google Maps</span>") && !sansExtrait.includes("pertinents"));
  });

  test("les prix du CRM tels quels : chaque prix à son unité, un prix absent n'est pas montré, une famille sans prix est « sur devis »", () => {
    const tarifs: TarifsSite = {
      version: 1,
      familles: [
        { id: "CUISINE", sousParties: [{ id: "facades-hautes", libelle: "Façades hautes", metrage: true, prixUnitaire: 117, unite: "ml" }, { id: "credence", libelle: "Crédence", metrage: false, prixUnitaire: null, unite: "ml" }], formats: [] },
        { id: "SDB", sousParties: [{ id: "meuble-vasque", libelle: "Meuble vasque", metrage: true, prixUnitaire: null, unite: "ml" }], formats: [] },
        { id: "PRO", sousParties: [{ id: "comptoir", libelle: "Comptoir", metrage: true, prixUnitaire: 333, unite: "jour" }, { id: "autre", libelle: "Autre", metrage: false, prixUnitaire: 41, unite: "forfait" }], formats: [] },
      ],
    };
    const html = rendre(createElement(ContenuPrix, { tarifs }));
    assert.ok(html.includes(">117 €/ml</dd>") && html.includes(">333 € par jour</dd>") && html.includes(">41 € le forfait</dd>"));
    assert.ok(!html.includes("Crédence"), "un prix absent n'est pas montré");
    assert.ok(html.includes(">Salle de bain</h3>") && html.includes("Sur devis, après une visite ou sur vos photos."));
    assert.match(html, /tabular-nums/);
    assert.equal(prixAffiche({ prixUnitaire: null, unite: "ml" }), null);
  });

  test("le CRM ne répond pas : le repli documenté, la plage au mètre linéaire seule — plus aucune fourchette par pièce (relecture des lots B et C)", () => {
    const html = rendre(createElement(ContenuPrix, { tarifs: null }));
    assert.ok(html.includes(PRIX_PLAGE) && html.includes(REPLI_PAR_PIECE));
    // Les fourchettes d'offre.ts contredisaient le CRM (une salle de bain chiffrée là où il dit « Sur devis ») : aucune n'est montrée.
    for (const cle of ["cuisine", "sdb", "meuble"] as const) assert.ok(!html.includes(fourchette(cle)), cle);
    assert.doesNotMatch(html, /<dl>(?:(?!<\/dl>)[\s\S])*<p/, "pas de paragraphe dans la liste de définitions");
  });

  test("le tarif d'une famille en une ligne (relecture des lots B et C) : un prix, le plus bas, « sur devis », sinon la plage", () => {
    const sp = (id: string, prixUnitaire: number | null, unite: "ml" | "jour" | "forfait" = "ml") => ({ id, libelle: id, metrage: true, prixUnitaire, unite });
    const tarifs: TarifsSite = {
      version: 1,
      familles: [
        { id: "CUISINE", sousParties: [sp("facades-hautes", 110), sp("facades-basses", 110), sp("credence", null)], formats: [] },
        { id: "MEUBLES", sousParties: [sp("dressing", 50), sp("tv", 65), sp("bar", 55)], formats: [] },
        { id: "SDB", sousParties: [sp("meuble-vasque", null)], formats: [] },
        { id: "PRO", sousParties: [sp("comptoir", 55), sp("pose", 300, "jour")], formats: [] },
      ],
    };
    assert.equal(tarifDeLaFamille(tarifs, "CUISINE"), "110 €/ml");
    assert.equal(tarifDeLaFamille(tarifs, "MEUBLES"), "dès 50 €/ml");
    assert.equal(tarifDeLaFamille(tarifs, "SDB"), null, "aucun prix publié : sur devis");
    assert.equal(tarifDeLaFamille(tarifs, "PRO"), "dès 55 €/ml", "deux unités : l'unité du premier prix, « dès »");
    assert.equal(tarifDeLaFamille({ version: 1, familles: [] }, "CUISINE"), null);
    assert.equal(tarifDeLaFamille(null, "SDB"), PRIX_PLAGE, "sans le CRM : la plage au mètre linéaire, jamais une fourchette par pièce");
  });

  test("relecture des lots B et C : les fourchettes par pièce d'offre.ts ne servent plus qu'au repli de l'estimation du simulateur", () => {
    const fichiers = (dossier: string): string[] => readdirSync(dossier, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fichiers(path.join(dossier, e.name)) : /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [path.join(dossier, e.name)] : []));
    const utilisateurs = fichiers(path.join(process.cwd(), "src"))
      .filter((f) => /\bFOURCHETTES\b|\bfourchette\(/.test(readFileSync(f, "utf8")))
      .map((f) => path.relative(process.cwd(), f).split(path.sep).join("/"))
      .sort();
    assert.deepEqual(utilisateurs, ["src/lib/estimation.ts", "src/lib/offre-legere.ts", "src/lib/offre.ts"]);
    // Et aucun de leurs montants dans les textes servis (FAQ, prestations, guides).
    const montants = [FOURCHETTES.cuisine.min, FOURCHETTES.cuisine.max, FOURCHETTES.sdb.max, FOURCHETTES.meuble.min].map((n) => euros(n));
    const textes = JSON.stringify([FAQ_GENERALE, FAQ_SIMULATEUR]);
    for (const m of montants) assert.ok(!textes.includes(m), m);
  });

  test("aucun prix, aucune note écrite dans les sources de l'accueil : tout vient du CRM ou d'offre.ts", () => {
    for (const f of SOURCES_ACCUEIL) {
      assert.ok(!/\d+\s?€/.test(lire(f)), `${f} : un montant écrit`);
      assert.ok(!/\b[0-4][,.]\d sur 5|\b\d+ avis\b/.test(lire(f)), `${f} : une note écrite`);
    }
    assert.match(lire("src/lib/avis-google.ts"), /\/api\/site\/avis-google`, \{ next: \{ revalidate: 3600 \} \}/);
    assert.match(lire("src/components/accueil/AvisPrix.tsx"), /const \[avis, tarifs\] = await Promise\.all\(\[chargerAvisGoogle\(\), chargerTarifs\(\)\]\);/);
  });
});

describe("9. Questions avant de se lancer, puis le dernier appel", () => {
  test("six questions de la FAQ, telles quelles, et un seul FAQPage sur l'accueil", () => {
    assert.ok(QUESTIONS_ACCUEIL.length >= 4 && QUESTIONS_ACCUEIL.length <= 6);
    for (const q of QUESTIONS_ACCUEIL) assert.ok([...FAQ_GENERALE, ...FAQ_SIMULATEUR].includes(q), q.q);
    const html = rendre(createElement(QuestionsAccueil));
    assert.equal(compter(html, '"@type":"FAQPage"'), 1);
    assert.equal(compter(html, "<details"), QUESTIONS_ACCUEIL.length);
    // Mission 16 retirait la FAQ de l'accueil ; l'énoncé du site 3.0 la demande (§ C.1, n° 9) : une seule, balisée.
    const avecFaq = SOURCES_ACCUEIL.filter((f) => /FAQSchema/.test(lire(f)));
    assert.deepEqual(avecFaq, ["src/components/accueil/QuestionsAccueil.tsx"]);
    assert.match(lire("src/data/faq.ts"), /Servies sur \/comment-ca-marche \(#faq\)/);
    assert.match(lire("src/data/faq.ts"), /l'accueil en reprend six \(`QUESTIONS_ACCUEIL`\)/);
  });

  test("le dernier appel, en encre : la promesse, « Simuler ma pièce » en principal, « Être rappelé » et WhatsApp sur l'encre", () => {
    const html = rendre(createElement(DernierAppel));
    assert.match(html, /^<section id="dernier-appel"[^>]*class="ton-encre bg-encre text-fond/);
    assert.ok(html.includes(`>${TITRE_ACCUEIL}</h2>`));
    assert.equal(boutons(html, "principal"), 1);
    assert.equal(boutons(html, "sur-encre"), 2);
    assert.equal(boutons(html, "secondaire"), 0);
    assert.match(html, /href="\/simulateur\?depuis=accueil-final"[^>]*>Simuler ma pièce<\/a>/);
    assert.ok(html.indexOf(">Être rappelé</button>") > 0 && html.indexOf("Écrire sur WhatsApp") > 0);
  });

  test("WhatsApp : message court prérempli sans donnée personnelle, clic compté (WHATSAPP_CLIQUE, vers le CRM seulement)", () => {
    assert.equal(MESSAGE_WHATSAPP_DEVIS, "Bonjour, je souhaite un devis pour ma cuisine.");
    assert.equal(lienWhatsApp(), "https://wa.me/33670352869?text=Bonjour%2C%20je%20souhaite%20un%20devis%20pour%20ma%20cuisine.");
    const html = rendre(createElement(BoutonWhatsApp, { depuis: "accueil-final" }));
    assert.ok(html.includes(`href="${lienWhatsApp().replaceAll("&", "&amp;")}"`));
    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="noopener noreferrer"/);
    assert.doesNotMatch(lire("src/lib/evenements-site.ts"), /dataLayer|VERS_DATALAYER|@\/lib\/analytics/);
    assert.match(lire("src/components/accueil/BoutonWhatsApp.tsx"), /envoyerEvenement\("WHATSAPP_CLIQUE", \{ depuis \}\)/);
  });

  test("site 3.0 (lot B2) : WhatsApp en secondaire sur le papier, en sur-encre posé sur l'encre ; jamais rouge", () => {
    assert.ok(rendre(createElement(BoutonWhatsApp, { depuis: "accueil-final" })).includes(`class="${classesBouton("secondaire")}"`));
    const surEncre = rendre(createElement(BoutonWhatsApp, { depuis: "accueil-final", variante: "sur-encre" }));
    assert.ok(surEncre.includes(`class="${classesBouton("sur-encre")}"`));
    assert.doesNotMatch(surEncre, /accent/);
  });
});

describe("« Être rappelé » : une feuille, un vrai formulaire, rien d'envoyé sans geste", () => {
  test("fermé, ce n'est qu'un bouton secondaire (sur-encre sur l'encre) : aucun champ rendu", () => {
    const html = rendre(createElement(FormulaireRappel, { depuis: "accueil-ouverture" }));
    assert.equal(html, `<button type="button" class="${classesBouton("secondaire")}">Être rappelé</button>`);
    assert.ok(rendre(createElement(FormulaireRappel, { depuis: "accueil-final", variante: "sur-encre" })).startsWith(`<button type="button" class="${classesBouton("sur-encre")}">`));
  });

  test("l'envoi : /api/contact, formulaire coverswap.fr/rappel (source SITE_CONTACT), le créneau, le captcha, le consentement ; deux événements", () => {
    // Lot F7 : le formulaire vit dans la feuille (`FeuilleRappel`, chargée au premier geste) ; le bouton calcule les créneaux.
    const source = lire("src/components/accueil/FeuilleRappel.tsx");
    const bouton = lire("src/components/accueil/FormulaireRappel.tsx");
    assert.equal(FORMULAIRE_RAPPEL, "coverswap.fr/rappel");
    assert.equal(resolveSource(FORMULAIRE_RAPPEL), "SITE_CONTACT");
    assert.match(source, /fetch\("\/api\/contact", \{/);
    assert.match(source, /rappelCreneau: creneau,/);
    assert.match(source, /formulaire: FORMULAIRE_RAPPEL,/);
    assert.match(source, /turnstileToken: jeton,/);
    assert.match(source, /<Turnstile action="rappel" theme="light" onToken=\{setJeton\} actif=\{touche\} \/>/);
    assert.match(source, /<CaseConsentement /);
    assert.match(source, /name="website"/, "pot de miel");
    assert.match(source, /envoyerEvenement\("CONTACT_ENVOYE", \{ formulaire: "rappel", depuis \}\);\s+envoyerEvenement\("RAPPEL_DEMANDE", \{ creneau, depuis \}\);/);
    assert.match(bouton, /const ouvrir = \(\) => \{[^}]*setOptions\(creneauxRappel\(new Date\(\)\)\);/, "créneaux calculés à l'ouverture, en heure de Paris");
    assert.match(source, /export function FeuilleRappel\(\{ depuis, ouverte, onFermer, options \}/);
    assert.match(source, /const creneau = choix \?\? options\[0\]\?\.code \?\? null;/, "le premier créneau par défaut, un choix gardé");
    assert.match(source, /import \{ FORMULAIRE_RAPPEL \} from "\.\/FormulaireRappel";/);
    // La route transmet le créneau au CRM, validé comme dans /api/simulation/contact.
    assert.match(lire("src/app/api/contact/route.ts"), /\.\.\.\(estCreneauRappel\(body\.rappelCreneau\) \? \{ rappelCreneau: body\.rappelCreneau \} : \{\}\),/);
  });
});
