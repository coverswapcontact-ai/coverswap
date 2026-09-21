"use client";

import { useMemo, useRef, useState } from "react";
import { dateCourte, envoyerPhoto, ErreurEspace, MESSAGE_APERCU, type Client, type Etat, type Piece } from "./api";
import { CatalogueTeintes, vignette, type Teinte } from "./CatalogueTeintes";
import { mettreEnFile, reduirePhoto } from "./file-photos";
import { IconeAppareil, IconeCoche, IconeGalerie } from "./Illustrations";
import { Annonce, BoutonPrincipal, BoutonSecondaire, Carte, FOCUS, cx } from "./ui";

/**
 * « Créer une simulation » — le simulateur du site, en version express, dans
 * l'espace du client. Trois gestes sur un seul écran : sa photo, sa pièce (toutes
 * celles du site : cuisine, salle de bain, meubles et dressing, local
 * professionnel, murs et plafond), une teinte par surface dans le catalogue
 * complet — puis « Lancer ». Toucher une surface ouvre directement le
 * catalogue : pas d'écran de plus.
 *
 * On repart TOUJOURS de zéro : aucune photo présélectionnée, aucune teinte
 * reprise d'une simulation précédente. Seule exception : un lancement qui a
 * échoué (réseau coupé, service indisponible, limite atteinte) garde ses choix
 * le temps de réessayer — rien à refaire. Même moteur que le site et le CRM.
 */

type Choix = { piece: string; photoId: string | null; teintes: Record<string, { ref: string; nom: string }> };

const cleEchec = (jeton: string) => `espace-creation-echec:${jeton.split("-")[0]}`;

/** Les choix d'un lancement qui n'est pas parti : repris une fois, puis oubliés. */
function reprendreEchec(jeton: string): Choix | null {
  try {
    const brut = localStorage.getItem(cleEchec(jeton));
    if (!brut) return null;
    localStorage.removeItem(cleEchec(jeton));
    // Nettoyage : l'ancienne mémoire des choix (avant le 22/09) ne sert plus.
    localStorage.removeItem(`espace-creation:${jeton.split("-")[0]}`);
    const garde = JSON.parse(brut) as Choix & { le?: number };
    return garde.le && Date.now() - garde.le < 6 * 3_600_000 ? { piece: garde.piece, photoId: garde.photoId, teintes: garde.teintes ?? {} } : null;
  } catch {
    return null;
  }
}

export function CreationSimulation({
  etat,
  client,
  jeton,
  onEtat,
  favoris,
  onFavori,
  onLancee,
  onDemanderPlus,
  demandeEnCours,
}: {
  etat: Etat;
  client: Client;
  jeton: string;
  onEtat: (etat: Etat) => void;
  favoris: string[];
  onFavori: (ref: string) => void;
  onLancee: (preparationId: string) => void;
  onDemanderPlus: () => void;
  demandeEnCours: boolean;
}) {
  const creation = etat.creation;
  // Toutes les pièces du site ; un CRM pas encore à jour n'en donne qu'une (celle du projet).
  const pieces: Piece[] = useMemo(() => creation?.pieces ?? [{ piece: creation?.piece ?? etat.typeProjet ?? "CUISINE", libelle: "Votre projet", aide: "", zones: creation?.zones ?? [] }], [creation, etat.typeProjet]);
  const pieceDuProjet = pieces.some((p) => p.piece === (creation?.piece ?? etat.typeProjet)) ? (creation?.piece ?? etat.typeProjet) : pieces[0].piece;
  const [choix, setChoix] = useState<Choix>(() => reprendreEchec(jeton) ?? { piece: pieceDuProjet, photoId: null, teintes: {} });
  const [zoneEnChoix, setZoneEnChoix] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState<number | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<{ ton: "erreur" | "info"; texte: string } | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const galerie = useRef<HTMLInputElement>(null);
  const apercu = Boolean(client.apercu);
  const piece = pieces.find((p) => p.piece === choix.piece) ?? pieces[0];
  const zones = piece.zones;
  const choisies = zones.filter((z) => choix.teintes[z.zone]);
  // Une photo retirée entre-temps ne reste pas choisie.
  const photoId = choix.photoId && etat.photos.some((p) => p.id === choix.photoId) ? choix.photoId : null;

  const modifier = (modif: (c: Choix) => Choix) => {
    setMessage(null);
    setChoix(modif);
  };

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
        setMessage({ ton: "erreur", texte: "Pas de réseau : votre photo est gardée dans votre téléphone et partira toute seule. En attendant, choisissez une photo déjà envoyée." });
      } else setMessage({ ton: "erreur", texte: erreur instanceof Error ? erreur.message : "Photo refusée." });
    } finally {
      setEnvoi(null);
    }
  }

  async function lancer() {
    // Aperçu depuis le CRM : on le dit d'abord, avant tout contrôle.
    if (apercu) return setMessage({ ton: "info", texte: MESSAGE_APERCU });
    if (!photoId) return setMessage({ ton: "erreur", texte: "Choisissez d'abord la photo sur laquelle faire la simulation." });
    if (choisies.length === 0) return setMessage({ ton: "erreur", texte: "Touchez une surface pour choisir sa teinte." });
    if (choisies.length > 4) return setMessage({ ton: "erreur", texte: "Quatre surfaces au plus par simulation : retirez-en une, vous pourrez en refaire une autre ensuite." });
    setOccupe(true);
    setMessage(null);
    try {
      const reponse = await client.envoyerJson<{ preparationId: string; restantes: number; espace: Etat }>("/simulations/creer", "POST", { piece: piece.piece, photoId: photoId, zones: choisies.map((z) => ({ zone: z.zone, ref: choix.teintes[z.zone].ref })) });
      try {
        localStorage.removeItem(cleEchec(jeton));
      } catch {
        // stockage indisponible
      }
      onEtat(reponse.espace);
      onLancee(reponse.preparationId);
    } catch (erreur) {
      const e = erreur instanceof ErreurEspace ? erreur : new ErreurEspace("Réessayez dans un instant.", 500);
      // Rien n'est parti : ses choix sont gardés pour la prochaine tentative (et seulement pour elle).
      try {
        localStorage.setItem(cleEchec(jeton), JSON.stringify({ ...choix, le: Date.now() }));
      } catch {
        // stockage indisponible : ses choix restent à l'écran
      }
      setMessage({ ton: e.raison === "apercu" ? "info" : "erreur", texte: e.status === 0 ? "Pas de réseau : votre simulation n'est pas partie. Vos choix sont gardés : relancez dès le retour du réseau." : e.message });
    } finally {
      setOccupe(false);
    }
  }

  if (!creation) return <Annonce>La création de simulations n&apos;est pas encore ouverte pour votre espace. Appelez CoverSwap&nbsp;: nous l&apos;activons tout de suite.</Annonce>;

  if (!creation.disponible) return <Annonce>La création de simulations est momentanément indisponible. Réessayez un peu plus tard, ou appelez CoverSwap&nbsp;: nous sommes prévenus.</Annonce>;

  if (creation.restantes <= 0 && creation.enCours.length === 0) {
    const total = creation.gratuites + creation.accordees;
    return (
      <Carte className="space-y-3">
        <p className="text-[17px] leading-relaxed font-semibold text-[#1A1A1A]">
          {total > 1 ? `Vous avez utilisé vos ${total} simulations.` : "Vous avez utilisé votre simulation."} Demandez-en d&apos;autres à CoverSwap.
        </p>
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

  const zoneOuverte = zones.find((z) => z.zone === zoneEnChoix) ?? null;

  return (
    <div className="space-y-6 pb-24">
      <p className="px-1 text-[15px] text-[#5F5A53]">
        Il vous en reste <strong className="text-[#1A1A1A]">{creation.restantes}</strong> sur {creation.gratuites + creation.accordees}.
      </p>

      <section aria-labelledby="creation-photo" className="space-y-2.5">
        <h2 id="creation-photo" className="flex items-center gap-2 px-1 text-[18px] font-semibold text-[#1A1A1A]">
          <Etape numero={1} fait={Boolean(photoId)} /> Votre photo
        </h2>
        <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => void nouvellePhoto(e.target.files)} tabIndex={-1} aria-hidden />
        <input ref={galerie} type="file" accept="image/*" className="sr-only" onChange={(e) => void nouvellePhoto(e.target.files)} tabIndex={-1} aria-hidden />
        <ul className="grid grid-cols-3 gap-2">
          {etat.photos.map((p) => {
            const choisie = photoId === p.id;
            return (
              <li key={p.id}>
                <button type="button" onClick={() => modifier((c) => ({ ...c, photoId: p.id }))} aria-pressed={choisie} aria-label={choisie ? "Photo choisie" : "Choisir cette photo"} className={cx("relative block aspect-square w-full overflow-hidden rounded-xl bg-[#ECEAE5]", choisie ? "ring-[3px] ring-[#1A1A1A] ring-offset-2 ring-offset-[#F5F4F1]" : "ring-1 ring-black/10", FOCUS)}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- photo privée servie par le CRM */}
                  <img src={client.url(`/photos/${p.id}`)} alt="" className={cx("h-full w-full object-cover", !choisie && photoId && "opacity-60")} loading="lazy" referrerPolicy="no-referrer" />
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
              {envoi !== null ? `Envoi… ${Math.round(envoi * 100)} %` : "Prendre une photo"}
            </button>
          </li>
          <li>
            <button type="button" onClick={() => (apercu ? setMessage({ ton: "info", texte: MESSAGE_APERCU }) : galerie.current?.click())} disabled={envoi !== null} className={cx("flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#CFCAC2] text-[13.5px] leading-tight font-semibold text-[#1A1A1A] active:bg-[#F2F0EC]", FOCUS)}>
              <IconeGalerie taille={22} />
              Dans mes photos
            </button>
          </li>
        </ul>
        <p className="px-1 text-[14.5px] leading-snug text-[#5F5A53]">De face, en plein jour, toute la pièce dans l&apos;image&nbsp;: la simulation n&apos;en sera que plus juste.</p>
      </section>

      {pieces.length > 1 ? (
        <section aria-labelledby="creation-piece" className="space-y-2.5">
          <h2 id="creation-piece" className="flex items-center gap-2 px-1 text-[18px] font-semibold text-[#1A1A1A]">
            <Etape numero={2} fait /> Ce que montre la photo
          </h2>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="La pièce ou le meuble à simuler">
            {pieces.map((p) => {
              const active = p.piece === piece.piece;
              return (
                <button key={p.piece} type="button" role="radio" aria-checked={active} onClick={() => modifier((c) => (c.piece === p.piece ? c : { ...c, piece: p.piece, teintes: {} }))} className={cx("min-h-[48px] rounded-full border-2 px-4 text-[15.5px] font-semibold", active ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#E2DFD9] bg-white text-[#1A1A1A] active:bg-[#F6F5F2]", FOCUS)}>
                  {p.libelle}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="creation-zones" className="space-y-2.5">
        <div className="px-1">
          <h2 id="creation-zones" className="flex items-center gap-2 text-[18px] font-semibold text-[#1A1A1A]">
            <Etape numero={pieces.length > 1 ? 3 : 2} fait={choisies.length > 0} /> Les teintes
          </h2>
          <p className="mt-0.5 text-[14.5px] text-[#5F5A53]">Touchez une surface pour choisir sa teinte. Celles que vous laissez de côté ne changent pas.</p>
        </div>
        <ul className="space-y-2">
          {zones.map((z) => {
            const teinte = choix.teintes[z.zone];
            return (
              <li key={z.zone} className={cx("flex items-stretch gap-1 rounded-2xl border-2 bg-white", teinte ? "border-[#1A1A1A]" : "border-[#E2DFD9]")}>
                <button type="button" onClick={() => setZoneEnChoix(z.zone)} aria-label={teinte ? `${z.libelle} : ${teinte.nom}. Changer de teinte` : `Choisir une teinte pour ${z.libelle}`} className={cx("flex min-h-[64px] min-w-0 flex-1 items-center gap-3 rounded-2xl p-2.5 text-left active:bg-[#F6F5F2]", FOCUS)}>
                  {teinte ? (
                    // eslint-disable-next-line @next/next/no-img-element -- vignette servie par le CRM
                    <img src={vignette(client, teinte.ref)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-black/10" referrerPolicy="no-referrer" />
                  ) : (
                    <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[#CFCAC2] text-[22px] leading-none text-[#8A857E]">
                      +
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-[16.5px] leading-snug font-semibold text-[#1A1A1A]">{z.libelle}</span>
                    <span className={cx("block truncate text-[14.5px]", teinte ? "text-[#3F3B36]" : "font-medium text-[#B00000]")}>{teinte ? teinte.nom : "Choisir la teinte"}</span>
                  </span>
                </button>
                {teinte ? (
                  <button
                    type="button"
                    onClick={() =>
                      modifier((c) => {
                        const suite = { ...c.teintes };
                        delete suite[z.zone];
                        return { ...c, teintes: suite };
                      })
                    }
                    aria-label={`Ne pas changer ${z.libelle}`}
                    className={cx("flex w-12 shrink-0 items-center justify-center rounded-r-2xl text-[20px] text-[#6B665F] active:bg-[#F2F0EC]", FOCUS)}
                  >
                    ×
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {message ? <Annonce ton={message.ton === "erreur" ? "erreur" : "info"}>{message.texte}</Annonce> : null}
      <p className="px-1 text-[13.5px] leading-relaxed text-[#6B665F]">Une minute environ. Le résultat arrive dans « Mes simulations »&nbsp;; CoverSwap le voit aussi.</p>
      {photoId || choisies.length > 0 ? (
        <BoutonSecondaire onClick={() => modifier((c) => ({ piece: c.piece, photoId: null, teintes: {} }))}>Tout recommencer</BoutonSecondaire>
      ) : null}

      {/* Le bouton qui lance, toujours sous le pouce, au-dessus des onglets. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(3.9rem+env(safe-area-inset-bottom))] z-20 px-4 pb-2">
        <div className="mx-auto max-w-xl">
          <BoutonPrincipal onClick={() => void lancer()} disabled={occupe} className="pointer-events-auto shadow-[0_8px_24px_rgba(26,26,26,0.18)]">
            {occupe ? "Lancement…" : choisies.length > 0 && photoId ? "Lancer ma simulation" : !photoId ? "Lancer (choisissez une photo)" : "Lancer (choisissez une teinte)"}
          </BoutonPrincipal>
        </div>
      </div>

      <CatalogueTeintes
        key={`${piece.piece}:${zoneEnChoix ?? "aucune"}`}
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
          if (zone) modifier((c) => ({ ...c, teintes: { ...c.teintes, [zone]: { ref: t.id, nom: t.nom } } }));
        }}
      />
    </div>
  );
}

/** Le numéro de l'étape, qui devient une coche verte une fois faite : on sait toujours où on en est. */
function Etape({ numero, fait }: { numero: number; fait: boolean }) {
  return (
    <span aria-hidden className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px] font-bold", fait ? "bg-[#1F7A4D] text-white" : "bg-[#1A1A1A] text-white")}>
      {fait ? <IconeCoche taille={12} /> : numero}
    </span>
  );
}
