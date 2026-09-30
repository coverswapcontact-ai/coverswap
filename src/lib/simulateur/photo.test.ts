import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { COTE_MAX, POIDS_MAX_OCTETS, dimensionsReduites, estHeic, messageErreurPhoto, poidsKoDe, verifierFichier } from "./photo";

/** Mission 15 (partie 4) — préparation de la photo : fonctions pures (aucun DOM, aucun réseau). */

describe("contrôle du fichier avant décodage", () => {
  test("25 Mo au plus ; une image ou un HEIC (par type ou par extension) ; un fichier vide est illisible", () => {
    assert.equal(verifierFichier({ size: 1000, type: "image/jpeg", name: "IMG_1.jpg" }), null);
    assert.equal(verifierFichier({ size: POIDS_MAX_OCTETS, type: "image/jpeg", name: "IMG_1.jpg" }), null);
    assert.equal(verifierFichier({ size: POIDS_MAX_OCTETS + 1, type: "image/jpeg", name: "IMG_1.jpg" }), "trop-lourde");
    assert.equal(verifierFichier({ size: 0, type: "image/jpeg", name: "IMG_1.jpg" }), "illisible");
    assert.equal(verifierFichier({ size: 1000, type: "application/pdf", name: "devis.pdf" }), "format");
    // Un HEIC d'iPhone arrive parfois sans type : l'extension suffit, il sera converti par le CRM si le navigateur ne le lit pas.
    assert.equal(verifierFichier({ size: 1000, type: "", name: "IMG_0001.HEIC" }), null);
    assert.equal(verifierFichier({ size: 1000, type: "image/heif", name: "photo" }), null);
    assert.ok(estHeic({ size: 1, type: "", name: "a.heif" }));
    assert.equal(estHeic({ size: 1, type: "image/png", name: "a.png" }), false);
  });

  test("les messages disent quoi faire (25 Mo, capture d'écran, JPEG)", () => {
    assert.match(messageErreurPhoto("trop-lourde"), /25 Mo/);
    assert.match(messageErreurPhoto("format"), /JPEG|capture/);
    assert.match(messageErreurPhoto("conversion"), /capture d'écran/);
    assert.doesNotMatch(messageErreurPhoto("format"), /Réglages|iPhone/, "plus de consigne « changez le réglage de votre iPhone » : le CRM convertit");
    assert.match(messageErreurPhoto("autre"), /Impossible de lire/);
  });
});

describe("réduction", () => {
  test("le grand côté est ramené à 1600 px, le rapport gardé, rien n'est agrandi", () => {
    assert.deepEqual(dimensionsReduites(4032, 3024), { largeur: COTE_MAX, hauteur: 1200 });
    assert.deepEqual(dimensionsReduites(3024, 4032), { largeur: 1200, hauteur: COTE_MAX });
    assert.deepEqual(dimensionsReduites(800, 600), { largeur: 800, hauteur: 600 });
    assert.deepEqual(dimensionsReduites(1600, 1600), { largeur: 1600, hauteur: 1600 });
    assert.deepEqual(dimensionsReduites(20000, 10), { largeur: 1600, hauteur: 1 });
    assert.deepEqual(dimensionsReduites(0, 0), { largeur: 1, hauteur: 1 });
  });

  test("poids d'une data URL en Ko", () => {
    assert.equal(poidsKoDe(`data:image/jpeg;base64,${"A".repeat(4096)}`), 3);
    assert.equal(poidsKoDe("data:image/jpeg;base64,"), 0);
  });
});
