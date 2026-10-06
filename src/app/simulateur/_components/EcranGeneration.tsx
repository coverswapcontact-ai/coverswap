"use client";

import { Bouton } from "@/components/simulation/Bouton";
import EcranAttente, { type DemandePrevenir, type EchecAttente, type FilmChoisi } from "@/components/simulation/EcranAttente";
import Turnstile from "@/components/Turnstile";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_REPONSE } from "@/lib/offre-legere";
import { urlVignette } from "@/lib/simulateur/generation-client";
import { ATTENTE_PAR_DEFAUT_S, type EtatAnalyse, type EtatSondage, type TravailEnCours } from "@/lib/simulateur/reprise";
import type { EtatSimulateur } from "@/lib/simulateur/stockage";
import type { PieceSimulateur } from "@/lib/simulateur/zones";
import { ChampsContact, type Formulaire } from "./Formulaires";

/**
 * L'écran 3 pendant une génération ou après son échec (site 3.0, lot E1 : sorti de `Simulateur.tsx`, sans changer le
 * comportement) : l'écran d'attente partagé avec l'espace client, et sous l'échec la « simulation à la main » (le
 * formulaire de secours, envoyé avec la photo par `onEnvoyer`), « Revenir à mes matières », ou « Nouvelle simulation »
 * quand la photo n'est plus sur cet appareil. Aucun appel réseau ici : tout passe par les fonctions reçues.
 * Relecture des phases D, E, F : sur une pièce d'exemple (`exemple`), l'attente dit « L'ambiance se prépare » et le
 * secours « Recevoir une simulation faite à la main » — la demande part sans l'avant d'exemple (`demande.ts`) : ce
 * n'est pas la photo du visiteur, nous lui demandons la sienne.
 */
type Props = {
  piece: PieceSimulateur;
  photo: string | null;
  selections: EtatSimulateur["selections"];
  analyse: EtatAnalyse | null;
  sondage: EtatSondage | null;
  travail: TravailEnCours | null;
  echec: EchecAttente | null;
  peutReessayer: boolean;
  attenteReessai: string | null;
  onReessayer: () => void;
  onPrevenir?: (demande: DemandePrevenir) => Promise<{ ok: boolean; message?: string }>;
  /** La demande de secours est partie : le message de confirmation remplace le formulaire. */
  envoye: boolean;
  formulaire: Formulaire;
  onFormulaire: (f: Formulaire) => void;
  avecVille: boolean;
  envoiEnCours: boolean;
  onEnvoyer: (e: React.FormEvent) => void;
  onRevenir: () => void;
  onNouvelle: () => void;
  onJeton: (jeton: string | null) => void;
  /** La pièce d'exemple chargée à la place d'une photo (lot E3), sinon rien. */
  exemple?: string | null;
};

export function EcranGeneration({ piece, photo, selections, analyse, sondage, travail, echec, peutReessayer, attenteReessai, onReessayer, onPrevenir, envoye, formulaire, onFormulaire, avecVille, envoiEnCours, onEnvoyer, onRevenir, onNouvelle, onJeton, exemple = null }: Props) {
  const films: FilmChoisi[] = piece.zones.flatMap((zone) => {
    const sel = selections[zone.id];
    return sel ? [{ zone: zone.id, libelle: zone.libelle, nom: sel.nom, image: urlVignette(sel.ref) }] : [];
  });
  const lecturePhoto = analyse?.statut === "PRETE" && analyse.zonesVisibles.length > 0 ? `Vu sur votre photo : ${analyse.zonesVisibles.map((id) => piece.zones.find((z) => z.id === id)?.libelle ?? id).join(", ")}.` : null;
  return (
    <EcranAttente
      photo={photo}
      films={films}
      statut={echec ? "ECHEC" : (sondage?.statut ?? "EN_ATTENTE")}
      etape={sondage?.etape ?? null}
      attenteEstimeeS={sondage?.attenteEstimeeS ?? travail?.attenteEstimeeS ?? ATTENTE_PAR_DEFAUT_S}
      horsLigne={sondage?.horsLigne ?? false}
      echec={echec}
      peutReessayer={peutReessayer}
      attenteReessai={attenteReessai}
      onReessayer={onReessayer}
      onPrevenir={onPrevenir}
      lecturePhoto={lecturePhoto}
      titre={exemple ? "L'ambiance se prépare" : undefined}
    >
      {envoye ? (
        <div role="status" className="rounded-[var(--rayon-sm)] bg-succes-fond p-4 text-succes">
          <p className="text-[17px] font-semibold">Demande bien reçue</p>
          <p className="mt-1 text-[14.5px] leading-relaxed">
            {exemple
              ? `Vos choix de matières nous sont parvenus. Nous vous recontactons pour une photo de votre pièce, puis nous réalisons la simulation et vous l'envoyons avec votre devis, ${DELAI_REPONSE}. Besoin de nous joindre avant ? ${ENTREPRISE.telephone}.`
              : `Votre photo et vos choix de matières nous sont parvenus. Nous réalisons la simulation et vous l'envoyons par e-mail avec votre devis, ${DELAI_REPONSE}. Besoin de nous joindre avant ? ${ENTREPRISE.telephone}.`}
          </p>
        </div>
      ) : photo ? (
        <>
          {echec ? (
            <Bouton variante="secondaire" onClick={onRevenir}>
              Revenir à mes matières
            </Bouton>
          ) : null}
          <form onSubmit={onEnvoyer} className="space-y-4 border-t border-trait pt-5">
            <div>
              <h3 className="font-display text-[18px] font-semibold text-encre">{exemple ? "Recevoir une simulation faite à la main" : "Recevoir ma simulation et un devis par e-mail"}</h3>
              <p className="text-[14.5px] leading-relaxed text-encre-2">
                {exemple
                  ? `Nous la faisons pour vous sur une photo de votre pièce, avec ces matières : laissez vos coordonnées, nous vous la demandons. Devis gratuit ${DELAI_REPONSE}, sans engagement.`
                  : `Nous faisons la simulation pour vous à partir de cette photo et de vos choix. Devis gratuit ${DELAI_REPONSE}, sans engagement.`}
              </p>
            </div>
            <ChampsContact prefixe="echec" formulaire={formulaire} onChange={onFormulaire} avecVille={avecVille} emailRequis />
            <Bouton type="submit" plein occupe={envoiEnCours} libelleOccupe="Envoi…">
              {exemple ? "Recevoir une simulation faite à la main" : "Envoyer ma photo et recevoir ma simulation"}
            </Bouton>
          </form>
          <Turnstile action="simulateur-secours" theme="light" onToken={onJeton} />
        </>
      ) : (
        <Bouton variante="secondaire" onClick={onNouvelle}>
          Nouvelle simulation
        </Bouton>
      )}
    </EcranAttente>
  );
}

/** Sans photo sur cet appareil (rendu retrouvé par un lien, mémoire vide) : on le dit, plutôt qu'un écran vide. */
export function EcranSansPhoto({ onPhoto }: { onPhoto: () => void }) {
  return (
    <section aria-labelledby="etape-sans-photo" className="space-y-4">
      <h2 id="etape-sans-photo" className="font-display text-[26px] leading-tight font-semibold">
        Commencez par une photo
      </h2>
      <p className="text-[15px] text-encre-2">Aucune photo n&apos;est en mémoire sur cet appareil : choisissez-en une pour lancer une simulation.</p>
      <Bouton onClick={onPhoto}>Choisir une photo</Bouton>
    </section>
  );
}
