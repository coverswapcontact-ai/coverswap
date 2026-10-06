import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { classesBouton } from "@/components/simulation/Bouton";
import { PRESTATIONS } from "@/data/prestations";
import revetements from "@/data/revetements.json";
import { TEXTES_FAMILLES, TITRES_SECTIONS } from "@/data/textes-familles";
import { inspirations, type AmbianceResolue } from "@/lib/ambiances";
import { cheminFamille } from "@/lib/familles-matieres";
import { vueDans } from "@/lib/indexation-matieres";
import type { Matiere } from "@/lib/matieres";
import { lienMatiere } from "@/lib/matieres-vedettes";
import { SLUGS_FAMILLES, ambiancesDeFamille, compterMots, degradeDeTeintes, estSlugFamille, nuancierDeFamille, vedettesDeFamille } from "@/lib/pages-familles";
import { lireDepuis } from "@/lib/simulateur/entonnoir";
import { trierParTeinte } from "@/lib/teintes";
import PageFamille, { DEPUIS_FAMILLE, LISTE_DEPLIEE_JUSQUA, dynamicParams, generateMetadata, generateStaticParams, lienVisiteFamille } from "./[famille]/page";

/**
 * Site 3.0, lot D3 — `/matieres/<famille>` : sept pages statiques (slugs stables, 404 pour le reste), un vrai texte
 * de 300 mots au moins (ce que c'est, où ça se pose, l'entretien, les limites), la bande de toutes ses teintes, trois
 * ambiances où on la voit (section omise sans ambiance), ses vedettes, la liste de toutes ses références, le fil
 * d'Ariane visible et balisé, les métadonnées (titre ≤ 60, description ≤ 155), une action principale (le simulateur,
 * `depuis=matiere-famille`) et « Les voir en vrai chez moi ». Aucune requête réseau : la page est statique.
 */
const CATALOGUE = revetements as Matiere[];
const SITE = "https://coverswap.fr";
/** Les sept adresses, écrites en dur (elles ne doivent jamais changer : D4 et le plan du site s'appuient dessus). */
const SLUGS = ["bois", "couleur", "textile", "pierre", "metal", "beton", "paillettes"];
const COMPTES: Record<string, number> = { bois: 267, couleur: 89, textile: 41, pierre: 36, metal: 31, beton: 17, paillettes: 16 };
const SANS_AMBIANCE = ["textile", "metal", "paillettes"];

/** L'espace insécable (code 160) que pose `insecables`, écrit par son code. */
const INSECABLE = String.fromCharCode(160);
const texteHtml = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").split(INSECABLE).join(" ");
const sansBalises = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ");
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;
const params = (famille: string) => ({ params: Promise.resolve({ famille }) });

async function rendre(famille: string): Promise<string> {
  return texteHtml(renderToStaticMarkup(await PageFamille(params(famille))));
}

/** Le contenu d'un élément à partir de son ouverture (`<section id="x"`), jusqu'à sa fermeture du même niveau. */
function bloc(html: string, ouverture: string, balise = "section"): string {
  const debut = html.indexOf(ouverture);
  if (debut < 0) return "";
  let profondeur = 0;
  const motif = new RegExp(`<(/?)${balise}\\b`, "g");
  motif.lastIndex = debut;
  for (let m = motif.exec(html); m; m = motif.exec(html)) {
    profondeur += m[1] ? -1 : 1;
    if (profondeur === 0) return html.slice(debut, m.index);
  }
  return html.slice(debut);
}

const balisage = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as Record<string, unknown>);

describe("/matieres/<famille> : les adresses", () => {
  test("sept pages statiques, aux slugs stables (les identifiants de famille), rien d'autre", () => {
    assert.deepEqual([...SLUGS_FAMILLES], SLUGS);
    assert.deepEqual(generateStaticParams(), SLUGS.map((famille) => ({ famille })));
    assert.equal(dynamicParams, false, "toute autre adresse est un 404");
    for (const s of SLUGS) assert.equal(cheminFamille(s), `/matieres/${s}`);
    for (const s of SLUGS) assert.equal(CATALOGUE.filter((m) => m.famille === s).length, COMPTES[s], s);
    assert.ok(!estSlugFamille("Bois") && !estSlugFamille("bois-clair") && !estSlugFamille("tout"));
  });

  test("404 : une famille inconnue, une casse différente, « tout » ; aucune métadonnée", async () => {
    for (const inconnue of ["inconnue", "Bois", "tout", "favoris", "bois-clair", ""]) {
      await assert.rejects(PageFamille(params(inconnue)), (e: { digest?: string }) => e.digest === "NEXT_HTTP_ERROR_FALLBACK;404", inconnue);
      assert.deepEqual(await generateMetadata(params(inconnue)), {}, inconnue);
    }
  });
});

describe("/matieres/<famille> : les textes", () => {
  test("un texte par famille, quatre parties (ce que c'est, où ça se pose, l'entretien, les limites), 300 mots au moins", () => {
    assert.deepEqual(Object.keys(TEXTES_FAMILLES).sort(), [...SLUGS].sort());
    for (const s of SLUGS) {
      const t = TEXTES_FAMILLES[s];
      assert.deepEqual(t.sections.map((x) => x.titre), [...TITRES_SECTIONS], s);
      for (const x of t.sections) assert.ok(x.paragraphes.length >= 1 && x.paragraphes.every((p) => compterMots(p) >= 15), `${s} : ${x.titre}`);
      const mots = compterMots([t.accroche, ...t.sections.flatMap((x) => [x.titre, ...x.paragraphes])].join(" "));
      assert.ok(mots >= 300, `${s} : ${mots} mots`);
    }
  });

  test("le compte de la famille, juste ; aucun montant, aucune promesse chiffrée ; « on », « nous »", () => {
    for (const s of SLUGS) {
      const t = TEXTES_FAMILLES[s];
      const tout = [t.titreSeo, t.descriptionSeo, t.accroche, ...t.sections.flatMap((x) => x.paragraphes)].join(" ");
      assert.ok(t.accroche.includes(String(COMPTES[s])) && t.titreSeo.includes(String(COMPTES[s])), `${s} : ${COMPTES[s]}`);
      // Les seuls nombres : le compte de la famille, et la cuisine « des années 2000 » (les autres sont écrits en lettres).
      for (const n of tout.match(/\d+/g) ?? []) assert.ok([String(COMPTES[s]), "2000"].includes(n), `${s} : « ${n} »`);
      assert.doesNotMatch(tout, /€|%|°|\bans\b|\bnorme|\bclass[ée]|\bgaranti|\bimperméable\b|\bignifug|\bM1\b/i, s);
      assert.match(tout, /(^|[^\p{L}])[Oo]n \p{L}/u, `${s} : la première personne du pluriel`);
      assert.doesNotMatch(tout, /\b(Simulation|Réalisation)\b/, `${s} : ces étiquettes ont un sens réservé`);
      assert.doesNotMatch(tout, /\\u[0-9a-f]{4}/i);
    }
  });

  test("titre ≤ 60 caractères (« | CoverSwap » compris), description ≤ 155, tous distincts", async () => {
    const titres = new Set<string>();
    for (const s of SLUGS) {
      const t = TEXTES_FAMILLES[s];
      assert.ok(t.titreSeo.length <= 60 && t.titreSeo.endsWith(" | CoverSwap"), `${t.titreSeo} (${t.titreSeo.length})`);
      assert.ok(t.descriptionSeo.length <= 155, `${s} : ${t.descriptionSeo.length}`);
      titres.add(t.titreSeo);
      const meta = await generateMetadata(params(s));
      assert.deepEqual(meta.title, { absolute: t.titreSeo });
      assert.equal(meta.description, t.descriptionSeo, "la description tient : rien n'est coupé");
      assert.equal(meta.alternates?.canonical, `${SITE}/matieres/${s}`);
      assert.equal(meta.openGraph?.url, `${SITE}/matieres/${s}`);
    }
    assert.equal(titres.size, SLUGS.length);
  });
});

describe("/matieres/<famille> : la page rendue", () => {
  for (const s of SLUGS) {
    test(`${s} : titre, texte, fil d'Ariane, bande, ambiances, vedettes, références, action`, async () => {
      const html = await rendre(s);
      const t = TEXTES_FAMILLES[s];
      const nuancier = nuancierDeFamille(s);

      // Le titre et le texte entier, rendus (300 mots au moins dans la page).
      assert.equal(compter(html, "<h1 "), 1);
      assert.ok(html.includes(`>${t.titre}</h1>`), "h1");
      const article = bloc(html, '<article id="texte-famille"', "article");
      for (const x of t.sections) for (const p of x.paragraphes) assert.ok(article.includes(p), `${s} : ${p.slice(0, 30)}`);
      assert.ok(compterMots(sansBalises(article)) >= 300, `${s} : ${compterMots(sansBalises(article))} mots rendus`);

      // Le fil d'Ariane : visible et balisé.
      const fil = bloc(html, '<nav aria-label="Fil d\'Ariane"', "nav");
      assert.ok(fil.includes('href="/"') && fil.includes('href="/matieres"') && fil.includes(`aria-current="page">${t.titre}</span>`), "fil visible");
      const liste = balisage(html).find((b) => b["@type"] === "BreadcrumbList") as { itemListElement: { position: number; name: string; item: string }[] } | undefined;
      assert.ok(liste, "BreadcrumbList");
      assert.deepEqual(
        liste.itemListElement.map((e) => [e.position, e.name, e.item]),
        [
          [1, "Accueil", SITE],
          [2, "Matières", `${SITE}/matieres`],
          [3, t.titre, `${SITE}/matieres/${s}`],
        ],
      );

      // La bande de toutes ses teintes, rangées comme au présentoir.
      assert.ok(html.includes(`data-bande-teintes="${COMPTES[s]}"`));
      assert.ok(html.includes(degradeDeTeintes(nuancier.map((m) => m.hex)).slice(0, 60)), "le dégradé du nuancier");

      // Une action principale (le simulateur, en haut et au dernier appel), « Les voir en vrai chez moi » à côté.
      const principaux = [...html.matchAll(new RegExp(`<a class="${classesBouton("principal").replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}[^"]*" href="([^"]*)"[^>]*>([^<]*)</a>`, "g"))].map((m) => [m[1], m[2]]);
      assert.deepEqual(principaux, [
        [`/simulateur?depuis=${DEPUIS_FAMILLE}`, t.essayer],
        [`/simulateur?depuis=${DEPUIS_FAMILLE}`, t.essayer],
      ]);
      assert.equal(compter(html, `href="${lienVisiteFamille(s)}"`), 2);
      assert.ok(html.includes(">Les voir en vrai chez moi</a>"));

      // Trois ambiances où on la voit, étiquetées ; aucune : pas de section.
      const ambiances = bloc(html, '<section id="ambiances"');
      if (SANS_AMBIANCE.includes(s)) assert.equal(ambiances, "", `${s} : section omise`);
      else {
        const attendues = ambiancesDeFamille(s);
        assert.equal(compter(ambiances, '<li class="filet flex flex-col pt-4">'), Math.min(3, attendues.length));
        assert.ok(ambiances.includes(">Ambiance</span>"), "l'étiquette d'honnêteté");
        assert.ok(!/>(Simulation|Réalisation)</.test(ambiances));
        assert.ok(ambiances.includes(`depuis=${DEPUIS_FAMILLE}`), "« Essayer cette composition chez moi » dit d'où il vient");
      }

      // Ses vedettes, en échantillons, vers leur matière.
      const vedettes = bloc(html, '<section id="vedettes"');
      const { matieres } = vedettesDeFamille(s);
      for (const m of matieres) assert.ok(vedettes.includes(`href="${lienMatiere(m.id)}"`), `vedette ${m.id}`);
      assert.equal(compter(vedettes, "/api/site/echantillons/"), matieres.length);

      // Toutes ses références, dans l'ordre du nuancier, chacune vers sa matière ; repliées au-delà de 41.
      const references = bloc(html, '<section id="references"');
      assert.ok(references.includes(`data-references="${COMPTES[s]}"`));
      let precedent = -1;
      for (const m of nuancier) {
        const ici = references.indexOf(`href="${lienMatiere(m.id)}"`);
        assert.ok(ici > precedent, `${m.id} à sa place`);
        precedent = ici;
      }
      assert.equal(references.includes("<details"), COMPTES[s] > LISTE_DEPLIEE_JUSQUA, "repliée seulement pour les grandes familles");
    });
  }

  test("les liens mènent tous à une page qui existe", async () => {
    const prestations = new Set(PRESTATIONS.map((p) => `/prestations/${p.slug}`));
    const ambiances = new Set(inspirations().map((a) => a.id));
    for (const s of SLUGS) {
      const html = await rendre(s);
      const liens = [...html.matchAll(/<a [^>]*href="([^"]*)"/g)].map((m) => m[1]);
      assert.ok(liens.length > COMPTES[s]);
      for (const l of liens) {
        // Site 3.0, lot D4 : les références mènent à leur fiche, sous leur famille.
        const [, familleRef, ref] = l.match(/^\/matieres\/([a-z]+)\/([A-Z0-9]+)$/) ?? [];
        const famille = l.match(/^\/matieres\/([a-z]+)$/)?.[1];
        const ancre = l.match(/^\/inspirations#(.+)$/)?.[1];
        const ok =
          ["/", "/matieres", "/pro"].includes(l) ||
          prestations.has(l) ||
          (ref !== undefined && CATALOGUE.some((m) => m.id === ref && m.famille === familleRef)) ||
          (famille !== undefined && SLUGS.includes(famille) && famille !== s) ||
          (ancre !== undefined && ambiances.has(ancre)) ||
          l === lienVisiteFamille(s) ||
          /^\/simulateur\?(projet=[a-z-]+&ref=[^"&]+&)?depuis=matiere-famille$/.test(l);
        assert.ok(ok, `${s} : ${l}`);
      }
      // Les six autres familles, et les pages de prestation où elle se pose.
      for (const autre of SLUGS.filter((x) => x !== s)) assert.ok(liens.includes(`/matieres/${autre}`), `${s} → ${autre}`);
    }
    assert.equal(lireDepuis(DEPUIS_FAMILLE), DEPUIS_FAMILLE, "une valeur `depuis` valide (docs/SUIVI.md)");
  });

  test("aucune image prioritaire, aucune donnée du CRM : la page est statique", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/matieres/[famille]/page.tsx"), "utf8");
    assert.doesNotMatch(source, /priorite|fetchPriority|preload\(|charger(Publications|Tarifs)|revalidate/);
  });
});

describe("/matieres/<famille> : les règles", () => {
  test("le nuancier de la famille : toutes ses matières, rangées par teinte", () => {
    for (const s of SLUGS) {
      const n = nuancierDeFamille(s);
      assert.equal(n.length, COMPTES[s]);
      assert.deepEqual(n, trierParTeinte(CATALOGUE.filter((m) => m.famille === s)));
    }
  });

  test("la bande : une bande égale par teinte, à arrêts francs", () => {
    assert.equal(degradeDeTeintes([]), "none");
    assert.equal(degradeDeTeintes(["#abcdef"]), "#ABCDEF");
    assert.equal(degradeDeTeintes(["#000000", "#ffffff"]), "linear-gradient(90deg, #000000 0% 50%, #FFFFFF 50% 100%)");
    assert.equal(degradeDeTeintes(["#111111", "#222222", "#333333"]), "linear-gradient(90deg, #111111 0% 33.333%, #222222 33.333% 66.667%, #333333 66.667% 100%)");
  });

  test("trois ambiances : la plus grande part de la famille d'abord, une pièce chacune tant que possible ; aucune sans ambiance", () => {
    for (const s of SANS_AMBIANCE) assert.deepEqual(ambiancesDeFamille(s), []);
    const vues = vueDans();
    for (const s of SLUGS.filter((x) => !SANS_AMBIANCE.includes(x))) {
      const a = ambiancesDeFamille(s);
      assert.ok(a.length >= 1 && a.length <= 3, s);
      assert.equal(new Set(a.map((x) => x.id)).size, a.length);
      for (const x of a) assert.ok(x.inspiration && x.surfaces.some((m) => m.famille === s && vues[m.ref]?.some((v) => v.id === x.id)), `${s} : ${x.id}`);
    }
    for (const s of ["bois", "couleur", "pierre"]) assert.equal(new Set(ambiancesDeFamille(s).map((x) => x.piece)).size, 3, `${s} : trois pièces`);
    // Les bétons ne sont que dans deux ambiances : deux.
    assert.equal(ambiancesDeFamille("beton").length, 2);
    // La règle sur une liste connue.
    const amb = (id: string, piece: string, ...familles: string[]) => ({ id, piece, inspiration: true, surfaces: familles.map((famille) => ({ famille })) }) as unknown as AmbianceResolue;
    const liste = [amb("a", "cuisine", "bois", "couleur"), amb("b", "cuisine", "bois"), amb("c", "meubles", "bois", "pierre", "pierre"), amb("d", "salle-de-bain", "couleur"), amb("e", "cuisine", "bois", "bois", "couleur")];
    // Parts du bois : b 1, e 2/3, a 1/2, c 1/3, d 0. Une pièce chacune d'abord (b cuisine, c meubles), puis les mieux placées.
    assert.deepEqual(ambiancesDeFamille("bois", 3, liste).map((x) => x.id), ["b", "c", "e"], "part décroissante, une pièce chacune d'abord");
    assert.deepEqual(ambiancesDeFamille("bois", 5, liste).map((x) => x.id), ["b", "c", "e", "a"], "d n'a pas de bois");
  });

  test("les vedettes : celles du site, puis les plus vues ; huit au plus ; complétées à quatre par le nuancier", () => {
    const couleur = vedettesDeFamille("couleur");
    assert.equal(couleur.matieres.length, 8);
    assert.equal(couleur.completees, 0);
    assert.deepEqual(couleur.matieres.slice(0, 3).map((m) => m.id), ["K1", "J3", "RM20"], "les vedettes de l'accueil d'abord");
    const bois = vedettesDeFamille("bois");
    assert.deepEqual(bois.matieres.slice(0, 2).map((m) => m.id), ["NF27", "D1"]);
    assert.equal(bois.completees, 0);
    for (const s of ["textile", "paillettes"]) {
      const v = vedettesDeFamille(s);
      assert.equal(v.matieres.length, 4);
      assert.equal(v.completees, 4, `${s} : aucune vedette, quatre teintes du nuancier`);
      assert.equal(new Set(v.matieres.map((m) => m.id)).size, 4);
    }
    const metal = vedettesDeFamille("metal");
    assert.equal(metal.matieres[0].id, "Q1");
    assert.equal(metal.completees, 3);
    const beton = vedettesDeFamille("beton");
    assert.deepEqual(beton.matieres.slice(0, 2).map((m) => m.id).sort(), ["NE24", "NH12"]);
    assert.equal(beton.completees, 2);
    for (const s of SLUGS) for (const m of vedettesDeFamille(s).matieres) assert.equal(m.famille, s);
  });

  test("le compte des mots", () => {
    assert.equal(compterMots("On pose l'entretien, c'est tout : 267 références."), 7, "l'apostrophe ne coupe pas le mot");
    assert.equal(compterMots(""), 0);
  });

  test("/matieres mène à ses sept familles ; un tiroir ouvert mène à la sienne", () => {
    const presentoir = readFileSync(path.join(process.cwd(), "src/app/matieres/_components/Matieres.tsx"), "utf8");
    assert.match(presentoir, /tiroirs\.find\(\(t\) => t\.id === filtre && t\.id !== "tout"\)/);
    assert.match(presentoir, /<Link href=\{cheminFamille\(tiroirOuvert\.id\)\}[^>]*>\s*Tout savoir sur les \{tiroirOuvert\.libelle\.toLowerCase\(\)\}/);
  });
});
