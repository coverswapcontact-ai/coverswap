"use client";

import { useState } from "react";
import { CHAMP } from "@/app/simulateur/_components/Formulaires";
import CaseConsentement from "@/components/CaseConsentement";
import { ChampPhotos } from "@/components/ChampPhotos";
import { Bouton } from "@/components/simulation/Bouton";
import Turnstile, { reinitialiserTurnstile } from "@/components/Turnstile";
import { consentementPourEnvoi } from "@/lib/consentement";
import { envoyerEvenement } from "@/lib/evenements-site";
import { DELAI_REPONSE } from "@/lib/offre-legere";
import { obtenirParcoursId } from "@/lib/parcours";
import { acquisitionPourEnvoi } from "@/lib/utm";
import { SOURCE_FORMULAIRE_PRO, TYPES_DE_LIEU } from "../contenu";

const ETIQUETTE = "mb-1 block text-[14px] font-medium text-encre";
const FACULTATIF = <span className="font-normal text-encre-2">(facultatif)</span>;

/**
 * Le formulaire de /pro (mission 16, partie 4) : prénom et nom, société, téléphone, e-mail, ville, type de lieu,
 * surface approximative (m² ou mètres linéaires), message, photos (4 au plus, réduites comme sur /contact :
 * `ChampPhotos`), consentement, Turnstile, pot de miel. Poste vers /api/contact avec la source `SITE_PRO` EXPLICITE
 * (le CRM la compte comme une demande de devis). Pas de simulateur ici : le devis se fait sur visite ou photos.
 */
export function FormulairePro() {
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosOccupees, setPhotosOccupees] = useState(false);
  const [consentement, setConsentement] = useState(false);
  const [unite, setUnite] = useState<"m2" | "ml">("m2");
  const [jeton, setJeton] = useState<string | null>(null);
  // Turnstile (script tiers) ne se charge qu'au premier geste dans le formulaire (convention du site).
  const [touche, setTouche] = useState(false);
  const toucher = () => setTouche(true);

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const formulaire = e.currentTarget;
    const champ = (nom: string) => String(new FormData(formulaire).get(nom) ?? "").trim();
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: champ("nom"),
          societe: champ("societe"),
          phone: champ("telephone"),
          email: champ("email"),
          ville: champ("ville"),
          typeLieu: champ("type_lieu"),
          surface: champ("surface"),
          surfaceUnite: unite,
          message: champ("message"),
          website: champ("website"),
          photos,
          source: SOURCE_FORMULAIRE_PRO,
          parcoursId: obtenirParcoursId(),
          turnstileToken: jeton,
          ...acquisitionPourEnvoi(),
          formulaire: "coverswap.fr/pro",
          ...consentementPourEnvoi(consentement, "pro"),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErreur(`${d?.error || "Une erreur est survenue."} Vos réponses et vos photos sont conservées : vous pouvez réessayer.`);
        envoyerEvenement("FORMULAIRE_ECHEC", { formulaire: "pro", statut: res.status, raison: d?.reason });
        return;
      }
      envoyerEvenement("DEVIS_DEMANDE", { formulaire: "pro", photos: photos.length });
      setEnvoye(true);
      formulaire.reset();
      setPhotos([]);
      setConsentement(false);
    } catch {
      setErreur("Connexion interrompue. Vos réponses et vos photos sont conservées : réessayez.");
      envoyerEvenement("FORMULAIRE_ECHEC", { formulaire: "pro", raison: "reseau" });
    } finally {
      setEnvoi(false);
      reinitialiserTurnstile();
      setJeton(null);
    }
  }

  if (envoye) {
    return (
      <div role="status" className="rounded-[var(--rayon-md)] border border-trait bg-white p-6">
        <h3 className="titre-2 text-encre">Demande envoyée</h3>
        <p className="texte-2 mt-2">Nous vous rappelons {DELAI_REPONSE} pour fixer la visite ou chiffrer sur vos photos.</p>
        <div className="mt-5">
          <Bouton variante="secondaire" onClick={() => setEnvoye(false)}>
            Envoyer une autre demande
          </Bouton>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} onFocusCapture={toucher} onPointerDownCapture={toucher} className="space-y-5 rounded-[var(--rayon-md)] border border-trait bg-white p-5 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="pro-nom" className={ETIQUETTE}>Prénom et nom *</label>
          <input id="pro-nom" name="nom" required autoComplete="name" className={CHAMP} />
        </div>
        <div>
          <label htmlFor="pro-societe" className={ETIQUETTE}>Société {FACULTATIF}</label>
          <input id="pro-societe" name="societe" autoComplete="organization" className={CHAMP} />
        </div>
        <div>
          <label htmlFor="pro-telephone" className={ETIQUETTE}>Téléphone *</label>
          <input id="pro-telephone" name="telephone" type="tel" inputMode="tel" required autoComplete="tel" className={CHAMP} />
        </div>
        <div>
          <label htmlFor="pro-email" className={ETIQUETTE}>E-mail *</label>
          <input id="pro-email" name="email" type="email" required autoComplete="email" className={CHAMP} />
        </div>
        <div>
          <label htmlFor="pro-ville" className={ETIQUETTE}>Ville *</label>
          <input id="pro-ville" name="ville" required autoComplete="address-level2" className={CHAMP} />
        </div>
        <div>
          <label htmlFor="pro-lieu" className={ETIQUETTE}>Type de lieu *</label>
          <select id="pro-lieu" name="type_lieu" required defaultValue="" className={`${CHAMP} appearance-none`}>
            <option value="" disabled>Choisissez…</option>
            {TYPES_DE_LIEU.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={ETIQUETTE}>Surface approximative {FACULTATIF}</legend>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="pro-surface" className="sr-only">Surface</label>
          <input id="pro-surface" name="surface" type="number" inputMode="decimal" min={0} step="any" className={`${CHAMP} max-w-32`} />
          <div role="group" aria-label="Unité de la surface" className="flex gap-2">
            {(["m2", "ml"] as const).map((u) => (
              <button key={u} type="button" aria-pressed={unite === u} onClick={() => setUnite(u)} className={`min-h-[44px] rounded-[var(--rayon-sm)] border px-4 text-[15px] font-medium transition-colors duration-[var(--duree-courte)] ${unite === u ? "border-encre bg-encre text-blanc" : "border-trait bg-white text-encre hover:border-encre"}`}>
                {u === "m2" ? "m²" : "mètres linéaires"}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <div>
        <label htmlFor="pro-message" className={ETIQUETTE}>Votre projet {FACULTATIF}</label>
        <textarea id="pro-message" name="message" rows={3} placeholder="Nombre de chambres, comptoir à reprendre, période possible…" className={`${CHAMP} resize-none`} />
      </div>

      <ChampPhotos photos={photos} setPhotos={setPhotos} occupe={photosOccupees} setOccupe={setPhotosOccupees} titre="Photos du lieu" />

      <CaseConsentement id="consentement-pro" checked={consentement} onChange={setConsentement} />

      {/* Pot de miel : invisible pour une personne. */}
      <div className="absolute overflow-hidden" style={{ width: 0, height: 0, opacity: 0, position: "absolute", top: "-9999px", left: "-9999px" }} aria-hidden="true" tabIndex={-1}>
        <label htmlFor="pro-website">Website</label>
        <input type="text" id="pro-website" name="website" autoComplete="off" tabIndex={-1} />
      </div>

      <Turnstile action="pro" theme="light" onToken={setJeton} actif={touche} />

      {erreur ? (
        <p role="alert" className="rounded-[var(--rayon-sm)] bg-alerte-fond px-4 py-3 text-[14.5px] text-alerte-texte">
          {erreur}
        </p>
      ) : null}

      <Bouton type="submit" plein occupe={envoi} libelleOccupe="Envoi en cours…" raisonDesactive={photosOccupees ? "Photos en préparation…" : null}>
        Envoyer ma demande
      </Bouton>
    </form>
  );
}
