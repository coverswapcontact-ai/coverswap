import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { reglesFiltres, teinteJeton } from "@/app/inspirations/_components/FiltresInspirations";
import { CalqueMatieres } from "@/components/ambiances/CalqueMatieres";
import { PastillesMatieres } from "@/components/ambiances/PastillesMatieres";
import { AMBIANCES, PAIRES_SERIE_2, PHOTOS_UTILES } from "@/data/ambiances";
import revetements from "@/data/revetements.json";
import { altAmbiance, ambianceDeLImage, ambiances, inspirations, lienComposition, teinteDe, vueDans } from "./ambiances";
import { MANIFESTE_IMAGES } from "./images-manifeste";
import { appliquerComposition, appliquerMatiereDemandee, lireComposition, lireRefDemandee } from "./simulateur/matiere-demandee";
import type { Selection } from "./simulateur/reprise";
import { ZONES_REPLI } from "./simulateur/zones";

/**
 * Mission 19 — les ambiances (`data/ambiances`) : la source unique des étiquettes matière, de /inspirations, des
 * textes alternatifs, du lien « Essayer cette composition chez moi » et du « Vue dans » de /matieres.
 */
const CATALOGUE = revetements as { id: string; nom: string; famille: string; hex: string }[];
const lire = (fichier: string) => readFileSync(path.join(process.cwd(), "src", fichier), "utf8");

describe("la table des ambiances", () => {
  test("chaque référence existe au catalogue, sous son nom ; chaque image est préparée ; 3 étiquettes au plus", () => {
    const parId = new Map(CATALOGUE.map((r) => [r.id, r]));
    const ids = new Set<string>();
    for (const a of AMBIANCES) {
      assert.ok(!ids.has(a.id), `${a.id} en double`);
      ids.add(a.id);
      assert.ok(MANIFESTE_IMAGES[a.image], `${a.id} : image ${a.image} non préparée`);
      if (a.avant) assert.ok(MANIFESTE_IMAGES[a.avant], `${a.id} : avant ${a.avant} non préparé`);
      assert.ok(a.surfaces.length >= 1 && a.surfaces.length <= 3, `${a.id} : ${a.surfaces.length} étiquettes`);
      for (const s of a.surfaces) {
        assert.equal(parId.get(s.ref)?.nom, s.nom, `${a.id} : ${s.ref} s'appelle « ${parId.get(s.ref)?.nom} » au catalogue`);
        if (s.prevue && /^[A-Z0-9]+$/.test(s.prevue)) assert.ok(parId.has(s.prevue), `${a.id} : prévue ${s.prevue}`);
        for (const v of [s.ancre.x, s.ancre.y, s.etiquette.x, s.etiquette.y]) assert.ok(v >= 0 && v <= 100, `${a.id} : coordonnée ${v}`);
        assert.ok(s.etiquette.y >= 5 && s.etiquette.y <= 95, `${a.id} : l'étiquette de ${s.surface} déborderait de l'image (y ${s.etiquette.y})`);
      }
    }
  });

  test("chaque zone existe dans la pièce du simulateur ; une zone ne reçoit qu'une référence", () => {
    for (const a of AMBIANCES) {
      const piece = ZONES_REPLI.pieces.find((p) => p.id === a.piece);
      assert.ok(piece, `${a.id} : pièce ${a.piece}`);
      const zones = a.surfaces.filter((s) => s.zone).map((s) => s.zone!);
      for (const z of zones) assert.ok(piece!.zones.some((x) => x.id === z), `${a.id} : zone ${z} absente de ${a.piece}`);
      assert.equal(new Set(zones).size, zones.length, `${a.id} : une zone en double`);
    }
  });

  test("les références relevées le 01/10/2026 (étiquettes changées : la référence de la direction artistique est gardée)", () => {
    const de = (id: string) => AMBIANCES.find((a) => a.id === id)!.surfaces.map((s) => `${s.ref}${s.prevue ? `<${s.prevue}` : ""}`);
    assert.deepEqual(de("cuisine-sauge-bois-clair"), ["RM20", "I14<AG13", "NE31"]);
    assert.deepEqual(de("buffet-bleu-nuit"), ["RM23<M9", "AG13"]);
    assert.deepEqual(de("salle-de-bain-chene-pierre"), ["B4<AG13", "MK15"]);
    assert.deepEqual(de("meuble-tv-terre-cuite"), ["NH12", "AA17<AG13"]);
  });

  test("série 2 : les 5 étiquettes changées gardent la référence prévue ; aucune autre n'a de `prevue`", () => {
    const de = (id: string) => AMBIANCES.find((a) => a.id === id)!.surfaces.map((s) => `${s.ref}${s.prevue ? `<${s.prevue}` : ""}`);
    assert.deepEqual(de("cuisine-bordeaux-brillante-apres-neutre"), ["K6<NE56", "AA14"]);
    assert.deepEqual(de("cuisine-l-hetre-apres-couleur"), ["NE83", "NE83", "NH38<NF99"]);
    assert.deepEqual(de("cuisine-u-pavillon-apres-bois"), ["NF95<AA17", "RM29"]);
    assert.deepEqual(de("pose-mains"), ["AF02<AG13"]);
    assert.deepEqual(de("amb-cuisine-familiale"), ["M9", "AL26<AG13", "NE31"]);
    const serie2 = AMBIANCES.slice(15);
    assert.equal(serie2.flatMap((a) => a.surfaces).filter((s) => s.prevue).length, 5);
  });

  test("série 2 : les paires (un avant, ses deux après, même pièce), les photos utiles « Ambiance », jamais « Illustration »", () => {
    assert.equal(PAIRES_SERIE_2.length, 18);
    for (const p of PAIRES_SERIE_2) {
      assert.equal(p.apres.length, 2, p.avant);
      assert.equal(p.etiquette, "Ambiance · avant / après");
      assert.ok(MANIFESTE_IMAGES[p.avant], p.avant);
      const { largeur, hauteur } = MANIFESTE_IMAGES[p.avant];
      assert.equal(p.ratio, `${largeur} / ${hauteur}`, p.avant);
      for (const id of p.apres) {
        const a = AMBIANCES.find((x) => x.id === id);
        assert.ok(a && a.avant === p.avant && a.piece === p.piece && a.inspiration, `${p.avant} → ${id}`);
        assert.equal(ambianceDeLImage(id)?.avant, p.avant);
      }
    }
    assert.deepEqual(PHOTOS_UTILES.map((u) => u.image), ["detail-chant", "pose-mains", "echantillons-table", "mesure-visite", "usure-detail", "outils-pose"]);
    for (const u of PHOTOS_UTILES) {
      assert.equal(u.etiquette, "Ambiance");
      assert.ok(MANIFESTE_IMAGES[u.image] && u.alt.endsWith("Image d'ambiance."), u.image);
      if (u.ambiance) assert.equal(AMBIANCES.find((a) => a.id === u.ambiance)?.inspiration, false, "une photo utile n'est pas une inspiration");
    }
    assert.ok(!lire("data/ambiances-serie-2.ts").includes("Illustration") && !lire("data/ambiances.ts").includes("Illustration"));
  });
});

describe("ce qu'on en tire", () => {
  test("le texte alternatif : la scène, chaque surface et sa matière, « image d'ambiance »", () => {
    assert.equal(altAmbiance("Une cuisine", [{ surface: "façades", nom: "Sage Green", ref: "RM20" }, { surface: "plan", nom: "Statuary White", ref: "NE31" }]), "Une cuisine. Façades Sage Green RM20, plan Statuary White NE31. Image d'ambiance aux teintes du catalogue.");
    for (const a of ambiances()) {
      for (const s of a.surfaces) assert.ok(a.alt.includes(`${s.nom} ${s.ref}`), `${a.id} : ${s.ref}`);
      assert.ok(a.alt.endsWith("Image d'ambiance aux teintes du catalogue."));
    }
  });

  test("le lien de composition : la pièce et chaque référence sur sa zone ; une surface sans zone n'y est pas", () => {
    assert.equal(lienComposition("cuisine", [{ zone: "meubles-bas", ref: "RM20" }, { ref: "AG13" }, { zone: "plan-de-travail", ref: "NE31" }]), "/simulateur?projet=cuisine&ref=meubles-bas:RM20,plan-de-travail:NE31");
    assert.equal(lienComposition("meubles", [{ ref: "AG13" }]), "/simulateur?projet=meubles");
    for (const a of ambiances()) {
      const ref = new URLSearchParams(a.lienComposition.split("?")[1]).get("ref");
      assert.equal(lireRefDemandee(ref), ref, `${a.id} : le simulateur lit la composition`);
    }
  });

  test("les teintes : la famille, puis la couleur", () => {
    const t = (id: string) => {
      const r = CATALOGUE.find((x) => x.id === id)!;
      return teinteDe(r.famille, r.hex);
    };
    assert.deepEqual(["RM20", "RM30", "NH15", "RM23", "K1", "NE31", "NF99", "MK15", "AG13", "D1", "NH12", "K4", "NE55", "NH27"].map(t), ["Vert", "Vert", "Vert", "Bleu", "Noir", "Blanc", "Pierre et marbre", "Pierre et marbre", "Bois clair", "Bois foncé", "Terre cuite", "Beige et taupe", "Beige et taupe", "Blanc"]);
  });

  test("/inspirations : 52 ambiances (14 de la série 1, 36 après et 2 ambiances de la série 2 ; ni photo d'étape, ni avant, ni photo utile) ; « Vue dans » : les ambiances de chaque référence", () => {
    assert.equal(inspirations().length, 52);
    for (const id of ["pose-sauge", "detail-chant", "pose-mains"]) assert.ok(!inspirations().some((a) => a.id === id), id);
    assert.ok(!inspirations().some((a) => PAIRES_SERIE_2.some((p) => p.avant === a.image)), "un avant n'est jamais montré seul");
    const vues = vueDans();
    assert.deepEqual(vues.RM20?.map((a) => a.id), ["cuisine-sauge-bois-clair", "bureaux-sauge-bois-blond", "pro-comptoir-accueil-apres-couleur"]);
    assert.deepEqual(vues.D1?.map((a) => a.id), ["bar-noir-pierre", "comptoir-noyer", "hotel-noyer", "portes-couloir-apres-bois", "pro-comptoir-accueil-apres-bois"]);
    assert.equal(vues.AF02, undefined, "AF02 n'est vue que dans une photo utile");
    assert.equal(ambianceDeLImage("ouverture-cuisine-avant")?.id, "cuisine-sauge-bois-clair", "l'« avant » d'une paire mène à son ambiance");
    assert.equal(ambianceDeLImage("inconnue"), null);
  });

  test("les filtres sans JavaScript : un choix masque le reste ; le compte de chaque combinaison est écrit d'avance", () => {
    assert.equal(teinteJeton("Bois foncé"), "bois-fonce");
    const css = reglesFiltres(".f", [{ piece: "cuisine", teintes: ["vert"] }, { piece: "meubles", teintes: ["vert", "bleu"] }], ["cuisine", "meubles"], ["vert", "bleu"]);
    assert.ok(css.includes(`.f:has(input[name="piece"][value="cuisine"]:checked) [data-inspiration]:not([data-piece="cuisine"]) { display: none; }`));
    assert.ok(css.includes(`.f:has(input[name="teinte"][value="bleu"]:checked) [data-inspiration]:not([data-teintes~="bleu"]) { display: none; }`));
    assert.ok(css.includes(`.f:has(input[name="piece"][value=""]:checked):has(input[name="teinte"][value=""]:checked) [data-compte]::after { content: "2 ambiances"; }`));
    assert.ok(css.includes(`.f:has(input[name="piece"][value="cuisine"]:checked):has(input[name="teinte"][value="bleu"]:checked) [data-compte]::after { content: "Aucune ambiance pour ce choix : essayez une autre teinte."; }`));
    assert.ok(!lire("app/inspirations/_components/FiltresInspirations.tsx").includes('"use client"'), "aucun JavaScript pour filtrer");
    assert.ok(lire("app/inspirations/_components/FiltresInspirations.tsx").includes('className="relative flex items-center gap-2 overflow-x-auto'), "les radios cachés restent dans la rangée qui défile (aucun débordement à 360 px)");
  });
});

describe("les étiquettes rendues", () => {
  const ouverture = ambianceDeLImage("ouverture-cuisine-apres")!;

  test("le calque : un point, un trait, une étiquette (« nom · réf ») vers la matière ; un numéro muet par surface pour le téléphone", () => {
    const html = renderToStaticMarkup(createElement(CalqueMatieres, { matieres: ouverture.surfaces }));
    assert.equal((html.match(/<line /g) ?? []).length, 3);
    assert.ok(html.includes(">Sage Green · RM20<") && html.includes('href="/matieres?ref=RM20"'));
    assert.match(html, /aria-label="meubles bas et tiroirs : Sage Green, référence RM20 — voir la matière"/);
    assert.equal((html.match(/md:hidden"[^>]*>[123]</g) ?? []).length, 3, "trois numéros pour le téléphone");
    assert.ok(!/loading="lazy"/.test(html), "rien de différé : le calque peut être au premier écran");
  });

  test("sur une paire, seules les étiquettes côté « après » (à droite du curseur) se montrent", () => {
    const html = renderToStaticMarkup(createElement(CalqueMatieres, { matieres: ouverture.surfaces, seuilX: 70 }));
    // RM20 (58 %) et NE31 (66 %) sont sous l'« avant » à 70 % ; I14 (88 %) reste.
    assert.equal((html.match(/opacity:0/g) ?? []).length, 2 * 2, "deux traits et deux étiquettes effacés");
    assert.equal((html.match(/tabindex="-1"/gi) ?? []).length, 2, "une étiquette effacée ne prend pas le focus");
  });

  test("les pastilles d'une carte : les vraies matières, muettes, leurs noms au survol", () => {
    const html = renderToStaticMarkup(createElement(PastillesMatieres, { image: "piece-cuisine" }));
    assert.match(html, /^<span aria-hidden="true"/);
    assert.equal((html.match(/<img /g) ?? []).length, 3);
    assert.ok(html.includes("Smokey Green · NH15") && html.includes("group-hover:block"));
    assert.equal(renderToStaticMarkup(createElement(PastillesMatieres, { image: "etape-photo" })), "", "une image sans ambiance : rien");
  });
});

describe("le simulateur reçoit une composition (?ref=zone:REF,…)", () => {
  const cuisine = ZONES_REPLI.pieces.find((p) => p.id === "cuisine")!;
  const sel = (ref: string): Selection => ({ ref, nom: ref, famille: "couleur", finition: "", categorie: "", tags: [], image: "" });

  test("lecture : une référence seule reste une référence ; une composition est gardée telle quelle ; le reste ignoré", () => {
    assert.equal(lireRefDemandee("K1"), "K1");
    assert.equal(lireRefDemandee("meubles-bas:RM20,meubles-hauts:I14"), "meubles-bas:RM20,meubles-hauts:I14");
    for (const mauvaise of ["meubles-bas:RM20,", "Meubles:RM20", "a:b,c:d,e:f,g:h,i:j,k:l,m:n", "<script>:x"]) assert.equal(lireRefDemandee(mauvaise), null, mauvaise);
    assert.deepEqual(lireComposition("meubles-bas:RM20,plan-de-travail:NE31"), [{ zone: "meubles-bas", ref: "RM20" }, { zone: "plan-de-travail", ref: "NE31" }]);
    assert.equal(lireComposition("K1"), null);
  });

  test("pose : chaque référence sur sa zone, les zones incompatibles vidées ; une zone ou une référence inconnue ignorée", () => {
    const matieres = new Map([["RM20", sel("RM20")], ["I14", sel("I14")], ["NE31", sel("NE31")]]);
    const avant = { "facades-cuisine": sel("K1"), credence: sel("J3") };
    const apres = appliquerComposition(avant, cuisine, lireComposition("meubles-bas:RM20,meubles-hauts:I14,plan-de-travail:NE31,inconnue:K1,credence:ZZ9")!, matieres);
    assert.deepEqual(apres, { "facades-cuisine": null, credence: sel("J3"), "meubles-bas": sel("RM20"), "meubles-hauts": sel("I14"), "plan-de-travail": sel("NE31") });
    assert.equal(appliquerComposition({}, cuisine, [{ zone: "inconnue", ref: "RM20" }], matieres), null);
    // La référence seule de /matieres garde son comportement (première zone).
    assert.deepEqual(appliquerMatiereDemandee({}, cuisine, sel("K1")), { "facades-cuisine": sel("K1"), "meubles-hauts": null, "meubles-bas": null });
  });
});

describe("intégration (mission 19)", () => {
  test("/pro : la paire du restaurant, puis l'hôtel, la boutique et les bureaux, étiquetés ; pas de lien vers le simulateur", async () => {
    // Site 3.0 (lot C2) : la page lit les publications du CRM — CRM injoignable simulé (aucune requête réseau).
    const fetchOrigine = globalThis.fetch;
    globalThis.fetch = (async () => new Response("{}", { status: 503 })) as typeof fetch;
    let html: string;
    try {
      const { default: PagePro } = await import("@/app/pro/page");
      html = renderToStaticMarkup((await PagePro()) as Parameters<typeof renderToStaticMarkup>[0]);
    } finally {
      globalThis.fetch = fetchOrigine;
    }
    assert.ok(html.includes("/images/prep/pro-restaurant-avant-") && html.includes("/images/prep/pro-restaurant-"));
    // Les matières de chaque lieu, en cartels (« Nom » puis « RÉF · famille · finition », lus « Nom · RÉF · … »).
    const texte = html.replace(/<[^>]+>/g, "");
    for (const t of ["Black Mat · K1", "Classic Walnut · D1", "Caffe Latte · NE55", "Freijo Laurel · NE68", "Beige Brown Ash · AL26"]) assert.ok(texte.includes(t), t);
    assert.ok(html.includes(">Ambiance · avant / après<"));
    assert.ok(!html.includes("Essayer cette composition"), "la page Pro n'envoie pas au simulateur");
  });

  test("les pictos remplacent les dessins de famille et de plan : AVIF + WebP en 128 et 256 px, transparents, préparés", async () => {
    const { DessinFamille, PlanCuisine, Picto, PICTOS_FAMILLES, PICTOS_ELEMENTS } = await import("@/components/espace/Illustrations");
    const famille = renderToStaticMarkup(createElement(DessinFamille, { famille: "SDB", className: "h-16 w-20" }));
    assert.match(famille, /<source type="image\/avif" srcSet="\/images\/pictos\/picto-salle-de-bain-128\.avif 1x, \/images\/pictos\/picto-salle-de-bain-256\.avif 2x"/);
    assert.match(famille, /<img src="\/images\/pictos\/picto-salle-de-bain-128\.webp"[^>]*alt=""[^>]*class="object-contain h-16 w-20"/);
    assert.ok(renderToStaticMarkup(createElement(DessinFamille, { famille: "INCONNUE" })).includes("picto-cuisine"));
    const plan = renderToStaticMarkup(createElement(PlanCuisine, { forme: "en-u", className: "h-16 w-16", enSvg: true }));
    assert.match(plan, /^<svg viewBox="0 0 128 128" class="h-16 w-16" aria-hidden="true"><image href="\/images\/pictos\/plan-en-u-256\.webp"/);
    const { existsSync } = await import("node:fs");
    assert.match(renderToStaticMarkup(createElement(PlanCuisine, { forme: "parallele", className: "h-16 w-16" })), /plan-parallele-128\.webp/);
    assert.match(renderToStaticMarkup(createElement(Picto, { nom: PICTOS_ELEMENTS.refrigerateur, className: "h-16 w-16" })), /<img src="\/images\/pictos\/picto-refrigerateur-128\.webp"[^>]*alt=""/);
    assert.equal(Object.keys(PICTOS_ELEMENTS).length, 7, "les 7 éléments de la série 2");
    for (const nom of [...Object.values(PICTOS_FAMILLES), ...Object.values(PICTOS_ELEMENTS), "plan-une-rangee", "plan-en-l", "plan-en-u", "plan-ilot", "plan-parallele"]) {
      for (const f of [`${nom}-128.avif`, `${nom}-256.avif`, `${nom}-128.webp`, `${nom}-256.webp`, `sources/${nom}.png`]) assert.ok(existsSync(path.join(process.cwd(), "public", "images", "pictos", f)), f);
    }
    // Les appels : 64 px au moins partout.
    for (const fichier of ["app/simulateur/_components/Estimation.tsx", "components/espace/EtapeProjet.tsx", "components/espace/EspaceClient.tsx", "components/espace/EspaceCompte.tsx"]) {
      for (const m of lire(fichier).matchAll(/<(?:DessinFamille|PlanCuisine)[^>]*className="([^"]*)"/g)) assert.ok(/h-16|w-full/.test(m[1]), `${fichier} : ${m[1]}`);
    }
  });
});
