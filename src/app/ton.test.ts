import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, test } from "node:test";

/**
 * Site 3.0, lot B3 — le ton : le site n'est pas un magazine, c'est un artisan qui montre ce qu'il fait (énoncé,
 * phase B, « Ce qu'on jette »). Aucun texte des sources (pages, composants, données, articles, `llms.txt`) ne reprend
 * le « faux magazine » de la maquette : numéro, saison, « la revue des intérieurs », sommaire, « dans ce numéro »,
 * « à la une », « en couverture », « grand format », code-barres.
 *
 * « Dossier » n'est pas interdit : l'espace client l'emploie au sens propre (le dossier d'un client). « La Revue »,
 * avec la majuscule, est le nom de code de la direction artistique dans les commentaires, jamais un texte affiché.
 * Les sens propres sont épargnés : « la couverture géographique » de l'assureur, « le numéro de téléphone ».
 */

const SRC = join(process.cwd(), "src");
const EXTENSIONS = [".ts", ".tsx", ".css", ".json", ".md", ".mdx", ".txt"];

function sources(dossier: string, sortie: string[] = []): string[] {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) sources(chemin, sortie);
    else if (EXTENSIONS.some((e) => chemin.endsWith(e)) && !/\.test\.tsx?$/.test(chemin)) sortie.push(chemin);
  }
  return sortie;
}

/** Ce qu'on jette de la maquette, une formule par ligne (docs/DESIGN.md, « Ce qu'on a jeté de la maquette »). */
const FAUX_MAGAZINE: [string, RegExp][] = [
  ["un numéro de revue", /\bN[°º]\s?0\d/],
  ["une saison", /(?<!\p{L})(?:Printemps|Été|Automne|Hiver)\s+20\d\d\b/u],
  ["« la revue »", /\b[Ll]a revue\b/],
  ["un sommaire", /\b[Ss]ommaire\b/],
  ["« ce numéro »", /\bce numéro\b/],
  ["« du numéro »", /\bdu numéro\b(?! de )/],
  ["« à la une »", /[Àà] la une\b/],
  ["« en couverture »", /\b[Ee]n couverture\b/],
  ["« faisait la couverture »", /\b(?:fait|faisait|ferait|fera|faire|font)\s+la couverture\b/],
  ["« grand format »", /\b[Gg]rand format\b/],
  ["un code-barres", /\b[Cc]ode-barres?\b/],
  ["« le nuancier du numéro »", /\bnuancier du numéro\b/i],
];

describe("le ton : rien de « faux magazine » dans les textes du site", () => {
  const FICHIERS = sources(SRC);

  test(`${FICHIERS.length} sources relues (hors tests)`, () => {
    assert.ok(FICHIERS.length > 150, `${FICHIERS.length} sources`);
    const constats: string[] = [];
    for (const f of FICHIERS) {
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((ligne, i) => {
          for (const [quoi, motif] of FAUX_MAGAZINE) if (motif.test(ligne)) constats.push(`${relative(SRC, f).split(sep).join("/")}:${i + 1} ${quoi}`);
        });
    }
    assert.deepEqual(constats, []);
  });

  test("les formules attrapent la maquette et épargnent les sens propres", () => {
    const touche = (texte: string) => FAUX_MAGAZINE.some(([, motif]) => motif.test(texte));
    for (const oui of ["N° 01 · Automne 2026", "N°01", "Automne 2026", "La revue des intérieurs qui changent", "la revue CoverSwap", "Sommaire", "Dans ce numéro", "Le nuancier du numéro", "À la une", "à la une cette semaine", "En couverture", "Été 2027", "Grand format · Salon", "Et si votre pièce faisait la couverture ?", "un code-barres"]) {
      assert.ok(touche(oui), oui);
    }
    for (const non of ["Votre dossier", "Le dossier de votre projet", "direction « La Revue »", "les coordonnées de l'assureur et la couverture géographique", "les 4 derniers chiffres du numéro de téléphone", "On pose en une journée", "un grand formulaire", "Numéro de devis", "une couverture de toit"]) {
      assert.ok(!touche(non), non);
    }
  });
});

/**
 * Site 3.0, lot G2 — relecture du ton de tous les textes neufs : direct, concret, sans jargon de décorateur ni
 * argument de vente creux. Les formules corrigées à la relecture ne reviennent pas dans un texte (les commentaires du
 * code, qui parlent aux développeurs, ne sont pas lus).
 */
const JARGON: [string, RegExp][] = [
  ["« premium »", /\bpremium\b/i],
  ["« Simulation IA » (on dit ce que c'est : une simulation sur votre photo)", /\b[Ss]imulation IA\b/],
  ["« camaïeu »", /camaïeu/i],
  ["« parti pris » / « deux partis »", /\bpartis? pris\b|\bdeux partis\b/i],
  ["« autre direction » (d'autres matières)", /\b(?:autres?|deux) directions?\b/i],
  ["« graphique » pour une teinte", /\bplus graphique\b/i],
  ["« sublimer »", /\bsublim/i],
  ["« intemporel »", /\bintemporel(?:le)?s?\b/i],
  ["« cosy »", /\bcosy\b/i],
];
const estCommentaire = (ligne: string) => /^\s*(?:\/\/|\/?\*|\{\/\*)/.test(ligne);

describe("le ton : pas de jargon de décorateur dans les textes du site (lot G2)", () => {
  test("aucune formule écartée à la relecture, hors commentaires du code", () => {
    const constats: string[] = [];
    for (const f of sources(SRC)) {
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((ligne, i) => {
          if (estCommentaire(ligne) || /^\s*keywords:|^\s*"covering adhésif, /.test(ligne)) return;
          for (const [quoi, motif] of JARGON) if (motif.test(ligne)) constats.push(`${relative(SRC, f).split(sep).join("/")}:${i + 1} ${quoi}`);
        });
    }
    assert.deepEqual(constats, []);
  });

  test("les formules attrapent le jargon et épargnent le reste", () => {
    const touche = (texte: string) => JARGON.some(([, motif]) => motif.test(texte));
    for (const oui of ["Covering adhésif premium", "Simulation IA gratuite", "un camaïeu de clairs", "deux partis pour une même cuisine", "un parti pris audacieux", "Le même accueil, autre direction", "deux directions possibles", "le rend plus graphique", "pour sublimer votre cuisine", "un chêne intemporel", "une ambiance cosy"]) assert.ok(touche(oui), oui);
    for (const non of ["Le même accueil, d'autres matières", "deux idées de matières", "le rend plus net", "On pose en une journée", "Simulation gratuite sur votre photo", "la direction artistique", "une intelligence artificielle"]) assert.ok(!touche(non), non);
  });
});
