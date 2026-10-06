import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToReadableStream, renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Video } from "@/components/revue/Video";
import { BoutonVideo } from "@/components/simulation/BoutonVideo";
import { CadreVideo } from "@/components/simulation/CadreVideo";
import { VideoBoucle } from "@/components/simulation/VideoBoucle";
import { ENTREPRISE } from "@/lib/entreprise";
import { sourcesPhoto } from "@/lib/images-preparees";
import { DATE_VIDEOS, LIBELLES_VIDEO, VIDEOS, adresseVideo, dureeIso, ratioVideo } from "./videos";

/**
 * Mission 22 (partie B) — les vidéos motion design du site (énoncé, § 6) :
 *  - les fichiers de `public/videos/` : ceux de `lib/videos`, chacun avec son empreinte (sha1 tronqué : une vidéo
 *    remplacée sous le même nom sans nouvelle empreinte serait gardée un an en cache), sous le poids cible (3,5 Mo
 *    pour « Comment ça marche », 2,5 Mo pour les autres), `faststart` (l'atome `moov` avant `mdat`), sans piste son ;
 *  - le composant `Video` (serveur) : l'affiche étiquetée (« Ambiance », « Démonstration »), le bouton, le `VideoObject`
 *    (nom, description, affiche, date, durée ISO 8601, `contentUrl`) ; en mode `lien`, un lien de texte seul ;
 *  - aucun octet de vidéo au premier affichage : aucun `<video>` dans le HTML des quatre pages (ni en mode clic, ni
 *    en mode boucle : la boucle ne monte son `<video>` qu'à l'écran, dans le navigateur), aucun préchargement ;
 *  - `prefers-reduced-motion` : la boucle rend l'affiche et « Lire » (le rendu serveur ne joue jamais).
 */
const RACINE = process.cwd();
const DOSSIER = path.join(RACINE, "public", "videos");
const ROUTEUR = { back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, prefetch() {} };
const rendre = (element: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(element);
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;
const lire = (chemin: string) => readFileSync(path.join(RACINE, chemin), "utf8").replace(/\r\n/g, "\n");
/** Le HTML sans ses blocs JSON-LD (le `VideoObject` écrit l'adresse du film et de l'affiche, et c'est voulu). */
const sansBalisage = (html: string) => html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");

/** La position d'un atome MP4 de premier niveau (« moov », « mdat »), ou -1. */
function atome(octets: Buffer, nom: string): number {
  let position = 0;
  while (position + 8 <= octets.length) {
    let taille = octets.readUInt32BE(position);
    const type = octets.toString("latin1", position + 4, position + 8);
    if (type === nom) return position;
    if (taille === 1) taille = Number(octets.readBigUInt64BE(position + 8));
    if (taille === 0) break;
    position += taille;
  }
  return -1;
}

async function page(chemin: string): Promise<string> {
  const { default: Page } = (await import(chemin)) as { default: () => unknown };
  const flux = await renderToReadableStream(createElement(AppRouterContext.Provider, { value: ROUTEUR as never }, (await Page()) as never));
  await flux.allReady;
  return new Response(flux).text();
}

describe("les fichiers de public/videos/", () => {
  test("cinq films, ceux de lib/videos et rien d'autre ; chaque empreinte est celle du fichier", () => {
    assert.deepEqual(readdirSync(DOSSIER).sort(), Object.values(VIDEOS).map((v) => v.fichier).sort());
    for (const [id, v] of Object.entries(VIDEOS)) {
      const octets = readFileSync(path.join(DOSSIER, v.fichier));
      assert.equal(v.empreinte, createHash("sha1").update(octets).digest("hex").slice(0, 12), `${id} : fichier remplacé sans nouvelle empreinte`);
    }
  });

  test("sous le poids cible, faststart (moov avant mdat), H.264 sans piste son", () => {
    for (const [id, v] of Object.entries(VIDEOS)) {
      const octets = readFileSync(path.join(DOSSIER, v.fichier));
      const plafond = id === "commentCaMarche" ? 3.5 : 2.5;
      assert.ok(octets.length <= plafond * 1024 * 1024, `${id} : ${(octets.length / 1024 / 1024).toFixed(2)} Mo`);
      assert.equal(octets.toString("latin1", 4, 8), "ftyp", id);
      const moov = atome(octets, "moov");
      const mdat = atome(octets, "mdat");
      assert.ok(moov >= 0 && mdat >= 0 && moov < mdat, `${id} : moov (${moov}) doit précéder mdat (${mdat})`);
      const entete = octets.subarray(0, mdat).toString("latin1");
      assert.ok(entete.includes("avc1"), `${id} : H.264`);
      assert.ok(!entete.includes("mp4a") && !entete.includes("soun"), `${id} : sans piste son`);
    }
  });

  test("les données : 1080 au plus grand côté, durées de l'énoncé, affiches au manifeste, adresses avec empreinte, durée ISO 8601", () => {
    assert.deepEqual(
      Object.fromEntries(Object.entries(VIDEOS).map(([id, v]) => [id, [v.largeur, v.hauteur, v.duree]])),
      { reel: [608, 1080, 15.5], commentCaMarche: [1080, 608, 30], presentoir: [1080, 608, 20.5], presentoirBoucle: [1080, 608, 9.6], demoSimulateur: [608, 1080, 21] }
    );
    for (const v of Object.values(VIDEOS)) {
      assert.equal(Math.max(v.largeur, v.hauteur), 1080);
      assert.ok(sourcesPhoto(v.affiche), `${v.affiche} : affiche au manifeste (npm run images)`);
      assert.equal(adresseVideo(v), `/videos/${v.fichier}?v=${v.empreinte}`);
      assert.match(dureeIso(v), /^PT\d+S$/);
    }
    assert.equal(dureeIso(VIDEOS.reel), "PT15S");
    assert.equal(ratioVideo(VIDEOS.reel), "608 / 1080");
    assert.equal(VIDEOS.demoSimulateur.etiquette, "Démonstration");
    assert.ok(Object.values(VIDEOS).filter((v) => v.etiquette === "Ambiance").length === 4);
    assert.deepEqual(LIBELLES_VIDEO, { reel: "Voir en 15 s", commentCaMarche: "Voir en 30 s", presentoir: "Voir le présentoir en 20 s", presentoirBoucle: "Lire", demoSimulateur: "Voir la démo · 20 s" });
    assert.match(DATE_VIDEOS, /^\d{4}-\d{2}-\d{2}$/);
    // Module pur : rien d'importé (les composants clients le lisent sans tirer le manifeste).
    assert.doesNotMatch(lire("src/lib/videos.ts"), /^import /m);
  });
});

describe("le composant Video (serveur) et ses parts clientes", () => {
  const affiche = sourcesPhoto(VIDEOS.commentCaMarche.affiche);

  test("mode clic : l'affiche étiquetée en <picture>, tout le cadre est le bouton, aucun <video>", () => {
    const html = rendre(createElement(Video, { id: "commentCaMarche", mode: "clic" }));
    assert.equal(compter(html, "<picture>"), 1);
    assert.match(html, /\/images\/prep\/affiche-comment-ca-marche-480\.avif\?v=/);
    assert.match(html, /style="aspect-ratio:1080 \/ 608"/);
    assert.match(html, />Ambiance<\/span>/);
    assert.match(html, /<button type="button" aria-label="Voir en 30 s : Comment ça marche, en 30 secondes"[^>]*class="group absolute inset-0 flex items-center justify-center"/);
    assert.ok(!html.includes("<video"));
    assert.ok(!sansBalisage(html).includes(".mp4"), "l'adresse du film n'est que dans le VideoObject");
    // L'affiche est différée sauf `priorite` (le LCP de /comment-ca-marche) ; jamais le rouge.
    assert.match(html, /loading="lazy"/);
    assert.match(rendre(createElement(Video, { id: "commentCaMarche", mode: "clic", priorite: true })), /loading="eager" fetchPriority="high"/);
    assert.doesNotMatch(html, /accent/);
  });

  test("mode boucle : l'affiche et le bouton « Lire » ; le <video> n'existe pas au rendu serveur (il monte à l'écran, sans moins de mouvement)", () => {
    const html = rendre(createElement(Video, { id: "presentoirBoucle", mode: "boucle" }));
    assert.equal(compter(html, "<picture>"), 1);
    assert.match(html, />Ambiance<\/span>/);
    assert.match(html, /<button type="button" aria-pressed="false" aria-label="Lire : Le présentoir des matières"/);
    assert.ok(!html.includes("<video"));
    assert.ok(!sansBalisage(html).includes(".mp4"));
    // La part cliente, telle qu'elle sera montée : muette, en boucle, sans préchargement, décorative.
    const source = lire("src/components/simulation/VideoBoucle.tsx");
    assert.match(source, /<video\s+ref=\{lecteur\}\s+src=\{adresseVideo\(video\)\}\s+muted\s+loop\s+playsInline\s+preload="none"\s+aria-hidden="true"/);
    assert.match(source, /prefers-reduced-motion: reduce/);
    assert.match(source, /new IntersectionObserver\(/);
    assert.match(source, /document\.readyState === "complete"/);
    assert.match(source, /el\.muted = true;\s*el\.play\(\)/);
    assert.doesNotMatch(source, /autoPlay/, "la lecture se lance à la main, une fois les conditions réunies");
  });

  test("mode lien : un lien de texte seul, sans affiche, avec le VideoObject", () => {
    const html = rendre(createElement(Video, { id: "presentoir", mode: "lien" }));
    assert.ok(!html.includes("<picture>"));
    assert.match(html, /<button type="button" aria-label="Voir le présentoir en 20 s : Le présentoir des matières, en 20 secondes"[^>]*class="inline-flex min-h-\[44px\] items-center gap-2 text-\[16px\] font-medium text-encre underline underline-offset-4[^"]*">/);
    assert.match(html, /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"VideoObject"/);
  });

  test("le VideoObject : nom, description, affiche, date, durée ISO 8601, contentUrl avec empreinte", () => {
    const html = rendre(createElement(Video, { id: "demoSimulateur", mode: "clic", libelle: "Voir la démo · 20 s" }));
    const bloc = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "";
    const objet = JSON.parse(bloc) as Record<string, unknown>;
    assert.deepEqual(Object.keys(objet).slice(0, 2), ["@context", "@type"]);
    assert.equal(objet["@type"], "VideoObject");
    assert.equal(objet.name, VIDEOS.demoSimulateur.titre);
    assert.equal(objet.description, VIDEOS.demoSimulateur.description);
    assert.deepEqual(objet.thumbnailUrl, [`${ENTREPRISE.site}/images/prep/affiche-demo-simulateur-1080.jpg?v=${sourcesPhoto("affiche-demo-simulateur")!.src.split("?v=")[1]}`]);
    assert.equal(objet.uploadDate, DATE_VIDEOS);
    assert.equal(objet.duration, "PT21S");
    assert.equal(objet.contentUrl, `${ENTREPRISE.site}/videos/demo-simulateur.mp4?v=${VIDEOS.demoSimulateur.empreinte}`);
    assert.ok(!bloc.includes("<"));
    assert.match(html, />Démonstration<\/span>/);
  });

  test("BoutonVideo et CadreVideo : des dessins à l'encre sur le papier, 44 px, le plein écran chargé au geste", () => {
    const film = { video: VIDEOS.reel, affiche: affiche!.src, libelle: "Voir en 15 s" };
    for (const variante of ["bouton", "pastille", "lien", "sur-affiche"] as const) {
      const html = rendre(createElement(BoutonVideo, { ...film, variante }));
      assert.match(html, /min-h-\[4[48]px\]/, variante);
      assert.ok(!html.includes("<video") && !html.includes("accent"), variante);
    }
    const source = lire("src/components/simulation/BoutonVideo.tsx");
    assert.match(source, /const chargerPleinEcran = \(\) => import\("\.\/PleinEcran"\);/);
    assert.match(source, /onPointerEnter=\{chargerPleinEcran\}\s+onFocus=\{chargerPleinEcran\}/);
    assert.match(source, /<PleinEcran ouvert onFermer=\{\(\) => setOuvert\(false\)\} apres=\{affiche\} avant=\{null\} alt=\{video\.titre\} libelle=\{video\.titre\} modale video=\{\{ src: adresseVideo\(video\) \}\} \/>/);
    // Le plein écran en mode vidéo : commandes natives, lecture à l'ouverture, muet par défaut, le bouton « Son ».
    const pleinEcran = lire("src/components/simulation/PleinEcran.tsx");
    assert.match(pleinEcran, /<video ref=\{lecteur\} src=\{video\.src\} poster=\{apres\} controls autoPlay playsInline muted preload="auto"/);
    assert.match(pleinEcran, /\{son \? "Son activé" : "Son"\}/);
    assert.match(pleinEcran, /lecteur\.current\.muted = !son;/);
    // Le cadre de téléphone de la démo : bord d'encre, jamais une couleur écrite en dur.
    const telephone = rendre(createElement(CadreVideo, { video: VIDEOS.demoSimulateur, affiche: sourcesPhoto(VIDEOS.demoSimulateur.affiche), mode: "clic", libelle: "Voir la démo · 20 s", cadre: "telephone" }));
    assert.match(telephone, /rounded-\[28px\] border-\[6px\] border-encre bg-encre/);
    assert.match(telephone, /style="aspect-ratio:608 \/ 1080"/);
    assert.ok(!rendre(createElement(VideoBoucle, { video: VIDEOS.presentoirBoucle, affiche: null })).includes("<video"));
  });
});

describe("aucun octet de vidéo au premier affichage des quatre pages", () => {
  const fetchOrigine = globalThis.fetch;
  const PAGES = ["@/app/page", "@/app/comment-ca-marche/page", "@/app/matieres/page", "@/app/simulateur/page"];

  test("aucun <video>, aucun préchargement de vidéo, aucune adresse .mp4 hors des VideoObject ; les affiches seules", async () => {
    globalThis.fetch = (async () => new Response("{}", { status: 404 })) as typeof fetch;
    try {
      for (const chemin of PAGES) {
        const html = await page(chemin);
        assert.ok(!html.includes("<video"), `${chemin} : un <video> au premier affichage`);
        assert.ok(!/<link[^>]*rel="preload"[^>]*as="video"/.test(html), chemin);
        assert.ok(!sansBalisage(html).includes(".mp4"), `${chemin} : une adresse de film hors du VideoObject`);
        assert.ok(sansBalisage(html).includes("/images/prep/affiche-"), `${chemin} : une affiche rendue`);
      }
      // L'accueil : le reel (bouton seul, son affiche n'y est pas rendue), le film « Comment ça marche » (affiche), deux liens.
      const accueil = await page("@/app/page");
      assert.match(accueil, /aria-label="Voir en 15 s : Avant \/ après en 15 secondes"/);
      assert.equal(compter(accueil, 'aria-label="Voir en 15 s : Avant / après en 15 secondes"'), 2, "le bouton des outils (dès 768 px) et le petit bouton sur l'image (téléphone)");
      assert.ok(!sansBalisage(accueil).includes("/images/prep/affiche-reel-avant-apres-"), "l'affiche du reel ne sert qu'au poster du plein écran (et au VideoObject)");
      assert.match(accueil, /aria-label="Voir en 30 s : Comment ça marche, en 30 secondes"/);
      assert.match(accueil, /aria-label="Voir le présentoir en 20 s : Le présentoir des matières, en 20 secondes"/);
      assert.match(accueil, /aria-label="Voir la démo · 20 s : La démo du simulateur, en 20 secondes"/);
      assert.equal(compter(accueil, '"@type":"VideoObject"'), 4);
      // /matieres : la boucle à droite du titre, « Lire » ; /simulateur : la démo dans son cadre de téléphone et en lien.
      const matieres = await page("@/app/matieres/page");
      assert.match(matieres, /lg:grid lg:grid-cols-\[minmax\(0,1fr\)_420px\] lg:items-center/);
      assert.match(matieres, /aria-label="Lire : Le présentoir des matières"/);
      const simulateur = await page("@/app/simulateur/page");
      assert.equal(compter(simulateur, 'aria-label="Voir la démo · 20 s : La démo du simulateur, en 20 secondes"'), 2, "le lien (téléphone) et le cadre (ordinateur)");
      assert.match(simulateur, /rounded-\[28px\] border-\[6px\] border-encre/);
    } finally {
      globalThis.fetch = fetchOrigine;
    }
  });

  test("le simulateur n'emporte ni le manifeste ni les films : l'écran Pièce reçoit l'affiche résolue par la page", () => {
    assert.match(lire("src/app/simulateur/page.tsx"), /const demo = \{ video: VIDEOS\.demoSimulateur, affiche: sourcesPhoto\(VIDEOS\.demoSimulateur\.affiche\), libelle: LIBELLES_VIDEO\.demoSimulateur \};/);
    assert.match(lire("src/app/simulateur/page.tsx"), /<Simulateur [^\n]*demo=\{demo\} photosPieces=/);
    assert.doesNotMatch(lire("src/app/simulateur/_components/EcranPiece.tsx"), /from "@\/lib\/images-preparees";\n(?!import type)/);
    assert.match(lire("src/app/simulateur/_components/EcranPiece.tsx"), /import type \{ SourcesPhoto \} from "@\/lib\/images-preparees";/);
    // Le plein écran reste chargé à la demande : jamais importé en statique par le curseur ni par le bouton.
    for (const f of ["src/components/simulation/AvantApres.tsx", "src/components/simulation/BoutonVideo.tsx", "src/components/simulation/CadreVideo.tsx", "src/components/revue/Video.tsx"]) assert.doesNotMatch(lire(f), /^import [^\n]*from "\.\/PleinEcran"|^import [^\n]*PleinEcran"/m, f);
  });

  test("les fichiers vidéo ne sont jamais écrits en dur ailleurs que dans lib/videos", () => {
    const sources: string[] = [];
    const parcourir = (d: string) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) parcourir(p);
        else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) sources.push(p);
      }
    };
    parcourir(path.join(RACINE, "src"));
    const fautes = sources.filter((f) => !f.endsWith(`lib${path.sep}videos.ts`) && /\.mp4/.test(readFileSync(f, "utf8"))).map((f) => path.relative(RACINE, f));
    assert.deepEqual(fautes, []);
    assert.ok(statSync(path.join(DOSSIER, VIDEOS.reel.fichier)).size > 0);
  });
});
