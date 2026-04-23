"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ScrollReveal from "@/components/ScrollReveal";
import { FAQSchema } from "@/components/JsonLd";
import { track } from "@/lib/analytics";
import { PROJECT_TYPES } from "@/app/simulation/projects";

/** Clés sessionStorage pour transférer l'état du home → /simulation */
const PENDING_PHOTO_KEY = "coverswap_pending_photo";
const PENDING_PROJECT_KEY = "coverswap_pending_project";

/* ══════════════════════════════════════════════════════════════════
   SIMULATION — accès direct au simulateur depuis la home
   (étape 1 : choix projet → étape 2 : upload photo → redirect vers /simulation)
══════════════════════════════════════════════════════════════════ */
export function SimulationSection() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const currentProject = projectId
    ? PROJECT_TYPES.find((p) => p.id === projectId) ?? null
    : null;

  const handleFile = useCallback((file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Format invalide. Utilisez une photo (JPG, PNG).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("La photo ne doit pas dépasser 10 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      track("simulation_photo_uploaded", { source: "home", size_kb: Math.round(file.size / 1024) });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleContinue = useCallback(() => {
    if (!preview || !projectId) return;
    try {
      sessionStorage.setItem(PENDING_PHOTO_KEY, preview);
      sessionStorage.setItem(PENDING_PROJECT_KEY, projectId);
    } catch {
      /* sessionStorage indisponible (mode privé) → on redirige quand même */
    }
    track("cta_clicked", { cta: "home_simulation_continue" });
    router.push("/simulation");
  }, [preview, projectId, router]);

  const handleSelectProject = (id: string) => {
    setProjectId(id);
    track("cta_clicked", { cta: "home_project_selected", project: id });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <section id="simulation" className="relative section-padding bg-noir overflow-hidden">
      {/* Halos rouges symétriques */}
      <div
        className="absolute top-0 left-0 w-[700px] h-[700px] -translate-x-1/3 -translate-y-1/4 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(204,0,0,0.14) 0%, transparent 65%)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-[700px] h-[700px] translate-x-1/3 translate-y-1/4 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(204,0,0,0.10) 0%, transparent 65%)" }}
      />
      {/* Grille subtile */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container-custom relative z-10">
        {/* ── HEADER ── */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-14">
          <ScrollReveal direction="fade">
            <div className="inline-flex items-center gap-2 bg-rouge/10 border border-rouge/30 rounded-full px-5 py-2 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-rouge animate-pulse shadow-[0_0_8px_rgba(204,0,0,0.8)]" />
              <span className="text-rouge font-bold text-xs uppercase tracking-[0.2em]">
                Simulation IA · Exclusivité Coverswap
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.02] mb-4 md:mb-6 tracking-tight">
              Votre intérieur.
              <br />
              <span className="relative inline-block">
                <span className="text-rouge">Transformé en 60 s.</span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 10C50 2 100 2 150 6C200 10 250 4 298 8"
                    stroke="#CC0000"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-gris-300 text-lg md:text-xl leading-relaxed">
              Uploadez une photo (cuisine, salle de bain, meubles, murs…). Choisissez parmi <strong className="text-white">près de 500 textures</strong>.
              Notre IA génère un rendu photoréaliste en moins d&apos;une minute.
              <br className="hidden sm:block" />
              <span className="text-white font-medium">Sans email. Sans téléphone. Gratuit.</span>
            </p>
          </ScrollReveal>
        </div>

        {/* ── WIDGET — Projet → Photo → redirect /simulation ── */}
        <ScrollReveal direction="scale" delay={0.15}>
          <div className="relative max-w-3xl mx-auto">
            {/* Glow rouge diffus */}
            <div className="absolute -inset-6 bg-rouge/25 rounded-[2rem] blur-3xl opacity-60 pointer-events-none" />

            {!projectId ? (
              /* ── Étape 1 : Sélection du type de projet ── */
              <div className="relative rounded-3xl border border-rouge/30 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-10">
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center gap-2 bg-rouge/15 border border-rouge/30 rounded-full px-3 py-1 mb-3">
                    <span className="text-rouge font-bold text-[10px] uppercase tracking-widest">
                      Étape 1 / 3 · Projet
                    </span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white">
                    Quel est votre projet&nbsp;?
                  </h3>
                  <p className="text-gris-400 text-sm mt-2">
                    Chaque type de pièce a son générateur IA dédié.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {PROJECT_TYPES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProject(p.id)}
                      className="group text-left p-3 sm:p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-rouge hover:bg-rouge/5 hover:scale-[1.02] transition-all duration-200"
                    >
                      <div className="text-2xl sm:text-3xl mb-1.5">{p.icon}</div>
                      <div className="font-bold text-white text-sm sm:text-base leading-tight">{p.label}</div>
                      <div className="text-[11px] sm:text-xs text-gris-400 mt-0.5 leading-snug line-clamp-2">{p.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : !preview ? (
              /* ── Étape 2 : Dropzone photo ── */
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`relative block cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 backdrop-blur-sm p-10 sm:p-16 text-center ${
                  dragOver
                    ? "border-rouge bg-rouge/10 scale-[1.01]"
                    : "border-rouge/40 bg-white/[0.03] hover:border-rouge hover:bg-white/[0.06] hover:scale-[1.005]"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                  className="sr-only"
                />

                {/* Project pill + back */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 bg-rouge/15 border border-rouge/30 rounded-full px-3 py-1 text-rouge text-[11px] font-bold uppercase tracking-widest">
                    <span>{currentProject?.icon}</span>
                    {currentProject?.label}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setProjectId(null);
                    }}
                    className="text-gris-400 hover:text-white text-[11px] underline underline-offset-2"
                  >
                    changer
                  </button>
                </div>

                {/* Step badge */}
                <div className="inline-flex items-center gap-2 bg-rouge/15 border border-rouge/30 rounded-full px-3 py-1 mb-4 md:mb-6">
                  <span className="text-rouge font-bold text-[10px] uppercase tracking-widest">
                    Étape 2 / 3 · Photo
                  </span>
                </div>

                {/* Big upload icon */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-2xl bg-rouge/15 border border-rouge/30 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 sm:w-12 sm:h-12 text-rouge"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>

                <h3 className="font-display text-xl sm:text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-white">
                  {currentProject?.uploadHint ?? "Glissez votre photo ici"}
                </h3>
                <p className="text-gris-300 mb-2">
                  ou{" "}
                  <span className="text-rouge font-bold underline underline-offset-4 decoration-2">
                    parcourez vos fichiers
                  </span>
                </p>
                <p className="text-xs text-gris-500">
                  JPG, PNG · max 10 Mo · vous restez 100 % anonyme
                </p>
              </label>
            ) : (
              /* ── Étape 3 : Aperçu photo + bouton continuer ── */
              <div className="space-y-5">
                {/* Récap projet + step */}
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-rouge/15 border border-rouge/30 rounded-full px-3 py-1 text-rouge text-[11px] font-bold uppercase tracking-widest">
                    <span>{currentProject?.icon}</span>
                    {currentProject?.label}
                  </span>
                  <span className="text-gris-500 text-[11px] uppercase tracking-widest">
                    Étape 3 / 3 · Textures
                  </span>
                </div>

                <div className="relative rounded-3xl overflow-hidden border-2 border-rouge/40 shadow-[0_30px_80px_-15px_rgba(204,0,0,0.4)] bg-noir">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Votre photo"
                    className="w-full h-auto max-h-[500px] object-contain mx-auto"
                  />

                  {/* Badge top-left */}
                  <div className="absolute top-4 left-4 bg-noir/85 backdrop-blur-md border border-green-400/40 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">
                      Photo prête
                    </span>
                  </div>

                  {/* Bouton retirer */}
                  <button
                    onClick={() => {
                      setPreview(null);
                      setError("");
                    }}
                    type="button"
                    className="absolute top-4 right-4 bg-noir/85 hover:bg-rouge text-white rounded-full p-2 transition-all border border-white/20 backdrop-blur-md"
                    aria-label="Retirer la photo"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setPreview(null);
                      setError("");
                    }}
                    type="button"
                    className="sm:flex-1 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium px-6 py-4 rounded-full border border-white/10 hover:border-white/20 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Changer
                  </button>
                  <button
                    onClick={handleContinue}
                    type="button"
                    className="sm:flex-[2] group inline-flex items-center justify-center gap-3 bg-rouge text-white font-bold text-base sm:text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-[0_0_40px_rgba(204,0,0,0.45)] hover:shadow-[0_0_60px_rgba(204,0,0,0.75)] hover:scale-[1.02] hover:bg-[#e60000]"
                  >
                    Choisir mes textures
                    <svg
                      className="w-5 h-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ── PROCESS 3 ÉTAPES ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto mt-10 md:mt-16 mb-8 md:mb-14">
          {[
            {
              num: "01",
              title: "Photo",
              desc: "Prenez ou uploadez une photo de votre pièce",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                />
              ),
            },
            {
              num: "02",
              title: "Texture",
              desc: "Choisissez parmi près de 500 revêtements Cover Styl'",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
                />
              ),
            },
            {
              num: "03",
              title: "Rendu",
              desc: "Recevez un rendu photoréaliste en moins de 60 s",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              ),
            },
          ].map((step, i) => (
            <ScrollReveal key={step.num} direction="up" delay={0.1 + i * 0.08}>
              <div className="relative glass-card p-6 h-full group hover:border-rouge/40 transition-all">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-rouge/15 border border-rouge/30 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-rouge"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      {step.icon}
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-rouge font-display text-xl font-bold">{step.num}</span>
                      <span className="font-bold text-lg text-white">{step.title}</span>
                    </div>
                    <p className="text-gris-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* ── REASSURANCE + FALLBACK HUMAIN ── */}
        <ScrollReveal direction="up" delay={0.25}>
          <div className="text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-gris-400">
              {["Sans email", "Sans téléphone", "Sans inscription", "100 % gratuit"].map((label) => (
                <div key={label} className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {label}
                </div>
              ))}
            </div>

            <p className="text-xs text-gris-600 mt-5">
              Préférez parler à un humain&nbsp;?{" "}
              <Link href="/contact" className="text-rouge hover:underline font-medium">
                Demandez un devis personnalisé
              </Link>
            </p>
          </div>
        </ScrollReveal>
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
        <div className="text-center mb-8 md:mb-16">
          <ScrollReveal direction="fade">
            <span className="text-rouge font-bold text-sm uppercase tracking-widest">FAQ</span>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="font-display text-3xl md:text-5xl font-bold mt-3 mb-4">Questions fréquentes</h2>
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
