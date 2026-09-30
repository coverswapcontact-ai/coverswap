import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DemandeApresRendu } from "@/app/simulateur/_components/DemandeApresRendu";
import { EspacePret } from "@/app/simulateur/_components/EspacePret";
import { Estimation } from "@/app/simulateur/_components/Estimation";
import { ChampsContact, FORMULAIRE_VIDE } from "@/app/simulateur/_components/Formulaires";
import { Rappel } from "@/app/simulateur/_components/Rappel";
import { ARGUMENTS_PRO, LIGNE_PRO, REFERENCES_PRO, SOURCE_FORMULAIRE_PRO, TITRE_PRO } from "@/app/pro/contenu";
import { AVANTAGES_DEVIS_EN_LIGNE, ETAPES_DEVIS_EN_LIGNE, INTRO_DEVIS_EN_LIGNE, LIEN_DEVIS_EN_LIGNE, TITRE_DEVIS_EN_LIGNE } from "@/app/comment-ca-marche/devis-en-ligne";
import ContenuPrestation from "@/components/ContenuPrestation";
import { getPrestation } from "@/data/prestations";
import { resolveSource } from "./crm";
import { estimer } from "./estimation";
import { MAX_PHOTOS, photosARetenir } from "./photos-formulaire";
import { corpsDemandeSimulation } from "./simulateur/demande";
import { appliquerMatiereDemandee, lireRefDemandee } from "./simulateur/matiere-demandee";
import { migrerEtat, type RenduSimulateur } from "./simulateur/reprise";
import { ZONES_REPLI } from "./simulateur/zones";
import { chargerTarifs, tarifsLisibles, type TarifsSite } from "./tarifs-site";
import { messageWhatsAppSimulation } from "./whatsapp";

/**
 * Mission 16 (partie 4) — le tunnel côté site, hors estimation et rappel (leurs fichiers) : sources des
 * formulaires, message WhatsApp qui cite la simulation, corps de la demande, matière présélectionnée, tarifs du CRM
 * (lecture et repli), mémoire du parcours, écrans rendus (un seul bouton principal, champs réduits, espace affiché
 * sans rien envoyer), /pro (références « Ambiance », textes de l'ancienne page repris) et /contact.
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");
const principaux = (html: string) => (html.match(/class="[^"]*bg-encre text-blanc hover:bg-encre-survol/g) ?? []).length;

const TARIFS: TarifsSite = {
  version: 1,
  familles: [
    {
      id: "CUISINE",
      sousParties: [
        { id: "facades-hautes", libelle: "Façades hautes", metrage: true, prixUnitaire: 170, unite: "ml" },
        { id: "facades-basses", libelle: "Façades basses", metrage: true, prixUnitaire: 170, unite: "ml" },
      ],
      formats: [
        { id: "une-rangee", libelle: "Petite", aide: "Un seul mur, ≈ 3 m", metres: 3 },
        { id: "en-l", libelle: "Moyenne", aide: "En L, ≈ 5 m", metres: 5 },
        { id: "ilot", libelle: "Grande", aide: "Avec îlot, ≈ 8 m", metres: 8 },
      ],
    },
  ],
};
const RENDU: RenduSimulateur = { travailId: "cmun000000000001", simulationSiteId: "cmun000000000002", urlApres: "https://crm.example.test/a.jpg", urlAvant: null, references: [{ zone: "facades-cuisine", libelle: "Façades (toutes)", ref: "K1", nom: "Black Mat" }, { zone: "plan-de-travail", libelle: "Plan de travail", ref: "MK15", nom: "Travertin" }], le: 1 };

describe("sources des formulaires (resolveSource)", () => {
  test("/contact → SITE_CONTACT (plus SITE_DEVIS) ; SITE_PRO explicite ; simulateur ; l'ancien /devis reste lu", () => {
    const cas: [string | undefined, string][] = [
      ["coverswap.fr/contact", "SITE_CONTACT"],
      ["SITE_PRO", "SITE_PRO"],
      ["coverswap.fr/pro", "SITE_PRO"],
      ["SITE_CONTACT", "SITE_CONTACT"],
      ["coverswap.fr/simulateur", "SITE_SIMULATEUR"],
      ["coverswap.fr/devis", "SITE_DEVIS"],
      ["coverswap.fr/prestations/professionnel", "SITE_CONTACT"],
      [undefined, "SITE_CONTACT"],
    ];
    for (const [brut, attendu] of cas) assert.equal(resolveSource(brut), attendu, String(brut));
    assert.equal(SOURCE_FORMULAIRE_PRO, "SITE_PRO");
    assert.match(lire("app/pro/_components/FormulairePro.tsx"), /source: SOURCE_FORMULAIRE_PRO/);
    assert.match(lire("app/contact/_components/FormulaireContact.tsx"), /source="coverswap\.fr\/contact"/);
  });
});

describe("WhatsApp après le rendu", () => {
  test("le message cite la pièce et les films ; rien de personnel, jamais le lien de l'espace (un accès, dans l'adresse de wa.me)", () => {
    assert.equal(messageWhatsAppSimulation("cuisine", RENDU.references), "Bonjour, je viens de simuler ma cuisine (façades K1 Black Mat, plan de travail MK15 Travertin) sur coverswap.fr.");
    assert.equal(messageWhatsAppSimulation("meubles", []), "Bonjour, je viens de simuler mes meubles sur coverswap.fr.");
    assert.equal(messageWhatsAppSimulation.length, 2, "plus de paramètre pour le lien");
    const html = renderToStaticMarkup(createElement(DemandeApresRendu, { projet: "cuisine", rendu: RENDU, tarifs: TARIFS, formulaire: FORMULAIRE_VIDE, onFormulaire: () => undefined, avecVille: true, occupe: false, envoye: { lienEspace: "https://coverswap.fr/e/abcd1234-signature", phraseRappel: null }, onEnvoyer: () => undefined, onEstimationVue: () => undefined, captcha: null, onRecommencer: () => undefined }));
    const liensWhatsApp = html.match(/href="https:\/\/wa\.me\/[^"]*"/g) ?? [];
    assert.ok(liensWhatsApp.length > 0);
    assert.ok(liensWhatsApp.every((l) => !l.includes("%2Fe%2F") && !l.includes("/e/")), "le lien de l'espace n'est pas dans l'adresse de WhatsApp");
  });
});

describe("la demande de devis du simulateur", () => {
  test("corps : ville connue reprise, fourchette et taille, créneau ; pas de photo sans échec", () => {
    const corps = corpsDemandeSimulation({
      formulaire: { name: " Aline ", phone: "06 11 00 00 01", email: "", ville: "", codePostal: "" },
      connus: { ville: "Lattes", codePostal: "34970" },
      projet: "cuisine",
      parcoursId: "aaaaaaaa-1604-4000-8000-000000000001",
      simulationIds: ["cmun000000000002"],
      references: RENDU.references,
      echec: null,
      jetonCaptcha: null,
      acquisition: { campagne: "printemps", canal: "meta/paid", pageEntree: "/" },
      consentement: { consentementMail: false },
      page: "/simulateur",
      extra: { estimation: estimer({ famille: "CUISINE", format: "en-l", tarifs: TARIFS, zonesChoisies: ["facades-cuisine"] }), rappelCreneau: "demain-10h" },
    });
    assert.deepEqual(
      [corps.name, corps.ville, corps.codePostal, corps.referenceChoisie, corps.estimationMin, corps.estimationMax, corps.formatPiece, corps.rappelCreneau, corps.canal, corps.pageEntree, corps.formulaire, "photoAvant" in corps, corps.afficherLienEspace],
      ["Aline", "Lattes", "34970", "K1", 1500, 1900, "Moyenne · En L, ≈ 5 m", "demain-10h", "meta/paid", "/", "simulateur · /simulateur", false, true]
    );
    const secours = corpsDemandeSimulation({ formulaire: { ...FORMULAIRE_VIDE, name: "Basile", phone: "0611000002", ville: "Pérols", codePostal: "34470" }, connus: { ville: null, codePostal: null }, projet: "cuisine", parcoursId: null, simulationIds: [], references: [], echec: { photo: "data:image/jpeg;base64,AAAA", raison: "credit" }, jetonCaptcha: "jeton", acquisition: {}, consentement: {}, page: "/simulateur" });
    // Après un échec, l'écran ne montre pas de lien : la demande ne demande pas l'ouverture de l'espace.
    assert.deepEqual([secours.ville, secours.photoAvant, secours.simulationEchouee, "estimationMin" in secours, "rappelCreneau" in secours, "afficherLienEspace" in secours], ["Pérols", "data:image/jpeg;base64,AAAA", "credit", false, false, false]);
    assert.match(lire("app/api/simulation/contact/route.ts"), /afficherLienEspace: c\.afficherLienEspace/);
  });

  test("le simulateur : `?ref=` lu au montage, ESTIMATION_VUE une fois par parcours, RAPPEL_DEMANDE après l'envoi, lien de l'espace lu dans la réponse", () => {
    const s = lire("app/simulateur/_components/Simulateur.tsx");
    assert.match(s, /refDemandee: lireRefDemandee\(parametres\.get\("ref"\)\) \?\? base\.refDemandee/);
    assert.match(s, /if \(estimationVue\.current\) return;\s*estimationVue\.current = true;\s*envoyerEvenement\("ESTIMATION_VUE"/);
    assert.match(s, /estimationVue\.current = false;/, "« Nouvelle simulation » réarme (une fois par simulation)");
    assert.match(s, /setEtat\(\{ \.\.\.ETAT_VIDE, projet: etat\.projet, parcoursId: etat\.parcoursId, ville: etat\.ville, codePostal: etat\.codePostal \}\)/, "« Nouvelle simulation » garde la ville connue");
    assert.match(s, /if \(extra\?\.rappelCreneau\) envoyerEvenement\("RAPPEL_DEMANDE"/);
    assert.match(s, /lienEspace: typeof data\.lienEspace === "string"/);
    assert.ok(s.split("\n").length < 600, "Simulateur.tsx sous 600 lignes");
    assert.match(lire("app/simulateur/page.tsx"), /chargerTarifs\(\)/);
  });
});

describe("matière présélectionnée (?ref=)", () => {
  test("une référence lisible est gardée, le reste ignoré ; posée sur la première zone, ses zones incompatibles vidées", () => {
    assert.deepEqual(["K1", " NE31 ", "AB02", "", null, "<script>", "x".repeat(21)].map((v) => lireRefDemandee(v)), ["K1", "NE31", "AB02", null, null, null, null]);
    const cuisine = ZONES_REPLI.pieces[0];
    const matiere = { ref: "K1", nom: "Black Mat", famille: "couleur", finition: "mat", categorie: "", tags: [], image: "" };
    const avant = { "meubles-hauts": { ...matiere, ref: "J3" }, credence: { ...matiere, ref: "NE31" } };
    assert.deepEqual(appliquerMatiereDemandee(avant, cuisine, matiere), { "facades-cuisine": matiere, "meubles-hauts": null, "meubles-bas": null, credence: { ...matiere, ref: "NE31" } });
    assert.equal(appliquerMatiereDemandee({}, { ...cuisine, zones: [] }, matiere), null);
    assert.match(lire("app/simulateur/_components/useMatiereDemandee.ts"), /mettreAJour\(\{ refDemandee: null/);
  });

  test("mémoire du parcours : ville, code postal et matière demandée survivent à la relecture", () => {
    const etat = migrerEtat({ version: 2, projet: "cuisine", ville: "Lattes", codePostal: "34970", refDemandee: "K1" });
    assert.deepEqual([etat?.ville, etat?.codePostal, etat?.refDemandee], ["Lattes", "34970", "K1"]);
    assert.equal(migrerEtat({ version: 2, codePostal: "3497" })?.codePostal, null);
  });
});

describe("tarifs du CRM (lecture, repli)", () => {
  const reponse = (corps: unknown, status = 200) => (async () => new Response(JSON.stringify(corps), { status })) as unknown as typeof fetch;
  test("forme lue ; illisible, erreur, silence : null (l'estimation retombe sur offre.ts)", async () => {
    assert.ok(tarifsLisibles(TARIFS));
    for (const mauvais of [null, {}, { familles: [{ id: "CUISINE", sousParties: [{ id: "x", metrage: true, prixUnitaire: -3 }], formats: [] }] }, { familles: [{ id: "CUISINE", sousParties: [], formats: [{ id: "f", libelle: "F", metres: "3" }] }] }]) assert.equal(tarifsLisibles(mauvais), false, JSON.stringify(mauvais));
    assert.deepEqual(await chargerTarifs({ fetch: reponse(TARIFS) }), TARIFS);
    assert.equal(await chargerTarifs({ fetch: reponse(TARIFS, 500) }), null);
    assert.equal(await chargerTarifs({ fetch: reponse({ familles: "non" }) }), null);
    assert.equal(await chargerTarifs({ fetch: (async () => { throw new Error("réseau"); }) as unknown as typeof fetch }), null);
  });
});

describe("photos des formulaires", () => {
  test("4 au plus, images seulement, 15 Mo au plus", () => {
    const f = (type: string, size = 1000) => ({ type, size });
    assert.deepEqual(photosARetenir([f("image/jpeg"), f("application/pdf"), f("image/png", 16 * 1024 * 1024), f("image/heic")], 0), [f("image/jpeg"), f("image/heic")]);
    assert.equal(photosARetenir([f("image/jpeg"), f("image/jpeg")], 3).length, 1);
    assert.equal(photosARetenir([f("image/jpeg")], MAX_PHOTOS).length, 0);
    assert.match(lire("components/DevisForm.tsx"), /<ChampPhotos /);
    assert.match(lire("app/pro/_components/FormulairePro.tsx"), /<ChampPhotos /);
  });
});

describe("écrans du tunnel (rendus)", () => {
  test("estimation : trois formats en boutons de 44 px (plan vu de dessus), aria-pressed, fourchette et phrase fixe", () => {
    const html = renderToStaticMarkup(createElement(Estimation, { famille: "CUISINE", formats: TARIFS.familles[0].formats, format: "en-l", onFormat: () => undefined, estimation: estimer({ famille: "CUISINE", format: "en-l", tarifs: TARIFS, zonesChoisies: ["facades-cuisine"] }) }));
    assert.equal((html.match(/<button/g) ?? []).length, 3);
    assert.equal((html.match(/min-h-\[44px\]/g) ?? []).length, 3);
    assert.deepEqual(html.match(/aria-pressed="(true|false)"/g), ['aria-pressed="false"', 'aria-pressed="true"', 'aria-pressed="false"']);
    assert.equal((html.match(/<svg/g) ?? []).length, 3);
    assert.match(html.replace(/\s/g, " "), /Estimation : 1 500 à 1 900 €/);
    assert.match(html, /Déplacement compris\. Le devis exact suit vos photos\./);
    const sansChoix = renderToStaticMarkup(createElement(Estimation, { famille: "CUISINE", formats: TARIFS.familles[0].formats, format: null, onFormat: () => undefined, estimation: null }));
    assert.match(sansChoix, /Choisissez une taille/);
    // Autant de colonnes que de formats : trois pour la cuisine, deux pour la salle de bain (pas de case vide).
    assert.match(html, /grid-template-columns:repeat\(3, minmax\(0, 1fr\)\)/);
    const deux = renderToStaticMarkup(createElement(Estimation, { famille: "SDB", formats: [{ id: "un-lavabo", libelle: "Un lavabo", aide: "≈ 80 cm", metres: 0.8 }, { id: "deux-lavabos", libelle: "Deux lavabos", aide: "≈ 1,40 m", metres: 1.4 }], format: null, onFormat: () => undefined, estimation: null }));
    assert.match(deux, /grid-template-columns:repeat\(2, minmax\(0, 1fr\)\)/);
    assert.doesNotMatch(deux, /grid-cols-3/);
  });

  test("rappel : trois créneaux au plus, 44 px, facultatifs (aucun choisi)", () => {
    const html = renderToStaticMarkup(createElement(Rappel, { choisi: null, onChoisir: () => undefined }));
    const boutons = html.match(/<button[^>]*>/g) ?? [];
    assert.ok(boutons.length >= 2 && boutons.length <= 3);
    assert.ok(boutons.every((b) => b.includes("min-h-[44px]") && b.includes('aria-pressed="false"')));
    assert.match(html, /<legend[^>]*>Être rappelé<\/legend>/);
  });

  test("coordonnées réduites : prénom et téléphone exigés, e-mail facultatif, ville seulement si inconnue", () => {
    const rendre = (avecVille: boolean, emailRequis = false) => renderToStaticMarkup(createElement(ChampsContact, { prefixe: "t", formulaire: FORMULAIRE_VIDE, onChange: () => undefined, avecVille, emailRequis }));
    const avec = rendre(true);
    assert.match(avec, /Prénom \*/);
    assert.match(avec, /id="t-email"(?![^>]*required)[^>]*>/);
    assert.match(avec, /\(facultatif\)/);
    assert.match(avec, /id="t-ville"/);
    assert.doesNotMatch(avec, /t-message/, "plus de message libre");
    assert.doesNotMatch(rendre(false), /id="t-ville"|id="t-cp"/);
    assert.match(rendre(true, true), /id="t-email"[^>]*required/);
  });

  test("fin de l'écran Résultat : un seul bouton principal, WhatsApp en secondaire avec le message de la simulation, téléphone en cible de 44 px", () => {
    const rendre = (rendu: RenduSimulateur) => renderToStaticMarkup(
      createElement(DemandeApresRendu, { projet: "cuisine", rendu, tarifs: TARIFS, formulaire: FORMULAIRE_VIDE, onFormulaire: () => undefined, avecVille: true, occupe: false, envoye: null, onEnvoyer: () => undefined, onEstimationVue: () => undefined, captcha: null, onRecommencer: () => undefined })
    );
    // Façades seules : la taille change le chiffre, on la demande.
    const html = rendre({ ...RENDU, references: [RENDU.references[0]] });
    assert.equal(principaux(html), 1);
    assert.match(html, />Recevoir mon devis<\/button>/);
    assert.match(html, /wa\.me\/33670352869\?text=Bonjour%2C%20je%20viens%20de%20simuler%20ma%20cuisine/);
    assert.match(html, /Quelle taille \?/);
    assert.match(html, /<a href="tel:[^"]*" class="inline-flex min-h-\[44px\] items-center/);
    // Façades ET plan de travail : la taille ne changerait rien (fourchette de la pièce) — pas de geste pour rien.
    const avecPlan = rendre(RENDU);
    assert.doesNotMatch(avecPlan, /Quelle taille \?/);
    assert.match(avecPlan, /Combien ça coûte \?/);
    assert.match(avecPlan.replace(/\s/g, " "), /Cuisine : 1 200 à 3 500 €/);
  });

  test("« Votre espace est prêt » : le lien en clair, « Ouvrir mon espace », copie, rappel ; rien n'est envoyé d'ici", () => {
    const lien = "https://coverswap.fr/e/abcd1234-signature";
    const html = renderToStaticMarkup(createElement(EspacePret, { lienEspace: lien, phraseRappel: "Lucas vous appelle demain à 10 h.", messageWhatsApp: "Bonjour", onRecommencer: () => undefined }));
    assert.match(html, /Votre espace est prêt/);
    assert.ok(html.includes(`>${lien}</p>`), "lien affiché en clair");
    assert.match(html, new RegExp(`<a href="${lien}"[^>]*>Ouvrir mon espace</a>`));
    assert.match(html, /Copier le lien/);
    assert.match(html, /Lucas vous appelle demain à 10 h\./);
    assert.equal(principaux(html), 1);
    const sansLien = renderToStaticMarkup(createElement(EspacePret, { lienEspace: null, phraseRappel: null, messageWhatsApp: "Bonjour", onRecommencer: () => undefined }));
    assert.match(sansLien, /Demande bien reçue/);
    assert.match(sansLien, /Nous vous rappelons pour finaliser\./);
    for (const f of ["EspacePret.tsx", "DemandeApresRendu.tsx", "Estimation.tsx", "Rappel.tsx"]) assert.doesNotMatch(lire(`app/simulateur/_components/${f}`), /fetch\(|sendBeacon|mailto:/, f);
  });
});

describe("/pro et /contact", () => {
  test("/pro : titre, trois références « Ambiance », trois arguments, un bouton vers le formulaire, textes de l'ancienne page repris", async () => {
    const { default: PagePro } = await import("@/app/pro/page");
    const html = renderToStaticMarkup(createElement(PagePro));
    assert.match(html, new RegExp(`<h1[^>]*>${TITRE_PRO}</h1>`));
    // L'ouverture : une ligne courte (l'accroche entière est plus bas, sous « en détail »).
    assert.ok(LIGNE_PRO.length <= 80);
    const ouverture = html.slice(html.indexOf("<h1"), html.indexOf(">Demander un devis pro</a>"));
    assert.ok(ouverture.includes(LIGNE_PRO.replace(/'/g, "&#x27;")));
    assert.ok(!ouverture.includes("sous-traitance"), "l'accroche longue n'est pas dans l'ouverture");
    assert.equal((html.match(/>Ambiance</g) ?? []).length, 3);
    for (const r of REFERENCES_PRO) assert.ok(html.includes(`/images/prep/${r.nom}-`), r.nom);
    const echappe = (t: string) => t.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");
    for (const a of ARGUMENTS_PRO) assert.ok(html.includes(a.titre) && html.includes(echappe(a.texte)), a.titre);
    assert.match(html, /<a[^>]*href="#devis-pro"[^>]*>Demander un devis pro<\/a>/);
    assert.match(html, /id="devis-pro"/);
    const pro = getPrestation("professionnel")!;
    for (const t of [...pro.intro, ...pro.surfaces.map((s) => s.texte), ...pro.atouts.map((a) => a.texte), ...pro.deroulement.map((d) => d.texte), pro.prix.texte, ...pro.faq.map((f) => f.q), pro.accroche]) assert.ok(html.includes(echappe(t)), `texte repris : ${t.slice(0, 40)}`);
    assert.match(html, /"@type":"FAQPage"/);
    assert.doesNotMatch(html, /simulateur/, "pas de simulateur sur /pro");
    assert.doesNotMatch(html, /href="\/devis|href="\/prestations\/professionnel/);
  });

  test("/contact : une colonne, « Écrivez-nous », téléphone et e-mail, ancre #espace avec la phrase de l'espace client", () => {
    const page = lire("app/contact/page.tsx");
    assert.match(page, /<h1 className="titre-1[^"]*">Écrivez-nous<\/h1>/);
    assert.match(page, /ENTREPRISE\.telephone/);
    assert.match(page, /ENTREPRISE\.email/);
    assert.match(page, /id="espace"/);
    assert.ok(page.includes("Votre lien d&apos;accès vous a été envoyé par SMS ou e-mail. Vous ne le retrouvez pas ? Écrivez-nous ci-dessus avec votre nom : nous vous le renvoyons."));
    assert.doesNotMatch(page, /lg:grid-cols/, "une seule colonne");
    // La confirmation du formulaire : titre et texte, sans pastille colorée ; une réponse neutre (la page sert aussi à redemander son lien).
    const formulaire = lire("components/DevisForm.tsx");
    assert.doesNotMatch(formulaire, /bg-ok-fond|<svg/);
    assert.match(formulaire, /Nous vous répondons \{DELAI_REPONSE\}\./);
  });

  test("formulaires de /pro et /contact : Turnstile au premier geste, catalogue jamais embarqué, largeur du champ surface, titre de confirmation", () => {
    for (const f of ["app/pro/_components/FormulairePro.tsx", "components/DevisForm.tsx"]) {
      const source = lire(f);
      assert.match(source, /onFocusCapture=\{toucher\} onPointerDownCapture=\{toucher\}/, f);
      assert.match(source, /<Turnstile [^>]*actif=\{touche\}/, f);
      assert.doesNotMatch(source, /from "@\/lib\/offre"/, `${f} : offre-legere, pas le catalogue`);
    }
    for (const f of ["app/simulateur/_components/Simulateur.tsx", "app/simulateur/_components/DemandeApresRendu.tsx", "app/simulateur/_components/EspacePret.tsx", "lib/estimation.ts"]) assert.doesNotMatch(lire(f), /from "(@\/lib|\.)\/offre"/, f);
    assert.doesNotMatch(lire("lib/offre-legere.ts"), /^import /m, "offre-legere n'importe rien (ni le catalogue)");
    const turnstile = lire("components/Turnstile.tsx");
    assert.match(turnstile, /if \(!TURNSTILE_SITE_KEY \|\| !actif\) return;/);
    assert.match(turnstile, /if \(!actif\) return <div className="min-h-\[65px\]" aria-hidden \/>;/, "place réservée, pas de décalage");
    const pro = lire("app/pro/_components/FormulairePro.tsx");
    assert.match(pro, /className=\{`\$\{CHAMP\} max-w-32`\}/);
    assert.match(pro, /<h3 className="titre-2 text-encre">Demande envoyée<\/h3>/);
  });

  test("les blocs des pages de prestation sont dessinés une fois (BlocsPrestation), pour /prestations/* et /pro", () => {
    for (const f of ["components/ContenuPrestation.tsx", "app/pro/page.tsx"]) {
      const source = lire(f);
      assert.match(source, /from "@\/components\/BlocsPrestation"/, f);
      assert.doesNotMatch(source, /group-open:rotate-45|rounded-full border border-encre|Tarif au mètre linéaire de film posé/, `${f} : pas de copie`);
    }
  });

  test("balisage Service : l'offre suit le bouton de la page (simulateur de la pièce, sinon /contact pour les vitrages)", () => {
    const offre = (slug: string) => {
      const p = getPrestation(slug)!;
      const html = renderToStaticMarkup(createElement(ContenuPrestation, { p, url: `https://coverswap.fr/prestations/${slug}`, fil: [], filSchema: [] }));
      const service = JSON.parse(html.match(/<script[^>]*>(\{"@context":"https:\/\/schema\.org","@type":"Service"[\s\S]*?)<\/script>/)![1]) as { offers?: { url?: string } };
      return service.offers?.url;
    };
    assert.equal(offre("vitrages"), "https://coverswap.fr/contact");
    assert.equal(offre("cuisine"), "https://coverswap.fr/simulateur?projet=cuisine");
  });

  test("les textes de l'ancienne /devis et l'ancien titre de /contact sont repris (/comment-ca-marche, métadonnées du simulateur)", async () => {
    const { default: PageCommentCaMarche, metadata } = await import("@/app/comment-ca-marche/page");
    const html = renderToStaticMarkup(createElement(PageCommentCaMarche)).replace(/&#x27;/g, "'");
    for (const t of [TITRE_DEVIS_EN_LIGNE, INTRO_DEVIS_EN_LIGNE, LIEN_DEVIS_EN_LIGNE, ...ETAPES_DEVIS_EN_LIGNE.flatMap((e) => [e.titre, e.texte]), ...AVANTAGES_DEVIS_EN_LIGNE.flatMap((a) => [a.titre, a.texte])]) assert.ok(html.includes(t.replace(/&/g, "&amp;")), `repris : ${t.slice(0, 40)}`);
    assert.match(html, /href="\/contact"/);
    assert.match(String(metadata.keywords), /devis covering en ligne/);
    const { metadata: simulateur } = await import("@/app/simulateur/page");
    assert.match(String(simulateur.keywords), /devis covering en ligne, devis covering gratuit/);
    assert.match(String(simulateur.description), /devis covering en ligne, gratuit et sans engagement/);
    assert.match(String(simulateur.description), /Coordonnées demandées seulement pour recevoir le rendu/);
  });
});
