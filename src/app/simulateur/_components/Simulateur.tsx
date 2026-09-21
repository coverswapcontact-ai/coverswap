"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import CaseConsentement from "@/components/CaseConsentement";
import Turnstile, { reinitialiserTurnstile } from "@/components/Turnstile";
import { PROJECT_TYPES, getProject } from "@/lib/simulateur/projets";
import { SURFACES_MAX } from "@/lib/simulateur/surfaces";
import { consentementPourEnvoi } from "@/lib/consentement";
import { envoyerEvenement } from "@/lib/evenements-site";
import { obtenirParcoursId } from "@/lib/parcours";
import { messageErreurPhoto, preparerPhoto } from "@/lib/simulateur/photo";
import { effacerEtat, lireEtat, sauvegarderEtat, type EtatSimulateur } from "@/lib/simulateur/stockage";
import { acquisitionPourEnvoi, lireOrigine, sourceCourte } from "@/lib/utm";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_REPONSE } from "@/lib/offre";
import ChoixReference, { type Reference } from "./ChoixReference";

/* ─────────────────────────────────────────────────────────────────
   Simulateur v2 : photo → revêtement → résultat. Coordonnées après.
   Tout l'état vit dans IndexedDB (reprise après rechargement) ; chaque
   étape et chaque échec sont journalisés (dataLayer + CRM).
───────────────────────────────────────────────────────────────── */
type Etape = 1 | 2 | 3;
type Selections = EtatSimulateur["selections"];
type Rendu = NonNullable<EtatSimulateur["resultat"]>;

type Formulaire = { name: string; phone: string; email: string; ville: string; codePostal: string; message: string; consentement: boolean };
/** Génération qui n'a pas abouti : la personne peut quand même laisser ses coordonnées, avec sa photo. */
type Echec = { message: string; raison: string };

const SIMULATE_URL = process.env.NEXT_PUBLIC_SIMULATE_URL;
/** Raisons pour lesquelles réessayer tout de suite ne sert à rien : on met la demande par coordonnées en avant. */
const PANNES = ["service-indisponible", "global-quota", "ip-quota", "quota"];
const CHAMP = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-hidden focus:border-rouge/50";
const ETAT_VIDE: EtatSimulateur = { projet: "cuisine", photo: null, selections: {}, resultat: null, simulationSiteIds: [], rendusLocaux: [], majLe: 0 };

function versSelection(r: Reference): NonNullable<Selections[string]> {
  return { ref: r.id, nom: r.nom, famille: r.famille, finition: r.finition, categorie: r.categorie, tags: r.tags, image: r.image };
}

function Indicateur({ etape, onRetour }: { etape: Etape; onRetour: (e: Etape) => void }) {
  const libelles = ["Photo", "Revêtement", "Résultat"];
  return (
    <ol className="flex items-center gap-2 sm:gap-4 mb-8" aria-label="Progression">
      {libelles.map((l, i) => {
        const n = (i + 1) as Etape;
        const faite = n < etape;
        const courante = n === etape;
        return (
          <li key={l} className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              disabled={!faite}
              onClick={() => onRetour(n)}
              aria-current={courante ? "step" : undefined}
              className={`flex items-center gap-2 text-sm ${courante ? "text-white" : faite ? "text-gris-300 hover:text-white" : "text-gris-600"} disabled:cursor-default`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${courante ? "bg-rouge text-white" : faite ? "bg-green-600/80 text-white" : "bg-white/10"}`}>{faite ? "✓" : n}</span>
              <span className="hidden sm:inline">{l}</span>
            </button>
            {i < libelles.length - 1 ? <span aria-hidden className="w-6 sm:w-10 h-px bg-white/15" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Les champs de contact, communs à la demande après un rendu et à la demande quand la génération a échoué. */
function ChampsContact({ prefixe, formulaire, onChange }: { prefixe: string; formulaire: Formulaire; onChange: (f: Formulaire) => void }) {
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${prefixe}-nom`} className="block text-sm mb-1">
            Nom complet *
          </label>
          <input id={`${prefixe}-nom`} required autoComplete="name" value={formulaire.name} onChange={(e) => onChange({ ...formulaire, name: e.target.value })} className={CHAMP} />
        </div>
        <div>
          <label htmlFor={`${prefixe}-tel`} className="block text-sm mb-1">
            Téléphone *
          </label>
          <input id={`${prefixe}-tel`} required type="tel" inputMode="tel" autoComplete="tel" value={formulaire.phone} onChange={(e) => onChange({ ...formulaire, phone: e.target.value })} className={CHAMP} />
        </div>
        <div>
          <label htmlFor={`${prefixe}-email`} className="block text-sm mb-1">
            E-mail *
          </label>
          <input id={`${prefixe}-email`} required type="email" autoComplete="email" value={formulaire.email} onChange={(e) => onChange({ ...formulaire, email: e.target.value })} className={CHAMP} />
        </div>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <div>
            <label htmlFor={`${prefixe}-ville`} className="block text-sm mb-1">
              Ville *
            </label>
            <input id={`${prefixe}-ville`} required autoComplete="address-level2" value={formulaire.ville} onChange={(e) => onChange({ ...formulaire, ville: e.target.value })} className={CHAMP} />
          </div>
          <div>
            <label htmlFor={`${prefixe}-cp`} className="block text-sm mb-1">
              Code postal *
            </label>
            <input id={`${prefixe}-cp`} required inputMode="numeric" pattern="[0-9]{5}" title="5 chiffres" autoComplete="postal-code" maxLength={5} value={formulaire.codePostal} onChange={(e) => onChange({ ...formulaire, codePostal: e.target.value.replace(/\D/g, "") })} className={CHAMP} />
          </div>
        </div>
      </div>
      <div>
        <label htmlFor={`${prefixe}-message`} className="block text-sm mb-1">
          Un mot sur votre projet (facultatif)
        </label>
        <textarea id={`${prefixe}-message`} rows={2} value={formulaire.message} onChange={(e) => onChange({ ...formulaire, message: e.target.value })} className={`${CHAMP} resize-none`} />
      </div>
      <CaseConsentement id={`consentement-${prefixe}`} checked={formulaire.consentement} onChange={(consentement) => onChange({ ...formulaire, consentement })} />
    </>
  );
}

export default function Simulateur() {
  const [charge, setCharge] = useState(false);
  const [etape, setEtape] = useState<Etape>(1);
  const [etat, setEtat] = useState<EtatSimulateur>(ETAT_VIDE);
  const [zoneOuverte, setZoneOuverte] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [echecGeneration, setEchecGeneration] = useState<Echec | null>(null);
  const [occupe, setOccupe] = useState<"photo" | "generation" | "envoi" | null>(null);
  const [progression, setProgression] = useState<string>("");
  const [jetonCaptcha, setJetonCaptcha] = useState<string | null>(null);
  const [formulaire, setFormulaire] = useState<Formulaire>({ name: "", phone: "", email: "", ville: "", codePostal: "", message: "", consentement: false });
  const [envoye, setEnvoye] = useState<{ leadId: string | null; simulations: number } | null>(null);
  const fichierRef = useRef<HTMLInputElement>(null);
  const projet = useMemo(() => getProject(etat.projet), [etat.projet]);

  /* ── Reprise de l'état local + projet demandé dans l'URL ── */
  useEffect(() => {
    let annule = false;
    (async () => {
      const memoire = await lireEtat();
      // Lu à la main (pas useSearchParams) : le composant reste rendu côté serveur, sans bloc d'attente ni décalage.
      const demande = new URLSearchParams(window.location.search).get("projet");
      if (annule) return;
      const base = memoire ?? ETAT_VIDE;
      const projetInitial = demande && PROJECT_TYPES.some((p) => p.id === demande) ? demande : base.projet;
      // Autre pièce demandée dans l'adresse : la photo reste, les choix et le rendu de l'ancienne pièce non.
      const memeProjet = projetInitial === base.projet;
      const repris: EtatSimulateur = { ...base, projet: projetInitial, selections: memeProjet ? base.selections : {}, resultat: memeProjet ? base.resultat : null };
      // Reprise d'un état externe (IndexedDB, URL) après le montage.
      setEtat(repris);
      setEtape(repris.resultat ? 3 : repris.photo ? 2 : 1);
      setCharge(true);
      envoyerEvenement("PAGE_VUE", { projet: projetInitial, reprise: !!memoire?.photo });
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

  /* ── Étape 1 : photo ── */
  const choisirPhoto = async (file: File | undefined) => {
    if (!file) return;
    setErreur(null);
    setOccupe("photo");
    try {
      const prete = await preparerPhoto(file);
      mettreAJour({ photo: prete.dataUrl, resultat: null });
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
  const peutGenerer = selectionsActives.length > 0 && !!etat.photo && occupe === null;

  const references = () => selectionsActives.map(({ el, sel }) => ({ zone: el.key, libelle: el.label, ref: sel!.ref, nom: sel!.nom }));

  /* ── Génération ── */
  const generer = async () => {
    if (!etat.photo || !peutGenerer) return;
    setErreur(null);
    setEchecGeneration(null);
    setOccupe("generation");
    setProgression("Préparation…");
    const debut = Date.now();
    const parcoursId = obtenirParcoursId();
    const origine = lireOrigine();
    envoyerEvenement("SIMULATION_LANCEE", { projet: projet.id, zones: selectionsActives.length });

    const charge: Record<string, unknown> = {
      project_type: projet.id,
      parcoursId,
      turnstileToken: jetonCaptcha,
      // La référence seule : le serveur relit nom, famille et échantillon dans le catalogue.
      selections: selectionsActives.map(({ el, sel }) => ({ surface: el.key, ref: sel!.ref })),
    };

    const echec = (message: string, raison: string) => {
      setEchecGeneration({ message, raison });
      envoyerEvenement("SIMULATION_ECHEC", { etape: "generation", raison, duree_ms: Date.now() - debut });
    };
    const reussite = (image: string, simulationSiteId: string | null, avant: string | null = null) => {
      const refs = references();
      const rendu: Rendu = { image, avant, simulationSiteId, references: refs };
      mettreAJour({
        resultat: rendu,
        simulationSiteIds: simulationSiteId ? [...etat.simulationSiteIds, simulationSiteId] : etat.simulationSiteIds,
        rendusLocaux: simulationSiteId ? etat.rendusLocaux : [...etat.rendusLocaux.slice(-2), { avant: avant ?? etat.photo!, apres: image, references: refs }],
      });
      setEchecGeneration(null);
      setEtape(3);
      envoyerEvenement("SIMULATION_RESULTAT", { projet: projet.id, duree_ms: Date.now() - debut, garde: !!simulationSiteId });
    };

    try {
      // 1) Préparation (prompt signé) sur le site
      const prep = await fetch("/api/simulation/prepare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(charge) });
      const prepData = await prep.json().catch(() => ({}));
      if (prep.status === 429 || prep.status === 400) {
        echec(prepData.error || "Simulation refusée pour le moment.", prepData.reason || `prepare-${prep.status}`);
        return;
      }
      // 2) Génération sur le serveur sans limite de temps (CRM), sinon repli synchrone
      if (SIMULATE_URL && prep.ok && prepData.prompt && prepData.sig) {
        setProgression("Génération du rendu… 20 à 60 secondes");
        // Serveur de génération injoignable (panne, réseau filtré) : on ne s'arrête pas là, le repli prend le relais.
        const gen = await fetch(SIMULATE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prepData.prompt,
            swatchUrls: prepData.swatchUrls,
            sig: prepData.sig,
            exp: prepData.exp,
            parcoursId,
            projet: projet.id,
            references: references(),
            page: window.location.pathname,
            source: sourceCourte(origine) ?? null,
            campagne: origine.campagne,
            photo_base64: etat.photo,
          }),
        }).catch(() => null);
        const genData = gen ? await gen.json().catch(() => ({})) : { reason: "injoignable" };
        if (gen?.ok && genData.image) {
          reussite(genData.image, genData.simulationSiteId ?? null, typeof genData.imageAvant === "string" ? genData.imageAvant : null);
          return;
        }
        if (gen?.status === 429) {
          echec(genData.error || "Limite de simulations atteinte pour aujourd'hui.", genData.reason || "quota");
          return;
        }
        // Panne de notre côté (crédit, clé) ou photo refusée : le repli utiliserait le même service, on le dit tout de suite.
        if (genData.reason === "service-indisponible" || genData.reason === "photo-refusee") {
          echec(genData.error, genData.reason);
          return;
        }
        console.warn("[simulateur] génération CRM échouée, repli synchrone :", gen?.status ?? "injoignable", genData.reason);
      }
      setProgression("Génération du rendu (secours)… jusqu'à 60 secondes");
      const sync = await fetch("/api/simulation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...charge, photo_base64: etat.photo }) });
      const syncData = await sync.json().catch(() => ({}));
      if (sync.ok && syncData.image) {
        reussite(syncData.image, null, typeof syncData.imageAvant === "string" ? syncData.imageAvant : null);
        return;
      }
      echec(syncData.error || "La génération n'a pas abouti. Votre photo et vos choix sont conservés : réessayez, ou laissez-nous vos coordonnées et nous vous envoyons la simulation.", syncData.reason || `sync-${sync.status}`);
    } catch {
      echec("Connexion interrompue pendant la génération. Votre photo et vos choix sont conservés : réessayez, ou laissez-nous vos coordonnées et nous vous envoyons la simulation.", "reseau");
    } finally {
      setOccupe(null);
      setProgression("");
      reinitialiserTurnstile();
      setJetonCaptcha(null);
    }
  };

  /* ── Étape 3 : demande de devis ── */
  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!etat.resultat && !(echecGeneration && etat.photo)) return;
    const sansRendu = !etat.resultat;
    const refs = etat.resultat?.references ?? references();
    setErreur(null);
    setOccupe("envoi");
    try {
      const res = await fetch("/api/simulation/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formulaire,
          project_type: projet.id,
          parcoursId: obtenirParcoursId(),
          simulationIds: etat.simulationSiteIds,
          rendusLocaux: etat.rendusLocaux,
          referenceChoisie: refs[0]?.ref,
          references: refs.map((r) => `${r.libelle} : ${r.ref} (${r.nom})`).join(" | "),
          // Sans rendu, la photo part avec la demande : la simulation sera faite à la main.
          ...(sansRendu ? { photoAvant: etat.photo, simulationEchouee: echecGeneration?.raison ?? "inconnue" } : {}),
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
      envoyerEvenement("DEVIS_DEMANDE", { formulaire: "simulateur", projet: projet.id, simulations: etat.simulationSiteIds.length + etat.rendusLocaux.length, sans_rendu: sansRendu });
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
    setEtat({ ...ETAT_VIDE, projet: etat.projet });
    setEnvoye(null);
    setErreur(null);
    setEchecGeneration(null);
    setEtape(1);
  };

  const autreFinition = () => {
    mettreAJour({ resultat: null });
    setEtape(2);
  };

  return (
    <div>
      <Indicateur etape={etape} onRetour={(e) => setEtape(e)} />

      {erreur ? (
        <div role="alert" className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {erreur}
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
                  {p.label}
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
              <input ref={fichierRef} type="file" accept="image/*,.heic,.heif" capture="environment" className="sr-only" disabled={occupe === "photo"} onChange={(e) => void choisirPhoto(e.target.files?.[0])} />
            </label>
            {etat.photo ? (
              <button type="button" onClick={() => setEtape(2)} className="btn-secondary mt-4 w-full sm:w-auto">
                Garder la photo précédente →
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ═══ Étape 2 — Revêtements ═══ */}
      {etape === 2 && etat.photo ? (
        <section aria-labelledby="etape-revetement" className="space-y-6">
          <div className="grid md:grid-cols-[220px_1fr] gap-6 items-start">
            <div>
              <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-white/10 bg-gris-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={etat.photo} alt="Votre photo" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <button type="button" onClick={() => setEtape(1)} className="mt-2 text-sm text-gris-400 hover:text-white underline">
                Changer de photo
              </button>
            </div>
            <div>
              <h2 id="etape-revetement" className="font-display text-2xl font-bold mb-1">
                Quelles surfaces, avec quelle finition ?
              </h2>
              <p className="text-gris-400 text-sm mb-4">Choisissez au moins une surface. Les autres restent telles quelles.</p>
              <ul className="space-y-3">
                {projet.elements.map((el) => {
                  const sel = etat.selections[el.key] ?? null;
                  const ouverte = zoneOuverte === el.key;
                  const plafond = !sel && selectionsActives.length >= SURFACES_MAX;
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
                            <p className="text-xs text-gris-500 truncate">{sel ? `${sel.nom} · ${sel.ref}` : plafond ? `${SURFACES_MAX} surfaces au plus par rendu` : el.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {sel ? (
                            <button type="button" onClick={() => mettreAJour({ selections: { ...etat.selections, [el.key]: null } })} className="text-xs text-gris-400 hover:text-white underline">
                              Retirer
                            </button>
                          ) : null}
                          <button type="button" aria-expanded={ouverte} disabled={plafond} onClick={() => setZoneOuverte(ouverte ? null : el.key)} className={`rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed ${sel ? "bg-white/10 text-white" : "bg-rouge text-white"}`}>
                            {sel ? "Modifier" : "Choisir"}
                          </button>
                        </div>
                      </div>
                      {ouverte ? (
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
              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
                <button type="button" onClick={() => void generer()} disabled={!peutGenerer} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  {occupe === "generation" ? "Génération en cours…" : "Voir le résultat"}
                </button>
                <span className="text-xs text-gris-500" aria-live="polite">
                  {occupe === "generation" ? progression : "Rendu en moins d'une minute, gratuit, sans coordonnées."}
                </span>
              </div>
              <Turnstile action="simulateur" onToken={setJetonCaptcha} />
            </div>
          </div>

          {/* La génération n'a pas abouti : on dit pourquoi, la photo reste, et la demande peut partir quand même. */}
          {echecGeneration ? (
            envoye ? (
              <div role="status" className="rounded-2xl border border-green-500/40 bg-green-500/10 p-6">
                <h3 className="font-display text-xl font-bold mb-2">Demande bien reçue</h3>
                <p className="text-gris-300">
                  Votre photo et vos choix de finitions nous sont parvenus. Nous réalisons la simulation et vous l&apos;envoyons par e-mail avec votre devis, {DELAI_REPONSE}. Besoin de nous joindre avant ? {ENTREPRISE.telephone}.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-400/40 bg-amber-400/5 p-6 space-y-5">
                <div role="alert">
                  <h3 className="font-display text-xl font-bold mb-2">{PANNES.includes(echecGeneration.raison) ? "La simulation ne peut pas être générée maintenant" : "La simulation n'a pas abouti"}</h3>
                  <p className="text-gris-200 text-sm leading-relaxed">{echecGeneration.message}</p>
                </div>
                {PANNES.includes(echecGeneration.raison) ? null : (
                  <button type="button" onClick={() => void generer()} disabled={!peutGenerer} className="btn-secondary disabled:opacity-50">
                    Réessayer avec la même photo
                  </button>
                )}
                <form onSubmit={(e) => void envoyer(e)} className="space-y-4 border-t border-white/10 pt-5">
                  <div>
                    <h4 className="font-display text-lg font-bold">Recevoir ma simulation et un devis par e-mail</h4>
                    <p className="text-sm text-gris-400">Nous faisons la simulation pour vous à partir de cette photo et de vos choix. Devis gratuit {DELAI_REPONSE}, sans engagement.</p>
                  </div>
                  <ChampsContact prefixe="echec" formulaire={formulaire} onChange={setFormulaire} />
                  <button type="submit" disabled={occupe === "envoi"} className="btn-primary w-full disabled:opacity-50">
                    {occupe === "envoi" ? "Envoi…" : "Envoyer ma photo et recevoir ma simulation"}
                  </button>
                </form>
              </div>
            )
          ) : null}
        </section>
      ) : null}

      {/* ═══ Étape 3 — Résultat ═══ */}
      {etape === 3 && etat.resultat && etat.photo ? (
        <section aria-labelledby="etape-resultat" className="space-y-6">
          <h2 id="etape-resultat" className="font-display text-2xl font-bold">
            Votre {projet.label.toLowerCase()}, avant / après
          </h2>
          <BeforeAfterSlider beforeImage={etat.resultat.avant ?? etat.photo} afterImage={etat.resultat.image} beforeLabel="Avant" afterLabel="Après" />
          <ul className="flex flex-wrap gap-2 text-xs text-gris-400">
            {etat.resultat.references.map((r) => (
              <li key={r.zone} className="rounded-full border border-white/10 px-3 py-1">
                {r.libelle} : <span className="text-white">{r.nom}</span> ({r.ref})
              </li>
            ))}
          </ul>
          <p className="text-xs text-gris-500">Rendu indicatif produit par une intelligence artificielle. Les teintes exactes se valident sur échantillons avant la pose.</p>

          {envoye ? (
            <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-6">
              <h3 className="font-display text-xl font-bold mb-2">Demande bien reçue</h3>
              <p className="text-gris-300 mb-4">
                Vous recevez votre devis {DELAI_REPONSE} par e-mail, avec ce rendu. Besoin de nous joindre avant ? {ENTREPRISE.telephone}.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={etat.resultat.image} download={`coverswap-simulation-${projet.id}.png`} className="btn-secondary">
                  Télécharger le rendu
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
