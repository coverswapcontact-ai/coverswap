import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TEINTE_PRINCIPALE } from "@/components/simulation/Bouton";
import { corpsDemandeSimulation, messageDemande } from "@/lib/simulateur/demande";
import type { RenduSimulateur, Selection } from "@/lib/simulateur/reprise";
import { CartelComposition } from "./CartelComposition";
import { DemandeApresRendu } from "./DemandeApresRendu";
import EcranResultat from "./EcranResultat";
import { FORMULAIRE_VIDE } from "./Formulaires";

/**
 * Site 3.0, lot E4 : après le rendu, le cartel de la composition (références réelles, zones, liens vers les fiches),
 * l'estimation inchangée, et « Recevoir ces échantillons chez moi » (lien secondaire vers `#demande`, qui coche la case
 * des échantillons ; la demande dit les références). Rien n'est envoyé ici : rendus statiques, aucun réseau.
 */
const lire = (f: string) => readFileSync(path.join(process.cwd(), "src", f), "utf8");
const texte = (html: string) => html.replace(/&#x27;|&apos;/g, "'");
const rien = () => undefined;
const principaux = (html: string) => [...html.matchAll(/class="([^"]*)"/g)].filter(([, classes]) => classes.includes(TEINTE_PRINCIPALE)).length;
const choix = (ref: string, nom: string, famille: string, finition = "Soft"): Selection => ({ ref, nom, famille, finition, categorie: "", tags: [], image: "" });
const RENDU: RenduSimulateur = {
  travailId: "cmun000000000001",
  simulationSiteId: "cmun000000000002",
  urlApres: "https://crm.coverswap.fr/api/simulate/image?id=1",
  urlAvant: null,
  references: [
    { zone: "facades-cuisine", libelle: "Façades", ref: "NF13", nom: "Deep Green" },
    { zone: "plan-de-travail", libelle: "Plan de travail", ref: "AG13", nom: "Pale Oak" },
  ],
  le: 1,
};
const SELECTIONS = { "facades-cuisine": choix("NF13", "Deep Green", "couleur"), "plan-de-travail": choix("K1", "Black", "couleur") };
const cartel = (onEchantillons?: () => void, references = RENDU.references) => texte(renderToStaticMarkup(createElement(CartelComposition, { references, selections: SELECTIONS, onEchantillons })));
const demande = (formulaire = FORMULAIRE_VIDE, envoye: { lienEspace: string | null; phraseRappel: string | null } | null = null) =>
  texte(renderToStaticMarkup(createElement(DemandeApresRendu, { projet: "cuisine", rendu: RENDU, tarifs: null, formulaire, onFormulaire: rien, avecVille: true, occupe: false, envoye, onEnvoyer: rien, onEstimationVue: rien, captcha: null, onRecommencer: rien })));

describe("lot E4 : le cartel de la composition", () => {
  test("les références réelles du rendu, leurs zones, nom et vignette ; famille et finition quand la sélection est ce film ; un lien vers chaque fiche", () => {
    const html = cartel(rien);
    assert.match(html, /La composition/);
    assert.match(html, /aria-label="Films utilisés"/);
    for (const r of RENDU.references) {
      assert.ok(html.includes(`>${r.libelle}</span>`), r.libelle);
      assert.ok(html.includes(r.nom) && html.includes(r.ref), r.ref);
      assert.ok(html.includes(`/api/site/echantillons/${r.ref}?l=320`), `vignette ${r.ref}`);
    }
    assert.match(html, /href="\/matieres\/couleur\/NF13"/, "famille connue : la fiche");
    assert.match(html, /Couleur · Standard/);
    // AG13 rendu alors que la zone porte K1 aujourd'hui : rien n'est deviné, le présentoir s'ouvre sur la référence.
    assert.match(html, /href="\/matieres\?ref=AG13"/);
    assert.equal((html.match(/>Voir la fiche</g) ?? []).length, 2);
    assert.equal(principaux(html), 0);
  });

  test("« Recevoir ces échantillons chez moi » : un lien vers #demande, seulement avant l'envoi ; « Essayer cette composition chez moi » n'est pas là", () => {
    assert.match(cartel(rien), /<a href="#demande"[^>]*>Recevoir ces échantillons chez moi<\/a>/);
    assert.doesNotMatch(cartel(), /Recevoir ces échantillons/);
    assert.equal(cartel(rien, []), "", "pas de film, pas de cartel");
    const resultat = texte(renderToStaticMarkup(createElement(EcranResultat, { rendu: RENDU, rendus: [RENDU], photo: null, titre: "Votre cuisine", fondu: false, onFonduFini: rien, onChoisirRendu: rien, onAutresMatieres: rien, selections: SELECTIONS, onEchantillons: rien })));
    assert.match(resultat, /La composition/);
    assert.match(resultat, />Recevoir ces échantillons chez moi</);
    assert.doesNotMatch(resultat, /Essayer cette composition chez moi/);
    assert.doesNotMatch(lire("app/simulateur/_components/CartelComposition.tsx"), /fetch\(|sendBeacon/);
  });

  test("la demande : id=\"demande\" (avant et après l'envoi), la case des échantillons cochée par le lien, toujours un seul principal ; l'estimation reste", () => {
    const html = demande();
    assert.match(html, /^<div id="demande"/);
    const caseEchantillons = (h: string) => /<input type="checkbox"[^>]*name="echantillons"[^>]*>/.exec(h)?.[0] ?? "";
    assert.ok(caseEchantillons(html) && !caseEchantillons(html).includes("checked"), "décochée par défaut");
    assert.match(html, /Recevoir les échantillons de ces matières chez moi/);
    assert.match(html, /Façades : NF13 · Plan de travail : AG13/);
    assert.match(html, /Combien ça coûte \?/, "l'estimation ne change pas");
    assert.equal(principaux(html), 1);
    assert.ok(caseEchantillons(demande({ ...FORMULAIRE_VIDE, echantillons: true })).includes('checked=""'), "cochée par le lien");
    assert.match(demande(FORMULAIRE_VIDE, { lienEspace: null, phraseRappel: null }), /^<div id="demande"/);
  });

  test("le message de la demande : « Souhaite recevoir les échantillons : RÉF (zone), … », seulement si la case est cochée ; avec l'exemple, deux lignes", () => {
    assert.equal(messageDemande({ echantillons: true, references: RENDU.references }), "Souhaite recevoir les échantillons : NF13 (Façades), AG13 (Plan de travail)");
    assert.equal(messageDemande({ echantillons: false, references: RENDU.references }), "");
    assert.equal(messageDemande({ echantillons: true, references: [] }), "");
    const base = { formulaire: { name: "Aline", phone: "0611000001", email: "", ville: "Lattes", codePostal: "34970" }, connus: { ville: null, codePostal: null }, projet: "cuisine", parcoursId: null, simulationIds: [], references: RENDU.references, echec: null, jetonCaptcha: null, acquisition: {}, consentement: {}, page: "/simulateur" };
    assert.equal(corpsDemandeSimulation({ ...base, echantillons: true, exemple: "cuisine-l-hetre" }).message, "Simulation sur une pièce d'exemple : cuisine-l-hetre\nSouhaite recevoir les échantillons : NF13 (Façades), AG13 (Plan de travail)");
    assert.ok(!("echantillons" in corpsDemandeSimulation({ ...base, echantillons: true })), "pas de champ à part : la note seulement");
    const s = lire("app/simulateur/_components/Simulateur.tsx");
    assert.match(s, /echantillons: !depuisEchec && !!formulaire\.echantillons,/, "jamais avec la demande après un échec");
    assert.match(s, /onEchantillons=\{envoye \? undefined : \(\) => setFormulaire\(\(f\) => \(\{ \.\.\.f, echantillons: true \}\)\)\}/);
  });
});
