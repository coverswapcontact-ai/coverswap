"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { creerClient, dateCourte, ErreurEspace, euros, marqueDe, nomDuProjet, type CleProgression, type Etat } from "./api";
import { DevisEnPreparation, EtapeDevis } from "./EtapeDevis";
import { ApresChantier, EtapePaiement } from "./EtapePaiement";
import { EtapePhotos } from "./EtapePhotos";
import { EtapeProjet } from "./EtapeProjet";
import { EtapeSimulations } from "./EtapeSimulations";
import { IconeAppareil, IconeCadenas, IconeCoche, IconeDevis, IconePaiement, IconeProjet, IconeSimulation, IconeTelephone, Logo } from "./Illustrations";
import { BoutonPrincipal, FOCUS, Verrou, cx } from "./ui";

/**
 * L'espace du client, sur son téléphone (v3).
 *
 * Une seule navigation : la barre d'onglets en bas, toujours là, sous le pouce
 * — Photos · Projet · Simulations · Devis · Paiement. Les trois premiers sont
 * libres ; Devis et Paiement s'ouvrent quand leur tour vient, et disent
 * pourquoi tant qu'ils sont fermés. L'accueil ne montre que la prochaine
 * étape : une phrase, un bouton. L'espace parle au nom de CoverSwap ; le
 * numéro à appeler reste celui de Lucas. Il peut quitter et revenir : son
 * dernier état est gardé dans le téléphone.
 */

type Vue = "accueil" | "photos" | "projet" | "simulations" | "devis" | "paiement" | "apres";
const VUES: Vue[] = ["photos", "projet", "simulations", "devis", "paiement", "apres"];
/** Anciennes adresses (espace v2) : « #acompte » mène au paiement. */
const ALIAS: Record<string, Vue> = { acompte: "paiement" };

const vueDepuisAdresse = (): Vue => {
  const h = typeof window === "undefined" ? "" : window.location.hash.replace("#", "");
  const v = ALIAS[h] ?? h;
  return (VUES as string[]).includes(v) ? (v as Vue) : "accueil";
};

const ONGLETS: { vue: Vue; cle: CleProgression; libelle: string; Icone: (p: { taille?: number }) => React.ReactNode }[] = [
  { vue: "photos", cle: "PHOTOS", libelle: "Photos", Icone: IconeAppareil },
  { vue: "projet", cle: "PROJET", libelle: "Projet", Icone: IconeProjet },
  { vue: "simulations", cle: "SIMULATIONS", libelle: "Simulations", Icone: IconeSimulation },
  { vue: "devis", cle: "DEVIS", libelle: "Devis", Icone: IconeDevis },
  { vue: "paiement", cle: "ACOMPTE", libelle: "Paiement", Icone: IconePaiement },
];

export default function EspaceClient({ jeton, baseApi, apercu }: { jeton: string; baseApi: string; apercu?: string | null }) {
  const [enLigne, setEnLigne] = useState(true);
  const client = useMemo(() => creerClient(`${baseApi}/${encodeURIComponent(jeton)}`, apercu ?? null, setEnLigne), [baseApi, jeton, apercu]);
  const cleCache = `espace-etat:${jeton.split("-")[0]}`;
  const [etat, setEtat] = useState<Etat | null>(null);
  const [erreur, setErreur] = useState<ErreurEspace | null>(null);
  const [vue, setVue] = useState<Vue>("accueil");

  const appliquer = useCallback(
    (nouveau: Etat) => {
      setEtat(nouveau);
      try {
        localStorage.setItem(cleCache, JSON.stringify(nouveau));
      } catch {
        // stockage indisponible (navigation privée) : sans conséquence
      }
    },
    [cleCache]
  );

  const charger = useCallback(async () => {
    try {
      const { espace } = await client.appeler<{ espace: Etat }>("");
      appliquer(espace);
      setErreur(null);
      return espace;
    } catch (e) {
      const probleme = e instanceof ErreurEspace ? e : new ErreurEspace("Un souci de notre côté.", 500);
      // Pas de réseau : on garde ce qu'on a (la dernière version connue reste à l'écran).
      if (probleme.status !== 0) setErreur(probleme);
      else setErreur((avant) => avant ?? probleme);
      return null;
    }
  }, [client, appliquer]);

  useEffect(() => {
    // Dernier état connu d'abord (réseau lent ou coupé), puis la version à jour.
    try {
      const garde = localStorage.getItem(cleCache);
      if (garde) window.setTimeout(() => setEtat((actuel) => actuel ?? (JSON.parse(garde) as Etat)), 0);
    } catch {
      // rien de gardé
    }
    const premier = window.setTimeout(() => {
      setVue(vueDepuisAdresse());
      void charger();
    }, 0);
    const surRetour = () => document.visibilityState === "visible" && void charger();
    const surAdresse = () => {
      setVue(vueDepuisAdresse());
      window.scrollTo({ top: 0 });
    };
    document.addEventListener("visibilitychange", surRetour);
    window.addEventListener("online", surRetour);
    window.addEventListener("hashchange", surAdresse);
    return () => {
      window.clearTimeout(premier);
      document.removeEventListener("visibilitychange", surRetour);
      window.removeEventListener("online", surRetour);
      window.removeEventListener("hashchange", surAdresse);
    };
  }, [charger, cleCache]);

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

  if (!etat && erreur && erreur.status !== 0) return <LienInvalide erreur={erreur} onReessayer={() => void charger()} />;
  if (!etat) return <Chargement horsLigne={Boolean(erreur)} onReessayer={() => void charger()} />;

  const marque = marqueDe(etat);
  const onglet = (cle: CleProgression) => etat.etapes.find((e) => e.cle === cle);
  let contenu: React.ReactNode;
  if (vue === "photos") contenu = <EtapePhotos etat={etat} client={client} jeton={jeton} onEtat={appliquer} onSuite={() => aller("projet")} />;
  else if (vue === "projet") contenu = <EtapeProjet etat={etat} client={client} onEtat={appliquer} onSuite={() => aller("simulations")} />;
  else if (vue === "simulations") contenu = <EtapeSimulations etat={etat} client={client} jeton={jeton} onEtat={appliquer} recharger={charger} aller={aller} />;
  else if (vue === "devis") {
    const verrou = onglet("DEVIS");
    if (etat.devis) contenu = <EtapeDevis etat={etat} client={client} onEtat={appliquer} onSuite={() => aller("paiement")} />;
    else if (verrou?.verrouillee)
      contenu = <Verrou titre="Votre devis" raison={verrou.raison ?? "Validez une simulation pour recevoir votre devis."} action={{ libelle: etat.simulations.length ? "Voir mes simulations" : "Créer ma simulation", onClick: () => aller("simulations") }} />;
    else contenu = <DevisEnPreparation etat={etat} client={client} onSimulations={() => aller("simulations")} />;
  } else if (vue === "paiement") {
    const verrou = onglet("ACOMPTE");
    if (verrou?.verrouillee) contenu = <Verrou titre="Paiement" raison={verrou.raison ?? "Le paiement s'ouvre après votre accord sur le devis."} action={etat.devis ? { libelle: "Voir mon devis", onClick: () => aller("devis") } : null} />;
    else contenu = <EtapePaiement etat={etat} client={client} onApres={etat.etape === "TERMINE" ? () => aller("apres") : undefined} />;
  } else if (vue === "apres") contenu = <ApresChantier etat={etat} client={client} onEtat={appliquer} />;
  else contenu = <Accueil etat={etat} aller={aller} />;

  return (
    <div className="min-h-[100dvh] bg-[#F5F4F1] text-[#1A1A1A] [color-scheme:light]">
      <header className="sticky top-0 z-30 bg-[#F5F4F1]/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-2">
          <button type="button" onClick={() => aller("accueil")} aria-label="Accueil de votre espace CoverSwap" className={cx("-ml-1 rounded-xl p-1", FOCUS)}>
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
      </header>

      <main className="mx-auto max-w-xl px-4 pt-1 pb-[calc(6.25rem+env(safe-area-inset-bottom))]">
        {contenu}
        <footer className="px-2 pt-10 pb-2 text-center text-[13px] leading-relaxed text-[#6B665F]">
          Une question&nbsp;? CoverSwap vous répond au{" "}
          <a href={`tel:${marque.telephoneLien}`} className="font-semibold whitespace-nowrap text-[#1A1A1A] underline decoration-[#BDB8B0] underline-offset-2">
            {marque.telephone}
          </a>
          .
          <br />
          Cet espace vous est réservé&nbsp;: ne partagez pas son adresse. Lien valable jusqu&apos;au {new Date(etat.expireLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
        </footer>
      </main>

      <BarreOnglets etat={etat} vue={vue} aller={aller} />
    </div>
  );
}

/* ── La barre d'onglets : la seule navigation ─────────────────────────── */

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
          const etatDit = fait ? "\u00a0: fait" : verrou ? "\u00a0: pas encore ouvert" : aFaire ? "\u00a0: prochaine étape" : "";
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

/* ── Accueil : la prochaine étape, rien d'autre ───────────────────────── */

function Accueil({ etat, aller }: { etat: Etat; aller: (vue: Vue) => void }) {
  const pas = prochainPas(etat);
  const Icone = ONGLETS.find((o) => o.vue === pas.vue)?.Icone ?? IconeSimulation;
  // Tout tient entre l'en-tête et la barre d'onglets, même sur un petit iPhone avec les barres de Safari.
  return (
    <section aria-label="Votre prochaine étape" className="flex min-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-10rem)] flex-col justify-center py-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#CC0000] shadow-[0_6px_20px_rgba(26,26,26,0.08)] ring-1 ring-[#E6E3DD]" aria-hidden>
        <Icone taille={26} />
      </span>
      <p className="mt-6 text-[17px] text-[#5F5A53]">{etat.prenom ? `Bonjour ${etat.prenom},` : "Bonjour,"}</p>
      <h1 className="mt-1.5 font-display text-[30px] leading-[1.13] font-semibold tracking-tight text-balance text-[#1A1A1A] [@media(max-height:620px)]:text-[26px]">{pas.phrase}</h1>
      <BoutonPrincipal className="mt-7" onClick={() => aller(pas.vue)}>
        {pas.bouton}
      </BoutonPrincipal>
    </section>
  );
}

type Pas = { phrase: string; bouton: string; vue: Vue };

function prochainPas(etat: Etat): Pas {
  const projet = nomDuProjet(etat.typeProjet);
  const sims = etat.simulations;
  switch (etat.etape) {
    case "PHOTOS":
      return { phrase: `Envoyez-nous quelques photos de ${projet.votre} : c'est la première étape.`, bouton: "Envoyer mes photos", vue: "photos" };
    case "PROJET":
      // Il a déjà rempli son projet : il ne lui reste qu'à le valider.
      if (etat.monProjet && etat.monProjet.zones.length > 0 && !etat.projetValide) return { phrase: "Votre projet est presque prêt : relisez-le et validez-le.", bouton: "Valider mon projet", vue: "projet" };
      return { phrase: etat.photos.length > 0 || sims.some((s) => s.source === "SITE") ? "Vos photos sont là, précisez votre projet." : "Précisez votre projet en quelques gestes.", bouton: "Préciser mon projet", vue: "projet" };
    case "SIMULATIONS":
    case "ATTENTE_SIMULATION": {
      if ((etat.creation?.enCours.length ?? 0) > 0) return { phrase: "Votre simulation est en préparation : elle arrive dans une minute ou deux.", bouton: "Suivre ma simulation", vue: "simulations" };
      const nouvelles = sims.filter((s) => s.nouvelle && s.source === "CRM").length;
      if (nouvelles > 0) return { phrase: nouvelles > 1 ? "CoverSwap a préparé de nouvelles simulations pour vous." : "CoverSwap a préparé une nouvelle simulation pour vous.", bouton: nouvelles > 1 ? "Voir mes simulations" : "Voir ma simulation", vue: "simulations" };
      if (sims.length === 1) return { phrase: "Votre simulation vous attend.", bouton: "Voir ma simulation", vue: "simulations" };
      if (sims.length > 1) return { phrase: "Vos simulations vous attendent : validez celle qui vous plaît.", bouton: "Voir mes simulations", vue: "simulations" };
      return { phrase: `Tout est prêt : créez votre simulation, sur la photo de ${projet.votre}.`, bouton: "Créer ma simulation", vue: "simulations" };
    }
    case "ATTENTE_DEVIS":
      return { phrase: "Simulation validée : CoverSwap prépare votre devis.", bouton: "Revoir ma simulation", vue: "simulations" };
    case "DEVIS":
      return { phrase: etat.devis ? `Votre devis est prêt : ${euros(etat.devis.total)}.` : "Votre devis est prêt.", bouton: "Voir mon devis", vue: "devis" };
    case "ACOMPTE":
      return { phrase: "C'est signé ! Il reste l'acompte, qui réserve votre date.", bouton: "Voir le paiement", vue: "paiement" };
    case "CHANTIER":
      return { phrase: etat.chantier?.date ? `Rendez-vous le ${dateCourte(etat.chantier.date)} : tout est prêt.` : "Votre acompte est bien reçu : CoverSwap vous appelle pour fixer la date du chantier.", bouton: "Préparer le chantier", vue: "paiement" };
    case "TERMINE":
      return { phrase: "Votre chantier est terminé. Merci de votre confiance !", bouton: etat.apres?.avis ? "Voir les photos" : "Voir les photos et donner mon avis", vue: "apres" };
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
  const expire = erreur.raison === "expire" || erreur.raison === "revoque";
  const reseau = erreur.status === 0 || erreur.status >= 500 || erreur.status === 429;
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#F5F4F1] px-6 text-center text-[#1A1A1A]">
      <Logo />
      <h1 className="mt-8 font-display text-[26px] leading-tight font-semibold text-balance">{reseau ? "Impossible d'ouvrir votre espace" : expire ? "Ce lien n'est plus actif" : "Ce lien n'est pas valide"}</h1>
      <p className="mt-3 max-w-sm text-[16.5px] leading-relaxed text-[#4F4A44]">
        {reseau
          ? erreur.message
          : expire
            ? "Pour votre sécurité, les liens ont une durée de vie limitée. Demandez-nous-en un nouveau : nous vous l'envoyons par SMS dans la minute."
            : "Vérifiez que vous avez ouvert le lien en entier, tel que reçu par SMS. Sinon, appelez-nous : nous vous en envoyons un nouveau."}
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
