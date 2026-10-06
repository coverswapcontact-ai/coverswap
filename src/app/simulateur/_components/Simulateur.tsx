"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bouton } from "@/components/simulation/Bouton";
import { FeuilleCatalogue } from "@/components/simulation/FeuilleCatalogue";
import { FilEtapes } from "@/components/simulation/FilEtapes";
import Turnstile, { TURNSTILE_SITE_KEY, reinitialiserTurnstile } from "@/components/Turnstile";
import { consentementPourEnvoi } from "@/lib/consentement";
import { envoyerEvenement } from "@/lib/evenements-site";
import { adopterParcoursId, obtenirParcoursId } from "@/lib/parcours";
import { phraseRappel, rappelDuCreneau } from "@/lib/rappel";
import { corpsDemandeSimulation, type ExtraDemande } from "@/lib/simulateur/demande";
import { ecranAtteignable, ecranDepuisEtape, reduireEcran, type Ecran } from "@/lib/simulateur/ecrans";
import { changerDeSource, creerEmetteur, lireDepuis, rouvrirGeneration, type Emetteur } from "@/lib/simulateur/entonnoir";
import { PANNES, convertirPhotoParLeCrm, demanderAEtrePrevenu, lancerGeneration, urlImageTravail, type ReponseSuiviComplete } from "@/lib/simulateur/generation-client";
import { messageErreurPhoto, preparerPhoto, type ExempleCharge } from "@/lib/simulateur/photo";
import { lireElementDemande, lireRefDemandee } from "@/lib/simulateur/matiere-demandee";
import { zoneDeLElement } from "@/lib/simulateur/elements";
import { getProject } from "@/lib/simulateur/projets";
import { ETAT_VIDE, MESSAGE_SANS_PHOTO, decisionAuMontage, naissanceDuParcours, rapportPhoto, type EtatAnalyse, type RenduSimulateur } from "@/lib/simulateur/reprise";
import { effacerEtat, lireEtat, sauvegarderEtat, type EtatSimulateur } from "@/lib/simulateur/stockage";
import { pieceDe, titrePiece, type ZonesSimulateur } from "@/lib/simulateur/zones";
import type { ExempleSimulateur } from "@/lib/exemples-simulateur";
import type { TarifsSite } from "@/lib/tarifs-site";
import { acquisitionPourEnvoi, lireOrigine, sourceCourte } from "@/lib/utm";
import { DemandeApresRendu, type DemandeEnvoyee } from "./DemandeApresRendu";
import { EcranGeneration, EcranSansPhoto } from "./EcranGeneration";
import { EcranMatieres } from "./EcranMatieres";
import { EcranPhoto } from "./EcranPhoto";
import { EcranPiece } from "./EcranPiece";
import EcranResultat from "./EcranResultat";
import { FORMULAIRE_VIDE, type Formulaire } from "./Formulaires";
import { useAnalyse } from "./useAnalyse";
import { useFeuilleCatalogue } from "./useFeuilleCatalogue";
import { useMatiereDemandee } from "./useMatiereDemandee";
import { useSondage } from "./useSondage";

/* ─────────────────────────────────────────────────────────────────
   Simulateur (mission 15, partie 4) : quatre écrans — Pièce · Photo ·
   Matières · Résultat — sur le thème clair, le site n'étant plus qu'un client
   du CRM (zones et libellés du CRM, prompt construit par le CRM, génération
   asynchrone suivie par sondage, analyse de la photo dès son chargement). La
   mémoire locale (IndexedDB) garde tout : retour arrière sans perte, reprise
   après fermeture, historique des rendus. Le seul défilement programmé : le
   haut de l'étape quand elle change.
───────────────────────────────────────────────────────────────── */
type Echec = { message: string; raison: string };

/** `tarifs` : les tarifs publics du CRM pour l'estimation après le rendu (mission 16, partie 4) ; null → fourchettes d'`offre.ts`. `exemples` : les pièces d'exemple de l'écran Photo (lot E3). */
export default function Simulateur({ zones, tarifs = null, exemples = [] }: { zones: ZonesSimulateur; tarifs?: TarifsSite | null; exemples?: readonly ExempleSimulateur[] }) {
  const [charge, setCharge] = useState(false);
  const [ecran, setEcran] = useState<Ecran>(1);
  const [etat, setEtat] = useState<EtatSimulateur>(ETAT_VIDE);
  // L'état vide vaut `projet: "cuisine"` (repli) : la carte n'est montrée choisie que si la pièce l'a vraiment été (clic, `?projet=`, accueil, photo en mémoire).
  const [pieceChoisie, setPieceChoisie] = useState(false);
  const [bandeau, setBandeau] = useState<2 | 3 | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [echecGeneration, setEchecGeneration] = useState<Echec | null>(null);
  const [zonesRefusees, setZonesRefusees] = useState<string[]>([]);
  const [messageRefus, setMessageRefus] = useState<string | null>(null);
  const [conseilIgnore, setConseilIgnore] = useState(false);
  const [occupe, setOccupe] = useState<"photo" | "lancement" | "envoi" | null>(null);
  const [jetonCaptcha, setJetonCaptcha] = useState<string | null>(null);
  const [formulaire, setFormulaire] = useState<Formulaire>(FORMULAIRE_VIDE);
  const [envoye, setEnvoye] = useState<(DemandeEnvoyee & { leadId: string | null }) | null>(null);
  const [renduAffiche, setRenduAffiche] = useState<string | null>(null);
  const [fondu, setFondu] = useState(false);
  const haut = useRef<HTMLDivElement>(null);
  const premierEcran = useRef(true);
  const lanceLe = useRef<number>(0);
  const emetteur = useRef<Emetteur>(creerEmetteur((type, meta) => envoyerEvenement(type, meta)));
  /** Mission 16 (partie 3) : le bouton qui a amené ici (`?depuis=accueil-ouverture`…), repris dans le meta de PIECE_CHOISIE. */
  const depuisLien = useRef<string | null>(null);
  const zoneDemandee = useRef<string | null>(null); // lot B6 : la zone de `?element=`, ouverte d'abord à l'écran 3
  /** Mission 16 (partie 4) : ESTIMATION_VUE part une fois par simulation — « Nouvelle simulation » la réarme, comme les étapes de l'entonnoir (`emetteur.reinitialiser`). */
  const estimationVue = useRef(false);

  const projet = useMemo(() => getProject(etat.projet), [etat.projet]);
  const piece = useMemo(() => pieceDe(zones, etat.projet), [zones, etat.projet]);
  const captchaActif = !!TURNSTILE_SITE_KEY;
  const enAttente = !!etat.travailEnCours;
  const mettreAJour = useCallback((maj: Partial<EtatSimulateur>) => setEtat((e) => ({ ...e, ...maj })), []);
  // Lot E1 : la feuille des matières (zone ouverte, focus, favoris, choix d'une teinte) vit dans `useFeuilleCatalogue`.
  const { setZoneOuverte, focusZone, retirer, chargerFavoris, feuille } = useFeuilleCatalogue(piece, etat.selections, mettreAJour, (choisies) => setZonesRefusees((z) => z.filter((id) => !choisies.includes(id))));
  const marquerPiece = (id: string) => emetteur.current.marquer("PIECE_CHOISIE", { projet: id, ...(depuisLien.current ? { depuis: depuisLien.current } : {}) });

  /* ── Reprise de l'état local + pièce demandée dans l'adresse ── */
  useEffect(() => {
    let annule = false;
    (async () => {
      const memoire = await lireEtat();
      // Lu à la main (pas useSearchParams) : le composant reste rendu côté serveur, sans bloc d'attente ni décalage.
      const parametres = new URLSearchParams(window.location.search);
      const demande = parametres.get("projet");
      const reprise = parametres.get("reprise");
      const parcoursDuLien = parametres.get("p");
      depuisLien.current = lireDepuis(parametres.get("depuis"));
      if (annule) return;
      const base = memoire ?? ETAT_VIDE;
      // Une génération en cours fige la pièce : l'adresse ne la change pas (les choix serviraient encore à « Réessayer »).
      const projetInitial = !base.travailEnCours && demande && zones.pieces.some((p) => p.id === demande) ? demande : base.projet;
      const memeProjet = projetInitial === base.projet;
      const decision = decisionAuMontage(base, { reprise, p: parcoursDuLien, choix: parametres.get("choix") === "1" && projetInitial === demande });
      zoneDemandee.current = zoneDeLElement(lireElementDemande(parametres.get("element")), projetInitial);
      const parcoursId = (decision.ecran === "attente" && decision.parcoursId) || base.parcoursId || obtenirParcoursId() || crypto.randomUUID();
      adopterParcoursId(parcoursId);
      // Mission 17 (partie B) : la naissance du parcours ne bouge pas tant que c'est le même (7 jours au plus, `lireEtat`).
      const parcoursNeLe = naissanceDuParcours(memoire, parcoursId);
      // Mission 16 (partie 4) : `?ref=` (depuis /matieres) — la matière est posée à l'écran des matières (`useMatiereDemandee`).
      const repris: EtatSimulateur = { ...base, projet: projetInitial, parcoursId, parcoursNeLe, selections: memeProjet ? base.selections : {}, refDemandee: lireRefDemandee(parametres.get("ref")) ?? base.refDemandee };
      if (decision.ecran === "attente") {
        repris.travailEnCours = decision.travail;
        setEcran(3);
      } else if (decision.ecran === "bandeau") {
        setBandeau(decision.etape);
        setEcran(1);
      } else {
        setEcran(decision.pieceChoisie ? 2 : ecranDepuisEtape(decision.etape, repris));
      }
      // Le retour `?suite=1` du module photo de l'accueil (mission 15, retiré au lot B6) n'est plus lu (relecture des lots B et C).
      setPieceChoisie(!!repris.photo || (!!demande && projetInitial === demande));
      setRenduAffiche(repris.rendus[repris.rendus.length - 1]?.travailId ?? null);
      setEtat(repris);
      chargerFavoris();
      setCharge(true);
      envoyerEvenement("PAGE_VUE", { projet: projetInitial, reprise: !!memoire?.photo, travail_en_cours: !!repris.travailEnCours });
      if (decision.ecran === "direct" && decision.pieceChoisie) marquerPiece(projetInitial);
    })();
    return () => {
      annule = true;
    };
    // Une seule lecture au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (charge) void sauvegarderEtat(etat);
  }, [etat, charge]);

  /* ── Le seul défilement programmé : le haut de l'étape quand elle change ── */
  useEffect(() => {
    if (!charge) return;
    if (premierEcran.current) {
      premierEcran.current = false;
      return;
    }
    const cible = haut.current;
    if (!cible) return;
    const reduit = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const y = cible.getBoundingClientRect().top + window.scrollY - 12;
    if (window.scrollY > y) window.scrollTo({ top: Math.max(0, y), behavior: reduit ? "auto" : "smooth" });
    // Rien ne bouge quand l'étape change sans que la page ait défilé.
  }, [ecran, charge]);

  /* ── Analyse de la photo dès son chargement ── */
  const surAnalyse = useCallback((analyse: EtatAnalyse | null) => setEtat((e) => ({ ...e, analyse })), []);
  useAnalyse(etat.photo, etat.parcoursId, etat.projet, etat.analyse, surAnalyse);

  /* ── Suivi du travail en cours ── */
  const sondage = useSondage(etat.travailEnCours, etat.parcoursId, {
    onPret: (travailId: string, reponse: ReponseSuiviComplete) => {
      setEtat((e) => {
        if (!e.parcoursId) return { ...e, travailEnCours: null };
        // Lot E3 : un rendu fait sur une pièce d'exemple le garde (« Ambiance · avant / après », note du devis).
        const rendu: RenduSimulateur = { travailId, simulationSiteId: reponse.simulationSiteId ?? null, urlApres: urlImageTravail(travailId, e.parcoursId, "apres"), urlAvant: reponse.imageAvant ? urlImageTravail(travailId, e.parcoursId, "avant") : null, references: reponse.references ?? [], le: Date.now(), ...(e.exemple ? { exemple: e.exemple } : {}) };
        return { ...e, travailEnCours: null, rendus: [...e.rendus.filter((r) => r.travailId !== travailId), rendu] };
      });
      setRenduAffiche(travailId);
      setEchecGeneration(null);
      setFondu(true);
      setEcran(4);
      emetteur.current.marquer("RESULTAT_VU", { projet: projet.id, duree_ms: lanceLe.current ? Date.now() - lanceLe.current : undefined, garde: !!reponse.simulationSiteId });
    },
    onEchec: (_travailId, raison, message) => {
      mettreAJour({ travailEnCours: null });
      setEchecGeneration({ raison, message: etat.photo ? message : MESSAGE_SANS_PHOTO });
      envoyerEvenement("SIMULATION_ECHEC", { etape: "generation", raison, duree_ms: lanceLe.current ? Date.now() - lanceLe.current : undefined });
    },
  });

  /* ── Écran 1 : la pièce ou un élément précis (PIECE_CHOISIE par `marquerPiece`, au clic ou au montage pour un picto de l'accueil) ── */
  const choisirPiece = (id: string, element: string | null = null) => {
    const transition = reduireEcran(ecran, { type: "piece-choisie", projet: id, projetPrecedent: etat.projet }, etat);
    // Autre pièce : ses matières ne valent plus, et l'analyse non plus (elle a été faite pour l'autre pièce ; `useAnalyse` la redemande, le CRM répond aussitôt s'il la connaît).
    mettreAJour({ projet: id, ...(transition.viderSelections ? { selections: {}, analyse: null } : {}) });
    setPieceChoisie(true);
    setBandeau(null);
    effacerEchec();
    // Lot E2 : un élément précis (« Plan de travail »…) ouvre d'abord sa zone à l'écran des matières, comme `?element=`.
    zoneDemandee.current = zoneDeLElement(element, id);
    marquerPiece(id);
    setEcran(transition.ecran);
  };

  /* ── Un échec de génération ou un refus 409 ne suit pas la personne quand elle change d'écran ── */
  const effacerEchec = () => {
    setEchecGeneration(null);
    setZonesRefusees([]);
    setMessageRefus(null);
  };

  /* ── Écran 2 : la photo (ou une pièce d'exemple, lot E3 : même chemin, sa pièce choisie avec elle) ── */
  const choisirPhoto = async (file: File, exemple?: ExempleCharge) => {
    setErreur(null);
    setOccupe("photo");
    try {
      let dataUrl: string;
      let poidsKo = 0;
      let largeur = 0;
      let hauteur = 0;
      const prete = await preparerPhoto(file);
      if ("aConvertir" in prete) {
        // HEIC que ce navigateur ne décode pas : le CRM le convertit (rien n'est gardé de son côté).
        const conversion = await convertirPhotoParLeCrm(prete.file, etat.parcoursId ?? obtenirParcoursId());
        if (!conversion.ok) throw new Error(conversion.raison === "reseau" ? "reseau" : "conversion");
        dataUrl = conversion.dataUrl;
        largeur = conversion.largeur;
        hauteur = conversion.hauteur;
      } else {
        dataUrl = prete.dataUrl;
        poidsKo = prete.poidsKo;
        largeur = prete.largeur;
        hauteur = prete.hauteur;
      }
      // Les dimensions sont gardées avec la photo : les écrans réservent son rapport avant de la décoder.
      const autrePiece = !!exemple && exemple.piece !== etat.projet;
      mettreAJour({ photo: dataUrl, photoLargeur: largeur > 0 ? largeur : null, photoHauteur: hauteur > 0 ? hauteur : null, analyse: null, exemple: exemple?.id ?? null, ...(autrePiece ? { projet: exemple.piece, selections: {} } : {}) });
      setBandeau(null);
      setConseilIgnore(false);
      effacerEchec();
      changerDeSource(emetteur.current, { exemple: etat.exemple ?? null, projet: etat.projet }, { exemple: exemple?.id ?? null, projet: exemple?.piece ?? etat.projet });
      emetteur.current.marquer("PHOTO_CHARGEE", { projet: exemple?.piece ?? etat.projet, poids_ko: poidsKo, largeur, ...(exemple ? { exemple: exemple.id } : {}) });
      setEcran(reduireEcran(ecran, { type: "photo-chargee" }, etat).ecran);
    } catch (e) {
      const code = e instanceof Error ? e.message : "illisible";
      setErreur(code === "reseau" ? "Connexion interrompue pendant l'envoi de la photo : réessayez." : messageErreurPhoto(code));
      envoyerEvenement("SIMULATION_ECHEC", { etape: "photo", raison: code });
    } finally {
      setOccupe(null);
    }
  };

  /* ── Écran 3 : les matières ── */
  useMatiereDemandee(ecran === 3 && !!etat.photo && !enAttente && !echecGeneration, etat, piece, mettreAJour, zoneDemandee, setZoneOuverte);
  const selectionsActives = piece.zones.map((z) => ({ zone: z, sel: etat.selections[z.id] ?? null })).filter((x) => x.sel);
  const raisonBloque = selectionsActives.length === 0 ? "Choisissez au moins une matière" : captchaActif && !jetonCaptcha ? "Vérification anti-robot en cours…" : null;
  const peutGenerer = !raisonBloque && !!etat.photo && occupe === null && !enAttente;
  const attenteReessai = captchaActif && !jetonCaptcha ? "Vérification anti-robot en cours…" : null;


  const generer = async () => {
    if (!etat.photo || !etat.parcoursId || !peutGenerer) return;
    setErreur(null);
    setEchecGeneration(null);
    setMessageRefus(null);
    setOccupe("lancement");
    lanceLe.current = Date.now();
    const origine = lireOrigine();
    emetteur.current.marquer("GENERATION_LANCEE", { projet: projet.id, zones: selectionsActives.length });
    try {
      const lancement = await lancerGeneration({
        projetId: projet.id,
        parcoursId: etat.parcoursId,
        turnstileToken: jetonCaptcha,
        selections: selectionsActives.map(({ zone, sel }) => ({ surface: zone.id, ref: sel!.ref })),
        photo: etat.photo,
        page: window.location.pathname,
        source: sourceCourte(origine) ?? null,
        campagne: origine.campagne,
        exemple: etat.exemple,
      });
      if (lancement.ok) {
        mettreAJour({ travailEnCours: { travailId: lancement.travailId, lanceLe: Date.now(), attenteEstimeeS: lancement.attenteEstimeeS } });
      } else if (lancement.raison === "zone-non-visible") {
        // Le CRM refuse avant de dépenser : la zone est marquée, le message est affiché tel quel, rien d'autre ne change.
        setZonesRefusees(lancement.zones ?? []);
        setMessageRefus(lancement.message);
        envoyerEvenement("SIMULATION_ECHEC", { etape: "lancement", raison: lancement.raison });
      } else {
        setEchecGeneration({ message: lancement.message, raison: lancement.raison });
        envoyerEvenement("SIMULATION_ECHEC", { etape: "lancement", raison: lancement.raison });
      }
    } finally {
      setOccupe(null);
      // Un jeton Turnstile ne sert qu'une fois : le widget en redemande un pour le prochain appel serveur.
      reinitialiserTurnstile();
      setJetonCaptcha(null);
    }
  };

  const prevenir = async (demande: { email?: string; telephone?: string }) => {
    if (!etat.travailEnCours || !etat.parcoursId) return { ok: false, message: "La simulation n'est plus en cours." };
    return demanderAEtrePrevenu({ travailId: etat.travailEnCours.travailId, parcoursId: etat.parcoursId, ...demande });
  };

  /* ── Écran 4 : demande de devis (ou, après un échec, « simulation à la main ») ── */
  const rendu = etat.rendus.find((r) => r.travailId === renduAffiche) ?? etat.rendus[etat.rendus.length - 1] ?? null;
  const references = () => selectionsActives.map(({ zone, sel }) => ({ zone: zone.id, libelle: zone.libelle, ref: sel!.ref, nom: sel!.nom }));
  const envoyer = async (e: React.FormEvent | null, depuisEchec = false, extra?: ExtraDemande) => {
    e?.preventDefault();
    if (depuisEchec ? !etat.photo : !rendu) return;
    // Après un échec, la demande décrit les choix COURANTS et part avec la photo — jamais les références d'un rendu précédent.
    const refs = !depuisEchec && rendu?.references.length ? rendu.references : references();
    setErreur(null);
    setOccupe("envoi");
    try {
      const corps = corpsDemandeSimulation({
        formulaire,
        connus: { ville: etat.ville, codePostal: etat.codePostal },
        projet: projet.id,
        parcoursId: etat.parcoursId,
        simulationIds: etat.rendus.map((r) => r.simulationSiteId).filter((id): id is string => !!id),
        references: refs,
        echec: depuisEchec && etat.photo ? { photo: etat.photo, raison: echecGeneration?.raison ?? "inconnue" } : null,
        exemple: depuisEchec ? etat.exemple : rendu?.exemple,
        echantillons: !depuisEchec && !!formulaire.echantillons,
        jetonCaptcha,
        acquisition: acquisitionPourEnvoi(),
        consentement: consentementPourEnvoi(formulaire.consentement, "simulateur"),
        page: window.location.pathname,
        extra,
      });
      const res = await fetch("/api/simulation/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreur(data.error || "Envoi impossible pour le moment. Votre photo et vos choix sont conservés : réessayez.");
        envoyerEvenement("FORMULAIRE_ECHEC", { formulaire: "simulateur", statut: res.status, raison: data.reason });
        return;
      }
      // Le rappel daté par le CRM (sinon le même calcul ici) ; la ville connue ne sera plus redemandée.
      const rappel = typeof data.rappelLe === "string" ? new Date(data.rappelLe) : extra?.rappelCreneau ? rappelDuCreneau(extra.rappelCreneau, new Date()) : null;
      setEnvoye({ leadId: data.leadId ?? null, lienEspace: typeof data.lienEspace === "string" ? data.lienEspace : null, phraseRappel: rappel && !Number.isNaN(rappel.getTime()) ? phraseRappel(rappel, new Date()) : null });
      if (corps.ville && corps.codePostal) mettreAJour({ ville: String(corps.ville), codePostal: String(corps.codePostal) });
      envoyerEvenement("DEVIS_DEMANDE", { formulaire: "simulateur", projet: projet.id, simulations: etat.rendus.length, sans_rendu: depuisEchec });
      if (extra?.rappelCreneau) envoyerEvenement("RAPPEL_DEMANDE", { creneau: extra.rappelCreneau, projet: projet.id });
    } catch {
      setErreur("Connexion interrompue. Votre photo et vos choix sont conservés : réessayez.");
      envoyerEvenement("FORMULAIRE_ECHEC", { formulaire: "simulateur", raison: "reseau" });
    } finally {
      setOccupe(null);
      reinitialiserTurnstile();
      setJetonCaptcha(null);
    }
  };

  const recommencer = async () => {
    await effacerEtat();
    // Même parcours : la ville et le code postal déjà donnés restent (le formulaire ne les redemande pas).
    setEtat({ ...ETAT_VIDE, projet: etat.projet, parcoursId: etat.parcoursId, parcoursNeLe: etat.parcoursNeLe, ville: etat.ville, codePostal: etat.codePostal });
    emetteur.current.reinitialiser();
    estimationVue.current = false;
    setPieceChoisie(false);
    setBandeau(null);
    setRenduAffiche(null);
    setEnvoye(null);
    setErreur(null);
    effacerEchec();
    setEcran(1);
  };

  /** Une nouvelle génération (« Réessayer », « Essayer d'autres matières ») recompte une génération et un résultat vus, pas la pièce ni la photo. */
  const rouvrir = () => {
    emetteur.current = rouvrirGeneration(emetteur.current, (type, meta) => envoyerEvenement(type, meta));
  };

  const autresMatieres = () => {
    effacerEchec();
    rouvrir();
    setEcran(reduireEcran(ecran, { type: "autres-matieres" }, etat).ecran);
  };

  /** Après un échec (même « réessayez dans quelques minutes ») : l'écran des matières reste atteignable, sans recharger la page. */
  const revenirAuxMatieres = () => {
    effacerEchec();
    setEcran(reduireEcran(ecran, { type: "autres-matieres" }, etat).ecran);
  };

  const allerA = (cible: Ecran) => {
    const transition = reduireEcran(ecran, { type: "retour", vers: cible }, { ...etat, generationEnCours: occupe === "lancement" });
    if (transition.ecran === ecran) return;
    // Le retour arrière ne garde pas l'écran d'échec ni le refus 409 : la photo et les choix, eux, restent.
    effacerEchec();
    setEcran(transition.ecran);
  };

  return (
    <div ref={haut} className="scroll-mt-4">
      <FilEtapes courant={ecran} atteignable={(e) => ecranAtteignable({ ...etat, generationEnCours: occupe === "lancement" }, e, ecran)} onAller={allerA} verrou={enAttente ? "Choix figés pendant la génération" : null} />

      {/* Une seule région d'annonce : le `role="alert"` (assertif) — pas de `aria-live` autour, sinon le message est lu deux fois. */}
      <div className="min-h-[8px]">
        {erreur ? (
          <div role="alert" className="mt-4 rounded-[var(--rayon-sm)] border border-alerte-texte/40 bg-alerte-fond px-4 py-3 text-[14.5px] leading-relaxed text-alerte-texte">
            {erreur}
          </div>
        ) : null}
      </div>

      {/* Un parcours récent existe : on propose de le reprendre, sans rien écraser. */}
      {bandeau && etat.photo ? (
        <div className="mt-4 mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[var(--rayon-md)] border border-trait bg-white p-3">
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-[var(--rayon-sm)] bg-fond-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={etat.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15.5px] font-semibold text-encre">Reprendre ma simulation</p>
            <p className="text-[13px] text-encre-2">{bandeau === 3 ? "Votre dernier rendu vous attend." : "Votre photo et vos choix sont conservés."}</p>
          </div>
          {/* Sur un téléphone, les deux boutons prennent une rangée entière sous la vignette et le texte. */}
          <div className="flex w-full shrink-0 gap-2 sm:w-auto">
            <Bouton
              onClick={() => {
                setBandeau(null);
                setEcran(ecranDepuisEtape(bandeau, etat));
              }}
              className="flex-1 px-4 sm:flex-none"
            >
              Reprendre
            </Bouton>
            <Bouton variante="discret" className="flex-1 sm:flex-none" onClick={() => void recommencer()}>
              Recommencer
            </Bouton>
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        {ecran === 1 ? <EcranPiece zones={zones} projet={charge && pieceChoisie ? etat.projet : null} onChoisir={choisirPiece} /> : null}

        {ecran === 2 ? (
          <EcranPhoto
            projet={projet}
            photo={etat.photo}
            rapport={rapportPhoto(etat)}
            occupe={occupe === "photo"}
            onFichier={(f, exemple) => void choisirPhoto(f, exemple)}
            exemples={exemples}
            onGarder={() => {
              effacerEchec();
              setEcran(3);
            }}
          />
        ) : null}

        {ecran === 3 && (enAttente || echecGeneration) ? (
          <EcranGeneration
            piece={piece}
            photo={etat.photo}
            selections={etat.selections}
            analyse={etat.analyse}
            sondage={sondage}
            travail={etat.travailEnCours}
            echec={echecGeneration}
            peutReessayer={!!echecGeneration && !PANNES.includes(echecGeneration.raison) && !!etat.photo && selectionsActives.length > 0}
            attenteReessai={attenteReessai}
            onReessayer={() => {
              rouvrir();
              void generer();
            }}
            onPrevenir={enAttente ? prevenir : undefined}
            envoye={!!envoye}
            formulaire={formulaire}
            onFormulaire={setFormulaire}
            avecVille={!(etat.ville && etat.codePostal)}
            envoiEnCours={occupe === "envoi"}
            onEnvoyer={(e) => void envoyer(e, true)}
            onRevenir={revenirAuxMatieres}
            onNouvelle={() => {
              effacerEchec();
              setEcran(2);
            }}
            onJeton={setJetonCaptcha}
            exemple={etat.exemple}
          />
        ) : null}

        {ecran === 3 && !enAttente && !echecGeneration ? (
          etat.photo ? (
            <EcranMatieres
              piece={piece}
              photo={etat.photo}
              rapport={rapportPhoto(etat)}
              selections={etat.selections}
              analyse={etat.analyse}
              conseilIgnore={conseilIgnore}
              onIgnorerConseil={() => setConseilIgnore(true)}
              onReprendrePhoto={() => setEcran(2)}
              onOuvrir={setZoneOuverte}
              onRetirer={retirer}
              focusZone={focusZone}
              zonesRefusees={zonesRefusees}
              messageRefus={messageRefus}
              peutGenerer={peutGenerer}
              raisonBloque={raisonBloque}
              occupe={occupe === "lancement"}
              onGenerer={() => void generer()}
              zonesMax={zones.zonesMax}
              captcha={<Turnstile action="simulateur" theme="light" onToken={setJetonCaptcha} />}
            />
          ) : (
            <EcranSansPhoto onPhoto={() => setEcran(2)} />
          )
        ) : null}

        {ecran === 4 && rendu ? (
          <EcranResultat rendu={rendu} rendus={etat.rendus} photo={etat.photo} titre={titrePiece(zones, etat.projet)} fondu={fondu} onFonduFini={() => setFondu(false)} onChoisirRendu={(id) => { setFondu(false); setRenduAffiche(id); }} onAutresMatieres={autresMatieres} selections={etat.selections} onEchantillons={envoye ? undefined : () => setFormulaire((f) => ({ ...f, echantillons: true }))}>
            <DemandeApresRendu
              projet={projet.id}
              rendu={rendu}
              tarifs={tarifs}
              formulaire={formulaire}
              onFormulaire={setFormulaire}
              avecVille={!(etat.ville && etat.codePostal)}
              occupe={occupe === "envoi"}
              envoye={envoye}
              onEnvoyer={(extra) => void envoyer(null, false, extra)}
              onEstimationVue={(meta) => {
                if (estimationVue.current) return;
                estimationVue.current = true;
                envoyerEvenement("ESTIMATION_VUE", { ...meta, projet: projet.id });
              }}
              captcha={<Turnstile action="simulateur-devis" theme="light" onToken={setJetonCaptcha} />}
              onRecommencer={() => void recommencer()}
            />
          </EcranResultat>
        ) : null}
      </div>

      {feuille ? <FeuilleCatalogue {...feuille} /> : null}
    </div>
  );
}
