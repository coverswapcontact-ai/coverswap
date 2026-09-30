"use client";

import { useState } from "react";
import Link from "next/link";
import { Bouton, FOCUS_FICHIER } from "@/components/simulation/Bouton";
import { CHAMP } from "@/app/simulateur/_components/Formulaires";
import { track } from "@/lib/analytics";
import { consentementPourEnvoi } from "@/lib/consentement";
import CaseConsentement from "./CaseConsentement";
import Turnstile, { reinitialiserTurnstile } from "./Turnstile";
import { obtenirParcoursId } from "@/lib/parcours";
import { acquisitionPourEnvoi } from "@/lib/utm";
import { envoyerEvenement } from "@/lib/evenements-site";

import { DELAI_REPONSE } from "@/lib/offre";
import { FAMILLES_REPLI, type FamillePrestation } from "@/lib/prestations";

const MAX_PHOTOS = 4;
/** Mission 16 : les champs clairs du simulateur (`CHAMP`), une étiquette au-dessus. */
const ETIQUETTE = "mb-1 block text-[14px] font-medium text-encre";
const CARTE = "rounded-[var(--rayon-md)] border border-trait bg-white p-5 sm:p-8";

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
  familles = FAMILLES_REPLI,
}: {
  source: string;
  reference?: string;
  submitLabel?: string;
  /** Les prestations de CoverSwap (fichier unique du CRM) ; un repli sinon. */
  familles?: Pick<FamillePrestation, "id" | "libelle" | "aide">[];
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [consentement, setConsentement] = useState(false);
  const [jetonCaptcha, setJetonCaptcha] = useState<string | null>(null);

  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const champ = e.target;
    await ajouterPhotos(Array.from(champ.files || []));
    champ.value = ""; // permet de re-sélectionner le même fichier
  }

  /** Les photos choisies ou déposées sur la zone (jusqu'à 4, réduites avant l'envoi). */
  async function ajouterPhotos(files: File[]) {
    if (files.length === 0 || photoBusy) return;
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
    }
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");

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
          ville: payload.ville || "",
          codePostal: payload.code_postal || "",
          type_projet: payload.type_projet || "",
          style: payload.style || "",
          message: payload.message || "",
          reference: payload.reference || reference || "",
          website: payload.website || "",
          photos,
          source,
          parcoursId: obtenirParcoursId(),
          turnstileToken: jetonCaptcha,
          ...acquisitionPourEnvoi(),
          formulaire: source,
          ...consentementPourEnvoi(consentement, source),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(`${d?.error || "Une erreur est survenue."} Vos réponses et vos photos sont conservées : vous pouvez réessayer.`);
        envoyerEvenement("FORMULAIRE_ECHEC", { formulaire: source, statut: res.status, raison: d?.reason });
      } else {
        envoyerEvenement(source.includes("devis") ? "DEVIS_DEMANDE" : "CONTACT_ENVOYE", { formulaire: source, photos: photos.length });
        setSent(true);
        track("devis_form_submitted", {
          type_projet: payload.type_projet || "non_renseigne",
          has_reference: payload.reference || reference ? true : false,
          photos_count: photos.length,
          source,
        });
        form.reset();
        setPhotos([]);
        setConsentement(false);
      }
    } catch {
      setError("Connexion interrompue. Vos réponses et vos photos sont conservées : réessayez.");
      envoyerEvenement("FORMULAIRE_ECHEC", { formulaire: source, raison: "reseau" });
    } finally {
      setSending(false);
      reinitialiserTurnstile();
      setJetonCaptcha(null);
    }
  }

  if (sent) {
    return (
      <div className={CARTE} role="status">
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ok-fond text-ok-texte">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="titre-2 mb-2 text-encre">Demande envoyée</h2>
          <p className="texte-2 mb-6">Nous vous recontactons avec votre devis {DELAI_REPONSE}.</p>
          <Bouton variante="secondaire" onClick={() => setSent(false)}>
            Envoyer une autre demande
          </Bouton>
        </div>
      </div>
    );
  }

  return (
    <div className={CARTE}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="devis-nom" className={ETIQUETTE}>Nom complet *</label>
            <input
              id="devis-nom"
              name="nom"
              required
              placeholder="Jean Dupont"
              className={CHAMP}
            />
          </div>
          <div>
            <label htmlFor="devis-email" className={ETIQUETTE}>Email *</label>
            <input
              id="devis-email"
              name="email"
              type="email"
              required
              placeholder="jean@exemple.fr"
              className={CHAMP}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="devis-telephone" className={ETIQUETTE}>Téléphone *</label>
            <input
              id="devis-telephone"
              name="telephone"
              type="tel"
              required
              placeholder="06 12 34 56 78"
              className={CHAMP}
            />
          </div>
          <div>
            <label htmlFor="devis-type" className={ETIQUETTE}>Type de projet *</label>
            <select
              id="devis-type"
              name="type_projet"
              required
              className={`${CHAMP} appearance-none`}
            >
              <option value="">Sélectionnez...</option>
              {familles.map((f) => (
                <option key={f.id} value={f.libelle}>{f.libelle} ({f.aide.charAt(0).toLowerCase() + f.aide.slice(1)})</option>
              ))}
              <option value="Autre">Autre</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="devis-ville" className={ETIQUETTE}>Ville du projet *</label>
            <input
              id="devis-ville"
              name="ville"
              required
              autoComplete="address-level2"
              placeholder="Montpellier"
              className={CHAMP}
            />
          </div>
          <div>
            <label htmlFor="devis-cp" className={ETIQUETTE}>Code postal *</label>
            <input
              id="devis-cp"
              name="code_postal"
              required
              inputMode="numeric"
              pattern="[0-9]{5}"
              title="5 chiffres"
              autoComplete="postal-code"
              placeholder="34000"
              className={CHAMP}
            />
          </div>
        </div>

        {/* Style souhaité */}
        <div>
          <label htmlFor="devis-style" className={ETIQUETTE}>Style souhaité</label>
          <input
            id="devis-style"
            name="style"
            placeholder="ex : Marbre blanc, Bois chêne, Noir mat..."
            className={CHAMP}
          />
        </div>

        {reference && (
          <div className="rounded-[var(--rayon-sm)] border border-trait bg-fond px-4 py-3">
            <p className="text-[14.5px] text-encre-2">
              Référence sélectionnée : <span className="font-semibold text-encre">{reference}</span>
            </p>
            <input type="hidden" name="reference" value={reference} />
          </div>
        )}

        {/* Message */}
        <div>
          <label htmlFor="devis-message" className={ETIQUETTE}>Votre message *</label>
          <textarea
            id="devis-message"
            name="message"
            required
            rows={4}
            placeholder="Décrivez votre projet, vos contraintes, vos envies..."
            className={`${CHAMP} resize-none`}
          />
        </div>

        {/* Photos du projet */}
        <div>
          <p className={ETIQUETTE}>
            Photos du projet <span className="font-normal text-encre-2">(recommandé — accélère votre devis)</span>
          </p>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
              {photos.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-[var(--rayon-sm)] border border-trait">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo projet ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label="Retirer la photo"
                    className="absolute top-1 right-1 flex h-11 w-11 items-center justify-center rounded-full bg-encre/70 text-blanc transition-colors duration-[var(--duree-courte)] hover:bg-encre"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < MAX_PHOTOS && (
            <label
              // Une photo glissée sur la zone est ajoutée (sans cela, le navigateur l'ouvrirait et quitterait la page).
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void ajouterPhotos(Array.from(e.dataTransfer.files || []));
              }}
              className={`flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-[var(--rayon-sm)] border-2 border-dashed border-trait bg-fond transition-colors duration-[var(--duree-courte)] hover:border-encre ${FOCUS_FICHIER}`}
            >
              <svg className="mb-1 h-8 w-8 text-encre-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[14px] text-encre-2">
                {photoBusy ? "Traitement..." : "Ajoutez vos photos (jusqu'à 4)"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotos}
                disabled={photoBusy}
                className="sr-only"
              />
            </label>
          )}
        </div>

        <CaseConsentement id="consentement-devis" checked={consentement} onChange={setConsentement} />

        {/* Honeypot - hidden from humans */}
        <div className="absolute overflow-hidden" style={{ width: 0, height: 0, opacity: 0, position: "absolute", top: "-9999px", left: "-9999px" }} aria-hidden="true" tabIndex={-1}>
          <label htmlFor="website">Website</label>
          <input type="text" id="website" name="website" autoComplete="off" />
        </div>

        <Turnstile action="devis" theme="light" onToken={setJetonCaptcha} />

        {error && (
          <p role="alert" className="rounded-[var(--rayon-sm)] bg-accent-fond px-4 py-3 text-[14.5px] text-accent-texte">
            {error}
          </p>
        )}

        <Bouton type="submit" plein occupe={sending} libelleOccupe="Envoi en cours…" raisonDesactive={photoBusy ? "Photos en préparation…" : null}>
          {submitLabel}
        </Bouton>

        <p className="text-center text-[13.5px] text-encre-2">
          Vous avez repéré une référence dans notre catalogue ?{" "}
          <Link href="/matieres" className="text-encre underline underline-offset-4">
            Parcourir le catalogue Cover Styl&apos;
          </Link>
        </p>
      </form>
    </div>
  );
}
