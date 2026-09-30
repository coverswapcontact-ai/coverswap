"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ScrollReveal from "@/components/ScrollReveal";
import { Bouton, FOCUS_FICHIER } from "@/components/simulation/Bouton";
import { CartesPieces, type PieceCarte } from "@/components/simulation/CartesPieces";
import { track } from "@/lib/analytics";
import { envoyerEvenement } from "@/lib/evenements-site";
import { DELAI_RENDU, NB_REFERENCES } from "@/lib/offre";
import { obtenirParcoursId } from "@/lib/parcours";
import { convertirPhotoParLeCrm } from "@/lib/simulateur/generation-client";
import { getProject } from "@/lib/simulateur/projets";
import { messageErreurPhoto, preparerPhoto } from "@/lib/simulateur/photo";
import { ETAT_VIDE } from "@/lib/simulateur/reprise";
import { lireEtat, sauvegarderEtat } from "@/lib/simulateur/stockage";
import { zonesMaxEnLettres } from "@/lib/simulateur/zones";

/* ══════════════════════════════════════════════════════════════════
   SIMULATION — accès direct au simulateur depuis l'accueil (mission 15,
   partie 4) : les MÊMES cartes de pièces que le simulateur (dessins au trait,
   jamais un emoji), les mêmes boutons photo, sur la carte claire du thème ;
   la photo va dans la mémoire du simulateur (fusion, rien n'est écrasé) et
   le parcours continue sur /simulateur à l'écran des matières.
══════════════════════════════════════════════════════════════════ */
export function SimulationSection({ pieces, zonesMax }: { pieces: PieceCarte[]; zonesMax: number }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ dataUrl: string; largeur: number; hauteur: number } | null>(null);
  /** Une génération est déjà en cours dans la mémoire du simulateur : on le dit, la photo attend ici. */
  const [enCoursAilleurs, setEnCoursAilleurs] = useState(false);
  const [error, setError] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const projet = projectId ? getProject(projectId) : null;

  const handleFile = useCallback(async (file: File) => {
    setError("");
    setOccupe(true);
    try {
      const prete = await preparerPhoto(file);
      let poidsKo = 0;
      if ("aConvertir" in prete) {
        const conversion = await convertirPhotoParLeCrm(prete.file, obtenirParcoursId());
        if (!conversion.ok) throw new Error("conversion");
        setPreview({ dataUrl: conversion.dataUrl, largeur: conversion.largeur, hauteur: conversion.hauteur });
      } else {
        poidsKo = prete.poidsKo;
        setPreview({ dataUrl: prete.dataUrl, largeur: prete.largeur, hauteur: prete.hauteur });
      }
      setEnCoursAilleurs(false);
      track("simulation_photo_uploaded", { source: "home", size_kb: poidsKo });
      envoyerEvenement("PHOTO_CHARGEE", { depuis: "accueil", poids_ko: poidsKo });
    } catch (e: unknown) {
      setError(messageErreurPhoto(e instanceof Error ? e.message : "illisible"));
    } finally {
      setOccupe(false);
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (!preview || !projectId) return;
    track("cta_clicked", { cta: "home_simulation_continue" });
    // Le simulateur FUSIONNE avec sa mémoire (parcours, rendus gardés) ; seules la photo et la pièce changent.
    // Pendant une génération, la photo et la pièce du travail en cours restent : on ne part pas en silence, on le dit,
    // et la photo reste ici (« Voir la simulation en cours » mène à l'attente ; on revient la reprendre ensuite).
    void lireEtat().then(
      (memoire) => {
        if (memoire?.travailEnCours) {
          setEnCoursAilleurs(true);
          return;
        }
        return sauvegarderEtat({ ...(memoire ?? ETAT_VIDE), projet: projectId, photo: preview.dataUrl, photoLargeur: preview.largeur > 0 ? preview.largeur : null, photoHauteur: preview.hauteur > 0 ? preview.hauteur : null, selections: {}, analyse: null, majLe: Date.now() }).then(() => router.push("/simulateur?suite=1"));
      },
      () => router.push("/simulateur?suite=1")
    );
  }, [preview, projectId, router]);

  const handleSelectProject = (id: string) => {
    setProjectId(id);
    track("cta_clicked", { cta: "home_project_selected", project: id });
    envoyerEvenement("PIECE_CHOISIE", { projet: id, depuis: "accueil" });
  };

  const prendre = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    e.target.value = "";
  };

  return (
    <section id="simulation" className="relative section-padding bg-noir overflow-hidden">
      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <ScrollReveal direction="fade">
            <p className="text-gris-400 font-medium text-xs uppercase tracking-[0.2em] mb-5">Simulation sur votre photo</p>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold leading-[1.02] mb-4 md:mb-6 tracking-tight">
              Votre intérieur.
              <br />
              Transformé en {DELAI_RENDU}.
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-gris-300 text-lg md:text-xl leading-relaxed">
              Une photo de votre cuisine, salle de bain, meuble ou local, une matière parmi <strong className="text-white">{NB_REFERENCES} références Cover Styl&apos;</strong>, et le rendu sur votre propre photo.
              <br className="hidden sm:block" />
              <span className="text-white font-medium">Sans e-mail. Sans téléphone. Gratuit.</span>
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="scale" delay={0.15}>
          <div data-theme="simulation" className="mx-auto max-w-3xl rounded-[var(--rayon-md)] border border-trait bg-fond p-4 text-encre sm:p-6">
            {!projectId ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-encre-2">Pièce · Photo</p>
                  <h3 className="mt-1 font-display text-[22px] font-semibold leading-tight text-encre">Quelle pièce transformons-nous ?</h3>
                </div>
                <CartesPieces pieces={pieces} valeur={null} onChoisir={handleSelectProject} />
              </div>
            ) : !preview ? (
              <div
                className="space-y-4"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void handleFile(f);
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-encre-2">Pièce · Photo</p>
                    <h3 className="mt-1 font-display text-[22px] font-semibold leading-tight text-encre">{projet?.uploadHint}</h3>
                    <p className="mt-1 text-[14.5px] text-encre-2">{projet?.uploadTip}.</p>
                  </div>
                  <Bouton variante="discret" onClick={() => setProjectId(null)}>
                    Changer de pièce
                  </Bouton>
                </div>
                <div className={`rounded-[var(--rayon-md)] border-2 border-dashed p-3 transition-colors duration-[var(--duree-courte)] sm:p-4 ${dragOver ? "border-encre bg-white" : "border-trait"}`} aria-busy={occupe}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={`flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rayon-sm)] bg-encre text-[16px] font-medium text-white transition-colors duration-[var(--duree-courte)] hover:bg-encre-survol ${FOCUS_FICHIER} ${occupe ? "pointer-events-none opacity-60" : ""}`}>
                      {occupe ? "Préparation de la photo…" : "Prendre une photo"}
                      <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={occupe} onChange={prendre} />
                    </label>
                    <label className={`flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rayon-sm)] border border-encre bg-white text-[16px] font-medium text-encre transition-colors duration-[var(--duree-courte)] hover:bg-fond-2 ${FOCUS_FICHIER} ${occupe ? "pointer-events-none opacity-60" : ""}`}>
                      Choisir dans mes photos
                      <input type="file" accept="image/*,.heic,.heif" className="sr-only" disabled={occupe} onChange={prendre} />
                    </label>
                  </div>
                  <p className="mt-3 text-center text-[13.5px] text-encre-2">JPEG, PNG ou HEIC, 25 Mo au plus. Vous restez anonyme : aucune coordonnée à cette étape.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-encre-2">
                    {projet?.label} · Photo prête
                  </p>
                  <Bouton
                    variante="discret"
                    onClick={() => {
                      setPreview(null);
                      setEnCoursAilleurs(false);
                      setError("");
                    }}
                  >
                    Reprendre
                  </Bouton>
                </div>
                <div className="overflow-hidden rounded-[var(--rayon-md)] border border-trait bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element -- photo du visiteur (mémoire locale), rapport réservé */}
                  <img src={preview.dataUrl} alt="Votre photo" className="mx-auto block max-h-[420px] w-full object-contain bg-fond-2" style={preview.largeur > 0 && preview.hauteur > 0 ? { aspectRatio: `${preview.largeur} / ${preview.hauteur}` } : undefined} />
                </div>
                {enCoursAilleurs ? (
                  <div role="status" className="space-y-3 rounded-[var(--rayon-sm)] border border-trait bg-white p-4">
                    <p className="text-[15px] leading-relaxed text-encre">Une simulation est déjà en cours sur cet appareil : nous l&apos;affichons d&apos;abord. Revenez ensuite reprendre cette photo.</p>
                    <Bouton plein onClick={() => router.push("/simulateur")}>
                      Voir la simulation en cours
                    </Bouton>
                  </div>
                ) : (
                  <Bouton plein onClick={handleContinue}>
                    Choisir mes matières
                  </Bouton>
                )}
              </div>
            )}
            {error ? (
              <p role="alert" className="mt-4 rounded-[var(--rayon-sm)] bg-accent-fond px-4 py-3 text-[14.5px] text-accent-texte">
                {error}
              </p>
            ) : null}
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto mt-10 md:mt-14 mb-8 md:mb-12">
          {[
            { num: "01", title: "Photo", desc: "Prenez ou choisissez une photo de votre pièce, de face et bien éclairée." },
            { num: "02", title: "Matières", desc: `Jusqu'à ${zonesMaxEnLettres(zonesMax)} zones, une matière chacune parmi ${NB_REFERENCES} références Cover Styl'.` },
            { num: "03", title: "Rendu", desc: `Le rendu sur votre photo en ${DELAI_RENDU}. Vous pouvez quitter la page : la simulation continue.` },
          ].map((step, i) => (
            <ScrollReveal key={step.num} direction="up" delay={0.1 + i * 0.08}>
              <div className="relative glass-card p-6 h-full">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-gris-400 font-display text-xl font-bold">{step.num}</span>
                  <span className="font-bold text-lg text-white">{step.title}</span>
                </div>
                <p className="text-gris-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal direction="up" delay={0.25}>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gris-400">Sans e-mail · Sans téléphone · Sans inscription · Gratuit</p>
            <p className="text-xs text-gris-600 mt-5">
              Préférez parler à un humain ?{" "}
              <Link href="/contact" className="text-gris-300 hover:text-white underline underline-offset-4 font-medium">
                Demandez un devis personnalisé
              </Link>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
