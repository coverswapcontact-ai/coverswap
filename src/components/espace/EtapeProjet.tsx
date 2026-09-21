"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { nomDuProjet, type Client, type Etat, type ProjetClient } from "./api";
import { CuisineDeFace, PlanCuisine } from "./Illustrations";
import { Annonce, BoutonPrincipal, CaseCarte, Carte, EnteteEtape, Surtitre, cx } from "./ui";

/**
 * Étape 2 — le projet : des images à toucher, pas un formulaire. Ce qu'il veut
 * rafraîchir, ses goûts, un ordre de grandeur, un mot libre. Ce qu'on sait
 * déjà (formulaire, simulations du site) est prérempli. Chaque geste est
 * enregistré tout seul ; sans réseau, il part au retour du réseau.
 */

const ZONES_PAR_PROJET: Record<string, { id: string; libelle: string; aide: string; dessin?: string }[]> = {
  CUISINE: [
    { id: "meubles-hauts", libelle: "Façades hautes", aide: "Au-dessus du plan de travail", dessin: "meubles-hauts" },
    { id: "meubles-bas", libelle: "Façades basses", aide: "Portes, tiroirs, îlot", dessin: "meubles-bas" },
    { id: "plan-de-travail", libelle: "Plan de travail", aide: "Le dessus et son chant", dessin: "plan-de-travail" },
    { id: "credence", libelle: "Crédence", aide: "Le mur derrière le plan", dessin: "credence" },
  ],
  SDB: [
    { id: "meuble-vasque", libelle: "Meuble vasque", aide: "Les façades sous le lavabo" },
    { id: "plan-vasque", libelle: "Plan vasque", aide: "Le dessus autour du lavabo" },
    { id: "carrelage-mural", libelle: "Murs carrelés", aide: "Recouvrir le carrelage" },
  ],
  MEUBLES: [
    { id: "portes-dressing", libelle: "Dressing, placards", aide: "Portes battantes ou coulissantes" },
    { id: "meuble-tv", libelle: "Meuble TV", aide: "Façades, dessus et côtés" },
    { id: "meuble-complet", libelle: "Commode, buffet, bureau", aide: "Un meuble seul" },
  ],
  PRO: [
    { id: "comptoir-habillage", libelle: "Bar, comptoir", aide: "La façade et le plateau" },
    { id: "mobilier-pro", libelle: "Mobilier", aide: "Distributeur, présentoir, casiers" },
    { id: "rangements-pro", libelle: "Rangements", aide: "Placards et armoires" },
    { id: "habillage-mural", libelle: "Un mur", aide: "Un mur ou un panneau" },
  ],
};

/** Une teinte réelle du catalogue Cover Styl' pour chaque famille : on choisit sur de vrais échantillons. */
const STYLES = [
  { id: "bois-clair", libelle: "Bois clair", ref: "AG13" },
  { id: "bois-fonce", libelle: "Bois foncé", ref: "AL25" },
  { id: "blanc", libelle: "Blanc", ref: "J3" },
  { id: "uni-colore", libelle: "Uni coloré", ref: "NE83" },
  { id: "marbre", libelle: "Effet marbre", ref: "NE31" },
  { id: "beton", libelle: "Effet béton", ref: "NE24" },
];

const REPERES = [
  { id: "une-rangee", libelle: "Un seul mur", aide: "≈ 3 m", metres: 3 },
  { id: "en-l", libelle: "En L", aide: "≈ 5 m", metres: 5 },
  { id: "en-u", libelle: "En U", aide: "≈ 7 m", metres: 7 },
  { id: "ilot", libelle: "Avec îlot", aide: "≈ 8 m", metres: 8 },
] as const;

const DELAIS = [
  { id: "vite", libelle: "Dès que possible" },
  { id: "1-3-mois", libelle: "Dans 1 à 3 mois" },
  { id: "plus-tard", libelle: "Plus tard" },
];

const VIDE: ProjetClient = { zones: [], styles: [], propositions: false, metres: null, repere: null, delai: null, precisions: "" };

/** Ce qu'on sait déjà, pour ne jamais redemander. */
function prerempli(etat: Etat): { projet: ProjetClient; depuis: string[] } {
  if (etat.monProjet) return { projet: etat.monProjet, depuis: [] };
  const depuis: string[] = [];
  const projet = { ...VIDE };
  if (etat.connu.zones.length) {
    projet.zones = etat.connu.zones;
    depuis.push("vos simulations sur le site");
  }
  if (etat.connu.delai) {
    projet.delai = etat.connu.delai;
    depuis.push("votre demande");
  }
  const taille = (etat.connu.tailleCuisine ?? "").toLowerCase();
  if (taille) {
    projet.repere = /ilot|îlot/.test(taille) ? "ilot" : /grande/.test(taille) ? "en-u" : /moyenne/.test(taille) ? "en-l" : /petite/.test(taille) ? "une-rangee" : null;
    const metres = Number(/(\d+(?:[.,]\d+)?)\s*(m|mètre|metre)/.exec(taille)?.[1]?.replace(",", "."));
    projet.metres = metres > 0 && metres <= 60 ? metres : (REPERES.find((r) => r.id === projet.repere)?.metres ?? null);
    if (!depuis.includes("votre demande")) depuis.push("votre demande");
  }
  return { projet, depuis };
}

export function EtapeProjet({ etat, client, onEtat, onRetour, onSuite }: { etat: Etat; client: Client; onEtat: (etat: Etat) => void; onRetour: () => void; onSuite: () => void }) {
  const initial = useMemo(() => prerempli(etat), [etat]);
  const [projet, setProjet] = useState<ProjetClient>(initial.projet);
  const [sauvegarde, setSauvegarde] = useState<"" | "en-cours" | "ok" | "attente">("");
  const courant = useRef(projet);
  const minuterie = useRef<number | null>(null);
  const apercu = Boolean(client.apercu);
  const zones = ZONES_PAR_PROJET[etat.typeProjet] ?? ZONES_PAR_PROJET.CUISINE;
  const cuisine = (etat.typeProjet ?? "CUISINE") === "CUISINE";
  const nom = nomDuProjet(etat.typeProjet);

  async function enregistrer(valeur: ProjetClient): Promise<boolean> {
    if (apercu) return true;
    setSauvegarde("en-cours");
    try {
      await client.envoyerJson("/projet", "PUT", valeur);
      setSauvegarde("ok");
      try {
        localStorage.removeItem(`espace-projet:${client.racine}`);
      } catch {
        // stockage indisponible : sans conséquence
      }
      return true;
    } catch {
      // Pas de réseau : gardé dans le téléphone, renvoyé au retour du réseau.
      try {
        localStorage.setItem(`espace-projet:${client.racine}`, JSON.stringify(valeur));
      } catch {
        // stockage indisponible
      }
      setSauvegarde("attente");
      return false;
    }
  }

  useEffect(() => {
    const renvoyer = () => {
      try {
        const garde = localStorage.getItem(`espace-projet:${client.racine}`);
        if (garde) void enregistrer(JSON.parse(garde) as ProjetClient);
      } catch {
        // rien à renvoyer
      }
    };
    renvoyer();
    window.addEventListener("online", renvoyer);
    return () => window.removeEventListener("online", renvoyer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.racine]);

  function changer(modif: (avant: ProjetClient) => ProjetClient) {
    const suite = modif(courant.current);
    courant.current = suite;
    setProjet(suite);
    setSauvegarde("en-cours");
    if (minuterie.current) window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => void enregistrer(courant.current), 700);
  }

  const basculer = (liste: string[], valeur: string) => (liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur]);
  const tout = zones.every((z) => projet.zones.includes(z.id));
  const pret = projet.zones.length > 0 || projet.propositions || projet.styles.length > 0;

  async function valider() {
    if (minuterie.current) window.clearTimeout(minuterie.current);
    await enregistrer(courant.current);
    try {
      const { espace } = await client.appeler<{ espace: Etat }>("");
      onEtat(espace);
    } catch {
      // l'accueil se rechargera au retour du réseau
    }
    onSuite();
  }

  return (
    <div className="space-y-5">
      <EnteteEtape titre="Votre projet" phrase={`Dites-moi ce que vous voulez changer dans ${nom.votre}. Touchez ce qui vous correspond : c'est enregistré au fur et à mesure.`} onRetour={onRetour} />

      {initial.depuis.length > 0 ? <Annonce>J&apos;ai prérempli d&apos;après {initial.depuis.join(" et ")}. Modifiez si besoin.</Annonce> : null}

      <Carte>
        <Surtitre>Ce que vous voulez rafraîchir</Surtitre>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {zones.map((zone) => (
            <CaseCarte
              key={zone.id}
              coche={projet.zones.includes(zone.id)}
              onBasculer={() => changer((p) => ({ ...p, zones: basculer(p.zones, zone.id) }))}
              titre={zone.libelle}
              aide={zone.aide}
              illustration={zone.dessin ? <CuisineDeFace allume={[zone.dessin]} className="w-full rounded-lg bg-[#F7F6F3] p-1" /> : undefined}
            />
          ))}
        </div>
        <button
          type="button"
          role="checkbox"
          aria-checked={tout}
          onClick={() => changer((p) => ({ ...p, zones: tout ? [] : zones.map((z) => z.id) }))}
          className={cx("mt-2.5 flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 text-[16px] font-semibold", tout ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#E2DFD9] text-[#1A1A1A] active:bg-[#F6F5F2]")}
        >
          {tout ? "✓ Tout" : cuisine ? "Toute la cuisine" : "Tout"}
        </button>
      </Carte>

      <Carte>
        <Surtitre>Vos goûts</Surtitre>
        <p className="mt-1 text-[15px] text-[#4F4A44]">Plusieurs choix possibles. Ce sont de vrais échantillons.</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {STYLES.map((style) => {
            const coche = projet.styles.includes(style.id);
            return (
              <button
                key={style.id}
                type="button"
                role="checkbox"
                aria-checked={coche}
                aria-label={style.libelle}
                onClick={() => changer((p) => ({ ...p, styles: basculer(p.styles, style.id) }))}
                className={cx("relative overflow-hidden rounded-2xl border-2 bg-white text-left", coche ? "border-[#1A1A1A]" : "border-[#E2DFD9]")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- échantillon servi par le CRM */}
                <img src={client.url(`/echantillons/${style.ref}`)} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                <span className="flex min-h-[44px] items-center px-3 text-[15.5px] font-semibold text-[#1A1A1A]">{style.libelle}</span>
                <span aria-hidden className={cx("absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 text-[14px] font-bold", coche ? "border-white bg-[#1A1A1A] text-white" : "border-white bg-white/80")}>
                  {coche ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          role="checkbox"
          aria-checked={projet.propositions}
          aria-label="Je ne sais pas, proposez-moi"
          onClick={() => changer((p) => ({ ...p, propositions: !p.propositions }))}
          className={cx("mt-2.5 flex min-h-[56px] w-full items-center gap-3 rounded-2xl border-2 px-4 text-left", projet.propositions ? "border-[#1A1A1A] bg-[#FAF9F7]" : "border-[#E2DFD9]")}
        >
          <span aria-hidden className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-bold", projet.propositions ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#BDB8B0]")}>
            {projet.propositions ? "✓" : ""}
          </span>
          <span>
            <span className="block text-[16px] font-semibold text-[#1A1A1A]">Je ne sais pas, proposez-moi</span>
            <span className="block text-[14px] text-[#5F5A53]">Je vous suggère ce qui ira bien chez vous.</span>
          </span>
        </button>
      </Carte>

      <Carte>
        <Surtitre>{cuisine ? "La taille de votre cuisine" : "Combien de mètres de meubles, environ ?"}</Surtitre>
        <p className="mt-1 text-[15px] text-[#4F4A44]">Une estimation suffit : je vérifierai sur place.</p>
        {cuisine ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {REPERES.map((repere) => (
              <CaseCarte
                key={repere.id}
                coche={projet.repere === repere.id}
                onBasculer={() => changer((p) => (p.repere === repere.id ? { ...p, repere: null, metres: null } : { ...p, repere: repere.id, metres: repere.metres }))}
                titre={repere.libelle}
                aide={repere.aide}
                illustration={<PlanCuisine forme={repere.id} className="h-16 w-full" />}
              />
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#F6F5F2] p-2">
          <button type="button" aria-label="Moins" onClick={() => changer((p) => ({ ...p, metres: Math.max(0.5, (p.metres ?? 3) - 0.5) }))} className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[24px] font-semibold text-[#1A1A1A] shadow-sm active:bg-[#ECEAE5]">
            −
          </button>
          <span className="text-center" aria-live="polite">
            <span className="block font-display text-[26px] leading-none font-semibold tabular-nums text-[#1A1A1A]">{projet.metres ? `≈ ${String(projet.metres).replace(".", ",")} m` : "—"}</span>
            <span className="text-[13px] text-[#5F5A53]">de meubles, mis bout à bout</span>
          </span>
          <button type="button" aria-label="Plus" onClick={() => changer((p) => ({ ...p, metres: Math.min(60, (p.metres ?? 2.5) + 0.5) }))} className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[24px] font-semibold text-[#1A1A1A] shadow-sm active:bg-[#ECEAE5]">
            +
          </button>
        </div>
      </Carte>

      {!etat.connu.delai ? (
        <Carte>
          <Surtitre>Pour quand ?</Surtitre>
          <div className="mt-3 flex flex-wrap gap-2">
            {DELAIS.map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={projet.delai === d.id}
                onClick={() => changer((p) => ({ ...p, delai: p.delai === d.id ? null : d.id }))}
                className={cx("min-h-[48px] rounded-full border-2 px-4 text-[15.5px] font-medium", projet.delai === d.id ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#E2DFD9] text-[#1A1A1A]")}
              >
                {d.libelle}
              </button>
            ))}
          </div>
        </Carte>
      ) : null}

      <Carte>
        <label htmlFor="precisions">
          <Surtitre>Un mot pour moi ? (facultatif)</Surtitre>
        </label>
        <textarea
          id="precisions"
          rows={3}
          maxLength={1000}
          value={projet.precisions}
          onChange={(e) => changer((p) => ({ ...p, precisions: e.target.value }))}
          placeholder="Garder les poignées, un plan de travail qui résiste à la chaleur…"
          className="mt-3 w-full rounded-2xl border border-[#D3CFC8] bg-white px-4 py-3 text-[17px] leading-relaxed text-[#1A1A1A] placeholder:text-[#8A857E] focus:border-[#1A1A1A] focus:outline-none"
        />
      </Carte>

      <div className="space-y-2">
        <BoutonPrincipal onClick={() => void valider()} disabled={!pret}>
          {pret ? "C'est noté, continuer" : "Choisissez au moins une zone ou « proposez-moi »"}
        </BoutonPrincipal>
        <p className="h-5 text-center text-[13.5px] text-[#5F5A53]" aria-live="polite">
          {apercu ? "Aperçu : rien n'est enregistré." : sauvegarde === "en-cours" ? "Enregistrement…" : sauvegarde === "ok" ? "Enregistré ✓" : sauvegarde === "attente" ? "Gardé dans votre téléphone : envoyé dès le retour du réseau." : ""}
        </p>
      </div>
    </div>
  );
}
