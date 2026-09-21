"use client";

import { useEffect, useMemo, useState } from "react";
import { dateCourte, type Client, type Etat, type SimulationClient } from "./api";
import { AvantApres } from "./AvantApres";
import { Annonce, BoutonPrincipal, BoutonSecondaire, Carte, EnteteEtape, Surtitre, cx } from "./ui";

/**
 * Étape 3 — les simulations : sur SA photo, avant / après au doigt. Il en
 * choisit une, ou il pioche (les meubles hauts de l'une, le plan de travail de
 * l'autre), ou il demande autre chose. Il ne voit que ce que Lucas a publié.
 */

type Option = { simulationId: string; rang: number; ref: string; nom: string; libelle: string };

const cleZone = (z: { zone: string; libelle: string }) => z.zone || z.libelle;

function nomDe(s: SimulationClient, rang: number): string {
  return s.source === "SITE" ? "Votre essai sur le site" : `Proposition ${rang}`;
}

export function EtapeSimulations({ etat, client, onEtat, onRetour, onSuite }: { etat: Etat; client: Client; onEtat: (etat: Etat) => void; onRetour: () => void; onSuite: () => void }) {
  const apercu = Boolean(client.apercu);
  const sims = etat.simulations;
  const [comparer, setComparer] = useState(false);
  const [agrandie, setAgrandie] = useState<string | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ton: "succes" | "erreur"; texte: string } | null>(null);
  const [demande, setDemande] = useState<string | null>(null);
  const rangs = useMemo(() => {
    let n = 0;
    return new Map(sims.map((s) => [s.id, s.source === "SITE" ? 0 : ++n]));
  }, [sims]);

  // Il a regardé : ses simulations ne sont plus « nouvelles » (et Lucas sait lesquelles ont été vues).
  useEffect(() => {
    if (!apercu && sims.some((s) => s.nouvelle)) void client.envoyerJson("/simulations/vues", "POST", {}).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le choix zone par zone n'a de sens que si une même zone a au moins deux teintes proposées.
  const options = useMemo(() => {
    const parZone = new Map<string, Option[]>();
    for (const s of sims) {
      for (const z of s.zones) {
        const cle = cleZone(z);
        if (!cle) continue;
        const liste = parZone.get(cle) ?? [];
        if (!liste.some((o) => o.ref === z.ref)) liste.push({ simulationId: s.id, rang: rangs.get(s.id) ?? 0, ref: z.ref, nom: z.nom || z.ref, libelle: z.libelle || z.zone });
        parZone.set(cle, liste);
      }
    }
    return parZone;
  }, [sims, rangs]);
  const composable = sims.length > 1 && [...options.values()].some((liste) => liste.length > 1);
  const [composition, setComposition] = useState<Record<string, string>>(() => {
    const depart: Record<string, string> = {};
    if (etat.choix?.mode === "COMPOSITE") for (const z of etat.choix.zones) depart[cleZone(z)] = z.simulationId;
    else for (const [cle, liste] of options) depart[cle] = liste[0].simulationId;
    return depart;
  });
  const [composer, setComposer] = useState(false);

  async function envoyer(chemin: string, corps: unknown, succes: string, cle: string) {
    if (apercu) return;
    setOccupe(cle);
    setMessage(null);
    try {
      const { espace } = await client.envoyerJson<{ espace: Etat }>(chemin, "POST", corps);
      onEtat(espace);
      setMessage({ ton: "succes", texte: succes });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (erreur) {
      setMessage({ ton: "erreur", texte: erreur instanceof Error ? erreur.message : "Réessayez dans un instant." });
    } finally {
      setOccupe(null);
    }
  }

  if (sims.length === 0) {
    return (
      <div className="space-y-5">
        <EnteteEtape titre="Vos simulations" phrase={`Je prépare vos simulations, sur votre propre photo. Vous les trouverez ici ${etat.simulationsEnPreparation?.delai ?? "sous 24 h"}, et je vous préviens par SMS.`} onRetour={onRetour} />
        <Carte>
          <p className="text-[16px] leading-relaxed text-[#3F3B36]">En attendant, vous pouvez ajouter des photos ou préciser vos goûts : plus j&apos;en sais, plus la première proposition sera juste.</p>
        </Carte>
      </div>
    );
  }

  const choixUne = etat.choix?.mode === "UNE" ? etat.choix.simulationId : null;
  const resumeChoix =
    etat.choix?.mode === "COMPOSITE"
      ? etat.choix.zones.map((z) => `${z.libelle || z.zone} : ${z.nom || z.ref}`).join(" · ")
      : choixUne
        ? nomDe(sims.find((s) => s.id === choixUne) ?? sims[0], rangs.get(choixUne) ?? 0)
        : null;

  return (
    <div className="space-y-5">
      <EnteteEtape
        titre={sims.length > 1 ? "Vos simulations" : "Votre simulation"}
        phrase={
          resumeChoix
            ? "Vous avez fait votre choix. Vous pouvez encore changer d'avis."
            : sims.length > 1
              ? "Glissez sur l'image pour voir avant et après. Choisissez celle qui vous plaît — ou composez votre mélange."
              : "Glissez sur l'image pour voir avant et après. Elle vous plaît ? Dites-le moi en un geste. Sinon, je vous fais une autre proposition."
        }
        onRetour={onRetour}
      />
      {message ? <Annonce ton={message.ton}>{message.texte}</Annonce> : null}
      {resumeChoix ? (
        <Carte className="border-[#1A1A1A]">
          <Surtitre ton="vert">Votre choix</Surtitre>
          <p className="mt-1.5 text-[17px] font-semibold text-[#1A1A1A]">{resumeChoix}</p>
          <p className="mt-1 text-[15px] text-[#4F4A44]">Je prépare votre devis sur cette base.</p>
          {etat.devis ? (
            <BoutonPrincipal className="mt-3" onClick={onSuite}>
              Voir mon devis
            </BoutonPrincipal>
          ) : null}
        </Carte>
      ) : null}

      {sims.length > 1 ? (
        <div className="flex gap-2" role="group" aria-label="Affichage">
          {[
            { v: false, l: "Une par une" },
            { v: true, l: "Côte à côte" },
          ].map((o) => (
            <button key={o.l} type="button" aria-pressed={comparer === o.v} onClick={() => setComparer(o.v)} className={cx("min-h-[44px] flex-1 rounded-full border-2 text-[15px] font-medium", comparer === o.v ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#E2DFD9] bg-white text-[#1A1A1A]")}>
              {o.l}
            </button>
          ))}
        </div>
      ) : null}

      {comparer ? (
        <ul className="grid grid-cols-2 gap-2.5">
          {sims.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => setAgrandie(s.id)} className="block w-full overflow-hidden rounded-2xl border border-[#E6E3DD] bg-white text-left">
                {/* eslint-disable-next-line @next/next/no-img-element -- image privée servie par le CRM */}
                <img src={client.url(`/simulations/${s.id}`)} alt={nomDe(s, rangs.get(s.id) ?? 0)} className="aspect-[3/2] w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                <span className="block px-2.5 py-2 text-[14px] font-semibold text-[#1A1A1A]">
                  {nomDe(s, rangs.get(s.id) ?? 0)}
                  {s.choisie ? <span className="ml-1 text-[#1F7A4D]">✓</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-5">
          {sims.map((s) => {
            const rang = rangs.get(s.id) ?? 0;
            const choisie = choixUne === s.id;
            return (
              <li key={s.id}>
                <Carte className={cx("space-y-3 p-3", choisie && "border-2 border-[#1F7A4D]")}>
                  <div className="flex items-baseline justify-between gap-2 px-1">
                    <h2 className="font-display text-[20px] font-semibold text-[#1A1A1A]">{nomDe(s, rang)}</h2>
                    <span className="shrink-0 text-[13px] text-[#6B665F]">
                      {s.nouvelle ? <span className="mr-2 rounded-full bg-[#CC0000] px-2 py-0.5 text-[12px] font-semibold text-white">Nouveau</span> : null}
                      {dateCourte(s.le)}
                    </span>
                  </div>
                  <AvantApres apres={client.url(`/simulations/${s.id}`)} avant={s.avant ? client.url(`/simulations/${s.id}/avant`) : null} alt={nomDe(s, rang)} />
                  {s.zones.length > 0 ? (
                    <ul className="space-y-1.5 px-1">
                      {s.zones.map((z) => (
                        <li key={`${cleZone(z)}-${z.ref}`} className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element -- échantillon servi par le CRM */}
                          <img src={client.url(`/echantillons/${encodeURIComponent(z.ref)}`)} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-black/10" loading="lazy" referrerPolicy="no-referrer" />
                          <span className="text-[15px] leading-tight text-[#1A1A1A]">
                            {z.libelle ? <span className="text-[#5F5A53]">{z.libelle} : </span> : null}
                            <span className="font-semibold">{z.nom || z.ref}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {s.description ? <p className="px-1 text-[15px] leading-relaxed text-[#4F4A44]">{s.description}</p> : null}
                  <BoutonPrincipal
                    disabled={occupe !== null || choisie}
                    className={choisie ? "!bg-[#1F7A4D] !text-white" : undefined}
                    onClick={() => void envoyer("/choix", { simulationId: s.id }, "C'est noté, merci ! Je prépare votre devis sur cette base.", `choix-${s.id}`)}
                  >
                    {occupe === `choix-${s.id}` ? "Un instant…" : choisie ? "✓ Mon choix" : "Je choisis celle-ci"}
                  </BoutonPrincipal>
                </Carte>
              </li>
            );
          })}
        </ul>
      )}

      {composable ? (
        <Carte>
          <Surtitre>Composer mon mélange</Surtitre>
          <p className="mt-1 text-[15px] leading-relaxed text-[#4F4A44]">Une teinte vous plaît sur une proposition, une autre ailleurs ? Choisissez zone par zone.</p>
          {composer ? (
            <div className="mt-3 space-y-4">
              {[...options.entries()].map(([cle, liste]) => (
                <fieldset key={cle}>
                  <legend className="text-[15.5px] font-semibold text-[#1A1A1A]">{liste[0].libelle}</legend>
                  <div className="mt-2 grid gap-2" role="radiogroup" aria-label={liste[0].libelle}>
                    {liste.map((o) => {
                      const actif = composition[cle] === o.simulationId;
                      return (
                        <button
                          key={`${o.simulationId}-${o.ref}`}
                          type="button"
                          role="radio"
                          aria-checked={actif}
                          onClick={() => setComposition((c) => ({ ...c, [cle]: o.simulationId }))}
                          className={cx("flex min-h-[64px] w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left", actif ? "border-[#1A1A1A] bg-[#FAF9F7]" : "border-[#E2DFD9] bg-white")}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- échantillon servi par le CRM */}
                          <img src={client.url(`/echantillons/${encodeURIComponent(o.ref)}`)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-black/10" loading="lazy" referrerPolicy="no-referrer" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[16px] leading-snug font-semibold text-[#1A1A1A]">{o.nom}</span>
                            <span className="block text-[13.5px] text-[#5F5A53]">{o.rang ? `Proposition ${o.rang}` : "Votre essai"}</span>
                          </span>
                          <span aria-hidden className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", actif ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#C9C4BC]")}>
                            {actif ? <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
              <BoutonPrincipal
                disabled={occupe !== null}
                onClick={() => void envoyer("/choix", { zones: Object.entries(composition).map(([zone, simulationId]) => ({ zone, simulationId })) }, "C'est noté, merci ! Je prépare votre devis avec ce mélange.", "composition")}
              >
                {occupe === "composition" ? "Un instant…" : "Valider mon mélange"}
              </BoutonPrincipal>
            </div>
          ) : (
            <BoutonSecondaire className="mt-3" onClick={() => setComposer(true)}>
              Choisir zone par zone
            </BoutonSecondaire>
          )}
        </Carte>
      ) : null}

      <Carte>
        <Surtitre>Rien ne vous convient tout à fait ?</Surtitre>
        {demande === null ? (
          <BoutonSecondaire className="mt-3" onClick={() => setDemande("")} disabled={apercu}>
            Demander une autre proposition
          </BoutonSecondaire>
        ) : (
          <div className="mt-3 space-y-2.5">
            <label htmlFor="autre" className="block text-[15px] text-[#3F3B36]">
              Dites-moi ce que vous aimeriez (plus clair, un bois plus chaud, garder les portes blanches…)
            </label>
            <textarea id="autre" rows={3} maxLength={1000} value={demande} onChange={(e) => setDemande(e.target.value)} className="w-full rounded-2xl border border-[#D3CFC8] px-4 py-3 text-[17px] focus:border-[#1A1A1A] focus:outline-none" />
            <BoutonPrincipal disabled={occupe !== null} onClick={() => void envoyer("/proposition", { commentaire: demande }, "Message bien reçu : je vous prépare une autre proposition.", "proposition").then(() => setDemande(null))}>
              {occupe === "proposition" ? "Envoi…" : "Envoyer ma demande"}
            </BoutonPrincipal>
          </div>
        )}
        {etat.propositionDemandeeLe ? <p className="mt-2.5 text-[14px] text-[#5F5A53]">Demande envoyée le {dateCourte(etat.propositionDemandeeLe)} : je m&apos;en occupe.</p> : null}
      </Carte>

      {agrandie ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-3" role="dialog" aria-modal="true" aria-label="Simulation agrandie">
          <button type="button" onClick={() => setAgrandie(null)} className="ml-auto min-h-[48px] rounded-full bg-white/15 px-5 text-[16px] font-semibold text-white">
            Fermer
          </button>
          <div className="flex flex-1 items-center">
            <AvantApres
              className="w-full"
              apres={client.url(`/simulations/${agrandie}`)}
              avant={sims.find((s) => s.id === agrandie)?.avant ? client.url(`/simulations/${agrandie}/avant`) : null}
              alt="Simulation agrandie"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
