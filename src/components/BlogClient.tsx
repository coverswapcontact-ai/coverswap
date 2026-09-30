"use client";

import { useState } from "react";
import Link from "next/link";
import { fondSrc } from "@/lib/images";
import { articles } from "@/data/blog-articles";

/** Les filtres sont les vraies catégories des guides (mission 16 : l'ancienne liste en dur ne correspondait à presque rien). */
const TOUT = "Tout";
const categories = [TOUT, ...Array.from(new Set(articles.map((a) => a.category)))];

export default function BlogClient() {
  const [activeCategory, setActiveCategory] = useState(TOUT);

  const filtered = articles.filter((a) => activeCategory === TOUT || a.category === activeCategory);

  return (
    <>
      <div role="group" aria-label="Filtrer les guides par sujet" className="mb-10 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className={`min-h-[44px] rounded-[var(--rayon-sm)] border px-4 text-[15px] font-medium transition-colors duration-[var(--duree-courte)] ${activeCategory === cat ? "border-encre bg-encre text-blanc" : "border-trait bg-white text-encre hover:border-encre"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((article) => (
          <Link key={article.slug} href={`/blog/${article.slug}`} className="group overflow-hidden rounded-[var(--rayon-md)] border border-trait bg-white transition-colors duration-[var(--duree-courte)] hover:border-encre">
            <div className="relative aspect-[16/9] bg-fond-2">
              {/* Illustration : le titre est lu dans le h2 de la carte, l'image n'a rien à redire (alt vide). */}
              {/* eslint-disable-next-line @next/next/no-img-element -- photos déjà dimensionnées (scripts/importer-fonds.mjs), sans l'optimiseur de Vercel */}
              <img src={fondSrc(article.image, 800)} alt="" width={800} height={450} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="p-6">
              <p className="surtitre mb-2">
                {article.category} · {article.readTime}
              </p>
              <h2 className="mb-2 line-clamp-2 text-[17px] font-semibold text-encre">{article.title}</h2>
              <p className="texte-2 mb-4 line-clamp-3">{article.excerpt}</p>
              <p className="flex items-center justify-between text-[14px]">
                <span className="text-encre-2">{article.date}</span>
                <span className="font-medium text-encre underline-offset-4 group-hover:underline">Lire</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
