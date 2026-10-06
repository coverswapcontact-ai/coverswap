"use client";

import { useState, type ReactNode } from "react";
import { ETAPES_ATTENTE, TEXTE_CONSENTEMENT_PREVENIR, etapesCochees, texteAttente } from "@/lib/simulateur/reprise";
import { Bouton } from "./Bouton";

/**
 * Écran d'attente d'une simulation (mission 15, partie 1 ; jetons du thème
 * clair en partie 4) — partagé avec l'espace client depuis la partie 5 : la photo en
 * grand, assombrie, une lueur lente qui la parcourt ; les films choisis ;
 * trois étapes nommées, cochées d'après l'étape du travail ; « Lecture de
 * votre photo » complétée par l'analyse quand elle est connue ; un temps
 * indicatif en mots ; la phrase clé « vous pouvez quitter cette page » ;
 * « Me prévenir quand c'est prêt » ; et l'état d'échec (réessayer, ou la
 * simulation à la main : `children`). Sans emoji ni icône colorée. Aucun
 * appel réseau ici : tout passe par les fonctions reçues.
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
  /** Ce que l'analyse a lu sur la photo (zones vues), sous « Lecture de votre photo ». */
  lecturePhoto?: string | null;
  /** La phrase « vous pouvez quitter » : celle du site à défaut ; l'espace client dit où revenir. */
  phraseQuitter?: string;
  /** Contenu montré sous l'échec : la demande « simulation à la main ». */
  children?: ReactNode;
  /** Le titre de l'attente : « Votre simulation se prépare » à défaut ; « L'ambiance se prépare » sur une pièce d'exemple (site 3.0). */
  titre?: string;
};

const CHAMP = "w-full rounded-[var(--rayon-sm)] border border-trait bg-white px-3.5 py-3 text-[16px] text-encre placeholder:text-encre-2/70 focus:border-encre focus:outline-none";

function FormulairePrevenir({ onPrevenir }: { onPrevenir: NonNullable<Props["onPrevenir"]> }) {
  const [ouvert, setOuvert] = useState(false);
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [consentement, setConsentement] = useState(false);
  const [etat, setEtat] = useState<{ type: "" | "envoi" | "ok" | "erreur"; message?: string }>({ type: "" });

  if (etat.type === "ok") {
    return (
      <p role="status" className="text-[15px] leading-relaxed text-encre">
        C&apos;est noté : {email.trim() ? "vous recevrez un e-mail dès que la simulation est prête" : "nous vous rappelons quand la simulation est prête"}. Vous pouvez fermer cette page.
      </p>
    );
  }
  if (!ouvert) {
    return (
      <Bouton variante="secondaire" onClick={() => setOuvert(true)}>
        Me prévenir quand c&apos;est prêt
      </Bouton>
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
    <form onSubmit={(e) => void envoyer(e)} className="space-y-3 rounded-[var(--rayon-md)] border border-trait bg-white p-4">
      <p className="text-[15px] font-medium text-encre">Être prévenu quand c&apos;est prêt</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[13px] text-encre-2">
          E-mail
          <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${CHAMP} mt-1`} placeholder="vous@exemple.fr" />
        </label>
        <label className="block text-[13px] text-encre-2">
          Téléphone
          <input type="tel" inputMode="tel" autoComplete="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className={`${CHAMP} mt-1`} placeholder="06 00 00 00 00" />
        </label>
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-encre-2">
        <input type="checkbox" checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-encre)]" />
        <span>{TEXTE_CONSENTEMENT_PREVENIR}</span>
      </label>
      {etat.type === "erreur" ? (
        <p role="alert" className="text-[13.5px] text-alerte-texte">
          {etat.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Bouton type="submit" occupe={etat.type === "envoi"} libelleOccupe="Enregistrement…" raisonDesactive={!consentement ? "Cochez la case pour que nous puissions vous prévenir." : !email.trim() && !telephone.trim() ? "Indiquez un e-mail ou un téléphone." : null}>
          Me prévenir
        </Bouton>
        <Bouton variante="discret" onClick={() => setOuvert(false)}>
          Annuler
        </Bouton>
      </div>
    </form>
  );
}

export const PHRASE_QUITTER_SITE = "Vous pouvez quitter cette page : votre simulation continue. Revenez sur le simulateur pour la retrouver.";

export default function EcranAttente({ photo, films, statut, etape, attenteEstimeeS, horsLigne, echec, peutReessayer, attenteReessai, onReessayer, onPrevenir, lecturePhoto, phraseQuitter = PHRASE_QUITTER_SITE, children, titre = "Votre simulation se prépare" }: Props) {
  const cochees = etapesCochees(etape, statut);
  const enEchec = statut === "ECHEC" && echec;
  return (
    <section aria-labelledby="attente-titre" className="overflow-hidden rounded-[var(--rayon-md)] border border-trait bg-fond text-encre">
      {/* La photo en grand, assombrie, parcourue par une lueur lente (coupée si l'utilisateur préfère moins de mouvement). */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-encre sm:aspect-[3/2]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo du visiteur en mémoire locale (data URL)
          <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: enEchec ? "brightness(0.55) saturate(0.6)" : "brightness(0.6)" }} />
        ) : null}
        {!enEchec ? (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/2 animate-[lueur-attente_5.5s_ease-in-out_infinite] motion-reduce:hidden" style={{ background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%)" }} />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-2 p-3">
          {films.map((f) => (
            <span key={`${f.zone}-${f.nom}`} className="flex items-center gap-2 rounded-[var(--rayon-sm)] bg-fond/95 py-1 pr-2.5 pl-1 text-[12.5px] text-encre">
              {f.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- vignette servie par le CRM
                <img src={f.image} alt="" className="h-7 w-7 rounded-[4px] object-cover" loading="lazy" referrerPolicy="no-referrer" />
              ) : (
                <span className="h-7 w-7 rounded-[4px] bg-trait" />
              )}
              <span className="max-w-[9rem] truncate">
                <span className="text-encre-2">{f.libelle} · </span>
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
              <h2 id="attente-titre" className="font-display text-[22px] leading-tight font-semibold">
                Nous n&apos;avons pas réussi cette fois-ci.
              </h2>
              <p className="mt-1 text-[15px] leading-relaxed text-encre">{echec.message}</p>
            </div>
            {peutReessayer ? (
              <Bouton onClick={onReessayer} raisonDesactive={attenteReessai ?? null}>
                Réessayer
              </Bouton>
            ) : null}
            {children}
          </div>
        ) : (
          <>
            <div>
              <h2 id="attente-titre" className="font-display text-[22px] leading-tight font-semibold">
                {titre}
              </h2>
              <p className="mt-1 text-[15px] font-medium text-encre">{texteAttente(attenteEstimeeS)}</p>
              <p role="status" aria-live="polite" className="mt-1 min-h-[20px] text-[14px] text-encre-2">
                {horsLigne ? "Connexion interrompue : nous réessayons. La simulation continue de son côté." : statut === "EN_ATTENTE" ? "En file d'attente…" : "Génération en cours…"}
              </p>
            </div>
            <ol className="space-y-3">
              {ETAPES_ATTENTE.map((e, i) => {
                const faite = cochees[i];
                const courante = !faite && (i === 0 || cochees[i - 1]);
                return (
                  <li key={e.cle} className="flex gap-3">
                    <span aria-hidden className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[12px] ${faite ? "border-encre bg-encre text-blanc" : courante ? "border-encre text-encre" : "border-trait text-encre-2"}`}>
                      {faite ? "✓" : i + 1}
                    </span>
                    <div>
                      <p className={`text-[15px] font-medium ${faite || courante ? "text-encre" : "text-encre-2"}`}>
                        {e.titre}
                        <span className="sr-only">{faite ? " : fait" : courante ? " : en cours" : " : à venir"}</span>
                      </p>
                      <p className="text-[13.5px] leading-snug text-encre-2">{e.cle === "analyse" && lecturePhoto ? lecturePhoto : e.phrase}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="rounded-[var(--rayon-sm)] border border-trait bg-white px-3.5 py-3 text-[15px] leading-relaxed text-encre">{phraseQuitter}</p>
            {onPrevenir ? <FormulairePrevenir onPrevenir={onPrevenir} /> : null}
          </>
        )}
      </div>
    </section>
  );
}
