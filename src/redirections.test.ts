import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, test } from "node:test";
import nextConfig from "../next.config";
import sitemap from "./app/sitemap";

/**
 * Les redirections du site (mission 16) : chaque adresse retirée répond par une 301 (`permanent: true` : 308 chez
 * Next, que les moteurs traitent comme une 301) vers sa nouvelle page, plus aucun lien interne ne la vise, le sitemap
 * ne la cite plus. Partie 4 : `/devis` → `/simulateur`, `/prestations/professionnel` → `/pro`.
 */

const ATTENDUES: readonly [string, string][] = [
  ["/simulation", "/simulateur"],
  ["/blog/tendances-deco-2025-covering", "/blog/quelle-finition-choisir"],
  ["/devis", "/simulateur"],
  ["/prestations/professionnel", "/pro"],
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

describe("redirections permanentes (next.config.ts)", () => {
  test("chaque paire attendue est là, permanente", async () => {
    const redirections = (await nextConfig.redirects?.()) ?? [];
    for (const [source, destination] of ATTENDUES) {
      const r = redirections.find((x) => x.source === source);
      assert.ok(r, `redirection absente : ${source}`);
      assert.equal(r.destination, destination, source);
      assert.equal("permanent" in r && r.permanent, true, `${source} doit être permanente`);
    }
    assert.equal(new Set(redirections.map((r) => r.source)).size, redirections.length, "une source, une redirection");
  });

  test("les pages redirigées n'existent plus : /devis supprimée, « professionnel » plus générée", async () => {
    assert.equal(existsSync(join(SRC, "app", "devis")), false);
    const { generateStaticParams } = await import("./app/prestations/[slug]/page");
    assert.ok(!generateStaticParams().some((p) => p.slug === "professionnel"));
  });

  test("plus aucun lien interne vers une adresse redirigée", () => {
    const vise = /(href=\{?["'`]|\$\{s\}|["'`])\/(devis|prestations\/professionnel)(["'`#?/)]|$)/m;
    // Le motif attrape bien les formes d'avant (lien, objet, llms.txt).
    for (const avant of ['<Lien href="/devis">', '{ href: "/prestations/professionnel", title', "`- [Devis gratuit](${s}/devis)`"]) assert.ok(vise.test(avant), avant);
    // L'espace client appelle l'API du CRM (`/devis/<id>/consultation`) : ce ne sont pas des pages du site.
    for (const f of fichiers(SRC).filter((x) => !relative(SRC, x).split(sep).join("/").startsWith("components/espace/"))) {
      const texte = readFileSync(f, "utf8").split("\n").filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join("\n");
      assert.ok(!vise.test(texte), `lien vers une adresse redirigée dans ${relative(SRC, f).split(sep).join("/")}`);
    }
  });

  test("le sitemap ne cite aucune adresse redirigée et cite /pro", () => {
    const urls = sitemap().map((e) => e.url.replace("https://coverswap.fr", "") || "/");
    for (const [source] of ATTENDUES) assert.ok(!urls.includes(source), source);
    assert.ok(urls.includes("/pro"));
  });
});
