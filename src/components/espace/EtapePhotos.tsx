"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { envoyerPhoto, ErreurEspace, MESSAGE_APERCU, nomDuProjet, type Client, type Etat } from "./api";
import { mettreEnFile, photosEnFile, reduirePhoto, retirerDeLaFile, type PhotoEnFile } from "./file-photos";
import { CuisineDeFace, IconeAppareil, IconeCoche, IconeGalerie } from "./Illustrations";
import { Annonce, BoutonPrincipal, BoutonSecondaire, Carte, EnteteEtape, Surtitre, cx } from "./ui";

/**
 * Onglet Photos — le point de bascule. Un guide qui se lit en dix
 * secondes, l'appareil photo ou la galerie en un geste, chaque photo à l'écran
 * tout de suite avec sa progression. Réseau faible : réduite avant l'envoi ;
 * coupé : gardée dans le téléphone et renvoyée seule, même le lendemain.
 */

type EtatEnvoi = { cle: string; apercu: string; part: number; etat: "attente" | "envoi" | "echec" | "ok"; message?: string };

/** Salle de bain, meubles, local : les prises utiles, sans dessin de cuisine. */
const PRISES_AUTRES: Record<string, { titre: string; aide: string }[]> = {
  SDB: [
    { titre: "Vue d'ensemble", aide: "Depuis la porte, toute la pièce dans l'image" },
    { titre: "Le meuble vasque", aide: "De face, les portes et le plan entiers" },
    { titre: "Un détail", aide: "Une porte, une poignée ou un joint, de près" },
  ],
  MEUBLES: [
    { titre: "Le meuble entier", aide: "De face\u00a0: reculez pour qu'il tienne dans l'image" },
    { titre: "Les portes", aide: "Bien droit, portes fermées" },
    { titre: "Un détail", aide: "Une poignée, un chant, l'état de la surface" },
  ],
  PRO: [
    { titre: "Vue d'ensemble", aide: "Le comptoir ou le mobilier dans son local" },
    { titre: "De face", aide: "Chaque meuble à recouvrir, bien droit" },
    { titre: "Un détail", aide: "Un angle, un chant, l'état de la surface" },
  ],
};

const PRISES = [
  { cadre: "ensemble" as const, titre: "Vue d'ensemble", aide: "Reculez au maximum, toute la pièce dans l'image" },
  { cadre: "hauts" as const, titre: "Meubles hauts", aide: "De face, les portes entières" },
  { cadre: "bas" as const, titre: "Meubles bas", aide: "De face, à hauteur de poitrine" },
  { cadre: "plan" as const, titre: "Plan de travail", aide: "En légère plongée, sur toute sa longueur" },
  { cadre: "detail" as const, titre: "Un détail", aide: "Une porte et sa poignée, de près" },
];

export function EtapePhotos({ etat, client, jeton, onEtat, onSuite }: { etat: Etat; client: Client; jeton: string; onEtat: (etat: Etat) => void; onSuite: () => void }) {
  const [envois, setEnvois] = useState<EtatEnvoi[]>([]);
  const [recu, setRecu] = useState(false);
  const [aperculu, setAperculu] = useState(false);
  // Retirer une photo : un geste évident sous la photo, une confirmation courte, un mot qui dit que c'est fait.
  const [aRetirer, setARetirer] = useState<string | null>(null);
  const [retrait, setRetrait] = useState(false);
  const [retire, setRetire] = useState<{ ton: "succes" | "erreur"; texte: string } | null>(null);
  const enCours = useRef(false);
  const camera = useRef<HTMLInputElement>(null);
  const galerie = useRef<HTMLInputElement>(null);
  const apercu = Boolean(client.apercu);
  const projet = nomDuProjet(etat.typeProjet);

  async function retirer(photoId: string) {
    setRetrait(true);
    setRetire(null);
    try {
      const { espace } = await client.envoyerJson<{ espace: Etat }>(`/photos/${photoId}/retrait`, "POST", {});
      onEtat(espace);
      setRetire({ ton: "succes", texte: "Photo retirée. Vous pouvez en déposer d'autres." });
    } catch (erreur) {
      setRetire({ ton: "erreur", texte: erreur instanceof Error ? erreur.message : "Photo non retirée : réessayez dans un instant." });
    } finally {
      setRetrait(false);
      setARetirer(null);
    }
  }

  const maj = (cle: string, modif: Partial<EtatEnvoi>) => setEnvois((liste) => liste.map((e) => (e.cle === cle ? { ...e, ...modif } : e)));

  /** Vide la file, une photo après l'autre ; ce qui échoue par manque de réseau reste pour plus tard. */
  const vider = useCallback(async () => {
    if (enCours.current || apercu) return;
    enCours.current = true;
    try {
      for (const photo of await photosEnFile(jeton)) {
        maj(photo.cle, { etat: "envoi", part: 0, message: undefined });
        try {
          const resultat = await envoyerPhoto(client, photo.blob, photo.nom, (part) => maj(photo.cle, { part }));
          await retirerDeLaFile(photo.cle);
          maj(photo.cle, { etat: "ok", part: 1 });
          if (resultat.espace) onEtat(resultat.espace);
          setRecu(true);
        } catch (erreur) {
          const reseau = erreur instanceof ErreurEspace && (erreur.status === 0 || erreur.status >= 500 || erreur.status === 429);
          if (!reseau) {
            // Refusée pour de bon (format, poids) : on le dit, on ne la renvoie pas.
            await retirerDeLaFile(photo.cle);
            maj(photo.cle, { etat: "echec", message: erreur instanceof Error ? erreur.message : "Photo refusée." });
            continue;
          }
          // Pas de réseau : toutes celles qui restent attendent son retour (inutile d'essayer les suivantes).
          setEnvois((liste) => liste.map((e) => (e.etat === "ok" || (e.etat === "echec" && e.message) ? e : { ...e, etat: "echec", message: undefined })));
          break;
        }
      }
    } finally {
      enCours.current = false;
    }
  }, [apercu, client, jeton, onEtat]);

  // Au retour sur la page : ce qui attendait dans le téléphone réapparaît et repart.
  useEffect(() => {
    let actif = true;
    void photosEnFile(jeton).then((attente) => {
      if (!actif || attente.length === 0) return;
      setEnvois((liste) => [...liste, ...attente.filter((p) => !liste.some((e) => e.cle === p.cle)).map((p) => ({ cle: p.cle, apercu: URL.createObjectURL(p.blob), part: 0, etat: "attente" as const }))]);
      void vider();
    });
    const relancer = () => void vider();
    window.addEventListener("online", relancer);
    const minuterie = window.setInterval(relancer, 20_000);
    return () => {
      actif = false;
      window.removeEventListener("online", relancer);
      window.clearInterval(minuterie);
    };
  }, [jeton, vider]);

  async function ajouter(fichiers: FileList | null) {
    if (!fichiers?.length || apercu) return;
    const liste = [...fichiers].slice(0, 12);
    for (const [i, fichier] of liste.entries()) {
      const cle = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
      const apercuUrl = URL.createObjectURL(fichier);
      setEnvois((e) => [...e, { cle, apercu: apercuUrl, part: 0, etat: "attente" }]);
      const { blob, nom } = await reduirePhoto(fichier);
      const enFile: PhotoEnFile = { cle, jeton, blob, nom, ajouteeLe: Date.now() + i };
      await mettreEnFile(enFile);
    }
    if (camera.current) camera.current.value = "";
    if (galerie.current) galerie.current.value = "";
    void vider();
  }

  const recues = etat.photos.length;
  const attente = envois.filter((e) => e.etat !== "ok");
  const enAttenteDeReseau = attente.filter((e) => e.etat === "echec" && !e.message);
  const refusees = attente.filter((e) => e.etat === "echec" && e.message);

  return (
    <div className="space-y-5">
      <EnteteEtape
        titre={recues > 0 ? "Vos photos" : `Envoyez-nous quelques photos de ${projet.votre}`}
        phrase={recues > 0 ? `${recues > 1 ? `Vos ${recues} photos sont bien arrivées` : "Votre photo est bien arrivée"}. Vous pouvez en ajouter à tout moment, même plus tard.` : "Trois ou quatre photos suffisent. C'est sur elles que se font vos simulations, dans votre propre pièce."}
      />

      {recu || (recues > 0 && attente.length === 0 && envois.length > 0) ? (
        <div className="space-y-3">
          <Annonce ton="succes">
            <strong className="font-semibold">Merci, vos photos sont bien arrivées.</strong> Étape suivante&nbsp;: votre projet, en quelques gestes.
          </Annonce>
          {attente.length === 0 ? <BoutonPrincipal onClick={onSuite}>Continuer&nbsp;: mon projet</BoutonPrincipal> : null}
        </div>
      ) : null}

      <Carte className="space-y-3">
        <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" id="prise-photo" onChange={(e) => void ajouter(e.target.files)} />
        <input ref={galerie} type="file" accept="image/*" multiple className="sr-only" id="choix-photos" onChange={(e) => void ajouter(e.target.files)} />
        {recues > 0 ? (
          <BoutonSecondaire onClick={() => (apercu ? setAperculu(true) : camera.current?.click())}>
            <IconeAppareil /> Prendre une autre photo
          </BoutonSecondaire>
        ) : (
          <BoutonPrincipal onClick={() => (apercu ? setAperculu(true) : camera.current?.click())}>
            <IconeAppareil /> Prendre une photo
          </BoutonPrincipal>
        )}
        <BoutonSecondaire onClick={() => (apercu ? setAperculu(true) : galerie.current?.click())}>
          <IconeGalerie /> Choisir dans mes photos
        </BoutonSecondaire>
        {aperculu ? <Annonce>{MESSAGE_APERCU}</Annonce> : null}
        <p className="text-center text-[14px] text-[#5F5A53]">Plusieurs d&apos;un coup, c&apos;est possible. Formats iPhone acceptés.</p>
      </Carte>

      {recues > 0 || attente.length > 0 ? (
        <section aria-label="Photos déposées">
          <Surtitre>
            {recues > 0 ? `${recues} photo${recues > 1 ? "s" : ""} reçue${recues > 1 ? "s" : ""}` : "Envoi en cours"}
            {attente.length > 0 ? ` · ${attente.length} en cours` : ""}
          </Surtitre>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {attente.map((e) => (
              <li key={e.cle} className="relative aspect-square overflow-hidden rounded-xl bg-[#ECEAE5]">
                {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local, pas encore envoyé */}
                <img src={e.apercu} alt="" className={cx("h-full w-full object-cover", e.etat !== "echec" && "opacity-70")} />
                <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1.5 text-[12px] font-medium text-white" aria-live="polite">
                  {e.etat === "echec" ? (e.message ? "Refusée" : "En attente") : e.etat === "envoi" ? `Envoi… ${Math.round(e.part * 100)}\u00a0%` : "En file"}
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/30">
                    <span className="block h-full bg-white transition-[width]" style={{ width: `${Math.round(e.part * 100)}%` }} />
                  </span>
                </div>
              </li>
            ))}
            {etat.photos.map((p) => (
              <li key={p.id} className="flex flex-col gap-1">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[#ECEAE5]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- photo privée servie par le CRM */}
                  <img src={client.url(`/photos/${p.id}`)} alt="Photo déposée" className={cx("h-full w-full object-cover", aRetirer === p.id && "opacity-40")} loading="lazy" referrerPolicy="no-referrer" />
                  <span className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1F7A4D] text-white" aria-label="Reçue">
                    <IconeCoche />
                  </span>
                </div>
                {aRetirer === p.id ? (
                  <div className="grid grid-cols-2 gap-1" role="group" aria-label="Retirer cette photo ?">
                    <button type="button" onClick={() => setARetirer(null)} className="min-h-[44px] rounded-lg border border-[#D3CFC8] bg-white text-[14px] font-medium text-[#1A1A1A] active:bg-[#F2F0EC]">
                      Non
                    </button>
                    <button type="button" disabled={retrait} onClick={() => void retirer(p.id)} className="min-h-[44px] rounded-lg bg-[#1A1A1A] text-[14px] font-semibold text-white disabled:opacity-50">
                      {retrait ? "…" : "Retirer"}
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => (apercu ? setAperculu(true) : setARetirer(p.id))} aria-label="Retirer cette photo" className="min-h-[44px] rounded-lg text-[14px] font-medium text-[#4F4A44] underline decoration-[#BDB8B0] underline-offset-4 active:bg-[#F2F0EC]">
                    Retirer
                  </button>
                )}
              </li>
            ))}
          </ul>
          {retire ? <div className="mt-3"><Annonce ton={retire.ton}>{retire.texte}</Annonce></div> : null}
          {enAttenteDeReseau.length > 0 ? (
            <div className="mt-3 space-y-2">
              <Annonce>Pas de réseau pour l&apos;instant. Vos photos sont gardées dans votre téléphone&nbsp;: elles partiront toutes seules, même si vous fermez cette page.</Annonce>
              <BoutonSecondaire onClick={() => void vider()}>Réessayer maintenant</BoutonSecondaire>
            </div>
          ) : null}
          {refusees.map((e) => (
            <div key={e.cle} className="mt-3">
              <Annonce ton="erreur">{e.message}</Annonce>
            </div>
          ))}
        </section>
      ) : null}

      <Carte>
        <Surtitre>Quelles photos prendre</Surtitre>
        {PRISES_AUTRES[etat.typeProjet] ? (
          // Hors cuisine : pas de dessin de cuisine (il égarerait), trois prises dites simplement.
          <ul className="mt-3 space-y-3">
            {PRISES_AUTRES[etat.typeProjet].map((prise) => (
              <li key={prise.titre} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EFEA] text-[#1A1A1A]" aria-hidden>
                  <IconeAppareil taille={18} />
                </span>
                <span>
                  <span className="block text-[16px] leading-snug font-semibold text-[#1A1A1A]">{prise.titre}</span>
                  <span className="block text-[14.5px] leading-snug text-[#5F5A53]">{prise.aide}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4">
            {PRISES.map((prise) => (
              <li key={prise.cadre} className="flex flex-col gap-1.5">
                <CuisineDeFace cadre={prise.cadre} className="w-full rounded-xl bg-[#F7F6F3] p-1.5" />
                <span className="text-[15px] leading-tight font-semibold text-[#1A1A1A]">{prise.titre}</span>
                <span className="text-[13.5px] leading-snug text-[#5F5A53]">{prise.aide}</span>
              </li>
            ))}
          </ul>
        )}
      </Carte>

      <Carte>
        <Surtitre>Pour une belle simulation</Surtitre>
        <ul className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { bon: true, titre: "De loin, en plein jour", style: {} },
            { bon: false, titre: "Pas de trop près", style: { transform: "scale(3.2)", transformOrigin: "22% 74%" } },
            { bon: false, titre: "Pas à contre-jour", style: { filter: "brightness(0.42) contrast(1.35)" } },
          ].map((exemple) => (
            <li key={exemple.titre} className="flex flex-col gap-1.5">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#ECEAE5]">
                {/* eslint-disable-next-line @next/next/no-img-element -- illustration du site */}
                <img src="/images/fonds/photo-1639405069836-f82aa6dcb900-800.jpg" alt="" className="h-full w-full object-cover" style={exemple.style} />
                {!exemple.bon && exemple.titre.includes("contre-jour") ? <span className="absolute inset-0 bg-[radial-gradient(circle_at_18%_40%,rgba(255,255,255,0.95),rgba(255,255,255,0)_45%)]" aria-hidden /> : null}
                <span className={cx("absolute bottom-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full text-[15px] font-bold text-white", exemple.bon ? "bg-[#1F7A4D]" : "bg-[#CC0000]")} aria-hidden>
                  {exemple.bon ? "✓" : "✕"}
                </span>
              </div>
              <span className="text-[13.5px] leading-tight font-medium text-[#1A1A1A]">{exemple.titre}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[#4F4A44]">Allumez les lumières, ouvrez les volets, et gardez les portes fermées. Le désordre n&apos;est pas un problème&nbsp;: seuls les meubles comptent.</p>
      </Carte>

      {recues > 0 && !recu ? <BoutonPrincipal onClick={onSuite}>Continuer&nbsp;: mon projet</BoutonPrincipal> : null}
      <p className="px-1 text-[13.5px] leading-relaxed text-[#6B665F]">Vos photos restent privées&nbsp;: elles servent uniquement à préparer votre projet et ne sont jamais publiées sans votre accord.</p>
    </div>
  );
}
