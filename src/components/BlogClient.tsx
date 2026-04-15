"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { articles } from "@/data/blog-articles";

const categories = ["Tout", "Conseils", "Tendances", "Comparatif", "Locataire"];

export default function BlogClient() {
  const [activeCategory, setActiveCategory] = useState("Tout");

  const filtered = articles.filter(
    (a) => activeCategory === "Tout" || a.category === activeCategory
  );

  return (
    <>
      {/* Category filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-14">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? "bg-rouge text-white"
                : "bg-white/5 text-gris-400 hover:bg-white/10 border border-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="glass-card overflow-hidden group hover:border-rouge/30 transition-all duration-300"
          >
            {/* Thumbnail */}
            <div className="relative h-48 overflow-hidden">
              <Image
                src={article.image}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir/60 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Category + meta */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-rouge bg-rouge/10 px-3 py-1 rounded-full">
                  {article.category}
                </span>
                <span className="text-xs text-gris-500 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {article.readTime}
                </span>
              </div>

              <h2 className="font-display font-bold text-lg mb-2 group-hover:text-rouge transition-colors line-clamp-2">
                {article.title}
              </h2>

              <p className="text-sm text-gris-400 leading-relaxed mb-4 line-clamp-3">
                {article.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gris-500">{article.date}</span>
                <span className="text-sm text-rouge font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                  Lire
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gris-500">
          <p className="text-lg">Aucun article dans cette categorie.</p>
        </div>
      )}
    </>
  );
}
