"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BreadcrumbSchema } from "@/components/JsonLd";

const projectTypes = [
  "Cuisine",
  "Salle de bain",
  "Meubles",
  "Comptoir / accueil pro",
  "Bureau / espace de travail",
  "Autre",
];

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
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError(false);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload: Record<string, string> = {};
    data.forEach((value, key) => {
      if (typeof value === "string") payload[key] = value;
    });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.nom || "",
          phone: payload.telephone || "",
          email: payload.email || "",
          type_projet: payload.type_projet || "",
          surface: payload.surface || "",
          style: payload.style || "",
          message: payload.message || "",
          reference: payload.reference || "",
          website: payload.website || "",
          source: "coverswap.fr/contact",
        }),
      });
      if (!res.ok) {
        setError(true);
      } else {
        setSent(true);
        form.reset();
      }
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

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
          <div className="glass-card p-8 md:p-10">
            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">Message envoyé !</h2>
                <p className="text-gris-400 mb-6">Nous vous répondons sous 48 h.</p>
                <button onClick={() => setSent(false)} className="btn-secondary text-sm px-6 py-3">
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom complet *</label>
                    <input
                      name="nom"
                      required
                      placeholder="Jean Dupont"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 transition-colors"
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="jean@exemple.fr"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Téléphone */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone</label>
                    <input
                      name="telephone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 transition-colors"
                    />
                  </div>
                  {/* Type de projet */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Type de projet *</label>
                    <select
                      name="type_projet"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rouge/50 transition-colors appearance-none"
                    >
                      <option value="" className="bg-noir">Sélectionnez...</option>
                      {projectTypes.map((t) => (
                        <option key={t} value={t} className="bg-noir">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Surface */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Surface approximative</label>
                    <input
                      name="surface"
                      placeholder="ex : 8 m2"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 transition-colors"
                    />
                  </div>
                  {/* Style */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Style souhaité</label>
                    <input
                      name="style"
                      placeholder="ex : Marbre blanc, Bois chêne..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Reference from catalog */}
                {refParam && (
                  <div className="bg-rouge/10 border border-rouge/30 rounded-lg px-4 py-3">
                    <p className="text-sm text-gris-300">
                      Reference selectionnee : <span className="font-bold text-white">{refParam}</span>
                    </p>
                    <input type="hidden" name="reference" value={refParam} />
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium mb-2">Votre message *</label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder="Décrivez votre projet, vos contraintes, vos envies..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 transition-colors resize-none"
                  />
                </div>

                {/* Photo upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Photos de la surface (optionnel)</label>
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-rouge/30 transition-colors bg-white/[0.02]">
                    <svg className="w-8 h-8 text-gris-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gris-500">Cliquez ou glissez vos photos</span>
                    <input name="photos" type="file" accept="image/*" multiple className="hidden" />
                  </label>
                </div>

                {/* Honeypot - hidden from humans */}
                <div className="absolute overflow-hidden" style={{ width: 0, height: 0, opacity: 0, position: "absolute", top: "-9999px", left: "-9999px" }} aria-hidden="true" tabIndex={-1}>
                  <label htmlFor="website">Website</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    autoComplete="off"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                    Une erreur est survenue. Veuillez réessayer.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "Envoi en cours..." : "Envoyer ma demande"}
                </button>

                <p className="text-xs text-gris-500 text-center mt-3">
                  Vous avez repere une reference dans notre catalogue ?{" "}
                  <Link href="/revetements" className="text-rouge hover:text-white transition-colors underline">
                    Parcourir le catalogue Cover Styl&apos;
                  </Link>
                </p>
              </form>
            )}
          </div>

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
                  <p className="font-medium">coverswap.contact@gmail.com</p>
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
                  <span className="font-medium">9h00 - 18h00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gris-400">Samedi</span>
                  <span className="font-medium">10h00 - 16h00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gris-400">Dimanche</span>
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
              <svg viewBox="0 0 200 220" className="w-40 mx-auto text-rouge/30" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                <path
                  d="M100 10 L130 20 L155 15 L170 35 L185 50 L190 75 L185 100 L175 120 L160 140 L155 160 L140 175 L120 195 L100 210 L80 200 L60 190 L45 170 L30 150 L20 130 L15 105 L20 80 L25 60 L35 40 L55 25 L75 15 Z"
                  fill="currentColor"
                  fillOpacity="0.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Dots for major cities */}
                <circle cx="105" cy="55" r="3" className="fill-rouge" /> {/* Paris */}
                <circle cx="75" cy="145" r="2.5" className="fill-rouge/60" /> {/* Bordeaux */}
                <circle cx="155" cy="95" r="2.5" className="fill-rouge/60" /> {/* Lyon */}
                <circle cx="125" cy="175" r="2.5" className="fill-rouge/60" /> {/* Marseille */}
                <circle cx="55" cy="80" r="2.5" className="fill-rouge/60" /> {/* Rennes */}
                <circle cx="65" cy="170" r="2.5" className="fill-rouge/60" /> {/* Toulouse */}
                {/* Paris label */}
                <text x="115" y="53" className="fill-white text-[8px] font-bold">Paris</text>
              </svg>
            </div>

            {/* Quick CTA */}
            <div className="glass-card p-6 text-center border-rouge/20">
              <p className="text-sm text-gris-400 mb-4">
                Besoin d&apos;un aperçu immédiat ?
              </p>
              <Link href="/simulation" className="btn-secondary text-sm px-6 py-3 w-full">
                Simulation IA gratuite
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
