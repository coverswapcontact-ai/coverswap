/**
 * La bibliothèque d'images de la série 2 (site 3.0, lot B4), en local, sans aucun appel d'API :
 *
 *   scripts/bibliotheque/serie-2.json     les 70 lignes retenues (commitées, sans chemin personnel)
 *   scripts/bibliotheque/zones-serie-2.json  les zones de mesure (copie de celle du CRM)
 *   scripts/bibliotheque/reglages.json    ce qu'on écrit à la main : titres, scènes, libellés, étiquettes
 *     + les images retenues (PNG), dans le dossier de la série (`--dossier`, par défaut ~/coverswap-photos/serie-2)
 *   → public/images/sources/<nom>.jpg        les 62 photos réencodées (mozjpeg 88, progressif), puis `npm run images`
 *   → public/images/pictos/sources/<nom>.png les 8 pictos rognés et centrés sur 512 px transparents, puis `npm run pictos`
 *   → src/data/ambiances-serie-2.ts          les compositions, les paires et les photos utiles (FICHIER GÉNÉRÉ)
 *
 * Relançable : un fichier déjà présent au même contenu (sha1) est sauté ; un contenu différent ARRÊTE le script
 * (on ne remplace jamais une image en silence : retirer le fichier à la main si c'est voulu). Le fichier de données
 * n'est réécrit que s'il change. Sans le dossier de la série, les images déjà importées suffisent.
 *
 * Honnêteté : toutes ces photos sont générées. Elles portent « Ambiance » (ou « Ambiance · avant / après » en paire),
 * jamais « Réalisation » ; le mot « Illustration » de la bibliothèque devient « Ambiance » ; les pictos n'ont pas
 * d'étiquette.
 *
 * Usage : npm run bibliotheque
 *         npm run bibliotheque -- --dossier <dossier de la série 2>
 *         npm run bibliotheque -- --depuis <bibliotheque.json> [--zones <zones-serie-2.json>]  (refait les entrées)
 *         npm run bibliotheque -- --planche [<dossier>]  (planches de contrôle des étiquettes, hors dépôt)
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, promises as fs, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DOSSIER_ENTREES = path.join(RACINE, "scripts", "bibliotheque");
export const FICHIER_SERIE = path.join(DOSSIER_ENTREES, "serie-2.json");
export const FICHIER_ZONES = path.join(DOSSIER_ENTREES, "zones-serie-2.json");
export const FICHIER_REGLAGES = path.join(DOSSIER_ENTREES, "reglages.json");
export const FICHIER_DONNEES = path.join(RACINE, "src", "data", "ambiances-serie-2.ts");
export const DOSSIER_SOURCES = path.join(RACINE, "public", "images", "sources");
export const DOSSIER_SOURCES_PICTOS = path.join(RACINE, "public", "images", "pictos", "sources");
/** Le dossier de la série sur le poste (jamais écrit en dur : le dossier personnel de la session). */
export const DOSSIER_SERIE_DEFAUT = path.join(os.homedir(), "coverswap-photos", "serie-2");

/** Le réencodage des photos (comme la série 1) : JPEG mozjpeg, progressif, 4:2:0. */
export const QUALITE_JPEG = 88;
/** Les pictos : un carré de 512 px transparent, le dessin rogné ramené à 456 px (marge de 28 px, comme la série 1). */
export const TAILLE_PICTO = 512;
export const COTE_DESSIN_PICTO = 456;
/** Un pixel compte dans le dessin d'un picto au-delà de cette opacité (0-255) : l'ombre douce reste dedans. */
export const SEUIL_ALPHA = 8;

/** Les pièces de la bibliothèque → les pièces du simulateur. Les portes vont avec les meubles (zone des portes). */
export const PIECES = { cuisine: "cuisine", "salle-de-bain": "salle-de-bain", meubles: "meubles", portes: "meubles", pro: "professionnel" };

/** Clé de composition → zone du simulateur, par pièce (`null` : la surface n'a pas de zone à elle). */
export const ZONES_PAR_PIECE = {
  cuisine: { facades: "facades-cuisine", bas: "meubles-bas", hauts: "meubles-hauts", plan: "plan-de-travail", ilot: "meubles-bas" },
  "salle-de-bain": { meuble: "meuble-vasque", tablier: "tablier-baignoire" },
  meubles: { portes: "portes-dressing", facades: "meuble-complet", dessus: null },
  professionnel: { facade: "comptoir-habillage", dessus: "comptoir-plateau" },
};

/** Les zones qui s'excluent au simulateur (`exclut` de `ZONES_REPLI`, vérifié par le test) : jamais deux dans une composition. */
export const ZONES_EXCLUSIVES = [
  ["facades-cuisine", "meubles-hauts"],
  ["facades-cuisine", "meubles-bas"],
];

/** Le libellé français d'une clé de composition, sauf réglage. */
export const LIBELLES = {
  facades: "façades",
  plan: "plan de travail",
  bas: "meubles bas",
  hauts: "meubles hauts",
  ilot: "îlot",
  meuble: "meuble vasque",
  tablier: "tablier de baignoire",
  portes: "portes",
  dessus: "dessus",
  facade: "façade du comptoir",
};

export const ETIQUETTE_PAIRE = "Ambiance · avant / après";
export const ETIQUETTE_PHOTO = "Ambiance";

const arrondi = (v) => Math.round(v * 10) / 10;
const sha1 = (octets) => createHash("sha1").update(octets).digest("hex");

/* ── Entrées ─────────────────────────────────────────────────────── */

/**
 * Les lignes commitées, tirées de `bibliotheque.json` : `retenue` seulement, `fichier` réduit au nom du fichier,
 * sans `essais`, `avant` ramené au `nom` de la ligne avant, « Illustration » devenue « Ambiance » (pictos : aucune
 * étiquette). Fonction pure.
 * @param {any[]} lignes
 */
export function entreesDepuisBibliotheque(lignes) {
  const retenues = lignes.filter((l) => l.statut === "retenue");
  const parFichier = new Map(retenues.map((l) => [path.win32.basename(l.fichier), l.nom]));
  return retenues.map((l) => {
    const avant = l.avant ? parFichier.get(l.avant) : null;
    if (l.avant && !avant) throw new Error(`${l.nom} : l'avant « ${l.avant} » n'est pas une image retenue.`);
    return {
      nom: l.nom,
      serie: l.serie,
      piece: l.piece || null,
      format: l.format,
      usages: l.usages,
      etiquette: l.serie === "pictos" ? null : "Ambiance",
      fichier: path.win32.basename(l.fichier),
      essai: l.essai,
      avant,
      composition: l.composition,
      statut: l.statut,
    };
  });
}

/**
 * Le rôle d'une ligne : un avant (paire), un après, une ambiance seule, une photo utile, un picto. Fonction pure.
 * @returns {"avant" | "apres" | "ambiance" | "utile" | "picto"}
 */
export function roleDe(e) {
  if (e.serie === "pictos") return "picto";
  if (e.serie === "enrichissement") return "utile";
  if (e.serie === "ambiances") return "ambiance";
  if (e.usages.includes("simulateur-exemple")) return "avant";
  if (e.avant) return "apres";
  throw new Error(`${e.nom} : rôle inconnu (série ${e.serie}).`);
}

/** Le nom d'un picto sur le site (le plan parallèle rejoint les autres plans : `plan-parallele`). Fonction pure. */
export function nomPicto(nom, reglages) {
  return reglages.pictos?.[nom] ?? nom;
}

/* ── Ancres et étiquettes ────────────────────────────────────────── */

/** Le centre d'une zone de mesure `[x, y, largeur, hauteur]` (en %), au dixième. Fonction pure. */
export function ancreDeZone([x, y, l, h]) {
  return { x: arrondi(x + l / 2), y: arrondi(y + h / 2) };
}

/**
 * L'étiquette par défaut : à l'aplomb du point, poussée vers le bord haut ou bas le plus proche (y = 5 ou 95), tournée
 * vers le milieu de l'image. Fonction pure.
 */
export function etiquetteAuto(ancre) {
  return { x: Math.round(ancre.x), y: ancre.y < 50 ? 5 : 95, vers: ancre.x <= 50 ? "droite" : "gauche" };
}

/** La largeur d'une carte d'ordinateur (px) pour estimer la place d'une étiquette : 720 en paysage, 432 en portrait. */
export const LARGEUR_CARTE = 720;
const largeurCarte = (portrait) => (portrait ? Math.round(LARGEUR_CARTE * 0.6) : LARGEUR_CARTE);

/** La largeur d'une étiquette « Nom · RÉF » (12,5 px, petites capitales, vignette de 18 px), en % de la carte. */
export function largeurEtiquette(texte, portrait = false) {
  return ((37 + texte.length * 6.8) / largeurCarte(portrait)) * 100;
}

/**
 * Les pastilles d'honnêteté posées sur l'image (en %, d'après `Photo` et `AvantApres`) : « Avant » en haut à gauche,
 * « Après » en haut à droite, « Ambiance · avant / après » en bas à gauche ; « Ambiance » seule en haut à gauche.
 */
export function zonesPastilles({ paire, portrait }) {
  const p = (px) => (px / largeurCarte(portrait)) * 100;
  return paire
    ? [
        { bord: "haut", de: 0, a: p(12 + 52 + 8) },
        { bord: "haut", de: 100 - p(12 + 52 + 8), a: 100 },
        { bord: "bas", de: 0, a: p(12 + 185 + 8) },
      ]
    : [{ bord: "haut", de: 0, a: p(12 + 78 + 8) }];
}

/**
 * Place les étiquettes sans réglage : au bord le plus proche (`etiquetteAuto`), hors des pastilles d'honnêteté, sans
 * sortir de l'image, sans en chevaucher une autre (sinon un cran de 7 % vers le centre, trois crans au plus). Les
 * étiquettes réglées à la main sont posées telles quelles et comptent comme obstacles. Fonction pure.
 * @param {{ texte: string; ancre: { x: number; y: number }; etiquette?: { x: number; y: number; vers: "droite" | "gauche" } }[]} surfaces
 * @param {{ paire: boolean; portrait: boolean }} cadre
 */
export function placerEtiquettes(surfaces, { paire, portrait }) {
  const hauteur = (24 / (largeurCarte(portrait) * (portrait ? 1.5 : 2 / 3))) * 100;
  const pastilles = zonesPastilles({ paire, portrait });
  const posees = [];
  const intervalle = (e, w) => (e.vers === "droite" ? [e.x, e.x + w] : [e.x - w, e.x]);
  const libre = (e, w) => {
    const [de, a] = intervalle(e, w);
    if (de < 1 || a > 99) return false;
    if (pastilles.some((p) => (p.bord === "haut" ? e.y <= 9 : e.y >= 91) && de < p.a && a > p.de)) return false;
    return posees.every((o) => Math.abs(o.y - e.y) >= hauteur + 1 || o.de >= a || o.a <= de);
  };
  const resultat = surfaces.map((s) => (s.etiquette ? { ...s.etiquette } : null));
  surfaces.forEach((s, i) => {
    if (!resultat[i]) return;
    const [de, a] = intervalle(resultat[i], largeurEtiquette(s.texte, portrait));
    posees.push({ y: resultat[i].y, de, a });
  });
  surfaces.forEach((s, i) => {
    if (resultat[i]) return;
    const w = largeurEtiquette(s.texte, portrait);
    const base = etiquetteAuto(s.ancre);
    const sens = base.y < 50 ? 1 : -1;
    let choisie = null;
    for (let cran = 0; cran < 4 && !choisie; cran++) {
      const y = base.y + sens * 7 * cran;
      for (const vers of base.vers === "droite" ? ["droite", "gauche"] : ["gauche", "droite"]) {
        // D'abord à l'aplomb du point, puis poussée juste hors d'une pastille qu'elle toucherait.
        const xs = [base.x, ...pastilles.flatMap((p) => [Math.ceil(p.a + 1), Math.floor(p.de - 1)])];
        for (const x of xs) {
          const e = { x, y, vers };
          if (Math.abs(x - base.x) <= 30 && libre(e, w)) {
            choisie = e;
            break;
          }
        }
        if (choisie) break;
      }
    }
    if (!choisie) choisie = base; // rien de libre : la planche le montrera, un réglage le corrigera
    resultat[i] = choisie;
    const [de, a] = intervalle(choisie, w);
    posees.push({ y: choisie.y, de, a });
  });
  return resultat;
}

/** Les paires de zones qui s'excluent dans une liste de zones. Fonction pure. */
export function zonesQuiSExcluent(zones) {
  return ZONES_EXCLUSIVES.filter(([a, b]) => zones.includes(a) && zones.includes(b));
}

/* ── Données ─────────────────────────────────────────────────────── */

/**
 * Les données du site : les ambiances (après, ambiances seules, photos utiles qui ont une composition), les paires
 * (un avant et ses 2 après) et les photos utiles, dans l'ordre de la bibliothèque. Un réglage qui manque, une zone
 * inconnue ou deux zones qui s'excluent : erreur (toutes listées d'un coup). Fonction pure.
 * @param {any[]} entrees  les lignes commitées
 * @param {{ mesures: Record<string, { surfaces: Record<string, number[][]> }> }} zones
 * @param {any} reglages
 */
export function construireDonnees(entrees, zones, reglages) {
  const erreurs = [];
  const images = reglages.images ?? {};
  const ambiances = [];
  const paires = [];
  const utiles = [];

  const surfacesDe = (e, piece, r, largeur, hauteur) => {
    const surfaces = [];
    const table = ZONES_PAR_PIECE[piece] ?? {};
    for (const [cle, c] of Object.entries(e.composition ?? {})) {
      const libelle = r.libelles?.[cle] ?? LIBELLES[cle];
      if (!libelle) erreurs.push(`${e.nom} : pas de libellé pour « ${cle} »`);
      let zone;
      if (r.zones && cle in r.zones) zone = r.zones[cle];
      else if (cle in table) zone = table[cle];
      else erreurs.push(`${e.nom} : pas de zone pour « ${cle} » dans la pièce ${piece} (réglage zones.${cle}, ou null)`);
      const mesures = zones.mesures[e.avant ?? e.nom]?.surfaces?.[cle];
      const ancre = r.ancres?.[cle] ?? (mesures?.[0] ? ancreDeZone(mesures[0]) : null);
      if (!ancre) {
        erreurs.push(`${e.nom} : pas de zone de mesure pour « ${cle} » (réglage ancres.${cle})`);
        continue;
      }
      surfaces.push({
        surface: libelle,
        ref: c.ref,
        nom: c.nom,
        ...(c.prevue && c.prevue !== c.ref ? { prevue: c.prevue } : {}),
        ...(zone ? { zone } : {}),
        ancre,
        etiquette: r.etiquettes?.[cle] ?? null,
      });
    }
    const places = placerEtiquettes(
      surfaces.map((s) => ({ texte: `${s.nom} · ${s.ref}`, ancre: s.ancre, etiquette: s.etiquette ?? undefined })),
      { paire: !!e.avant, portrait: hauteur > largeur },
    );
    surfaces.forEach((s, i) => (s.etiquette = places[i]));
    const posees = surfaces.filter((s) => s.zone).map((s) => s.zone);
    for (const [a, b] of zonesQuiSExcluent(posees)) erreurs.push(`${e.nom} : les zones ${a} et ${b} s'excluent (réglage zones)`);
    if (new Set(posees).size !== posees.length) erreurs.push(`${e.nom} : une zone reçoit deux références`);
    if (surfaces.length > 3) erreurs.push(`${e.nom} : ${surfaces.length} étiquettes (3 au plus)`);
    return surfaces;
  };

  for (const e of entrees) {
    const role = roleDe(e);
    if (role === "picto") continue;
    const r = images[e.nom];
    if (!r) {
      erreurs.push(`${e.nom} : aucun réglage (images.${e.nom})`);
      continue;
    }
    const [largeur, hauteur] = e.format.split("x").map(Number);
    if (role === "avant") {
      const apres = entrees.filter((x) => x.avant === e.nom).map((x) => x.nom);
      if (apres.length !== 2) erreurs.push(`${e.nom} : ${apres.length} après (2 attendus)`);
      if (!r.scene) erreurs.push(`${e.nom} : réglage « scene » manquant`);
      paires.push({ avant: e.nom, piece: PIECES[e.piece], ratio: `${largeur} / ${hauteur}`, scene: r.scene ?? "", etiquette: ETIQUETTE_PAIRE, apres });
      if (!PIECES[e.piece]) erreurs.push(`${e.nom} : pièce inconnue ${e.piece}`);
      continue;
    }
    if (role === "utile") {
      if (!r.alt) erreurs.push(`${e.nom} : réglage « alt » manquant`);
      utiles.push({ image: e.nom, alt: r.alt ?? "", etiquette: ETIQUETTE_PHOTO, ...(e.composition ? { ambiance: e.nom } : {}) });
      if (!e.composition) continue;
    }
    const piece = r.piece ?? PIECES[e.piece];
    if (!piece) erreurs.push(`${e.nom} : pièce inconnue (réglage « piece »)`);
    for (const champ of ["titre", "scene"]) if (!r[champ]) erreurs.push(`${e.nom} : réglage « ${champ} » manquant`);
    ambiances.push({
      id: e.nom,
      image: e.nom,
      ...(e.avant ? { avant: e.avant } : {}),
      piece,
      titre: r.titre ?? "",
      scene: r.scene ?? "",
      inspiration: r.inspiration ?? e.usages.includes("inspirations"),
      surfaces: surfacesDe(e, piece, r, largeur, hauteur),
    });
  }
  for (const nom of Object.keys(images)) if (!entrees.some((e) => e.nom === nom)) erreurs.push(`réglage pour une image inconnue : ${nom}`);
  if (erreurs.length > 0) {
    const erreur = new Error(`Bibliothèque : ${erreurs.length} problème(s)\n  - ${erreurs.join("\n  - ")}`);
    erreur.erreurs = erreurs;
    throw erreur;
  }
  return { ambiances, paires, utiles };
}

const chaine = (s) => JSON.stringify(s);
const point = (p) => `{ x: ${p.x}, y: ${p.y} }`;

/**
 * Le texte de `src/data/ambiances-serie-2.ts`. Fonction pure : les mêmes données donnent toujours le même texte.
 * @param {ReturnType<typeof construireDonnees>} donnees
 */
export function texteDonnees({ ambiances, paires, utiles }) {
  const surface = (s) =>
    `      { surface: ${chaine(s.surface)}, ref: ${chaine(s.ref)}, nom: ${chaine(s.nom)}${s.prevue ? `, prevue: ${chaine(s.prevue)}` : ""}${s.zone ? `, zone: ${chaine(s.zone)}` : ""}, ancre: ${point(s.ancre)}, etiquette: { x: ${s.etiquette.x}, y: ${s.etiquette.y}, vers: ${chaine(s.etiquette.vers)} } },`;
  const ambiance = (a) =>
    [
      "  {",
      `    id: ${chaine(a.id)},`,
      `    image: ${chaine(a.image)},`,
      ...(a.avant ? [`    avant: ${chaine(a.avant)},`] : []),
      `    piece: ${chaine(a.piece)},`,
      `    titre: ${chaine(a.titre)},`,
      `    scene: ${chaine(a.scene)},`,
      `    inspiration: ${a.inspiration},`,
      "    surfaces: [",
      ...a.surfaces.map(surface),
      "    ],",
      "  },",
    ].join("\n");
  const paire = (p) =>
    `  { avant: ${chaine(p.avant)}, piece: ${chaine(p.piece)}, ratio: ${chaine(p.ratio)}, scene: ${chaine(p.scene)}, etiquette: ${chaine(p.etiquette)}, apres: [${p.apres.map(chaine).join(", ")}] },`;
  const utile = (u) => `  { image: ${chaine(u.image)}, alt: ${chaine(u.alt)}, etiquette: ${chaine(u.etiquette)}${u.ambiance ? `, ambiance: ${chaine(u.ambiance)}` : ""} },`;
  return [
    "/**",
    " * FICHIER GÉNÉRÉ par `scripts/bibliotheque.mjs` (`npm run bibliotheque`) : ne pas éditer à la main.",
    " * On modifie `scripts/bibliotheque/reglages.json` (titres, scènes, libellés, étiquettes), puis on relance.",
    " *",
    " * La série 2 (site 3.0, lot B4) : des logements ordinaires, un avant et deux après par pièce, les références",
    " * relevées sur chaque image (ΔE 2000 ≤ 12, `prevue` = la référence de la direction artistique quand l'étiquette",
    " * en a changé). Toutes ces images sont générées : « Ambiance », ou « Ambiance · avant / après » en paire.",
    " */",
    'import type { Ambiance, PaireAmbiance, PhotoUtile } from "./ambiances";',
    "",
    "/** Les après, les ambiances seules et les photos utiles qui montrent une matière. */",
    "export const AMBIANCES_SERIE_2: readonly Ambiance[] = [",
    ...ambiances.map(ambiance),
    "];",
    "",
    "/** Chaque avant et ses deux après (même cadrage) : curseurs avant / après et exemples du simulateur. */",
    "export const PAIRES_SERIE_2: readonly PaireAmbiance[] = [",
    ...paires.map(paire),
    "];",
    "",
    "/** Les photos utiles au site (pose, mesure, échantillons, finition, usure, outils). */",
    "export const PHOTOS_UTILES: readonly PhotoUtile[] = [",
    ...utiles.map(utile),
    "];",
    "",
  ].join("\n");
}

/** Les données depuis les seules entrées commitées (ce que lit le test, sans le dossier de la série). */
export function donneesDepuisEntrees({ serie = FICHIER_SERIE, zones = FICHIER_ZONES, reglages = FICHIER_REGLAGES } = {}) {
  const lire = (f) => JSON.parse(readFileSync(f, "utf8"));
  return construireDonnees(lire(serie), lire(zones), lire(reglages));
}

/* ── Images ──────────────────────────────────────────────────────── */

/**
 * Écrit `octets` dans `cible` : absent → écrit ; même contenu → sauté ; contenu différent → erreur (rien n'est
 * remplacé en silence).
 * @returns {Promise<"ecrit" | "saute">}
 */
export async function ecrireSansEcraser(cible, octets) {
  if (existsSync(cible)) {
    if (sha1(await fs.readFile(cible)) === sha1(octets)) return "saute";
    throw new Error(`${path.relative(RACINE, cible)} existe déjà avec un autre contenu : arrêt (le retirer à la main si le remplacement est voulu).`);
  }
  await fs.writeFile(cible, octets);
  return "ecrit";
}

/** Une photo de la série → le JPEG de `sources/`. */
export async function encoderPhoto(png) {
  const sharp = (await import("sharp")).default;
  return sharp(png).rotate().jpeg({ quality: QUALITE_JPEG, mozjpeg: true, progressive: true, chromaSubsampling: "4:2:0" }).toBuffer();
}

/** Un picto de la série → rogné à son dessin (opacité > `SEUIL_ALPHA`), centré sur un carré transparent de 512 px. */
export async function encoderPicto(png) {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let [x0, y0, x1, y1] = [info.width, info.height, -1, -1];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > SEUIL_ALPHA) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error("picto vide (aucun pixel opaque)");
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  const marge = (TAILLE_PICTO - COTE_DESSIN_PICTO) / 2;
  const dessin = await sharp(png)
    .ensureAlpha()
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize(COTE_DESSIN_PICTO, COTE_DESSIN_PICTO, { fit: "contain", background: transparent })
    .toBuffer();
  return sharp(dessin).extend({ top: marge, bottom: marge, left: marge, right: marge, background: transparent }).png({ compressionLevel: 9 }).toBuffer();
}

/**
 * Importe les 62 photos et les 8 pictos depuis le dossier de la série (`<dossier>/<serie>/<fichier>`). Une image déjà
 * présente au même contenu est sautée ; sans le dossier, les images déjà importées suffisent (une absente : erreur).
 */
export async function importerImages({ entrees, reglages, dossier, sources = DOSSIER_SOURCES, sourcesPictos = DOSSIER_SOURCES_PICTOS, journal = console.log }) {
  const bilan = { ecrites: 0, sautees: 0, deja: 0 };
  const dossierPresent = dossier && existsSync(dossier);
  for (const e of entrees) {
    const picto = roleDe(e) === "picto";
    const cible = picto ? path.join(sourcesPictos, `${nomPicto(e.nom, reglages)}.png`) : path.join(sources, `${e.nom}.jpg`);
    if (!dossierPresent) {
      if (!existsSync(cible)) throw new Error(`${path.relative(RACINE, cible)} manque et le dossier de la série est introuvable (--dossier).`);
      bilan.deja++;
      continue;
    }
    const original = await fs.readFile(path.join(dossier, e.serie, e.fichier));
    const octets = picto ? await encoderPicto(original) : await encoderPhoto(original);
    const resultat = await ecrireSansEcraser(cible, octets);
    if (resultat === "ecrit") {
      bilan.ecrites++;
      journal(`importée : ${path.relative(RACINE, cible)} (${Math.round(octets.length / 1024)} Ko)`);
    } else bilan.sautees++;
  }
  return bilan;
}

/* ── Planche de contrôle (hors dépôt) ────────────────────────────── */

const echapper = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Une planche par groupe de 4 ambiances : l'image à la taille d'une carte d'ordinateur, le point, le trait et
 * l'étiquette à leur taille réelle (12,5 px), et les pastilles d'honnêteté (« Avant », « Après », « Ambiance… »)
 * pour voir les chevauchements.
 */
export async function ecrirePlanches({ ambiances, dossier, sources = DOSSIER_SOURCES, largeurPaysage = 720, journal = console.log }) {
  const sharp = (await import("sharp")).default;
  await fs.mkdir(dossier, { recursive: true });
  const cartes = [];
  for (const a of ambiances) {
    const meta = await sharp(path.join(sources, `${a.image}.jpg`)).metadata();
    const L = meta.width >= meta.height ? largeurPaysage : Math.round(largeurPaysage * 0.6);
    const H = Math.round((L * meta.height) / meta.width);
    const fond = await sharp(path.join(sources, `${a.image}.jpg`)).resize(L, H).toBuffer();
    const boites = [];
    const pastille = (texte, x, y, droite = false) => {
      const w = 16 + texte.length * 6.6;
      const gx = droite ? L - 12 - w : x;
      boites.push(`<rect x="${gx}" y="${y}" width="${w}" height="24" rx="4" fill="#fff" fill-opacity="0.6" stroke="#B3261E" stroke-dasharray="3 2"/><text x="${gx + 8}" y="${y + 16}" font-size="12" font-family="Arial" fill="#B3261E">${echapper(texte)}</text>`);
    };
    if (a.avant) {
      pastille("Avant", 12, 12);
      pastille("Après", 0, 12, true);
      pastille(ETIQUETTE_PAIRE, 12, H - 36);
      boites.push(`<line x1="${L / 2}" y1="0" x2="${L / 2}" y2="${H}" stroke="#fff" stroke-opacity="0.5" stroke-dasharray="4 4"/>`);
    } else pastille(ETIQUETTE_PHOTO, 12, 12);
    const marques = a.surfaces.map((s, i) => {
      const ax = (s.ancre.x / 100) * L;
      const ay = (s.ancre.y / 100) * H;
      const ex = (s.etiquette.x / 100) * L;
      const ey = (s.etiquette.y / 100) * H;
      const texte = `${s.nom} · ${s.ref}`;
      const w = 37 + texte.length * 6.8;
      const gx = s.etiquette.vers === "gauche" ? ex - w : ex;
      const deborde = gx < 0 || gx + w > L;
      return [
        `<line x1="${ax}" y1="${ay}" x2="${ex}" y2="${ey}" stroke="#fff" stroke-width="1.2"/>`,
        `<circle cx="${ax}" cy="${ay}" r="4.5" fill="#fff" stroke="#000" stroke-opacity="0.4"/>`,
        `<rect x="${gx}" y="${ey - 12}" width="${w}" height="24" rx="12" fill="#fff" fill-opacity="0.88" stroke="${deborde ? "#B3261E" : "#000"}" stroke-opacity="${deborde ? 1 : 0.2}" stroke-width="${deborde ? 2 : 1}"/>`,
        `<circle cx="${gx + 12}" cy="${ey}" r="9" fill="#ccc"/>`,
        `<text x="${gx + 26}" y="${ey + 4}" font-size="11.5" font-family="Arial" fill="#2A211B">${i + 1}. ${echapper(texte)}</text>`,
      ].join("");
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H + 30}"><rect y="${H}" width="${L}" height="30" fill="#222"/><text x="8" y="${H + 20}" font-size="14" font-family="Arial" fill="#fff">${echapper(a.id)}</text>${boites.join("")}${marques.join("")}</svg>`;
    const carte = await sharp({ create: { width: L, height: H + 30, channels: 3, background: "#222" } })
      .composite([{ input: fond, top: 0, left: 0 }, { input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();
    cartes.push({ carte, L, H: H + 30 });
  }
  const fichiers = [];
  for (let i = 0; i < cartes.length; i += 4) {
    const groupe = cartes.slice(i, i + 4);
    const largeur = 2 * largeurPaysage + 30;
    const lignes = [groupe.slice(0, 2), groupe.slice(2, 4)].filter((l) => l.length);
    const hauteurs = lignes.map((l) => Math.max(...l.map((c) => c.H)));
    const hauteur = hauteurs.reduce((s, h) => s + h + 10, 10);
    const composites = [];
    let y = 10;
    lignes.forEach((ligne, j) => {
      let x = 10;
      for (const c of ligne) {
        composites.push({ input: c.carte, top: y, left: x });
        x += c.L + 10;
      }
      y += hauteurs[j] + 10;
    });
    const fichier = path.join(dossier, `planche-${String(i / 4 + 1).padStart(2, "0")}.jpg`);
    await sharp({ create: { width: largeur, height: hauteur, channels: 3, background: "#111" } }).composite(composites).jpeg({ quality: 82 }).toFile(fichier);
    fichiers.push(fichier);
  }
  journal(`${fichiers.length} planche(s) dans ${dossier}`);
  return fichiers;
}

/* ── Programme ───────────────────────────────────────────────────── */

const valeurOption = (argv, nom) => {
  const i = argv.indexOf(nom);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
};

export async function principal(argv = process.argv.slice(2), journal = console.log) {
  const depuis = valeurOption(argv, "--depuis");
  if (depuis) {
    const entrees = entreesDepuisBibliotheque(JSON.parse(await fs.readFile(depuis, "utf8")));
    await fs.mkdir(DOSSIER_ENTREES, { recursive: true });
    await fs.writeFile(FICHIER_SERIE, `${JSON.stringify(entrees, null, 1)}\n`, "utf8");
    journal(`${path.relative(RACINE, FICHIER_SERIE)} : ${entrees.length} lignes`);
    const zones = valeurOption(argv, "--zones");
    if (zones) {
      await fs.copyFile(zones, FICHIER_ZONES);
      journal(`${path.relative(RACINE, FICHIER_ZONES)} : copiée`);
    }
    return;
  }

  const entrees = JSON.parse(await fs.readFile(FICHIER_SERIE, "utf8"));
  const reglages = JSON.parse(await fs.readFile(FICHIER_REGLAGES, "utf8"));
  const donnees = donneesDepuisEntrees();

  if (argv.includes("--planche")) {
    const dossier = valeurOption(argv, "--planche") ?? path.join(os.tmpdir(), "coverswap-bibliotheque");
    await ecrirePlanches({ ambiances: donnees.ambiances, dossier, journal });
    return;
  }

  const dossier = valeurOption(argv, "--dossier") ?? DOSSIER_SERIE_DEFAUT;
  const bilan = await importerImages({ entrees, reglages, dossier, journal });
  journal(`images : ${bilan.ecrites} importée(s), ${bilan.sautees} déjà là au même contenu${bilan.deja ? `, ${bilan.deja} déjà importée(s) (dossier de la série absent)` : ""}.`);

  const texte = texteDonnees(donnees);
  const ancien = existsSync(FICHIER_DONNEES) ? (await fs.readFile(FICHIER_DONNEES, "utf8")).split("\r\n").join("\n") : "";
  if (ancien !== texte) {
    await fs.writeFile(FICHIER_DONNEES, texte, "utf8");
    journal(`données réécrites : ${path.relative(RACINE, FICHIER_DONNEES)} (${donnees.ambiances.length} ambiances, ${donnees.paires.length} paires, ${donnees.utiles.length} photos utiles)`);
  } else journal("données inchangées");

  const { preparerImages } = await import("./preparer-images.mjs");
  await preparerImages({ journal });
  execFileSync(process.execPath, [path.join(RACINE, "scripts", "preparer-pictos.mjs")], { stdio: "inherit" });
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  principal().catch((erreur) => {
    console.error(erreur instanceof Error ? erreur.message : erreur);
    process.exit(1);
  });
}
