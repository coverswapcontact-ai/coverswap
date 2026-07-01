"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BreadcrumbSchema } from "@/components/JsonLd";
import DevisForm from "@/components/DevisForm";

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactPageInner />
    </Suspense>
  );
}

function ContactPageInner() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");

  return (
    <div className="min-h-screen pt-28 pb-20">
      <BreadcrumbSchema items={[{ name: "Accueil", url: "https://coverswap.fr" }, { name: "Contact", url: "https://coverswap.fr/contact" }]} />
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-rouge font-bold text-sm uppercase tracking-widest">
            Contact
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-3 mb-4">
            Demandez votre <span className="text-rouge">devis gratuit</span>
          </h1>
          <p className="text-gris-400 max-w-2xl mx-auto text-lg">
            Décrivez votre projet et recevez une estimation personnalisée sous 48 h.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-start">
          {/* Form */}
          <DevisForm source="coverswap.fr/contact" reference={refParam || undefined} />

          {/* Sidebar info */}
          <div className="space-y-8">
            {/* Contact details */}
            <div className="glass-card p-6 space-y-5">
              <h3 className="font-display font-bold text-lg mb-1">Nos coordonnées</h3>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-rouge/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gris-400">Email</p>
                  <p className="font-medium">contact@coverswap.fr</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-rouge/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gris-400">Téléphone</p>
                  <p className="font-medium">06 70 35 28 69</p>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-lg mb-4">Horaires</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gris-400">Lundi - Vendredi</span>
                  <span className="font-medium">8h00 - 17h00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gris-400">Samedi - Dimanche</span>
                  <span className="text-gris-500">Fermé</span>
                </div>
              </div>
            </div>

            {/* France map */}
            <div className="glass-card p-6 text-center">
              <h3 className="font-display font-bold text-lg mb-2">Intervention France entière</h3>
              <p className="text-sm text-gris-400 mb-5">
                Nous nous déplaçons partout en France métropolitaine.
              </p>
              <svg viewBox="80 30 500 520" className="w-52 mx-auto" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M233 68l7-5 13-1 9 3 15-2 8 5 6-3 14 1 9 6 7 0 11-5 17 2 10 7 4 0 12 8 5 10 8 3 11 10 6 1 7 6 0 9 6 5-1 8 7 10 13 8 4 8 12 5 3 9 9 4 6 10 10 7 4 12 8 6-1 11 6 8 0 13-3 10 4 9-2 14 5 7-1 12-5 8 2 11-3 14 1 9-6 11-1 15 3 12-4 9 1 8-8 12 3 10-3 13-9 9 1 10-6 7-12 5-5 10-10 3-7 9 2 7-4 11-10 6-14 1-8 8-12 2-7-3-11 5-6-1-9-6-3-9-13-3-6 4-9-2-5-7 1-10-7-5-3-11 2-8-8-6-6-12-9-4 0-9-6-7-12-3-7-8 1-11-8-5-5-10-10-4-4-9 3-13-4-8-10-2-7-9 1-8-5-7 4-12-4-9 6-10-1-13 5-8 3-11-2-9 7-7 1-14 8-6 10-9 5-3 7-8 5 1 8-5z"
                  className="fill-rouge/[0.07] stroke-rouge/25"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="370" cy="420" r="10" className="fill-rouge/20 animate-pulse" />
                <circle cx="370" cy="420" r="4" className="fill-rouge" />
                <circle cx="310" cy="168" r="3.5" className="fill-white/60" />
                <circle cx="375" cy="320" r="3" className="fill-white/40" />
                <circle cx="218" cy="370" r="3" className="fill-white/40" />
                <circle cx="270" cy="430" r="3" className="fill-white/40" />
                <circle cx="320" cy="88" r="3" className="fill-white/40" />
                <circle cx="175" cy="200" r="3" className="fill-white/40" />
                <circle cx="440" cy="170" r="3" className="fill-white/40" />
                <circle cx="385" cy="445" r="3" className="fill-white/40" />
                <text x="380" y="423" className="fill-rouge text-[12px] font-bold" dominantBaseline="middle">Pérols</text>
                <text x="322" y="168" className="fill-white/70 text-[10px]" dominantBaseline="middle">Paris</text>
                <text x="388" y="320" className="fill-white/50 text-[9px]" dominantBaseline="middle">Lyon</text>
                <text x="398" y="445" className="fill-white/50 text-[9px]" dominantBaseline="middle">Marseille</text>
              </svg>
            </div>

            {/* Quick CTA */}
            <div className="glass-card p-6 text-center border-rouge/20">
              <p className="text-sm text-gris-400 mb-4">
                Besoin d&apos;un aperçu immédiat de votre projet ?
              </p>
              <Link href="/simulation" className="btn-secondary text-sm px-6 py-3 w-full">
                Simuler mon projet (IA)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
