import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { apresHistorique, entrerFeuille } from "./historique-feuilles";

/**
 * Mission 16 (partie 1) — les feuilles et l'historique du navigateur, sur un
 * faux `window.history` (les `popstate` arrivent au tour suivant, comme dans
 * un navigateur). Le cas qui compte : un lien du menu du téléphone ferme la
 * feuille puis navigue ; la navigation doit partir APRÈS le retour
 * d'historique de la feuille (sinon Next l'abandonne au `popstate`), et ne
 * laisser aucune entrée fantôme.
 */

type Etat = Record<string, unknown> | null;

const journal: string[] = [];
const auditeurs: ((e: { state: Etat }) => void)[] = [];
const historique = {
  entrees: [{ __NA: true, page: "A" }] as Etat[],
  index: 0,
  get state(): Etat {
    return this.entrees[this.index];
  },
  pushState(etat: Etat) {
    this.entrees = this.entrees.slice(0, this.index + 1);
    this.entrees.push(etat);
    this.index++;
    journal.push("push");
  },
  replaceState(etat: Etat) {
    this.entrees[this.index] = etat;
  },
  go(n: number) {
    journal.push(`go(${n})`);
    setTimeout(() => {
      this.index += n;
      journal.push("popstate");
      for (const auditeur of auditeurs) auditeur({ state: this.state });
    }, 5);
  },
};
// Le module ne lit `window` qu'à l'appel : le faux est posé avant le premier test.
Object.assign(globalThis, { window: { history: historique, addEventListener: (_type: string, f: (e: { state: Etat }) => void) => auditeurs.push(f) } });

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));
/**
 * Attend qu'une condition soit vraie (2 s au plus). Une attente fixe ne suffit pas : sous charge (suite complète),
 * les minuteurs échus partent ensemble et une attente de 20 ms peut finir avant le faux `popstate`.
 */
async function jusqua(condition: () => boolean, maxMs = 2000) {
  const fin = Date.now() + maxMs;
  while (!condition() && Date.now() < fin) await attendre(5);
}
const remettre = (page: string) => {
  historique.entrees = [{ __NA: true, page }];
  historique.index = 0;
  journal.length = 0;
};

describe("historique des feuilles", () => {
  test("rien en cours : le rappel part tout de suite", () => {
    remettre("A");
    let appele = false;
    apresHistorique(() => (appele = true));
    assert.equal(appele, true);
  });

  test("ouverte = une entrée (l'état de Next gardé) ; fermée par un bouton = l'entrée rendue", async () => {
    remettre("A");
    let fermeeParRetour = false;
    const sortir = entrerFeuille(() => (fermeeParRetour = true));
    assert.equal(historique.entrees.length, 2);
    assert.equal(historique.state?.__NA, true);
    assert.equal(typeof historique.state?.feuille, "number");
    sortir();
    await jusqua(() => journal.includes("popstate"));
    assert.equal(historique.index, 0);
    assert.equal(historique.state?.page, "A");
    assert.equal(fermeeParRetour, false);
  });

  test("un lien de la feuille : la navigation part après le retour d'historique, sans entrée fantôme", async () => {
    remettre("A");
    const sortir = entrerFeuille(() => {});
    // Le clic : la feuille se ferme, puis (dans l'effet qui suit) on demande à naviguer.
    sortir();
    apresHistorique(() => {
      journal.push("navigation");
      historique.pushState({ __NA: true, page: "B" });
    });
    assert.ok(!journal.includes("navigation"), "la navigation ne part pas avant le retour");
    await jusqua(() => journal.includes("navigation"));
    assert.deepEqual(journal, ["push", "go(-1)", "popstate", "navigation", "push"]);
    assert.deepEqual(
      historique.entrees.map((e) => e?.page),
      ["A", "B"],
    );
    assert.equal(historique.index, 1);
  });

  test("le geste retour ferme la feuille ; la fermeture qui suit ne touche plus à l'historique", async () => {
    remettre("A");
    let fermee = false;
    const sortir = entrerFeuille(() => (fermee = true));
    historique.go(-1);
    await jusqua(() => fermee);
    assert.equal(fermee, true);
    sortir();
    await attendre(50);
    assert.deepEqual(journal, ["push", "go(-1)", "popstate"]);
    let appele = false;
    apresHistorique(() => (appele = true));
    assert.equal(appele, true);
  });

  test("l'adresse a déjà changé (un bouton de la feuille a navigué) : l'entrée n'est pas défaite", async () => {
    remettre("A");
    const sortir = entrerFeuille(() => {});
    historique.pushState({ __NA: true, page: "B" });
    sortir();
    let appele = false;
    apresHistorique(() => (appele = true));
    await jusqua(() => appele);
    assert.equal(appele, true);
    assert.ok(!journal.some((l) => l.startsWith("go(")), "aucun retour d'historique");
    assert.equal(historique.state?.page, "B");
  });

  test("deux feuilles fermées ensemble : un seul retour de deux entrées", async () => {
    remettre("A");
    const sortir1 = entrerFeuille(() => {});
    const sortir2 = entrerFeuille(() => {});
    sortir2();
    sortir1();
    await jusqua(() => journal.includes("popstate"));
    assert.deepEqual(
      journal.filter((l) => l.startsWith("go(")),
      ["go(-2)"],
    );
    assert.equal(historique.index, 0);
  });
});
