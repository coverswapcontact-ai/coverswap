"use client";

import { useState } from "react";
import Link from "next/link";
import AnimatedCounter from "@/components/AnimatedCounter";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import SimulationForm from "@/components/SimulationForm";
import ScrollReveal from "@/components/ScrollReveal";
import TextureBackground from "@/components/TextureBackground";
import { FAQSchema } from "@/components/JsonLd";

/* ──────────────────────────────────────────────────────────────────
   TEXTURES — URLs Unsplash directes, images libres de droits
   Paramètres : w=1920, q=80, fit=crop, format=auto
────────────────────────────────────────────────────────────────── */
const TEXTURES = {
  /** Cuisine moderne avec plan de travail en marbre */
  kitchen:
    "https://images.unsplash.com/photo-1639405069836-f82aa6dcb900?auto=format&fit=crop&w=1920&q=80",

  /** Salle de bain élégante avec murs en marbre et éléments naturels */
  bathroom:
    "https://images.unsplash.com/photo-1754522711595-84428937b07a?auto=format&fit=crop&w=1920&q=80",

  /** Intérieur moderne avec meubles et caissons en bois */
  furniture:
    "https://images.unsplash.com/photo-1764526624453-db32c24eca55?auto=format&fit=crop&w=1920&q=80",

  /** Comptoir de bar moderne avec surface en marbre */
  counter:
    "https://images.unsplash.com/photo-1767022724924-993b00fc04b3?auto=format&fit=crop&w=1920&q=80",
} as const;

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   Marbre noir / parallax / overlay 0.72
══════════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Texture marbre avec parallax */}
      <TextureBackground
        src={TEXTURES.kitchen}
        overlay="linear-gradient(160deg, rgba(0,0,0,0.82) 0%, rgba(10,10,10,0.68) 50%, rgba(0,0,0,0.85) 100%)"
        parallax
        fadeTop={false}
        fadeBottom
      />

      {/* Halo rouge ambiant */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(204,0,0,0.07) 0%, transparent 70%)" }}
      />

      <div className="container-custom relative z-20 text-center pt-32 pb-20">
        {/* Badge live */}
        <div
          className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2 mb-8"
          style={{ animation: "slideUpFade 0.6s ease both 0s" }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gris-300">Simulation IA gratuite en 60 secondes</span>
        </div>

        {/* Headline */}
        <h1
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] mb-6 tracking-tight"
          style={{ animation: "slideUpFade 0.8s cubic-bezier(0.16,1,0.3,1) both 0.1s" }}
        >
          Transformez votre
          <br />
          intérieur en{" "}
          <span className="relative inline-block">
            <span className="text-rouge">1 journée</span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
              <path
                d="M2 10C50 2 100 2 150 6C200 10 250 4 298 8"
                stroke="#CC0000"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        <p
          className="text-lg sm:text-xl text-gris-300 max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ animation: "slideUpFade 0.8s cubic-bezier(0.16,1,0.3,1) both 0.25s" }}
        >
          Revêtements adhésifs texturés haut de gamme. Effet marbre, bois, béton, métal.
          <br className="hidden sm:block" />
          <strong className="text-white">10x moins cher</strong> qu&apos;une rénovation classique.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          style={{ animation: "slideUpFade 0.8s cubic-bezier(0.16,1,0.3,1) both 0.4s" }}
        >
          <Link href="/simulation" className="btn-primary text-lg px-10 py-5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Recevoir ma simulation gratuite
          </Link>
          <Link href="/realisations" className="btn-secondary">
            Voir nos réalisations
          </Link>
        </div>

        {/* Social proof */}
        <div
          className="flex flex-wrap items-center justify-center gap-8 text-gris-500"
          style={{ animation: "slideUpFade 0.8s cubic-bezier(0.16,1,0.3,1) both 0.55s" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["A", "B", "C", "D", "E"].map((l) => (
                <div
                  key={l}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-gris-600 to-gris-800 border-2 border-noir flex items-center justify-center text-[10px] font-bold text-white"
                >
                  {l}
                </div>
              ))}
            </div>
            <span className="text-sm">+500 clients satisfaits</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-sm ml-1">4.9/5 sur Google</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-20">
        <svg className="w-6 h-6 text-gris-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — CHIFFRES CLÉS
   Fond noir pur — laisser respirer entre les sections texturées
══════════════════════════════════════════════════════════════════ */
function KeyFigures() {
  const figures = [
    { value: 1,   suffix: " journée", label: "Pour transformer votre espace", icon: "clock" },
    { value: 10,  suffix: "x",        label: "Moins cher qu'une rénovation",  icon: "euro"  },
    { value: 60,  suffix: " sec",     label: "Pour votre simulation IA",      icon: "zap"   },
    { value: 100, suffix: "%",        label: "France entière couverte",       icon: "map"   },
  ];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-noir overflow-hidden">
      {/* Halo rouge très subtil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(204,0,0,0.15) 0%, transparent 70%)" }} />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {figures.map((fig, i) => (
            <ScrollReveal key={i} delay={i * 0.1} direction="up">
              <div className="glass-card p-8 text-center group hover:border-rouge/30 transition-all duration-500 hover:bg-rouge/5 h-full">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-rouge/10 flex items-center justify-center group-hover:bg-rouge/20 transition-colors">
                  {fig.icon === "clock" && <svg className="w-7 h-7 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {fig.icon === "euro" && <svg className="w-7 h-7 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4" /></svg>}
                  {fig.icon === "zap"  && <svg className="w-7 h-7 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  {fig.icon === "map"  && <svg className="w-7 h-7 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                </div>
                <div className="font-display text-4xl md:text-5xl font-bold text-white mb-2">
                  <AnimatedCounter end={fig.value} suffix={fig.suffix} />
                </div>
                <p className="text-sm text-gris-400">{fig.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 — COMMENT ÇA MARCHE
   Béton lisse anthracite — overlay 0.80
══════════════════════════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Envoyez votre photo",
      desc: "Prenez une photo de votre espace et envoyez-la via notre formulaire. Notre IA l'analyse en quelques secondes.",
      icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      num: "02",
      title: "Recevez votre simulation",
      desc: "En moins de 60 secondes, notre IA génère un rendu réaliste avec le revêtement choisi. Gratuit et sans engagement.",
      icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    },
    {
      num: "03",
      title: "On transforme tout",
      desc: "Notre équipe intervient chez vous en 1 journée. Pose professionnelle, finition parfaite, résultat garanti.",
      icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
    },
  ];

  return (
    <section className="relative section-padding overflow-hidden">
      {/* Texture béton */}
      <TextureBackground
        src={TEXTURES.bathroom}
        overlay="rgba(0,0,0,0.80)"
        fadeTop
        fadeBottom
      />

      <div className="container-custom relative z-20">
        <div className="text-center mb-16">
          <ScrollReveal direction="fade">
            <span className="text-rouge font-bold text-sm uppercase tracking-widest">Simple &amp; rapide</span>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">Comment ça marche ?</h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-gris-300 max-w-xl mx-auto">
              3 étapes simples pour transformer votre intérieur. De la simulation IA à la pose finale.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Ligne de connexion */}
          <div className="hidden md:block absolute top-[4.5rem] left-[22%] right-[22%] h-px"
            style={{ background: "linear-gradient(to right, transparent, rgba(204,0,0,0.35), transparent)" }} />

          {steps.map((step, i) => (
            <ScrollReveal key={i} delay={i * 0.15} direction="up">
              <div className="glass-card p-8 h-full hover:border-rouge/30 transition-all duration-500 hover:bg-rouge/5 hover:-translate-y-2 relative group">
                <div className="font-display text-6xl font-bold text-rouge/10 absolute top-4 right-6 select-none">
                  {step.num}
                </div>
                <div className="w-16 h-16 rounded-2xl bg-rouge/10 flex items-center justify-center text-rouge mb-6 group-hover:bg-rouge group-hover:text-white transition-all duration-500">
                  {step.icon}
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gris-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal direction="up" delay={0.3}>
          <div className="text-center mt-12">
            <Link href="/simulation" className="btn-primary">
              Commencer ma simulation
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 4 — GALERIE AVANT/APRÈS
   Bois noyer foncé — overlay 0.78
══════════════════════════════════════════════════════════════════ */
function GallerySection() {
  const projects = [
    {
      title: "Cuisine — Marbre Calacatta",
      beforeImage: "https://images.unsplash.com/photo-1560185127-2d06c6d08d3d?auto=format&fit=crop&w=960&q=80",
      afterImage:  "https://images.unsplash.com/photo-1682888813913-e13f18692019?auto=format&fit=crop&w=960&q=80",
    },
    {
      title: "Salle de bain — Béton ciré",
      beforeImage: "https://images.unsplash.com/photo-1764551164990-298160bcea48?auto=format&fit=crop&w=960&q=80",
      afterImage:  "https://images.unsplash.com/photo-1750036015902-c6f5ebca924e?auto=format&fit=crop&w=960&q=80",
    },
    {
      title: "Meuble TV — Bois noyer",
      beforeImage: "https://images.unsplash.com/photo-1768609239321-1cfe14893e80?auto=format&fit=crop&w=960&q=80",
      afterImage:  "https://images.unsplash.com/photo-1687942918532-69295473701d?auto=format&fit=crop&w=960&q=80",
    },
    {
      title: "Bureau Pro — Métal brossé",
      beforeImage: "https://images.unsplash.com/photo-1566305977571-5666677c6e98?auto=format&fit=crop&w=960&q=80",
      afterImage:  "https://images.unsplash.com/photo-1601224503166-47e6afa2fc92?auto=format&fit=crop&w=960&q=80",
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
   SECTION 5 — SIMULATION
   Fond noir pur #1a1a1a — le rouge doit ressortir au maximum
══════════════════════════════════════════════════════════════════ */
function SimulationSection() {
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
   SECTION 6 — TÉMOIGNAGES
   Métal brossé anthracite — overlay 0.82
══════════════════════════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sophie M.",
      role: "Particulier — Paris",
      text: "Incroyable ! Ma cuisine a été transformée en une demi-journée. Le rendu marbre est bluffant, mes amis pensent que j'ai fait de gros travaux.",
      rating: 5,
    },
    {
      name: "Thomas R.",
      role: "Restaurateur — Lyon",
      text: "J'ai fait recouvrir le comptoir et les murs de mon restaurant. Le résultat est impressionnant et mes clients adorent. Rapport qualité/prix imbattable.",
      rating: 5,
    },
    {
      name: "Marie L.",
      role: "Particulier — Bordeaux",
      text: "La simulation IA m'a convaincue instantanément. Le rendu était exactement ce que j'imaginais. Équipe professionnelle, travail impeccable.",
      rating: 5,
    },
    {
      name: "Pierre D.",
      role: "Architecte d'intérieur — Nice",
      text: "Je recommande CoverSwap à tous mes clients. La qualité des revêtements est exceptionnelle, la pose rapide et propre. Un vrai game-changer.",
      rating: 5,
    },
  ];

  return (
    <section className="relative section-padding overflow-hidden">
      {/* Texture métal brossé */}
      <TextureBackground
        src={TEXTURES.counter}
        overlay="rgba(0,0,0,0.82)"
        fadeTop
        fadeBottom
      />

      <div className="container-custom relative z-20">
        <div className="text-center mb-16">
          <ScrollReveal direction="fade">
            <span className="text-rouge font-bold text-sm uppercase tracking-widest">Témoignages</span>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
              Ils ont transformé leur intérieur
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-gris-300 max-w-xl mx-auto">Plus de 500 clients satisfaits dans toute la France.</p>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <ScrollReveal key={i} delay={i * 0.1} direction="up">
              <div className="glass-card p-6 hover:border-rouge/20 transition-all duration-500 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gris-300 text-sm leading-relaxed mb-6 flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rouge/60 to-rouge/30 flex items-center justify-center font-bold text-sm shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-gris-500">{t.role}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 7 — FAQ
   Fond noir pur
══════════════════════════════════════════════════════════════════ */
function FAQSection() {
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

/* ══════════════════════════════════════════════════════════════════
   PAGE ROOT
══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <KeyFigures />
      <HowItWorks />
      <GallerySection />
      <SimulationSection />
      <TestimonialsSection />
      <FAQSection />
    </>
  );
}
