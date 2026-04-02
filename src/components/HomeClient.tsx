"use client";

import { useState } from "react";
import Link from "next/link";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import SimulationForm from "@/components/SimulationForm";
import ScrollReveal from "@/components/ScrollReveal";
import TextureBackground from "@/components/TextureBackground";
import { FAQSchema } from "@/components/JsonLd";

/* ──────────────────────────────────────────────────────────────────
   TEXTURES
────────────────────────────────────────────────────────────────── */
const TEXTURES = {
  furniture:
    "https://images.unsplash.com/photo-1764526624453-db32c24eca55?auto=format&fit=crop&w=1920&q=80",
} as const;

/* ══════════════════════════════════════════════════════════════════
   GALERIE AVANT/APRÈS — needs useState for active tab
══════════════════════════════════════════════════════════════════ */
export function GallerySection() {
  const projects = [
    {
      title: "Cuisine — Marbre Calacatta",
      beforeImage: "https://images.unsplash.com/photo-1560185127-2d06c6d08d3d?auto=format&fit=crop&w=960&q=80",
      afterImage:  "https://images.unsplash.com/photo-1682888813913-e13f18692019?auto=format&fit=crop&w=960&q=80",
    },
    {
      title: "Salle de bain — Béton ciré",
      beforeImage: "https://images.unsplash.com/photo-1764551164990-298160bcea48?auto=format&fit=crop&w=960&q=80",
      afterImage:  "https://images.unsplash.com/photo-1754788358645-d6e6cca12e25?auto=format&fit=crop&w=960&q=80",
    },
    {
      title: "Meuble TV — Bois noyer",
      beforeImage: "https://images.unsplash.com/photo-1768609239321-1cfe14893e80?auto=format&fit=crop&w=960&q=80",
      afterImage:  "https://images.unsplash.com/photo-1687942918532-69295473701d?auto=format&fit=crop&w=960&q=80",
    },
    {
      title: "Bureau Pro — Métal brossé",
      beforeImage: "https://images.unsplash.com/photo-1566305977571-5666677c6e98?auto=format&fit=crop&w=960&q=80",
      afterImage:  "https://images.unsplash.com/photo-1758448721149-aa0ce8e1b2c9?auto=format&fit=crop&w=960&q=80",
    },
  ];

  const [active, setActive] = useState(0);

  return (
    <section className="relative section-padding overflow-hidden">
      {/* Texture bois */}
      <TextureBackground
        src={TEXTURES.furniture}
        overlay="rgba(0,0,0,0.78)"
        fadeTop
        fadeBottom
      />

      <div className="container-custom relative z-20">
        <div className="text-center mb-16">
          <ScrollReveal direction="fade">
            <span className="text-rouge font-bold text-sm uppercase tracking-widest">Portfolio</span>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">Avant / Après</h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-gris-300 max-w-xl mx-auto">
              Découvrez les transformations réalisées par CoverSwap. Glissez pour comparer.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="up" delay={0.1}>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {projects.map((p, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  active === i
                    ? "bg-rouge text-white shadow-[0_0_16px_rgba(204,0,0,0.4)]"
                    : "bg-white/5 text-gris-400 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {p.title.split(" — ")[0]}
              </button>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal direction="scale" delay={0.15}>
          <div className="max-w-4xl mx-auto">
            <BeforeAfterSlider
              beforeImage={projects[active].beforeImage}
              afterImage={projects[active].afterImage}
              height="h-[280px] sm:h-[380px] md:h-[480px]"
            />
            <p className="text-center text-gris-300 mt-4 font-medium">{projects[active].title}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.2}>
          <div className="text-center mt-10">
            <Link href="/realisations" className="btn-secondary">
              Voir toutes nos réalisations
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIMULATION — contains SimulationForm (client component)
══════════════════════════════════════════════════════════════════ */
export function SimulationSection() {
  return (
    <section id="simulation" className="relative section-padding bg-noir overflow-hidden">
      {/* Halo rouge droit */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(circle at right, rgba(204,0,0,0.08) 0%, transparent 70%)" }} />

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <ScrollReveal direction="left">
            <div>
              <span className="text-rouge font-bold text-sm uppercase tracking-widest">Gratuit &amp; sans engagement</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-6">
                Votre simulation IA
                <br />
                <span className="text-rouge">en 60 secondes</span>
              </h2>
              <p className="text-gris-300 text-lg mb-8 leading-relaxed">
                Envoyez une simple photo de votre espace et recevez instantanément un rendu réaliste
                avec le revêtement de votre choix.
              </p>
              <div className="space-y-4">
                {[
                  "Rendu photoréaliste en quelques secondes",
                  "Choix parmi +50 textures Cover Styl'",
                  "100% gratuit, sans engagement",
                  "Devis personnalisé inclus",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-rouge/20 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gris-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.1}>
            <div className="glass-card p-8 glow-border border-rouge/20">
              <SimulationForm variant="compact" />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FAQ — needs useState for accordion
══════════════════════════════════════════════════════════════════ */
export function FAQSection() {
  const faqs = [
    {
      q: "Combien de temps dure la pose ?",
      a: "La majorité de nos interventions se font en une seule journée. Pour les projets plus importants (cuisine complète + salle de bain), comptez 1 à 2 jours maximum.",
    },
    {
      q: "Les revêtements sont-ils résistants à l'eau ?",
      a: "Oui ! Nos revêtements Cover Styl' sont 100% waterproof. Ils sont parfaitement adaptés aux cuisines et salles de bain, résistants à l'humidité, aux éclaboussures et à la chaleur modérée.",
    },
    {
      q: "Peut-on retirer le revêtement sans abîmer le support ?",
      a: "Absolument. Nos revêtements sont conçus pour être repositionnables et retirables sans laisser de traces. Idéal pour les locataires.",
    },
    {
      q: "Quelle est la durée de vie du covering ?",
      a: "Nos revêtements haut de gamme ont une durée de vie de 7 à 10 ans en utilisation normale. Ils résistent aux UV, aux rayures légères et au nettoyage régulier.",
    },
    {
      q: "Intervenez-vous dans toute la France ?",
      a: "Oui, nous intervenons sur l'ensemble du territoire français. Lucas se déplace partout en France métropolitaine.",
    },
    {
      q: "Comment fonctionne la simulation IA ?",
      a: "Envoyez une photo de votre espace via notre formulaire. Notre IA génère en moins de 60 secondes un rendu photoréaliste avec le revêtement de votre choix. Vous recevez le résultat par SMS.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative section-padding bg-noir overflow-hidden">
      <FAQSchema faqs={faqs} />
      <div className="container-custom relative z-10 max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <ScrollReveal direction="fade">
            <span className="text-rouge font-bold text-sm uppercase tracking-widest">FAQ</span>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">Questions fréquentes</h2>
          </ScrollReveal>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 0.07} direction="up">
              <div className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-display font-bold text-lg pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 shrink-0 text-rouge transition-transform duration-300 ${openIndex === i ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="px-6 pb-6 text-gris-400 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
