"use client";

import { useState } from "react";
import Link from "next/link";
import { Bouton } from "@/components/simulation/Bouton";
import { CHAMP } from "@/app/simulateur/_components/Formulaires";
import { consentementPourEnvoi } from "@/lib/consentement";
import CaseConsentement from "./CaseConsentement";
import { ChampPhotos } from "./ChampPhotos";
import Turnstile, { reinitialiserTurnstile } from "./Turnstile";
import { obtenirParcoursId } from "@/lib/parcours";
import { acquisitionPourEnvoi } from "@/lib/utm";
import { envoyerEvenement } from "@/lib/evenements-site";

import { DELAI_REPONSE } from "@/lib/offre-legere";
import { FAMILLES_REPLI, type FamillePrestation } from "@/lib/prestations";

/** Mission 16 : les champs clairs du simulateur (`CHAMP`), une étiquette au-dessus. */
const ETIQUETTE = "mb-1 block text-[14px] font-medium text-encre";
const CARTE = "rounded-[var(--rayon-md)] border border-trait bg-white p-5 sm:p-8";

/**
 * Formulaire de contact de /contact (mission 16, partie 4 : /devis est redirigé vers le simulateur ; la source
 * `coverswap.fr/contact` devient `SITE_CONTACT` au CRM). Poste vers /api/contact. Les photos jointes sont réduites
 * dans le navigateur (`ChampPhotos`, `lib/photos-formulaire`) puis transmises au CRM.
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
  // Turnstile (script tiers) ne se charge qu'au premier geste dans le formulaire (convention du site).
  const [touche, setTouche] = useState(false);
  const toucher = () => setTouche(true);

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
          <h2 className="titre-2 mb-2 text-encre">Message envoyé</h2>
          <p className="texte-2 mb-6">Nous vous répondons {DELAI_REPONSE}.</p>
          <Bouton variante="secondaire" onClick={() => setSent(false)}>
            Envoyer un autre message
          </Bouton>
        </div>
      </div>
    );
  }

  return (
    <div className={CARTE}>
      <form onSubmit={handleSubmit} onFocusCapture={toucher} onPointerDownCapture={toucher} className="space-y-5">
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

        <ChampPhotos photos={photos} setPhotos={setPhotos} occupe={photoBusy} setOccupe={setPhotoBusy} />

        <CaseConsentement id="consentement-devis" checked={consentement} onChange={setConsentement} />

        {/* Honeypot - hidden from humans */}
        <div className="absolute overflow-hidden" style={{ width: 0, height: 0, opacity: 0, position: "absolute", top: "-9999px", left: "-9999px" }} aria-hidden="true" tabIndex={-1}>
          <label htmlFor="website">Website</label>
          <input type="text" id="website" name="website" autoComplete="off" />
        </div>

        <Turnstile action="devis" theme="light" onToken={setJetonCaptcha} actif={touche} />

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
