"use client";

import { RappelCoordonnees } from "./Coordonnees";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FonduRendu } from "@/components/simulation/FonduRendu";
import EcranAttente from "@/components/simulation/EcranAttente";
import { fichierDuRendu, partagerOuTelecharger, telechargerFichier } from "@/components/simulation/fichiers";
import { filmsChoisis, statutAttente } from "@/lib/espace/creation";
import { DELAI_RENDU } from "@/lib/offre";
import { ATTENTE_PAR_DEFAUT_S } from "@/lib/simulateur/reprise";
import { dateCourte, ErreurEspace, vignette, type Client, type Etat, type SimulationClient, type SimulationEnCours, type ZoneTeinte } from "./api";
import { CreationSimulation } from "./CreationSimulation";
import { IconePlus } from "./Illustrations";
import { cleFavoris, cleSuivi, cleZone, ecrireLocal, lireLocal, nommer, ORIGINE } from "./simulations-outils";
import { Annonce, BoutonAConfirmer, BoutonPrincipal, BoutonSecondaire, Carte, EnteteEtape, Feuille, FOCUS, Surtitre, cx } from "./ui";
import { useSuiviCreation } from "./useSuiviCreation";

/**
 * Onglet Simulations, en deux sous-onglets :
 *  - « Mes simulations » : sa galerie — ses essais du site, celles qu'il a
 *    créées ici, celles que CoverSwap a publiées pour lui. Chacune s'ouvre en
 *    grand, avant / après au doigt, avec la teinte de chaque zone. C'est ICI
 *    qu'il valide celle qui lui plaît (ce qui ouvre le devis) — et qu'il peut
 *    annuler sa validation ou en valider une autre tant que le devis n'est pas
 *    établi, composer son mélange, demander une autre proposition (et retirer
 *    sa demande).
 *  - « Créer une simulation » : le simulateur, qui repart toujours de zéro
 *    (CreationSimulation). Une fois lancée, il est ramené dans « Mes
 *    simulations », où elle arrive.
 * Mission 15 (partie 5) : même écran d'attente que le site (`EcranAttente`,
 * sondage toutes les 3 s par `useSuiviCreation`), même curseur avant / après
 * (avec « Comparer », le plein écran, « Télécharger »), « Essayer d'autres
 * matières » ; une simulation gardée en relecture par CoverSwap est dite.
 */

type Vue = "accueil" | "photos" | "projet" | "simulations" | "devis" | "paiement" | "apres" | "coordonnees";
type Option = { simulationId: string; nom: string; ref: string; nomTeinte: string; libelle: string };

const PHRASE_QUITTER_ESPACE = "Vous pouvez quitter cette page : votre simulation continue. Elle vous attendra ici, dans « Mes simulations ».";

export function EtapeSimulations({ etat, client, jeton, onEtat, recharger, aller }: { etat: Etat; client: Client; jeton: string; onEtat: (etat: Etat) => void; recharger: () => Promise<Etat | null>; aller: (vue: Vue) => void }) {
  const apercu = Boolean(client.apercu);
  // Ce qui se garde dans le téléphone pour CE projet (simulations suivies, choix après un échec) : une clé par projet.
  const cleProjet = etat.code ? `${jeton.split("-")[0]}~${etat.code}` : jeton;
  const sims = etat.simulations;
  const creation = etat.creation ?? null;
  const noms = useMemo(() => nommer(sims), [sims]);
  const triees = useMemo(() => [...sims].sort((a, b) => b.le.localeCompare(a.le)), [sims]);
  const [ouverte, setOuverte] = useState<string | null>(null);
  // Le rendu qui vient d'arriver : la photo avant se fond dans l'après à l'ouverture (une fois).
  const [arrivee, setArrivee] = useState<string | null>(null);
  // Sans simulation encore : on arrive sur « Créer ». Sinon sur sa galerie.
  const [sousOnglet, setSousOnglet] = useState<"mes" | "creer">(() => (sims.length === 0 && (creation?.enCours.length ?? 0) === 0 ? "creer" : "mes"));
  // Le simulateur repart de zéro à chaque passage : remonté (clé) à chaque ouverture du sous-onglet.
  const [passage, setPassage] = useState(0);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ton: "succes" | "erreur" | "info"; texte: string } | null>(null);
  const [erreurVue, setErreurVue] = useState<string | null>(null);
  const [demande, setDemande] = useState<string | null>(null);
  // « Essayer d'autres matières » : la création repart de ces zones (pièce et teintes), la photo se choisit de nouveau.
  const [depart, setDepart] = useState<ZoneTeinte[] | null>(null);
  const [partage, setPartage] = useState<"" | "envoi" | "erreur">("");

  /* ── Favoris : gardés dans le téléphone et chez CoverSwap ─────────── */
  const [favoris, setFavoris] = useState<string[]>(() => [...new Set([...(etat.favoris ?? []), ...lireLocal<string[]>(cleFavoris(jeton), [])])]);
  const envoiFavoris = useRef<number | null>(null);
  const basculerFavori = useCallback(
    (ref: string) => {
      setFavoris((avant) => {
        const suite = avant.includes(ref) ? avant.filter((r) => r !== ref) : [ref, ...avant].slice(0, 60);
        ecrireLocal(cleFavoris(jeton), suite);
        if (!apercu) {
          if (envoiFavoris.current) window.clearTimeout(envoiFavoris.current);
          envoiFavoris.current = window.setTimeout(() => void client.envoyerJson("/favoris", "PUT", { refs: suite }).catch(() => undefined), 800);
        }
        return suite;
      });
    },
    [apercu, client, jeton]
  );

  /* ── Suivi des simulations en préparation ─────────────────────────── */
  // Ce que le serveur sait (photo, teintes : l'écran d'attente les montre, même sur un autre appareil) + ce que ce téléphone a lancé.
  const [suivies, setSuivies] = useState<SimulationEnCours[]>(() => {
    const locales = lireLocal<SimulationEnCours[]>(cleSuivi(cleProjet), []);
    const serveur = creation?.enCours ?? [];
    return [...serveur, ...locales.filter((l) => !serveur.some((s) => s.id === l.id))];
  });
  const [attenteLancee, setAttenteLancee] = useState<number | null>(null);
  const [relecture, setRelecture] = useState<string | null>(null);
  useEffect(() => ecrireLocal(cleSuivi(cleProjet), suivies), [cleProjet, suivies]);
  // Une simulation lancée ailleurs (autre onglet, autre visite) : suivie ici aussi.
  const enCoursServeur = creation?.enCours;
  useEffect(() => {
    if (!enCoursServeur?.length) return;
    const t = window.setTimeout(
      () =>
        setSuivies((avant) => {
          const nouvelles = enCoursServeur.filter((s) => !avant.some((a) => a.id === s.id));
          return nouvelles.length > 0 ? [...avant, ...nouvelles] : avant;
        }),
      0
    );
    return () => window.clearTimeout(t);
  }, [enCoursServeur]);

  // Une seule simulation suivie à la fois (la plus ancienne) : un seul sondage par espace.
  const suivie = suivies[0] ?? null;
  const oublier = useCallback((id: string) => setSuivies((avant) => avant.filter((s) => s.id !== id)), []);
  const suivi = useSuiviCreation(client, suivie, {
    onPrete: (id, simulationId) => {
      oublier(id);
      void recharger().then(() => {
        setMessage({ ton: "succes", texte: "Votre simulation est prête. La voici !" });
        setSousOnglet("mes");
        if (simulationId) {
          setArrivee(simulationId);
          setOuverte(simulationId);
        }
      });
    },
    onRelecture: (id, _simulationId, texte) => {
      oublier(id);
      setRelecture(texte);
      void recharger();
    },
    onEchec: (id, _raison, texte) => {
      oublier(id);
      setMessage({ ton: "erreur", texte });
      void recharger();
    },
    onOubliee: oublier,
  });
  // Publiée par CoverSwap (état relu, plus rien en relecture) : le mot « relecture » gardé ici s'efface — dérivé au rendu, sans effet.
  const relecturesServeur = creation?.enRelecture;
  const [relecturesVues, setRelecturesVues] = useState(relecturesServeur);
  if (relecturesVues !== relecturesServeur) {
    setRelecturesVues(relecturesServeur);
    if (relecturesServeur && relecturesServeur.length === 0 && relecture !== null) setRelecture(null);
  }
  const enRelecture = (relecturesServeur?.length ?? 0) > 0 || relecture !== null;

  // Il a regardé : ses simulations ne sont plus « nouvelles » (et CoverSwap sait lesquelles ont été vues).
  useEffect(() => {
    if (!apercu && sims.some((s) => s.nouvelle)) void client.envoyerJson("/simulations/vues", "POST", {}).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Valider : une simulation, ou un mélange zone par zone ────────── */
  async function valider(corps: unknown, cle: string, succes: string): Promise<boolean> {
    setOccupe(cle);
    setErreurVue(null);
    try {
      const { espace } = await client.envoyerJson<{ espace: Etat }>("/choix", "POST", corps);
      onEtat(espace);
      setMessage({ ton: "succes", texte: succes });
      return true;
    } catch (erreur) {
      setErreurVue(erreur instanceof Error ? erreur.message : "Réessayez dans un instant.");
      return false;
    } finally {
      setOccupe(null);
    }
  }

  const options = useMemo(() => {
    const parZone = new Map<string, Option[]>();
    for (const s of sims) {
      for (const z of s.zones) {
        const cle = cleZone(z);
        if (!cle) continue;
        const liste = parZone.get(cle) ?? [];
        if (!liste.some((o) => o.ref === z.ref)) liste.push({ simulationId: s.id, nom: noms.get(s.id) ?? "", ref: z.ref, nomTeinte: z.nom || z.ref, libelle: z.libelle || z.zone });
        parZone.set(cle, liste);
      }
    }
    return parZone;
  }, [sims, noms]);
  const composable = sims.length > 1 && [...options.values()].some((liste) => liste.length > 1);
  const [composition, setComposition] = useState<Record<string, string>>(() => {
    const depart: Record<string, string> = {};
    if (etat.choix?.mode === "COMPOSITE") for (const z of etat.choix.zones) depart[cleZone(z)] = z.simulationId;
    return depart;
  });
  const [composer, setComposer] = useState(false);

  const choixUne = etat.choix?.mode === "UNE" ? etat.choix.simulationId : null;
  const modifiable = etat.choixModifiable !== false && !etat.devis;
  const valideeNom = etat.choix?.mode === "COMPOSITE" ? "Votre mélange" : choixUne ? (noms.get(choixUne) ?? "Votre simulation") : null;
  const simOuverte = sims.find((s) => s.id === ouverte) ?? null;

  const phrase = valideeNom
    ? etat.devis
      ? "Votre devis est prêt, sur la base de la simulation validée."
      : "Simulation validée\u00a0: CoverSwap prépare votre devis. Vous pouvez encore changer d'avis."
    : sims.length === 0
      ? `Choisissez vos matières : CoverSwap les applique sur la photo de votre pièce, en ${DELAI_RENDU}.`
      : "Touchez une simulation pour la voir en grand, avant et après. Validez celle qui vous plaît\u00a0: votre devis suivra.";

  const ouvrirCreation = (depuis: ZoneTeinte[] | null = null) => {
    setMessage(null);
    setDepart(depuis);
    setPassage((n) => n + 1);
    setSousOnglet("creer");
    setOuverte(null);
    window.scrollTo({ top: 0 });
  };

  /** Le rendu en fichier : téléchargé, ou partagé quand le téléphone le permet. */
  async function telecharger(s: SimulationClient, nom: string, partager: boolean) {
    setPartage("envoi");
    const fichier = await fichierDuRendu(client.url(`/simulations/${s.id}`), `coverswap-${nom.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`);
    if (!fichier) return setPartage("erreur");
    if (partager) await partagerOuTelecharger(fichier, { title: "Ma simulation CoverSwap", text: `${nom}, avec CoverSwap.` });
    else telechargerFichier(fichier);
    setPartage("");
  }

  /** Il revient sur sa validation : l'onglet Devis se referme, CoverSwap le sait. */
  async function annulerValidation() {
    setOccupe("devalidation");
    setErreurVue(null);
    try {
      const { espace } = await client.envoyerJson<{ espace: Etat }>("/choix/retrait", "POST", {});
      onEtat(espace);
      setComposition({});
      setMessage({ ton: "info", texte: "Validation annulée. Validez la simulation qui vous plaît quand vous voulez." });
      setOuverte(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (erreur) {
      const texte = erreur instanceof Error ? erreur.message : "Réessayez dans un instant.";
      setErreurVue(texte);
      setMessage({ ton: erreur instanceof ErreurEspace && erreur.raison === "apercu" ? "info" : "erreur", texte });
    } finally {
      setOccupe(null);
    }
  }

  async function retirerDemande() {
    setOccupe("retrait-proposition");
    try {
      const { espace } = await client.envoyerJson<{ espace: Etat }>("/proposition/retrait", "POST", {});
      onEtat(espace);
      setMessage({ ton: "info", texte: "Demande retirée." });
    } catch (erreur) {
      setMessage({ ton: erreur instanceof ErreurEspace && erreur.raison === "apercu" ? "info" : "erreur", texte: erreur instanceof Error ? erreur.message : "Réessayez dans un instant." });
    } finally {
      setOccupe(null);
    }
  }

  async function demanderPlus() {
    setOccupe("demande");
    try {
      const { espace } = await client.envoyerJson<{ espace: Etat }>("/simulations/demande", "POST", {});
      onEtat(espace);
      setMessage({ ton: "succes", texte: "Demande envoyée\u00a0: CoverSwap vous répond très vite." });
    } catch (erreur) {
      setMessage({ ton: erreur instanceof ErreurEspace && erreur.raison === "apercu" ? "info" : "erreur", texte: erreur instanceof Error ? erreur.message : "Réessayez dans un instant." });
    } finally {
      setOccupe(null);
    }
  }

  async function demanderProposition() {
    setOccupe("proposition");
    try {
      const { espace } = await client.envoyerJson<{ espace: Etat }>("/proposition", "POST", { commentaire: demande ?? "" });
      onEtat(espace);
      setDemande(null);
      setMessage({ ton: "succes", texte: "Message bien reçu\u00a0: CoverSwap vous prépare une autre proposition." });
    } catch (erreur) {
      setMessage({ ton: erreur instanceof ErreurEspace && erreur.raison === "apercu" ? "info" : "erreur", texte: erreur instanceof Error ? erreur.message : "Réessayez dans un instant." });
    } finally {
      setOccupe(null);
    }
  }

  // Dans la galerie : un seul bouton vers « Créer » (pas pendant qu'une simulation se prépare : une à la fois).
  const bloc =
    creation && creation.disponible && suivies.length === 0 ? (
      <div className="space-y-2">
        <BoutonSecondaire onClick={() => ouvrirCreation()}>
          <IconePlus /> {creation.restantes > 0 ? "Créer une autre simulation" : "Demander d'autres simulations"}
        </BoutonSecondaire>
        <p className="text-center text-[14px] text-[#5F5A53]">
          {creation.restantes > 0 ? `Il vous en reste ${creation.restantes} sur ${creation.gratuites + creation.accordees}.` : `Vous avez utilisé vos ${creation.gratuites + creation.accordees} simulations.`}
        </p>
      </div>
    ) : null;

  const sousOnglets = (
    <div role="tablist" aria-label="Simulations" className="grid grid-cols-2 gap-1 rounded-2xl bg-[#E9E6E0] p-1">
      {(
        [
          { cle: "mes", libelle: sims.length > 0 ? `Mes simulations (${sims.length})` : "Mes simulations" },
          { cle: "creer", libelle: "Créer une simulation" },
        ] as const
      ).map((o) => (
        <button
          key={o.cle}
          type="button"
          role="tab"
          aria-selected={sousOnglet === o.cle}
          onClick={() => (o.cle === "creer" ? (sousOnglet === "creer" ? undefined : ouvrirCreation()) : setSousOnglet("mes"))}
          className={cx("min-h-[48px] rounded-xl px-2 text-[15px] leading-tight font-semibold transition-colors", sousOnglet === o.cle ? "bg-white text-[#1A1A1A] shadow-[0_1px_3px_rgba(26,26,26,0.12)]" : "text-[#5F5A53] active:bg-[#DDD9D2]", FOCUS)}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );

  if (sousOnglet === "creer") {
    return (
      <div className="space-y-5" data-theme="simulation">
        <EnteteEtape titre="Créer une simulation" phrase="Votre photo, vos matières : CoverSwap les applique sur votre pièce, avec le même moteur que sur coverswap.fr." />
        {sousOnglets}
        {suivies.length > 0 ? (
          <Annonce>Une simulation est déjà en préparation&nbsp;: elle arrive dans «&nbsp;Mes simulations&nbsp;». Attendez-la avant d&apos;en lancer une autre.</Annonce>
        ) : (
          <CreationSimulation
            key={passage}
            etat={etat}
            client={client}
            jeton={cleProjet}
            onEtat={onEtat}
            favoris={favoris}
            onFavori={basculerFavori}
            onDemanderPlus={() => void demanderPlus()}
            demandeEnCours={occupe === "demande"}
            depart={depart}
            onLancee={({ preparationId, photoId, zones, attenteEstimeeS }) => {
              setSuivies((avant) => [...avant.filter((s) => s.id !== preparationId), { id: preparationId, le: new Date().toISOString(), photoId, zones }]);
              setAttenteLancee(attenteEstimeeS);
              setRelecture(null);
              setMessage(null);
              setSousOnglet("mes");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}
        {message && message.ton !== "succes" ? <Annonce ton={message.ton}>{message.texte}</Annonce> : null}
      </div>
    );
  }

  return (
    <div className="space-y-5" data-theme="simulation">
      <EnteteEtape titre="Mes simulations" phrase={phrase} />
      {sousOnglets}
      {message ? <Annonce ton={message.ton}>{message.texte}</Annonce> : null}
      {/* Simulation validée : le devis se prépare, c'est le moment de vérifier ses coordonnées (jamais exigé). */}
      {etat.choix && !etat.devis ? <RappelCoordonnees etat={etat} moment="simulation" onOuvrir={() => aller("coordonnees")} /> : null}

      {/* L'écran d'attente du site : la photo, les films, les étapes, l'attente en mots ; on peut quitter, elle attendra ici. */}
      {suivie ? (
        <EcranAttente
          photo={suivie.photoId ? client.url(`/photos/${suivie.photoId}`) : null}
          films={filmsChoisis(suivie.zones ?? [], (ref) => vignette(client, ref))}
          statut={statutAttente(suivi)}
          etape={suivi?.etape ?? null}
          attenteEstimeeS={suivi?.attenteEstimeeS ?? attenteLancee ?? ATTENTE_PAR_DEFAUT_S}
          horsLigne={suivi?.horsLigne ?? false}
          echec={null}
          peutReessayer={false}
          onReessayer={() => undefined}
          phraseQuitter={PHRASE_QUITTER_ESPACE}
        />
      ) : null}
      {enRelecture ? <Annonce>{relecture ?? "Votre simulation demande une relecture : vous la recevrez dès qu'elle est prête."}</Annonce> : null}

      {triees.length > 0 ? (
        <ul className={cx("grid gap-3", triees.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {triees.map((s) => {
            const validee = choixUne === s.id || (etat.choix?.mode === "COMPOSITE" && etat.choix.zones.some((z) => z.simulationId === s.id));
            return (
              <li key={s.id}>
                <button type="button" onClick={() => setOuverte(s.id)} className={cx("block w-full overflow-hidden rounded-2xl border bg-white text-left shadow-[0_1px_2px_rgba(26,26,26,0.05)] active:bg-[#FAF9F7]", validee ? "border-2 border-[#1F7A4D]" : "border-[#E6E3DD]", FOCUS)}>
                  <span className={cx("relative block bg-[#ECEAE5]", triees.length > 1 ? "aspect-[4/3]" : "aspect-[3/2]")}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- image privée servie par le CRM */}
                    <img src={client.url(`/simulations/${s.id}`)} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                    {validee ? <span className="absolute top-2 left-2 rounded-full bg-[#1F7A4D] px-2.5 py-1 text-[12.5px] font-semibold text-white">✓ Validée</span> : s.nouvelle ? <span className="absolute top-2 left-2 rounded-full bg-[#CC0000] px-2.5 py-1 text-[12.5px] font-semibold text-white">Nouveau</span> : null}
                  </span>
                  <span className="block px-3 py-2.5">
                    <span className="block truncate text-[15.5px] font-semibold text-[#1A1A1A]">{noms.get(s.id)}</span>
                    <span className="block truncate text-[13px] text-[#6B665F]">
                      {ORIGINE[s.source]} · {dateCourte(s.le)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : suivies.length === 0 && !enRelecture && (etat.simulationsEnPreparation || etat.propositionDemandeeLe) ? (
        <Annonce>CoverSwap prépare une proposition pour vous&nbsp;: elle apparaîtra ici, et vous serez prévenu par e-mail.</Annonce>
      ) : suivies.length === 0 ? (
        <Carte className="space-y-3 text-center">
          <p className="text-[17px] leading-relaxed text-[#1A1A1A]">Vous n&apos;avez pas encore de simulation.</p>
          <BoutonPrincipal onClick={() => ouvrirCreation()}>
            <IconePlus /> Créer ma simulation
          </BoutonPrincipal>
        </Carte>
      ) : null}

      {/* Ce qui est validé se voit d'ici — et s'annule d'ici, tant que le devis n'est pas établi. */}
      {valideeNom && modifiable ? (
        <BoutonAConfirmer libelle="Annuler ma validation" question="Annuler votre validation ? Votre devis ne sera plus préparé." confirmer="Oui, annuler" occupe={occupe === "devalidation"} onConfirme={() => void annulerValidation()} />
      ) : null}

      {bloc}

      {composable && modifiable ? (
        <Carte>
          <Surtitre>Composer mon mélange</Surtitre>
          <p className="mt-1 text-[15px] leading-relaxed text-[#4F4A44]">Une teinte vous plaît sur une simulation, une autre ailleurs&nbsp;? Choisissez zone par zone, puis validez le mélange.</p>
          {composer ? (
            <div className="mt-3 space-y-4">
              {[...options.entries()].map(([cle, liste]) => (
                <fieldset key={cle}>
                  <legend className="text-[15.5px] font-semibold text-[#1A1A1A]">{liste[0].libelle}</legend>
                  <div className="mt-2 grid gap-2" role="radiogroup" aria-label={liste[0].libelle}>
                    {liste.map((o) => {
                      const actif = (composition[cle] ?? liste[0].simulationId) === o.simulationId;
                      return (
                        <button
                          key={`${o.simulationId}-${o.ref}`}
                          type="button"
                          role="radio"
                          aria-checked={actif}
                          onClick={() => setComposition((c) => ({ ...c, [cle]: o.simulationId }))}
                          className={cx("flex min-h-[64px] w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left", actif ? "border-[#1A1A1A] bg-[#FAF9F7]" : "border-[#E2DFD9] bg-white")}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- vignette servie par le CRM */}
                          <img src={vignette(client, o.ref)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-black/10" loading="lazy" referrerPolicy="no-referrer" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[16px] leading-snug font-semibold text-[#1A1A1A]">{o.nomTeinte}</span>
                            <span className="block text-[13.5px] text-[#5F5A53]">{o.nom}</span>
                          </span>
                          <span aria-hidden className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", actif ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#C9C4BC]")}>
                            {actif ? "✓" : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
              {erreurVue && !simOuverte ? <Annonce ton="erreur">{erreurVue}</Annonce> : null}
              <BoutonPrincipal
                disabled={occupe !== null}
                onClick={() =>
                  void valider(
                    { zones: [...options.entries()].map(([zone, liste]) => ({ zone, simulationId: composition[zone] ?? liste[0].simulationId })) },
                    "composition",
                    "Mélange noté\u00a0! Votre devis arrivera dans l'onglet Devis."
                  ).then((ok) => ok && setComposer(false))
                }
              >
                {occupe === "composition" ? "Un instant…" : "Valider mon mélange"}
              </BoutonPrincipal>
            </div>
          ) : (
            <BoutonSecondaire className="mt-3" onClick={() => setComposer(true)}>
              Choisir zone par zone
            </BoutonSecondaire>
          )}
        </Carte>
      ) : null}

      {sims.length > 0 ? (
        <Carte>
          <Surtitre>Besoin d&apos;un avis&nbsp;?</Surtitre>
          {etat.propositionDemandeeLe ? null : demande === null ? (
            <BoutonSecondaire className="mt-3" onClick={() => setDemande("")}>
              Demander une proposition à CoverSwap
            </BoutonSecondaire>
          ) : (
            <div className="mt-3 space-y-2.5">
              <label htmlFor="autre" className="block text-[15px] text-[#3F3B36]">
                Dites-nous ce que vous aimeriez (plus clair, un bois plus chaud, garder les portes blanches…)
              </label>
              <textarea id="autre" rows={3} maxLength={1000} value={demande} onChange={(e) => setDemande(e.target.value)} className="w-full rounded-2xl border border-[#D3CFC8] bg-white px-4 py-3 text-[17px] focus:border-[#1A1A1A] focus:outline-none" />
              <BoutonPrincipal disabled={occupe !== null} onClick={() => void demanderProposition()}>
                {occupe === "proposition" ? "Envoi…" : "Envoyer ma demande"}
              </BoutonPrincipal>
            </div>
          )}
          {etat.propositionDemandeeLe ? (
            <div className="mt-3 space-y-2 rounded-2xl bg-[#F1EFEA] p-3">
              <p className="text-[15px] leading-snug text-[#3F3B36]">
                Demande envoyée le {dateCourte(etat.propositionDemandeeLe)}&nbsp;: CoverSwap s&apos;en occupe.
                {etat.propositionMessage ? <span className="mt-1 block whitespace-pre-wrap text-[#1A1A1A]">« {etat.propositionMessage} »</span> : null}
              </p>
              <BoutonAConfirmer libelle="Retirer ma demande" question="Retirer votre demande ?" confirmer="Oui, retirer" occupe={occupe === "retrait-proposition"} onConfirme={() => void retirerDemande()} className="bg-transparent" />
            </div>
          ) : null}
        </Carte>
      ) : null}

      {/* La simulation en grand : avant / après, les teintes, et le geste qui ouvre le devis. */}
      <Feuille
        ouverte={Boolean(simOuverte)}
        onFermer={() => {
          setOuverte(null);
          setErreurVue(null);
        }}
        titre={simOuverte ? (noms.get(simOuverte.id) ?? "Simulation") : ""}
        sousTitre={simOuverte ? `${ORIGINE[simOuverte.source]} · ${dateCourte(simOuverte.le)}` : null}
        libelleFermer="Retour aux simulations"
        pied={
          simOuverte ? (
            choixUne === simOuverte.id ? (
              etat.devis ? (
                <BoutonPrincipal onClick={() => aller("devis")}>Voir mon devis</BoutonPrincipal>
              ) : (
                <div className="space-y-1.5">
                  <p className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#E7F3EC] px-4 text-center text-[16px] font-semibold text-[#17563A]">✓ Validée&nbsp;: CoverSwap prépare votre devis</p>
                  <BoutonAConfirmer libelle="Annuler ma validation" question="Annuler votre validation ?" confirmer="Oui, annuler" occupe={occupe === "devalidation"} onConfirme={() => void annulerValidation()} />
                </div>
              )
            ) : modifiable ? (
              <BoutonPrincipal
                disabled={occupe !== null}
                onClick={() =>
                  void valider({ simulationId: simOuverte.id }, `choix-${simOuverte.id}`, "C'est noté\u00a0! Votre devis arrivera dans l'onglet Devis.").then((ok) => {
                    if (ok) {
                      setOuverte(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  })
                }
              >
                {occupe === `choix-${simOuverte.id}` ? "Un instant…" : valideeNom ? "Valider celle-ci à la place" : "Valider cette simulation"}
              </BoutonPrincipal>
            ) : null
          ) : null
        }
      >
        {simOuverte ? (
          <div className="space-y-4 pt-1">
            {erreurVue ? <Annonce ton="erreur">{erreurVue}</Annonce> : null}
            <FonduRendu cle={simOuverte.id} actif={arrivee === simOuverte.id} apres={client.url(`/simulations/${simOuverte.id}`)} avant={simOuverte.avant ? client.url(`/simulations/${simOuverte.id}/avant`) : null} alt={noms.get(simOuverte.id) ?? "Simulation"} />
            {simOuverte.avant ? <p className="-mt-2 text-center text-[14px] text-[#5F5A53]">Glissez sur l&apos;image pour comparer avant et après.</p> : null}
            <div className="flex flex-wrap gap-2">
              <BoutonSecondaire className="w-auto flex-1" disabled={partage === "envoi"} onClick={() => void telecharger(simOuverte, noms.get(simOuverte.id) ?? "simulation", false)}>
                {partage === "envoi" ? "Préparation…" : "Télécharger"}
              </BoutonSecondaire>
              <BoutonSecondaire className="w-auto flex-1" disabled={partage === "envoi"} onClick={() => void telecharger(simOuverte, noms.get(simOuverte.id) ?? "simulation", true)}>
                Partager
              </BoutonSecondaire>
              {creation && creation.disponible && creation.restantes > 0 && suivies.length === 0 ? (
                <BoutonSecondaire className="w-auto flex-1" onClick={() => ouvrirCreation(simOuverte.zones)}>
                  Essayer d&apos;autres matières
                </BoutonSecondaire>
              ) : null}
            </div>
            {partage === "erreur" ? <Annonce ton="erreur">Le rendu n&apos;a pas pu être récupéré : réessayez dans un instant.</Annonce> : null}
            {simOuverte.zones.length > 0 ? (
              <ul className="divide-y divide-[#EEEBE6] rounded-2xl border border-[#E6E3DD] bg-white">
                {simOuverte.zones.map((z) => (
                  <li key={`${cleZone(z)}-${z.ref}`} className="flex items-center gap-3 px-3 py-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element -- vignette servie par le CRM */}
                    <img src={vignette(client, z.ref)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-black/10" loading="lazy" referrerPolicy="no-referrer" />
                    <span className="min-w-0 text-[15.5px] leading-snug">
                      <span className="block text-[13.5px] text-[#5F5A53]">{z.libelle || z.zone}</span>
                      <span className="block font-semibold text-[#1A1A1A]">{z.nom || z.ref}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {simOuverte.description ? <p className="px-1 text-[15px] leading-relaxed text-[#4F4A44]">{simOuverte.description}</p> : null}
            {!modifiable && choixUne !== simOuverte.id ? (
              <Annonce>Votre devis est établi sur la simulation validée. Pour en changer, appelez CoverSwap&nbsp;: nous le refaisons avec vous.</Annonce>
            ) : null}
          </div>
        ) : null}
      </Feuille>

    </div>
  );
}
