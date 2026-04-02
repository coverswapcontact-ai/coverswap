"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const WEBHOOK_URL = "https://coverswap.app.n8n.cloud/webhook/tally-form";

const styles = [
  { id: "marbre-blanc", label: "Marbre blanc", color: "from-gray-100 to-gray-300" },
  { id: "marbre-noir", label: "Marbre noir", color: "from-gray-700 to-gray-900" },
  { id: "bois-chene", label: "Bois chêne", color: "from-amber-600 to-amber-800" },
  { id: "bois-noyer", label: "Bois noyer", color: "from-amber-900 to-stone-900" },
  { id: "beton-cire", label: "Béton ciré", color: "from-gray-400 to-gray-600" },
  { id: "metal-brosse", label: "Métal brossé", color: "from-slate-300 to-slate-500" },
  { id: "noir-mat", label: "Noir mat", color: "from-gray-800 to-black" },
  { id: "terracotta", label: "Terracotta", color: "from-orange-600 to-orange-800" },
];

export default function SimulationPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      const data = new FormData();
      if (selectedFile) data.append("photo", selectedFile);
      data.append("style", selectedStyle);
      data.append("name", formData.name);
      data.append("phone", formData.phone);
      data.append("email", formData.email);
      data.append("message", formData.message);
      data.append("source", "coverswap.fr/simulation");
      data.append("timestamp", new Date().toISOString());

      await fetch(WEBHOOK_URL, { method: "POST", body: data });
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center max-w-lg mx-auto px-4">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-bold mb-4">Demande envoyée !</h1>
          <p className="text-gris-400 text-lg mb-8">
            Notre IA analyse votre photo. Vous recevrez votre simulation par SMS dans les prochaines minutes.
          </p>
          <a href="/" className="btn-secondary">Retour à l&apos;accueil</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-rouge font-bold text-sm uppercase tracking-widest">Intelligence artificielle</span>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-3 mb-4">
            Simulation IA <span className="text-rouge">gratuite</span>
          </h1>
          <p className="text-gris-400 max-w-2xl mx-auto text-lg">
            Envoyez une photo de votre espace, choisissez un style, et recevez un rendu réaliste en moins de 60 secondes. 100% gratuit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left: Upload */}
            <div>
              <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-rouge flex items-center justify-center text-sm font-bold">1</span>
                Votre photo
              </h2>

              <div
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-rouge/50 ${
                  preview ? "border-rouge/30" : "border-white/20"
                } min-h-[300px] flex items-center justify-center`}
              >
                {preview ? (
                  <div className="relative w-full">
                    <img src={preview} alt="Aperçu" className="max-h-[280px] mx-auto rounded-lg object-contain" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreview(null);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-noir/80 flex items-center justify-center text-white hover:bg-rouge transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gris-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gris-400 mb-2">Glissez votre photo ici ou cliquez</p>
                    <p className="text-gris-600 text-sm">JPG, PNG — Max 10 Mo</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Style selection */}
              <h2 className="font-display text-xl font-bold mt-10 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-rouge flex items-center justify-center text-sm font-bold">2</span>
                Choisissez un style
              </h2>
              <Link
                href="/revetements"
                className="inline-flex items-center gap-2 text-sm text-rouge hover:text-white transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Parcourez notre catalogue pour choisir votre reference
              </Link>

              <div className="grid grid-cols-4 gap-3">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-xl border transition-all text-center hover:scale-105 ${
                      selectedStyle === style.id
                        ? "border-rouge bg-rouge/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${style.color}`} />
                    <span className="text-xs text-gris-300">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Contact info */}
            <div>
              <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-rouge flex items-center justify-center text-sm font-bold">3</span>
                Vos coordonnées
              </h2>

              <div className="glass-card p-8 space-y-5">
                <div>
                  <label className="block text-sm text-gris-400 mb-1.5">Nom complet *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gris-600 focus:border-rouge focus:outline-none focus:ring-1 focus:ring-rouge"
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gris-400 mb-1.5">Téléphone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gris-600 focus:border-rouge focus:outline-none focus:ring-1 focus:ring-rouge"
                    placeholder="06 12 34 56 78"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gris-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gris-600 focus:border-rouge focus:outline-none focus:ring-1 focus:ring-rouge"
                    placeholder="jean@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gris-400 mb-1.5">Description du projet</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gris-600 focus:border-rouge focus:outline-none focus:ring-1 focus:ring-rouge resize-none"
                    placeholder="Décrivez votre projet : espace concerné, dimensions, rendu souhaité..."
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                    Une erreur est survenue. Veuillez réessayer.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!formData.name || !formData.phone || !selectedStyle || submitting}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Envoi en cours...
                    </span>
                  ) : (
                    "Recevoir ma simulation gratuite"
                  )}
                </button>

                <p className="text-xs text-gris-600 text-center">
                  Résultat envoyé par SMS sous 60 secondes. Sans engagement.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
