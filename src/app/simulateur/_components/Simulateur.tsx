"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bouton } from "@/components/simulation/Bouton";
import EcranAttente, { type FilmChoisi } from "@/components/simulation/EcranAttente";
import { FeuilleCatalogue, type Teinte } from "@/components/simulation/FeuilleCatalogue";
import { FilEtapes } from "@/components/simulation/FilEtapes";
import Turnstile, { TURNSTILE_SITE_KEY, reinitialiserTurnstile } from "@/components/Turnstile";
import { consentementPourEnvoi } from "@/lib/consentement";
import { ENTREPRISE } from "@/lib/entreprise";
import { envoyerEvenement } from "@/lib/evenements-site";
import { DELAI_REPONSE } from "@/lib/offre";
import { adopterParcoursId, obtenirParcoursId } from "@/lib/parcours";
import { ecranAtteignable, ecranDepuisEtape, reduireEcran, type Ecran } from "@/lib/simulateur/ecrans";
import { creerEmetteur, lireDepuis, rouvrirGeneration, type Emetteur } from "@/lib/simulateur/entonnoir";
import { PANNES, convertirPhotoParLeCrm, demanderAEtrePrevenu, lancerGeneration, urlImageTravail, urlEchantillon, urlVignette, type ReponseSuiviComplete } from "@/lib/simulateur/generation-client";
import { messageErreurPhoto, preparerPhoto } from "@/lib/simulateur/photo";
import { getProject } from "@/lib/simulateur/projets";
import { ATTENTE_PAR_DEFAUT_S, ETAT_VIDE, MESSAGE_SANS_PHOTO, decisionAuMontage, rapportPhoto, type EtatAnalyse, type RenduSimulateur } from "@/lib/simulateur/reprise";
import { effacerEtat, lireEtat, sauvegarderEtat, type EtatSimulateur } from "@/lib/simulateur/stockage";
import { composantesDe, pieceDe, titrePiece, type ZonesSimulateur } from "@/lib/simulateur/zones";
import { acquisitionPourEnvoi, lireOrigine, sourceCourte } from "@/lib/utm";
import { EcranMatieres } from "./EcranMatieres";
import { EcranPhoto } from "./EcranPhoto";
import { EcranPiece } from "./EcranPiece";
import EcranResultat from "./EcranResultat";
import { ChampsContact, FORMULAIRE_VIDE, type Formulaire } from "./Formulaires";
import { useAnalyse } from "./useAnalyse";
import { useFavoris } from "./useFavoris";
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
type Selections = EtatSimulateur["selections"];
type Echec = { message: string; raison: string };

export default function Simulateur({ zones }: { zones: ZonesSimulateur }) {
  const [charge, setCharge] = useState(false);
  const [ecran, setEcran] = useState<Ecran>(1);
  const [etat, setEtat] = useState<EtatSimulateur>(ETAT_VIDE);
  // L'état vide vaut `projet: "cuisine"` (repli) : la carte n'est montrée choisie que si la pièce l'a vraiment été (clic, `?projet=`, accueil, photo en mémoire).
  const [pieceChoisie, setPieceChoisie] = useState(false);
  const [bandeau, setBandeau] = useState<2 | 3 | null>(null);
  const [zoneOuverte, setZoneOuverte] = useState<string | null>(null);
  const [focusZone, setFocusZone] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [echecGeneration, setEchecGeneration] = useState<Echec | null>(null);
  const [zonesRefusees, setZonesRefusees] = useState<string[]>([]);
  const [messageRefus, setMessageRefus] = useState<string | null>(null);
  const [conseilIgnore, setConseilIgnore] = useState(false);
  const [occupe, setOccupe] = useState<"photo" | "lancement" | "envoi" | null>(null);
  const [jetonCaptcha, setJetonCaptcha] = useState<string | null>(null);
  const [formulaire, setFormulaire] = useState<Formulaire>(FORMULAIRE_VIDE);
  const [envoye, setEnvoye] = useState<{ leadId: string | null; simulations: number } | null>(null);
  const [renduAffiche, setRenduAffiche] = useState<string | null>(null);
  const [fondu, setFondu] = useState(false);
  const { favoris, charger: chargerFavoris, basculer: basculerFavori } = useFavoris();
  const haut = useRef<HTMLDivElement>(null);
  const premierEcran = useRef(true);
  const lanceLe = useRef<number>(0);
  const emetteur = useRef<Emetteur>(creerEmetteur((type, meta) => envoyerEvenement(type, meta)));
  /** Mission 16 (partie 3) : le bouton qui a amené ici (`?depuis=accueil-ouverture`…), repris dans le meta de PIECE_CHOISIE. */
  const depuisLien = useRef<string | null>(null);

  const projet = useMemo(() => getProject(etat.projet), [etat.projet]);
  const piece = useMemo(() => pieceDe(zones, etat.projet), [zones, etat.projet]);
  const captchaActif = !!TURNSTILE_SITE_KEY;
  const enAttente = !!etat.travailEnCours;
  const mettreAJour = useCallback((maj: Partial<EtatSimulateur>) => setEtat((e) => ({ ...e, ...maj })), []);

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
      const depuisAccueil = parametres.get("suite") === "1";
      depuisLien.current = lireDepuis(parametres.get("depuis"));
      if (annule) return;
      const base = memoire ?? ETAT_VIDE;
      // Une génération en cours fige la pièce : l'adresse ne la change pas (les choix serviraient encore à « Réessayer »).
      const projetInitial = !base.travailEnCours && demande && zones.pieces.some((p) => p.id === demande) ? demande : base.projet;
      const memeProjet = projetInitial === base.projet;
      const decision = decisionAuMontage(base, { reprise, p: parcoursDuLien, depuisAccueil });
      const parcoursId = (decision.ecran === "attente" && decision.parcoursId) || base.parcoursId || obtenirParcoursId() || crypto.randomUUID();
      adopterParcoursId(parcoursId);
      const repris: EtatSimulateur = { ...base, projet: projetInitial, parcoursId, selections: memeProjet ? base.selections : {} };
      if (decision.ecran === "attente") {
        repris.travailEnCours = decision.travail;
        setEcran(3);
      } else if (decision.ecran === "bandeau") {
        setBandeau(decision.etape);
        setEcran(1);
      } else {
        setEcran(ecranDepuisEtape(decision.etape, repris));
      }
      if (depuisAccueil) {
        // Le module d'accueil vient d'émettre PIECE_CHOISIE et PHOTO_CHARGEE : ici, elles comptent comme déjà émises (jamais deux fois par parcours).
        emetteur.current = creerEmetteur((type, meta) => envoyerEvenement(type, meta), ["PIECE_CHOISIE", ...(repris.photo ? (["PHOTO_CHARGEE"] as const) : [])]);
      }
      setPieceChoisie(depuisAccueil || !!repris.photo || (!!demande && projetInitial === demande));
      setRenduAffiche(repris.rendus[repris.rendus.length - 1]?.travailId ?? null);
      setEtat(repris);
      chargerFavoris();
      setCharge(true);
      envoyerEvenement("PAGE_VUE", { projet: projetInitial, reprise: !!memoire?.photo, travail_en_cours: !!repris.travailEnCours });
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
        const rendu: RenduSimulateur = { travailId, simulationSiteId: reponse.simulationSiteId ?? null, urlApres: urlImageTravail(travailId, e.parcoursId, "apres"), urlAvant: reponse.imageAvant ? urlImageTravail(travailId, e.parcoursId, "avant") : null, references: reponse.references ?? [], le: Date.now() };
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

  /* ── Écran 1 : la pièce ── */
  const choisirPiece = (id: string) => {
    const transition = reduireEcran(ecran, { type: "piece-choisie", projet: id, projetPrecedent: etat.projet }, etat);
    // Autre pièce : ses matières ne valent plus, et l'analyse non plus (elle a été faite pour l'autre pièce ; `useAnalyse` la redemande, le CRM répond aussitôt s'il la connaît).
    mettreAJour({ projet: id, ...(transition.viderSelections ? { selections: {}, analyse: null } : {}) });
    setPieceChoisie(true);
    setBandeau(null);
    effacerEchec();
    emetteur.current.marquer("PIECE_CHOISIE", { projet: id, ...(depuisLien.current ? { depuis: depuisLien.current } : {}) });
    setEcran(transition.ecran);
  };

  /* ── Un échec de génération ou un refus 409 ne suit pas la personne quand elle change d'écran ── */
  const effacerEchec = () => {
    setEchecGeneration(null);
    setZonesRefusees([]);
    setMessageRefus(null);
  };

  /* ── Écran 2 : la photo ── */
  const choisirPhoto = async (file: File) => {
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
      mettreAJour({ photo: dataUrl, photoLargeur: largeur > 0 ? largeur : null, photoHauteur: hauteur > 0 ? hauteur : null, analyse: null });
      setBandeau(null);
      setConseilIgnore(false);
      effacerEchec();
      emetteur.current.marquer("PHOTO_CHARGEE", { projet: etat.projet, poids_ko: poidsKo, largeur });
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
  const selectionsActives = piece.zones.map((z) => ({ zone: z, sel: etat.selections[z.id] ?? null })).filter((x) => x.sel);
  const films: FilmChoisi[] = selectionsActives.map(({ zone, sel }) => ({ zone: zone.id, libelle: zone.libelle, nom: sel!.nom, image: urlVignette(sel!.ref) }));
  const raisonBloque = selectionsActives.length === 0 ? "Choisissez au moins une matière" : captchaActif && !jetonCaptcha ? "Vérification anti-robot en cours…" : null;
  const peutGenerer = !raisonBloque && !!etat.photo && occupe === null && !enAttente;
  const attenteReessai = captchaActif && !jetonCaptcha ? "Vérification anti-robot en cours…" : null;

  const choisirTeinte = (zoneId: string, teinte: Teinte, aussi: string[]) => {
    const suivantes: Selections = { ...etat.selections };
    for (const id of [zoneId, ...aussi]) {
      suivantes[id] = { ref: teinte.id, nom: teinte.nom, famille: teinte.famille, finition: teinte.finition, categorie: teinte.categorie, tags: teinte.tags, image: teinte.image };
      // « Façades (toutes) » et « Meubles hauts / bas » couvrent les mêmes meubles : le dernier choix l'emporte.
      for (const autre of piece.zones.find((z) => z.id === id)?.exclut ?? []) suivantes[autre] = null;
    }
    mettreAJour({ selections: suivantes });
    setZonesRefusees((z) => z.filter((id) => id !== zoneId && !aussi.includes(id)));
    setZoneOuverte(null);
    setFocusZone(null);
    // Le focus revient sur « Modifier » de la zone, sans défilement (posé après la fermeture de la feuille).
    window.setTimeout(() => setFocusZone(zoneId), 0);
  };
  const retirer = (zoneId: string) => mettreAJour({ selections: { ...etat.selections, [zoneId]: null } });

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
  const envoyer = async (e: React.FormEvent, depuisEchec = false) => {
    e.preventDefault();
    if (depuisEchec ? !etat.photo : !rendu) return;
    // Après un échec, la demande décrit les choix COURANTS et part avec la photo — jamais les références d'un rendu précédent.
    const refs = !depuisEchec && rendu?.references.length ? rendu.references : references();
    setErreur(null);
    setOccupe("envoi");
    try {
      const res = await fetch("/api/simulation/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formulaire,
          project_type: projet.id,
          parcoursId: etat.parcoursId,
          // Toutes les simulations du parcours : le CRM les a, avec leurs images.
          simulationIds: etat.rendus.map((r) => r.simulationSiteId).filter((id): id is string => !!id),
          referenceChoisie: refs[0]?.ref,
          references: refs.map((r) => `${r.libelle} : ${r.ref} (${r.nom})`).join(" | "),
          ...(depuisEchec ? { photoAvant: etat.photo, simulationEchouee: echecGeneration?.raison ?? "inconnue" } : {}),
          turnstileToken: jetonCaptcha,
          ...acquisitionPourEnvoi(),
          formulaire: `simulateur · ${window.location.pathname}`,
          ...consentementPourEnvoi(formulaire.consentement, "simulateur"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreur(data.error || "Envoi impossible pour le moment. Votre photo et vos choix sont conservés : réessayez.");
        envoyerEvenement("FORMULAIRE_ECHEC", { formulaire: "simulateur", statut: res.status, raison: data.reason });
        return;
      }
      setEnvoye({ leadId: data.leadId ?? null, simulations: data.simulations ?? 0 });
      envoyerEvenement("DEVIS_DEMANDE", { formulaire: "simulateur", projet: projet.id, simulations: etat.rendus.length, sans_rendu: depuisEchec });
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
    setEtat({ ...ETAT_VIDE, projet: etat.projet, parcoursId: etat.parcoursId });
    emetteur.current.reinitialiser();
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

  const formulaireSecours = (
    <form onSubmit={(e) => void envoyer(e, true)} className="space-y-4 border-t border-trait pt-5">
      <div>
        <h3 className="font-display text-[18px] font-semibold text-encre">Recevoir ma simulation et un devis par e-mail</h3>
        <p className="text-[14.5px] leading-relaxed text-encre-2">Nous faisons la simulation pour vous à partir de cette photo et de vos choix. Devis gratuit {DELAI_REPONSE}, sans engagement.</p>
      </div>
      <ChampsContact prefixe="echec" formulaire={formulaire} onChange={setFormulaire} />
      <Bouton type="submit" plein occupe={occupe === "envoi"} libelleOccupe="Envoi…">
        Envoyer ma photo et recevoir ma simulation
      </Bouton>
    </form>
  );

  const lecturePhoto = etat.analyse?.statut === "PRETE" && etat.analyse.zonesVisibles.length > 0 ? `Vu sur votre photo : ${etat.analyse.zonesVisibles.map((id) => piece.zones.find((z) => z.id === id)?.libelle ?? id).join(", ")}.` : null;
  const zoneCatalogue = zoneOuverte ? piece.zones.find((z) => z.id === zoneOuverte) ?? null : null;

  return (
    <div ref={haut} className="scroll-mt-4">
      <FilEtapes courant={ecran} atteignable={(e) => ecranAtteignable({ ...etat, generationEnCours: occupe === "lancement" }, e, ecran)} onAller={allerA} verrou={enAttente ? "Choix figés pendant la génération" : null} />

      {/* Une seule région d'annonce : le `role="alert"` (assertif) — pas de `aria-live` autour, sinon le message est lu deux fois. */}
      <div className="min-h-[8px]">
        {erreur ? (
          <div role="alert" className="mt-4 rounded-[var(--rayon-sm)] border border-accent/40 bg-accent-fond px-4 py-3 text-[14.5px] leading-relaxed text-accent-texte">
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
            onFichier={(f) => void choisirPhoto(f)}
            onGarder={() => {
              effacerEchec();
              setEcran(3);
            }}
          />
        ) : null}

        {ecran === 3 && (enAttente || echecGeneration) ? (
          <EcranAttente
            photo={etat.photo}
            films={films}
            statut={echecGeneration ? "ECHEC" : (sondage?.statut ?? "EN_ATTENTE")}
            etape={sondage?.etape ?? null}
            attenteEstimeeS={sondage?.attenteEstimeeS ?? etat.travailEnCours?.attenteEstimeeS ?? ATTENTE_PAR_DEFAUT_S}
            horsLigne={sondage?.horsLigne ?? false}
            echec={echecGeneration}
            peutReessayer={!!echecGeneration && !PANNES.includes(echecGeneration.raison) && !!etat.photo && selectionsActives.length > 0}
            attenteReessai={attenteReessai}
            onReessayer={() => {
              rouvrir();
              void generer();
            }}
            onPrevenir={enAttente ? prevenir : undefined}
            lecturePhoto={lecturePhoto}
          >
            {envoye ? (
              <div role="status" className="rounded-[var(--rayon-sm)] bg-ok-fond p-4 text-ok-texte">
                <p className="text-[17px] font-semibold">Demande bien reçue</p>
                <p className="mt-1 text-[14.5px] leading-relaxed">Votre photo et vos choix de matières nous sont parvenus. Nous réalisons la simulation et vous l&apos;envoyons par e-mail avec votre devis, {DELAI_REPONSE}. Besoin de nous joindre avant ? {ENTREPRISE.telephone}.</p>
              </div>
            ) : etat.photo ? (
              <>
                {echecGeneration ? (
                  <Bouton variante="secondaire" onClick={revenirAuxMatieres}>
                    Revenir à mes matières
                  </Bouton>
                ) : null}
                {formulaireSecours}
                <Turnstile action="simulateur-secours" theme="light" onToken={setJetonCaptcha} />
              </>
            ) : (
              <Bouton
                variante="secondaire"
                onClick={() => {
                  effacerEchec();
                  setEcran(2);
                }}
              >
                Nouvelle simulation
              </Bouton>
            )}
          </EcranAttente>
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
            // Sans photo sur cet appareil (rendu retrouvé par un lien, mémoire vide) : on le dit, plutôt qu'un écran vide.
            <section aria-labelledby="etape-sans-photo" className="space-y-4">
              <h2 id="etape-sans-photo" className="font-display text-[26px] leading-tight font-semibold">
                Commencez par une photo
              </h2>
              <p className="text-[15px] text-encre-2">Aucune photo n&apos;est en mémoire sur cet appareil : choisissez-en une pour lancer une simulation.</p>
              <Bouton onClick={() => setEcran(2)}>Choisir une photo</Bouton>
            </section>
          )
        ) : null}

        {ecran === 4 && rendu ? (
          <EcranResultat rendu={rendu} rendus={etat.rendus} photo={etat.photo} titre={titrePiece(zones, etat.projet)} fondu={fondu} onFonduFini={() => setFondu(false)} onChoisirRendu={(id) => { setFondu(false); setRenduAffiche(id); }} onAutresMatieres={autresMatieres}>
            {envoye ? (
              <div className="rounded-[var(--rayon-md)] bg-ok-fond p-5 text-ok-texte">
                <h3 className="font-display text-[19px] font-semibold">Demande bien reçue</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed">
                  Vous recevez votre devis {DELAI_REPONSE} par e-mail, avec ce rendu. Besoin de nous joindre avant ? {ENTREPRISE.telephone}.
                </p>
                <div className="mt-4">
                  <Bouton variante="secondaire" onClick={() => void recommencer()}>
                    Nouvelle simulation
                  </Bouton>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => void envoyer(e)} className="space-y-4 rounded-[var(--rayon-md)] border border-trait bg-white p-4 sm:p-5">
                <div>
                  <h3 className="font-display text-[20px] font-semibold text-encre">Recevoir ce rendu et un devis</h3>
                  <p className="text-[14.5px] leading-relaxed text-encre-2">Devis gratuit {DELAI_REPONSE}, sans engagement. Toutes vos simulations de la session sont jointes.</p>
                </div>
                <ChampsContact prefixe="sim" formulaire={formulaire} onChange={setFormulaire} />
                <Turnstile action="simulateur-devis" theme="light" onToken={setJetonCaptcha} />
                <Bouton type="submit" plein occupe={occupe === "envoi"} libelleOccupe="Envoi…">
                  Recevoir mon devis
                </Bouton>
                <p className="text-[14px] text-encre-2">
                  Vous préférez échanger ?{" "}
                  <a href={ENTREPRISE.reseaux.whatsapp} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-encre">
                    WhatsApp
                  </a>
                  {" · "}
                  <a href={`tel:${ENTREPRISE.telephone.replace(/\s/g, "")}`} className="underline underline-offset-4 hover:text-encre">
                    {ENTREPRISE.telephone}
                  </a>
                </p>
              </form>
            )}
          </EcranResultat>
        ) : null}
      </div>

      {zoneCatalogue ? (
        <FeuilleCatalogue
          ouverte={!!zoneOuverte}
          onFermer={() => setZoneOuverte(null)}
          zone={{ id: zoneCatalogue.id, libelle: zoneCatalogue.libelle }}
          autresZones={piece.zones.filter((z) => z.id !== zoneCatalogue.id && !zoneCatalogue.exclut.includes(z.id) && !z.exclut.includes(zoneCatalogue.id) && !composantesDe(piece, zoneCatalogue.id).includes(z.id)).map((z) => ({ id: z.id, libelle: z.libelle }))}
          choisie={etat.selections[zoneCatalogue.id]?.ref ?? null}
          favoris={favoris}
          onFavori={basculerFavori}
          onChoisir={(teinte, aussi) => choisirTeinte(zoneCatalogue.id, teinte, aussi)}
          urlVignette={urlVignette}
          urlEchantillon={urlEchantillon}
        />
      ) : null}
    </div>
  );
}
