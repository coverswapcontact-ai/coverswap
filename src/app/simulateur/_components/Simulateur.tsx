"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EcranAttente, { type FilmChoisi } from "@/components/simulation/EcranAttente";
import Turnstile, { TURNSTILE_SITE_KEY, reinitialiserTurnstile } from "@/components/Turnstile";
import { PROJECT_TYPES, getProject } from "@/lib/simulateur/projets";
import { SURFACES_MAX } from "@/lib/simulateur/surfaces";
import { consentementPourEnvoi } from "@/lib/consentement";
import { envoyerEvenement } from "@/lib/evenements-site";
import { adopterParcoursId, obtenirParcoursId } from "@/lib/parcours";
import { messageErreurPhoto, preparerPhoto } from "@/lib/simulateur/photo";
import { PANNES, demanderAEtrePrevenu, lancerGeneration, urlImageTravail, type ReponseSuiviComplete } from "@/lib/simulateur/generation-client";
import { ETAT_VIDE, MESSAGE_SANS_PHOTO, decisionAuMontage, type RenduSimulateur } from "@/lib/simulateur/reprise";
import { effacerEtat, lireEtat, sauvegarderEtat, type EtatSimulateur } from "@/lib/simulateur/stockage";
import { acquisitionPourEnvoi, lireOrigine, sourceCourte } from "@/lib/utm";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_RENDU, DELAI_REPONSE } from "@/lib/offre";
import ChoixReference, { type Reference } from "./ChoixReference";
import EcranResultat from "./EcranResultat";
import { ChampsContact, FORMULAIRE_VIDE, Indicateur, type Etape, type Formulaire } from "./Formulaires";
import { useSondage } from "./useSondage";

/* ─────────────────────────────────────────────────────────────────
   Simulateur v2 : photo → revêtement → résultat. Coordonnées après.
   Mission 15 (partie 1) : la génération est ASYNCHRONE — le CRM crée un
   travail, le navigateur le suit (écran d'attente), et la personne peut
   quitter la page : l'état (IndexedDB, v2) garde le travail en cours, le
   parcours et l'historique des rendus (des adresses, plus de base64). Au
   retour : reprise du sondage, ou résultat, ou « Reprendre ma simulation ».
───────────────────────────────────────────────────────────────── */
type Selections = EtatSimulateur["selections"];
/** Génération qui n'a pas abouti : la personne peut quand même laisser ses coordonnées, avec sa photo. */
type Echec = { message: string; raison: string };

function versSelection(r: Reference): NonNullable<Selections[string]> {
  return { ref: r.id, nom: r.nom, famille: r.famille, finition: r.finition, categorie: r.categorie, tags: r.tags, image: r.image };
}

/** `libelles` : les noms des familles de prestations (fichier unique du CRM) pour les pièces. */
export default function Simulateur({ libelles = {} }: { libelles?: Record<string, { label: string; description: string }> }) {
  const [charge, setCharge] = useState(false);
  const [etape, setEtape] = useState<Etape>(1);
  const [etat, setEtat] = useState<EtatSimulateur>(ETAT_VIDE);
  const [bandeau, setBandeau] = useState<2 | 3 | null>(null);
  const [zoneOuverte, setZoneOuverte] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [echecGeneration, setEchecGeneration] = useState<Echec | null>(null);
  const [occupe, setOccupe] = useState<"photo" | "lancement" | "envoi" | null>(null);
  const [jetonCaptcha, setJetonCaptcha] = useState<string | null>(null);
  const [formulaire, setFormulaire] = useState<Formulaire>(FORMULAIRE_VIDE);
  const [envoye, setEnvoye] = useState<{ leadId: string | null; simulations: number } | null>(null);
  /** Le rendu affiché à l'étape 3 (le dernier par défaut) et le fondu à son arrivée. */
  const [renduAffiche, setRenduAffiche] = useState<string | null>(null);
  const [fondu, setFondu] = useState(false);
  const fichierRef = useRef<HTMLInputElement>(null);
  const lanceLe = useRef<number>(0);
  const projet = useMemo(() => getProject(etat.projet), [etat.projet]);
  const captchaActif = !!TURNSTILE_SITE_KEY;

  /* ── Reprise de l'état local + projet demandé dans l'URL ── */
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
      if (annule) return;
      const base = memoire ?? ETAT_VIDE;
      // Une génération en cours fige la pièce : l'adresse ne la change pas (les choix serviraient encore à « Réessayer »).
      const projetInitial = !base.travailEnCours && demande && PROJECT_TYPES.some((type) => type.id === demande) ? demande : base.projet;
      // Autre pièce demandée dans l'adresse : la photo et l'historique restent, les choix de l'ancienne pièce non.
      const memeProjet = projetInitial === base.projet;
      const decision = decisionAuMontage(base, { reprise, p: parcoursDuLien, depuisAccueil });
      // Le lien du mail porte son parcours : adopté tel quel (autre appareil, mémoire vide) ; sinon celui de la mémoire,
      // qui survit à l'onglet, puis celui de la session, sinon un neuf. Remis dans la session pour les événements et la demande.
      const parcoursId = (decision.ecran === "attente" && decision.parcoursId) || base.parcoursId || obtenirParcoursId() || crypto.randomUUID();
      adopterParcoursId(parcoursId);
      const repris: EtatSimulateur = { ...base, projet: projetInitial, parcoursId, selections: memeProjet ? base.selections : {} };
      if (decision.ecran === "attente") {
        repris.travailEnCours = decision.travail;
        setEtape(2);
      } else if (decision.ecran === "bandeau") {
        setBandeau(decision.etape);
        setEtape(1);
      } else {
        setEtape(decision.etape);
      }
      setRenduAffiche(repris.rendus[repris.rendus.length - 1]?.travailId ?? null);
      setEtat(repris);
      setCharge(true);
      envoyerEvenement("PAGE_VUE", { projet: projetInitial, reprise: !!memoire?.photo, travail_en_cours: !!repris.travailEnCours });
    })();
    return () => {
      annule = true;
    };
  }, []);

  /* ── Sauvegarde locale à chaque changement ── */
  useEffect(() => {
    if (charge) void sauvegarderEtat(etat);
  }, [etat, charge]);

  const mettreAJour = useCallback((maj: Partial<EtatSimulateur>) => setEtat((e) => ({ ...e, ...maj })), []);

  /* ── Suivi du travail en cours (3 s, visibilité, réseau) ── */
  const sondage = useSondage(etat.travailEnCours, etat.parcoursId, {
    onPret: (travailId: string, reponse: ReponseSuiviComplete) => {
      setEtat((e) => {
        if (!e.parcoursId) return { ...e, travailEnCours: null };
        const rendu: RenduSimulateur = {
          travailId,
          simulationSiteId: reponse.simulationSiteId ?? null,
          urlApres: urlImageTravail(travailId, e.parcoursId, "apres"),
          urlAvant: reponse.imageAvant ? urlImageTravail(travailId, e.parcoursId, "avant") : null,
          references: reponse.references ?? [],
          le: Date.now(),
        };
        return { ...e, travailEnCours: null, rendus: [...e.rendus.filter((r) => r.travailId !== travailId), rendu] };
      });
      setRenduAffiche(travailId);
      setEchecGeneration(null);
      setFondu(true);
      setEtape(3);
      envoyerEvenement("SIMULATION_RESULTAT", { projet: projet.id, duree_ms: lanceLe.current ? Date.now() - lanceLe.current : undefined, garde: !!reponse.simulationSiteId });
    },
    onEchec: (_travailId, raison, message) => {
      mettreAJour({ travailEnCours: null });
      // Sans photo sur cet appareil (lien d'un mail, mémoire vide), « conservés » serait faux : on le dit honnêtement.
      setEchecGeneration({ raison, message: etat.photo ? message : MESSAGE_SANS_PHOTO });
      envoyerEvenement("SIMULATION_ECHEC", { etape: "generation", raison, duree_ms: lanceLe.current ? Date.now() - lanceLe.current : undefined });
    },
  });

  /* ── Étape 1 : photo ── */
  const choisirPhoto = async (file: File | undefined) => {
    if (!file) return;
    setErreur(null);
    setOccupe("photo");
    try {
      const prete = await preparerPhoto(file);
      mettreAJour({ photo: prete.dataUrl });
      setBandeau(null);
      setEchecGeneration(null);
      envoyerEvenement("SIMULATION_PHOTO", { projet: etat.projet, poids_ko: prete.poidsKo, largeur: prete.largeur });
      setEtape(2);
    } catch (e) {
      const code = e instanceof Error ? e.message : "illisible";
      setErreur(messageErreurPhoto(code));
      envoyerEvenement("SIMULATION_ECHEC", { etape: "photo", raison: code });
    } finally {
      setOccupe(null);
      if (fichierRef.current) fichierRef.current.value = "";
    }
  };

  /* ── Étape 2 : revêtements ── */
  const selectionsActives = projet.elements.map((el) => ({ el, sel: etat.selections[el.key] ?? null })).filter((x) => x.sel);
  const enAttente = !!etat.travailEnCours;
  const peutGenerer = selectionsActives.length > 0 && !!etat.photo && occupe === null && !enAttente && (!captchaActif || !!jetonCaptcha);
  // Un jeton Turnstile ne sert qu'une fois : après un lancement, le suivant arrive de façon asynchrone — « Réessayer » l'attend, en le disant.
  const attenteReessai = captchaActif && !jetonCaptcha ? "Vérification anti-robot en cours…" : null;
  const references = () => selectionsActives.map(({ el, sel }) => ({ zone: el.key, libelle: el.label, ref: sel!.ref, nom: sel!.nom }));
  const films: FilmChoisi[] = selectionsActives.map(({ el, sel }) => ({ zone: el.key, libelle: el.label, nom: sel!.nom, image: sel!.image || null }));

  /* ── Génération : le CRM crée le travail, l'écran d'attente prend le relais ── */
  const generer = async () => {
    if (!etat.photo || !etat.parcoursId || !peutGenerer) return;
    setErreur(null);
    setEchecGeneration(null);
    setOccupe("lancement");
    lanceLe.current = Date.now();
    const origine = lireOrigine();
    envoyerEvenement("SIMULATION_LANCEE", { projet: projet.id, zones: selectionsActives.length });
    try {
      const lancement = await lancerGeneration({
        projetId: projet.id,
        parcoursId: etat.parcoursId,
        turnstileToken: jetonCaptcha,
        // La référence seule : le serveur relit nom, famille et échantillon dans le catalogue.
        selections: selectionsActives.map(({ el, sel }) => ({ surface: el.key, ref: sel!.ref })),
        references: references(),
        photo: etat.photo,
        page: window.location.pathname,
        source: sourceCourte(origine) ?? null,
        campagne: origine.campagne,
      });
      if (lancement.ok) {
        mettreAJour({ travailEnCours: { travailId: lancement.travailId, lanceLe: Date.now(), attenteEstimeeS: lancement.attenteEstimeeS } });
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

  /* ── Étape 3 : demande de devis (ou, après un échec, « simulation à la main ») ── */
  const rendu = etat.rendus.find((r) => r.travailId === renduAffiche) ?? etat.rendus[etat.rendus.length - 1] ?? null;
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
          // Après un échec, la photo part avec la demande : la simulation sera faite à la main.
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
    setBandeau(null);
    setRenduAffiche(null);
    setEnvoye(null);
    setErreur(null);
    setEchecGeneration(null);
    setEtape(1);
  };

  const autreFinition = () => {
    setEchecGeneration(null);
    // Sans photo sur cet appareil (rendu retrouvé par le lien d'un mail) : une autre finition commence par une photo.
    setEtape(etat.photo ? 2 : 1);
  };

  const formulaireSecours = (
    <form onSubmit={(e) => void envoyer(e, true)} className="space-y-4 border-t border-[#D3CFC8] pt-5 text-white">
      <div>
        <h3 className="font-display text-lg font-bold text-[#1A1A1A]">Recevoir ma simulation et un devis par e-mail</h3>
        <p className="text-sm text-[#5F5A53]">Nous faisons la simulation pour vous à partir de cette photo et de vos choix. Devis gratuit {DELAI_REPONSE}, sans engagement.</p>
      </div>
      <div className="rounded-xl bg-noir p-4">
        <div className="space-y-4">
          <ChampsContact prefixe="echec" formulaire={formulaire} onChange={setFormulaire} />
          <button type="submit" disabled={occupe === "envoi"} className="btn-primary w-full disabled:opacity-50">
            {occupe === "envoi" ? "Envoi…" : "Envoyer ma photo et recevoir ma simulation"}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div>
      <Indicateur etape={etape} onRetour={(e) => setEtape(e)} verrou={enAttente ? "Choix figés pendant la génération" : null} />

      {erreur ? (
        <div role="alert" className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {erreur}
        </div>
      ) : null}

      {/* Un parcours récent existe : on propose de le reprendre, sans rien écraser. */}
      {bandeau && etat.photo ? (
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-white/15 bg-white/[0.04] p-3">
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gris-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={etat.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold">Reprendre ma simulation</p>
            <p className="text-xs text-gris-400">{bandeau === 3 ? "Votre dernier rendu vous attend." : "Votre photo et vos choix sont conservés."}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => { setBandeau(null); setEtape(bandeau); }} className="btn-primary min-h-[44px] px-4 py-2 text-sm">
              Reprendre
            </button>
            <button type="button" onClick={() => void recommencer()} className="min-h-[44px] px-3 text-sm text-gris-400 underline hover:text-white">
              Recommencer
            </button>
          </div>
        </div>
      ) : null}

      {/* ═══ Étape 1 — Photo ═══ */}
      {etape === 1 ? (
        <section aria-labelledby="etape-photo" className="space-y-6">
          <div>
            <h2 id="etape-photo" className="font-display text-2xl font-bold mb-2">
              Quelle pièce ?
            </h2>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Type de projet">
              {PROJECT_TYPES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={etat.projet === p.id}
                  onClick={() => mettreAJour({ projet: p.id, selections: {} })}
                  className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${etat.projet === p.id ? "bg-rouge border-rouge text-white" : "border-white/15 text-gris-300 hover:border-white/40"}`}
                >
                  {libelles[p.id]?.label ?? p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold mb-1">{projet.uploadHint}</h2>
            <p className="text-gris-400 text-sm mb-4">{projet.uploadTip}. Vos coordonnées ne sont pas demandées à cette étape.</p>
            <label className="flex flex-col items-center justify-center gap-2 w-full min-h-44 rounded-2xl border-2 border-dashed border-white/15 hover:border-rouge/50 bg-white/[0.02] cursor-pointer p-6 text-center transition-colors">
              <span className="font-display font-bold text-lg">{occupe === "photo" ? "Préparation de la photo…" : "Prendre ou choisir une photo"}</span>
              <span className="text-xs text-gris-500">JPEG, PNG, HEIC — réduite automatiquement avant l&apos;envoi</span>
              <input ref={fichierRef} type="file" accept="image/*" capture="environment" className="sr-only" disabled={occupe === "photo"} onChange={(e) => void choisirPhoto(e.target.files?.[0])} />
            </label>
            {etat.photo && !bandeau ? (
              <button type="button" onClick={() => setEtape(2)} className="btn-secondary mt-4 w-full sm:w-auto">
                Garder la photo précédente →
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ═══ Étape 2 — Revêtements ═══ */}
      {etape === 2 && !etat.photo && !enAttente && !echecGeneration ? (
        // Rien à montrer sans photo (rendu retrouvé par un lien, mémoire vide) : on le dit, plutôt qu'un écran vide.
        <section aria-labelledby="etape-sans-photo" className="space-y-4">
          <h2 id="etape-sans-photo" className="font-display text-2xl font-bold">
            Commencez par une photo
          </h2>
          <p className="text-gris-400 text-sm">Aucune photo n&apos;est en mémoire sur cet appareil : choisissez-en une pour lancer une simulation.</p>
          <button type="button" onClick={() => setEtape(1)} className="btn-primary">
            Choisir une photo
          </button>
        </section>
      ) : null}
      {etape === 2 && (etat.photo || enAttente || echecGeneration) ? (
        <section aria-labelledby="etape-revetement" className="space-y-6">
          {/* La génération tourne (ou n'a pas abouti) : l'écran d'attente prend la place, les choix restent figés dessous. */}
          {enAttente || echecGeneration ? (
            <EcranAttente
              photo={etat.photo}
              films={films}
              statut={echecGeneration ? "ECHEC" : (sondage?.statut ?? "EN_ATTENTE")}
              etape={sondage?.etape ?? null}
              attenteEstimeeS={sondage?.attenteEstimeeS ?? etat.travailEnCours?.attenteEstimeeS ?? 75}
              horsLigne={sondage?.horsLigne ?? false}
              echec={echecGeneration}
              peutReessayer={!!echecGeneration && !PANNES.includes(echecGeneration.raison) && !!etat.photo && selectionsActives.length > 0}
              attenteReessai={attenteReessai}
              onReessayer={() => void generer()}
              onPrevenir={enAttente ? prevenir : undefined}
            >
              {envoye ? (
                <div role="status" className="rounded-lg border border-[#1F7A4D]/40 bg-[#E7F3EC] p-4 text-[#17563A]">
                  <p className="font-display text-lg font-bold">Demande bien reçue</p>
                  <p className="mt-1 text-[14px] leading-relaxed">Votre photo et vos choix de finitions nous sont parvenus. Nous réalisons la simulation et vous l&apos;envoyons par e-mail avec votre devis, {DELAI_REPONSE}. Besoin de nous joindre avant ? {ENTREPRISE.telephone}.</p>
                </div>
              ) : etat.photo ? (
                formulaireSecours
              ) : (
                // Sans photo, la demande « à la main » ne peut pas partir : une nouvelle simulation commence par une photo.
                <button type="button" onClick={() => { setEchecGeneration(null); setEtape(1); }} className="min-h-[48px] w-full rounded-md border border-[#1A1A1A] px-5 text-[16px] font-medium text-[#1A1A1A] transition-colors duration-200 hover:bg-[#1A1A1A] hover:text-white sm:w-auto">
                  Nouvelle simulation
                </button>
              )}
            </EcranAttente>
          ) : null}
          {etat.photo ? (
            <div className="grid md:grid-cols-[220px_1fr] gap-6 items-start">
              <div>
                <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-white/10 bg-gris-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={etat.photo} alt="Votre photo" className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <button type="button" onClick={() => setEtape(1)} disabled={enAttente} className="mt-2 text-sm text-gris-400 hover:text-white underline disabled:cursor-not-allowed disabled:opacity-50">
                  Changer de photo
                </button>
              </div>
              <div>
                <h2 id="etape-revetement" className="font-display text-2xl font-bold mb-1">
                  Quelles surfaces, avec quelle finition ?
                </h2>
                <p className="text-gris-400 text-sm mb-4">{enAttente ? "Vos choix sont figés le temps de la génération." : "Choisissez au moins une surface. Les autres restent telles quelles."}</p>
                <ul className="space-y-3">
                  {projet.elements.map((el) => {
                    const sel = etat.selections[el.key] ?? null;
                    const ouverte = zoneOuverte === el.key;
                    const plafond = !sel && selectionsActives.length >= SURFACES_MAX;
                    const raisonFige = enAttente ? "Choix figés pendant la génération" : plafond ? `${SURFACES_MAX} surfaces au plus par rendu` : undefined;
                    return (
                      <li key={el.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {sel ? (
                              <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0">
                                <Image src={sel.image} alt="" fill sizes="40px" className="object-cover" />
                              </div>
                            ) : null}
                            <div className="min-w-0">
                              <p className="font-display font-bold">{el.label}</p>
                              <p className="text-xs text-gris-500 truncate">{sel ? `${sel.nom} · ${sel.ref}` : raisonFige ?? el.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {sel ? (
                              <button type="button" disabled={enAttente} title={raisonFige} onClick={() => mettreAJour({ selections: { ...etat.selections, [el.key]: null } })} className="text-xs text-gris-400 hover:text-white underline disabled:cursor-not-allowed disabled:opacity-40">
                                Retirer
                              </button>
                            ) : null}
                            <button type="button" aria-expanded={ouverte} disabled={plafond || enAttente} title={raisonFige} onClick={() => setZoneOuverte(ouverte ? null : el.key)} className={`rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed ${sel ? "bg-white/10 text-white" : "bg-rouge text-white"}`}>
                              {sel ? "Modifier" : "Choisir"}
                            </button>
                          </div>
                        </div>
                        {ouverte && !enAttente ? (
                          <div className="mt-4">
                            <ChoixReference
                              choisie={sel ? { id: sel.ref, nom: sel.nom, famille: sel.famille, categorie: sel.categorie, finition: sel.finition, image: sel.image, tags: sel.tags } : null}
                              onChoisir={(r) => {
                                // « Façades (toutes) » et « Meubles hauts / bas » couvrent les mêmes meubles : le dernier choix l'emporte.
                                const suivantes: Selections = { ...etat.selections, [el.key]: versSelection(r) };
                                for (const autre of el.exclut) suivantes[autre] = null;
                                mettreAJour({ selections: suivantes });
                                setZoneOuverte(null);
                              }}
                            />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                {!enAttente ? (
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
                    <button type="button" onClick={() => void generer()} disabled={!peutGenerer} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                      {occupe === "lancement" ? "Lancement…" : "Voir le résultat"}
                    </button>
                    <span className="text-xs text-gris-500" aria-live="polite">
                      {captchaActif && !jetonCaptcha && selectionsActives.length > 0 ? "Vérification anti-robot en cours…" : `Rendu en ${DELAI_RENDU}, gratuit, sans coordonnées.`}
                    </span>
                  </div>
                ) : null}
                <Turnstile action="simulateur" onToken={setJetonCaptcha} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ═══ Étape 3 — Résultat ═══ */}
      {etape === 3 && rendu ? (
        <section aria-labelledby="etape-resultat" className="space-y-6">
          <h2 id="etape-resultat" className="font-display text-2xl font-bold">
            Votre {projet.label.toLowerCase()}, avant / après
          </h2>
          <EcranResultat rendu={rendu} photo={etat.photo} alt={`Votre ${projet.label.toLowerCase()} simulée`} fondu={fondu} onFonduFini={() => setFondu(false)} />
          <ul className="flex flex-wrap gap-2 text-xs text-gris-400">
            {rendu.references.map((r) => (
              <li key={r.zone} className="rounded-full border border-white/10 px-3 py-1">
                {r.libelle} : <span className="text-white">{r.nom}</span> ({r.ref})
              </li>
            ))}
          </ul>
          <p className="text-xs text-gris-500">Rendu indicatif produit par une intelligence artificielle. Les teintes exactes se valident sur échantillons avant la pose.</p>
          {etat.rendus.filter((r) => r.urlApres).length > 1 ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Vos rendus">
              {etat.rendus.filter((r) => r.urlApres).map((r, i) => (
                <button key={r.travailId} type="button" aria-pressed={r.travailId === rendu.travailId} onClick={() => { setFondu(false); setRenduAffiche(r.travailId); }} className={`min-h-[44px] rounded-full border px-4 text-sm ${r.travailId === rendu.travailId ? "border-white bg-white/10 text-white" : "border-white/15 text-gris-400 hover:text-white"}`}>
                  Rendu {i + 1}
                </button>
              ))}
            </div>
          ) : null}

          {envoye ? (
            <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-6">
              <h3 className="font-display text-xl font-bold mb-2">Demande bien reçue</h3>
              <p className="text-gris-300 mb-4">
                Vous recevez votre devis {DELAI_REPONSE} par e-mail, avec ce rendu. Besoin de nous joindre avant ? {ENTREPRISE.telephone}.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={rendu.urlApres} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                  Ouvrir le rendu
                </a>
                <button type="button" onClick={() => void recommencer()} className="btn-secondary">
                  Nouvelle simulation
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void envoyer(e)} className="rounded-2xl border border-rouge/30 bg-rouge/5 p-6 space-y-4">
              <div>
                <h3 className="font-display text-xl font-bold">Recevoir ce rendu et un devis</h3>
                <p className="text-sm text-gris-400">Devis gratuit {DELAI_REPONSE}, sans engagement. Toutes vos simulations de la session sont jointes.</p>
              </div>
              <ChampsContact prefixe="sim" formulaire={formulaire} onChange={setFormulaire} />
              <Turnstile action="simulateur-devis" onToken={setJetonCaptcha} />
              <button type="submit" disabled={occupe === "envoi"} className="btn-primary w-full disabled:opacity-50">
                {occupe === "envoi" ? "Envoi…" : "Recevoir mon devis"}
              </button>
              <div className="flex flex-wrap gap-4 text-sm text-gris-400 pt-1">
                <button type="button" onClick={autreFinition} className="underline hover:text-white">
                  Essayer une autre finition
                </button>
                <Link href={ENTREPRISE.reseaux.whatsapp} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                  Ou échanger sur WhatsApp
                </Link>
              </div>
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
}
