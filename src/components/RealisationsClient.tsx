"use client";

import { useState } from "react";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

const categories = ["Tout", "Cuisine", "Salle de bain", "Meubles", "Professionnel"];
const styleFilters = ["Tout", "Marbre", "Bois", "Béton", "Couleur", "Métal"];

const projects = [
  {
    id: 1,
    title: "Cuisine design — Marbre Calacatta",
    category: "Cuisine",
    style: "Marbre",
    location: "Paris 16e",
    before: "linear-gradient(135deg, #8B7355 0%, #6B5B45 100%)",
    after: "linear-gradient(135deg, #e8e4df 0%, #b8b0a5 100%)",
  },
  {
    id: 2,
    title: "Plan de travail — Béton ciré anthracite",
    category: "Cuisine",
    style: "Béton",
    location: "Lyon 3e",
    before: "linear-gradient(135deg, #d4c5a9 0%, #b8a888 100%)",
    after: "linear-gradient(135deg, #5C5C5C 0%, #3A3A3A 100%)",
  },
  {
    id: 3,
    title: "Salle de bain — Marbre noir Marquina",
    category: "Salle de bain",
    style: "Marbre",
    location: "Bordeaux",
    before: "linear-gradient(135deg, #d4c5a9 0%, #c2b393 100%)",
    after: "linear-gradient(135deg, #1a1a1a 0%, #333 50%, #1a1a1a 100%)",
  },
  {
    id: 4,
    title: "Meuble TV — Bois de noyer",
    category: "Meubles",
    style: "Bois",
    location: "Marseille",
    before: "linear-gradient(135deg, #F5F5DC 0%, #D4C8A8 100%)",
    after: "linear-gradient(135deg, #3E2723 0%, #5D4037 100%)",
  },
  {
    id: 5,
    title: "Comptoir restaurant — Métal brossé",
    category: "Professionnel",
    style: "Métal",
    location: "Nice",
    before: "linear-gradient(135deg, #D2B48C 0%, #B89868 100%)",
    after: "linear-gradient(135deg, #8C8C8C 0%, #A0A0A0 50%, #787878 100%)",
  },
  {
    id: 6,
    title: "Crédence cuisine — Bois chêne clair",
    category: "Cuisine",
    style: "Bois",
    location: "Nantes",
    before: "linear-gradient(135deg, #e8e0d0 0%, #d0c8b8 100%)",
    after: "linear-gradient(135deg, #C8A87C 0%, #A0825C 100%)",
  },
  {
    id: 7,
    title: "Vasque salle de bain — Terracotta",
    category: "Salle de bain",
    style: "Couleur",
    location: "Toulouse",
    before: "linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)",
    after: "linear-gradient(135deg, #C85A3A 0%, #A04228 100%)",
  },
  {
    id: 8,
    title: "Bureau direction — Marbre Emperador",
    category: "Professionnel",
    style: "Marbre",
    location: "Paris 8e",
    before: "linear-gradient(135deg, #B89868 0%, #987848 100%)",
    after: "linear-gradient(135deg, #5C4033 0%, #8B6914 30%, #5C4033 100%)",
  },
];

export default function RealisationsClient() {
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [activeStyle, setActiveStyle] = useState("Tout");

  const filtered = projects.filter(
    (p) =>
      (activeCategory === "Tout" || p.category === activeCategory) &&
      (activeStyle === "Tout" || p.style === activeStyle)
  );

  return (
    <>
      {/* Filters */}
      <div className="mb-6">
        <p className="text-sm text-gris-500 mb-2 uppercase tracking-wider">Par espace</p>
        <div className="flex flex-wrap gap-2">
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
      </div>

      <div className="mb-12">
        <p className="text-sm text-gris-500 mb-2 uppercase tracking-wider">Par style</p>
        <div className="flex flex-wrap gap-2">
          {styleFilters.map((style) => (
            <button
              key={style}
              onClick={() => setActiveStyle(style)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeStyle === style
                  ? "bg-rouge text-white"
                  : "bg-white/5 text-gris-400 hover:bg-white/10 border border-white/10"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {filtered.map((project) => (
          <div key={project.id} className="glass-card overflow-hidden group">
            <BeforeAfterSlider
              beforeColor={project.before}
              afterColor={project.after}
              height="h-[300px]"
            />
            <div className="p-6">
              <h3 className="font-display font-bold text-lg mb-1">{project.title}</h3>
              <p className="text-sm text-gris-500">{project.location}</p>
              <div className="flex gap-2 mt-3">
                <span className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gris-400">
                  {project.category}
                </span>
                <span className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gris-400">
                  {project.style}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gris-500">
          <p className="text-lg">Aucune réalisation trouvée pour ces filtres.</p>
        </div>
      )}
    </>
  );
}
