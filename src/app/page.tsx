import type { Metadata } from "next";
import Link from "next/link";
import AnimatedCounter from "@/components/AnimatedCounter";
import ScrollReveal from "@/components/ScrollReveal";
import TextureBackground from "@/components/TextureBackground";
import { GallerySection, SimulationSection, FAQSection } from "@/components/HomeClient";

/* ──────────────────────────────────────────────────────────────────
   METADATA — SEO
────────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "CoverSwap | Rénovation intérieure par revêtements adhésifs texturés",
  description:
    "Transformez votre intérieur en 1 journée avec nos revêtements adhésifs haut de gamme. Simulation IA gratuite en 60 secondes. Cuisine, salle de bain, meubles — 10x moins cher qu'une rénovation classique.",
  keywords:
    "covering adhésif, rénovation intérieure, revêtement adhésif, covering cuisine, covering salle de bain, covering meubles, covering professionnel, simulation IA, CoverSwap",
  openGraph: {
    title: "CoverSwap | Rénovation intérieure premium par covering adhésif",
    description:
      "Transformez votre intérieur en 1 journée. Simulation IA gratuite en 60 secondes. Effet marbre, bois, béton, métal — 10x moins cher qu'une rénovation classique.",
    url: "https://coverswap.fr",
    siteName: "CoverSwap",
    locale: "fr_FR",
    type: "website",
  },
  alternates: {
    canonical: "https://coverswap.fr",
  },
};

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
   SECTION 4b — CATALOGUE CTA
   Fond noir — bannière visuelle vers /revetements
══════════════════════════════════════════════════════════════════ */
function CatalogueSection() {
  const families = [
    { name: "Bois", count: "267", color: "from-amber-800 to-amber-600" },
    { name: "Pierre & marbre", count: "58", color: "from-gray-400 to-gray-200" },
    { name: "Béton & ciment", count: "24", color: "from-gray-600 to-gray-400" },
    { name: "Couleurs unies", count: "89", color: "from-rouge to-red-400" },
    { name: "Métal", count: "32", color: "from-zinc-500 to-zinc-300" },
    { name: "Cuir & textile", count: "27", color: "from-amber-900 to-amber-700" },
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
              +490 r&eacute;f&eacute;rences <span className="text-rouge">Cover Styl&rsquo;</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-gris-300 max-w-2xl mx-auto">
              Explorez notre catalogue complet de rev&ecirc;tements adh&eacute;sifs : bois, marbre, b&eacute;ton, m&eacute;tal, couleurs unies et bien plus. Chaque finition est disponible &agrave; la commande.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="up" delay={0.15}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {families.map((f) => (
              <div key={f.name} className="glass-card p-5 text-center hover:border-rouge/30 transition-all duration-300">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${f.color} opacity-80`} />
                <p className="font-display font-bold text-sm mb-0.5">{f.name}</p>
                <p className="text-rouge text-xs font-semibold">{f.count} refs</p>
              </div>
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
   PAGE ROOT
══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <KeyFigures />
      <HowItWorks />
      <GallerySection />
      <CatalogueSection />
      <SimulationSection />
      <TestimonialsSection />
      <FAQSection />
    </>
  );
}
