import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import revetements from "@/data/revetements.json";
import { ORDRE_AVIS, blocAvis, formaterNote, lienHttps } from "@/lib/avis-google";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import type { ManifesteImages } from "@/lib/images-preparees";
import { lignePrixDuree, versEtudeReelle } from "@/lib/etude-de-cas";
import { MATIERES_VEDETTES, lienMatiere, matieresVedettes, referenceDeLAdresse } from "@/lib/matieres-vedettes";
import { DUREE_POSE, DUREE_POSE_TEXTE, FOURCHETTES, GARANTIE_ANS, NB_REFERENCES, PRIX_PLAGE, euros, fourchette } from "@/lib/offre";
import { LARGEURS_PHOTO_CRM, sourcesPhotoCrm, type Publication } from "@/lib/publications";
import { lireDepuis } from "@/lib/simulateur/entonnoir";
import { MESSAGE_WHATSAPP_DEVIS, lienWhatsApp } from "@/lib/whatsapp";
import { classesBouton } from "@/components/simulation/Bouton";
import { BoutonWhatsApp } from "./BoutonWhatsApp";
import { CommentCaMarche, etapesCommentCaMarche } from "./CommentCaMarche";
import { ContenuConfiance, LIGNE_GARANTIE, LIGNE_ZONE } from "./Confiance";
import { DernierAppel } from "./DernierAppel";
import { ALT_AVANT_OUVERTURE, ALT_OUVERTURE, choisirEtudes, choisirOuverture } from "./etudes";
import { MatieresAccueil } from "./MatieresAccueil";
import { Ouverture } from "./Ouverture";
import { RealisationsAccueil } from "./RealisationsAccueil";
import { ANCRES_ACCUEIL, CIBLES_BOUTON_COLLE, DESCRIPTION_META_ACCUEIL, LIGNE_ACCUEIL, TITRE_ACCUEIL, TITRE_META_ACCUEIL, lienSimulerCuisine, sectionsAccueil, type DepuisAccueil } from "./sections";
import { PHRASE_COVERING, TroisFaits } from "./TroisFaits";

/**
 * Mission 16 (partie 3) — l'accueil : huit sections et rien d'autre, un seul
 * bouton principal par section, les règles d'honnêteté codées (réalisation
 * publiée sinon simulation étiquetée ; avis Google seulement avec une note ET
 * un nombre ; prix et durées d'`offre.ts`), huit vraies références du catalogue.
 */

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(path.join(RACINE, f), "utf8");
const rendre = (element: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(element);
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;
/** Les liens rendus avec les classes exactes du bouton principal / secondaire. */
const boutons = (html: string, variante: "principal" | "secondaire") => compter(html, `class="${classesBouton(variante)}`);

function publication(p: Partial<Publication> & { id: string }): Publication {
  return { type: "REALISATION", titre: `Chantier ${p.id}`, texte: null, ville: null, typeProjet: "CUISINE", note: null, auteur: null, photoAvant: null, photoApres: null, publieLe: "2026-09-01T00:00:00.000Z", ...p };
}

describe("les neuf sections, dans l'ordre", () => {
  test("sectionsAccueil() rend 9 entrées dans l'ordre de l'énoncé (mission 19 : « Inspirations » après les réalisations)", () => {
    assert.deepEqual(
      sectionsAccueil().map((s) => s.id),
      ["ouverture", "essayer", "faits", "matieres", "realisations", "inspirations", "comment", "confiance", "dernier-appel"]
    );
    assert.equal(sectionsAccueil().length, 9);
  });

  test("la page rend cette liste et rien d'autre : plus de FAQ, de tarifs, de zones, de prestations ni de catalogue", () => {
    const page = lire("src/app/page.tsx");
    assert.match(page, /sectionsAccueil\(\)\.map/);
    assert.match(page, /const sections: Record<IdSectionAccueil, ReactNode>/);
    for (const retire of ["QuestionsFrequentes", "FAQSchema", "CommentCaSePasse", "PRESTATIONS", "ZONES", "TEMOINS", "<table", "Realisations apercu", "/devis"]) assert.ok(!page.includes(retire), retire);
    assert.match(page, /revalidate = 300/);
    // Le Service de l'accueil pointe vers le simulateur.
    assert.match(page, /urlOffre=\{`\$\{ENTREPRISE\.site\}\/simulateur`\}/);
  });

  test("métadonnées : titre, description ≤ 155 caractères avec le prix et Montpellier", () => {
    assert.equal(TITRE_META_ACCUEIL, "CoverSwap — Votre cuisine transformée en une journée, sans travaux");
    assert.ok(DESCRIPTION_META_ACCUEIL.length <= 155, `${DESCRIPTION_META_ACCUEIL.length} caractères`);
    assert.ok(DESCRIPTION_META_ACCUEIL.includes(PRIX_PLAGE));
    assert.ok(DESCRIPTION_META_ACCUEIL.includes("Montpellier"));
    // Mission 16 (partie 5) : canonical absolu, Open Graph et carte de partage par `metadonneesPage` (testé à part).
    const page = lire("src/app/page.tsx");
    assert.match(page, /metadonneesPage\(\{ titre: TITRE_META_ACCUEIL, description: DESCRIPTION_META_ACCUEIL, chemin: "\/" \}\)/);
  });

  test("le titre : 7 mots au plus, la durée d'offre.ts", () => {
    assert.equal(TITRE_ACCUEIL, "Votre cuisine, transformée en une journée.");
    assert.ok(TITRE_ACCUEIL.split(/\s+/).length <= 7);
    assert.equal(DUREE_POSE, "1 journée");
    assert.equal(DUREE_POSE_TEXTE, "une journée", "même durée que DUREE_POSE, en lettres");
  });

  test("chaque « Simuler ma cuisine » dit d'où il vient, et le simulateur sait le lire", () => {
    const depuis: DepuisAccueil[] = ["accueil-ouverture", "accueil-colle", "accueil-etapes", "accueil-final"];
    for (const d of depuis) {
      assert.equal(lienSimulerCuisine(d), `/simulateur?projet=cuisine&depuis=${d}`);
      assert.equal(lireDepuis(new URLSearchParams(lienSimulerCuisine(d).split("?")[1]).get("depuis")), d);
    }
    assert.equal(lienSimulerCuisine(), "/simulateur?projet=cuisine");
    const page = lire("src/app/page.tsx");
    assert.match(page, /<BoutonColle mobileSeulement cibles=\{CIBLES_BOUTON_COLLE\}>/);
    assert.match(page, /lienSimulerCuisine\("accueil-colle"\)/);
    assert.deepEqual(CIBLES_BOUTON_COLLE, ["ouverture-simuler", "simulation", "etapes-simuler", "dernier-appel", "pied-de-page"]);
    assert.match(lire("src/components/PiedDePage.tsx"), /<footer id="pied-de-page"/);
    assert.match(lire("src/components/HomeClient.tsx"), /id="simulation"/);
  });
});

describe("1. Ouverture", () => {
  test("sans réalisation publiée : la paire d'ambiance, étiquetée « Ambiance » (mission 19), en AVIF prioritaire, ses matières côté « après »", () => {
    const choix = choisirOuverture([]);
    assert.ok(choix && choix.type === "ambiance");
    assert.equal(choix.etiquette, "Ambiance", "« Simulation » est réservé aux rendus du moteur");
    assert.deepEqual(choix.matieres?.map((m) => m.ref), ["RM20", "I14", "NE31"]);
    assert.equal(choix.lienComposition, "/simulateur?projet=cuisine&ref=meubles-bas:RM20,meubles-hauts:I14,plan-de-travail:NE31");
    assert.equal(choix.ratio, "1536 / 1024");
    const html = rendre(createElement(Ouverture, { choix }));
    assert.match(html, /<h1 id="titre-accueil" class="titre-1[^"]*">Votre cuisine, transformée en une journée\.<\/h1>/);
    assert.ok(html.includes(LIGNE_ACCUEIL));
    // Mission 16 (partie 6) : l'adresse porte l'empreinte de l'original (`?v=`, cache immuable d'un an).
    const v = MANIFESTE_IMAGES["ouverture-cuisine-avant"].empreinte;
    assert.ok(v && /^[0-9a-f]{12}$/.test(v));
    assert.ok(html.includes(`<source type="image/avif" srcSet="/images/prep/ouverture-cuisine-avant-480.avif?v=${v} 480w`));
    // Les deux images de l'ouverture en priorité haute (l'« après », qui recouvre l'« avant », est le LCP).
    assert.equal(compter(html, 'fetchPriority="high"'), 2, "les deux images de l'ouverture, et elles seules");
    assert.match(html, new RegExp(`<img src="/images/prep/ouverture-cuisine-avant-960\\.jpg\\?v=${v}"[^>]*fetchPriority="high"`));
    assert.ok(!/loading="lazy"/.test(html), "rien de différé au premier écran");
    assert.match(html, />Ambiance<\/span>/);
    assert.ok(!html.includes(">Simulation<"));
    assert.ok(html.includes("Sage Green · RM20") && html.includes("Essayer cette composition chez moi"));
    assert.match(html, /max-md:hidden[^"]*">Plein écran/, "sur téléphone, seul « Comparer »");
    assert.equal(boutons(html, "principal"), 1);
    assert.equal(boutons(html, "secondaire"), 0, "rien d'autre qu'un bouton ici");
    assert.match(html, new RegExp(`id="${ANCRES_ACCUEIL.boutonOuverture}"[^>]*><a [^>]*href="/simulateur\\?projet=cuisine&amp;depuis=accueil-ouverture"`));
    assert.ok(html.indexOf("<h1") < html.indexOf("<picture>") && html.indexOf("Simuler ma cuisine") < html.indexOf('role="slider"'), "titre et bouton d'abord dans le document (clavier, lecteur d'écran)");
    assert.match(html, /max-md:order-first/, "l'image reste en haut sur téléphone");
    assert.ok(!html.includes("100vh"), "jamais 100vh");
    assert.match(html, /100svh/);
    // L'« après » vient d'abord dans le document (et seul en plein écran) : son texte se lit seul.
    const altApres = `alt="${ALT_OUVERTURE.replace(/'/g, "&#x27;")}"`;
    assert.ok(html.indexOf(altApres) > 0 && html.indexOf(altApres) < html.indexOf(`alt="${ALT_AVANT_OUVERTURE}"`));
    assert.ok(!/^La même/.test(ALT_OUVERTURE) && /^Cuisine en U/.test(ALT_OUVERTURE), ALT_OUVERTURE);
    assert.ok(ALT_OUVERTURE.includes("Sage Green RM20") && ALT_OUVERTURE.endsWith("Image d'ambiance aux teintes du catalogue."), ALT_OUVERTURE);
  });

  test("l'image « avant » pèse 80 Ko au plus en AVIF (le LCP)", () => {
    for (const l of MANIFESTE_IMAGES["ouverture-cuisine-avant"].largeurs) {
      const octets = readFileSync(path.join(RACINE, "public", "images", "prep", `ouverture-cuisine-avant-${l}.avif`)).length;
      assert.ok(octets <= 80 * 1024, `${l} : ${octets} octets`);
    }
  });

  test("la première réalisation publiée avec avant ET après prend la place, « Réalisation, <ville> »", () => {
    const sansAvant = publication({ id: "a", photoApres: "https://crm.example.test/api/site/photos/a/apres", ville: "Sète" });
    const complete = publication({ id: "b", photoAvant: "https://crm.example.test/api/site/photos/b/avant", photoApres: "https://crm.example.test/api/site/photos/b/apres", ville: "Lattes" });
    const choix = choisirOuverture([sansAvant, complete, publication({ id: "c", photoAvant: "x", photoApres: "y" })]);
    assert.ok(choix && choix.type === "realisation");
    assert.equal(choix.etiquette, "Réalisation, Lattes");
    assert.equal(choix.apres, complete.photoApres);
    assert.deepEqual(choix.preparees, { avant: sourcesPhotoCrm(complete.photoAvant!), apres: sourcesPhotoCrm(complete.photoApres!) });
    assert.equal(choisirOuverture([{ ...complete, ville: null }])?.etiquette, "Réalisation");
    assert.equal(choisirOuverture([{ ...complete, type: "AVIS" }])?.type, "ambiance", "un avis n'est pas une réalisation");
    const html = rendre(createElement(Ouverture, { choix }));
    assert.match(html, />Réalisation, Lattes<\/span>/);
    assert.ok(!html.includes(">Simulation<"));
    // Le LCP n'est pas la photo entière du CRM : WebP réduits en srcset, sizes, une seule image prioritaire.
    assert.match(html, /<source type="image\/webp" srcSet="https:\/\/crm\.example\.test\/api\/site\/photos\/b\/avant\?l=480 480w, [^"]*\?l=960 960w, [^"]*\?l=1600 1600w" sizes="\(min-width: 1152px\) 672px/);
    assert.match(html, /<img src="https:\/\/crm\.example\.test\/api\/site\/photos\/b\/avant"[^>]*fetchPriority="high"/);
    assert.equal(compter(html, 'fetchPriority="high"'), 2);
    assert.ok(!/loading="lazy"/.test(html));
  });

  test("sourcesPhotoCrm : les largeurs demandées au CRM (?l=), la photo entière en repli", () => {
    assert.deepEqual(LARGEURS_PHOTO_CRM, [480, 960, 1600]);
    assert.deepEqual(sourcesPhotoCrm("https://crm.example.test/api/site/photos/b/apres"), {
      webp: "https://crm.example.test/api/site/photos/b/apres?l=480 480w, https://crm.example.test/api/site/photos/b/apres?l=960 960w, https://crm.example.test/api/site/photos/b/apres?l=1600 1600w",
      src: "https://crm.example.test/api/site/photos/b/apres",
    });
  });

  test("ni réalisation ni image préparée : pas d'image (jamais une photo au hasard)", () => {
    assert.equal(choisirOuverture([], {} as ManifesteImages), null);
    const html = rendre(createElement(Ouverture, { choix: null }));
    assert.ok(!html.includes("<img"));
    assert.equal(boutons(html, "principal"), 1);
  });
});

describe("3. Trois faits", () => {
  test("trois colonnes de texte, la durée d'offre.ts, sans icône", () => {
    const html = rendre(createElement(TroisFaits));
    assert.equal(compter(html, "<dt"), 3);
    assert.ok(html.includes("Une journée") && html.includes("Sans travaux") && html.includes("Réversible"));
    assert.ok(html.includes(`La pose d&#x27;une cuisine se fait en ${DUREE_POSE_TEXTE}.`));
    assert.ok(!/<svg|<img/.test(html));
  });

  test("le covering et le film adhésif ne sont expliqués qu'une fois sur l'accueil : dans les trois faits", () => {
    assert.equal(PHRASE_COVERING, "Le covering, c'est un film adhésif haute résistance appliqué sur vos surfaces.");
    const dossier = path.join(RACINE, "src", "components", "accueil");
    const fichiers = [...readdirSync(dossier).filter((f) => f.endsWith(".tsx")).map((f) => path.join("src/components/accueil", f)), "src/components/HomeClient.tsx", "src/app/page.tsx"];
    const avec = fichiers.filter((f) => /film adhésif|c'est un film/i.test(lire(f)));
    assert.deepEqual(avec, [path.join("src/components/accueil", "TroisFaits.tsx")]);
  });
});

describe("4. Matières", () => {
  test("8 références réelles du catalogue, une par famille d'usage", () => {
    assert.equal(MATIERES_VEDETTES.length, 8);
    assert.equal(new Set(MATIERES_VEDETTES.map((v) => v.famille)).size, 8, "familles distinctes");
    assert.deepEqual([...new Set(MATIERES_VEDETTES.map((v) => v.famille))].sort(), ["beton", "blanc-mat", "bois-clair", "bois-fonce", "couleur", "marbre", "metal", "noir-mat"]);
    const catalogue = new Map((revetements as { id: string; famille: string }[]).map((r) => [r.id, r]));
    for (const v of MATIERES_VEDETTES) {
      assert.ok(catalogue.has(v.ref), `${v.ref} absente du catalogue`);
      assert.equal(catalogue.get(v.ref)?.famille, v.familleCatalogue, v.ref);
    }
    assert.equal(matieresVedettes().length, 8);
    assert.deepEqual(matieresVedettes([{ id: "K1", nom: "Black Mat", famille: "couleur" }]).map((v) => v.nom), ["Black Mat"], "une référence disparue n'est pas montrée");
  });

  test("8 tuiles vers /matieres?ref=, vignettes du CRM en carré réservé, un bouton secondaire", () => {
    const html = rendre(createElement(MatieresAccueil));
    for (const v of MATIERES_VEDETTES) {
      assert.ok(html.includes(`href="${lienMatiere(v.ref)}"`), v.ref);
      assert.ok(html.includes(`/api/site/echantillons/${v.ref}?l=320`), v.ref);
    }
    assert.equal(compter(html, "aspect-square"), 8);
    assert.equal(compter(html, 'width="320" height="320"'), 8);
    assert.ok(html.includes(`Voir les ${NB_REFERENCES} matières`));
    assert.equal(boutons(html, "principal"), 0);
    assert.equal(boutons(html, "secondaire"), 1);
  });

  test("la destination : la page Matières relit ?ref=, ouvre la fiche et filtre sa famille", () => {
    const catalogue = revetements as { id: string; famille: string }[];
    for (const v of MATIERES_VEDETTES) {
      const ref = new URLSearchParams(lienMatiere(v.ref).split("?")[1]).get("ref");
      assert.equal(referenceDeLAdresse(ref, catalogue)?.id, v.ref, v.ref);
      assert.equal(referenceDeLAdresse(ref, catalogue)?.famille, v.familleCatalogue, v.ref);
    }
    for (const inconnue of [null, undefined, "", "  ", "ZZZ999"]) assert.equal(referenceDeLAdresse(inconnue, catalogue), null, String(inconnue));
    // Mission 16 (partie 5) : la page Matières est rebâtie (`app/matieres/_components/Matieres.tsx`) ; sa lecture de
    // l'adresse est la fonction pure `lireAdresseMatieres` (lib/matieres, testée dans matieres.test.ts).
    const client = lire("src/app/matieres/_components/Matieres.tsx");
    assert.match(client, /const rechercheAdresse = useSyncExternalStore\(ecouterAdresse, rechercheDeLAdresse, rechercheServeur\);/);
    assert.match(client, /const adresse = lireAdresseMatieres\(rechercheAdresse, catalogue\);/);
    assert.match(client, /setAgrandie\(adresse\.ouverte\)/);
    assert.match(lire("src/lib/matieres.ts"), /referenceDeLAdresse\(parametres\.get\("ref"\), catalogue\)/);
  });
});

describe("5. Réalisations", () => {
  test("sans réalisation publiée : trois paires avant / après d'ambiance (mission 19), étiquetées, avec leurs matières, prix d'offre.ts, jamais une ville", () => {
    const choix = choisirEtudes([]);
    assert.equal(choix.mode, "simulees");
    assert.equal(choix.titre, "Ce que ça donne");
    assert.equal(choix.etudes.length, 3);
    if (choix.mode !== "simulees") return;
    assert.deepEqual(choix.etudes.map((e) => e.id), ["cuisine", "salle-de-bain", "meubles"]);
    assert.deepEqual(choix.etudes.map((e) => e.etiquette), ["Ambiance", "Ambiance", "Ambiance"], "des images générées : des ambiances (mission 19 : la cuisine de l'ouverture aussi)");
    assert.deepEqual(choix.etudes.map((e) => e.prix), [fourchette("cuisine"), fourchette("sdb"), fourchette("meuble")]);
    assert.equal(fourchette("cuisine"), `${FOURCHETTES.cuisine.min.toLocaleString("fr-FR")} € à ${FOURCHETTES.cuisine.max.toLocaleString("fr-FR")} €`);
    assert.ok(choix.etudes.every((e) => e.duree === DUREE_POSE_TEXTE));
    assert.deepEqual(choix.etudes.map((e) => (e.image.type === "avant-apres" ? e.image.apres.split("?")[0] : null)), ["/images/prep/ouverture-cuisine-apres-960.jpg", "/images/prep/etude-salle-de-bain-apres-960.jpg", "/images/prep/etude-meubles-apres-960.jpg"]);
    assert.deepEqual(choix.etudes.map((e) => e.matieres?.map((m) => m.ref)), [["RM20", "I14", "NE31"], ["K4", "NE31"], ["NH12", "AA17"]]);
    for (const e of choix.etudes) assert.ok(!("ville" in e));

    const html = rendre(createElement(RealisationsAccueil, { choix }));
    assert.equal(compter(html, "<article"), 3);
    assert.equal(compter(html, ">Simulation</span>"), 0);
    assert.equal(compter(html, ">Ambiance</span>"), 3);
    assert.ok(!html.includes('href="/realisations"'), "pas de bouton vers /realisations tant qu'elle n'a rien à montrer");
    assert.equal(boutons(html, "principal"), 0);
    assert.equal(boutons(html, "secondaire"), 0);
    assert.ok(!html.includes('fetchPriority="high"'), "une seule image prioritaire par page : l'ouverture");
    // Les images sont le contenu de la section : chacune a un texte, et aucune étiquette n'est cachée.
    // (Les vignettes des étiquettes matière sont décoratives : le texte de l'étiquette les nomme.)
    assert.ok(!/<img (?![^>]*api\/site\/echantillons)[^>]*alt=""/.test(html));
    for (const e of choix.etudes) assert.ok(html.includes(`alt="${e.alt.replace(/'/g, "&#x27;")}"`), e.id);
    assert.ok(html.includes("Sage Green · RM20") && html.includes("Khaki · K4") && html.includes("Terracotta Stucco · NH12"));
    assert.ok(!html.includes("aria-hidden=\"true\" class=\"inline-flex"));
  });

  test("avec des réalisations publiées : elles seules (3 au plus, avec leur photo après), « Ils l'ont fait »", () => {
    const pubs = [
      publication({ id: "sans-photo" }),
      publication({ id: "p1", photoApres: "/a1", photoAvant: "/b1", ville: "Mauguio", prix: 2400, duree: "1 journée", matieres: [{ ref: "K1", nom: "Black Mat" }] }),
      publication({ id: "p2", photoApres: "/a2" }),
      publication({ id: "avis", type: "AVIS", photoApres: "/a3" }),
      publication({ id: "p3", photoApres: "/a4" }),
      publication({ id: "p4", photoApres: "/a5" }),
    ];
    const choix = choisirEtudes(pubs);
    assert.equal(choix.mode, "reelles");
    assert.equal(choix.titre, "Ils l'ont fait");
    assert.deepEqual(choix.etudes.map((e) => e.id), ["p1", "p2", "p3"]);
    if (choix.mode !== "reelles") return;
    assert.deepEqual([choix.etudes[0].prix, choix.etudes[0].duree, choix.etudes[0].legende], [2400, "1 journée", "Cuisine · Mauguio"]);
    assert.deepEqual([choix.etudes[1].prix, choix.etudes[1].duree, choix.etudes[1].matieres], [null, null, []], "rien d'inventé quand ce n'est pas publié");
    assert.deepEqual([choix.etudes[1].prixHabituel, choix.etudes[1].dureeHabituelle], [fourchette("cuisine"), DUREE_POSE_TEXTE], "à défaut : la fourchette et la durée habituelles d'offre.ts");
    const html = rendre(createElement(RealisationsAccueil, { choix }));
    assert.equal(compter(html, "<article"), 3);
    assert.ok(html.includes(`${euros(2400)} · 1 journée`), "les chiffres publiés passent avant");
    assert.equal(compter(html, `Prix habituel : ${fourchette("cuisine")} · pose en ${DUREE_POSE_TEXTE} en général`), 2, "sans prix publié : le prix habituel, libellé comme tel");
    assert.ok(html.includes(`href="${lienMatiere("K1")}"`));
    assert.ok(!html.includes(">Simulation<") && !html.includes(">Ambiance<"));
    assert.match(html, /srcSet="\/a1\?l=480 480w, \/a1\?l=960 960w, \/a1\?l=1600 1600w"/, "WebP réduits par le CRM");
    assert.equal(boutons(html, "secondaire"), 1);
    assert.match(html, /href="\/realisations"/);
    assert.equal(choisirEtudes([publication({ id: "x" })]).mode, "simulees", "une réalisation sans photo n'est pas une étude de cas");
  });

  test("prix et durée d'une réalisation : publiés, sinon habituels selon le type de projet, rien pour un local pro", () => {
    const etude = (p: Partial<Publication>) => versEtudeReelle(publication({ id: "e", photoApres: "/a", ...p }));
    assert.equal(lignePrixDuree(etude({ prix: 2400, duree: "2 jours" })), `${euros(2400)} · 2 jours`);
    assert.equal(lignePrixDuree(etude({ prix: 2400 })), `${euros(2400)} · pose en ${DUREE_POSE_TEXTE} en général`);
    assert.equal(lignePrixDuree(etude({ typeProjet: "SDB" })), `Prix habituel : ${fourchette("sdb")} · pose en ${DUREE_POSE_TEXTE} en général`);
    assert.equal(lignePrixDuree(etude({ typeProjet: "MEUBLES" })), `Prix habituel : ${fourchette("meuble")}`, "aucune durée habituelle annoncée pour un meuble");
    for (const typeProjet of ["PRO", "AUTRE", null]) assert.equal(lignePrixDuree(etude({ typeProjet })), null, String(typeProjet));
    for (const prix of [0, -5, Number.NaN]) assert.equal(etude({ prix }).prix, null);
  });

  test("une seule carte de réalisation, pour l'accueil et /realisations", () => {
    // Mission 16 (partie 5) : `components/Realisations.tsx` est fondu dans la page /realisations.
    const realisations = lire("src/app/realisations/page.tsx");
    assert.match(realisations, /<CarteRealisation key=\{p\.id\} etude=\{versEtudeReelle\(p\)\} avecTexte tailles=\{TAILLES_CARTE\} \/>/);
    assert.ok(!/apercu|<AvantApres/.test(realisations), "l'aperçu de l'ancien accueil est parti, la carte n'est plus recopiée");
    assert.match(lire("src/components/accueil/RealisationsAccueil.tsx"), /<CarteRealisation /);
    assert.ok(!/<source type=/.test(lire("src/components/simulation/AvantApres.tsx")) && !/<source type=/.test(lire("src/components/simulation/Photo.tsx")), "un seul <picture> : ImagePreparee");
  });
});

describe("6. Comment ça marche", () => {
  test("trois étapes avec image étiquetée ; la capture du simulateur remplace l'ambiance dès qu'elle est préparée", () => {
    const sans = etapesCommentCaMarche({});
    assert.deepEqual(sans.map((e) => e.image), ["etape-photo", "piece-cuisine", "etape-pose"]);
    assert.deepEqual(sans.map((e) => e.etiquette), ["Ambiance", "Ambiance", "Ambiance"]);
    const avec = etapesCommentCaMarche({ "etape-simulation": { largeur: 1200, hauteur: 900, largeurs: [480, 960, 1200] } });
    assert.deepEqual([avec[1].image, avec[1].etiquette], ["etape-simulation", "Simulation"]);
    // L'estimation n'est promise qu'avec la capture de l'écran Résultat (partie 4) : le simulateur n'en donne pas encore.
    assert.deepEqual(sans.map((e) => e.titre), ["Vous photographiez", "Vous voyez le rendu", `Nous posons, en ${DUREE_POSE_TEXTE}`]);
    assert.ok(sans.every((e) => !/estimation|prix/i.test(`${e.titre} ${e.texte}`)));
    assert.deepEqual([avec[1].titre, avec[1].texte.includes("une estimation du prix")], ["Vous voyez le rendu et l'estimation", true]);
    // Depuis la partie 4, la capture `etape-simulation` est préparée (manifeste) : l'accueil annonce l'estimation.
    assert.ok(/estimation/i.test(rendre(createElement(CommentCaMarche, {}))), "la capture est préparée : l'accueil annonce l'estimation");
  });

  test("un bouton principal « Simuler ma cuisine », ancré pour le bouton collé", () => {
    const html = rendre(createElement(CommentCaMarche, { depuis: "accueil-etapes", idBouton: ANCRES_ACCUEIL.boutonEtapes }));
    assert.equal(compter(html, "<li"), 3);
    assert.equal(compter(html, "<picture>"), 3);
    // Images décoratives (le texte de l'étape dit tout) : leur étiquette n'est pas lue seule.
    assert.equal(compter(html, 'alt=""'), 3);
    assert.equal(compter(html, '<span aria-hidden="true" class="inline-flex'), 3);
    assert.equal(boutons(html, "principal"), 1);
    assert.match(html, /id="etapes-simuler"[^>]*><a [^>]*href="\/simulateur\?projet=cuisine&amp;depuis=accueil-etapes"/);
  });
});

describe("7. Confiance : la note Google seulement si elle existe", () => {
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
    // Liens et avatar venus du CRM : https: seulement.
    const liens = blocAvis({ note: 5, nombre: 1, avis: [{ auteur: "A", texte: "T", lienAuteur: "javascript:alert(1)", photoAuteur: "http://lh3.googleusercontent.com/a", lienAvis: "https://www.google.com/maps/reviews/1" }] });
    assert.deepEqual([liens?.avis[0].lienAuteur, liens?.avis[0].photoAuteur, liens?.avis[0].lienAvis], [null, null, "https://www.google.com/maps/reviews/1"]);
    assert.equal(lienHttps("data:text/html,x"), null);
  });

  test("sans avis : ni note ni nombre à l'écran, la zone et la garantie toujours", () => {
    const html = rendre(createElement(ContenuConfiance, { avis: null }));
    assert.ok(!/Note Google|sur 5|avis Google/.test(html));
    assert.equal(LIGNE_ZONE, "Pérols, Montpellier et l'Hérault");
    assert.ok(html.includes("Pérols, Montpellier et l&#x27;Hérault"));
    assert.match(html, /href="\/zones"/);
    assert.equal(LIGNE_GARANTIE, `${GARANTIE_ANS} ans sur la pose et le film`);
    assert.ok(html.includes(LIGNE_GARANTIE));
    assert.ok(!/<img|<svg/.test(html), "pas de logo");
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
    const html = rendre(createElement(ContenuConfiance, { avis: { note: 4.9, nombre: 1234, avis: [extrait] } }));
    assert.ok(html.includes("Note Google"));
    assert.ok(html.includes("4,9 sur 5"));
    assert.ok(html.includes(`D&#x27;après ${(1234).toLocaleString("fr-FR")} avis Google.`));
    // L'auteur crédité : son nom tel que Google le donne, en lien vers son profil, son avatar ; l'avis sur Google Maps.
    assert.match(html, /<a href="https:\/\/www\.google\.com\/maps\/contrib\/essai-1\/reviews" target="_blank" rel="noopener noreferrer"[^>]*>Camille Rousselet<\/a> · 5 sur 5 · août 2026/);
    assert.match(html, /<img src="https:\/\/lh3\.googleusercontent\.com\/a\/essai-1=s128" alt="" width="32" height="32" loading="lazy"/);
    assert.match(html, /<a href="https:\/\/www\.google\.com\/maps\/reviews\/data=essai-1" target="_blank" rel="noopener noreferrer" aria-label="Voir l&#x27;avis de Camille Rousselet sur Google Maps"[^>]*>Voir l&#x27;avis<\/a>/);
    // Bloc sans carte : la mention « Google Maps » (police, graisse, taille, gris imposés, sur une ligne) et l'ordre des avis.
    assert.match(html, /<span class="font-google text-\[14px\] font-normal whitespace-nowrap text-google">Google Maps<\/span>/);
    assert.ok(html.includes(ORDRE_AVIS.replaceAll("'", "&#x27;")));
    assert.match(lire("src/app/globals.css"), /--color-google: #5e5e5e;/);
    assert.match(lire("src/app/globals.css"), /--font-google: Roboto, sans-serif;/);
    // Sans lien ni avatar : le nom seul, sans lien.
    const nu = rendre(createElement(ContenuConfiance, { avis: { note: 4.9, nombre: 3, avis: [{ ...extrait, lienAuteur: null, photoAuteur: null, lienAvis: null }] } }));
    assert.ok(!/<img|<a href="https:\/\/www\.google/.test(nu));
    assert.ok(nu.includes(">Camille Rousselet</span> · 5 sur 5"));
    // Note sans extrait : la mention reste, pas l'ordre des avis.
    const sansExtrait = rendre(createElement(ContenuConfiance, { avis: { note: 4.9, nombre: 3, avis: [] } }));
    assert.ok(sansExtrait.includes(">Google Maps</span>") && !sansExtrait.includes("pertinents"));
  });

  test("la note ne vient que du CRM : aucune note ni nombre écrit dans l'accueil", () => {
    for (const f of ["src/components/accueil/Confiance.tsx", "src/lib/avis-google.ts", "src/app/page.tsx"]) assert.ok(!/\b[0-4][,.]\d sur 5|\b\d+ avis\b/.test(lire(f)), f);
    assert.match(lire("src/lib/avis-google.ts"), /\/api\/site\/avis-google`, \{ next: \{ revalidate: 3600 \} \}/);
  });
});

describe("8. Dernier appel", () => {
  test("la phrase de l'ouverture, le même bouton principal, WhatsApp en secondaire", () => {
    const html = rendre(createElement(DernierAppel));
    assert.ok(html.includes(`>${TITRE_ACCUEIL}</h2>`));
    assert.equal(boutons(html, "principal"), 1);
    assert.equal(boutons(html, "secondaire"), 1);
    assert.match(html, /href="\/simulateur\?projet=cuisine&amp;depuis=accueil-final"/);
    assert.match(html, /id="dernier-appel"/);
  });

  test("WhatsApp : message court prérempli sans donnée personnelle, clic compté (WHATSAPP_CLIQUE, vers le CRM seulement)", () => {
    assert.equal(MESSAGE_WHATSAPP_DEVIS, "Bonjour, je souhaite un devis pour ma cuisine.");
    assert.equal(lienWhatsApp(), "https://wa.me/33670352869?text=Bonjour%2C%20je%20souhaite%20un%20devis%20pour%20ma%20cuisine.");
    const html = rendre(createElement(BoutonWhatsApp, { depuis: "accueil-final" }));
    assert.ok(html.includes(`href="${lienWhatsApp().replaceAll("&", "&amp;")}"`));
    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="noopener noreferrer"/);
    // Mission 16 (partie 6) : plus de dataLayer (GTM retiré) ; le clic ne part qu'au CRM.
    assert.doesNotMatch(lire("src/lib/evenements-site.ts"), /dataLayer|VERS_DATALAYER|@\/lib\/analytics/);
    assert.match(lire("src/components/accueil/BoutonWhatsApp.tsx"), /envoyerEvenement\("WHATSAPP_CLIQUE", \{ depuis \}\)/);
  });
});

describe("2. Essayez sur votre photo", () => {
  test("le module m15, habillé : surtitre, titre, intro ; les cartes de pièces avec leurs photos", () => {
    const source = lire("src/components/HomeClient.tsx");
    assert.match(source, /surtitre="Sur votre photo"/);
    assert.match(source, /titre="Essayez sur votre photo"/);
    assert.match(source, /photos=\{PHOTOS_PIECES\}/);
    assert.ok(!/text-\[22px\]/.test(source), "deux tailles de titre par page : les titres du module à la taille du texte");
    assert.ok(!/uppercase|tracking-\[/.test(source), "pas de capitales à la main : la classe .surtitre");
    assert.equal(compter(source, 'className="surtitre"'), 3);
  });

  test("la FAQ n'est plus sur l'accueil, et le dit", () => {
    assert.ok(!/page d'accueil/.test(lire("src/data/faq.ts")));
    assert.match(lire("src/data/faq.ts"), /Servies sur \/comment-ca-marche \(#faq\)/);
  });
});
