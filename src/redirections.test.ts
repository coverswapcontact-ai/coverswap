import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, test } from "node:test";
import nextConfig from "../next.config";
import { HOTE_CANONIQUE, REDIRECTIONS_ATTENDUES, SONDES_AVEC_REQUETE, SONDES_HOTES, cheminDe, verifierRedirections } from "../scripts/verifier-redirections.mjs";
import { ENTREPRISE } from "./lib/entreprise";
import sitemap from "./app/sitemap";

/**
 * Les redirections du site (mission 16) : chaque adresse retirée répond par une 301 (`permanent: true` : 308 chez
 * Next, que les moteurs traitent comme une 301) vers sa nouvelle page, plus aucun lien interne ne la vise, le sitemap
 * ne la cite plus. Partie 4 : `/devis` → `/simulateur`, `/prestations/professionnel` → `/pro`. Partie 5 :
 * `/revetements` → `/matieres`, `/prestations` → `/realisations`, `/blog` → `/comment-ca-marche` ; la sonde en
 * ligne `scripts/verifier-redirections.mjs` suit la même liste.
 * Site 3.0 (lot F3) : toutes en 301 (`statusCode: 301`, plus 308) ; un seul hôte, coverswap.fr — www.coverswap.fr et
 * l'hôte exact coverswap.vercel.app y redirigent en 301 (vercel.json), sans joker, routes d'API exclues.
 */

const ATTENDUES: readonly [string, string][] = [
  ["/simulation", "/simulateur"],
  ["/blog/tendances-deco-2025-covering", "/blog/quelle-finition-choisir"],
  ["/devis", "/simulateur"],
  ["/prestations/professionnel", "/pro"],
  ["/revetements", "/matieres"],
  ["/prestations", "/realisations"],
  ["/blog", "/comment-ca-marche"],
];

const SRC = join(process.cwd(), "src");
function fichiers(dossier: string, sortie: string[] = []): string[] {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) fichiers(chemin, sortie);
    else if (/\.(tsx?|mjs)$/.test(nom) && !nom.endsWith(".test.ts")) sortie.push(chemin);
  }
  return sortie;
}
const nom = (f: string) => relative(SRC, f).split(sep).join("/");

describe("redirections permanentes (next.config.ts)", () => {
  test("chaque paire attendue est là, permanente, en 301", async () => {
    const redirections = (await nextConfig.redirects?.()) ?? [];
    for (const [source, destination] of ATTENDUES) {
      const r = redirections.find((x) => x.source === source);
      assert.ok(r, `redirection absente : ${source}`);
      assert.equal(r.destination, destination, source);
      // Site 3.0 (lot F3) : 301 écrit (`permanent: true` répondait 308).
      assert.equal("statusCode" in r && r.statusCode, 301, `${source} : 301`);
      assert.ok(!("permanent" in r), `${source} : pas de « permanent » (308)`);
      assert.ok(!("has" in r), `${source} : aucune règle d'hôte dans next.config (vercel.json)`);
    }
    assert.equal(new Set(redirections.map((r) => r.source)).size, redirections.length, "une source, une redirection");
    assert.equal(redirections.length, ATTENDUES.length, "aucune redirection de plus sans test");
  });

  test("les pages d'index gardent leurs sous-pages : /blog/<guide> et /prestations/<pièce> ne sont pas redirigées", async () => {
    const redirections = (await nextConfig.redirects?.()) ?? [];
    for (const source of ["/blog", "/prestations", "/revetements"]) {
      const r = redirections.find((x) => x.source === source)!;
      assert.ok(!/[:*(]/.test(r.source), `${source} : adresse exacte, sans motif`);
    }
  });

  test("les pages redirigées n'existent plus ; les pages qui les remplacent, si", async () => {
    for (const retiree of ["devis", "revetements", join("prestations", "page.tsx"), join("blog", "page.tsx")]) assert.equal(existsSync(join(SRC, "app", retiree)), false, retiree);
    for (const gardee of ["matieres", "realisations", "comment-ca-marche", "pro", join("prestations", "[slug]", "page.tsx"), join("blog", "[slug]", "page.tsx")]) assert.equal(existsSync(join(SRC, "app", gardee)), true, gardee);
    const { generateStaticParams } = await import("./app/prestations/[slug]/page");
    assert.deepEqual(generateStaticParams().map((p) => p.slug).sort(), ["cuisine", "meubles", "salle-de-bain", "vitrages"]);
  });

  test("les composants des pages retirées sont supprimés", () => {
    for (const retire of ["CatalogueClient", "BlogClient", "Realisations", "Header", "Footer", "SectionsCommentCaMarche"]) assert.equal(existsSync(join(SRC, "components", `${retire}.tsx`)), false, retire);
  });

  test("plus aucun lien interne vers une adresse redirigée", () => {
    const vise = /(href=\{?["'`]|\$\{s\}|\$\{ENTREPRISE\.site\}|\$\{baseUrl\}|coverswap\.fr|["'`])\/(devis|prestations\/professionnel|revetements|blog|prestations)(["'`#?)]|$)|["'`]\/#faq/m;
    // Le motif attrape bien les formes d'avant (lien, objet, llms.txt, fil d'Ariane, ancre de l'ancien accueil)…
    for (const avant of ['<Lien href="/devis">', '{ href: "/prestations/professionnel", title', "`- [Devis gratuit](${s}/devis)`", '<Link href="/blog" className', '{ label: "Prestations", href: "/prestations" }', 'url: "https://coverswap.fr/blog" }', "`${ENTREPRISE.site}/prestations`", "`${s}/revetements`", '<Link href="/#faq">', '"/revetements?famille=bois"']) assert.ok(vise.test(avant), avant);
    // … et laisse passer les pages gardées : un guide, une page par pièce, une route d'API du CRM.
    for (const garde of ['href={`/blog/${article.slug}`}', '"/prestations/vitrages"', "`/prestations/${p.slug}`", "`${BASE_CRM}/api/site/prestations`", 'from "@/data/prestations"']) assert.ok(!vise.test(garde), garde);
    // L'espace client appelle l'API du CRM (`/devis/<id>/consultation`) : ce ne sont pas des pages du site. Le script de
    // sonde cite les anciennes adresses : c'est son rôle.
    for (const f of fichiers(SRC).filter((x) => !nom(x).startsWith("components/espace/"))) {
      const texte = readFileSync(f, "utf8").split("\n").filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join("\n");
      assert.ok(!vise.test(texte), `lien vers une adresse redirigée dans ${nom(f)}`);
    }
  });

  test("le sitemap ne cite aucune adresse redirigée et cite leurs remplaçantes", () => {
    const urls = sitemap().map((e) => e.url.replace("https://coverswap.fr", "") || "/");
    for (const [source, destination] of ATTENDUES) {
      assert.ok(!urls.includes(source), source);
      assert.ok(urls.includes(destination), destination);
    }
  });
});

describe("un seul hôte (vercel.json, lot F3)", () => {
  type RegleHote = { source: string; has: { type: string; value: string }[]; destination: string; statusCode?: number; permanent?: boolean };
  const vercel = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as { redirects: RegleHote[]; crons: unknown[]; framework: string };

  test("deux règles, en 301, des hôtes exacts vers coverswap.fr, chemin et requête gardés", () => {
    assert.equal(ENTREPRISE.site, "https://coverswap.fr", "l'hôte gardé est celui des canonicals");
    assert.equal(HOTE_CANONIQUE, ENTREPRISE.site);
    assert.equal(vercel.redirects.length, 2);
    assert.deepEqual(vercel.redirects.map((r) => r.has.map((h) => [h.type, h.value])), [[["host", "www.coverswap.fr"]], [["host", "coverswap.vercel.app"]]]);
    for (const r of vercel.redirects) {
      assert.equal(r.statusCode, 301);
      assert.ok(!("permanent" in r), "301 écrit, pas 308");
      assert.equal(r.destination, `${ENTREPRISE.site}/$1`);
      // Jamais de joker : un hôte exact (les prévisualisations *.vercel.app restent servies).
      for (const h of r.has) assert.doesNotMatch(h.value, /[*?()|\\[\]]/, h.value);
      // Tout le chemin, sauf les routes d'API (une 301 casserait un POST ou une tâche planifiée).
      assert.equal(r.source, "/((?!api/).*)");
      const motif = new RegExp(`^${r.source}$`);
      for (const chemin of ["/", "/matieres", "/matieres/couleur/NF13", "/zones/covering-lattes"]) assert.ok(motif.test(chemin), chemin);
      for (const chemin of ["/api/contact", "/api/relais/ntfy", "/api/cron/webhook-health"]) assert.ok(!motif.test(chemin), chemin);
    }
    assert.equal(vercel.framework, "nextjs");
    assert.equal(vercel.crons.length, 1, "la tâche planifiée reste");
  });

  test("la sonde connaît les deux hôtes", () => {
    const hotes = new Set(SONDES_HOTES.map(([url]) => new URL(url).host));
    assert.deepEqual([...hotes].sort(), ["coverswap.vercel.app", "www.coverswap.fr"]);
    for (const [url, vers] of SONDES_HOTES) {
      const a = new URL(url);
      const b = new URL(vers);
      assert.equal(b.origin, ENTREPRISE.site);
      assert.equal(`${a.pathname}${a.search}`, `${b.pathname}${b.search}`, url);
    }
  });
});

describe("la sonde en ligne (scripts/verifier-redirections.mjs), sans réseau", () => {
  test("sa liste est celle de next.config.ts", async () => {
    const redirections = (await nextConfig.redirects?.()) ?? [];
    assert.deepEqual(
      [...REDIRECTIONS_ATTENDUES].map(([a, b]) => `${a} → ${b}`).sort(),
      redirections.map((r) => `${r.source} → ${r.destination}`).sort()
    );
    assert.deepEqual(SONDES_AVEC_REQUETE, [["/revetements?famille=bois", "/matieres?famille=bois"]]);
  });

  test("301 + location attendue → ok ; 308 (avant le lot F3), 200, mauvaise cible, erreur réseau → KO", async () => {
    assert.equal(cheminDe("https://coverswap.fr/matieres?famille=bois", "https://coverswap.fr"), "/matieres?famille=bois");
    assert.equal(cheminDe("/pro", "https://coverswap.fr"), "/pro");
    assert.equal(cheminDe(null, "https://coverswap.fr"), null);
    const cibles = new Map<string, string>([...REDIRECTIONS_ATTENDUES, ...SONDES_AVEC_REQUETE].map(([a, b]) => [a, b]));
    const demandes: string[] = [];
    const lignes: string[] = [];
    const toutBon = await verifierRedirections({
      site: "https://exemple.test/",
      journal: (l) => lignes.push(l),
      sonder: async (url) => {
        demandes.push(url);
        const chemin = url.replace("https://exemple.test", "");
        const vers = cibles.get(chemin)!;
        return { status: 301, headers: { get: (n: string) => (n === "location" ? vers : null) } };
      },
    });
    assert.ok(toutBon.every((c) => c.ok), JSON.stringify(toutBon.filter((c) => !c.ok)));
    // Une prévisualisation : les autres hôtes ne sont pas sondés.
    assert.equal(demandes.length, REDIRECTIONS_ATTENDUES.length + SONDES_AVEC_REQUETE.length);
    assert.ok(demandes.every((u) => u.startsWith("https://exemple.test/") && !u.startsWith("https://exemple.test//")));
    assert.equal(lignes.filter((l) => l.startsWith("  ok ")).length, demandes.length);

    const mauvais = await verifierRedirections({
      journal: () => undefined,
      sonder: async (url) => {
        if (url.endsWith("/blog")) throw new Error("réseau coupé");
        if (url.endsWith("/revetements")) return { status: 301, headers: { get: () => "/revetements-bis" } };
        if (url.endsWith("/devis")) return { status: 308, headers: { get: () => "/simulateur" } };
        return { status: 200, headers: { get: () => null } };
      },
    });
    assert.ok(mauvais.every((c) => !c.ok));
    assert.match(String(mauvais.find((c) => c.source === "/blog")?.vers), /réseau coupé/);
    assert.equal(mauvais.find((c) => c.source === "/devis")?.statut, 308, "un 308 n'est plus accepté");
  });

  test("la production : les deux hôtes sont sondés, location absolue vers coverswap.fr", async () => {
    const cibles = new Map<string, string>([...REDIRECTIONS_ATTENDUES, ...SONDES_AVEC_REQUETE].map(([a, b]) => [`https://coverswap.fr${a}`, b]));
    for (const [url, vers] of SONDES_HOTES) cibles.set(url, vers);
    const demandes: string[] = [];
    const constats = await verifierRedirections({
      journal: () => undefined,
      sonder: async (url) => {
        demandes.push(url);
        return { status: 301, headers: { get: (n: string) => (n === "location" ? (cibles.get(url) ?? null) : null) } };
      },
    });
    assert.ok(constats.every((c) => c.ok), JSON.stringify(constats.filter((c) => !c.ok)));
    assert.equal(demandes.length, REDIRECTIONS_ATTENDUES.length + SONDES_AVEC_REQUETE.length + SONDES_HOTES.length);
    // Un hôte qui sert la page (200) ou redirige vers lui-même : KO.
    const servi = await verifierRedirections({
      journal: () => undefined,
      sonder: async (url) => (url.startsWith("https://coverswap.fr") ? { status: 301, headers: { get: () => cibles.get(url) ?? null } } : { status: 200, headers: { get: () => null } }),
    });
    assert.equal(servi.filter((c) => !c.ok).length, SONDES_HOTES.length);
  });
});
