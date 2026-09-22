"use client";

import { useEffect, useMemo, useState } from "react";
import { correspondRecherche } from "@/lib/recherche-finitions";
import type { Client } from "./api";
import { IconeCoeur, IconeLoupe } from "./Illustrations";
import { BoutonPrincipal, BoutonSecondaire, Feuille, FOCUS, cx } from "./ui";

/**
 * Le catalogue Cover Styl' complet, en miniature, pour choisir la teinte d'une
 * zone. Les familles tiennent toutes à l'écran (aucune cachée dans un
 * défilement de côté), la recherche comprend le français (« chêne clair »,
 * « noir mat »), les échantillons sont assez grands pour juger, et un toucher
 * les montre en grand avec leur nom. Ses favoris le suivent d'une visite à
 * l'autre. Les images passent par le CRM : l'espace ne parle à aucun tiers.
 */

export type Teinte = { id: string; nom: string; famille: string; categorie: string; finition: string; image: string; tags: string[] };

export const FAMILLES = [
  { id: "bois", libelle: "Bois" },
  { id: "couleur", libelle: "Couleurs" },
  { id: "pierre", libelle: "Pierre" },
  { id: "beton", libelle: "Béton" },
  { id: "metal", libelle: "Métal" },
  { id: "textile", libelle: "Textile" },
  { id: "paillettes", libelle: "Paillettes" },
];
export const libelleFamille = (id: string) => FAMILLES.find((f) => f.id === id)?.libelle ?? id;

let catalogueEnMemoire: Teinte[] | null = null;
/** Le catalogue n'est chargé qu'à la première ouverture (il ne pèse rien sur l'ouverture de l'espace). */
export async function chargerCatalogue(): Promise<Teinte[]> {
  if (!catalogueEnMemoire) catalogueEnMemoire = (await import("@/data/revetements.json")).default as Teinte[];
  return catalogueEnMemoire;
}

const PAR_PAGE = 30;
type Filtre = "tout" | "favoris" | string;

export const vignette = (client: Client, ref: string) => client.url(`/echantillons/${encodeURIComponent(ref)}?l=320`);

export function CatalogueTeintes({
  ouvert,
  onFermer,
  zone,
  choisie,
  favoris,
  onFavori,
  onChoisir,
  client,
  consultation = false,
}: {
  ouvert: boolean;
  onFermer: () => void;
  /** Le catalogue de l'espace (hors simulation) : on regarde, on garde ses favoris ; rien à « choisir ». */
  consultation?: boolean;
  zone: string;
  choisie: string | null;
  favoris: string[];
  onFavori: (ref: string) => void;
  onChoisir: (teinte: Teinte) => void;
  client: Client;
}) {
  const [catalogue, setCatalogue] = useState<Teinte[] | null>(catalogueEnMemoire);
  const [probleme, setProbleme] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tout");
  const [limite, setLimite] = useState(PAR_PAGE);
  const [agrandie, setAgrandie] = useState<Teinte | null>(null);
  const [indisponibles, setIndisponibles] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!ouvert || catalogue) return;
    let actif = true;
    chargerCatalogue()
      .then((liste) => actif && setCatalogue(liste))
      .catch(() => actif && setProbleme(true));
    return () => {
      actif = false;
    };
  }, [ouvert, catalogue]);

  const filtrees = useMemo(() => {
    const q = recherche.trim();
    return (catalogue ?? []).filter((r) => {
      if (filtre === "favoris" && !favoris.includes(r.id)) return false;
      if (filtre !== "tout" && filtre !== "favoris" && r.famille !== filtre) return false;
      return !q || correspondRecherche(r, q);
    });
  }, [catalogue, recherche, filtre, favoris]);

  // Nouveau filtre, nouvelle recherche : on repart des premiers échantillons.
  const [cleFiltre, setCleFiltre] = useState(`${filtre}|${recherche}`);
  if (cleFiltre !== `${filtre}|${recherche}`) {
    setCleFiltre(`${filtre}|${recherche}`);
    setLimite(PAR_PAGE);
  }
  const visibles = filtrees.slice(0, limite);
  const reste = filtrees.length - visibles.length;
  const puces: { id: Filtre; libelle: string }[] = [{ id: "tout", libelle: "Tout" }, { id: "favoris", libelle: `♥ Favoris${favoris.length ? ` (${favoris.length})` : ""}` }, ...FAMILLES];

  return (
    <>
      <Feuille ouverte={ouvert} onFermer={onFermer} titre={consultation ? "Le catalogue Cover Styl'" : `Teinte pour\u00a0: ${zone}`} sousTitre="Touchez un échantillon pour le voir en grand." libelleFermer="Retour">
        <div className="sticky top-0 z-10 -mx-4 space-y-2.5 bg-[#F5F4F1] px-4 pt-1 pb-3">
          <label className="relative block">
            <span className="sr-only">Chercher une teinte</span>
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#6B665F]">
              <IconeLoupe />
            </span>
            <input
              type="search"
              enterKeyHint="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Chêne, blanc, marbre, noir mat…"
              className="min-h-[50px] w-full rounded-2xl border border-[#D3CFC8] bg-white pr-4 pl-11 text-[17px] text-[#1A1A1A] placeholder:text-[#8A857E] focus:border-[#1A1A1A] focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Familles">
            {puces.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={filtre === p.id}
                onClick={() => setFiltre(p.id)}
                className={cx("min-h-[40px] rounded-full border px-3.5 text-[15px] font-medium", filtre === p.id ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#D3CFC8] bg-white text-[#1A1A1A] active:bg-[#F2F0EC]", FOCUS)}
              >
                {p.libelle}
              </button>
            ))}
          </div>
        </div>

        {probleme ? (
          <p className="rounded-2xl bg-[#FBE9E7] px-4 py-3 text-[15.5px] text-[#8F1D12]" role="alert">
            Le catalogue ne s&apos;est pas chargé. Vérifiez votre réseau, puis rouvrez-le.
          </p>
        ) : !catalogue ? (
          <p className="py-10 text-center text-[16px] text-[#5F5A53]">Ouverture du catalogue…</p>
        ) : (
          <>
            <p className="px-1 pb-2 text-[14px] text-[#5F5A53]" aria-live="polite">
              {filtrees.length === 0
                ? filtre === "favoris" && !recherche
                  ? "Pas encore de favori\u00a0: touchez le cœur d'un échantillon pour le garder ici."
                  : "Aucune teinte ne correspond. Essayez «\u00a0bois clair\u00a0», «\u00a0blanc\u00a0» ou «\u00a0marbre\u00a0»."
                : `${filtrees.length} teinte${filtrees.length > 1 ? "s" : ""}`}
            </p>
            <ul className="grid grid-cols-3 gap-x-2.5 gap-y-3">
              {visibles.map((r) => {
                const active = choisie === r.id;
                const favori = favoris.includes(r.id);
                return (
                  <li key={r.id} className="relative">
                    <button type="button" onClick={() => setAgrandie(r)} aria-label={`${r.nom}, ${libelleFamille(r.famille)}${active ? " (choisie)" : ""}`} className={cx("block w-full text-left", FOCUS, "rounded-xl")}>
                      <span className={cx("relative block aspect-square overflow-hidden rounded-xl bg-[#E4E1DB]", active ? "ring-[3px] ring-[#1A1A1A] ring-offset-2 ring-offset-[#F5F4F1]" : "ring-1 ring-black/10")}>
                        {indisponibles.has(r.id) ? (
                          <span className="absolute inset-0 flex items-center justify-center p-1 text-center text-[11px] leading-tight font-medium text-[#6B665F]">Visuel indisponible</span>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element -- vignette servie par le CRM (l'espace ne parle à aucun tiers)
                          <img src={vignette(client, r.id)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setIndisponibles((d) => new Set(d).add(r.id))} />
                        )}
                        {active ? <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#1A1A1A] px-2 py-0.5 text-[11.5px] font-semibold text-white">Choisie</span> : null}
                      </span>
                      <span className="mt-1 block line-clamp-2 text-[13.5px] leading-tight font-medium text-[#1A1A1A]">{r.nom}</span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={favori}
                      aria-label={favori ? `Retirer ${r.nom} de mes favoris` : `Ajouter ${r.nom} à mes favoris`}
                      onClick={() => onFavori(r.id)}
                      className={cx("absolute top-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur-sm", favori ? "text-[#CC0000]" : "text-[#5F5A53]", FOCUS)}
                    >
                      <IconeCoeur taille={18} plein={favori} />
                    </button>
                  </li>
                );
              })}
            </ul>
            {reste > 0 ? (
              <BoutonSecondaire className="mt-4" onClick={() => setLimite((l) => l + PAR_PAGE)}>
                Voir plus de teintes ({reste})
              </BoutonSecondaire>
            ) : null}
          </>
        )}
      </Feuille>

      <Feuille
        ouverte={Boolean(agrandie)}
        onFermer={() => setAgrandie(null)}
        titre={agrandie?.nom ?? ""}
        sousTitre={agrandie ? `${libelleFamille(agrandie.famille)} · réf. ${agrandie.id}` : null}
        libelleFermer="Retour au catalogue"
        pied={
          agrandie && consultation ? (
            <BoutonPrincipal onClick={() => onFavori(agrandie.id)} aria-pressed={favoris.includes(agrandie.id)}>
              <IconeCoeur plein={favoris.includes(agrandie.id)} />
              {favoris.includes(agrandie.id) ? "Dans mes favoris" : "Ajouter à mes favoris"}
            </BoutonPrincipal>
          ) : agrandie ? (
            <BoutonPrincipal
              disabled={indisponibles.has(agrandie.id)}
              onClick={() => {
                const teinte = agrandie;
                setAgrandie(null);
                onChoisir(teinte);
              }}
            >
              {choisie === agrandie.id ? "✓ Choisie pour cette zone" : "Choisir cette teinte"}
            </BoutonPrincipal>
          ) : null
        }
      >
        {agrandie ? (
          <div className="space-y-3 pt-1">
            <div className="overflow-hidden rounded-2xl bg-[#E4E1DB] ring-1 ring-black/10">
              {indisponibles.has(agrandie.id) ? (
                <p className="flex aspect-square items-center justify-center p-6 text-center text-[16px] text-[#5F5A53]">Échantillon momentanément indisponible&nbsp;: choisissez une autre teinte pour votre simulation.</p>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- échantillon servi par le CRM
                <img src={client.url(`/echantillons/${encodeURIComponent(agrandie.id)}`)} alt={`Échantillon ${agrandie.nom}`} referrerPolicy="no-referrer" className="aspect-square w-full object-cover" onError={() => setIndisponibles((d) => new Set(d).add(agrandie.id))} />
              )}
            </div>
            {consultation ? null : (
            <BoutonSecondaire onClick={() => onFavori(agrandie.id)} aria-pressed={favoris.includes(agrandie.id)}>
              <span className={favoris.includes(agrandie.id) ? "text-[#CC0000]" : "text-[#5F5A53]"}>
                <IconeCoeur plein={favoris.includes(agrandie.id)} />
              </span>
              {favoris.includes(agrandie.id) ? "Dans mes favoris" : "Ajouter à mes favoris"}
            </BoutonSecondaire>
            )}
            <p className="px-1 text-[14px] leading-relaxed text-[#5F5A53]">Le rendu exact dépend de la lumière de votre pièce&nbsp;: la simulation le montre sur votre photo.</p>
          </div>
        ) : null}
      </Feuille>
    </>
  );
}
