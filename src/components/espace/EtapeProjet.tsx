"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ErreurEspace, MESSAGE_APERCU, nomDuProjet, type Client, type Etat, type ProjetClient } from "./api";
import { CuisineDeFace, PlanCuisine } from "./Illustrations";
import { IconeCoche } from "./Illustrations";
import { Annonce, BoutonPrincipal, BoutonSecondaire, Carte, CaseCarte, Enregistrement, EnteteEtape, Surtitre, cx, type EtatEnregistrement } from "./ui";

/**
 * Onglet Projet (v3) : ce qu'il veut rafraîchir, la taille à peu près, un mot
 * libre. Plus de goûts ni de délai — les teintes se choisissent dans ses
 * simulations. Chaque geste s'enregistre tout seul, et le dit. Sans réseau,
 * c'est gardé dans le téléphone et renvoyé au retour du réseau ; un refus du
 * serveur s'affiche tel quel (jamais de bouton muet).
 *
 * Quand tout est rempli, il VALIDE son projet : pastille verte ici et chez
 * CoverSwap. Validé, le projet se relit d'un coup d'œil ; « Modifier » le
 * rouvre — ce qui le dévalide (la pastille tombe, CoverSwap le sait), jusqu'à
 * ce qu'il le revalide.
 */

const ZONES_PAR_PROJET: Record<string, { id: string; libelle: string; aide: string; dessin?: string }[]> = {
  CUISINE: [
    { id: "meubles-hauts", libelle: "Façades hautes", aide: "Au-dessus du plan de travail", dessin: "meubles-hauts" },
    { id: "meubles-bas", libelle: "Façades basses", aide: "Portes, tiroirs, îlot", dessin: "meubles-bas" },
    { id: "plan-de-travail", libelle: "Plan de travail", aide: "Le dessus et son chant", dessin: "plan-de-travail" },
    { id: "credence", libelle: "Crédence", aide: "Le mur derrière le plan", dessin: "credence" },
    { id: "autre", libelle: "Autre chose", aide: "Précisez dans la note" },
  ],
  SDB: [
    { id: "meuble-vasque", libelle: "Meuble vasque", aide: "Les façades sous le lavabo" },
    { id: "plan-vasque", libelle: "Plan vasque", aide: "Le dessus autour du lavabo" },
    { id: "carrelage-mural", libelle: "Murs carrelés", aide: "Recouvrir le carrelage" },
    { id: "autre", libelle: "Autre chose", aide: "Précisez dans la note" },
  ],
  MEUBLES: [
    { id: "portes-dressing", libelle: "Dressing, placards", aide: "Portes battantes ou coulissantes" },
    { id: "meuble-tv", libelle: "Meuble TV", aide: "Façades, dessus et côtés" },
    { id: "meuble-complet", libelle: "Commode, buffet, bureau", aide: "Un meuble seul" },
    { id: "autre", libelle: "Autre chose", aide: "Précisez dans la note" },
  ],
  PRO: [
    { id: "comptoir-habillage", libelle: "Bar, comptoir", aide: "La façade et le plateau" },
    { id: "mobilier-pro", libelle: "Mobilier", aide: "Distributeur, présentoir, casiers" },
    { id: "rangements-pro", libelle: "Rangements", aide: "Placards et armoires" },
    { id: "habillage-mural", libelle: "Un mur", aide: "Un mur ou un panneau" },
    { id: "autre", libelle: "Autre chose", aide: "Précisez dans la note" },
  ],
};

const REPERES = [
  { id: "une-rangee", libelle: "Un seul mur", aide: "≈ 3 m", metres: 3 },
  { id: "en-l", libelle: "En L", aide: "≈ 5 m", metres: 5 },
  { id: "en-u", libelle: "En U", aide: "≈ 7 m", metres: 7 },
  { id: "ilot", libelle: "Avec îlot", aide: "≈ 8 m", metres: 8 },
] as const;

const VIDE: ProjetClient = { zones: [], styles: [], propositions: false, metres: null, repere: null, delai: null, precisions: "" };

/** Ce qu'on sait déjà, pour ne jamais redemander. Les goûts et le délai d'avant la v3 restent dans l'objet, intacts. */
function prerempli(etat: Etat): { projet: ProjetClient; depuis: string[] } {
  if (etat.monProjet) return { projet: { ...VIDE, ...etat.monProjet }, depuis: [] };
  const depuis: string[] = [];
  const projet = { ...VIDE };
  if (etat.connu.zones.length) {
    projet.zones = etat.connu.zones;
    depuis.push("votre simulation sur le site");
  }
  const taille = (etat.connu.tailleCuisine ?? "").toLowerCase();
  if (taille) {
    projet.repere = /ilot|îlot/.test(taille) ? "ilot" : /grande/.test(taille) ? "en-u" : /moyenne/.test(taille) ? "en-l" : /petite/.test(taille) ? "une-rangee" : null;
    const metres = Number(/(\d+(?:[.,]\d+)?)\s*(m|mètre|metre)/.exec(taille)?.[1]?.replace(",", "."));
    projet.metres = metres > 0 && metres <= 60 ? metres : (REPERES.find((r) => r.id === projet.repere)?.metres ?? null);
    depuis.push("votre demande");
  }
  return { projet, depuis };
}

export function EtapeProjet({ etat, client, onEtat, onSuite }: { etat: Etat; client: Client; onEtat: (etat: Etat) => void; onSuite: () => void }) {
  const initial = useMemo(() => prerempli(etat), [etat]);
  const [projet, setProjet] = useState<ProjetClient>(initial.projet);
  const [enregistrement, setEnregistrement] = useState<EtatEnregistrement>({ etat: "" });
  const [modifie, setModifie] = useState(false);
  const [validation, setValidation] = useState<{ occupe: boolean; message: { ton: "erreur" | "info"; texte: string } | null }>({ occupe: false, message: null });
  const courant = useRef(projet);
  const minuterie = useRef<number | null>(null);
  const enVol = useRef(false);
  const encore = useRef(false);
  const touche = useRef(false);
  const apercu = Boolean(client.apercu);
  const zones = ZONES_PAR_PROJET[etat.typeProjet] ?? ZONES_PAR_PROJET.CUISINE;
  const cuisine = (etat.typeProjet ?? "CUISINE") === "CUISINE";
  const nom = nomDuProjet(etat.typeProjet);
  const cleLocale = `espace-projet:${client.racine}`;

  /** Un envoi à la fois, toujours la dernière version : pas d'ancienne réponse qui écrase une saisie récente. */
  async function enregistrer(garder = false): Promise<void> {
    if (apercu) {
      setEnregistrement({ etat: "apercu", message: MESSAGE_APERCU });
      return;
    }
    if (enVol.current) {
      encore.current = true;
      return;
    }
    enVol.current = true;
    try {
      do {
        encore.current = false;
        const valeur = courant.current;
        setEnregistrement({ etat: "en-cours" });
        try {
          const reponse = await client.appeler<{ ok: boolean; espace?: Etat }>("/projet", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(valeur), keepalive: garder });
          try {
            localStorage.removeItem(cleLocale);
          } catch {
            // stockage indisponible : sans conséquence
          }
          if (reponse.espace) onEtat(reponse.espace);
          setEnregistrement({ etat: "ok" });
        } catch (erreur) {
          if (erreur instanceof ErreurEspace && !erreur.passager) {
            // Refusé pour de bon (valeur hors limites…) : on le dit, en clair.
            setEnregistrement({ etat: "erreur", message: erreur.message });
            return;
          }
          // Réseau coupé ou serveur indisponible : gardé ici, renvoyé au retour du réseau.
          try {
            localStorage.setItem(cleLocale, JSON.stringify(valeur));
          } catch {
            // stockage indisponible
          }
          setEnregistrement({ etat: "attente" });
          return;
        }
      } while (encore.current);
    } finally {
      enVol.current = false;
    }
  }

  function changer(modif: (avant: ProjetClient) => ProjetClient, delai = 600) {
    touche.current = true;
    setModifie(true);
    setValidation((v) => (v.message ? { ...v, message: null } : v));
    const suite = modif(courant.current);
    courant.current = suite;
    setProjet(suite);
    if (!apercu) setEnregistrement({ etat: "en-cours" });
    if (minuterie.current) window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => {
      minuterie.current = null;
      void enregistrer();
    }, delai);
  }

  /** Il quitte la page, passe à une autre appli, reçoit un appel : ce qui attendait part tout de suite. */
  function vider(garder = false) {
    if (!minuterie.current) return;
    window.clearTimeout(minuterie.current);
    minuterie.current = null;
    void enregistrer(garder);
  }

  useEffect(() => {
    const renvoyer = () => {
      try {
        const garde = localStorage.getItem(cleLocale);
        if (!garde) return;
        if (!touche.current) {
          courant.current = { ...VIDE, ...(JSON.parse(garde) as ProjetClient) };
          setProjet(courant.current);
          touche.current = true;
        }
        void enregistrer();
      } catch {
        // rien à renvoyer
      }
    };
    const surMasque = () => document.visibilityState === "hidden" && vider(true);
    const surDepart = () => vider(true);
    renvoyer();
    window.addEventListener("online", renvoyer);
    document.addEventListener("visibilitychange", surMasque);
    window.addEventListener("pagehide", surDepart);
    return () => {
      window.removeEventListener("online", renvoyer);
      document.removeEventListener("visibilitychange", surMasque);
      window.removeEventListener("pagehide", surDepart);
      vider(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleLocale]);

  // L'écran a pu s'ouvrir sur la dernière version gardée dans le téléphone : quand la version à jour
  // arrive (préremplissage compris), elle remplace les réponses de départ — tant qu'il n'a rien touché.
  useEffect(() => {
    const attente = window.setTimeout(() => {
      if (touche.current) return;
      courant.current = initial.projet;
      setProjet(initial.projet);
    }, 0);
    return () => window.clearTimeout(attente);
  }, [initial]);

  // « Enregistré » s'efface au bout de quelques secondes ; une erreur ou une attente reste affichée.
  useEffect(() => {
    if (enregistrement.etat !== "ok") return;
    const t = window.setTimeout(() => setEnregistrement((e) => (e.etat === "ok" ? { etat: "" } : e)), 2600);
    return () => window.clearTimeout(t);
  }, [enregistrement]);

  /** Ce qui manque pour valider, dit tout de suite (sans attendre le serveur). */
  const manque =
    projet.zones.length === 0
      ? "Touchez d'abord ce que vous voulez rafraîchir."
      : projet.zones.every((z) => z === "autre") && !projet.precisions.trim()
        ? "Vous avez choisi « autre chose » : dites-nous quoi, en quelques mots."
        : cuisine && !projet.repere && !projet.metres
          ? "Indiquez la taille de votre cuisine, à peu près."
          : null;

  async function valider() {
    if (apercu) return setValidation({ occupe: false, message: { ton: "info", texte: MESSAGE_APERCU } });
    if (manque) {
      // On l'emmène là où il manque quelque chose : il n'a pas à chercher.
      document.getElementById(projet.zones.length === 0 ? "titre-zones" : /taille/.test(manque) ? "titre-taille" : "titre-note")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return setValidation({ occupe: false, message: { ton: "erreur", texte: manque } });
    }
    setValidation({ occupe: true, message: null });
    // Ce qui attendait d'être enregistré part d'abord : on valide la dernière version, pas l'avant-dernière.
    if (minuterie.current) {
      window.clearTimeout(minuterie.current);
      minuterie.current = null;
    }
    await enregistrer();
    try {
      const { espace } = await client.envoyerJson<{ espace: Etat }>("/projet/validation", "POST", {});
      onEtat(espace);
      setValidation({ occupe: false, message: null });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (erreur) {
      setValidation({ occupe: false, message: { ton: "erreur", texte: erreur instanceof ErreurEspace && erreur.status === 0 ? "Pas de réseau : votre projet est gardé, validez-le dès son retour." : erreur instanceof Error ? erreur.message : "Réessayez dans un instant." } });
    }
  }

  async function rouvrir() {
    if (apercu) return setValidation({ occupe: false, message: { ton: "info", texte: MESSAGE_APERCU } });
    setValidation({ occupe: true, message: null });
    try {
      const { espace } = await client.envoyerJson<{ espace: Etat }>("/projet/devalidation", "POST", {});
      onEtat(espace);
      setValidation({ occupe: false, message: null });
      window.scrollTo({ top: 0 });
    } catch (erreur) {
      setValidation({ occupe: false, message: { ton: "erreur", texte: erreur instanceof Error ? erreur.message : "Réessayez dans un instant." } });
    }
  }

  const basculer = (liste: string[], valeur: string) => (liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur]);
  const reelles = zones.filter((z) => z.id !== "autre");
  const tout = reelles.every((z) => projet.zones.includes(z.id));
  const precise = projet.zones.length > 0 || projet.precisions.trim().length > 0;

  // Validé : le projet se relit d'un coup d'œil. « Modifier » le rouvre (et le dévalide).
  if (etat.projetValide) {
    const repere = REPERES.find((r) => r.id === projet.repere);
    return (
      <div className="space-y-5">
        <EnteteEtape titre="Votre projet" phrase="Votre projet est validé. CoverSwap l'a bien reçu." />
        <Carte className="space-y-4 border-2 border-[#1F7A4D]">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#E7F3EC] px-3 py-1.5 text-[14.5px] font-semibold text-[#17563A]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1F7A4D] text-white" aria-hidden>
              <IconeCoche taille={11} />
            </span>
            Projet validé
          </p>
          <dl className="space-y-3 text-[16.5px] leading-snug">
            <div>
              <dt><Surtitre>À rafraîchir</Surtitre></dt>
              <dd className="mt-1 font-semibold text-[#1A1A1A]">{projet.zones.map((z) => zones.find((x) => x.id === z)?.libelle ?? z).join(", ")}</dd>
            </div>
            {projet.metres || repere ? (
              <div>
                <dt><Surtitre>Taille</Surtitre></dt>
                <dd className="mt-1 font-semibold text-[#1A1A1A]">{[repere?.libelle, projet.metres ? `≈ ${String(projet.metres).replace(".", ",")} m` : null].filter(Boolean).join(" · ")}</dd>
              </div>
            ) : null}
            {projet.precisions.trim() ? (
              <div>
                <dt><Surtitre>Votre mot</Surtitre></dt>
                <dd className="mt-1 whitespace-pre-wrap text-[#1A1A1A]">« {projet.precisions.trim()} »</dd>
              </div>
            ) : null}
          </dl>
        </Carte>
        {validation.message ? <Annonce ton={validation.message.ton}>{validation.message.texte}</Annonce> : null}
        <BoutonPrincipal onClick={onSuite}>
          Étape suivante&nbsp;: vos simulations <span aria-hidden>→</span>
        </BoutonPrincipal>
        <BoutonSecondaire onClick={() => void rouvrir()} disabled={validation.occupe}>
          {validation.occupe ? "Un instant…" : "Modifier mon projet"}
        </BoutonSecondaire>
        <p className="px-1 text-center text-[14px] leading-relaxed text-[#6B665F]">Modifier rouvre votre projet&nbsp;: vous le validerez à nouveau ensuite.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-24">
      <EnteteEtape titre="Votre projet" phrase={`Touchez ce que vous voulez rafraîchir dans ${nom.votre}, puis validez. Tout s'enregistre au fur et à mesure.`} />

      {initial.depuis.length > 0 && !modifie ? <Annonce>Prérempli d&apos;après {initial.depuis.join(" et ")}. Modifiez si besoin.</Annonce> : null}

      <section aria-labelledby="titre-zones" className="space-y-3">
        <h2 id="titre-zones" className="px-1 text-[18px] font-semibold text-[#1A1A1A]">
          Ce que vous voulez rafraîchir
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {zones.map((zone) => (
            <CaseCarte
              key={zone.id}
              coche={projet.zones.includes(zone.id)}
              onBasculer={() => changer((p) => ({ ...p, zones: basculer(p.zones, zone.id) }))}
              titre={zone.libelle}
              aide={zone.aide}
              illustration={zone.dessin ? <CuisineDeFace allume={[zone.dessin]} className="w-full rounded-lg bg-[#F7F6F3] p-1" /> : undefined}
              className={zone.id === "autre" && cuisine ? "justify-end" : undefined}
            />
          ))}
          <button
            type="button"
            role="checkbox"
            aria-checked={tout}
            onClick={() => changer((p) => ({ ...p, zones: tout ? p.zones.filter((z) => z === "autre") : [...new Set([...p.zones, ...reelles.map((z) => z.id)])] }))}
            className={cx(
              "flex min-h-[64px] items-center justify-center rounded-2xl border-2 px-3 text-center text-[16px] font-semibold",
              tout ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-dashed border-[#CFCAC2] bg-transparent text-[#1A1A1A] active:bg-[#F6F5F2]"
            )}
          >
            {tout ? "✓ Tout" : cuisine ? "Toute la cuisine" : "Tout"}
          </button>
        </div>
      </section>

      <section aria-labelledby="titre-taille" className="space-y-3">
        <div className="px-1">
          <h2 id="titre-taille" className="text-[18px] font-semibold text-[#1A1A1A]">
            {cuisine ? "La taille, à peu près" : "Combien de mètres de meubles, environ"}
          </h2>
          <p className="mt-0.5 text-[15px] text-[#5F5A53]">Une estimation suffit&nbsp;: nous mesurerons sur place.</p>
        </div>
        {cuisine ? (
          <div className="grid grid-cols-2 gap-2.5">
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
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E6E3DD] bg-white p-2">
          <button type="button" aria-label="Moins" onClick={() => changer((p) => ({ ...p, metres: Math.max(0.5, (p.metres ?? 3) - 0.5) }))} className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6F5F2] text-[24px] font-semibold text-[#1A1A1A] active:bg-[#ECEAE5]">
            −
          </button>
          <span className="text-center" aria-live="polite">
            <span className="block font-display text-[26px] leading-none font-semibold text-[#1A1A1A] tabular-nums">{projet.metres ? `≈ ${String(projet.metres).replace(".", ",")} m` : "—"}</span>
            <span className="text-[13px] text-[#5F5A53]">de meubles, mis bout à bout</span>
          </span>
          <button type="button" aria-label="Plus" onClick={() => changer((p) => ({ ...p, metres: Math.min(60, (p.metres ?? 2.5) + 0.5) }))} className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6F5F2] text-[24px] font-semibold text-[#1A1A1A] active:bg-[#ECEAE5]">
            +
          </button>
        </div>
      </section>

      <section aria-labelledby="titre-note" className="space-y-2">
        <label id="titre-note" htmlFor="precisions" className="block px-1">
          <span className="block text-[18px] font-semibold text-[#1A1A1A]">Un mot pour CoverSwap</span>
          <span className="block text-[15px] text-[#5F5A53]">Facultatif. Vous pouvez aussi dicter avec le micro du clavier.</span>
        </label>
        <textarea
          id="precisions"
          rows={4}
          maxLength={1000}
          value={projet.precisions}
          onChange={(e) => changer((p) => ({ ...p, precisions: e.target.value }), 1200)}
          onBlur={() => vider()}
          placeholder="Garder les poignées, un plan de travail qui résiste à la chaleur…"
          className="w-full rounded-2xl border border-[#D3CFC8] bg-white px-4 py-3 text-[17px] leading-relaxed text-[#1A1A1A] placeholder:text-[#8A857E] focus:border-[#1A1A1A] focus:outline-none"
        />
      </section>

      {/* Toujours sous le pouce, au-dessus des onglets : l'état de l'enregistrement, et le bouton qui valide. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(3.9rem+env(safe-area-inset-bottom))] z-20 px-4 pb-2">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-1.5">
          {/* Ce qui manque pour valider se dit ICI, à côté du bouton : pas en bas d'une page qu'il ne voit pas. */}
          {validation.message ? (
            <div className="pointer-events-auto w-full drop-shadow-[0_4px_14px_rgba(26,26,26,0.16)]">
              <Annonce ton={validation.message.ton}>{validation.message.texte}</Annonce>
            </div>
          ) : (
            <Enregistrement etat={enregistrement} className="text-center drop-shadow-[0_2px_8px_rgba(26,26,26,0.12)]" />
          )}
          {precise ? (
            <BoutonPrincipal onClick={() => void valider()} disabled={validation.occupe} className="pointer-events-auto shadow-[0_8px_24px_rgba(26,26,26,0.18)]">
              {validation.occupe ? "Validation…" : "Valider mon projet"}
            </BoutonPrincipal>
          ) : null}
        </div>
      </div>
    </div>
  );
}
