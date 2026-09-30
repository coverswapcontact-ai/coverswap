import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { ENTREES_MENU, LIEN_CONTACT, LIEN_ESPACE_CLIENT, LIENS_PIED } from "./navigation";

/**
 * Mission 16 (partie 1, relecture) — le menu et le pied lisent UNE liste
 * (`lib/navigation`) ; l'espace client est au pied, pas au menu (énoncé § 5) ;
 * le lien d'évitement mène au contenu principal ; les liens du menu du
 * téléphone ferment la feuille avant de naviguer.
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");

describe("navigation du site", () => {
  test("le menu : quatre entrées, dans l'ordre de l'énoncé", () => {
    assert.deepEqual(
      ENTREES_MENU.map((e) => e.href),
      ["/matieres", "/realisations", "/comment-ca-marche", "/pro"],
    );
  });

  test("le pied : le contact, l'espace client, le menu", () => {
    const hrefs = LIENS_PIED.map((e) => e.href);
    for (const attendu of [LIEN_CONTACT.href, LIEN_ESPACE_CLIENT.href, ...ENTREES_MENU.map((e) => e.href)]) assert.ok(hrefs.includes(attendu), attendu);
  });

  test("en-tête, menu du téléphone et pied n'écrivent aucune adresse du menu en dur", () => {
    for (const fichier of ["components/EnteteSite.tsx", "components/MenuMobile.tsx", "components/PiedDePage.tsx"]) {
      const source = lire(fichier);
      for (const { href } of [...ENTREES_MENU, LIEN_CONTACT, LIEN_ESPACE_CLIENT]) assert.ok(!source.includes(`"${href}"`), `${fichier} écrit ${href} en dur`);
    }
  });

  test("l'espace client n'est pas au menu du téléphone", () => {
    const menu = lire("components/MenuMobile.tsx");
    assert.ok(!/LIEN_ESPACE_CLIENT|#espace/.test(menu));
  });

  test("les liens du menu du téléphone ferment la feuille, puis naviguent", () => {
    const menu = lire("components/MenuMobile.tsx");
    assert.match(menu, /useLiensDeFeuille\(/);
    assert.ok(!/onClick=\{fermer\}/.test(menu), "un lien qui ferme la feuille sans attendre le retour d'historique");
  });

  test("le lien d'évitement mène au contenu principal", () => {
    assert.match(lire("components/EnteteSite.tsx"), /href="#main-content"/);
    assert.match(lire("app/layout.tsx"), /<main id="main-content">/);
  });
});
