"use client";

import { useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";

const projectTypes = [
  "Cuisine",
  "Salle de bain",
  "Meubles",
  "Comptoir / accueil pro",
  "Bureau / espace de travail",
  "Autre",
];

/**
 * Formulaire de demande de devis — partagé entre /contact et /devis.
 * Poste vers /api/contact. `source` permet de tracer l'origine du lead.
 */
export default function DevisForm({
  source,
  reference,
  submitLabel = "Envoyer ma demande",
}: {
  source: string;
  reference?: string;
  submitLabel?: string;
}) {
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
          reference: payload.reference || reference || "",
          website: payload.website || "",
          source,
        }),
      });
      if (!res.ok) {
        setError(true);
      } else {
        setSent(true);
        track("devis_form_submitted", {
          type_projet: payload.type_projet || "non_renseigne",
          has_reference: payload.reference || reference ? true : false,
          source,
        });
        form.reset();
      }
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="glass-card p-8 md:p-10">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Demande envoyée !</h2>
          <p className="text-gris-400 mb-6">
            Nous vous recontactons avec votre devis sous 24 à 48 h.
          </p>
          <button onClick={() => setSent(false)} className="btn-secondary text-sm px-6 py-3">
            Envoyer une autre demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 md:p-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Nom complet *</label>
            <input
              name="nom"
              required
              placeholder="Jean Dupont"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 transition-colors"
            />
          </div>
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
          <div>
            <label className="block text-sm font-medium mb-2">Téléphone *</label>
            <input
              name="telephone"
              type="tel"
              required
              placeholder="06 12 34 56 78"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 transition-colors"
            />
          </div>
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
          <div>
            <label className="block text-sm font-medium mb-2">Surface approximative</label>
            <input
              name="surface"
              placeholder="ex : 8 m2"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Style souhaité</label>
            <input
              name="style"
              placeholder="ex : Marbre blanc, Bois chêne..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 transition-colors"
            />
          </div>
        </div>

        {reference && (
          <div className="bg-rouge/10 border border-rouge/30 rounded-lg px-4 py-3">
            <p className="text-sm text-gris-300">
              Référence sélectionnée : <span className="font-bold text-white">{reference}</span>
            </p>
            <input type="hidden" name="reference" value={reference} />
          </div>
        )}

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

        {/* Honeypot - hidden from humans */}
        <div className="absolute overflow-hidden" style={{ width: 0, height: 0, opacity: 0, position: "absolute", top: "-9999px", left: "-9999px" }} aria-hidden="true" tabIndex={-1}>
          <label htmlFor="website">Website</label>
          <input type="text" id="website" name="website" autoComplete="off" />
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
          {sending ? "Envoi en cours..." : submitLabel}
        </button>

        <p className="text-xs text-gris-500 text-center mt-3">
          Vous avez repéré une référence dans notre catalogue ?{" "}
          <Link href="/revetements" className="text-rouge hover:text-white transition-colors underline">
            Parcourir le catalogue Cover Styl&apos;
          </Link>
        </p>
      </form>
    </div>
  );
}
