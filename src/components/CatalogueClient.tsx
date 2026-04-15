"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import TextureBackground from "@/components/TextureBackground";
import revetements from "@/data/revetements.json";

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
   DATA
══════════════════════════════════════════════════════════════════ */
const FAMILLES = [
  { id: "bois", nom: "Wood", nomFr: "Bois", description: "Imitations bois naturel", count: 267 },
  { id: "couleur", nom: "Color", nomFr: "Couleur", description: "Couleurs unies et satinées", count: 89 },
  { id: "pierre", nom: "Stone", nomFr: "Pierre", description: "Marbre, terrazzo, granit", count: 36 },
  { id: "beton", nom: "Concrete", nomFr: "Béton", description: "Béton brut et stuc", count: 17 },
  { id: "metal", nom: "Steel", nomFr: "Métal", description: "Brossé, rouille, aluminium", count: 31 },
  { id: "textile", nom: "Textile", nomFr: "Textile", description: "Cuir, lin, tissé", count: 41 },
  { id: "paillettes", nom: "Glitter", nomFr: "Paillettes", description: "Finitions scintillantes", count: 16 },
] as const;

const FINITIONS = ["Tous", "Mat", "Brillant", "Texturé", "Soft Touch", "Anti-fingerprint"] as const;
const THEMES = ["Tous", "Clair", "Foncé", "Naturel", "Industriel"] as const;

const ITEMS_PER_PAGE = 48;

const FAMILLE_ICONS: Record<string, string> = {
  bois: "M12 3v18M6 8l6-5 6 5M6 16l6 5 6-5",
  couleur: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12z",
  pierre: "M3 12l2-2 4 4 6-8 6 6v8H3z",
  beton: "M4 4h16v16H4zM4 10h16M10 4v16",
  metal: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  textile: "M4 4c4 0 4 4 8 4s4-4 8-4M4 10c4 0 4 4 8 4s4-4 8-4M4 16c4 0 4 4 8 4s4-4 8-4",
  paillettes: "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z",
};

const FAMILLE_COLORS: Record<string, string> = {
  bois: "bg-amber-700/80",
  couleur: "bg-rose-600/80",
  pierre: "bg-stone-500/80",
  beton: "bg-zinc-500/80",
  metal: "bg-slate-500/80",
  textile: "bg-purple-600/80",
  paillettes: "bg-yellow-500/80",
};

const MARBLE_TEXTURE =
  "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1920&q=80";

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function CatalogueClient() {
  const [activeFamille, setActiveFamille] = useState<string>("tout");
  const [search, setSearch] = useState("");
  const [finition, setFinition] = useState("Tous");
  const [theme, setTheme] = useState("Tous");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [selectedRef, setSelectedRef] = useState<Reference | null>(null);

  const navRef = useRef<HTMLDivElement>(null);

  /* ── Close modal on Escape ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedRef(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  /* ── Lock body scroll when modal open ── */
  useEffect(() => {
    if (selectedRef) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedRef]);

  /* ── Filtered results ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (revetements as Reference[]).filter((r) => {
      if (activeFamille !== "tout" && r.famille !== activeFamille) return false;
      if (finition !== "Tous" && r.finition !== finition) return false;
      if (theme !== "Tous") {
        const hasThemeTag = r.tags.some((t) => t.toLowerCase() === theme.toLowerCase());
        if (!hasThemeTag) return false;
      }
      if (q) {
        const haystack = `${r.nom} ${r.id} ${r.famille} ${r.categorie} ${r.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [activeFamille, search, finition, theme]);

  const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  /* ── Reset visible count when filters change ── */
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [activeFamille, search, finition, theme]);

  const handleFamilleClick = useCallback((id: string) => {
    setActiveFamille(id);
  }, []);

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <main className="min-h-screen bg-noir">
      {/* ──────────────────── HERO ──────────────────── */}
      <section className="relative h-[45vh] min-h-[340px] flex items-center justify-center overflow-hidden">
        <TextureBackground
          src={MARBLE_TEXTURE}
          overlay="linear-gradient(160deg, rgba(0,0,0,0.82) 0%, rgba(10,10,10,0.68) 50%, rgba(0,0,0,0.85) 100%)"
          fadeTop={false}
          fadeBottom
        />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(204,0,0,0.06) 0%, transparent 70%)" }}
        />

        <div className="container-custom relative z-20 text-center pt-24 pb-12">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-sm text-gris-400 mb-6"
            style={{ animation: "slideUpFade 0.6s ease both 0s" }}
          >
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white">Catalogue</span>
          </nav>

          <h1
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-4 tracking-tight"
            style={{ animation: "slideUpFade 0.8s cubic-bezier(0.16,1,0.3,1) both 0.1s" }}
          >
            Catalogue <span className="text-rouge">Cover Styl&apos;</span>
          </h1>

          <p
            className="text-lg sm:text-xl text-gris-300 max-w-2xl mx-auto"
            style={{ animation: "slideUpFade 0.8s cubic-bezier(0.16,1,0.3,1) both 0.25s" }}
          >
            <span className="text-white font-semibold">Près de 500</span> références disponibles &mdash; bois, pierre, béton, métal, couleur, textile, paillettes
          </p>
        </div>
      </section>

      {/* ──────────────────── STICKY FAMILY NAV ──────────────────── */}
      <div className="sticky top-20 z-30">
        <div className="glass-card mx-4 lg:mx-auto max-w-7xl rounded-2xl border border-white/10">
          <div
            ref={navRef}
            className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* "Tout" button */}
            <button
              onClick={() => handleFamilleClick("tout")}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeFamille === "tout"
                  ? "bg-rouge text-white shadow-lg shadow-rouge/25"
                  : "bg-white/5 text-gris-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              <span>Tout</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeFamille === "tout" ? "bg-white/20" : "bg-white/10"
              }`}>
                {(revetements as Reference[]).length}
              </span>
            </button>

            {/* Family buttons */}
            {FAMILLES.map((f) => (
              <button
                key={f.id}
                onClick={() => handleFamilleClick(f.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeFamille === f.id
                    ? "bg-rouge text-white shadow-lg shadow-rouge/25"
                    : "bg-white/5 text-gris-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={FAMILLE_ICONS[f.id]} />
                </svg>
                <span>{f.nomFr}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeFamille === f.id ? "bg-white/20" : "bg-white/10"
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ──────────────────── SEARCH + FILTERS ──────────────────── */}
      <section className="container-custom px-4 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gris-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher par nom, référence, famille..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 focus:ring-1 focus:ring-rouge/30 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gris-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Finition filter */}
          <div className="relative">
            <select
              value={finition}
              onChange={(e) => setFinition(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:border-rouge/50 focus:ring-1 focus:ring-rouge/30 transition-all cursor-pointer"
            >
              {FINITIONS.map((f) => (
                <option key={f} value={f} className="bg-noir text-white">
                  {f === "Tous" ? "Finition" : f}
                </option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gris-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          {/* Theme filter */}
          <div className="relative">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:border-rouge/50 focus:ring-1 focus:ring-rouge/30 transition-all cursor-pointer"
            >
              {THEMES.map((t) => (
                <option key={t} value={t} className="bg-noir text-white">
                  {t === "Tous" ? "Thème" : t}
                </option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gris-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mt-4 text-sm text-gris-400">
          <p>
            <span className="text-white font-semibold">{filtered.length}</span> résultat{filtered.length !== 1 ? "s" : ""}
            {activeFamille !== "tout" && (
              <span> dans <span className="text-rouge">{FAMILLES.find((f) => f.id === activeFamille)?.nomFr}</span></span>
            )}
            {search && <span> pour &laquo;{search}&raquo;</span>}
          </p>
          {(search || finition !== "Tous" || theme !== "Tous" || activeFamille !== "tout") && (
            <button
              onClick={() => {
                setSearch("");
                setFinition("Tous");
                setTheme("Tous");
                setActiveFamille("tout");
              }}
              className="text-rouge hover:text-rouge-light transition-colors"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      </section>

      {/* ──────────────────── PRODUCT GRID ──────────────────── */}
      <section className="container-custom px-4 pb-20">
        {visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg className="w-16 h-16 text-gris-600 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M8 11h6" />
            </svg>
            <h3 className="font-display text-xl font-semibold mb-2">Aucun résultat</h3>
            <p className="text-gris-400 max-w-md">
              Aucune référence ne correspond à vos critères. Essayez de modifier vos filtres ou votre recherche.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {visibleItems.map((ref) => (
                <ProductCard key={ref.id} item={ref} onClick={() => setSelectedRef(ref)} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                  className="group flex items-center gap-3 bg-white/5 border border-white/10 hover:border-rouge/40 rounded-xl px-8 py-4 text-white font-medium transition-all duration-300 hover:bg-white/10"
                >
                  <span>Voir plus</span>
                  <span className="text-sm text-gris-400">
                    ({Math.min(ITEMS_PER_PAGE, filtered.length - visibleCount)} de plus)
                  </span>
                  <svg className="w-4 h-4 text-gris-400 group-hover:text-rouge transition-colors group-hover:translate-y-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ──────────────────── DETAIL MODAL ──────────────────── */}
      {selectedRef && (
        <DetailModal
          item={selectedRef}
          onClose={() => setSelectedRef(null)}
        />
      )}
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRODUCT CARD
══════════════════════════════════════════════════════════════════ */
const ProductCard = React.memo(function ProductCard({ item, onClick }: { item: Reference; onClick: () => void }) {
  const familleColor = FAMILLE_COLORS[item.famille] || "bg-white/20";
  const familleLabel = FAMILLES.find((f) => f.id === item.famille)?.nomFr || item.famille;

  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden bg-gris-800 border border-white/5 hover:border-white/20 transition-all duration-500 text-left"
    >
      {/* Image */}
      <Image
        src={item.image}
        alt={item.nom}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        loading="lazy"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Badges top */}
      <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-10">
        <span className={`${familleColor} backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full`}>
          {familleLabel}
        </span>
        <span className="bg-black/50 backdrop-blur-sm text-gris-300 text-[10px] sm:text-xs px-2 py-0.5 rounded-full">
          {item.finition}
        </span>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4">
        <p className="text-white font-semibold text-sm sm:text-base leading-tight mb-1">{item.nom}</p>
        <p className="text-gris-400 text-xs mb-3">{item.id}</p>
        <span className="inline-flex items-center gap-1.5 text-rouge text-xs sm:text-sm font-medium">
          Voir le détail
          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </button>
  );
});

/* ══════════════════════════════════════════════════════════════════
   DETAIL MODAL
══════════════════════════════════════════════════════════════════ */
function DetailModal({ item, onClose }: { item: Reference; onClose: () => void }) {
  const familleLabel = FAMILLES.find((f) => f.id === item.famille)?.nomFr || item.famille;
  const familleColor = FAMILLE_COLORS[item.famille] || "bg-white/20";
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Détail de ${item.nom}`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal content */}
      <div
        className="relative z-10 bg-gris-800 border border-white/10 rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUpFade 0.3s ease both" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Fermer le détail"
          className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full p-2 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative aspect-square max-h-[600px] w-full bg-gris-900">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gris-800 animate-pulse" />
          )}
          <Image
            src={item.image}
            alt={item.nom}
            fill
            sizes="600px"
            quality={80}
            className={`object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)}
          />
          {/* Family badge on image */}
          <div className="absolute top-4 left-4">
            <span className={`${familleColor} backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full`}>
              {familleLabel}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
                {item.nom}
              </h2>
              <p className="text-gris-400 text-sm">Réf. {item.id}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-gris-500 text-xs mb-1">Famille</p>
              <p className="text-white text-sm font-medium">{familleLabel}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-gris-500 text-xs mb-1">Catégorie</p>
              <p className="text-white text-sm font-medium">{item.categorie}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-gris-500 text-xs mb-1">Finition</p>
              <p className="text-white text-sm font-medium">{item.finition}</p>
            </div>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-white/5 border border-white/10 text-gris-300 text-xs px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <Link
            href={`/contact?ref=${encodeURIComponent(item.id)}`}
            className="btn-primary w-full text-center"
          >
            Demander un devis avec cette référence
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
