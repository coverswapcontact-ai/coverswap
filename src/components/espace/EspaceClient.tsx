"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { creerClient, dateCourte, ErreurEspace, euros, famillesDe, marqueDe, MESSAGE_APERCU, motsDe, type CleProgression, type Client, type Compte, type Etat, type IdFamille, type Prestations, type Reponse } from "./api";
import { DevisEnPreparation, EtapeDevis } from "./EtapeDevis";
import { ApresChantier, EtapePaiement } from "./EtapePaiement";
import { EtapePhotos } from "./EtapePhotos";
import { EtapeProjet } from "./EtapeProjet";
import { EtapeSimulations } from "./EtapeSimulations";
import { MesCoordonnees, PastilleCoordonnees } from "./Coordonnees";
import { CataloguePage, Contact, EcranConfirmation, MesDocuments, MesProjets, NouveauProjet, ProjetConsultation } from "./EspaceCompte";
import { DessinFamille, IconeAppareil, IconeCadenas, IconeCoche, IconeDevis, IconePaiement, IconeProjet, IconeSimulation, IconeTelephone, Logo } from "./Illustrations";
import { Annonce, BoutonPrincipal, FOCUS, Verrou, cx } from "./ui";

/**
 * L'espace du client, sur son téléphone (mission 5 : permanent, multi-projets).
 *
 * Un client = un espace, pour toujours ; un projet = un de ses chantiers.
 * L'accueil liste ses projets ; s'il n'en a qu'un en cours, il s'ouvre
 * directement (avec un accès discret à « Mes projets »). Dans un projet, une
 * seule navigation : la barre d'onglets en bas, sous le pouce — Photos · Projet
 * · Simulations · Devis · Paiement. Au-dessus des projets : le catalogue, ses
 * documents, le contact. Un projet terminé se consulte sans se modifier. Après
 * 90 jours sans visite, il confirme d'abord son téléphone. Il peut quitter et
 * revenir : son dernier état est gardé dans le téléphone.
 */

type VueProjet = "accueil" | "photos" | "projet" | "simulations" | "devis" | "paiement" | "apres" | "coordonnees";
type VueCompte = "projets" | "catalogue" | "documents" | "contact" | "nouveau";
type Vue = VueProjet | VueCompte;
const VUES_PROJET: VueProjet[] = ["photos", "projet", "simulations", "devis", "paiement", "apres", "coordonnees"];
const VUES_COMPTE: VueCompte[] = ["projets", "catalogue", "documents", "contact", "nouveau"];
/** Anciennes adresses (espace v2) : « #acompte » mène au paiement. */
const ALIAS: Record<string, Vue> = { acompte: "paiement" };

const vueDepuisAdresse = (): Vue => {
  const h = typeof window === "undefined" ? "" : window.location.hash.replace("#", "");
  const v = ALIAS[h] ?? h;
  return ([...VUES_PROJET, ...VUES_COMPTE] as string[]).includes(v) ? (v as Vue) : "accueil";
};

const ONGLETS: { vue: VueProjet; cle: CleProgression; libelle: string; Icone: (p: { taille?: number }) => React.ReactNode }[] = [
  { vue: "photos", cle: "PHOTOS", libelle: "Photos", Icone: IconeAppareil },
  { vue: "projet", cle: "PROJET", libelle: "Projet", Icone: IconeProjet },
  { vue: "simulations", cle: "SIMULATIONS", libelle: "Simulations", Icone: IconeSimulation },
  { vue: "devis", cle: "DEVIS", libelle: "Devis", Icone: IconeDevis },
  { vue: "paiement", cle: "ACOMPTE", libelle: "Paiement", Icone: IconePaiement },
];

function lireGarde<T>(cle: string): T | null {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : null;
  } catch {
    return null;
  }
}
function garder(cle: string, valeur: unknown) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // stockage indisponible (navigation privée) : sans conséquence
  }
}

export default function EspaceClient({ jeton, baseApi, apercu, projetInitial }: { jeton: string; baseApi: string; apercu?: string | null; projetInitial?: string | null }) {
  const [enLigne, setEnLigne] = useState(true);
  const racineCache = `espace:${jeton.split("-")[0]}`;
  const [projetCode, setProjetCode] = useState<string | null>(projetInitial ?? null);
  const racine = `${baseApi}/${encodeURIComponent(jeton)}`;
  const client = useMemo(() => creerClient(racine, apercu ?? null, setEnLigne, projetCode), [racine, apercu, projetCode]);
  const clientCompte = useMemo(() => creerClient(racine, apercu ?? null, setEnLigne, null), [racine, apercu]);
  const [etat, setEtat] = useState<Etat | null>(null);
  const [compte, setCompte] = useState<Compte | null>(null);
  const [erreur, setErreur] = useState<ErreurEspace | null>(null);
  const [vue, setVue] = useState<Vue>("accueil");
  const [favoris, setFavoris] = useState<string[]>([]);
  const envoiFavoris = useRef<number | null>(null);

  const appliquerEtat = useCallback(
    (nouveau: Etat) => {
      setEtat(nouveau);
      if (nouveau.code) {
        setProjetCode(nouveau.code);
        garder(`${racineCache}:projet:${nouveau.code}`, nouveau);
      }
    },
    [racineCache]
  );

  const appliquer = useCallback(
    (r: Reponse) => {
      if (r.compte) {
        setCompte(r.compte);
        setFavoris(r.compte.favoris);
        garder(`${racineCache}:compte`, r.compte);
      }
      if (r.espace) appliquerEtat(r.espace);
      else if (r.compte) setEtat(null);
    },
    [appliquerEtat, racineCache]
  );

  /** Recharge l'espace (et le projet `code`, ou celui qu'il a choisi) ; sans réseau, on garde ce qu'on a. */
  const charger = useCallback(
    async (code: string | null = projetCode) => {
      try {
        const r = await creerClient(racine, apercu ?? null, setEnLigne, code).appeler<Reponse>("");
        appliquer(r);
        setErreur(null);
        return r.espace;
      } catch (e) {
        const probleme = e instanceof ErreurEspace ? e : new ErreurEspace("Un souci de notre côté.", 500);
        // Un projet qui n'est plus dans son espace : retour à l'accueil de l'espace.
        if (probleme.status === 404 && code) {
          setProjetCode(null);
          return null;
        }
        if (probleme.status !== 0) setErreur(probleme);
        else setErreur((avant) => avant ?? probleme);
        return null;
      }
    },
    [apercu, appliquer, projetCode, racine]
  );

  useEffect(() => {
    // Dernier état connu d'abord (réseau lent ou coupé), puis la version à jour.
    const compteGarde = lireGarde<Compte>(`${racineCache}:compte`);
    const etatGarde = projetInitial ? lireGarde<Etat>(`${racineCache}:projet:${projetInitial}`) : null;
    const premier = window.setTimeout(() => {
      if (compteGarde && !compteGarde.confirmation?.requise) {
        setCompte((actuel) => actuel ?? compteGarde);
        setFavoris((actuels) => (actuels.length ? actuels : compteGarde.favoris));
      }
      if (etatGarde) setEtat((actuel) => actuel ?? etatGarde);
      setVue(vueDepuisAdresse());
      void charger(projetInitial ?? null);
    }, 0);
    return () => window.clearTimeout(premier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const surRetour = () => document.visibilityState === "visible" && void charger();
    const surAdresse = () => {
      setVue(vueDepuisAdresse());
      window.scrollTo({ top: 0 });
    };
    document.addEventListener("visibilitychange", surRetour);
    window.addEventListener("online", surRetour);
    window.addEventListener("hashchange", surAdresse);
    return () => {
      document.removeEventListener("visibilitychange", surRetour);
      window.removeEventListener("online", surRetour);
      window.removeEventListener("hashchange", surAdresse);
    };
  }, [charger]);

  const aller = useCallback((cible: Vue) => {
    if (cible === "accueil") {
      if (window.location.hash) window.history.pushState(window.history.state, "", window.location.pathname + window.location.search);
      setVue("accueil");
    } else if (window.location.hash === `#${cible}`) {
      setVue(cible);
    } else {
      window.location.hash = cible;
    }
    window.scrollTo({ top: 0 });
  }, []);

  /** Ouvrir un projet depuis « Mes projets » : sa dernière version connue tout de suite, la version à jour ensuite. */
  const ouvrirProjet = useCallback(
    (code: string) => {
      setProjetCode(code);
      const garde = lireGarde<Etat>(`${racineCache}:projet:${code}`);
      setEtat(garde);
      aller("accueil");
      void charger(code);
    },
    [aller, charger, racineCache]
  );

  const allerMesProjets = useCallback(() => {
    aller("projets");
    void charger();
  }, [aller, charger]);

  const basculerFavori = useCallback(
    (ref: string) => {
      setFavoris((avant) => {
        const suite = avant.includes(ref) ? avant.filter((r) => r !== ref) : [ref, ...avant].slice(0, 60);
        if (!apercu) {
          if (envoiFavoris.current) window.clearTimeout(envoiFavoris.current);
          envoiFavoris.current = window.setTimeout(() => void clientCompte.envoyerJson("/favoris", "PUT", { refs: suite }).catch(() => undefined), 800);
        }
        return suite;
      });
    },
    [apercu, clientCompte]
  );

  if (!compte && !etat && erreur && erreur.status !== 0) return <LienInvalide erreur={erreur} onReessayer={() => void charger()} />;
  if (!compte && !etat) return <Chargement horsLigne={Boolean(erreur)} onReessayer={() => void charger()} />;

  const marque = compte?.marque ?? (etat ? marqueDe(etat) : { nom: "CoverSwap", telephone: "06 70 35 28 69", telephoneLien: "+33670352869" });
  const confirmation = Boolean(compte?.confirmation?.requise);
  const dansUnProjet = !confirmation && Boolean(etat) && !(VUES_COMPTE as string[]).includes(vue);
  const fige = Boolean(etat?.fige);
  const plusieursProjets = (compte?.projets.length ?? 0) > 1;

  let contenu: React.ReactNode;
  if (confirmation && compte) contenu = <EcranConfirmation compte={compte} client={clientCompte} onReponse={(r) => { appliquer(r); aller("accueil"); }} />;
  else if (vue === "nouveau" && compte)
    contenu = (
      <NouveauProjet
        compte={compte}
        client={clientCompte}
        onAnnuler={allerMesProjets}
        onReponse={(r) => {
          appliquer(r);
          // Le projet créé s'ouvre sur ses photos.
          if (r.espace?.code && r.espace.code !== etat?.code) aller("photos");
        }}
      />
    );
  else if (vue === "catalogue" && compte) contenu = <CataloguePage compte={compte} client={clientCompte} favoris={favoris} onFavori={basculerFavori} />;
  else if (vue === "documents" && compte) contenu = <MesDocuments compte={compte} client={clientCompte} />;
  else if (vue === "contact" && compte) contenu = <Contact compte={compte} client={client} />;
  else if (!etat || vue === "projets") contenu = compte ? <MesProjets compte={compte} onOuvrir={ouvrirProjet} onNouveau={() => aller("nouveau")} onCatalogue={() => aller("catalogue")} onDocuments={() => aller("documents")} onContact={() => aller("contact")} /> : <Chargement horsLigne={Boolean(erreur)} onReessayer={() => void charger()} />;
  else if (fige) contenu = <ProjetConsultation etat={etat} client={client} />;
  else {
    const onglet = (cle: CleProgression) => etat.etapes.find((e) => e.cle === cle);
    if (vue === "photos") contenu = <EtapePhotos etat={etat} client={client} jeton={jeton} prestations={compte?.prestations} onEtat={appliquerEtat} onSuite={() => aller("projet")} />;
    else if (vue === "projet") contenu = <EtapeProjet etat={etat} client={client} prestations={compte?.prestations} onEtat={appliquerEtat} onSuite={() => aller("simulations")} onDevis={() => aller("devis")} />;
    else if (vue === "simulations") contenu = <EtapeSimulations etat={etat} client={client} jeton={jeton} onEtat={appliquerEtat} recharger={() => charger()} aller={aller} />;
    else if (vue === "devis") {
      const verrou = onglet("DEVIS");
      if (etat.devis) contenu = <EtapeDevis etat={etat} client={client} onEtat={appliquerEtat} onSuite={() => aller("paiement")} onCoordonnees={() => aller("coordonnees")} />;
      else if (verrou?.verrouillee)
        contenu = <Verrou titre="Votre devis" raison={verrou.raison ?? "Validez une simulation pour recevoir votre devis."} action={{ libelle: etat.simulations.length ? "Voir mes simulations" : "Créer ma simulation", onClick: () => aller("simulations") }} />;
      else contenu = <DevisEnPreparation etat={etat} client={client} onSimulations={() => aller("simulations")} />;
    } else if (vue === "paiement") {
      const verrou = onglet("ACOMPTE");
      if (verrou?.verrouillee) contenu = <Verrou titre="Paiement" raison={verrou.raison ?? "Le paiement s'ouvre après votre accord sur le devis."} action={etat.devis ? { libelle: "Voir mon devis", onClick: () => aller("devis") } : null} />;
      else contenu = <EtapePaiement etat={etat} client={client} onApres={etat.etape === "TERMINE" ? () => aller("apres") : undefined} />;
    } else if (vue === "apres") contenu = <ApresChantier etat={etat} client={client} onEtat={appliquerEtat} />;
    else if (vue === "coordonnees") contenu = <MesCoordonnees key={etat.code ?? "projet"} etat={etat} client={client} onEtat={appliquerEtat} onRetour={() => aller("accueil")} />;
    else if (famillesDe(etat).length === 0 && etat.etape === "PHOTOS" && compte)
      // Venu d'une publicité, sans rien dire de sa pièce : d'abord ce qu'il veut rénover (un toucher), puis les photos.
      contenu = <ChoixFamille etat={etat} client={client} prestations={compte.prestations} onEtat={appliquerEtat} onSuite={() => aller("photos")} />;
    else contenu = <AccueilProjet etat={etat} aller={aller} plusieurs={plusieursProjets} onNouveau={() => aller("nouveau")} />;
  }

  const avecOnglets = dansUnProjet && !fige && etat !== null;

  return (
    <div className="min-h-[100dvh] bg-[#F5F4F1] text-[#1A1A1A] [color-scheme:light]">
      <header className="sticky top-0 z-30 bg-[#F5F4F1]/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-2">
          <button type="button" onClick={() => (confirmation ? undefined : aller(etat ? "accueil" : "projets"))} aria-label="Accueil de votre espace CoverSwap" className={cx("-ml-1 rounded-xl p-1", FOCUS)}>
            <Logo />
          </button>
          <a
            href={`tel:${marque.telephoneLien}`}
            aria-label={`Appeler CoverSwap au ${marque.telephone}`}
            className={cx("flex min-h-[44px] items-center gap-2 rounded-full border border-[#D3CFC8] bg-white px-4 text-[15.5px] font-semibold text-[#1A1A1A] shadow-[0_1px_2px_rgba(26,26,26,0.06)] active:bg-[#F2F0EC]", FOCUS)}
          >
            <span className="text-[#CC0000]">
              <IconeTelephone />
            </span>
            Appeler
          </a>
        </div>
        {client.apercu ? <p className="bg-[#FFF1C7] px-4 py-2 text-center text-[14px] font-medium text-[#5C4200]">Aperçu&nbsp;: l&apos;espace tel que votre client le voit. Rien n&apos;est enregistré, vos visites ne comptent pas.</p> : null}
        {!enLigne ? <p className="bg-[#1A1A1A] px-4 py-2 text-center text-[14px] text-white">Pas de réseau&nbsp;: vous voyez la dernière version. Rien n&apos;est perdu.</p> : null}
        {/* Dans un projet : son nom, et le chemin discret vers tous ses projets. */}
        {!confirmation && etat && vue !== "projets" ? (
          <div className="mx-auto flex max-w-xl items-center gap-2 px-4 pb-1.5">
            <button type="button" onClick={allerMesProjets} className={cx("-ml-1 flex min-h-[40px] shrink-0 items-center gap-1 rounded-lg px-1 text-[15px] font-medium whitespace-nowrap text-[#4F4A44] active:bg-[#ECEAE5]", FOCUS)}>
              <span aria-hidden className="text-[19px] leading-none">‹</span> Mes projets
            </button>
            {(VUES_COMPTE as string[]).includes(vue) ? null : <span className="min-w-0 truncate text-[15px] font-semibold text-[#1A1A1A]">· {etat.nomProjet ?? etat.projet}</span>}
            {/* Ses coordonnées, visibles dans tout le projet : orange tant qu'il manque quelque chose, vert ensuite. */}
            {!fige && !(VUES_COMPTE as string[]).includes(vue) ? <PastilleCoordonnees etat={etat} actif={vue === "coordonnees"} onOuvrir={() => aller("coordonnees")} /> : null}
          </div>
        ) : null}
        {!confirmation && !etat && vue !== "projets" && (VUES_COMPTE as string[]).includes(vue) ? (
          <div className="mx-auto flex max-w-xl items-center px-4 pb-1.5">
            <button type="button" onClick={allerMesProjets} className={cx("-ml-1 flex min-h-[40px] items-center gap-1 rounded-lg px-1 text-[15px] font-medium text-[#4F4A44] active:bg-[#ECEAE5]", FOCUS)}>
              <span aria-hidden className="text-[19px] leading-none">‹</span> Mes projets
            </button>
          </div>
        ) : null}
      </header>

      <main className={cx("mx-auto max-w-xl px-4 pt-1", avecOnglets ? "pb-[calc(6.25rem+env(safe-area-inset-bottom))]" : "pb-[calc(2rem+env(safe-area-inset-bottom))]")}>
        {contenu}
        <footer className="px-2 pt-10 pb-2 text-center text-[13px] leading-relaxed text-[#6B665F]">
          Une question&nbsp;? CoverSwap vous répond au{" "}
          <a href={`tel:${marque.telephoneLien}`} className="font-semibold whitespace-nowrap text-[#1A1A1A] underline decoration-[#BDB8B0] underline-offset-2">
            {marque.telephone}
          </a>
          .
          <br />
          Cet espace est le vôtre, pour tous vos projets&nbsp;: ne partagez pas son adresse.
        </footer>
      </main>

      {avecOnglets && etat ? <BarreOnglets etat={etat} vue={vue} aller={aller} /> : null}
    </div>
  );
}

/* ── La barre d'onglets d'un projet ───────────────────────────────── */

function BarreOnglets({ etat, vue, aller }: { etat: Etat; vue: Vue; aller: (vue: Vue) => void }) {
  const parCle = new Map(etat.etapes.map((e) => [e.cle, e]));
  const suivante = prochainPas(etat).vue;
  return (
    <nav aria-label="Les étapes de votre projet" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E3DFD8] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {ONGLETS.map(({ vue: cible, cle, libelle, Icone }) => {
          const e = parCle.get(cle);
          const actif = vue === cible || (cible === "paiement" && vue === "apres");
          const verrou = Boolean(e?.verrouillee);
          const fait = Boolean(e?.fait) && !verrou;
          // Le point rouge : là où l'attend la prochaine étape (sauf s'il y est déjà).
          const aFaire = !actif && !fait && suivante === cible;
          const etatDit = fait ? " : fait" : verrou ? " : pas encore ouvert" : aFaire ? " : prochaine étape" : "";
          return (
            <li key={cible}>
              <button
                type="button"
                onClick={() => aller(cible)}
                aria-current={actif ? "page" : undefined}
                aria-label={`${libelle}${etatDit}`}
                className={cx(
                  "relative flex h-[62px] w-full flex-col items-center justify-center gap-[5px] text-[12.5px] leading-none font-semibold tracking-[-0.02em] transition-colors active:bg-[#F2F0EC]",
                  actif ? "text-[#1A1A1A]" : verrou ? "text-[#9A958E]" : "text-[#5F5A53]",
                  FOCUS
                )}
              >
                {actif ? <span aria-hidden className="absolute inset-x-4 top-0 h-[3px] rounded-b-full bg-[#CC0000]" /> : null}
                <span className="relative" aria-hidden>
                  <Icone taille={24} />
                  {fait ? (
                    <span className="absolute -top-1.5 -right-2.5 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-[#1F7A4D] text-white ring-2 ring-white">
                      <IconeCoche taille={10} />
                    </span>
                  ) : verrou ? (
                    <span className="absolute -top-1.5 -right-2.5 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-[#8A857E] text-white ring-2 ring-white">
                      <IconeCadenas taille={10} />
                    </span>
                  ) : aFaire ? (
                    <span className="absolute -top-0.5 -right-1.5 h-[11px] w-[11px] rounded-full bg-[#CC0000] ring-2 ring-white" />
                  ) : null}
                </span>
                <span>{libelle}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ── Première question, quand on ne sait rien de sa pièce ─────────── */

function ChoixFamille({ etat, client, prestations, onEtat, onSuite }: { etat: Etat; client: Client; prestations: Prestations; onEtat: (etat: Etat) => void; onSuite: () => void }) {
  const [occupe, setOccupe] = useState<IdFamille | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function choisir(id: IdFamille) {
    if (client.apercu) return setMessage(MESSAGE_APERCU);
    setOccupe(id);
    setMessage(null);
    try {
      const r = await client.envoyerJson<{ espace?: Etat }>("/projet", "PUT", { familles: { [id]: [] }, precisions: etat.monProjet?.precisions ?? "" });
      if (r.espace) onEtat(r.espace);
      onSuite();
    } catch (e) {
      setMessage(e instanceof ErreurEspace && e.status === 0 ? "Pas de réseau : touchez à nouveau dès son retour." : e instanceof Error ? e.message : "Réessayez dans un instant.");
    } finally {
      setOccupe(null);
    }
  }

  return (
    <section aria-labelledby="titre-choix-famille" className="space-y-5 py-4">
      <div>
        <p className="text-[17px] text-[#5F5A53]">{etat.prenom ? `Bonjour ${etat.prenom},` : "Bonjour,"}</p>
        <h1 id="titre-choix-famille" className="mt-1.5 font-display text-[30px] leading-[1.13] font-semibold tracking-tight text-balance text-[#1A1A1A]">
          Qu&apos;est-ce que vous voulez rénover&nbsp;?
        </h1>
        <p className="mt-2 text-[16.5px] text-[#4F4A44]">Touchez votre pièce. Vous pourrez en ajouter une autre ensuite.</p>
      </div>
      <ul className="space-y-2.5">
        {prestations.familles.map((f) => (
          <li key={f.id}>
            <button type="button" onClick={() => void choisir(f.id)} disabled={occupe !== null} className={cx("flex w-full items-center gap-3 rounded-2xl border-2 border-[#E2DFD9] bg-white p-3 text-left active:bg-[#F6F5F2] disabled:opacity-60", FOCUS)}>
              <DessinFamille famille={f.id} className="h-16 w-20 shrink-0 rounded-xl bg-[#F7F6F3] p-1" />
              <span className="min-w-0 flex-1">
                <span className="block text-[18px] leading-snug font-semibold text-[#1A1A1A]">{occupe === f.id ? "Un instant…" : f.libelle}</span>
                <span className="mt-0.5 block text-[14.5px] leading-snug text-[#5F5A53]">{f.aide}</span>
              </span>
              <span aria-hidden className="text-[22px] text-[#8A857E]">›</span>
            </button>
          </li>
        ))}
      </ul>
      {message ? <Annonce ton="erreur">{message}</Annonce> : null}
    </section>
  );
}

/* ── L'accueil d'un projet : la prochaine étape, rien d'autre ─────── */

function AccueilProjet({ etat, aller, plusieurs, onNouveau }: { etat: Etat; aller: (vue: Vue) => void; plusieurs: boolean; onNouveau: () => void }) {
  const pas = prochainPas(etat);
  const Icone = ONGLETS.find((o) => o.vue === pas.vue)?.Icone ?? IconeSimulation;
  // Tout tient entre l'en-tête et la barre d'onglets, même sur un petit iPhone avec les barres de Safari.
  return (
    <section aria-label="Votre prochaine étape" className="flex min-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-12.5rem)] flex-col justify-center py-5">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#CC0000] shadow-[0_6px_20px_rgba(26,26,26,0.08)] ring-1 ring-[#E6E3DD]" aria-hidden>
        <Icone taille={26} />
      </span>
      <p className="mt-6 text-[17px] text-[#5F5A53]">{etat.prenom ? `Bonjour ${etat.prenom},` : "Bonjour,"}</p>
      <h1 className="mt-1.5 font-display text-[30px] leading-[1.13] font-semibold tracking-tight text-balance text-[#1A1A1A] [@media(max-height:620px)]:text-[26px]">{pas.phrase}</h1>
      <BoutonPrincipal className="mt-7" onClick={() => aller(pas.vue)}>
        {pas.bouton}
      </BoutonPrincipal>
      {/* « Vérifiez vos coordonnées » : bien visible, jamais sur le chemin (il continue sans). */}
      {!etat.coordonnees.completes ? (
        <button type="button" onClick={() => aller("coordonnees")} className={cx("mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#F0C98A] bg-[#FFF8EC] px-4 py-3 text-left active:bg-[#FBEFD9]", FOCUS)}>
          <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#E08A00]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold text-[#1A1A1A]">Vérifiez vos coordonnées</span>
            <span className="block text-[14.5px] leading-snug text-[#5F5A53]">{(etat.coordonnees.manque ?? []).length ? `Il manque ${(etat.coordonnees.manque ?? []).join(", ")}.` : "Pour votre devis et votre facture."}</span>
          </span>
          <span aria-hidden className="text-[22px] text-[#8A857E]">›</span>
        </button>
      ) : null}
      {!plusieurs ? (
        <button type="button" onClick={onNouveau} className={cx("mt-4 min-h-[44px] self-center px-2 text-[15px] font-medium text-[#4F4A44] underline decoration-[#BDB8B0] underline-offset-4", FOCUS)}>
          Un autre projet&nbsp;? Nouveau projet
        </button>
      ) : null}
    </section>
  );
}

type Pas = { phrase: string; bouton: string; vue: VueProjet };

function prochainPas(etat: Etat): Pas {
  const mots = motsDe(etat);
  const sims = etat.simulations;
  const unePiece = (etat.familles?.length ?? 0) === 1 || (!etat.familles?.length && (etat.famillesSuggerees?.length ?? 0) === 1);
  switch (etat.etape) {
    case "PHOTOS":
      return { phrase: unePiece ? `Envoyez-nous quelques photos ${mots.de} : c'est la première étape.` : "Envoyez-nous quelques photos de ce que vous voulez rénover : c'est la première étape.", bouton: "Envoyer mes photos", vue: "photos" };
    case "PROJET":
      // Il a déjà rempli son projet : il ne lui reste qu'à le valider.
      if (etat.monProjet && Object.keys(etat.monProjet.familles ?? {}).length > 0 && !etat.projetValide) return { phrase: "Votre projet est presque prêt : relisez-le et validez-le.", bouton: "Valider mon projet", vue: "projet" };
      return { phrase: etat.photos.length > 0 || sims.some((s) => s.source === "SITE") ? "Vos photos sont là : dites-nous ce que vous voulez rénover." : "Dites-nous ce que vous voulez rénover, en quelques gestes.", bouton: "Préciser mon projet", vue: "projet" };
    case "SIMULATIONS":
    case "ATTENTE_SIMULATION": {
      if ((etat.creation?.enCours.length ?? 0) > 0) return { phrase: "Votre simulation est en préparation : elle arrive dans une minute ou deux.", bouton: "Suivre ma simulation", vue: "simulations" };
      const nouvelles = sims.filter((s) => s.nouvelle && s.source === "CRM").length;
      if (nouvelles > 0) return { phrase: nouvelles > 1 ? "CoverSwap a préparé de nouvelles simulations pour vous." : "CoverSwap a préparé une nouvelle simulation pour vous.", bouton: nouvelles > 1 ? "Voir mes simulations" : "Voir ma simulation", vue: "simulations" };
      if (sims.length === 1) return { phrase: "Votre simulation vous attend.", bouton: "Voir ma simulation", vue: "simulations" };
      if (sims.length > 1) return { phrase: "Vos simulations vous attendent : validez celle qui vous plaît.", bouton: "Voir mes simulations", vue: "simulations" };
      return { phrase: unePiece ? `Tout est prêt : créez votre simulation, sur la photo ${mots.de}.` : "Tout est prêt : créez votre simulation, sur une de vos photos.", bouton: "Créer ma simulation", vue: "simulations" };
    }
    case "ATTENTE_DEVIS":
      return { phrase: "Simulation validée : CoverSwap prépare votre devis.", bouton: "Revoir ma simulation", vue: "simulations" };
    case "DEVIS":
      return { phrase: etat.devis ? `Votre devis est prêt : ${euros(etat.devis.total)}.` : "Votre devis est prêt.", bouton: "Voir mon devis", vue: "devis" };
    case "ACOMPTE":
      return { phrase: "C'est signé ! Il reste l'acompte, qui réserve votre date.", bouton: "Voir le paiement", vue: "paiement" };
    case "CHANTIER":
      return { phrase: etat.chantier?.date ? `Rendez-vous le ${dateCourte(etat.chantier.date)} : tout est prêt.` : "Votre acompte est bien reçu : CoverSwap vous appelle pour fixer la date du chantier.", bouton: "Préparer le chantier", vue: "paiement" };
    case "TERMINE":
      return { phrase: "Votre chantier est terminé. Merci de votre confiance !", bouton: etat.apres?.avis ? "Voir les photos" : "Voir les photos et donner mon avis", vue: "apres" };
  }
}

/* ── Chargement, lien invalide ─────────────────────────────────────── */

function Chargement({ horsLigne, onReessayer }: { horsLigne: boolean; onReessayer: () => void }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-[#F5F4F1] px-6 text-center">
      <Logo />
      {horsLigne ? (
        <>
          <p className="text-[17px] text-[#3F3B36]">Pas de réseau pour ouvrir votre espace. Rien n&apos;est perdu.</p>
          <button type="button" onClick={onReessayer} className="min-h-[52px] rounded-2xl bg-[#1A1A1A] px-6 text-[16px] font-semibold text-white">
            Réessayer
          </button>
        </>
      ) : (
        <p className="animate-pulse text-[16px] text-[#5F5A53] motion-reduce:animate-none">Ouverture de votre espace…</p>
      )}
    </div>
  );
}

function LienInvalide({ erreur, onReessayer }: { erreur: ErreurEspace; onReessayer: () => void }) {
  const desactive = erreur.raison === "expire" || erreur.raison === "revoque";
  const reseau = erreur.status === 0 || erreur.status >= 500 || erreur.status === 429;
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#F5F4F1] px-6 text-center text-[#1A1A1A]">
      <Logo />
      <h1 className="mt-8 font-display text-[26px] leading-tight font-semibold text-balance">{reseau ? "Impossible d'ouvrir votre espace" : desactive ? "Ce lien n'est plus actif" : "Ce lien n'est pas valide"}</h1>
      <p className="mt-3 max-w-sm text-[16.5px] leading-relaxed text-[#4F4A44]">
        {reseau
          ? erreur.message
          : desactive
            ? "Ce lien a été remplacé ou désactivé. Demandez-nous le nouveau : nous vous l'envoyons par e-mail."
            : "Vérifiez que vous avez ouvert le lien en entier, tel que vous l'avez reçu. Sinon, appelez-nous : nous vous en envoyons un nouveau."}
      </p>
      {reseau ? (
        <button type="button" onClick={onReessayer} className="mt-6 min-h-[56px] w-full max-w-xs rounded-2xl bg-[#CC0000] text-[17px] font-semibold text-white">
          Réessayer
        </button>
      ) : null}
      <a href="tel:+33670352869" className={cx("flex min-h-[56px] w-full max-w-xs items-center justify-center gap-2 rounded-2xl text-[16.5px] font-semibold", reseau ? "mt-3 border border-[#D3CFC8] bg-white text-[#1A1A1A]" : "mt-6 bg-[#1A1A1A] text-white")}>
        <IconeTelephone /> Appeler CoverSwap · 06 70 35 28 69
      </a>
    </div>
  );
}
