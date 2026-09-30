import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DOSSIER_IMAGES, MANIFESTE_IMAGES, sourcesPhoto, type ManifesteImages } from "./images-manifeste";

/** Mission 16 (partie 1) — le manifeste des images préparées : AVIF + WebP + JPEG et les dimensions réservées. */

const ESSAI: ManifesteImages = {
  "ouverture-essai": { largeur: 2400, hauteur: 1600, largeurs: [480, 960, 1600] },
  "petite-essai": { largeur: 700, hauteur: 500, largeurs: [480] },
};

describe("sourcesPhoto", () => {
  test("un nom inconnu (ou un nom hérité d'Object) rend null", () => {
    assert.equal(sourcesPhoto("inconnue", ESSAI), null);
    assert.equal(sourcesPhoto("toString", ESSAI), null);
    assert.equal(sourcesPhoto("inconnue"), null);
  });

  test("une entrée du manifeste rend le triplet avif / webp / jpg et ses dimensions", () => {
    const s = sourcesPhoto("ouverture-essai", ESSAI);
    assert.ok(s);
    assert.equal(s.avif, `${DOSSIER_IMAGES}/ouverture-essai-480.avif 480w, ${DOSSIER_IMAGES}/ouverture-essai-960.avif 960w, ${DOSSIER_IMAGES}/ouverture-essai-1600.avif 1600w`);
    assert.equal(s.webp, `${DOSSIER_IMAGES}/ouverture-essai-480.webp 480w, ${DOSSIER_IMAGES}/ouverture-essai-960.webp 960w, ${DOSSIER_IMAGES}/ouverture-essai-1600.webp 1600w`);
    assert.equal(s.jpg, `${DOSSIER_IMAGES}/ouverture-essai-480.jpg 480w, ${DOSSIER_IMAGES}/ouverture-essai-960.jpg 960w, ${DOSSIER_IMAGES}/ouverture-essai-1600.jpg 1600w`);
    assert.equal(s.src, `${DOSSIER_IMAGES}/ouverture-essai-960.jpg`);
    assert.equal(s.largeur, 2400);
    assert.equal(s.hauteur, 1600);
  });

  test("une image plus petite que 960 : le src est sa seule largeur", () => {
    const s = sourcesPhoto("petite-essai", ESSAI);
    assert.ok(s);
    assert.equal(s.src, `${DOSSIER_IMAGES}/petite-essai-480.jpg`);
    assert.equal(s.avif, `${DOSSIER_IMAGES}/petite-essai-480.avif 480w`);
  });

  test("le manifeste du dépôt ne décrit que des largeurs croissantes, jamais au-delà de l'origine", () => {
    for (const [nom, e] of Object.entries(MANIFESTE_IMAGES)) {
      assert.deepEqual([...e.largeurs].sort((a, b) => a - b), e.largeurs, nom);
      assert.ok(e.largeurs.every((l) => l <= Math.max(e.largeur, 480)), nom);
    }
  });
});
