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

const MAX_PHOTOS = 4;

/**
 * Réduit une image côté client (max ~1300px, JPEG q0.78) et renvoie une
 * data URL base64 légère (~250-350 KB), pour transmettre les photos du projet
 * au CRM sans alourdir la requête.
 */
function fileToDownscaledBase64(file: File, max = 1300, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new window.Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        let { width, height } = img;
        if (width > max || height > max) {
          const r = Math.min(max / width, max / height);
          width = Math.round(width * r);
          height = Math.round(height * r);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Formulaire de demande de devis — partagé entre /contact et /devis.
 * Poste vers /api/contact. `source` permet de tracer l'origine du lead.
 * Les photos jointes sont downscalées puis transmises au CRM.
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
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);

  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPhotoBusy(true);
    try {
      const slots = MAX_PHOTOS - photos.length;
      const toProcess = files.slice(0, Math.max(0, slots));
      const encoded: string[] = [];
      for (const f of toProcess) {
        if (!f.type.startsWith("image/")) continue;
        if (f.size > 15 * 1024 * 1024) continue; // ignore >15 Mo
        try {
          encoded.push(await fileToDownscaledBase64(f));
        } catch {
          /* skip image illisible */
        }
      }
      if (encoded.length) setPhotos((prev) => [...prev, ...encoded].slice(0, MAX_PHOTOS));
    } finally {
      setPhotoBusy(false);
      e.target.value = ""; // permet de re-sélectionner le même fichier
    }
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

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
          style: payload.style || "",
          message: payload.message || "",
          reference: payload.reference || reference || "",
          website: payload.website || "",
          photos,
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
          photos_count: photos.length,
          source,
        });
        form.reset();
        setPhotos([]);
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

        {/* Style souhaité */}
        <div>
          <label className="block text-sm font-medium mb-2">Style souhaité</label>
          <input
            name="style"
            placeholder="ex : Marbre blanc, Bois chêne, Noir mat..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50 transition-colors"
          />
        </div>

        {reference && (
          <div className="bg-rouge/10 border border-rouge/30 rounded-lg px-4 py-3">
            <p className="text-sm text-gris-300">
              Référence sélectionnée : <span className="font-bold text-white">{reference}</span>
            </p>
            <input type="hidden" name="reference" value={reference} />
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

        {/* Photos du projet */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Photos du projet <span className="text-gris-500 font-normal">(recommandé — accélère votre devis)</span>
          </label>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
              {photos.map((src, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo projet ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label="Retirer la photo"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rouge"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < MAX_PHOTOS && (
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-rouge/30 transition-colors bg-white/[0.02]">
              <svg className="w-8 h-8 text-gris-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gris-500">
                {photoBusy ? "Traitement..." : "Cliquez ou glissez vos photos (jusqu'à 4)"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotos}
                disabled={photoBusy}
                className="hidden"
              />
            </label>
          )}
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
          disabled={sending || photoBusy}
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
