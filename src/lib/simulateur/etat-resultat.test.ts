import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import revetements from "@/data/revetements.json";
import { AMBIANCES_SERIE_2 } from "@/data/ambiances-serie-2";
import { exempleConnu } from "@/lib/exemples-simulateur";
import { ecranDepuisEtape } from "@/lib/simulateur/ecrans";
import { decisionAuMontage, memoireDuParcours, migrerEtat } from "@/lib/simulateur/reprise";
import { ZONES_REPLI, pieceDe } from "@/lib/simulateur/zones";
import { etiquetteDuRendu } from "@/app/simulateur/_components/EcranResultat";
import { RESULTAT_INJECTE, etatResultat } from "../../../scripts/captures.mjs";

/**
 * Site 3.0, lot G1 : l'écran de résultat se capture SANS AUCUNE GÉNÉRATION (`scripts/captures.mjs --etat-resultat`) :
 * un état est écrit dans la mémoire locale du simulateur, puis « Reprendre ». Ces tests gardent cet état lisible par
 * le simulateur tel qu'il est : s'il change de forme, la capture le dit ici plutôt que de sortir un écran vide.
 * Et il reste honnête : une pièce d'exemple de la bibliothèque, son après réel, « Ambiance · avant / après ».
 */

const PHOTO = "data:image/jpeg;base64,/9j/AA==";
const MAINTENANT = Date.UTC(2026, 9, 6, 8);

describe("captures, lot G1 : l'état injecté pour l'écran de résultat", () => {
  test("le simulateur le relit tel quel et propose de reprendre sur le résultat (écran 4)", () => {
    const brut = etatResultat(PHOTO, MAINTENANT);
    const etat = migrerEtat(structuredClone(brut));
    assert.ok(etat, "relu");
    assert.equal(memoireDuParcours(etat, MAINTENANT), etat, "parcours né maintenant : pas expiré");
    assert.equal(etat.photo, PHOTO);
    assert.equal(etat.exemple, "cuisine-bordeaux-brillante");
    assert.equal(etat.travailEnCours, null, "aucun sondage relancé, donc aucun appel au CRM pour un travail");
    assert.equal(etat.rendus.length, 1);
    assert.deepEqual(etat.rendus[0], { ...brut.rendus[0] }, "le rendu passe sans perte");
    assert.deepEqual(etat.selections, brut.selections);
    const decision = decisionAuMontage(etat, { maintenant: MAINTENANT + 1_000 });
    assert.deepEqual(decision, { ecran: "bandeau", etape: 3 }, "le bandeau « Reprendre ma simulation », dernier rendu");
    assert.equal(ecranDepuisEtape(3, etat), 4, "« Reprendre » ouvre le résultat");
  });

  test("honnête : une pièce d'exemple connue, « Ambiance · avant / après », jamais « Simulation »", () => {
    const etat = migrerEtat(etatResultat(PHOTO, MAINTENANT))!;
    assert.equal(exempleConnu(RESULTAT_INJECTE.exemple), RESULTAT_INJECTE.exemple);
    assert.equal(etiquetteDuRendu(etat.rendus[0]), "Ambiance · avant / après");
  });

  test("les images sont celles de la bibliothèque, servies par le site, et le rendu redit sa composition réelle", () => {
    for (const adresse of [RESULTAT_INJECTE.avant, RESULTAT_INJECTE.apres]) {
      assert.match(adresse, /^\/images\/prep\/cuisine-bordeaux-brillante-(avant|apres-couleur)-1536\.jpg$/);
      assert.ok(existsSync(path.join(process.cwd(), "public", adresse)), adresse);
    }
    const ambiance = AMBIANCES_SERIE_2.find((a) => a.id === "cuisine-bordeaux-brillante-apres-couleur");
    assert.ok(ambiance);
    assert.equal(ambiance.avant, "cuisine-bordeaux-brillante-avant");
    assert.deepEqual(
      RESULTAT_INJECTE.references.map((r) => [r.zone, r.ref, r.nom]),
      ambiance.surfaces.map((s) => [s.zone, s.ref, s.nom]),
      "les films de l'après, zone par zone",
    );
    const cuisine = pieceDe(ZONES_REPLI, "cuisine");
    for (const r of RESULTAT_INJECTE.references) {
      assert.equal(cuisine.zones.find((z) => z.id === r.zone)?.libelle, r.libelle, r.zone);
      const sel = RESULTAT_INJECTE.selections[r.zone as keyof typeof RESULTAT_INJECTE.selections];
      const film = (revetements as { id: string; nom: string; famille: string; finition: string }[]).find((m) => m.id === r.ref);
      assert.ok(film, r.ref);
      assert.deepEqual([sel.ref, sel.nom, sel.famille, sel.finition], [film.id, film.nom, film.famille, film.finition], r.ref);
    }
  });
});
