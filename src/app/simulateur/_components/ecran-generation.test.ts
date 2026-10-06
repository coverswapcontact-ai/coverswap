import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FORMULAIRE_VIDE } from "./Formulaires";
import { EcranGeneration, EcranSansPhoto } from "./EcranGeneration";
import type { Selection } from "@/lib/simulateur/reprise";
import { ZONES_REPLI } from "@/lib/simulateur/zones";

/**
 * Site 3.0, lot E1 : `Simulateur.tsx` allégé, sans changer le comportement — l'écran 3 pendant et après une génération
 * (`EcranGeneration`, `EcranSansPhoto`) et le branchement de la feuille des matières (`useFeuilleCatalogue`) sortent du
 * composant ; les lignes que lisent `entonnoir.test.ts` et `tunnel.test.ts` y restent.
 */
const lire = (f: string) => readFileSync(path.join(process.cwd(), "src/app/simulateur/_components", f), "utf8");
const CUISINE = ZONES_REPLI.pieces[0];
const film = (ref: string, nom: string): Selection => ({ ref, nom, famille: "couleur", finition: "mat", categorie: "", tags: [], image: "" });
const PHOTO = "data:image/jpeg;base64,AAAA";
const rien = () => undefined;
const BASE: ComponentProps<typeof EcranGeneration> = {
  piece: CUISINE,
  photo: PHOTO,
  // Dans le désordre : l'écran suit l'ordre des zones de la pièce.
  selections: { credence: film("NE31", "Marbre"), "facades-cuisine": film("NF13", "Deep Green") },
  analyse: null,
  sondage: null,
  travail: { travailId: "cmun000000000001", lanceLe: 1, attenteEstimeeS: 75 },
  echec: null,
  peutReessayer: false,
  attenteReessai: null,
  onReessayer: rien,
  envoye: false,
  formulaire: FORMULAIRE_VIDE,
  onFormulaire: rien,
  avecVille: true,
  envoiEnCours: false,
  onEnvoyer: rien,
  onRevenir: rien,
  onNouvelle: rien,
  onJeton: rien,
};
const rendre = (maj: Partial<ComponentProps<typeof EcranGeneration>> = {}) => renderToStaticMarkup(createElement(EcranGeneration, { ...BASE, ...maj })).replace(/&#x27;|&apos;/g, "'");

describe("lot E1 : Simulateur.tsx allégé", () => {
  test("nettement sous le plafond de 600 lignes ; l'attente, le secours et la feuille vivent ailleurs", () => {
    const s = lire("Simulateur.tsx");
    const lignes = s.split("\n").length;
    assert.ok(lignes < 560, `Simulateur.tsx : ${lignes} lignes`);
    // Lot F7 : l'attente, l'échec, le résultat et la feuille sont chargés à part (`ecrans-differes.ts`, préchargés à l'écran Photo).
    assert.match(s, /import \{ DemandeApresRendu, EcranGeneration, EcranResultat, EcranSansPhoto, FeuilleCatalogue, prechargerLesEcrans \} from "\.\/ecrans-differes";/);
    assert.match(lire("ecrans-differes.ts"), /export const EcranGeneration = lazy\(\(\) => chargerGeneration\(\)\.then\(\(m\) => \(\{ default: m\.EcranGeneration \}\)\)\);/);
    assert.match(s, /useEffect\(\(\) => \{\s*if \(ecran >= 2\) prechargerLesEcrans\(\);\s*\}, \[ecran\]\);/);
    assert.match(s, /useFeuilleCatalogue\(piece, etat\.selections, mettreAJour, /);
    assert.match(s, /\{feuille \? \(\s*<Suspense fallback=\{null\}>\s*<FeuilleCatalogue \{\.\.\.feuille\} \/>\s*<\/Suspense>\s*\) : null\}/);
    for (const parti of ["<EcranAttente", "formulaireSecours", "choisirTeinte", "useFavoris", "Commencez par une photo"]) assert.ok(!s.includes(parti), parti);
    // La feuille garde ses règles : les zones incompatibles vidées, le focus rendu sans défilement, les autres zones proposées.
    const h = lire("useFeuilleCatalogue.ts");
    assert.match(h, /for \(const autre of piece\.zones\.find\(\(z\) => z\.id === id\)\?\.exclut \?\? \[\]\) suivantes\[autre\] = null;/);
    assert.match(h, /window\.setTimeout\(\(\) => setFocusZone\(zoneId\), 0\);/);
    assert.match(h, /!composantesDe\(piece, zone\.id\)\.includes\(z\.id\)/);
  });

  test("pendant la génération : les films dans l'ordre des zones, la lecture de la photo, rien du secours", () => {
    const html = rendre({ analyse: { empreinte: "e", statut: "PRETE", zonesVisibles: ["facades-cuisine", "credence"], zonesNonVisibles: [], verdict: "bonne", conseil: null, raison: null } });
    assert.match(html, /Votre simulation se prépare/);
    const films = [...html.matchAll(/<span class="text-encre-2">([^<]+) · <\/span>([^<]+)</g)].map((m) => `${m[1]} : ${m[2]}`);
    assert.deepEqual(films, ["Façades (toutes) : Deep Green", "Crédence : Marbre"]);
    assert.match(html, /Vu sur votre photo : Façades \(toutes\), Crédence\./);
    assert.ok(!html.includes("Envoyer ma photo"), "pas de formulaire de secours");
    assert.ok(!html.includes("Revenir à mes matières"));
  });

  test("après un échec : « Revenir à mes matières » et la simulation à la main ; envoyée : la confirmation seule ; sans photo : « Nouvelle simulation »", () => {
    const echec = { raison: "credit", message: "Le service est saturé." };
    const html = rendre({ echec, peutReessayer: true });
    assert.match(html, /Nous n'avons pas réussi cette fois-ci\./);
    assert.match(html, />Réessayer</);
    assert.match(html, />Revenir à mes matières</);
    assert.match(html, /Recevoir ma simulation et un devis par e-mail/);
    assert.match(html, /<button type="submit"[^>]*>[\s\S]*Envoyer ma photo et recevoir ma simulation/);
    const envoyee = rendre({ echec, envoye: true });
    assert.match(envoyee, /role="status"[^>]*>[\s\S]*Demande bien reçue/);
    assert.ok(!envoyee.includes("Envoyer ma photo"));
    const sansPhoto = rendre({ echec, photo: null });
    assert.match(sansPhoto, />Nouvelle simulation</);
    assert.ok(!sansPhoto.includes("Revenir à mes matières") && !sansPhoto.includes("Envoyer ma photo"));
  });

  test("sans photo sur l'appareil, l'écran des matières le dit", () => {
    const html = renderToStaticMarkup(createElement(EcranSansPhoto, { onPhoto: rien }));
    assert.match(html, /<h2 id="etape-sans-photo"[^>]*>Commencez par une photo<\/h2>/);
    assert.match(html, />Choisir une photo</);
  });
});
