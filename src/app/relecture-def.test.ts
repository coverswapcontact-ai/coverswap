import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import nextConfig from "../../next.config";
import { ambiances, vueDans } from "@/lib/ambiances";
import { ambiancesDeLaFiche, estFicheIndexee, ficheDe, photosUtilesDeLaFiche, prochesDeLaFiche, resumeFiche } from "@/lib/fiches-matieres";
import { fichesIndexees } from "@/lib/indexation-matieres";
import { DELAI_REPONSE, PRIX_PLAGE } from "@/lib/offre-legere";
import revetements from "@/data/revetements.json";
import type { Matiere } from "@/lib/matieres";
import sitemap from "./sitemap";

/**
 * Relecture adverse des phases D, E, F — les constats mineurs verrouillés ici (le n° 1 l'est dans
 * `simulateur/_components/exemple-honnete.test.ts` et `lib/simulateur/entonnoir.test.ts`, le n° 2 dans
 * `maillage.test.ts`, l'important n° 2 dans `mots.test.ts`) :
 *  3. les photos utiles (pose, chant) où une matière apparaît sont sur sa fiche, « Ambiance », vers /comment-ca-marche ;
 *  4. barre finale : 308 de Next accepté (docs/SEO.md) — aucune adresse ni aucun lien interne n'en porte ;
 *  5. la description par défaut du gabarit tient en 155 signes ;
 *  7. les pictos de l'espace gardent 64 px utiles (la marge est sur le cadre) ;
 *  8. une phrase propre à chaque fiche indexée, tirée de ses données.
 * Le CRM est simulé (`fetch` remplacé) : aucune requête réseau.
 */
const lire = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");
const CATALOGUE = revetements as Matiere[];
const ROUTEUR = { back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, prefetch() {} };
const fetchOrigine = globalThis.fetch;
before(() => {
  globalThis.fetch = (async (url: string | URL) => (String(url).endsWith("/api/site/publications") ? new Response(JSON.stringify({ publications: [] }), { status: 200 }) : new Response("{}", { status: 404 }))) as typeof fetch;
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
const fiche = (famille: string, ref: string) => rendre("@/app/matieres/[famille]/[ref]/page", { params: Promise.resolve({ famille, ref }) });

describe("relecture D, E, F, mineur 3 : les photos de pose sur la fiche de leurs matières", () => {
  test("AF02 (pose-mains), RM20 (pose-sauge, detail-chant) : listées à part de « Vue dans », qui ne change pas (ni l'indexation)", () => {
    assert.deepEqual(photosUtilesDeLaFiche("AF02").map((p) => p.ambiance.id), ["pose-mains"]);
    assert.deepEqual(photosUtilesDeLaFiche("RM20").map((p) => p.ambiance.id).sort(), ["detail-chant", "pose-sauge"]);
    assert.deepEqual(photosUtilesDeLaFiche("NF13"), []);
    // Toutes les photos utiles liées à une matière sont couvertes, et aucune ambiance d'inspiration n'y passe.
    for (const a of ambiances().filter((x) => !x.inspiration)) for (const s of a.surfaces) assert.ok(photosUtilesDeLaFiche(s.ref).some((p) => p.ambiance.id === a.id), `${a.id} › ${s.ref}`);
    assert.ok(!("AF02" in vueDans()), "« Vue dans » (et le plan du site) ignorent toujours les photos utiles");
    assert.equal(estFicheIndexee("AF02"), false);
    assert.equal(fichesIndexees().length, 52);
  });

  test("rendues : la photo étiquetée « Ambiance », ce qu'elle montre, « Voir comment on pose » vers /comment-ca-marche", async () => {
    const af02 = await fiche("bois", "AF02");
    assert.match(af02, /id="vue-dans"/);
    assert.match(af02, /data-photo-pose="pose-mains"/);
    assert.match(af02, /Nos photos de pose où on la voit/);
    const bloc = af02.slice(af02.indexOf('data-photo-pose="pose-mains"'));
    assert.match(bloc, />Ambiance</);
    assert.match(bloc, /<a [^>]*href="\/comment-ca-marche"[^>]*>Voir comment on pose<\/a>/);
    assert.doesNotMatch(bloc.slice(0, 3000), /Réalisation|>Simulation</);
    const rm20 = await fiche("couleur", "RM20");
    assert.match(rm20, /Sur nos photos de pose/);
    assert.equal((rm20.match(/data-photo-pose="/g) ?? []).length, 2);
    // Les ambiances d'inspiration de RM20 restent avant les photos de pose.
    assert.ok(rm20.indexOf("data-ambiance=") < rm20.indexOf("data-photo-pose="));
  });
});

describe("relecture D, E, F, mineur 4 : la barre finale (308 de Next, écart accepté)", () => {
  test("ni trailingSlash ni skipTrailingSlashRedirect ; aucune adresse du plan ne finit par « / » ; l'écart est écrit dans docs/SEO.md", () => {
    const config = nextConfig as Record<string, unknown>;
    assert.equal(config.trailingSlash, undefined);
    assert.equal(config.skipTrailingSlashRedirect, undefined);
    for (const e of sitemap()) assert.ok(!/[^/]\/$/.test(new URL(e.url).pathname), e.url);
    assert.match(lire("docs/SEO.md"), /Barre finale \(relecture des phases D, E, F, écart accepté\)/);
  });

  test("aucun lien interne des pages rendues ne finit par « / » (hors l'accueil)", async () => {
    const pages = [await rendre("@/app/page"), await rendre("@/app/matieres/page"), await rendre("@/app/contact/page"), await fiche("couleur", "NF13")];
    for (const html of pages) {
      for (const [, href] of html.matchAll(/<a [^>]*href="(\/[^"]*)"/g)) assert.ok(!/[^/]\/(?:[?#]|$)/.test(href), href);
    }
  });
});

describe("relecture D, E, F, mineur 5 : la description par défaut du gabarit", () => {
  test("155 signes au plus (elle se lisait sur la 404 à 223)", () => {
    const gabarit = lire("src/app/layout.tsx");
    const brut = /\n {2}description: `([^`]+)`,/.exec(gabarit)?.[1];
    assert.ok(brut, "la description par défaut est un gabarit de texte");
    const description = brut.replace("${DELAI_REPONSE}", DELAI_REPONSE).replace("${PRIX_PLAGE}", PRIX_PLAGE);
    assert.ok(!description.includes("${"), description);
    assert.ok(description.length <= 155, `${description.length} signes`);
    assert.match(description, /covering adhésif/);
  });
});

describe("relecture D, E, F, mineur 7 : les pictos de l'espace à 64 px utiles", () => {
  test("le cadre porte la marge (72 × 80), le picto fait 64 px ; plus de « h-16 … p-1 » sur l'image", () => {
    for (const f of ["src/components/espace/EtapeProjet.tsx", "src/components/espace/EspaceClient.tsx", "src/components/espace/EspaceCompte.tsx"]) {
      const s = lire(f);
      assert.doesNotMatch(s, /<DessinFamille [^>]*h-16 w-20[^>]*p-1/, f);
      assert.match(s, /<span className="flex h-\[72px\] w-20 shrink-0 items-center justify-center rounded-xl bg-fond p-1">\s+<DessinFamille famille=\{[^}]+\} className="h-16 w-16" \/>/, f);
    }
  });
});

describe("relecture D, E, F, mineur 8 : une phrase propre à chaque fiche indexée", () => {
  test("tirée de ses données : teinte, finition, ambiance, deux voisines ; jamais deux fois la même", () => {
    const resumes = fichesIndexees().map((ref) => {
      const m = CATALOGUE.find((x) => x.id === ref)!;
      return resumeFiche(m, ambiancesDeLaFiche(ref), prochesDeLaFiche(ref));
    });
    assert.equal(new Set(resumes).size, resumes.length, "aucune phrase commune à deux fiches");
    const nf13 = ficheDe("couleur", "NF13")!;
    const r = resumeFiche(nf13, ambiancesDeLaFiche("NF13"), prochesDeLaFiche("NF13"));
    assert.match(r, /^Deep Green se range dans les teintes « vert » du catalogue, en finition [a-zé ]+\./);
    assert.match(r, /On l'a posée dans \d+ ambiances, dont « [^»]+ » \([^)]+\)\./);
    const [a, b] = prochesDeLaFiche("NF13");
    assert.ok(r.endsWith(`Ses deux plus proches voisines de teinte : ${a.nom} (${a.id}) et ${b.nom} (${b.id}).`), r);
    // Une matière sans ambiance : la teinte et les voisines seulement.
    assert.doesNotMatch(resumeFiche(nf13, [], prochesDeLaFiche("NF13")), /posée/);
  });

  test("rendue sous la note des fiches indexées, pas sur les autres", async () => {
    const html = await fiche("couleur", "NF13");
    assert.match(html, /data-note="NF13"[\s\S]*?data-resume="NF13"[^>]*>Deep Green se range dans les teintes « vert »/);
    assert.doesNotMatch(await fiche("bois", "AF02"), /data-resume=/);
  });
});
