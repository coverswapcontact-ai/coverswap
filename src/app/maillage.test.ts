import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CAS_PRESTATIONS } from "@/data/cas-prestations";
import { lienPrestation, prestationDeLaPiece } from "@/data/prestations";
import { ZONES, getZoneSlug } from "@/data/zones";
import { ambiances, lienInspiration, vueDans } from "@/lib/ambiances";
import { cheminFamille } from "@/lib/familles-matieres";
import { parametresDesFiches } from "@/lib/fiches-matieres";
import { prestationsDeFamille } from "@/lib/indexation-matieres";
import { lienMatiere } from "@/lib/matieres-vedettes";
import type { Publication } from "@/lib/publications";

/**
 * Site 3.0, lot F5 (énoncé, phase F, « Maillage ») : les liens, vérifiés sur les pages RENDUES (pas sur les données) —
 *  - toute ambiance → ses matières (leur fiche) et sa prestation (sauf sur la page de cette prestation) ;
 *  - toute matière (les 497 fiches, celles sans ambiance comprises) → ses ambiances, sa famille, ses prestations ;
 *  - toute prestation (cuisine, salle de bain, meubles, `/pro` ; vitrages n'a pas d'avant / après) → trois avant /
 *    après au moins, ses matières vedettes, ses villes ;
 *  - toute ville → ses prestations et ses réalisations (celles publiées dans la ville, et `/realisations`).
 * Le CRM est simulé (`fetch` remplacé) : aucune requête réseau.
 */

const ROUTEUR = { back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, prefetch() {} };
let publications: Partial<Publication>[] = [];
const fetchOrigine = globalThis.fetch;
before(() => {
  globalThis.fetch = (async (url: string | URL) => (String(url).endsWith("/api/site/publications") ? new Response(JSON.stringify({ publications }), { status: 200 }) : new Response("{}", { status: 404 }))) as typeof fetch;
});
after(() => {
  globalThis.fetch = fetchOrigine;
});

async function rendre(module: string, props?: Record<string, unknown>): Promise<string> {
  const { default: Page } = (await import(module)) as { default: (p?: Record<string, unknown>) => unknown };
  const flux = await renderToReadableStream(createElement(AppRouterContext.Provider, { value: ROUTEUR as never }, (await Page(props)) as never));
  await flux.allReady;
  return (await new Response(flux).text()).replace(/&amp;/g, "&").replace(/&#x27;/g, "'");
}
const parametres = (cle: string, valeur: string) => ({ params: Promise.resolve({ [cle]: valeur }) });

/** Les adresses des liens d'un morceau de page. */
const liens = (html: string) => new Set([...html.matchAll(/<a [^>]*href="([^"]*)"/g)].map((m) => m[1]));
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;

/** Les cartes d'ambiance d'une page : de chaque titre `data-ambiance` au suivant (ou à la fin de sa section). */
function cartes(html: string): { id: string; bloc: string }[] {
  const titres = [...html.matchAll(/data-ambiance="([^"]+)"/g)];
  return titres.map((m, i) => {
    const fin = Math.min(titres[i + 1]?.index ?? html.length, html.indexOf("</section>", m.index) === -1 ? html.length : html.indexOf("</section>", m.index));
    return { id: m[1], bloc: html.slice(m.index, fin) };
  });
}

const PAR_ID = new Map(ambiances().map((a) => [a.id, a]));
const prestationDe = (piece: string) => lienPrestation(prestationDeLaPiece(piece)!.slug);

describe("maillage (site 3.0, lot F5)", () => {
  test("règle : chaque pièce d'ambiance a sa prestation (les murs vont aux meubles, le professionnel à /pro)", () => {
    assert.deepEqual(
      ["cuisine", "salle-de-bain", "meubles", "mur-plafond", "professionnel"].map(prestationDe),
      ["/prestations/cuisine", "/prestations/salle-de-bain", "/prestations/meubles", "/prestations/meubles", "/pro"],
    );
    for (const a of PAR_ID.values()) assert.ok(prestationDeLaPiece(a.piece), a.id);
    assert.equal(prestationDeLaPiece("inconnue"), undefined);
  });

  test("toute ambiance rendue → la fiche de chacune de ses matières et sa prestation (pas un lien vers la page où l'on est)", async () => {
    publications = [];
    const pages: [string, string, Record<string, unknown>?][] = [
      ["/", "@/app/page"],
      ["/inspirations", "@/app/inspirations/page"],
      ["/realisations", "@/app/realisations/page"],
      ["/pro", "@/app/pro/page"],
      ...["cuisine", "salle-de-bain", "meubles"].map((s) => [`/prestations/${s}`, "@/app/prestations/[slug]/page", parametres("slug", s)] as [string, string, Record<string, unknown>]),
      ...["bois", "couleur", "pierre", "beton"].map((f) => [`/matieres/${f}`, "@/app/matieres/[famille]/page", parametres("famille", f)] as [string, string, Record<string, unknown>]),
      ["/blog/cuisine-bordeaux-brillante-renover-sans-changer", "@/app/blog/[slug]/page", parametres("slug", "cuisine-bordeaux-brillante-renover-sans-changer")],
    ];
    const vues = new Set<string>();
    for (const [chemin, module, props] of pages) {
      const html = await rendre(module, props);
      const lesCartes = cartes(html);
      assert.ok(lesCartes.length > 0, `${chemin} : des ambiances`);
      for (const { id, bloc } of lesCartes) {
        const a = PAR_ID.get(id)!;
        const ici = liens(bloc);
        for (const s of a.surfaces) assert.ok(ici.has(lienMatiere(s.ref)), `${chemin} › ${id} : fiche de ${s.ref}`);
        const prestation = prestationDe(a.piece);
        if (prestation === chemin) assert.ok(!ici.has(prestation), `${chemin} › ${id} : un lien vers la page même`);
        else assert.ok(ici.has(prestation), `${chemin} › ${id} : sa prestation ${prestation}`);
        vues.add(id);
      }
    }
    // Les 52 cartes de /inspirations : toutes les ambiances d'inspiration y passent.
    for (const a of PAR_ID.values()) if (a.inspiration) assert.ok(vues.has(a.id), `${a.id} jamais rendue avec ses liens`);
  });

  test("toute matière (les 497 fiches) → ses ambiances (et leur prestation), sa famille, ses prestations — celles sans ambiance comprises", async () => {
    publications = [];
    const vue = vueDans();
    const fiches = parametresDesFiches();
    assert.equal(fiches.length, 497);
    let avecAmbiance = 0;
    for (const { famille, ref } of fiches) {
      const html = await rendre("@/app/matieres/[famille]/[ref]/page", { params: Promise.resolve({ famille, ref }) });
      const ici = liens(html);
      assert.ok(ici.has(cheminFamille(famille)), `${ref} : sa famille`);
      const prestations = prestationsDeFamille(famille);
      assert.ok(prestations.length >= 1, `${famille} : au moins une prestation`);
      for (const p of prestations) assert.ok(ici.has(p.href), `${ref} : ${p.href}`);
      for (const v of vue[ref] ?? []) {
        assert.ok(ici.has(lienInspiration(v.id)), `${ref} : son ambiance ${v.id}`);
        const carte = cartes(html).find((c) => c.id === v.id);
        assert.ok(carte && liens(carte.bloc).has(prestationDe(v.piece)), `${ref} › ${v.id} : la prestation de l'ambiance`);
      }
      if (vue[ref]?.length) avecAmbiance++;
    }
    assert.equal(avecAmbiance, 49, "49 matières vues dans une ambiance, 448 sans (qui mènent quand même à leurs prestations)");
  });

  test("toute prestation → trois avant / après au moins, ses matières vedettes, ses villes (vitrages exclue : aucune image)", async () => {
    publications = [];
    const villes = ZONES.map((z) => `/zones/${getZoneSlug(z)}`);
    for (const slug of ["cuisine", "salle-de-bain", "meubles", "professionnel"] as const) {
      const html = slug === "professionnel" ? await rendre("@/app/pro/page") : await rendre("@/app/prestations/[slug]/page", parametres("slug", slug));
      assert.ok(compter(html, 'role="slider"') >= 3, `${slug} : ${compter(html, 'role="slider"')} avant / après`);
      const ici = liens(html);
      const vedettes = slug === "professionnel" ? (await import("@/app/pro/vue")).vueDuPro([]).vedettes.map((m) => m.id) : CAS_PRESTATIONS[slug].vedettes;
      assert.ok(vedettes.length >= 4, `${slug} : des vedettes`);
      const section = html.slice(html.indexOf('id="matieres"'));
      for (const ref of vedettes) assert.ok(liens(section).has(lienMatiere(ref)), `${slug} : vedette ${ref}`);
      for (const v of villes) assert.ok(ici.has(v), `${slug} : ${v}`);
    }
    const vitrages = await rendre("@/app/prestations/[slug]/page", parametres("slug", "vitrages"));
    assert.equal(compter(vitrages, 'role="slider"'), 0);
    for (const v of villes) assert.ok(liens(vitrages).has(v), `vitrages : ${v}`);
  });

  test("/pro : ses vedettes sont les matières de ses lieux, une fois chacune, huit au plus ; le même comptoir en deux directions", async () => {
    const { vueDuPro, VEDETTES_PRO_MAX } = await import("@/app/pro/vue");
    const vue = vueDuPro([]);
    const ids = vue.vedettes.map((m) => m.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.length <= VEDETTES_PRO_MAX && ids.length >= 4);
    assert.deepEqual(ids.slice(0, 2), ["D1", "K1"], "d'abord celles du comptoir de l'ouverture");
    assert.equal(vue.lieux.filter((l) => l.cas.preparees.avant).length, 2, "le bar et l'autre direction du comptoir");
  });

  test("toute ville → ses prestations et ses réalisations (celles publiées dans la ville, sinon une phrase honnête), toujours /realisations", async () => {
    publications = [];
    const prestations = ["/prestations/cuisine", "/prestations/salle-de-bain", "/prestations/meubles", "/pro", "/prestations/vitrages"];
    for (const z of ZONES) {
      const html = await rendre("@/app/zones/[slug]/page", parametres("slug", getZoneSlug(z)));
      const ici = liens(html);
      for (const p of prestations) assert.ok(ici.has(p), `${z.ville} : ${p}`);
      assert.ok(ici.has("/realisations"), `${z.ville} : /realisations`);
      assert.ok(html.includes(">Nos réalisations</h3>") && html.includes("Les photos de nos chantiers paraissent sur la page Réalisations"), z.ville);
      assert.ok(!/>Réalisation/.test(html.replace(">Nos réalisations</h3>", "")), `${z.ville} : aucune image présentée comme un chantier`);
    }
    // Un chantier publié à Lattes (graphie du CRM, accents et casse indifférents) : sur la page de Lattes, pas ailleurs.
    publications = [
      { id: "l1", type: "REALISATION", titre: "Cuisine en chêne", texte: null, ville: "LATTES", typeProjet: "CUISINE", note: null, auteur: null, photoAvant: "/api/site/photos/l1/avant", photoApres: "/api/site/photos/l1/apres", publieLe: "2026-09-01T00:00:00.000Z" },
      { id: "l2", type: "REALISATION", titre: "Sans photo", texte: null, ville: "Lattes", typeProjet: "CUISINE", note: null, auteur: null, photoAvant: null, photoApres: null, publieLe: "2026-09-01T00:00:00.000Z" },
    ];
    try {
      const lattes = await rendre("@/app/zones/[slug]/page", parametres("slug", "covering-lattes"));
      assert.ok(lattes.includes(">Nos réalisations à Lattes</h3>") && lattes.includes("/api/site/photos/l1/apres"));
      assert.ok(!lattes.includes("Sans photo"), "une réalisation sans photo n'est pas montrée");
      assert.ok(liens(lattes).has("/realisations"));
      const montpellier = await rendre("@/app/zones/[slug]/page", parametres("slug", "covering-montpellier"));
      assert.ok(!montpellier.includes("/api/site/photos/l1/"), "le chantier de Lattes n'est pas à Montpellier");
      const { realisationsDeLaVille, REALISATIONS_VILLE_MAX } = await import("@/app/zones/[slug]/page");
      const nombreuses = Array.from({ length: 5 }, (_, i) => ({ id: `n${i}`, type: "REALISATION", ville: "Pérols", photoApres: "x" }) as Publication);
      assert.equal(realisationsDeLaVille("Perols", nombreuses).length, REALISATIONS_VILLE_MAX);
    } finally {
      publications = [];
    }
  });
});
