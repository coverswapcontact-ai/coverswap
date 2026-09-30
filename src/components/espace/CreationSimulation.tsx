"use client";

import { useMemo, useState } from "react";
import { Bouton } from "@/components/simulation/Bouton";
import { FeuilleCatalogue, type Teinte } from "@/components/simulation/FeuilleCatalogue";
import { FilEtapes } from "@/components/simulation/FilEtapes";
import { ECRANS_CREATION, choixDepuisSimulation, ecranAtteignableCreation, ecranDeDepart, piecesDeCreation, raisonBloque as raisonDeBlocage, reduireCreation, texteQuota, zonesChoisies, zonesMaxDe, zonesOrdonnees, type ChoixCreation, type EcranCreation } from "@/lib/espace/creation";
import { COTE_MAX_DOSSIER, reduirePhoto } from "@/lib/simulateur/photo";
import { dateCourte, echantillon, envoyerPhoto, ErreurEspace, MESSAGE_APERCU, vignette, type Client, type Etat, type ZoneTeinte } from "./api";
import { EcranMatieresEspace, EcranPhotoEspace, EcranPieceEspace } from "./CreationEcrans";
import { mettreEnFile } from "./file-photos";
import { Annonce, BoutonPrincipal, Carte } from "./ui";
import { useAnalyseEspace } from "./useAnalyseEspace";

/**
 * « Créer une simulation » — le simulateur du site dans l'espace du client
 * (mission 15, partie 5) : le même parcours et les mêmes composants — Pièce ·
 * Photo · Matières —, les pièces et zones de la source unique du CRM (murs et
 * tablier de baignoire compris), la photo du dossier analysée dès qu'elle est
 * choisie (même moteur, cache par empreinte), le catalogue en feuille commune,
 * le bouton collé « Lancer ma simulation » avec le quota lisible. Puis
 * l'écran d'attente, dans « Mes simulations » (EtapeSimulations).
 *
 * On repart de zéro à chaque passage, sauf : un lancement qui a échoué garde
 * ses choix le temps de réessayer ; « Essayer d'autres matières » repart d'une
 * simulation (sa pièce, ses teintes ; la photo se choisit de nouveau).
 */

const cleEchec = (jeton: string) => `espace-creation-echec:${jeton.split("-")[0]}`;

/** Après un échec (réseau, refus) : ses choix sont gardés pour la prochaine tentative, avec l'heure (6 h au plus). */
function garderEchec(jeton: string, choix: ChoixCreation): void {
  try {
    localStorage.setItem(cleEchec(jeton), JSON.stringify({ ...choix, le: Date.now() }));
  } catch {
    // stockage indisponible : ses choix restent à l'écran
  }
}

function reprendreEchec(jeton: string): ChoixCreation | null {
  try {
    const brut = localStorage.getItem(cleEchec(jeton));
    if (!brut) return null;
    localStorage.removeItem(cleEchec(jeton));
    // Nettoyage : l'ancienne mémoire des choix (avant le 22/09) ne sert plus.
    localStorage.removeItem(`espace-creation:${jeton.split("-")[0]}`);
    const garde = JSON.parse(brut) as ChoixCreation & { le?: number };
    return garde.le && Date.now() - garde.le < 6 * 3_600_000 ? { piece: garde.piece, photoId: garde.photoId, teintes: garde.teintes ?? {} } : null;
  } catch {
    return null;
  }
}

type Props = {
  etat: Etat;
  client: Client;
  jeton: string;
  onEtat: (etat: Etat) => void;
  favoris: string[];
  onFavori: (ref: string) => void;
  onLancee: (lancee: { preparationId: string; photoId: string; zones: ZoneTeinte[]; attenteEstimeeS: number | null }) => void;
  onDemanderPlus: () => void;
  demandeEnCours: boolean;
  /** « Essayer d'autres matières » : les zones de la simulation dont on repart. */
  depart?: ZoneTeinte[] | null;
};

export function CreationSimulation({ etat, client, jeton, onEtat, favoris, onFavori, onLancee, onDemanderPlus, demandeEnCours, depart = null }: Props) {
  const creation = etat.creation;
  const pieces = useMemo(() => piecesDeCreation(creation), [creation]);
  const zonesMax = zonesMaxDe(creation);
  const apercu = Boolean(client.apercu);
  const [depuis] = useState(() => (depart?.length ? { choix: choixDepuisSimulation(pieces, depart), pieceChoisie: true } : null));
  const [choix, setChoix] = useState<ChoixCreation>(() => depuis?.choix ?? reprendreEchec(jeton) ?? { piece: pieces[0].piece, photoId: null, teintes: {} });
  // La carte n'est montrée choisie que si la pièce l'a vraiment été (clic, choix repris) : l'état vide garde la première en repli.
  const [pieceChoisie, setPieceChoisie] = useState<boolean>(() => Boolean(depuis) || Boolean(choix.photoId) || Object.keys(choix.teintes).length > 0);
  const [ecran, setEcran] = useState<EcranCreation>(() => ecranDeDepart(choix, pieceChoisie));
  const [zoneOuverte, setZoneOuverte] = useState<string | null>(null);
  const [focusZone, setFocusZone] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState<number | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [conseilIgnore, setConseilIgnore] = useState(false);
  const [message, setMessage] = useState<{ ton: "erreur" | "info"; texte: string } | null>(null);

  const piece = pieces.find((p) => p.piece === choix.piece) ?? pieces[0];
  // Une photo retirée entre-temps ne reste pas choisie.
  const photoId = choix.photoId && etat.photos.some((p) => p.id === choix.photoId) ? choix.photoId : null;
  // L'analyse (un appel vision, compté au dossier) n'est demandée qu'une fois la photo confirmée, à l'écran Matières :
  // pas à chaque carte de pièce touchée à l'écran 1 avec une photo déjà choisie.
  const analyse = useAnalyseEspace(client, ecran === 3 ? photoId : null, piece.piece);
  const urlVignette = useMemo(() => (ref: string) => vignette(client, ref), [client]);
  const urlEchantillon = useMemo(() => (ref: string) => echantillon(client, ref), [client]);

  const appliquer = (transition: { choix: ChoixCreation; ecran: EcranCreation }) => {
    setMessage(null);
    setChoix(transition.choix);
    setEcran(transition.ecran);
  };
  const progression = { pieceChoisie, photoId, generationEnCours: occupe };

  async function nouvellePhoto(fichier: File) {
    if (apercu) return setMessage({ ton: "info", texte: MESSAGE_APERCU });
    setMessage(null);
    setEnvoi(0);
    const { blob, nom: nomFichier } = await reduirePhoto(fichier, { coteMax: COTE_MAX_DOSSIER });
    const avant = new Set(etat.photos.map((p) => p.id));
    try {
      const resultat = await envoyerPhoto(client, blob, nomFichier, (part) => setEnvoi(part));
      if (resultat.espace) onEtat(resultat.espace);
      const arrivee = resultat.espace?.photos.find((p) => !avant.has(p.id));
      if (arrivee) appliquer(reduireCreation(ecran, choix, { type: "photo-choisie", photoId: arrivee.id }));
      else {
        // Une photo seule refusée vaut un 400 (dit plus bas) ; si le CRM répond 200 sans photo nouvelle, l'écran ne reste pas muet.
        const raison = resultat.refusees?.[0]?.split(" : ").slice(1).join(" : ");
        setMessage({ ton: "erreur", texte: `Cette photo n'a pas pu être ajoutée${raison ? ` : ${raison}` : ""}. Choisissez-en une autre.` });
      }
    } catch (erreur) {
      if (erreur instanceof ErreurEspace && erreur.passager) {
        // Gardée dans le téléphone : elle partira seule (onglet Photos), comme les autres.
        await mettreEnFile({ cle: `${Date.now()}-creation`, jeton, blob, nom: nomFichier, ajouteeLe: Date.now() });
        setMessage({ ton: "erreur", texte: "Pas de réseau : votre photo est gardée dans votre téléphone et partira toute seule. En attendant, choisissez une photo déjà envoyée." });
      } else setMessage({ ton: "erreur", texte: erreur instanceof Error ? erreur.message : "Photo refusée." });
    } finally {
      setEnvoi(null);
    }
  }

  async function lancer() {
    // Aperçu depuis le CRM : on le dit d'abord, avant tout contrôle.
    if (apercu) return setMessage({ ton: "info", texte: MESSAGE_APERCU });
    const bloque = raisonDeBlocage(piece, { ...choix, photoId }, zonesMax, analyse);
    if (bloque || !photoId) return setMessage({ ton: "erreur", texte: bloque ?? "Choisissez d'abord la photo sur laquelle faire la simulation." });
    const choisies = zonesChoisies(piece, choix);
    setOccupe(true);
    setMessage(null);
    try {
      const reponse = await client.envoyerJson<{ preparationId: string; restantes: number; attenteEstimeeS?: number; espace: Etat }>("/simulations/creer", "POST", { piece: piece.piece, photoId, zones: choisies.map((z) => ({ zone: z.zone, ref: z.teinte.ref })) });
      try {
        localStorage.removeItem(cleEchec(jeton));
      } catch {
        // stockage indisponible
      }
      onEtat(reponse.espace);
      onLancee({ preparationId: reponse.preparationId, photoId, zones: choisies.map((z) => ({ zone: z.zone, libelle: z.libelle, ref: z.teinte.ref, nom: z.teinte.nom })), attenteEstimeeS: typeof reponse.attenteEstimeeS === "number" ? reponse.attenteEstimeeS : null });
    } catch (erreur) {
      const e = erreur instanceof ErreurEspace ? erreur : new ErreurEspace("Réessayez dans un instant.", 500);
      // Rien n'est parti : ses choix sont gardés pour la prochaine tentative (et seulement pour elle).
      garderEchec(jeton, choix);
      setMessage({ ton: e.raison === "apercu" ? "info" : "erreur", texte: e.status === 0 ? "Pas de réseau : votre simulation n'est pas partie. Vos choix sont gardés : relancez dès le retour du réseau." : e.message });
    } finally {
      setOccupe(false);
    }
  }

  if (!creation) return <Annonce>La création de simulations n&apos;est pas encore ouverte pour votre espace. Appelez CoverSwap&nbsp;: nous l&apos;activons tout de suite.</Annonce>;

  if (!creation.disponible) return <Annonce>La création de simulations est momentanément indisponible. Réessayez un peu plus tard, ou appelez CoverSwap&nbsp;: nous sommes prévenus.</Annonce>;

  const total = creation.gratuites + creation.accordees;
  if (creation.restantes <= 0 && creation.enCours.length === 0) {
    return (
      <Carte className="space-y-3">
        <p className="text-[17px] leading-relaxed font-semibold text-[#1A1A1A]">{texteQuota(0, total)} Demandez-en d&apos;autres à CoverSwap.</p>
        {creation.faitesSite ? <p className="text-[15px] leading-relaxed text-[#5F5A53]">Celles que vous avez faites sur coverswap.fr comptent aussi ({creation.faitesSite}).</p> : null}
        {creation.demandeesLe ? (
          <p className="text-[15.5px] text-[#1F6B45]">Demande envoyée le {dateCourte(creation.demandeesLe)}&nbsp;: CoverSwap vous répond très vite.</p>
        ) : (
          <BoutonPrincipal onClick={onDemanderPlus} disabled={demandeEnCours}>
            {demandeEnCours ? "Envoi…" : "Demander d'autres simulations"}
          </BoutonPrincipal>
        )}
      </Carte>
    );
  }

  if (creation.restantes <= 0) return <Annonce>Votre simulation est en préparation&nbsp;: elle arrive dans « Mes simulations ». C&apos;était votre dernière&nbsp;; vous pourrez en demander d&apos;autres ensuite.</Annonce>;

  const zoneCatalogue = zoneOuverte ? (zonesOrdonnees(piece).find((z) => z.zone === zoneOuverte) ?? null) : null;

  return (
    <div className="space-y-4">
      <FilEtapes etapes={ECRANS_CREATION} courant={ecran} atteignable={(e) => ecranAtteignableCreation(progression, e, ecran)} onAller={(vers) => appliquer(reduireCreation(ecran, choix, { type: "retour", vers }, progression))} verrou={occupe ? "Choix figés pendant le lancement" : null} />

      <div className="min-h-[8px]">{message ? <Annonce ton={message.ton === "erreur" ? "erreur" : "info"}>{message.texte}</Annonce> : null}</div>

      {ecran === 1 ? (
        <EcranPieceEspace
          pieces={pieces}
          valeur={pieceChoisie ? piece.piece : null}
          onChoisir={(code) => {
            setPieceChoisie(true);
            setConseilIgnore(false);
            appliquer(reduireCreation(ecran, choix, { type: "piece-choisie", piece: code }));
          }}
        />
      ) : null}

      {ecran === 2 ? (
        <EcranPhotoEspace
          photos={etat.photos}
          photoId={photoId}
          urlPhoto={(id) => client.url(`/photos/${id}`)}
          envoi={envoi}
          apercu={apercu}
          onApercu={() => setMessage({ ton: "info", texte: MESSAGE_APERCU })}
          onChoisirPhoto={(id) => {
            setConseilIgnore(false);
            appliquer(reduireCreation(ecran, choix, { type: "photo-choisie", photoId: id }));
          }}
          onFichier={(f) => void nouvellePhoto(f)}
          onGarder={() => setEcran(3)}
        />
      ) : null}

      {ecran === 3 && photoId ? (
        <EcranMatieresEspace
          piece={piece}
          choix={{ ...choix, photoId }}
          photo={client.url(`/photos/${photoId}`)}
          analyse={analyse}
          conseilIgnore={conseilIgnore}
          onIgnorerConseil={() => setConseilIgnore(true)}
          onReprendrePhoto={() => appliquer(reduireCreation(ecran, choix, { type: "photo-reprise" }))}
          onOuvrir={setZoneOuverte}
          onRetirer={(zone) => appliquer(reduireCreation(ecran, choix, { type: "teinte-retiree", zone }))}
          focusZone={focusZone}
          urlVignette={urlVignette}
          zonesMax={zonesMax}
          raisonBloque={occupe ? null : raisonDeBlocage(piece, { ...choix, photoId }, zonesMax, analyse)}
          occupe={occupe}
          onLancer={() => void lancer()}
          texteQuota={texteQuota(creation.restantes, total)}
        />
      ) : ecran === 3 ? (
        <div className="space-y-3">
          <Annonce>Commencez par choisir une photo.</Annonce>
          <Bouton onClick={() => setEcran(2)}>Choisir une photo</Bouton>
        </div>
      ) : null}

      <FeuilleCatalogue
        ouverte={Boolean(zoneCatalogue)}
        onFermer={() => setZoneOuverte(null)}
        zone={zoneCatalogue ? { id: zoneCatalogue.zone, libelle: zoneCatalogue.libelle } : { id: "", libelle: "" }}
        autresZones={zoneCatalogue ? zonesOrdonnees(piece).filter((z) => z.zone !== zoneCatalogue.zone).map((z) => ({ id: z.zone, libelle: z.libelle })) : []}
        choisie={zoneCatalogue ? (choix.teintes[zoneCatalogue.zone]?.ref ?? null) : null}
        favoris={favoris}
        onFavori={onFavori}
        urlVignette={urlVignette}
        urlEchantillon={urlEchantillon}
        onChoisir={(t: Teinte, aussi: string[]) => {
          const zone = zoneOuverte;
          setZoneOuverte(null);
          if (!zone) return;
          appliquer(reduireCreation(ecran, choix, { type: "teinte-choisie", zone, teinte: { ref: t.id, nom: t.nom }, aussi }));
          setFocusZone(zone);
        }}
      />
    </div>
  );
}
