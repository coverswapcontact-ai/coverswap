"use client";

import { useState } from "react";

const projectTypes = [
  { id: "cuisine", label: "Cuisine", icon: "M3 3h18v18H3z" },
  { id: "sdb", label: "Salle de bain", icon: "M3 3h18v18H3z" },
  { id: "meubles", label: "Meubles", icon: "M3 3h18v18H3z" },
  { id: "pro", label: "Professionnel", icon: "M3 3h18v18H3z" },
  { id: "vitrages", label: "Vitrages", icon: "M3 3h18v18H3z" },
];

const styles = [
  { id: "marbre", label: "Marbre", color: "from-gray-300 to-gray-500" },
  { id: "bois", label: "Bois", color: "from-amber-700 to-amber-900" },
  { id: "beton", label: "Béton", color: "from-gray-500 to-gray-700" },
  { id: "couleur", label: "Couleur", color: "from-rose-500 to-violet-600" },
  { id: "metal", label: "Métal", color: "from-slate-400 to-slate-600" },
];

interface SimulationFormProps {
  variant?: "full" | "compact";
}

export default function SimulationForm({ variant = "full" }: SimulationFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    projectType: "",
    style: "",
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          website: honeypot,
          source: "coverswap.fr",
        }),
      });
      if (!res.ok) {
        setError(true);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-2xl font-bold mb-2">Demande envoyée !</h3>
        <p className="text-gris-400">
          Vous recevrez votre simulation IA par SMS dans les prochaines minutes.
        </p>
      </div>
    );
  }

  return (
    <div className={variant === "compact" ? "" : ""}>
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? "bg-rouge text-white" : "bg-white/10 text-gris-500"
              }`}
            >
              {step > s ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 3 && (
              <div className={`flex-1 h-0.5 ${step > s ? "bg-rouge" : "bg-white/10"} transition-colors`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Project Type */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h3 className="font-display text-xl font-bold mb-6">Quel espace souhaitez-vous transformer ?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {projectTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setFormData({ ...formData, projectType: type.id });
                  setStep(2);
                }}
                className={`p-4 rounded-xl border transition-all text-center hover:scale-105 ${
                  formData.projectType === type.id
                    ? "border-rouge bg-rouge/10 text-white"
                    : "border-white/10 bg-white/5 text-gris-300 hover:border-white/20"
                }`}
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-white/10 flex items-center justify-center">
                  {type.id === "cuisine" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h18v18H3zM9 3v18M3 9h18" /></svg>
                  )}
                  {type.id === "sdb" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                  )}
                  {type.id === "meubles" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  )}
                  {type.id === "pro" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  )}
                  {type.id === "vitrages" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  )}
                </div>
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Style */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h3 className="font-display text-xl font-bold mb-6">Quel style vous attire ?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => {
                  setFormData({ ...formData, style: style.id });
                  setStep(3);
                }}
                className="group p-4 rounded-xl border border-white/10 bg-white/5 hover:border-rouge/50 transition-all text-center hover:scale-105"
              >
                <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${style.color}`} />
                <span className="text-sm font-medium text-gris-300 group-hover:text-white transition-colors">
                  {style.label}
                </span>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="mt-4 text-sm text-gris-500 hover:text-white transition-colors">
            &larr; Retour
          </button>
        </div>
      )}

      {/* Step 3: Contact Info */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h3 className="font-display text-xl font-bold mb-6">Vos coordonnées</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gris-400 mb-1">Nom complet *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gris-600 focus:border-rouge focus:outline-none focus:ring-1 focus:ring-rouge transition-colors"
                placeholder="Jean Dupont"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gris-400 mb-1">Téléphone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gris-600 focus:border-rouge focus:outline-none focus:ring-1 focus:ring-rouge transition-colors"
                placeholder="06 12 34 56 78"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gris-400 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gris-600 focus:border-rouge focus:outline-none focus:ring-1 focus:ring-rouge transition-colors"
                placeholder="jean@email.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gris-400 mb-1">Message (optionnel)</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gris-600 focus:border-rouge focus:outline-none focus:ring-1 focus:ring-rouge transition-colors resize-none"
                placeholder="Décrivez votre projet..."
              />
            </div>
            {/* Honeypot - hidden from humans */}
            <div className="absolute overflow-hidden" style={{ width: 0, height: 0, opacity: 0, position: "absolute", top: "-9999px", left: "-9999px" }} aria-hidden="true" tabIndex={-1}>
              <label htmlFor="website">Website</label>
              <input
                type="text"
                id="website"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                Une erreur est survenue. Veuillez réessayer.
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.phone || submitting}
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
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Recevoir ma simulation gratuite
                </>
              )}
            </button>
            <p className="text-xs text-gris-600 text-center">
              En soumettant ce formulaire, vous acceptez d&apos;être contacté par CoverSwap. Sans engagement.
            </p>
          </div>
          <button onClick={() => setStep(2)} className="mt-4 text-sm text-gris-500 hover:text-white transition-colors">
            &larr; Retour
          </button>
        </div>
      )}
    </div>
  );
}
