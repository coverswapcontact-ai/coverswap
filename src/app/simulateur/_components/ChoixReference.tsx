"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import revetements from "@/data/revetements.json";

export interface Reference {
  id: string;
  nom: string;
  famille: string;
  categorie: string;
  finition: string;
  image: string;
  tags: string[];
}

const FAMILLES: { id: string; libelle: string }[] = [
  { id: "bois", libelle: "Bois" },
  { id: "pierre", libelle: "Pierre" },
  { id: "couleur", libelle: "Couleur" },
  { id: "beton", libelle: "Béton" },
  { id: "metal", libelle: "Métal" },
  { id: "textile", libelle: "Textile" },
  { id: "paillettes", libelle: "Paillettes" },
];
const PAR_PAGE = 12;
const CATALOGUE = revetements as Reference[];

/** Choix d'une finition Cover Styl' pour une surface : recherche, famille, pagination légère. */
export default function ChoixReference({ choisie, onChoisir }: { choisie: Reference | null; onChoisir: (ref: Reference) => void }) {
  const [recherche, setRecherche] = useState("");
  const [famille, setFamille] = useState<string | null>(choisie?.famille ?? null);
  const [page, setPage] = useState(0);

  const filtrees = useMemo(() => {
    const q = recherche.toLowerCase().trim();
    return CATALOGUE.filter((r) => {
      if (famille && r.famille !== famille) return false;
      if (q && !`${r.nom} ${r.id} ${r.famille} ${r.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [recherche, famille]);

  const [filtrePrecedent, setFiltrePrecedent] = useState({ recherche, famille });
  if (filtrePrecedent.recherche !== recherche || filtrePrecedent.famille !== famille) {
    setFiltrePrecedent({ recherche, famille });
    setPage(0);
  }
  const pages = Math.max(1, Math.ceil(filtrees.length / PAR_PAGE));
  const visibles = filtrees.slice(page * PAR_PAGE, page * PAR_PAGE + PAR_PAGE);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="sr-only" htmlFor="recherche-reference">
          Rechercher une finition
        </label>
        <input
          id="recherche-reference"
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher : chêne, marbre, noir mat, A4…"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gris-500 focus:outline-hidden focus:border-rouge/50"
        />
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Familles">
        {FAMILLES.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={famille === f.id}
            onClick={() => setFamille((prev) => (prev === f.id ? null : f.id))}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${famille === f.id ? "bg-rouge border-rouge text-white" : "border-white/15 text-gris-300 hover:border-white/40"}`}
          >
            {f.libelle}
          </button>
        ))}
      </div>
      <p className="text-xs text-gris-500">
        {filtrees.length} finition{filtrees.length > 1 ? "s" : ""}
        {pages > 1 ? ` · page ${page + 1} sur ${pages}` : ""}
      </p>
      <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {visibles.map((r) => {
          const active = choisie?.id === r.id;
          return (
            <li key={r.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChoisir(r)}
                className={`w-full text-left rounded-lg overflow-hidden border-2 transition-colors ${active ? "border-rouge" : "border-transparent hover:border-white/30"}`}
              >
                <div className="relative aspect-square bg-gris-800">
                  <Image src={r.image} alt={`${r.nom} (${r.id})`} fill sizes="(max-width: 640px) 30vw, 120px" loading="lazy" className="object-cover" />
                </div>
                <span className="block px-2 py-1.5 bg-white/5">
                  <span className="block text-xs font-medium text-white truncate">{r.nom}</span>
                  <span className="block text-[10px] text-gris-500">
                    {r.id} · {r.famille}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {pages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="px-3 py-1.5 rounded-lg border border-white/15 disabled:opacity-40">
            ← Précédent
          </button>
          <button type="button" disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} className="px-3 py-1.5 rounded-lg border border-white/15 disabled:opacity-40">
            Suivant →
          </button>
        </div>
      ) : null}
    </div>
  );
}
