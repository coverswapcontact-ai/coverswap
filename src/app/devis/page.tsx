import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import DevisForm from "@/components/DevisForm";
import { BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: { absolute: "Devis Covering en Ligne Gratuit — Réponse sous 24h | CoverSwap" },
  description:
    "Demandez votre devis covering en ligne gratuit et sans engagement. Cuisine, salle de bain, meubles, pro à Montpellier, Pérols et partout en France. Réponse personnalisée sous 24 à 48 h. À partir de 80 €/m² posé.",
  keywords:
    "devis covering en ligne, devis covering gratuit, devis rénovation cuisine, devis covering Montpellier, estimation covering adhésif, prix covering Hérault",
  alternates: { canonical: "https://coverswap.fr/devis" },
  openGraph: {
    title: "Devis Covering en Ligne Gratuit — Réponse sous 24h | CoverSwap",
    description:
      "Devis covering gratuit et sans engagement. Réponse personnalisée sous 24 à 48 h. Montpellier, Pérols et France entière.",
    url: "https://coverswap.fr/devis",
    type: "website",
    siteName: "CoverSwap",
    locale: "fr_FR",
    images: [{ url: "https://coverswap.fr/og-image.jpg", width: 1200, height: 630, alt: "Devis covering en ligne gratuit — CoverSwap" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Devis Covering en Ligne Gratuit — Réponse sous 24h",
    description: "Devis covering gratuit et sans engagement, réponse sous 24-48h.",
    images: ["https://coverswap.fr/og-image.jpg"],
  },
};

const avantages = [
  { icon: "⚡", title: "Réponse sous 24-48 h", desc: "Devis détaillé et personnalisé par email." },
  { icon: "🎁", title: "100 % gratuit", desc: "Sans engagement, sans frais cachés." },
  { icon: "📐", title: "Prix ferme", desc: "Fourniture + pose incluses, dès 80 €/m² posé." },
  { icon: "🇫🇷", title: "France entière", desc: "Intervention partout en France métropolitaine." },
];

const etapes = [
  { num: "1", title: "Décrivez votre projet", desc: "Type de surface, dimensions approximatives, style souhaité." },
  { num: "2", title: "On étudie votre demande", desc: "Estimation personnalisée selon la gamme Cover Styl' choisie." },
  { num: "3", title: "Vous recevez votre devis", desc: "Détaillé, gratuit, sous 24 à 48 h. Vous décidez ensuite." },
];

export default function DevisPage() {
  return (
    <main className="bg-noir min-h-screen">
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: "https://coverswap.fr" },
          { name: "Devis en ligne", url: "https://coverswap.fr/devis" },
        ]}
      />

      {/* HERO */}
      <section className="relative pt-32 pb-10 md:pt-40 md:pb-14 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(204,0,0,0.10) 0%, transparent 70%)" }} />
        <div className="container-custom relative z-10 text-center max-w-3xl mx-auto">
          <ScrollReveal direction="fade">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-rouge/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-gris-300">Devis gratuit · réponse sous 24-48 h</span>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-5 tracking-tight">
              Votre <span className="text-rouge">devis covering</span> en ligne, gratuit
            </h1>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-gris-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Cuisine, salle de bain, meubles ou local pro : décrivez votre projet et recevez une
              estimation personnalisée sous 24 à 48 h. Sans engagement, à partir de 80 €/m² posé.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* AVANTAGES */}
      <section className="pb-6">
        <div className="container-custom max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {avantages.map((a, i) => (
              <ScrollReveal key={a.title} direction="up" delay={i * 0.08}>
                <div className="glass-card p-5 text-center h-full">
                  <span className="text-2xl mb-2 block">{a.icon}</span>
                  <h2 className="font-display font-bold text-sm mb-1">{a.title}</h2>
                  <p className="text-gris-400 text-xs leading-relaxed">{a.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FORM + SIDEBAR */}
      <section className="section-padding pt-8">
        <div className="container-custom">
          <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
            {/* Form */}
            <div>
              <ScrollReveal direction="up">
                <h2 className="font-display text-2xl font-bold mb-6">Décrivez votre projet</h2>
              </ScrollReveal>
              <DevisForm source="coverswap.fr/devis" submitLabel="Recevoir mon devis gratuit" />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Étapes */}
              <div className="glass-card p-6">
                <h3 className="font-display font-bold text-lg mb-5">Comment ça marche</h3>
                <div className="space-y-5">
                  {etapes.map((e) => (
                    <div key={e.num} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-rouge/15 border border-rouge/40 flex items-center justify-center shrink-0">
                        <span className="text-rouge font-display font-bold text-sm">{e.num}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{e.title}</p>
                        <p className="text-gris-400 text-xs leading-relaxed mt-0.5">{e.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact rapide */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-display font-bold text-lg">Ou contactez-nous direct</h3>
                <a href="tel:+33670352869" className="flex items-center gap-3 text-gris-300 hover:text-white transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-rouge/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gris-500">Téléphone</p>
                    <p className="font-medium text-sm">06 70 35 28 69</p>
                  </div>
                </a>
                <a href="https://wa.me/33670352869" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gris-300 hover:text-white transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  </div>
                  <div>
                    <p className="text-xs text-gris-500">WhatsApp</p>
                    <p className="font-medium text-sm">Réponse rapide</p>
                  </div>
                </a>
              </div>

              {/* Lien simulateur */}
              <div className="glass-card p-6 text-center border-rouge/20 bg-rouge/5">
                <p className="text-sm text-gris-300 mb-4">
                  Envie de <strong className="text-white">visualiser</strong> le rendu avant de vous décider ?
                </p>
                <Link href="/simulation" className="btn-secondary text-sm px-6 py-3 w-full">
                  Simuler mon projet en 60 s
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
