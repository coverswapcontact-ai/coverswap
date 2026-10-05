import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { lireDepuis } from "./simulateur/entonnoir";
import { ENTREES_MENU, LIEN_CONTACT, LIEN_ESPACE_CLIENT, LIEN_SIMULER, LIEN_ZONES, LIENS_PIED } from "./navigation";

/**
 * Mission 16 (partie 1, relecture) — le menu et le pied lisent UNE liste
 * (`lib/navigation`) ; l'espace client est au pied, pas au menu (énoncé § 5) ;
 * le lien d'évitement mène au contenu principal ; les liens du menu du
 * téléphone ferment la feuille avant de naviguer.
 * Site 3.0, lot B5 : le menu passe à cinq entrées (Inspirations y entre, comme
 * dans la maquette validée de la mission 21) ; le pied garde tous ses liens.
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");

describe("navigation du site", () => {
  test("le menu : cinq entrées, dans l'ordre de la maquette (mission 21)", () => {
    assert.deepEqual(
      ENTREES_MENU.map((e) => [e.href, e.libelle]),
      [
        ["/matieres", "Matières"],
        ["/inspirations", "Inspirations"],
        ["/realisations", "Réalisations"],
        ["/comment-ca-marche", "Comment ça marche"],
        ["/pro", "Pro"],
      ],
    );
  });

  test("le pied : le contact, l'espace client, tout le menu (inspirations comprises, mission 19) et les zones, chacun une fois", () => {
    const hrefs = LIENS_PIED.map((e) => e.href);
    assert.deepEqual(hrefs, [LIEN_CONTACT.href, LIEN_ESPACE_CLIENT.href, "/matieres", "/inspirations", "/realisations", "/comment-ca-marche", "/pro", LIEN_ZONES.href]);
    assert.equal(new Set(hrefs).size, hrefs.length, "un lien en double au pied");
  });

  test("« Simuler ma pièce » dit d'où il vient (depuis=entete), et le simulateur sait le lire (docs/SUIVI.md)", () => {
    assert.equal(LIEN_SIMULER.libelle, "Simuler ma pièce");
    const [chemin, requete] = LIEN_SIMULER.href.split("?");
    assert.equal(chemin, "/simulateur");
    assert.equal(lireDepuis(new URLSearchParams(requete).get("depuis")), "entete");
    assert.match(readFileSync(join(process.cwd(), "docs", "SUIVI.md"), "utf8"), /`entete`/, "la valeur depuis=entete est documentée au suivi");
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
