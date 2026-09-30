"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import ImageReference from "@/components/ImageReference";
import { Feuille, useLiensDeFeuille } from "@/components/simulation/Feuille";
import { Lien } from "@/components/simulation/Lien";
import { CHAMP } from "@/app/simulateur/_components/Formulaires";
import revetements from "@/data/revetements.json";
import { FAMILLES, estFamille, libelleFamille } from "@/lib/familles-matieres";
import { referenceDeLAdresse } from "@/lib/matieres-vedettes";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
interface Reference {
  id: string;
  nom: string;
  famille: string;
  categorie: string;
  finition: string;
  image: string;
  tags: string[];
}

/* ══════════════════════════════════════════════════════════════════
   DATA — mission 16 : les familles sont celles du simulateur
   (`lib/familles-matieres`, une seule liste), en texte ; les nombres sont
   comptés dans les données.
══════════════════════════════════════════════════════════════════ */
const REFERENCES = revetements as Reference[];
const compter = (famille: string) => REFERENCES.filter((r) => r.famille === famille).length;
const CHOIX_FAMILLES = [{ id: "tout", libelle: "Tout", count: REFERENCES.length }, ...FAMILLES.map((f) => ({ ...f, count: compter(f.id) }))];

/* La famille demandée par l'adresse (`/matieres?famille=bois`) et la référence (`/matieres?ref=K1`,
   tuiles de l'accueil, mission 16 partie 3 : sa fiche s'ouvre, sa famille filtre la grille). Lues
   sans `useSearchParams` (qui ferait rendre tout le catalogue côté client, sous Suspense) : le rendu
   serveur montre « Tout », le client applique l'adresse juste après l'hydratation. */
const ecouterAdresse = (rappel: () => void) => {
  window.addEventListener("popstate", rappel);
  return () => window.removeEventListener("popstate", rappel);
};
const familleDeLAdresse = () => new URLSearchParams(window.location.search).get("famille");
const refDeLAdresse = () => new URLSearchParams(window.location.search).get("ref");
const aucuneFamille = () => null;

const ITEMS_PER_PAGE = 48;

const PASTILLE = "inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-[var(--rayon-sm)] border px-4 text-[15px] font-medium transition-colors duration-[var(--duree-courte)]";

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function CatalogueClient() {
  const familleAdresse = useSyncExternalStore(ecouterAdresse, familleDeLAdresse, aucuneFamille);
  const [familleChoisie, setFamilleChoisie] = useState<string | null>(null);
  const refAdresse = useSyncExternalStore(ecouterAdresse, refDeLAdresse, aucuneFamille);
  const referenceAdresse = referenceDeLAdresse(refAdresse, REFERENCES);
  const familleDeLaReference = referenceAdresse && estFamille(referenceAdresse.famille) ? referenceAdresse.famille : null;
  const activeFamille = familleChoisie ?? (estFamille(familleAdresse) ? familleAdresse : (familleDeLaReference ?? "tout"));
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [selectedRef, setSelectedRef] = useState<Reference | null>(null);

  /* ── La référence de l'adresse : sa fiche s'ouvre UNE fois (état ajusté pendant le rendu) ; fermée,
     elle ne se rouvre pas au retour d'historique (l'adresse garde `?ref=`). ── */
  const [refOuverte, setRefOuverte] = useState<string | null>(null);
  if (referenceAdresse && refOuverte !== referenceAdresse.id) {
    setRefOuverte(referenceAdresse.id);
    setSelectedRef(referenceAdresse);
  }

  /* ── La fiche : la feuille commune (Échap, geste retour, page verrouillée) ; à la fermeture, le
     focus revient sur la carte qui l'a ouverte. ── */
  const declencheur = useRef<HTMLElement | null>(null);
  const fermerFiche = useCallback(() => setSelectedRef(null), []);
  const aller = useLiensDeFeuille(selectedRef !== null, fermerFiche);
  const ouvrirFiche = useCallback((ref: Reference, carte: HTMLElement) => {
    declencheur.current = carte;
    setSelectedRef(ref);
  }, []);
  useEffect(() => {
    if (selectedRef || !declencheur.current) return;
    const carte = declencheur.current;
    declencheur.current = null;
    if (carte.isConnected) carte.focus({ preventScroll: true });
  }, [selectedRef]);

  /* ── Filtered results ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return REFERENCES.filter((r) => {
      if (activeFamille !== "tout" && r.famille !== activeFamille) return false;
      if (q) {
        const haystack = `${r.nom} ${r.id} ${r.famille} ${r.categorie} ${r.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [activeFamille, search]);

  const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  /* ── Retour au premier lot quand le filtre change (état ajusté pendant le rendu) ── */
  const [filtrePrecedent, setFiltrePrecedent] = useState({ activeFamille, search });
  if (filtrePrecedent.activeFamille !== activeFamille || filtrePrecedent.search !== search) {
    setFiltrePrecedent({ activeFamille, search });
    setVisibleCount(ITEMS_PER_PAGE);
  }

  const handleFamilleClick = useCallback((id: string) => {
    setFamilleChoisie(id);
  }, []);

  /* ════════════════════════════════════════════════════════════════
     RENDER (la page porte le titre ; ici : familles, recherche, grille)
  ════════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* ──────────────────── FAMILLES (collées sous l'en-tête) ──────────────────── */}
      <div className="sticky top-[60px] z-30 border-b border-trait bg-fond">
        <div role="group" aria-label="Familles de matières" className="flex items-center gap-2 overflow-x-auto py-3" style={{ scrollbarWidth: "none" }}>
          {CHOIX_FAMILLES.map((f) => {
            const actif = activeFamille === f.id;
            return (
              <button key={f.id} type="button" aria-pressed={actif} onClick={() => handleFamilleClick(f.id)} className={`${PASTILLE} ${actif ? "border-encre bg-encre text-blanc" : "border-trait bg-white text-encre hover:border-encre"}`}>
                <span>{f.libelle}</span>
                <span className={`text-[13px] ${actif ? "text-blanc/70" : "text-encre-2"}`}>{f.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ──────────────────── RECHERCHE ──────────────────── */}
      <div className="pt-6 pb-4">
        <label htmlFor="recherche-catalogue" className="sr-only">
          Rechercher une matière
        </label>
        <div className="relative">
          <svg className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-encre-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          {/* type="text" : un champ « search » ajouterait la croix du navigateur à côté de « Effacer la recherche ». */}
          <input id="recherche-catalogue" type="text" inputMode="search" enterKeyHint="search" autoComplete="off" placeholder="Rechercher par nom, référence, famille..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${CHAMP} pr-12 pl-10`} />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Effacer la recherche" className="absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-encre-2 transition-colors duration-[var(--duree-courte)] hover:text-encre">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-3 flex min-h-[44px] items-center justify-between gap-3 text-[14.5px] text-encre-2">
          <p aria-live="polite">
            <span className="font-semibold text-encre">{filtered.length}</span> résultat{filtered.length !== 1 ? "s" : ""}
            {activeFamille !== "tout" && (
              <span>
                {" "}
                dans <span className="text-encre">{libelleFamille(activeFamille)}</span>
              </span>
            )}
            {search && <span> pour &laquo;{search}&raquo;</span>}
          </p>
          {(search || activeFamille !== "tout") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFamilleChoisie("tout");
              }}
              className="min-h-[44px] shrink-0 text-encre underline underline-offset-4"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      </div>

      {/* ──────────────────── GRILLE ──────────────────── */}
      {visibleItems.length === 0 ? (
        <div className="py-20 text-center">
          <h2 className="mb-2 text-[17px] font-semibold text-encre">Aucun résultat</h2>
          <p className="texte-2 mx-auto max-w-md">Aucune référence ne correspond à vos critères. Essayez de modifier vos filtres ou votre recherche.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {visibleItems.map((ref) => (
              <ProductCard key={ref.id} item={ref} onOuvrir={ouvrirFiche} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button type="button" onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)} className={`${PASTILLE} border-encre bg-white px-6 text-encre hover:bg-fond-2`}>
                Voir plus
                <span className="text-[14px] text-encre-2">({Math.min(ITEMS_PER_PAGE, filtered.length - visibleCount)} de plus)</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* ──────────────────── DÉTAIL ──────────────────── */}
      <Feuille
        ouverte={selectedRef !== null}
        onFermer={fermerFiche}
        titre={selectedRef?.nom ?? ""}
        sousTitre={selectedRef ? `Réf. ${selectedRef.id} · ${libelleFamille(selectedRef.famille)}` : null}
        pied={
          selectedRef ? (
            <Lien href={lienDevis(selectedRef)} onClick={aller(lienDevis(selectedRef))} plein>
              Demander un devis avec cette référence
            </Lien>
          ) : null
        }
      >
        {selectedRef ? <Fiche item={selectedRef} /> : null}
      </Feuille>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRODUCT CARD
══════════════════════════════════════════════════════════════════ */
const ProductCard = React.memo(function ProductCard({ item, onOuvrir }: { item: Reference; onOuvrir: (item: Reference, carte: HTMLElement) => void }) {
  const familleLabel = libelleFamille(item.famille);

  return (
    <button type="button" onClick={(e) => onOuvrir(item, e.currentTarget)} className="group relative aspect-square overflow-hidden rounded-[var(--rayon-md)] border border-trait bg-fond-2 text-left transition-colors duration-[var(--duree-courte)] hover:border-encre">
      <ImageReference
        src={item.image}
        alt={`Revêtement adhésif Cover Styl' ${item.nom} (${familleLabel}, finition ${item.finition}) — référence ${item.id}`}
        reference={item.id}
        nom={item.nom}
        famille={item.famille}
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover"
      />
      <span className="absolute inset-x-0 bottom-0 bg-fond/85 px-2.5 py-1.5">
        <span className="block truncate text-[13.5px] font-medium text-encre">{item.nom}</span>
        <span className="block truncate text-[12px] text-encre-2">
          {item.id} · {familleLabel}
        </span>
      </span>
    </button>
  );
});

/* ══════════════════════════════════════════════════════════════════
   FICHE (dans la feuille commune : le titre, la référence et le bouton y sont déjà)
══════════════════════════════════════════════════════════════════ */
const lienDevis = (item: Reference) => `/contact?ref=${encodeURIComponent(item.id)}`;

function Fiche({ item }: { item: Reference }) {
  const INFO = "rounded-[var(--rayon-sm)] border border-trait bg-white p-3";

  return (
    <div className="space-y-5 pt-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-[var(--rayon-md)] bg-fond-2">
        <ImageReference
          key={item.image}
          src={item.image}
          alt={`Revêtement adhésif Cover Styl' ${item.nom} en grand format — référence ${item.id}`}
          reference={item.id}
          nom={item.nom}
          famille={item.famille}
          sizes="(max-width: 640px) 100vw, 576px"
          prioritaire
          className="object-cover"
        />
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className={INFO}>
          <dt className="mb-1 text-[12.5px] text-encre-2">Famille</dt>
          <dd className="text-[14.5px] font-medium text-encre">{libelleFamille(item.famille)}</dd>
        </div>
        <div className={INFO}>
          <dt className="mb-1 text-[12.5px] text-encre-2">Catégorie</dt>
          <dd className="text-[14.5px] font-medium text-encre">{item.categorie}</dd>
        </div>
        <div className={INFO}>
          <dt className="mb-1 text-[12.5px] text-encre-2">Finition</dt>
          <dd className="text-[14.5px] font-medium text-encre">{item.finition}</dd>
        </div>
      </dl>

      {item.tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <li key={tag} className="rounded-full border border-trait bg-white px-3 py-1 text-[13px] text-encre-2">
              {tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
