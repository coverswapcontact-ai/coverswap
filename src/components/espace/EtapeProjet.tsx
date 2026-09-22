"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ErreurEspace, MESSAGE_APERCU, motsDe, type Client, type Etat, type FamillePublique, type IdFamille, type Prestations, type ProjetClient, type SelectionPrestations, type TailleProjet } from "./api";
import { DessinFamille, IconeCoche, PlanCuisine } from "./Illustrations";
import { Annonce, BoutonPrincipal, BoutonSecondaire, Carte, CaseCarte, Enregistrement, EnteteEtape, Surtitre, cx, FOCUS, type EtatEnregistrement } from "./ui";

/**
 * Onglet Projet (mission 5) : ce qu'il veut rénover, en deux niveaux simples.
 * D'abord les quatre familles — Cuisine, Salle de bain, Mobilier,
 * Professionnel —, en grandes cartes dessinées ; pour chaque famille cochée, ses
 * sous-parties se déplient juste dessous. Puis la taille, à peu près, dans les
 * mots de la famille (mètres de meubles pour une cuisine, nombre de portes pour
 * un dressing), et un mot libre. Rien ne se déplie tant qu'aucune famille n'est
 * cochée : l'écran reste léger.
 *
 * Chaque geste s'enregistre tout seul, et le dit ; sans réseau, c'est gardé dans
 * le téléphone et renvoyé au retour du réseau. Quand tout est rempli, il VALIDE
 * son projet (pastille verte ici et chez CoverSwap) ; « Modifier » le rouvre.
 * Un projet signé, ou sur lequel le devis est établi, se relit sans se modifier.
 */

type Saisie = { familles: SelectionPrestations; tailles: Partial<Record<IdFamille, TailleProjet>>; precisions: string };
const VIDE: Saisie = { familles: {}, tailles: {}, precisions: "" };
const ORDRE: IdFamille[] = ["CUISINE", "SDB", "MEUBLES", "PRO"];

const famillesCochees = (s: SelectionPrestations): IdFamille[] => ORDRE.filter((id) => id in s);

/** Ce qu'on sait déjà, pour ne jamais redemander : son projet, sinon ce que laisse deviner sa demande. */
function prerempli(etat: Etat, prestations: Prestations | undefined): { saisie: Saisie; depuis: string | null } {
  const p: ProjetClient | null = etat.monProjet;
  if (p?.familles && Object.keys(p.familles).length > 0) return { saisie: { familles: { ...p.familles }, tailles: { ...(p.tailles ?? {}) }, precisions: p.precisions ?? "" }, depuis: null };
  const saisie: Saisie = { ...VIDE, precisions: p?.precisions ?? "", tailles: { ...(p?.tailles ?? {}) } };
  const devinees = (etat.famillesSuggerees ?? []).filter((id) => prestations?.familles.some((f) => f.id === id));
  if (devinees.length) {
    for (const id of devinees) saisie.familles[id] = [];
    // Ses simulations du site disent déjà ce qu'il a essayé (façades, plan…) : proposé coché.
    const zones = new Set(etat.connu.zones);
    if (devinees.includes("CUISINE")) {
      const parties = [zones.has("meubles-hauts") && "facades-hautes", zones.has("meubles-bas") && "facades-basses", zones.has("plan-de-travail") && "plan-de-travail", zones.has("credence") && "credence"].filter((x): x is string => Boolean(x));
      saisie.familles.CUISINE = parties;
    }
    return { saisie, depuis: etat.connu.zones.length ? "votre simulation sur le site" : "votre demande" };
  }
  return { saisie, depuis: null };
}

/** Ce qui manque pour valider, dit tout de suite (la même règle que le CRM). */
function manqueDe(saisie: Saisie, familles: FamillePublique[]): { texte: string; cible: string } | null {
  const cochees = famillesCochees(saisie.familles);
  if (cochees.length === 0) return { texte: "Touchez d'abord ce que vous voulez rénover.", cible: "titre-familles" };
  for (const id of cochees) {
    const f = familles.find((x) => x.id === id);
    if (f && (saisie.familles[id] ?? []).length === 0) return { texte: `${f.libelle} : cochez ce que vous voulez traiter.`, cible: `famille-${id}` };
  }
  const seulementAutre = cochees.every((id) => (saisie.familles[id] ?? []).every((sp) => sp === "autre" || sp === "autre-meuble"));
  if (seulementAutre && !saisie.precisions.trim()) return { texte: "Vous avez choisi « autre » : dites-nous quoi, en quelques mots.", cible: "titre-note" };
  for (const id of cochees) {
    const f = familles.find((x) => x.id === id);
    const t = saisie.tailles[id];
    if (f?.taille.requise && !t?.repere && !t?.valeur) return { texte: `Indiquez la taille ${f.mots.de}, à peu près.`, cible: `taille-${id}` };
  }
  return null;
}

function libelleTaille(f: FamillePublique, t: TailleProjet | undefined): string | null {
  if (!t || (!t.repere && !t.valeur)) return null;
  const repere = f.taille.reperes.find((r) => r.id === t.repere);
  const valeur = t.valeur ? (f.taille.unite === "portes" ? `${t.valeur} porte${t.valeur > 1 ? "s" : ""}` : `≈ ${String(t.valeur).replace(".", ",")} m`) : null;
  return [repere?.libelle, valeur].filter(Boolean).join(" · ") || null;
}

export function EtapeProjet({ etat, client, prestations, onEtat, onSuite }: { etat: Etat; client: Client; prestations: Prestations | undefined; onEtat: (etat: Etat) => void; onSuite: () => void }) {
  const familles = useMemo(() => prestations?.familles ?? [], [prestations]);
  const initial = useMemo(() => prerempli(etat, prestations), [etat, prestations]);
  const [saisie, setSaisie] = useState<Saisie>(initial.saisie);
  const [enregistrement, setEnregistrement] = useState<EtatEnregistrement>({ etat: "" });
  const [modifie, setModifie] = useState(false);
  const [validation, setValidation] = useState<{ occupe: boolean; message: { ton: "erreur" | "info"; texte: string } | null }>({ occupe: false, message: null });
  const courant = useRef(saisie);
  const minuterie = useRef<number | null>(null);
  const enVol = useRef(false);
  const encore = useRef(false);
  const touche = useRef(false);
  const apercu = Boolean(client.apercu);
  const mots = motsDe(etat);
  const modifiable = etat.projetModifiable?.ok ?? true;
  const cleLocale = `espace-projet:${client.racine}:${etat.code ?? ""}`;

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
            setEnregistrement({ etat: "erreur", message: erreur.message });
            return;
          }
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

  function changer(modif: (avant: Saisie) => Saisie, delai = 600) {
    touche.current = true;
    setModifie(true);
    setValidation((v) => (v.message ? { ...v, message: null } : v));
    const suite = modif(courant.current);
    courant.current = suite;
    setSaisie(suite);
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
          courant.current = { ...VIDE, ...(JSON.parse(garde) as Saisie) };
          setSaisie(courant.current);
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

  // La version à jour (préremplissage compris) remplace celle de départ — tant qu'il n'a rien touché.
  useEffect(() => {
    const attente = window.setTimeout(() => {
      if (touche.current) return;
      courant.current = initial.saisie;
      setSaisie(initial.saisie);
    }, 0);
    return () => window.clearTimeout(attente);
  }, [initial]);

  useEffect(() => {
    if (enregistrement.etat !== "ok") return;
    const t = window.setTimeout(() => setEnregistrement((e) => (e.etat === "ok" ? { etat: "" } : e)), 2600);
    return () => window.clearTimeout(t);
  }, [enregistrement]);

  const manque = manqueDe(saisie, familles);

  async function valider() {
    if (apercu) return setValidation({ occupe: false, message: { ton: "info", texte: MESSAGE_APERCU } });
    if (manque) {
      // On l'emmène là où il manque quelque chose : il n'a pas à chercher.
      document.getElementById(manque.cible)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return setValidation({ occupe: false, message: { ton: "erreur", texte: manque.texte } });
    }
    setValidation({ occupe: true, message: null });
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
      setValidation({ occupe: false, message: { ton: "erreur", texte: erreur instanceof ErreurEspace && erreur.status === 0 ? "Pas de réseau : votre projet est gardé, validez-le dès son retour." : erreur instanceof Error ? erreur.message : "Réessayez dans un instant." } });
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

  const basculerFamille = (id: IdFamille) =>
    changer((s) => {
      const familles = { ...s.familles };
      const tailles = { ...s.tailles };
      if (id in familles) {
        delete familles[id];
        delete tailles[id];
      } else familles[id] = [];
      return { ...s, familles, tailles };
    });
  const basculerPartie = (id: IdFamille, sp: string) =>
    changer((s) => {
      const liste = s.familles[id] ?? [];
      return { ...s, familles: { ...s.familles, [id]: liste.includes(sp) ? liste.filter((x) => x !== sp) : [...liste, sp] } };
    });
  const poserTaille = (id: IdFamille, t: TailleProjet) => changer((s) => ({ ...s, tailles: { ...s.tailles, [id]: t } }));

  if (!prestations) return <EnteteEtape titre="Votre projet" phrase="Chargement…" />;

  const cochees = famillesCochees(saisie.familles);
  const resume = (
    <dl className="space-y-3 text-[16.5px] leading-snug">
      {cochees.map((id) => {
        const f = familles.find((x) => x.id === id)!;
        const parties = (saisie.familles[id] ?? []).map((sp) => f.sousParties.find((x) => x.id === sp)?.libelle).filter(Boolean);
        const taille = libelleTaille(f, saisie.tailles[id]);
        return (
          <div key={id}>
            <dt>
              <Surtitre>{f.libelle}</Surtitre>
            </dt>
            <dd className="mt-1 font-semibold text-[#1A1A1A]">
              {parties.join(", ") || "À préciser"}
              {taille ? <span className="block text-[15px] font-normal text-[#5F5A53]">{taille}</span> : null}
            </dd>
          </div>
        );
      })}
      {saisie.precisions.trim() ? (
        <div>
          <dt>
            <Surtitre>Votre mot</Surtitre>
          </dt>
          <dd className="mt-1 whitespace-pre-wrap text-[#1A1A1A]">« {saisie.precisions.trim()} »</dd>
        </div>
      ) : null}
    </dl>
  );

  // Signé, ou le devis est établi dessus : il se relit ; un appel suffit pour le changer.
  if (!modifiable) {
    return (
      <div className="space-y-5">
        <EnteteEtape titre="Votre projet" phrase={etat.projetModifiable?.raison ?? "Votre projet est arrêté."} />
        <Carte className="space-y-4">{cochees.length ? resume : <p className="text-[16px] text-[#3F3B36]">Votre projet a été précisé avec CoverSwap, au téléphone.</p>}</Carte>
        <BoutonPrincipal onClick={onSuite}>
          Voir la suite <span aria-hidden>→</span>
        </BoutonPrincipal>
      </div>
    );
  }

  // Validé : le projet se relit d'un coup d'œil. « Modifier » le rouvre (et le dévalide).
  if (etat.projetValide) {
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
          {resume}
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
      <EnteteEtape titre="Votre projet" phrase={cochees.length ? `Cochez ce que vous voulez traiter, puis validez. Tout s'enregistre au fur et à mesure.` : "Touchez ce que vous voulez rénover. Plusieurs choix possibles."} />

      {initial.depuis && !modifie ? <Annonce>Prérempli d&apos;après {initial.depuis}. Modifiez si besoin.</Annonce> : null}

      <section aria-labelledby="titre-familles" className="space-y-3">
        <h2 id="titre-familles" className="px-1 text-[18px] font-semibold text-[#1A1A1A]">
          Ce que vous voulez rénover
        </h2>
        <ul className="space-y-2.5">
          {familles.map((f) => {
            const coche = f.id in saisie.familles;
            return (
              <li key={f.id} id={`famille-${f.id}`} className={cx("overflow-hidden rounded-2xl border-2 bg-white", coche ? "border-[#1A1A1A]" : "border-[#E2DFD9]")}>
                <button type="button" role="checkbox" aria-checked={coche} onClick={() => basculerFamille(f.id)} className={cx("flex w-full items-center gap-3 p-3 text-left active:bg-[#F6F5F2]", FOCUS)}>
                  <DessinFamille famille={f.id} className="h-16 w-20 shrink-0 rounded-xl bg-[#F7F6F3] p-1" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[18px] leading-snug font-semibold text-[#1A1A1A]">{f.libelle}</span>
                    <span className="mt-0.5 block text-[14.5px] leading-snug text-[#5F5A53]">{f.aide}</span>
                  </span>
                  <span aria-hidden className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[14px] font-bold", coche ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#BDB8B0] bg-white")}>
                    {coche ? "✓" : ""}
                  </span>
                </button>
                {coche ? (
                  // Ses sous-parties se déplient juste dessous : ce qu'il veut traiter dans cette famille.
                  <div className="border-t border-[#ECE9E3] bg-[#FAF9F7] p-3">
                    <p className="mb-2 px-0.5 text-[15px] font-medium text-[#3F3B36]">Qu&apos;est-ce qu&apos;on recouvre&nbsp;?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {f.sousParties.map((sp) => (
                        <CaseCarte key={sp.id} coche={(saisie.familles[f.id] ?? []).includes(sp.id)} onBasculer={() => basculerPartie(f.id, sp.id)} titre={sp.libelle} aide={sp.aide} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {cochees.map((id) => {
        const f = familles.find((x) => x.id === id)!;
        const t = saisie.tailles[id] ?? { repere: null, valeur: null };
        const q = f.taille;
        const unite = q.unite === "portes" ? "portes" : "m";
        return (
          <section key={id} id={`taille-${id}`} aria-labelledby={`titre-taille-${id}`} className="space-y-3">
            <div className="px-1">
              <h2 id={`titre-taille-${id}`} className="text-[18px] font-semibold text-[#1A1A1A]">
                {q.titre}
              </h2>
              <p className="mt-0.5 text-[15px] text-[#5F5A53]">{q.aide}</p>
            </div>
            {q.reperes.length ? (
              <div className="grid grid-cols-2 gap-2.5">
                {q.reperes.map((r) => (
                  <CaseCarte
                    key={r.id}
                    coche={t.repere === r.id}
                    onBasculer={() => poserTaille(id, t.repere === r.id ? { repere: null, valeur: null } : { repere: r.id, valeur: r.valeur })}
                    titre={r.libelle}
                    aide={r.aide}
                    illustration={id === "CUISINE" ? <PlanCuisine forme={r.id as "une-rangee" | "en-l" | "en-u" | "ilot"} className="h-16 w-full" /> : undefined}
                  />
                ))}
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E6E3DD] bg-white p-2">
              <button type="button" aria-label="Moins" onClick={() => poserTaille(id, { repere: t.repere, valeur: Math.max(q.min, Math.round(((t.valeur ?? q.depart + q.pas) - q.pas) * 10) / 10) })} className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6F5F2] text-[24px] font-semibold text-[#1A1A1A] active:bg-[#ECEAE5]">
                −
              </button>
              <span className="text-center" aria-live="polite">
                <span className="block font-display text-[26px] leading-none font-semibold text-[#1A1A1A] tabular-nums">{t.valeur ? (unite === "portes" ? `${t.valeur}` : `≈ ${String(t.valeur).replace(".", ",")} m`) : "—"}</span>
                <span className="text-[13px] text-[#5F5A53]">{unite === "portes" ? "portes, à peu près" : id === "CUISINE" ? "de meubles, mis bout à bout" : "à peu près"}</span>
              </span>
              <button type="button" aria-label="Plus" onClick={() => poserTaille(id, { repere: t.repere, valeur: Math.min(q.max, Math.round(((t.valeur ?? q.depart - q.pas) + q.pas) * 10) / 10) })} className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6F5F2] text-[24px] font-semibold text-[#1A1A1A] active:bg-[#ECEAE5]">
                +
              </button>
            </div>
          </section>
        );
      })}

      {cochees.length ? (
        <section aria-labelledby="titre-note" className="space-y-2">
          <label id="titre-note" htmlFor="precisions" className="block px-1">
            <span className="block text-[18px] font-semibold text-[#1A1A1A]">Un mot pour CoverSwap</span>
            <span className="block text-[15px] text-[#5F5A53]">Facultatif. Vous pouvez aussi dicter avec le micro du clavier.</span>
          </label>
          <textarea
            id="precisions"
            rows={4}
            maxLength={1000}
            value={saisie.precisions}
            onChange={(e) => changer((s) => ({ ...s, precisions: e.target.value }), 1200)}
            onBlur={() => vider()}
            placeholder={cochees.includes("CUISINE") ? "Garder les poignées, un plan de travail qui résiste à la chaleur…" : cochees.includes("SDB") ? "Garder la vasque, une teinte claire qui ne marque pas…" : `Ce qui compte pour ${mots.votre}…`}
            className="w-full rounded-2xl border border-[#D3CFC8] bg-white px-4 py-3 text-[17px] leading-relaxed text-[#1A1A1A] placeholder:text-[#8A857E] focus:border-[#1A1A1A] focus:outline-none"
          />
        </section>
      ) : null}

      {/* Toujours sous le pouce, au-dessus des onglets : l'état de l'enregistrement, et le bouton qui valide. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(3.9rem+env(safe-area-inset-bottom))] z-20 px-4 pb-2">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-1.5">
          {validation.message ? (
            <div className="pointer-events-auto w-full drop-shadow-[0_4px_14px_rgba(26,26,26,0.16)]">
              <Annonce ton={validation.message.ton}>{validation.message.texte}</Annonce>
            </div>
          ) : (
            <Enregistrement etat={enregistrement} className="text-center drop-shadow-[0_2px_8px_rgba(26,26,26,0.12)]" />
          )}
          {cochees.length ? (
            <BoutonPrincipal onClick={() => void valider()} disabled={validation.occupe} className="pointer-events-auto shadow-[0_8px_24px_rgba(26,26,26,0.18)]">
              {validation.occupe ? "Validation…" : "Valider mon projet"}
            </BoutonPrincipal>
          ) : null}
        </div>
      </div>
    </div>
  );
}
