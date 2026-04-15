import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import AnimatedCounter from "@/components/AnimatedCounter";
import ScrollReveal from "@/components/ScrollReveal";
import TextureBackground from "@/components/TextureBackground";
import HeroVideo from "@/components/HeroVideo";
import { SimulationSection, FAQSection } from "@/components/HomeClient";

/* ──────────────────────────────────────────────────────────────────
   METADATA — SEO
────────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  // Undefined pour que le title par défaut du layout s'applique
  // (titre complet optimisé pour Google)
  title: {
    absolute: "CoverSwap — Covering adhésif premium, rénovation en 1 jour",
  },
  description:
    "Rénovez cuisine, salle de bain et meubles en 1 journée grâce au covering adhésif premium. Simulation IA gratuite. Devis en 60s. À partir de 80 €/m² posé.",
  openGraph: {
    title: "CoverSwap — Covering adhésif premium, rénovation en 1 jour",
    description:
      "Rénovez cuisine, salle de bain et meubles en 1 journée. Simulation IA gratuite. À partir de 80 €/m² posé.",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

/* ──────────────────────────────────────────────────────────────────
   TEXTURES — URLs Unsplash directes, images libres de droits
   Paramètres : w=1920, q=80, fit=crop, format=auto
────────────────────────────────────────────────────────────────── */
const TEXTURES = {
  /** Salle de bain élégante avec murs en marbre et éléments naturels */
  bathroom:
    "https://images.unsplash.com/photo-1754522711595-84428937b07a?auto=format&fit=crop&w=1920&q=80",
} as const;

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   Marbre noir / parallax / overlay 0.72
══════════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-[85vh] md:min-h-screen flex items-center justify-center overflow-hidden">
      {/* Vidéo hero — desktop only, mobile = poster */}
      <HeroVideo />

      {/* Halo rouge ambiant — masqué mobile */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none hidden md:block"
        style={{ background: "radial-gradient(circle, rgba(204,0,0,0.07) 0%, transparent 70%)" }}
      />

      <div className="container-custom relative z-20 text-center pt-20 pb-8 md:pt-32 md:pb-20">
        {/* Badge live */}
        <div
          className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 md:px-5 md:py-2 mb-5 md:mb-8"
          style={{ animation: "slideUpFade 0.6s ease both 0s" }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gris-300">Simulation IA gratuite en 60 secondes</span>
        </div>

        {/* Headline */}
        <h1
          className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] mb-4 md:mb-6 tracking-tight"
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
          className="text-sm sm:text-base md:text-xl text-gris-300 max-w-2xl mx-auto mb-4 md:mb-10 leading-relaxed"
          style={{ animation: "slideUpFade 0.8s cubic-bezier(0.16,1,0.3,1) both 0.25s" }}
        >
          Revêtements adhésifs texturés haut de gamme. Effet marbre, bois, béton, métal.
          <br className="hidden sm:block" />
          <strong className="text-white">Jusqu&apos;à 5x moins cher</strong> qu&apos;une rénovation classique.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4 mb-6 md:mb-16"
          style={{ animation: "slideUpFade 0.8s cubic-bezier(0.16,1,0.3,1) both 0.4s" }}
        >
          <Link href="/simulation" className="btn-primary text-sm md:text-lg px-6 py-3 md:px-10 md:py-5">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Simuler ma cuisine
          </Link>
          <a
            href="https://www.instagram.com/cover.swap/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex items-center gap-2 text-sm md:text-base px-5 py-2.5 md:px-6 md:py-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            Voir nos réalisations
          </a>
        </div>

        {/* Pricing hint */}
        <div
          className="mb-4 md:mb-10 -mt-1 md:-mt-4 flex items-center justify-center"
          style={{ animation: "slideUpFade 0.8s cubic-bezier(0.16,1,0.3,1) both 0.5s" }}
        >
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-rouge/30 rounded-full px-5 py-2.5">
            <svg className="w-4 h-4 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4" />
            </svg>
            <span className="text-sm text-white font-medium">
              À partir de <strong className="text-rouge">80&nbsp;€/m²</strong>
              <span className="text-gris-400"> · surfaces lisses · à partir de 20&nbsp;m²</span>
            </span>
          </div>
        </div>

        {/* Trust badges */}
        <div
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-gris-400"
          style={{ animation: "slideUpFade 0.8s cubic-bezier(0.16,1,0.3,1) both 0.55s" }}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm">Devis gratuit sans engagement</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">Artisan spécialisé Cover Styl&apos;</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">France entière</span>
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
    { value: 5,   suffix: "x",        label: "Moins cher qu'une rénovation",  icon: "euro"  },
    { value: 60,  suffix: " sec",     label: "Pour votre simulation IA",      icon: "zap"   },
    { value: 100, suffix: "%",        label: "France entière couverte",       icon: "map"   },
  ];

  return (
    <section className="relative py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-noir overflow-hidden">
      {/* Halo rouge très subtil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(204,0,0,0.15) 0%, transparent 70%)" }} />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {figures.map((fig, i) => (
            <ScrollReveal key={i} delay={i * 0.1} direction="up">
              <div className="glass-card p-5 md:p-8 text-center group hover:border-rouge/30 transition-all duration-500 hover:bg-rouge/5 h-full">
                <div className="w-10 h-10 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 rounded-xl bg-rouge/10 flex items-center justify-center group-hover:bg-rouge/20 transition-colors">
                  {fig.icon === "clock" && <svg className="w-7 h-7 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {fig.icon === "euro" && <svg className="w-7 h-7 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4" /></svg>}
                  {fig.icon === "zap"  && <svg className="w-7 h-7 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  {fig.icon === "map"  && <svg className="w-7 h-7 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                </div>
                <div className="font-display text-3xl md:text-5xl font-bold text-white mb-1 md:mb-2">
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
        <div className="text-center mb-10 md:mb-16">
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
              <div className="glass-card p-5 md:p-8 h-full hover:border-rouge/30 transition-all duration-500 hover:bg-rouge/5 hover:-translate-y-2 relative group">
                <div className="font-display text-4xl md:text-6xl font-bold text-rouge/10 absolute top-3 right-4 md:top-4 md:right-6 select-none">
                  {step.num}
                </div>
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-rouge/10 flex items-center justify-center text-rouge mb-4 md:mb-6 group-hover:bg-rouge group-hover:text-white transition-all duration-500">
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
              Simuler ma cuisine
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION PRICING — Tarif transparent
   Rassurer sur l'ordre de grandeur AVANT la demande de devis
══════════════════════════════════════════════════════════════════ */
function PricingSection() {
  return (
    <section id="tarifs" className="relative py-14 md:py-24 px-4 sm:px-6 lg:px-8 bg-noir overflow-hidden">
      {/* Halo rouge */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-30"
          style={{ background: "radial-gradient(ellipse, rgba(204,0,0,0.15) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container-custom relative z-10 max-w-5xl">
        <div className="text-center mb-12">
          <ScrollReveal direction="fade">
            <span className="text-rouge font-bold text-sm uppercase tracking-widest">Tarif transparent</span>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
              Un prix clair, <span className="text-rouge">sans surprise</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-gris-300 max-w-2xl mx-auto">
              Fini les devis opaques. CoverSwap affiche ses tarifs dès la page d&apos;accueil.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="up" delay={0.15}>
          <div className="glass-card glow-border border-rouge/30 p-6 md:p-14 text-center relative overflow-hidden">
            {/* Ribbon */}
            <div className="absolute top-5 right-5 bg-rouge/15 border border-rouge/40 rounded-full px-3 py-1 text-[10px] font-bold text-rouge uppercase tracking-widest">
              Fourni &amp; posé
            </div>

            <p className="text-gris-400 uppercase text-xs tracking-widest mb-3">À partir de</p>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="font-display text-5xl md:text-8xl font-bold text-white">80</span>
              <span className="font-display text-2xl md:text-4xl text-rouge font-bold">€ / m²</span>
            </div>
            <p className="text-gris-300 mb-8">Revêtement Cover Styl&apos; fourni et posé par nos soins</p>

            <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
              {[
                { title: "Surfaces lisses", desc: "Crédence, plan, façades planes" },
                { title: "À partir de 20 m²", desc: "Surface minimale pour bénéficier de ce tarif" },
                { title: "Tout inclus", desc: "Matériau premium + pose + finitions" },
              ].map((c) => (
                <div key={c.title} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="font-bold text-white text-sm mb-1">{c.title}</p>
                  <p className="text-xs text-gris-400">{c.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-gris-500 mb-8 max-w-2xl mx-auto leading-relaxed">
              Tarif indicatif de départ pour une surface plane à partir de 20&nbsp;m². Prix final ajusté selon la complexité
              (angles, reliefs, démontages nécessaires), la référence Cover Styl&apos; choisie et la zone d&apos;intervention.
              Devis détaillé gratuit sous 24&nbsp;h.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/simulation" className="btn-primary">
                Simuler ma cuisine (IA)
              </Link>
              <Link href="/contact" className="btn-secondary">
                Demander un devis précis
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 4b — CATALOGUE CTA
   Fond noir — bannière visuelle vers /revetements
══════════════════════════════════════════════════════════════════ */
function CatalogueSection() {
  /**
   * Chaque famille est représentée par une référence clé du catalogue Cover Styl',
   * pas par un icône générique. Visuel = preuve immédiate du produit.
   */
  const families = [
    {
      name: "Bois",
      count: "267",
      refId: "AA04",
      refName: "Rich Oak",
      image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/aa04_d4dbfa3468.jpg",
    },
    {
      name: "Pierre & marbre",
      count: "36",
      refId: "MK14",
      refName: "Grigio Marquina",
      image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/mk14_792e853256.jpg",
    },
    {
      name: "Béton & ciment",
      count: "17",
      refId: "NE24",
      refName: "Raw Grey",
      image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/ne24_50d2ddfad4.jpg",
    },
    {
      name: "Couleurs unies",
      count: "89",
      refId: "K1",
      refName: "Black Mat",
      image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/k1_6dc839de4a.jpg",
    },
    {
      name: "Métal",
      count: "31",
      refId: "KI01",
      refName: "Chromed Metal",
      image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/ki01_e5536ae2ce.jpg",
    },
    {
      name: "Cuir & textile",
      count: "41",
      refId: "LP04",
      refName: "Graphite",
      image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/LP_04_Graphite_2802668bd8.png",
    },
    {
      name: "Paillettes",
      count: "16",
      refId: "R11",
      refName: "Midnight Blue Disco",
      image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/r11_9f09c9b29b.jpg",
    },
  ];

  return (
    <section className="relative section-padding bg-noir overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(204,0,0,0.15) 0%, transparent 70%)" }} />

      <div className="container-custom relative z-10">
        <div className="text-center mb-12">
          <ScrollReveal direction="fade">
            <span className="text-rouge font-bold text-sm uppercase tracking-widest">Catalogue</span>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
              Près de 500 références <span className="text-rouge">Cover Styl&rsquo;</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-gris-300 max-w-2xl mx-auto">
              Explorez notre catalogue complet de rev&ecirc;tements adh&eacute;sifs : bois, marbre, b&eacute;ton, m&eacute;tal, couleurs unies et bien plus. Chaque finition est disponible &agrave; la commande.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="up" delay={0.15}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10">
            {families.map((f) => (
              <Link
                key={f.name}
                href={`/revetements?famille=${encodeURIComponent(f.name.toLowerCase().split(" ")[0])}`}
                className="group glass-card p-4 text-center hover:border-rouge/40 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Vignette : référence clé de la famille */}
                <div className="relative w-full aspect-square mx-auto mb-3 rounded-xl overflow-hidden border border-white/10 group-hover:border-rouge/40 transition-colors">
                  <Image
                    src={f.image}
                    alt={`${f.refName} — exemple ${f.name}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 140px"
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Badge code ref en bas */}
                  <div className="absolute bottom-1 right-1 bg-noir/85 backdrop-blur-sm text-[9px] font-mono text-white px-1.5 py-0.5 rounded">
                    {f.refId}
                  </div>
                </div>
                <p className="font-display font-bold text-sm mb-0.5 group-hover:text-rouge transition-colors">
                  {f.name}
                </p>
                <p className="text-rouge text-xs font-semibold">{f.count} refs</p>
              </Link>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.25}>
          <div className="text-center">
            <Link href="/revetements" className="btn-secondary inline-flex items-center gap-2">
              Explorer tout le catalogue
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
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
      <PricingSection />
      <CatalogueSection />
      <SimulationSection />
      <FAQSection />
    </>
  );
}
