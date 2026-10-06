import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TEINTE_PRINCIPALE } from "@/components/simulation/Bouton";
import { PAIRES_SERIE_2 } from "@/data/ambiances";
import { exemplesSimulateur, fichierPleineTaille } from "@/lib/exemples-simulateur";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { corpsDemandeSimulation, messageDemande } from "@/lib/simulateur/demande";
import { getProject } from "@/lib/simulateur/projets";
import type { RenduSimulateur } from "@/lib/simulateur/reprise";
import { ZONES_REPLI } from "@/lib/simulateur/zones";
import { EcranPhoto } from "./EcranPhoto";
import EcranResultat, { etiquetteDuRendu } from "./EcranResultat";
import { ExemplesPhoto } from "./ExemplesPhoto";

/**
 * Site 3.0, lot E3 : « Pas de photo sous la main ? ». Les 18 avants de la série 2 et leurs deux après, montrés tout
 * de suite à l'écran Photo SANS appel (ni CRM, ni analyse, ni événement) ; « Essayer d'autres matières sur cette
 * pièce » fait de l'avant une photo du parcours (chemin d'une photo de visiteur, PHOTO_CHARGEE `{ exemple }`). Ces
 * images sont générées : « Ambiance », jamais « Simulation ». Aucun réseau dans ces tests.
 */
const RACINE = process.cwd();
const lire = (f: string) => readFileSync(path.join(RACINE, "src", f), "utf8");
const texte = (html: string) => html.replace(/&#x27;|&apos;/g, "'");
const EXEMPLES = exemplesSimulateur();
const rien = () => undefined;
const grille = (projet: string) => texte(renderToStaticMarkup(createElement(ExemplesPhoto, { exemples: EXEMPLES, projet, occupe: false, charge: null, erreur: null, onEssayer: rien })));
const detail = (id: string) => texte(renderToStaticMarkup(createElement(ExemplesPhoto, { exemples: EXEMPLES, projet: "cuisine", occupe: false, charge: null, erreur: null, onEssayer: rien, initial: id })));
const principaux = (html: string) => [...html.matchAll(/class="([^"]*)"/g)].filter(([, classes]) => classes.includes(TEINTE_PRINCIPALE)).length;

describe("lot E3 : les pièces d'exemple", () => {
  test("18 avants × 2 après : cuisine 11, salle de bain 3, meubles 3, pro 1, murs 0 ; un aspect et une forme écrits pour chacun", () => {
    assert.equal(EXEMPLES.length, 18);
    assert.equal(PAIRES_SERIE_2.length, 18);
    const parPiece = (piece: string) => EXEMPLES.filter((e) => e.piece === piece).length;
    assert.deepEqual(["cuisine", "salle-de-bain", "meubles", "professionnel", "mur-plafond"].map(parPiece), [11, 3, 3, 1, 0]);
    assert.equal(new Set(EXEMPLES.map((e) => e.id)).size, 18);
    for (const e of EXEMPLES) {
      assert.match(e.id, /^[a-z0-9-]+$/);
      assert.ok(!e.id.endsWith("-avant"), e.id);
      assert.ok(e.aspect.length >= 3 && e.forme.length >= 5, e.id);
      assert.equal(e.versions.length, 2, e.id);
      assert.notEqual(e.versions[0].id, e.versions[1].id);
      assert.match(e.altAvant, /Image d'ambiance\.$/);
      assert.match(e.ratio, /^\d+ \/ \d+$/);
      for (const v of e.versions) {
        assert.ok(v.sources.avif.includes(`/images/prep/`), v.id);
        assert.match(v.alt, /Image d'ambiance/);
        assert.ok(v.matieres.length >= 1, v.id);
      }
    }
    // Les aspects demandés par l'énoncé sont là.
    for (const aspect of ["Hêtre", "Blanc jauni", "Bordeaux brillant", "Merisier"]) assert.ok(EXEMPLES.some((e) => e.aspect === aspect), aspect);
    // Deux exemples d'une même pièce ne se confondent pas.
    for (const piece of ["cuisine", "salle-de-bain", "meubles"]) {
      const libelles = EXEMPLES.filter((e) => e.piece === piece).map((e) => `${e.aspect} · ${e.forme}`);
      assert.equal(new Set(libelles).size, libelles.length, piece);
    }
  });

  test("seulement les pièces que le simulateur publie", () => {
    assert.equal(exemplesSimulateur({ pieces: ["cuisine"] }).length, 11);
    assert.equal(exemplesSimulateur({ pieces: ZONES_REPLI.pieces.map((p) => p.id) }).length, 18);
    assert.equal(exemplesSimulateur({ pieces: ["mur-plafond"] }).length, 0);
    assert.match(lire("app/simulateur/page.tsx"), /exemplesSimulateur\(\{ pieces: zones\.pieces\.map\(\(p\) => p\.id\) \}\)/);
    assert.match(lire("app/simulateur/page.tsx"), /<Simulateur zones=\{zones\} tarifs=\{tarifs\} exemples=\{exemples\} \/>/);
  });

  test("l'avant en pleine taille : la plus grande largeur du manifeste (1536 en paysage, 1024 en portrait), versionnée, présente sur le disque", () => {
    assert.equal(fichierPleineTaille("cuisine-bordeaux-brillante-avant"), `/images/prep/cuisine-bordeaux-brillante-avant-1536.jpg?v=${MANIFESTE_IMAGES["cuisine-bordeaux-brillante-avant"].empreinte}`);
    assert.equal(fichierPleineTaille("cuisine-couloir-avant"), `/images/prep/cuisine-couloir-avant-1024.jpg?v=${MANIFESTE_IMAGES["cuisine-couloir-avant"].empreinte}`);
    assert.equal(fichierPleineTaille("x", { x: { largeur: 2400, hauteur: 1600, largeurs: [960, 2000, 480] } }), "/images/prep/x-2000.jpg", "prise au manifeste, jamais supposée");
    assert.equal(fichierPleineTaille("inconnue"), null);
    for (const e of EXEMPLES) {
      const fichier = e.fichier.replace(/\?v=.*$/, "");
      assert.ok(existsSync(path.join(RACINE, "public", fichier)), fichier);
      assert.ok(!/-1600\.jpg/.test(e.fichier), e.fichier);
    }
  });

  test("les matières : cartels du catalogue et liens vers leurs fiches", () => {
    for (const e of EXEMPLES)
      for (const v of e.versions)
        for (const m of v.matieres) {
          assert.equal(m.lien, `/matieres/${m.matiere.famille}/${m.matiere.id}`, `${v.id} ${m.matiere.id}`);
          assert.ok(m.matiere.nom && m.surfaces, v.id);
        }
  });
});

describe("lot E3 : l'écran Photo et ses exemples", () => {
  test("la grille : les vignettes de la pièce choisie, étiquetées « Ambiance », aucun bouton principal, rien de « Simulation »", () => {
    const html = grille("cuisine");
    assert.match(html, /Pas de photo sous la main \?/);
    assert.match(html, /id="exemples"/);
    assert.equal((html.match(/>Ambiance<\/span>/g) ?? []).length, 11);
    assert.match(html, /aria-pressed="true"[^>]*>Cuisine /);
    assert.equal((html.match(/aria-pressed="/g) ?? []).length, 4, "cuisine, salle de bain, meubles, pro (pas les murs)");
    for (const aspect of ["Bordeaux brillant", "Hêtre", "Merisier", "Blanc jauni"]) assert.ok(html.includes(`>${aspect}</span>`), aspect);
    assert.doesNotMatch(html, /Simulation/);
    assert.equal(principaux(html), 0);
    assert.match(html, /<img [^>]*alt=""[^>]*loading="lazy"/);
    assert.equal((grille("salle-de-bain").match(/>Ambiance<\/span>/g) ?? []).length, 3);
    assert.equal((grille("mur-plafond").match(/>Ambiance<\/span>/g) ?? []).length, 11, "pas d'exemple de murs : la cuisine d'abord");
    assert.equal(renderToStaticMarkup(createElement(ExemplesPhoto, { exemples: [], projet: "cuisine", occupe: false, charge: null, erreur: null, onEssayer: rien })), "");
  });

  test("un exemple choisi : ses deux après tout de suite, curseur « Ambiance · avant / après », Version 1 / Version 2, cartels vers les fiches, « Essayer d'autres matières sur cette pièce » en secondaire", () => {
    const e = EXEMPLES.find((x) => x.id === "cuisine-bordeaux-brillante")!;
    const html = detail(e.id);
    assert.match(html, /Bordeaux brillant · Cuisine en L/);
    assert.match(html, /aria-pressed="true"[^>]*>Version 1</);
    assert.match(html, /aria-pressed="false"[^>]*>Version 2</);
    assert.match(html, />Ambiance · avant \/ après</);
    assert.match(html, /role="slider"/);
    assert.ok(html.includes(e.avant.src.replace(/&/g, "&amp;")), "l'avant");
    assert.ok(html.includes(e.versions[0].sources.src.replace(/&/g, "&amp;")), "le premier après");
    for (const m of e.versions[0].matieres) assert.ok(html.includes(`href="${m.lien}"`), m.lien);
    assert.match(html, />Essayer d'autres matières sur cette pièce<\/button>/);
    assert.match(html, /Voir les autres pièces/);
    assert.doesNotMatch(html, /Simulation/);
    assert.equal(principaux(html), 0, "le principal de l'écran reste « Prendre une photo »");
  });

  test("choisir un exemple ne part nulle part : ni fetch, ni beacon, ni photo du parcours, ni analyse, ni événement ; le seul fetch est celui de « Essayer… », vers l'image du site", () => {
    const composant = lire("app/simulateur/_components/ExemplesPhoto.tsx");
    for (const motif of [/fetch\(/, /sendBeacon/, /etat\.photo/, /useAnalyse|demanderAnalyse/, /envoyerEvenement|marquer\(/, /generation-client/]) assert.doesNotMatch(composant, motif, String(motif));
    assert.match(composant, /import type \{ ExempleSimulateur \} from "@\/lib\/exemples-simulateur";/, "le catalogue ne part pas dans le navigateur");
    const hook = lire("app/simulateur/_components/useExemple.ts");
    assert.equal((hook.match(/fetch\(/g) ?? []).length, 1);
    assert.match(hook, /await fetch\(exemple\.fichier\)/);
    assert.match(hook, /onFichier\(fichierExemple\(await reponse\.blob\(\), exemple\.id\), \{ id: exemple\.id, piece: exemple\.piece \}\)/);
    assert.match(hook, /import type \{ ExempleSimulateur \} from "@\/lib\/exemples-simulateur";/);
    for (const e of EXEMPLES) assert.match(e.fichier, /^\/images\/prep\//, "une image du site, jamais le CRM");
  });

  test("l'écran Photo : les exemples sous les conseils, un lien vers eux, toujours un seul principal", () => {
    const props = { projet: getProject("cuisine"), photo: null, rapport: null, occupe: false, onFichier: rien, onGarder: rien };
    const html = texte(renderToStaticMarkup(createElement(EcranPhoto, { ...props, exemples: EXEMPLES })));
    assert.match(html, /href="#exemples"[^>]*>Pas de photo sous la main \? Prenez une pièce d'exemple<\/a>/);
    assert.ok(html.indexOf("Trois conseils pour la photo") < html.indexOf('id="exemples"'));
    assert.equal(principaux(html), 1);
    const sans = renderToStaticMarkup(createElement(EcranPhoto, props));
    assert.doesNotMatch(sans, /exemples/);
  });

  test("le simulateur : la pièce d'exemple suit le chemin d'une photo, PHOTO_CHARGEE porte `exemple`, la pièce de l'exemple est prise avec elle", () => {
    const s = lire("app/simulateur/_components/Simulateur.tsx");
    assert.match(s, /const choisirPhoto = async \(file: File, exemple\?: ExempleCharge\) => \{/);
    assert.match(s, /const prete = await preparerPhoto\(file\);/, "même préparation");
    assert.match(s, /marquer\("PHOTO_CHARGEE", \{ projet: exemple\?\.piece \?\? etat\.projet, poids_ko: poidsKo, largeur, \.\.\.\(exemple \? \{ exemple: exemple\.id \} : \{\}\) \}\)/);
    assert.match(s, /exemple: exemple\?\.id \?\? null, \.\.\.\(autrePiece \? \{ projet: exemple\.piece, selections: \{\} \} : \{\}\)/);
    assert.match(s, /onFichier=\{\(f, exemple\) => void choisirPhoto\(f, exemple\)\}/);
    // La génération reste celle d'une photo de visiteur : Turnstile et le même appel au CRM (limite-abus.ts, quotas côté route).
    assert.match(s, /turnstileToken: jetonCaptcha,/);
    assert.equal((s.match(/lancerGeneration\(/g) ?? []).length, 1);
  });
});

describe("lot E3 : le résultat sur une pièce d'exemple", () => {
  const RENDU: RenduSimulateur = { travailId: "cmun000000000001", simulationSiteId: null, urlApres: "https://crm.coverswap.fr/api/simulate/image?id=1", urlAvant: null, references: [{ zone: "facades-cuisine", libelle: "Façades", ref: "NF13", nom: "Deep Green" }], le: 1 };
  const rendre = (rendu: RenduSimulateur) => texte(renderToStaticMarkup(createElement(EcranResultat, { rendu, rendus: [rendu], photo: "data:image/jpeg;base64,AAAA", titre: "Votre cuisine", fondu: false, onFonduFini: rien, onChoisirRendu: rien, onAutresMatieres: rien })));

  test("« Ambiance · avant / après », jamais « Simulation » ; la photo du visiteur garde « Simulation »", () => {
    assert.equal(etiquetteDuRendu({ exemple: "cuisine-merisier" }), "Ambiance · avant / après");
    assert.equal(etiquetteDuRendu({}), "Simulation");
    assert.equal(etiquetteDuRendu({ exemple: null }), "Simulation");
    const exemple = rendre({ ...RENDU, exemple: "cuisine-merisier" });
    assert.match(exemple, />Ambiance · avant \/ après</);
    assert.doesNotMatch(exemple, /Simulation/);
    assert.match(exemple, /Image d'ambiance : une pièce d'exemple/);
    const visiteur = rendre(RENDU);
    assert.match(visiteur, />Simulation</);
    assert.doesNotMatch(visiteur, /Ambiance/);
  });

  test("la demande le dit : « Simulation sur une pièce d'exemple : <nom> » dans le message ; rien sur la photo du visiteur", () => {
    assert.equal(messageDemande({ exemple: "cuisine-merisier" }), "Simulation sur une pièce d'exemple : cuisine-merisier");
    assert.equal(messageDemande({}), "");
    const base = { formulaire: { name: "Aline", phone: "0611000001", email: "", ville: "Lattes", codePostal: "34970" }, connus: { ville: null, codePostal: null }, projet: "cuisine", parcoursId: null, simulationIds: [], references: [], echec: null, jetonCaptcha: null, acquisition: {}, consentement: {}, page: "/simulateur" };
    assert.equal(corpsDemandeSimulation({ ...base, exemple: "cuisine-merisier" }).message, "Simulation sur une pièce d'exemple : cuisine-merisier");
    assert.ok(!("message" in corpsDemandeSimulation(base)));
    assert.match(lire("app/simulateur/_components/Simulateur.tsx"), /exemple: depuisEchec \? etat\.exemple : rendu\?\.exemple,/);
    assert.match(lire("app/api/simulation/contact/route.ts"), /message: typeof body\.message === "string"/, "la route transmet le message au CRM");
  });
});
