"use client";

import { useState, type ReactNode } from "react";
import { ETAPES_ATTENTE, TEXTE_CONSENTEMENT_PREVENIR, etapesCochees, texteAttente } from "@/lib/simulateur/reprise";

/**
 * Écran d'attente d'une simulation (mission 15, partie 1) — partagé demain
 * avec l'espace client (partie 6) : la photo en grand, assombrie, une lueur
 * lente qui la parcourt ; les films choisis ; trois étapes nommées, cochées
 * d'après l'étape du travail ; un temps indicatif en mots ; la phrase clé
 * « vous pouvez quitter cette page » ; « Me prévenir quand c'est prêt » ;
 * et l'état d'échec (réessayer, ou la simulation à la main : `children`).
 * Thème clair « éditorial », sans emoji ni icône colorée, coins peu arrondis.
 * Aucun appel réseau ici : tout passe par les fonctions reçues.
 */

export type FilmChoisi = { zone: string; libelle: string; nom: string; image: string | null };
export type EchecAttente = { raison: string; message: string };
export type DemandePrevenir = { email?: string; telephone?: string };

type Props = {
  photo: string | null;
  films: FilmChoisi[];
  statut: "EN_ATTENTE" | "EN_COURS" | "ECHEC";
  etape: string | null;
  attenteEstimeeS: number;
  horsLigne: boolean;
  echec: EchecAttente | null;
  /** Vrai : le bouton « Réessayer » est proposé (relance sans rien re-saisir). */
  peutReessayer: boolean;
  /** Pourquoi « Réessayer » attend encore (vérification anti-robot en cours) : bouton désactivé, raison affichée. */
  attenteReessai?: string | null;
  onReessayer: () => void;
  /** Absent : pas de « Me prévenir » (lien de reprise sans état, par exemple). */
  onPrevenir?: (demande: DemandePrevenir) => Promise<{ ok: boolean; message?: string }>;
  /** Contenu montré sous l'échec : la demande « simulation à la main ». */
  children?: ReactNode;
};

const CHAMP = "w-full rounded-md border border-[#D3CFC8] bg-white px-3.5 py-3 text-[16px] text-[#1A1A1A] placeholder:text-[#8A857E] focus:border-[#1A1A1A] focus:outline-hidden";

function FormulairePrevenir({ onPrevenir }: { onPrevenir: NonNullable<Props["onPrevenir"]> }) {
  const [ouvert, setOuvert] = useState(false);
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [consentement, setConsentement] = useState(false);
  const [etat, setEtat] = useState<{ type: "" | "envoi" | "ok" | "erreur"; message?: string }>({ type: "" });

  if (etat.type === "ok") {
    return (
      <p role="status" className="text-[15px] leading-relaxed text-[#3F3B36]">
        C&apos;est noté : {email.trim() ? "vous recevrez un e-mail dès que la simulation est prête" : "nous vous rappelons quand la simulation est prête"}. Vous pouvez fermer cette page.
      </p>
    );
  }
  if (!ouvert) {
    return (
      <button type="button" onClick={() => setOuvert(true)} className="min-h-[44px] rounded-md border border-[#1A1A1A] px-4 text-[15px] font-medium text-[#1A1A1A] transition-colors duration-200 hover:bg-[#1A1A1A] hover:text-white">
        Me prévenir quand c&apos;est prêt
      </button>
    );
  }
  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentement || (!email.trim() && !telephone.trim())) return;
    setEtat({ type: "envoi" });
    const resultat = await onPrevenir({ email: email.trim() || undefined, telephone: telephone.trim() || undefined });
    setEtat(resultat.ok ? { type: "ok" } : { type: "erreur", message: resultat.message });
  };
  return (
    <form onSubmit={(e) => void envoyer(e)} className="space-y-3 rounded-lg border border-[#D3CFC8] bg-white/70 p-4">
      <p className="text-[15px] font-medium text-[#1A1A1A]">Être prévenu quand c&apos;est prêt</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[13px] text-[#5F5A53]">
          E-mail
          <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${CHAMP} mt-1`} placeholder="vous@exemple.fr" />
        </label>
        <label className="block text-[13px] text-[#5F5A53]">
          Téléphone
          <input type="tel" inputMode="tel" autoComplete="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className={`${CHAMP} mt-1`} placeholder="06 00 00 00 00" />
        </label>
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-[#5F5A53]">
        <input type="checkbox" checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#1A1A1A]" />
        <span>{TEXTE_CONSENTEMENT_PREVENIR}</span>
      </label>
      {etat.type === "erreur" ? <p role="alert" className="text-[13px] text-[#8F1D12]">{etat.message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={etat.type === "envoi" || !consentement || (!email.trim() && !telephone.trim())} className="min-h-[44px] rounded-md bg-[#1A1A1A] px-4 text-[15px] font-medium text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40">
          {etat.type === "envoi" ? "Enregistrement…" : "Me prévenir"}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="min-h-[44px] px-3 text-[15px] text-[#5F5A53] underline-offset-2 hover:underline">
          Annuler
        </button>
      </div>
    </form>
  );
}

export default function EcranAttente({ photo, films, statut, etape, attenteEstimeeS, horsLigne, echec, peutReessayer, attenteReessai, onReessayer, onPrevenir, children }: Props) {
  const cochees = etapesCochees(etape, statut);
  const enEchec = statut === "ECHEC" && echec;
  return (
    <section aria-labelledby="attente-titre" className="overflow-hidden rounded-lg border border-[#E6E3DD] bg-[#F5F4F1] text-[#1A1A1A] [color-scheme:light]">
      {/* La photo en grand, assombrie, parcourue par une lueur lente (coupée si l'utilisateur préfère moins de mouvement). */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1A1A1A] sm:aspect-[3/2]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo du visiteur en mémoire locale (data URL)
          <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: enEchec ? "brightness(0.55) saturate(0.6)" : "brightness(0.6)" }} />
        ) : null}
        {!enEchec ? (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/2 animate-[lueur-attente_5.5s_ease-in-out_infinite] motion-reduce:hidden" style={{ background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%)" }} />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-2 p-3">
          {films.map((f) => (
            <span key={`${f.zone}-${f.nom}`} className="flex items-center gap-2 rounded-md bg-[#F5F4F1]/95 py-1 pr-2.5 pl-1 text-[12.5px] text-[#1A1A1A]">
              {f.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- échantillon Cover Styl' (S3), non optimisé
                <img src={f.image} alt="" className="h-7 w-7 rounded-[4px] object-cover" loading="lazy" />
              ) : (
                <span className="h-7 w-7 rounded-[4px] bg-[#D3CFC8]" />
              )}
              <span className="max-w-[9rem] truncate">
                <span className="text-[#5F5A53]">{f.libelle} · </span>
                {f.nom}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        {enEchec ? (
          <div className="space-y-4">
            {/* Le titre est ici ; le message ne dit que la cause et l'action suivante (jamais la même phrase deux fois). */}
            <div role="alert">
              <h2 id="attente-titre" className="font-display text-[22px] font-bold leading-tight">
                Nous n&apos;avons pas réussi cette fois-ci.
              </h2>
              <p className="mt-1 text-[15px] leading-relaxed text-[#3F3B36]">{echec.message}</p>
            </div>
            {peutReessayer ? (
              <div>
                <button type="button" onClick={onReessayer} disabled={!!attenteReessai} aria-describedby={attenteReessai ? "attente-reessai" : undefined} className="min-h-[48px] w-full rounded-md bg-[#1A1A1A] px-5 text-[16px] font-medium text-white transition-colors duration-200 hover:bg-[#3F3B36] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">
                  Réessayer
                </button>
                {attenteReessai ? (
                  <p id="attente-reessai" role="status" aria-live="polite" className="mt-2 text-[13px] text-[#5F5A53]">
                    {attenteReessai}
                  </p>
                ) : null}
              </div>
            ) : null}
            {children}
          </div>
        ) : (
          <>
            <div>
              <h2 id="attente-titre" className="font-display text-[22px] font-bold leading-tight">
                Votre simulation se prépare
              </h2>
              <p className="mt-1 text-[15px] font-medium text-[#3F3B36]">{texteAttente(attenteEstimeeS)}</p>
              <p role="status" aria-live="polite" className="mt-1 text-[14px] text-[#5F5A53]">
                {horsLigne ? "Connexion interrompue : nous réessayons. La simulation continue de son côté." : statut === "EN_ATTENTE" ? "En file d'attente…" : "Génération en cours…"}
              </p>
            </div>
            <ol className="space-y-3">
              {ETAPES_ATTENTE.map((e, i) => {
                const faite = cochees[i];
                const courante = !faite && (i === 0 || cochees[i - 1]);
                return (
                  <li key={e.cle} className="flex gap-3">
                    <span aria-hidden className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[12px] ${faite ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : courante ? "border-[#1A1A1A] text-[#1A1A1A]" : "border-[#D3CFC8] text-[#8A857E]"}`}>
                      {faite ? "✓" : i + 1}
                    </span>
                    <div>
                      <p className={`text-[15px] font-medium ${faite || courante ? "text-[#1A1A1A]" : "text-[#8A857E]"}`}>
                        {e.titre}
                        <span className="sr-only">{faite ? " : fait" : courante ? " : en cours" : " : à venir"}</span>
                      </p>
                      <p className="text-[13.5px] leading-snug text-[#5F5A53]">{e.phrase}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="rounded-md border border-[#D3CFC8] bg-white/70 px-3.5 py-3 text-[15px] leading-relaxed text-[#1A1A1A]">
              Vous pouvez quitter cette page : votre simulation continue. Revenez sur le simulateur pour la retrouver.
            </p>
            {onPrevenir ? <FormulairePrevenir onPrevenir={onPrevenir} /> : null}
          </>
        )}
      </div>
    </section>
  );
}
