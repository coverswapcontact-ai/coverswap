"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IconeCoeur, IconeLoupe } from "@/components/espace/Illustrations";
import { FAMILLES, libelleFamille } from "@/lib/familles-matieres";
import { MATIERES_PAR_PAGE, catalogueEnMemoireSiCharge, chargerCatalogue, filtrerMatieres, messageAucuneMatiere, type Matiere } from "@/lib/matieres";
import { Bouton } from "./Bouton";
import { BoutonFavori, CHAMP_RECHERCHE } from "./ElementsCatalogue";
import { Feuille, cx } from "./Feuille";
import { SqueletteTuiles } from "./Squelette";
import { ZoomImage } from "./ZoomImage";

/**
 * Le catalogue Cover Styl' en feuille (mission 15, partie 4), UN SEUL pour le
 * simulateur du site et, depuis la partie 5, pour l'espace client : recherche en
 * français (16 px, pas de zoom automatique sur iPhone), familles en filtres
 * sobres (des boutons pressés, rien qui promette un clavier d'onglets), tuiles
 * carrées de hauteur fixe, favoris, « voir en grand » avec
 * pincer-zoom, « Voir plus », vignettes de 320 px servies par le CRM et
 * préchargées à l'ouverture d'une famille, « Appliquer le même film à … ».
 * Aucun appel réseau ici hors les images : les adresses sont injectées.
 */

/** Une matière du catalogue (`lib/matieres › Matiere`). */
export type Teinte = Matiere;
export type ZoneCatalogue = { id: string; libelle: string };

// Les familles vivent dans `lib/familles-matieres` (une seule liste pour le simulateur, l'espace et /matieres).
export { FAMILLES, libelleFamille };

/**
 * Le catalogue n'est chargé qu'à la première ouverture (il ne pèse rien sur l'ouverture de la page). Mission 16
 * (partie 5) : le chargement vit dans `lib/matieres` (la page Matières lit la même copie en mémoire) ; réexporté ici.
 */
export { chargerCatalogue };

export const PAR_PAGE = MATIERES_PAR_PAGE;
type Filtre = "tout" | "favoris" | string;

export type ProprietesFeuilleCatalogue = {
  ouverte: boolean;
  onFermer: () => void;
  zone: ZoneCatalogue;
  /** Les autres zones de la pièce, pour « Appliquer le même film à … ». */
  autresZones?: ZoneCatalogue[];
  choisie: string | null;
  favoris: string[];
  onFavori: (ref: string) => void;
  /** `aussi` : les autres zones qui reçoivent le même film. */
  onChoisir: (teinte: Teinte, aussi: string[]) => void;
  urlVignette: (ref: string) => string;
  urlEchantillon: (ref: string) => string;
  /** Catalogue de l'espace (hors simulation) : on regarde, on garde ses favoris ; rien à « choisir ». */
  consultation?: boolean;
};

export function FeuilleCatalogue({ ouverte, onFermer, zone, autresZones = [], choisie, favoris, onFavori, onChoisir, urlVignette, urlEchantillon, consultation = false }: ProprietesFeuilleCatalogue) {
  const [catalogue, setCatalogue] = useState<Teinte[] | null>(catalogueEnMemoireSiCharge);
  const [probleme, setProbleme] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tout");
  const [limite, setLimite] = useState(PAR_PAGE);
  const [agrandie, setAgrandie] = useState<Teinte | null>(null);
  const [aussi, setAussi] = useState<string[]>([]);
  const [indisponibles, setIndisponibles] = useState<Set<string>>(() => new Set());
  const prechargees = useRef(new Set<string>());

  useEffect(() => {
    if (!ouverte || catalogue) return;
    let actif = true;
    chargerCatalogue()
      .then((liste) => actif && setCatalogue(liste))
      .catch(() => actif && setProbleme(true));
    return () => {
      actif = false;
    };
  }, [ouverte, catalogue]);

  // Le filtre de la page Matières (`lib/matieres`) : famille ou favoris, puis la recherche en français.
  const filtrees = useMemo(() => filtrerMatieres(catalogue ?? [], { filtre, recherche, favoris }), [catalogue, recherche, filtre, favoris]);

  // Nouveau filtre, nouvelle recherche : on repart des premiers échantillons.
  const [cleFiltre, setCleFiltre] = useState(`${filtre}|${recherche}`);
  if (cleFiltre !== `${filtre}|${recherche}`) {
    setCleFiltre(`${filtre}|${recherche}`);
    setLimite(PAR_PAGE);
  }
  const visibles = filtrees.slice(0, limite);
  const reste = filtrees.length - visibles.length;

  // Les vignettes de la famille ouverte sont demandées d'avance (cache du navigateur) : la grille apparaît d'un bloc.
  useEffect(() => {
    if (!ouverte || typeof window === "undefined") return;
    for (const r of visibles) {
      if (prechargees.current.has(r.id)) continue;
      prechargees.current.add(r.id);
      const image = new window.Image();
      image.decoding = "async";
      image.src = urlVignette(r.id);
    }
  }, [ouverte, visibles, urlVignette]);

  const onglets: { id: Filtre; libelle: string }[] = [{ id: "tout", libelle: "Tout" }, ...FAMILLES, { id: "favoris", libelle: `Favoris${favoris.length ? ` (${favoris.length})` : ""}` }];

  const choisir = (teinte: Teinte) => {
    setAgrandie(null);
    onChoisir(teinte, aussi);
    setAussi([]);
  };

  const entete = (
    <div className="mx-auto w-full max-w-xl space-y-2 px-4 pt-1 pb-2">
      <label className="relative block">
        <span className="sr-only">Chercher une matière</span>
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-encre-2">
          <IconeLoupe />
        </span>
        <input type="search" enterKeyHint="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Chêne, blanc, marbre, noir mat…" className={cx(CHAMP_RECHERCHE, "pr-4")} />
      </label>
      <div role="group" aria-label="Familles" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {onglets.map((o) => (
          <button key={o.id} type="button" aria-pressed={filtre === o.id} onClick={() => setFiltre(o.id)} className={cx("min-h-[44px] shrink-0 border-b-2 px-2.5 text-[14.5px] font-medium transition-colors duration-[var(--duree-courte)]", filtre === o.id ? "border-encre text-encre" : "border-transparent text-encre-2 hover:text-encre")}>
            {o.libelle}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Feuille ouverte={ouverte} onFermer={onFermer} titre={consultation ? "Le catalogue Cover Styl'" : `Matière pour : ${zone.libelle}`} sousTitre="Touchez un échantillon pour le voir en grand." libelleFermer="Retour" entete={entete}>
        {probleme ? (
          <p className="mt-3 rounded-[var(--rayon-sm)] bg-accent-fond px-4 py-3 text-[15px] text-accent-texte" role="alert">
            Le catalogue ne s&apos;est pas chargé. Vérifiez votre réseau, puis rouvrez-le.
          </p>
        ) : !catalogue ? (
          <div className="pt-3">
            <SqueletteTuiles />
          </div>
        ) : (
          <div className="pt-3">
            <p className="min-h-[20px] px-1 pb-2 text-[13.5px] text-encre-2" aria-live="polite">
              {filtrees.length === 0 ? messageAucuneMatiere(filtre, recherche, "échantillon") : `${filtrees.length} matière${filtrees.length > 1 ? "s" : ""}`}
            </p>
            <ul className="grid grid-cols-3 gap-x-2.5 gap-y-3">
              {visibles.map((r) => {
                const active = choisie === r.id;
                const favori = favoris.includes(r.id);
                return (
                  <li key={r.id} className="relative">
                    <button type="button" onClick={() => setAgrandie(r)} aria-label={`${r.nom}, ${libelleFamille(r.famille)}${active ? " (choisie)" : ""}`} className="block w-full rounded-[var(--rayon-sm)] text-left">
                      <span className={cx("relative block aspect-square overflow-hidden rounded-[var(--rayon-sm)] bg-fond-2", active ? "ring-2 ring-encre ring-offset-2 ring-offset-fond" : "ring-1 ring-black/10")}>
                        {indisponibles.has(r.id) ? (
                          <span className="absolute inset-0 flex items-center justify-center p-1 text-center text-[11px] leading-tight font-medium text-encre-2">Visuel indisponible</span>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element -- vignette servie par le CRM
                          <img src={urlVignette(r.id)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setIndisponibles((d) => new Set(d).add(r.id))} />
                        )}
                        {active ? <span className="absolute bottom-1.5 left-1.5 rounded-[4px] bg-encre px-1.5 py-0.5 text-[11px] font-semibold text-blanc">Choisie</span> : null}
                      </span>
                      <span className="mt-1 block h-[34px] overflow-hidden text-[13px] leading-[17px] font-medium text-encre">{r.nom}</span>
                    </button>
                    <BoutonFavori nom={r.nom} favori={favori} onBasculer={() => onFavori(r.id)} />
                  </li>
                );
              })}
            </ul>
            {reste > 0 ? (
              <div className="mt-4">
                <Bouton variante="secondaire" plein onClick={() => setLimite((l) => l + PAR_PAGE)}>
                  Voir plus ({reste})
                </Bouton>
              </div>
            ) : null}
          </div>
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
            <Bouton plein onClick={() => onFavori(agrandie.id)} aria-pressed={favoris.includes(agrandie.id)}>
              {favoris.includes(agrandie.id) ? "Dans mes favoris" : "Ajouter à mes favoris"}
            </Bouton>
          ) : agrandie ? (
            <Bouton plein raisonDesactive={indisponibles.has(agrandie.id) ? "Échantillon momentanément indisponible : choisissez une autre matière." : null} onClick={() => choisir(agrandie)}>
              {choisie === agrandie.id ? "Garder cette matière" : `Choisir pour : ${zone.libelle}`}
            </Bouton>
          ) : null
        }
      >
        {agrandie ? (
          <div className="space-y-3 pt-1">
            <div className="overflow-hidden rounded-[var(--rayon-md)] bg-fond-2 ring-1 ring-black/10">
              {indisponibles.has(agrandie.id) ? (
                <p className="flex aspect-square items-center justify-center p-6 text-center text-[16px] text-encre-2">Échantillon momentanément indisponible : choisissez une autre matière pour votre simulation.</p>
              ) : (
                <ZoomImage src={urlEchantillon(agrandie.id)} alt={`Échantillon ${agrandie.nom}`} className="aspect-square w-full" />
              )}
            </div>
            <p className="text-[13.5px] text-encre-2">Pincez pour zoomer.</p>
            {!consultation && autresZones.length > 0 ? (
              <fieldset className="rounded-[var(--rayon-sm)] border border-trait bg-white p-3">
                <legend className="px-1 text-[14px] font-medium text-encre">Appliquer le même film à…</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {autresZones.map((z) => {
                    const coche = aussi.includes(z.id);
                    return (
                      <label key={z.id} className={cx("flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[var(--rayon-sm)] border px-3 text-[14.5px]", coche ? "border-encre bg-fond" : "border-trait")}>
                        <input type="checkbox" checked={coche} onChange={(e) => setAussi((a) => (e.target.checked ? [...a, z.id] : a.filter((id) => id !== z.id)))} className="h-4 w-4 accent-[var(--color-encre)]" />
                        {z.libelle}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}
            {consultation ? null : (
              <Bouton variante="secondaire" plein onClick={() => onFavori(agrandie.id)} aria-pressed={favoris.includes(agrandie.id)}>
                <span className={favoris.includes(agrandie.id) ? "text-accent" : "text-encre-2"}>
                  <IconeCoeur plein={favoris.includes(agrandie.id)} />
                </span>
                {favoris.includes(agrandie.id) ? "Dans mes favoris" : "Ajouter à mes favoris"}
              </Bouton>
            )}
            <p className="px-1 text-[14px] leading-relaxed text-encre-2">Le rendu exact dépend de la lumière de votre pièce : la simulation le montre sur votre photo.</p>
          </div>
        ) : null}
      </Feuille>
    </>
  );
}
