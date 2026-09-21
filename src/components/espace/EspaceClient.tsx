"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { creerClient, dateCourte, ErreurEspace, euros, nomDuProjet, type Client, type Etat, type EtapeEspace } from "./api";
import { AvantApres } from "./AvantApres";
import { EtapeAcompte, ApresChantier } from "./EtapeAcompte";
import { EtapeDevis } from "./EtapeDevis";
import { EtapePhotos } from "./EtapePhotos";
import { EtapeProjet } from "./EtapeProjet";
import { EtapeSimulations } from "./EtapeSimulations";
import { IconeCoche, IconeSuite, IconeTelephone, Logo } from "./Illustrations";
import { BoutonPrincipal, Carte, Surtitre, cx } from "./ui";

/**
 * L'espace du client, sur son téléphone : son projet, pas un formulaire.
 *
 * À chaque visite, UNE chose à faire, en grand : l'étape où il en est (photos,
 * projet, choix, devis, acompte). Le reste est là, en dessous, sans lui faire
 * concurrence. Il peut quitter et revenir : son dernier état est gardé dans le
 * téléphone, ses photos en attente repartent seules. Lucas est toujours à un
 * geste : le bouton d'appel ne quitte jamais l'écran.
 */

type Vue = "accueil" | "photos" | "projet" | "simulations" | "devis" | "acompte" | "apres";
const VUES: Vue[] = ["photos", "projet", "simulations", "devis", "acompte", "apres"];

const vueDepuisAdresse = (): Vue => {
  const h = typeof window === "undefined" ? "" : window.location.hash.replace("#", "");
  return (VUES as string[]).includes(h) ? (h as Vue) : "accueil";
};

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
    } catch (e) {
      const probleme = e instanceof ErreurEspace ? e : new ErreurEspace("Un souci de notre côté.", 500);
      // Pas de réseau : on garde ce qu'on a (la dernière version connue reste à l'écran).
      if (probleme.status !== 0) setErreur(probleme);
      else setErreur((avant) => avant ?? probleme);
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
      if (window.location.hash) window.history.pushState(null, "", window.location.pathname + window.location.search);
      setVue("accueil");
    } else {
      window.location.hash = cible;
    }
    window.scrollTo({ top: 0 });
  }, []);

  if (!etat && erreur && erreur.status !== 0) return <LienInvalide erreur={erreur} onReessayer={() => void charger()} />;
  if (!etat) return <Chargement horsLigne={Boolean(erreur)} onReessayer={() => void charger()} />;

  const retour = () => aller("accueil");
  let contenu: React.ReactNode;
  if (vue === "photos") contenu = <EtapePhotos etat={etat} client={client} jeton={jeton} onEtat={appliquer} onRetour={retour} onSuite={() => aller("projet")} />;
  else if (vue === "projet") contenu = <EtapeProjet etat={etat} client={client} onEtat={appliquer} onRetour={retour} onSuite={retour} />;
  else if (vue === "simulations") contenu = <EtapeSimulations etat={etat} client={client} onEtat={appliquer} onRetour={retour} onSuite={() => aller("devis")} />;
  else if (vue === "devis" && etat.devis) contenu = <EtapeDevis etat={etat} client={client} onEtat={appliquer} onRetour={retour} onSuite={() => aller("acompte")} />;
  else if (vue === "acompte") contenu = <EtapeAcompte etat={etat} client={client} onRetour={retour} />;
  else if (vue === "apres") contenu = <ApresChantier etat={etat} client={client} onEtat={appliquer} onRetour={retour} />;
  else contenu = <Accueil etat={etat} client={client} aller={aller} />;

  return (
    <div className="min-h-[100dvh] bg-[#F5F4F1] pb-[calc(6rem+env(safe-area-inset-bottom))] text-[#1A1A1A] [color-scheme:light]">
      {client.apercu ? (
        <p className="sticky top-0 z-30 bg-[#FFF1C7] px-4 py-2.5 text-center text-[14px] font-medium text-[#5C4200]">Aperçu&nbsp;: l&apos;espace tel que votre client le voit. Rien n&apos;est enregistré, vos visites ne comptent pas.</p>
      ) : null}
      {!enLigne ? <p className="sticky top-0 z-30 bg-[#1A1A1A] px-4 py-2.5 text-center text-[14px] text-white">Pas de réseau&nbsp;: vous voyez la dernière version. Rien n&apos;est perdu.</p> : null}
      <header className="mx-auto flex max-w-xl items-center justify-between px-5 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-1">
        <Logo />
        <span className="text-[13px] font-medium text-[#6B665F]">Votre espace privé</span>
      </header>
      <main className="mx-auto max-w-xl px-4 pt-1.5">{contenu}</main>
      <footer className="mx-auto max-w-xl px-6 pt-8 pb-2 text-center text-[13px] leading-relaxed text-[#6B665F]">
        {/* Ce que deviennent ses photos se dit sur la page des photos, là où il les envoie. */}
        Cet espace vous est réservé&nbsp;: ne partagez pas son adresse.
        <br />
        Lien valable jusqu&apos;au {new Date(etat.expireLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
      </footer>
      {/* Toujours à l'écran, mais en retrait : le seul bouton rouge reste celui de l'action du moment. */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#F5F4F1] via-[#F5F4F1]/90 to-transparent px-4 pt-3 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        <a
          href={`tel:${etat.contact.telephoneLien}`}
          className="mx-auto flex h-[52px] max-w-xl items-center justify-center gap-2.5 rounded-2xl border border-[#D3CFC8] bg-white text-[16px] font-semibold text-[#1A1A1A] shadow-[0_4px_18px_rgba(26,26,26,0.12)] active:bg-[#F2F0EC] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]"
        >
          <span className="text-[#CC0000]">
            <IconeTelephone />
          </span>
          <span>
            Appeler {etat.contact.prenom} · <span className="tabular-nums">{etat.contact.telephone}</span>
          </span>
        </a>
      </div>
    </div>
  );
}

/* ── Accueil : une seule chose à faire ─────────────────────────────── */

function Accueil({ etat, client, aller }: { etat: Etat; client: Client; aller: (vue: Vue) => void }) {
  const projet = nomDuProjet(etat.typeProjet);
  const action = actionPrincipale(etat);
  const essaiSite = etat.simulations.find((s) => s.source === "SITE") ?? null;
  const nouvelles = etat.simulations.filter((s) => s.nouvelle).length;
  const propositions = etat.simulations.filter((s) => s.source !== "SITE").length;

  const lignes: { vue: Vue; titre: string; etat: string; ouvert: boolean; fait: boolean }[] = [
    { vue: "photos", titre: "Vos photos", etat: etat.photos.length ? `${etat.photos.length} reçue${etat.photos.length > 1 ? "s" : ""}` : "À envoyer", ouvert: true, fait: etat.photos.length > 0 },
    { vue: "projet", titre: "Votre projet", etat: etat.monProjet ? "Précisé" : "À préciser", ouvert: true, fait: etat.etapes.find((e) => e.cle === "PROJET")?.fait ?? false },
    {
      vue: "simulations",
      titre: "Vos simulations",
      etat: propositions ? `${propositions} proposition${propositions > 1 ? "s" : ""}${nouvelles ? ` · ${nouvelles} nouvelle${nouvelles > 1 ? "s" : ""}` : ""}` : essaiSite ? "Votre essai du site" : etat.simulationsEnPreparation ? `En préparation, ${etat.simulationsEnPreparation.delai}` : "Après vos photos",
      ouvert: etat.simulations.length > 0 || Boolean(etat.simulationsEnPreparation),
      fait: Boolean(etat.choix),
    },
    { vue: "devis", titre: "Votre devis", etat: etat.devis ? (etat.devis.accepte ? "Accepté" : `Prêt · ${euros(etat.devis.total)}`) : "Après votre choix", ouvert: Boolean(etat.devis), fait: Boolean(etat.devis?.accepte) },
    { vue: "acompte", titre: "Acompte et suite", etat: !etat.devis?.accepte || !etat.acompte ? "Après votre accord" : etat.acompte.complet ? "Reçu" : `À régler · ${euros(etat.acompte.montant - etat.acompte.recu)}`, ouvert: Boolean(etat.devis?.accepte), fait: Boolean(etat.acompte?.complet) },
  ];

  const essaiEnTete = etat.etape === "PROJET" ? essaiSite : null;
  // Avant la signature, la phrase qui rassure se lit au pied du bouton : là où l'on hésite.
  const avantSignature = !etat.devis?.accepte && ["PHOTOS", "PROJET", "SIMULATIONS", "ATTENTE_SIMULATION", "ATTENTE_DEVIS", "DEVIS"].includes(etat.etape);

  // Tout le haut tient dans l'écran d'un iPhone, barres de Safari comprises (≈ 390 × 660, 375 × 560
  // pour un SE) : bonjour, qui je suis en une ligne, le chemin en cinq étapes, puis l'action et son bouton.
  return (
    <div className="space-y-4 [@media(max-height:620px)]:space-y-3">
      <div className="px-1 pt-1">
        <h1 className="font-display text-[28px] leading-[1.1] font-semibold tracking-tight text-[#1A1A1A] [@media(max-height:620px)]:text-[25px]">{etat.prenom ? `Bonjour ${etat.prenom},` : "Bonjour,"}</h1>
        <p className="mt-1 text-[17px] leading-snug text-[#4F4A44]">voici {projet.projet}.</p>
      </div>

      <div className="flex items-center gap-3 px-1">
        {etat.contact.portrait ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo servie par le CRM
          <img src={client.url("/portrait")} alt={etat.contact.nom} className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white" referrerPolicy="no-referrer" />
        ) : (
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] font-display text-[18px] font-semibold text-white" aria-hidden>
            L<span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rotate-45 rounded-[3px] border-2 border-[#F5F4F1] bg-[#CC0000]" />
          </span>
        )}
        <p className="min-w-0 text-[14.5px] leading-snug text-[#4F4A44]">
          <span className="block text-[16px] font-semibold text-[#1A1A1A]">{etat.contact.nom}</span>
          {etat.contact.role}
        </p>
      </div>

      <Progression etat={etat} />

      <Carte className="space-y-3.5 border-[#1A1A1A]/10 p-5 shadow-[0_8px_30px_rgba(26,26,26,0.08)] [@media(max-height:620px)]:space-y-3 [@media(max-height:620px)]:p-4">
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-2.5 w-2.5 rotate-45 bg-[#CC0000]" />
          <Surtitre ton="rouge">{action.surtitre}</Surtitre>
        </div>
        <h2 className="font-display text-[23px] leading-[1.15] font-semibold tracking-tight text-balance text-[#1A1A1A] [@media(max-height:620px)]:text-[21px]">{action.titre}</h2>
        {/* Son essai du site : l'image d'abord, le bouton juste dessous, l'explication ensuite (tout tient dans l'écran). */}
        {essaiEnTete ? (
          <AvantApres apres={client.url(`/simulations/${essaiEnTete.id}`)} avant={essaiEnTete.avant ? client.url(`/simulations/${essaiEnTete.id}/avant`) : null} alt="Votre essai sur le site" className="aspect-[2/1] [@media(max-height:620px)]:aspect-[5/2] [&>img:first-child]:h-full [&>img:first-child]:object-cover" />
        ) : null}
        {etat.etape === "DEVIS" && etat.devis ? <p className="font-display text-[32px] leading-none font-semibold tabular-nums">{euros(etat.devis.total)}</p> : null}
        {essaiEnTete ? null : <p className="text-[16.5px] leading-relaxed text-[#3F3B36]">{action.texte}</p>}
        {action.vue ? <BoutonPrincipal onClick={() => aller(action.vue!)}>{action.bouton}</BoutonPrincipal> : null}
        {essaiEnTete ? <p className="text-[15.5px] leading-relaxed text-[#3F3B36]">{action.texte}</p> : null}
        {avantSignature ? (
          <p className="flex items-center justify-center gap-1.5 text-center text-[14px] text-[#5F5A53]">
            <span className="text-[#1F7A4D]">
              <IconeCoche />
            </span>
            Aucun engagement avant votre signature
          </p>
        ) : null}
        {action.secondaires.length > 0 ? (
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {action.secondaires.map((s) => (
              <button key={s.vue} type="button" onClick={() => aller(s.vue)} className="min-h-[44px] text-[15.5px] font-medium text-[#1A1A1A] underline decoration-[#BDB8B0] underline-offset-4">
                {s.libelle}
              </button>
            ))}
          </div>
        ) : null}
      </Carte>

      <section aria-label="Votre dossier">
        <Surtitre>Votre dossier</Surtitre>
        <ul className="mt-2.5 overflow-hidden rounded-[22px] border border-[#E6E3DD] bg-white">
          {lignes.map((ligne, i) => (
            <li key={ligne.vue} className={cx(i > 0 && "border-t border-[#EEEBE6]")}>
              <button type="button" disabled={!ligne.ouvert} onClick={() => aller(ligne.vue)} className="flex min-h-[62px] w-full items-center gap-3 px-4 text-left disabled:cursor-default">
                <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", ligne.fait ? "bg-[#1F7A4D] text-white" : "border-2 border-[#D3CFC8]")} aria-hidden>
                  {ligne.fait ? <IconeCoche /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx("block text-[16.5px] font-semibold", ligne.ouvert ? "text-[#1A1A1A]" : "text-[#8A857E]")}>{ligne.titre}</span>
                  <span className={cx("block truncate text-[14.5px]", ligne.ouvert ? "text-[#5F5A53]" : "text-[#8A857E]")}>{ligne.etat}</span>
                </span>
                {ligne.ouvert ? <IconeSuite /> : null}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Progression({ etat }: { etat: Etat }) {
  return (
    <ol className="grid grid-cols-5 gap-1.5 px-1" aria-label="Avancement de votre projet">
      {etat.etapes.map((e) => (
        <li key={e.cle} aria-current={e.courante ? "step" : undefined}>
          <span className={cx("block h-1.5 rounded-full", e.fait ? "bg-[#1A1A1A]" : e.courante ? "bg-[#CC0000]" : "bg-[#DDD9D2]")} />
          <span className={cx("mt-1.5 block text-[12px] leading-tight tracking-[-0.01em]", e.courante ? "font-semibold text-[#B00000]" : e.fait ? "font-medium text-[#1A1A1A]" : "text-[#6B665F]")}>
            {e.libelle}
            <span className="sr-only">{e.fait ? "\u00a0: fait" : e.courante ? "\u00a0: en cours" : "\u00a0: à venir"}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

type Action = { surtitre: string; titre: string; texte: string; bouton?: string; vue?: Vue; secondaires: { vue: Vue; libelle: string }[] };

function actionPrincipale(etat: Etat): Action {
  const projet = nomDuProjet(etat.typeProjet);
  const etape: EtapeEspace = etat.etape;
  const nouvelles = etat.simulations.filter((s) => s.nouvelle && s.source !== "SITE").length;
  switch (etape) {
    case "PHOTOS":
      return { surtitre: "À faire maintenant", titre: `Envoyez-moi quelques photos de ${projet.votre}`, texte: "Pour préparer votre simulation sur votre propre pièce. Deux minutes suffisent, je vous guide.", bouton: "Envoyer mes photos", vue: "photos", secondaires: [] };
    case "PROJET":
      return etat.simulations.some((s) => s.source === "SITE")
        ? { surtitre: "À faire maintenant", titre: "Votre essai sur le site", texte: "Un bon point de départ. Dites-moi ce que vous voulez changer et ce qui vous plaît\u00a0: je prépare mes propositions sur cette base.", bouton: "Préciser mon projet", vue: "projet", secondaires: [{ vue: "photos", libelle: "Ajouter des photos" }] }
        : { surtitre: "À faire maintenant", titre: "Dites-moi ce que vous voulez changer", texte: "Quelques choix à toucher, pas de formulaire\u00a0: les zones à rafraîchir, vos goûts, la taille de la pièce.", bouton: "Préciser mon projet", vue: "projet", secondaires: [{ vue: "photos", libelle: "Ajouter des photos" }] };
    case "ATTENTE_SIMULATION":
      return { surtitre: "Je m'en occupe", titre: "Je prépare vos simulations", texte: `Merci, j'ai tout ce qu'il me faut. Vous les trouverez ici ${etat.simulationsEnPreparation?.delai ?? "sous 24 h"}, et je vous préviens par SMS.`, secondaires: [{ vue: "photos", libelle: "Ajouter des photos" }, { vue: "projet", libelle: "Modifier mon projet" }] };
    case "SIMULATIONS":
      return { surtitre: nouvelles ? "Nouveau" : "À faire maintenant", titre: etat.simulations.length > 1 ? "Vos simulations sont prêtes" : "Votre simulation est prête", texte: etat.simulations.length > 1 ? "Comparez avant et après sur votre photo, puis choisissez celle qui vous plaît — ou composez votre mélange." : "Comparez avant et après sur votre photo\u00a0: validez-la en un geste, ou demandez une autre proposition.", bouton: etat.simulations.length > 1 ? "Voir et choisir" : "Voir ma simulation", vue: "simulations", secondaires: [] };
    case "ATTENTE_DEVIS":
      return { surtitre: "Je m'en occupe", titre: "Je prépare votre devis", texte: "Vous avez fait votre choix\u00a0: je vous envoie le devis ici même, très vite. Vous pourrez le valider en un geste.", secondaires: [{ vue: "simulations", libelle: "Revoir mon choix" }] };
    case "DEVIS":
      return { surtitre: "À faire maintenant", titre: "Votre devis est prêt", texte: "Tout est détaillé, lisible ici. Si tout vous convient, vous donnez votre accord en un geste.", bouton: "Voir mon devis", vue: "devis", secondaires: etat.simulations.length ? [{ vue: "simulations", libelle: "Revoir les simulations" }] : [] };
    case "ACOMPTE":
      return { surtitre: "C'est signé", titre: "Dernière étape\u00a0: l'acompte", texte: `Il réserve votre date${etat.acompte ? `\u00a0: ${euros(etat.acompte.montant - etat.acompte.recu)}, par virement` : ""}. Je vous appelle ensuite pour fixer le jour du chantier.`, bouton: "Voir comment régler", vue: "acompte", secondaires: [{ vue: "devis", libelle: "Revoir mon devis" }] };
    case "CHANTIER":
      return { surtitre: "Votre chantier", titre: etat.chantier?.date ? `Rendez-vous le ${dateCourte(etat.chantier.date)}` : "Je vous appelle pour fixer la date", texte: "Voici ce qu'il faut préparer avant mon passage, et comment se déroule la journée.", bouton: "La suite", vue: "acompte", secondaires: [] };
    case "TERMINE":
      return { surtitre: "Merci", titre: `Votre nouvelle ${projet.le.replace(/^la /, "")} est prête`, texte: "Les photos du résultat sont là. Si vous avez une minute, votre avis m'aide beaucoup.", bouton: etat.apres?.avis ? "Voir les photos" : "Voir les photos et donner mon avis", vue: "apres", secondaires: [] };
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
        {reseau ? erreur.message : expire ? "Pour votre sécurité, les liens ont une durée de vie limitée. Demandez-m'en un nouveau\u00a0: je vous l'envoie par SMS dans la minute." : "Vérifiez que vous avez ouvert le lien en entier, tel que reçu par SMS. Sinon, appelez-moi\u00a0: je vous en envoie un nouveau."}
      </p>
      {reseau ? (
        <button type="button" onClick={onReessayer} className="mt-6 min-h-[56px] w-full max-w-xs rounded-2xl bg-[#CC0000] text-[17px] font-semibold text-white">
          Réessayer
        </button>
      ) : null}
      <a href="tel:+33670352869" className={cx("flex min-h-[56px] w-full max-w-xs items-center justify-center gap-2 rounded-2xl text-[16.5px] font-semibold", reseau ? "mt-3 border border-[#D3CFC8] bg-white text-[#1A1A1A]" : "mt-6 bg-[#1A1A1A] text-white")}>
        <IconeTelephone /> Appeler Lucas · 06 70 35 28 69
      </a>
    </div>
  );
}
