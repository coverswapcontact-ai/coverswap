import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import {
  ETIQUETTE_PAIRE,
  ZONES_EXCLUSIVES,
  ZONES_PAR_PIECE,
  ancreDeZone,
  construireDonnees,
  donneesDepuisEntrees,
  ecrireSansEcraser,
  entreesDepuisBibliotheque,
  etiquetteAuto,
  nomPicto,
  placerEtiquettes,
  roleDe,
  texteDonnees,
  zonesPastilles,
} from "../../scripts/bibliotheque.mjs";
import { AMBIANCES } from "@/data/ambiances";
import { MANIFESTE_IMAGES } from "./images-manifeste";
import { ZONES_REPLI } from "./simulateur/zones";

/**
 * Site 3.0, lot B4 — la bibliothèque de la série 2 (`npm run bibliotheque`). Tout se vérifie depuis les SEULES entrées
 * commitées (`scripts/bibliotheque/`) : la CI n'a pas le dossier des photos d'origine.
 */
const RACINE = process.cwd();
const ENTREES = path.join(RACINE, "scripts", "bibliotheque");
type Entree = { nom: string; serie: string; piece: string | null; format: string; usages: string[]; etiquette: string | null; fichier: string; avant: string | null; composition: Record<string, { ref: string; prevue: string; nom: string }> | null; statut: string };
const lireJson = (f: string) => JSON.parse(readFileSync(path.join(ENTREES, f), "utf8"));
const entrees = lireJson("serie-2.json") as Entree[];
const zones = lireJson("zones-serie-2.json");
const reglages = lireJson("reglages.json");

describe("les entrées commitées", () => {
  test("70 lignes retenues : 18 avants, 36 après, 6 photos utiles, 2 ambiances, 8 pictos", () => {
    assert.equal(entrees.length, 70);
    const roles = entrees.map((e) => roleDe(e));
    assert.deepEqual(Object.fromEntries(["avant", "apres", "utile", "ambiance", "picto"].map((r) => [r, roles.filter((x) => x === r).length])), { avant: 18, apres: 36, utile: 6, ambiance: 2, picto: 8 });
    assert.ok(entrees.every((e) => e.statut === "retenue"));
  });

  test("aucun chemin personnel, aucun essai, jamais « Illustration » : « Ambiance » partout, les pictos sans étiquette", () => {
    for (const fichier of ["serie-2.json", "zones-serie-2.json", "reglages.json"]) {
      const texte = readFileSync(path.join(ENTREES, fichier), "utf8");
      assert.ok(!/[A-Za-z]:\\\\|Users|lucas|coverswap-photos/.test(texte), `${fichier} : chemin personnel`);
      assert.ok(!texte.includes("Illustration"), `${fichier} : « Illustration »`);
    }
    for (const e of entrees) {
      assert.ok(!("essais" in e), e.nom);
      assert.match(e.fichier, /^[a-z0-9-]+\.png$/, e.nom);
      assert.equal(e.etiquette, e.serie === "pictos" ? null : "Ambiance", e.nom);
    }
    assert.ok(!/C:\\|Users\\|lucas/.test(readFileSync(path.join(RACINE, "scripts", "bibliotheque.mjs"), "utf8")), "le script n'écrit aucun chemin personnel");
  });

  test("chaque après vise le nom de son avant ; 2 après par avant", () => {
    const avants = entrees.filter((e) => roleDe(e) === "avant").map((e) => e.nom);
    for (const nom of avants) assert.equal(entrees.filter((e) => e.avant === nom).length, 2, nom);
    for (const e of entrees.filter((x) => x.avant)) assert.ok(avants.includes(e.avant!), `${e.nom} → ${e.avant}`);
  });

  test("les 70 noms : 62 photos au manifeste, 8 pictos préparés (512 px transparents, 128 et 256 px en AVIF et WebP)", () => {
    const photos = entrees.filter((e) => roleDe(e) !== "picto");
    assert.equal(photos.length, 62);
    for (const e of photos) {
      const m = MANIFESTE_IMAGES[e.nom];
      assert.ok(m, `${e.nom} absent du manifeste`);
      assert.equal(`${m.largeur}x${m.hauteur}`, e.format, e.nom);
    }
    const pictos = entrees.filter((e) => roleDe(e) === "picto").map((e) => nomPicto(e.nom, reglages));
    assert.ok(pictos.includes("plan-parallele") && !pictos.includes("picto-plan-parallele"), "le plan parallèle rejoint les plans");
    for (const nom of pictos) {
      const source = path.join(RACINE, "public", "images", "pictos", "sources", `${nom}.png`);
      const png = readFileSync(source);
      assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20), png[25]], [512, 512, 6], `${nom} : 512 × 512 avec alpha`);
      for (const t of [128, 256]) for (const ext of ["avif", "webp"]) assert.ok(existsSync(path.join(RACINE, "public", "images", "pictos", `${nom}-${t}.${ext}`)), `${nom}-${t}.${ext}`);
    }
  });
});

describe("les données générées", () => {
  test("src/data/ambiances-serie-2.ts est exactement ce que le script écrit depuis les entrées commitées", () => {
    const fichier = readFileSync(path.join(RACINE, "src", "data", "ambiances-serie-2.ts"), "utf8").split("\r\n").join("\n");
    assert.match(fichier, /FICHIER GÉNÉRÉ par `scripts\/bibliotheque\.mjs`.*ne pas éditer/);
    assert.equal(texteDonnees(donneesDepuisEntrees()), fichier);
  });

  test("40 ambiances (36 après, 2 ambiances, 2 photos utiles), 18 paires, 6 photos utiles, dans l'ordre de la bibliothèque", () => {
    const { ambiances, paires, utiles } = donneesDepuisEntrees();
    assert.deepEqual([ambiances.length, paires.length, utiles.length], [40, 18, 6]);
    assert.equal(ambiances.filter((a: { inspiration: boolean }) => a.inspiration).length, 38);
    assert.equal(paires[0].avant, "cuisine-bordeaux-brillante-avant", "la bordeaux ouvre la série");
    assert.ok(paires.every((p: { etiquette: string }) => p.etiquette === ETIQUETTE_PAIRE));
  });

  test("aucune composition ne pose deux zones qui s'excluent ; la table des exclusions est celle du simulateur", () => {
    const declarees = ZONES_REPLI.pieces.flatMap((p) => p.zones.flatMap((z) => z.exclut.map((x) => [z.id, x].sort().join("|"))));
    assert.deepEqual([...new Set(declarees)].sort(), ZONES_EXCLUSIVES.map((p: string[]) => [...p].sort().join("|")).sort());
    for (const a of AMBIANCES) {
      const piece = ZONES_REPLI.pieces.find((p) => p.id === a.piece)!;
      const posees = a.surfaces.filter((s) => s.zone).map((s) => s.zone!);
      for (const z of posees) for (const x of piece.zones.find((y) => y.id === z)!.exclut) assert.ok(!posees.includes(x), `${a.id} : ${z} et ${x}`);
    }
  });

  test("chaque zone de la table par pièce existe au simulateur", () => {
    for (const [piece, table] of Object.entries(ZONES_PAR_PIECE) as [string, Record<string, string | null>][]) {
      const p = ZONES_REPLI.pieces.find((x) => x.id === piece);
      assert.ok(p, piece);
      for (const z of Object.values(table)) if (z) assert.ok(p!.zones.some((x) => x.id === z), `${piece} : ${z}`);
    }
  });

  test("ancre = centre de la 1ʳᵉ zone de mesure, sauf réglage ; étiquettes dans l'image, hors des pastilles d'honnêteté", () => {
    const bordeaux = AMBIANCES.find((a) => a.id === "cuisine-bordeaux-brillante-apres-couleur")!;
    assert.deepEqual(bordeaux.surfaces[0].ancre, ancreDeZone(zones.mesures["cuisine-bordeaux-brillante-avant"].surfaces.facades[0]));
    const ilot = AMBIANCES.find((a) => a.id === "cuisine-ilot-maison-apres-neutre")!;
    assert.deepEqual(ilot.surfaces[0].ancre, reglages.images["cuisine-ilot-maison-apres-neutre"].ancres.facades);
    for (const a of AMBIANCES.slice(15)) {
      const pastilles = zonesPastilles({ paire: !!a.avant, portrait: MANIFESTE_IMAGES[a.image].hauteur > MANIFESTE_IMAGES[a.image].largeur });
      for (const s of a.surfaces) {
        assert.ok(s.etiquette.y >= 5 && s.etiquette.y <= 95, `${a.id} : y ${s.etiquette.y}`);
        if (s.etiquette.y <= 9 || s.etiquette.y >= 91) {
          const bord = s.etiquette.y <= 9 ? "haut" : "bas";
          const pres = pastilles.filter((p: { bord: string }) => p.bord === bord);
          // Le point de départ de l'étiquette n'est jamais dans une pastille.
          assert.ok(pres.every((p: { de: number; a: number }) => s.etiquette.x <= p.de || s.etiquette.x >= p.a), `${a.id} : ${s.ref} sur une pastille`);
        }
      }
    }
  });
});

describe("les fonctions du script", () => {
  test("entreesDepuisBibliotheque : nom de fichier seul, avant ramené au nom, « Illustration » → « Ambiance », pictos sans étiquette, essais retirés", () => {
    const lignes = [
      { nom: "x-avant", serie: "quotidien", piece: "cuisine", format: "1536x1024", usages: ["avant-apres", "simulateur-exemple"], etiquette: "Ambiance", fichier: "C:\\a\\b\\x-avant-2.png", essai: 2, avant: null, composition: null, statut: "retenue" },
      { nom: "x-apres-bois", serie: "quotidien", piece: "cuisine", format: "1536x1024", usages: ["avant-apres", "inspirations"], etiquette: "Ambiance", fichier: "C:\\a\\b\\x-apres-bois-1.png", essai: 1, avant: "x-avant-2.png", composition: {}, statut: "retenue", essais: [{ essai: 1 }] },
      { nom: "u", serie: "enrichissement", piece: "", format: "1536x1024", usages: [], etiquette: "Illustration", fichier: "C:\\a\\u-1.png", essai: 1, avant: null, composition: null, statut: "retenue" },
      { nom: "picto-p", serie: "pictos", piece: "", format: "1024x1024", usages: [], etiquette: "Illustration", fichier: "C:\\a\\picto-p-1.png", essai: 1, avant: null, composition: null, statut: "retenue" },
      { nom: "rejetee", serie: "quotidien", piece: "cuisine", format: "1536x1024", usages: [], etiquette: "Ambiance", fichier: "C:\\a\\r.png", essai: 1, avant: null, composition: null, statut: "rejetee" },
    ];
    const e = entreesDepuisBibliotheque(lignes);
    assert.deepEqual(e.map((x: Entree) => [x.nom, x.fichier, x.avant, x.etiquette, x.piece]), [
      ["x-avant", "x-avant-2.png", null, "Ambiance", "cuisine"],
      ["x-apres-bois", "x-apres-bois-1.png", "x-avant", "Ambiance", "cuisine"],
      ["u", "u-1.png", null, "Ambiance", null],
      ["picto-p", "picto-p-1.png", null, null, null],
    ]);
    assert.ok(!("essais" in e[1]));
    assert.throws(() => entreesDepuisBibliotheque([{ ...lignes[1], avant: "inconnu.png" }]), /avant/);
  });

  test("ancre et étiquette par défaut : centre de la zone ; bord le plus proche, tournée vers le milieu", () => {
    assert.deepEqual(ancreDeZone([45, 61, 8, 10]), { x: 49, y: 66 });
    assert.deepEqual(ancreDeZone([13, 56, 8, 1.2]), { x: 17, y: 56.6 });
    assert.deepEqual(etiquetteAuto({ x: 49, y: 66 }), { x: 49, y: 95, vers: "droite" });
    assert.deepEqual(etiquetteAuto({ x: 70, y: 20 }), { x: 70, y: 5, vers: "gauche" });
  });

  test("placement : hors de la pastille « Ambiance · avant / après », sans chevauchement, un réglage reste tel quel", () => {
    const [a, b] = placerEtiquettes(
      [
        { texte: "Statuary White · NE31", ancre: { x: 10, y: 60 } },
        { texte: "Royal Blue · RM23", ancre: { x: 30, y: 70 } },
      ],
      { paire: true, portrait: false },
    ) as { x: number; y: number; vers: string }[];
    const pastille = zonesPastilles({ paire: true, portrait: false }).find((p: { bord: string }) => p.bord === "bas")!;
    assert.ok(a.y < 91 || a.x >= pastille.a, "la première ne touche pas la pastille");
    assert.ok(a.y !== b.y || a.x + 30 <= b.x || b.x + 30 <= a.x, "pas l'une sur l'autre");
    const [c] = placerEtiquettes([{ texte: "X · 1", ancre: { x: 50, y: 50 }, etiquette: { x: 3, y: 95, vers: "droite" } }], { paire: true, portrait: false });
    assert.deepEqual(c, { x: 3, y: 95, vers: "droite" });
  });

  test("construireDonnees : un réglage manquant ou deux zones qui s'excluent arrêtent tout, chaque problème nommé", () => {
    const sansReglage = { ...reglages, images: { ...reglages.images } };
    delete sansReglage.images["cuisine-merisier-apres-neutre"];
    assert.throws(() => construireDonnees(entrees, zones, sansReglage), /cuisine-merisier-apres-neutre : aucun réglage/);
    const sansZones = { ...reglages, images: { ...reglages.images, "cuisine-ilot-maison-apres-neutre": { ...reglages.images["cuisine-ilot-maison-apres-neutre"], zones: undefined } } };
    assert.throws(() => construireDonnees(entrees, zones, sansZones), /cuisine-ilot-maison-apres-neutre : les zones facades-cuisine et meubles-bas s'excluent/);
    const sansTitre = { ...reglages, images: { ...reglages.images, "amb-couloir-portes": { scene: "x" } } };
    assert.throws(() => construireDonnees(entrees, zones, sansTitre), /amb-couloir-portes : réglage « titre » manquant/);
  });

  test("ecrireSansEcraser : écrit, saute le même contenu, s'arrête sur un contenu différent", async () => {
    const dossier = mkdtempSync(path.join(os.tmpdir(), "bibliotheque-"));
    try {
      const cible = path.join(dossier, "a.jpg");
      assert.equal(await ecrireSansEcraser(cible, Buffer.from("un")), "ecrit");
      assert.equal(await ecrireSansEcraser(cible, Buffer.from("un")), "saute");
      await assert.rejects(ecrireSansEcraser(cible, Buffer.from("deux")), /autre contenu : arrêt/);
      assert.equal(readFileSync(cible, "utf8"), "un", "rien n'est remplacé");
    } finally {
      rmSync(dossier, { recursive: true, force: true });
    }
  });
});
