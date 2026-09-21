"use client";

import { useEffect, useRef, useState } from "react";
import { envoyerPhoto, ErreurEspace, MESSAGE_APERCU, nomDuProjet, type Client, type Etat } from "./api";
import { CatalogueTeintes, vignette, type Teinte } from "./CatalogueTeintes";
import { mettreEnFile, reduirePhoto } from "./file-photos";
import { IconeAppareil, IconeCoche, IconeGalerie } from "./Illustrations";
import { Annonce, BoutonPrincipal, Feuille, FOCUS, cx } from "./ui";

/**
 * Créer une simulation depuis son espace : une de SES photos (ou une nouvelle,
 * prise sur le moment), les zones de son projet déjà cochées, une teinte par
 * zone prise dans le catalogue complet. Le lancement passe par le même moteur
 * que le site et le CRM. Ses choix sont gardés dans le téléphone : un refus
 * (limite atteinte, service indisponible, réseau coupé) ne lui fait rien
 * perdre.
 */

export type ChoixCreation = { photoId: string | null; actives: string[]; teintes: Record<string, { ref: string; nom: string }> };

export const cleChoix = (jeton: string) => `espace-creation:${jeton.split("-")[0]}`;

export function lireChoix(jeton: string): ChoixCreation | null {
  try {
    const brut = localStorage.getItem(cleChoix(jeton));
    return brut ? (JSON.parse(brut) as ChoixCreation) : null;
  } catch {
    return null;
  }
}

function garderChoix(jeton: string, choix: ChoixCreation) {
  try {
    localStorage.setItem(cleChoix(jeton), JSON.stringify(choix));
  } catch {
    // stockage indisponible : les choix vivent le temps de la visite
  }
}

export function CreationSimulation({
  ouverte,
  onFermer,
  etat,
  client,
  jeton,
  onEtat,
  favoris,
  onFavori,
  onLancee,
}: {
  ouverte: boolean;
  onFermer: () => void;
  etat: Etat;
  client: Client;
  jeton: string;
  onEtat: (etat: Etat) => void;
  favoris: string[];
  onFavori: (ref: string) => void;
  onLancee: (preparationId: string) => void;
}) {
  const creation = etat.creation;
  const zones = creation?.zones ?? [];
  const [choix, setChoix] = useState<ChoixCreation>(() => {
    const garde = lireChoix(jeton);
    const photos = etat.photos.map((p) => p.id);
    // Sa dernière photo choisie, sinon la première (la vue d'ensemble, d'après le guide des photos) : un geste de moins.
    const photoId = garde?.photoId && photos.includes(garde.photoId) ? garde.photoId : (photos[0] ?? null);
    const actives = garde?.actives?.length ? garde.actives : (creation?.zonesProjet ?? []);
    return { photoId, actives: actives.filter((z) => zones.some((x) => x.zone === z)), teintes: garde?.teintes ?? {} };
  });
  const [zoneEnChoix, setZoneEnChoix] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState<number | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<{ ton: "erreur" | "info"; texte: string } | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const galerie = useRef<HTMLInputElement>(null);
  const apercu = Boolean(client.apercu);
  const nom = nomDuProjet(etat.typeProjet);

  useEffect(() => garderChoix(jeton, choix), [jeton, choix]);

  const modifier = (modif: (c: ChoixCreation) => ChoixCreation) => {
    setMessage(null);
    setChoix(modif);
  };
  const basculerZone = (zone: string) => modifier((c) => ({ ...c, actives: c.actives.includes(zone) ? c.actives.filter((z) => z !== zone) : [...c.actives, zone] }));

  async function nouvellePhoto(fichiers: FileList | null) {
    const fichier = fichiers?.[0];
    if (camera.current) camera.current.value = "";
    if (galerie.current) galerie.current.value = "";
    if (!fichier) return;
    if (apercu) return setMessage({ ton: "info", texte: MESSAGE_APERCU });
    setMessage(null);
    setEnvoi(0);
    const { blob, nom: nomFichier } = await reduirePhoto(fichier);
    const avant = new Set(etat.photos.map((p) => p.id));
    try {
      const resultat = await envoyerPhoto(client, blob, nomFichier, (part) => setEnvoi(part));
      if (resultat.espace) {
        onEtat(resultat.espace);
        const arrivee = resultat.espace.photos.find((p) => !avant.has(p.id));
        if (arrivee) modifier((c) => ({ ...c, photoId: arrivee.id }));
      }
    } catch (erreur) {
      if (erreur instanceof ErreurEspace && erreur.passager) {
        // Gardée dans le téléphone : elle partira seule (onglet Photos), comme les autres.
        await mettreEnFile({ cle: `${Date.now()}-creation`, jeton, blob, nom: nomFichier, ajouteeLe: Date.now() });
        setMessage({ ton: "erreur", texte: "Pas de réseau\u00a0: votre photo est gardée dans votre téléphone et partira toute seule. En attendant, choisissez une photo déjà envoyée." });
      } else setMessage({ ton: "erreur", texte: erreur instanceof Error ? erreur.message : "Photo refusée." });
    } finally {
      setEnvoi(null);
    }
  }

  async function lancer() {
    // Aperçu depuis le CRM : on le dit d'abord, avant tout contrôle.
    if (apercu) return setMessage({ ton: "info", texte: MESSAGE_APERCU });
    const retenues = choix.actives.filter((z) => zones.some((x) => x.zone === z));
    const sansTeinte = retenues.filter((z) => !choix.teintes[z]);
    if (!choix.photoId) return setMessage({ ton: "erreur", texte: "Choisissez d'abord la photo sur laquelle faire la simulation." });
    if (retenues.length === 0) return setMessage({ ton: "erreur", texte: "Touchez au moins une zone, puis choisissez sa teinte." });
    if (sansTeinte.length > 0) {
      const libelles = sansTeinte.map((z) => zones.find((x) => x.zone === z)?.libelle ?? z).join(", ");
      return setMessage({ ton: "erreur", texte: `Choisissez une teinte pour\u00a0: ${libelles} (ou décochez ${sansTeinte.length > 1 ? "ces zones" : "cette zone"}).` });
    }
    setOccupe(true);
    setMessage(null);
    try {
      const reponse = await client.envoyerJson<{ preparationId: string; restantes: number; espace: Etat }>("/simulations/creer", "POST", { photoId: choix.photoId, zones: retenues.map((zone) => ({ zone, ref: choix.teintes[zone].ref })) });
      onEtat(reponse.espace);
      onLancee(reponse.preparationId);
    } catch (erreur) {
      const e = erreur instanceof ErreurEspace ? erreur : new ErreurEspace("Réessayez dans un instant.", 500);
      setMessage({ ton: e.raison === "apercu" ? "info" : "erreur", texte: e.status === 0 ? "Pas de réseau\u00a0: votre simulation n'est pas partie. Vos choix sont gardés\u00a0: relancez dès le retour du réseau." : e.message });
    } finally {
      setOccupe(false);
    }
  }

  const zoneOuverte = zones.find((z) => z.zone === zoneEnChoix) ?? null;
  const restantes = creation?.restantes ?? 0;

  return (
    <>
      <Feuille
        ouverte={ouverte}
        onFermer={onFermer}
        titre="Créer une simulation"
        sousTitre={restantes > 0 ? `Il vous en reste ${restantes}. Vos choix restent gardés si vous quittez.` : null}
        libelleFermer="Plus tard"
        pied={
          <BoutonPrincipal onClick={() => void lancer()} disabled={occupe}>
            {occupe ? "Lancement…" : "Lancer ma simulation"}
          </BoutonPrincipal>
        }
      >
        <div className="space-y-6 pt-1">
          {message ? <Annonce ton={message.ton === "erreur" ? "erreur" : "info"}>{message.texte}</Annonce> : null}

          <section aria-labelledby="creation-photo" className="space-y-2.5">
            <h3 id="creation-photo" className="px-1 text-[17.5px] font-semibold text-[#1A1A1A]">
              1. La photo de {nom.votre}
            </h3>
            <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => void nouvellePhoto(e.target.files)} tabIndex={-1} aria-hidden />
            <input ref={galerie} type="file" accept="image/*" className="sr-only" onChange={(e) => void nouvellePhoto(e.target.files)} tabIndex={-1} aria-hidden />
            <ul className="grid grid-cols-3 gap-2">
              {etat.photos.map((p) => {
                const choisie = choix.photoId === p.id;
                return (
                  <li key={p.id}>
                    <button type="button" onClick={() => modifier((c) => ({ ...c, photoId: p.id }))} aria-pressed={choisie} aria-label={choisie ? "Photo choisie" : "Choisir cette photo"} className={cx("relative block aspect-square w-full overflow-hidden rounded-xl bg-[#ECEAE5]", choisie ? "ring-[3px] ring-[#1A1A1A] ring-offset-2 ring-offset-[#F5F4F1]" : "ring-1 ring-black/10", FOCUS)}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- photo privée servie par le CRM */}
                      <img src={client.url(`/photos/${p.id}`)} alt="" className={cx("h-full w-full object-cover", !choisie && choix.photoId && "opacity-70")} loading="lazy" referrerPolicy="no-referrer" />
                      {choisie ? (
                        <span className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1A1A1A] text-white">
                          <IconeCoche />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
              <li>
                <button type="button" onClick={() => (apercu ? setMessage({ ton: "info", texte: MESSAGE_APERCU }) : camera.current?.click())} disabled={envoi !== null} className={cx("flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#CFCAC2] text-[13.5px] leading-tight font-semibold text-[#1A1A1A] active:bg-[#F2F0EC]", FOCUS)}>
                  <IconeAppareil taille={22} />
                  {envoi !== null ? `Envoi… ${Math.round(envoi * 100)}\u00a0%` : "Prendre une photo"}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => (apercu ? setMessage({ ton: "info", texte: MESSAGE_APERCU }) : galerie.current?.click())} disabled={envoi !== null} className={cx("flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#CFCAC2] text-[13.5px] leading-tight font-semibold text-[#1A1A1A] active:bg-[#F2F0EC]", FOCUS)}>
                  <IconeGalerie taille={22} />
                  Dans mes photos
                </button>
              </li>
            </ul>
            {etat.photos.length === 0 ? <p className="px-1 text-[14.5px] leading-snug text-[#5F5A53]">De face, en plein jour, toute la pièce dans l&apos;image&nbsp;: la simulation n&apos;en sera que plus juste.</p> : null}
          </section>

          <section aria-labelledby="creation-zones" className="space-y-2.5">
            <div className="px-1">
              <h3 id="creation-zones" className="text-[17.5px] font-semibold text-[#1A1A1A]">
                2. Les zones et leurs teintes
              </h3>
              <p className="text-[14.5px] text-[#5F5A53]">{creation?.zonesProjet.length ? "Cochées d'après votre projet. Une teinte par zone." : "Touchez les zones à changer, puis choisissez leur teinte."}</p>
            </div>
            <ul className="space-y-2">
              {zones.map((z) => {
                const active = choix.actives.includes(z.zone);
                const teinte = choix.teintes[z.zone];
                return (
                  <li key={z.zone} className={cx("flex items-center gap-2 rounded-2xl border-2 bg-white p-2 pr-2.5", active ? "border-[#1A1A1A]" : "border-[#E2DFD9]")}>
                    <button type="button" role="checkbox" aria-checked={active} onClick={() => basculerZone(z.zone)} className={cx("flex min-h-[52px] min-w-0 flex-1 items-center gap-3 rounded-xl px-1.5 text-left", FOCUS)}>
                      <span aria-hidden className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-[13px] font-bold", active ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#BDB8B0] bg-white")}>
                        {active ? "✓" : ""}
                      </span>
                      <span className={cx("text-[16px] leading-snug font-semibold", active ? "text-[#1A1A1A]" : "text-[#6B665F]")}>{z.libelle}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!active) basculerZone(z.zone);
                        setZoneEnChoix(z.zone);
                      }}
                      aria-label={teinte ? `${z.libelle}\u00a0: ${teinte.nom}. Changer de teinte` : `Choisir une teinte pour ${z.libelle}`}
                      className={cx("flex min-h-[52px] max-w-[52%] shrink-0 items-center gap-2 rounded-xl px-2 text-left active:bg-[#F2F0EC]", teinte ? "bg-[#F6F5F2]" : "border border-dashed border-[#BDB8B0]", FOCUS)}
                    >
                      {teinte ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element -- vignette servie par le CRM */}
                          <img src={vignette(client, teinte.ref)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-black/10" referrerPolicy="no-referrer" />
                          <span className="min-w-0 truncate text-[14.5px] font-semibold text-[#1A1A1A]">{teinte.nom}</span>
                        </>
                      ) : (
                        <span className="px-1 text-[14.5px] font-semibold text-[#B00000]">Choisir la teinte</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          <p className="px-1 text-[13.5px] leading-relaxed text-[#6B665F]">Une minute environ. Le résultat arrive dans vos simulations&nbsp;; CoverSwap le voit aussi.</p>
        </div>
      </Feuille>

      <CatalogueTeintes
        key={zoneEnChoix ?? "aucune"}
        ouvert={Boolean(zoneOuverte)}
        onFermer={() => setZoneEnChoix(null)}
        zone={zoneOuverte?.libelle ?? ""}
        choisie={zoneOuverte ? (choix.teintes[zoneOuverte.zone]?.ref ?? null) : null}
        favoris={favoris}
        onFavori={onFavori}
        client={client}
        onChoisir={(t: Teinte) => {
          const zone = zoneEnChoix;
          setZoneEnChoix(null);
          if (zone) modifier((c) => ({ ...c, actives: c.actives.includes(zone) ? c.actives : [...c.actives, zone], teintes: { ...c.teintes, [zone]: { ref: t.id, nom: t.nom } } }));
        }}
      />
    </>
  );
}
