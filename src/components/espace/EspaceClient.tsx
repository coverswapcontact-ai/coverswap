"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * L'espace du client, tel qu'il le voit sur son téléphone : son projet, pas un
 * formulaire. Quatre gestes, du plus simple au plus engageant — déposer des
 * photos, dire ses envies, choisir une simulation, donner son accord.
 * Tout parle au CRM avec le seul lien signé de l'adresse.
 */
type Souhaits = { teintes: string[]; style: string | null; propositions: boolean; precisions: string };
type Etat = {
  prenom: string;
  projet: string;
  avancement: "PHOTOS" | "SIMULATION" | "DEVIS" | "ACCORD" | "CHANTIER";
  photos: { id: string }[];
  souhaits: Souhaits | null;
  simulations: { id: string; titre: string | null; description: string | null; choisie: boolean; commentaire: string | null }[];
  coordonnees: { nom: string; adresse: string; codePostal: string; ville: string; email: string | null; completes: boolean };
  devis: { id: string; numero: string; objet: string; total: number; acompte: number; acomptePct: number | null; emisLe: string; accepte: { le: string; nom: string } | null } | null;
  virement: { titulaire: string; iban: string; bic: string; reference: string } | null;
  paiementCarte: boolean;
  contact: { nom: string; telephone: string; telephoneLien: string };
  expireLe: string;
};

const TEINTES = ["Bois clair", "Bois foncé", "Blanc", "Noir", "Gris", "Beige", "Effet marbre", "Effet béton", "Une couleur"];
const STYLES = ["Moderne", "Chaleureux", "Épuré", "Classique", "Industriel"];
const ETAPES: { cle: Etat["avancement"]; libelle: string }[] = [
  { cle: "PHOTOS", libelle: "Photos" },
  { cle: "SIMULATION", libelle: "Simulation" },
  { cle: "DEVIS", libelle: "Devis" },
  { cle: "ACCORD", libelle: "Accord" },
];

const euros = (montant: number) => montant.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: montant % 1 === 0 ? 0 : 2 });

class ErreurEspace extends Error {
  constructor(message: string, readonly status: number, readonly raison?: string) {
    super(message);
  }
}

/** Réduit une photo avant l'envoi (2 000 px de côté au plus, JPEG) : dix fois moins lourd sur un réseau de chantier. */
async function reduirePhoto(fichier: File): Promise<File> {
  try {
    const image = await createImageBitmap(fichier);
    const echelle = Math.min(1, 2000 / Math.max(image.width, image.height));
    if (echelle === 1 && fichier.size < 1_500_000 && fichier.type === "image/jpeg") return fichier;
    const toile = document.createElement("canvas");
    toile.width = Math.round(image.width * echelle);
    toile.height = Math.round(image.height * echelle);
    toile.getContext("2d")?.drawImage(image, 0, 0, toile.width, toile.height);
    image.close();
    const blob = await new Promise<Blob | null>((resoudre) => toile.toBlob(resoudre, "image/jpeg", 0.84));
    if (!blob || blob.size >= fichier.size) return fichier;
    return new File([blob], fichier.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    // Format que le navigateur ne sait pas lire (HEIC hors iPhone) : la photo part telle quelle.
    return fichier;
  }
}

type PhotoLocale = { cle: string; apercu: string; fichier: File; etat: "attente" | "envoi" | "ok" | "echec"; erreur?: string };

export default function EspaceClient({ jeton, baseApi }: { jeton: string; baseApi: string }) {
  const racine = `${baseApi}/${encodeURIComponent(jeton)}`;
  const [etat, setEtat] = useState<Etat | null>(null);
  const [erreur, setErreur] = useState<ErreurEspace | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);

  const appeler = useCallback(
    async <T,>(chemin: string, init?: RequestInit): Promise<T> => {
      let reponse: Response;
      try {
        reponse = await fetch(`${racine}${chemin}`, { ...init, cache: "no-store", referrerPolicy: "no-referrer" });
      } catch {
        setHorsLigne(true);
        throw new ErreurEspace("Connexion impossible. Vérifiez votre réseau et réessayez.", 0);
      }
      setHorsLigne(false);
      const corps = (await reponse.json().catch(() => ({}))) as { error?: string; raison?: string };
      if (!reponse.ok) throw new ErreurEspace(corps.error ?? "Un problème est survenu. Réessayez dans un instant.", reponse.status, corps.raison);
      return corps as T;
    },
    [racine]
  );

  const charger = useCallback(async () => {
    try {
      const { espace } = await appeler<{ espace: Etat }>("");
      setEtat(espace);
      setErreur(null);
    } catch (e) {
      if (e instanceof ErreurEspace && e.status !== 0) setErreur(e);
      else if (!etat) setErreur(e as ErreurEspace);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appeler]);

  useEffect(() => {
    // Premier chargement différé d'un tour : l'effet s'abonne, il ne modifie pas l'état lui-même.
    const premier = window.setTimeout(() => void charger(), 0);
    const surRetour = () => document.visibilityState === "visible" && void charger();
    document.addEventListener("visibilitychange", surRetour);
    window.addEventListener("online", surRetour);
    return () => {
      window.clearTimeout(premier);
      document.removeEventListener("visibilitychange", surRetour);
      window.removeEventListener("online", surRetour);
    };
  }, [charger]);

  if (erreur && !etat) return <LienInvalide erreur={erreur} onReessayer={() => void charger()} />;
  if (!etat) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gris-100 text-gris-600">
        <p className="animate-pulse text-[15px]">Ouverture de votre espace…</p>
      </div>
    );
  }

  const rang = ETAPES.findIndex((e) => e.cle === (etat.avancement === "CHANTIER" ? "ACCORD" : etat.avancement));

  return (
    <div className="min-h-[100dvh] bg-gris-100 pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-noir">
      <header className="bg-noir px-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-6 text-white">
        <div className="mx-auto max-w-xl">
          <p className="font-display text-[15px] font-semibold tracking-tight">
            Cover<span className="text-rouge-light">Swap</span>
          </p>
          <h1 className="mt-4 font-display text-[26px] leading-tight font-semibold">{etat.prenom ? `Bonjour ${etat.prenom},` : "Bonjour,"}</h1>
          <p className="mt-1 text-[15px] text-gris-300">voici votre espace pour : {etat.projet.charAt(0).toLowerCase() + etat.projet.slice(1)}.</p>
          <ol className="mt-5 grid grid-cols-4 gap-1.5" aria-label="Avancement de votre projet">
            {ETAPES.map((etape, index) => (
              <li key={etape.cle} aria-current={index === rang ? "step" : undefined}>
                <span className={`block h-1.5 rounded-full ${index <= rang ? "bg-rouge-light" : "bg-gris-700"}`} />
                <span className={`mt-1.5 block text-[11.5px] ${index === rang ? "font-semibold text-white" : index < rang ? "text-gris-300" : "text-gris-500"}`}>{etape.libelle}</span>
              </li>
            ))}
          </ol>
        </div>
      </header>

      {horsLigne ? <p className="bg-amber-100 px-5 py-2.5 text-center text-[13.5px] text-amber-900">Pas de réseau pour l&apos;instant : rien n&apos;est perdu, réessayez dans un moment.</p> : null}

      <div className="mx-auto max-w-xl space-y-4 px-4 pt-4">
        {etat.devis ? <BlocDevis etat={etat} racine={racine} appeler={appeler} onEtat={setEtat} /> : null}
        {etat.simulations.length > 0 ? <BlocSimulations etat={etat} racine={racine} appeler={appeler} onEtat={setEtat} /> : null}
        <BlocPhotos etat={etat} racine={racine} onEtat={setEtat} />
        <BlocSouhaits etat={etat} appeler={appeler} />
        <p className="px-2 pt-2 pb-4 text-center text-[12px] leading-relaxed text-gris-600">
          Cet espace vous est réservé : ne partagez pas son adresse. Vos photos ne servent qu&apos;à préparer votre projet.
          <br />
          Lien valable jusqu&apos;au {new Date(etat.expireLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
      </div>

      <a
        href={`tel:${etat.contact.telephoneLien}`}
        className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] mx-auto flex h-14 max-w-xl items-center justify-center gap-2 rounded-2xl bg-noir text-[16px] font-semibold text-white shadow-lg shadow-black/20 active:scale-[0.99]"
      >
        <IconeTelephone /> Appeler Lucas · {etat.contact.telephone}
      </a>
    </div>
  );
}

/* ── Blocs ─────────────────────────────────────────────────────────── */

function Carte({ numero, titre, fait, children }: { numero?: string; titre: string; fait?: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="flex items-center gap-2.5 font-display text-[19px] font-semibold">
        {numero ? <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] ${fait ? "bg-emerald-100 text-emerald-700" : "bg-gris-100 text-gris-600"}`}>{fait ? "✓" : numero}</span> : null}
        {titre}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BlocPhotos({ etat, racine, onEtat }: { etat: Etat; racine: string; onEtat: (etat: Etat) => void }) {
  const [locales, setLocales] = useState<PhotoLocale[]>([]);
  const entree = useRef<HTMLInputElement>(null);
  const enCours = useRef(false);

  const envoyer = useCallback(
    async (file: PhotoLocale[]) => {
      if (enCours.current) return;
      enCours.current = true;
      for (const photo of file) {
        if (photo.etat === "ok") continue;
        setLocales((l) => l.map((p) => (p.cle === photo.cle ? { ...p, etat: "envoi", erreur: undefined } : p)));
        try {
          const reduite = await reduirePhoto(photo.fichier);
          const formulaire = new FormData();
          formulaire.append("photos", reduite);
          let reponse: Response | null = null;
          // Deux nouveaux essais espacés : un réseau de chantier décroche souvent une seconde.
          for (let essai = 0; essai < 3 && !reponse; essai++) {
            try {
              reponse = await fetch(`${racine}/photos`, { method: "POST", body: formulaire, referrerPolicy: "no-referrer" });
            } catch {
              await new Promise((r) => setTimeout(r, 1500 * (essai + 1)));
            }
          }
          if (!reponse) throw new Error("Pas de réseau : touchez la photo pour réessayer.");
          const corps = (await reponse.json().catch(() => ({}))) as { error?: string; espace?: Etat };
          if (!reponse.ok) throw new Error(corps.error ?? "Photo refusée.");
          if (corps.espace) onEtat(corps.espace);
          setLocales((l) => l.map((p) => (p.cle === photo.cle ? { ...p, etat: "ok" } : p)));
        } catch (e) {
          setLocales((l) => l.map((p) => (p.cle === photo.cle ? { ...p, etat: "echec", erreur: e instanceof Error ? e.message : "Échec" } : p)));
        }
      }
      enCours.current = false;
    },
    [racine, onEtat]
  );

  function choisir(fichiers: FileList | null) {
    if (!fichiers?.length) return;
    const nouvelles = [...fichiers].slice(0, 10).map((fichier, index): PhotoLocale => ({ cle: `${Date.now()}-${index}`, apercu: URL.createObjectURL(fichier), fichier, etat: "attente" }));
    setLocales((l) => [...l, ...nouvelles]);
    void envoyer(nouvelles);
    if (entree.current) entree.current.value = "";
  }

  const aEnvoyer = locales.filter((p) => p.etat !== "ok");
  const total = etat.photos.length;
  return (
    <Carte numero="1" titre="Vos photos" fait={total > 0}>
      <p className="text-[15px] leading-relaxed text-gris-700">
        {total > 0 ? `${total} photo${total > 1 ? "s" : ""} reçue${total > 1 ? "s" : ""}, merci ! Vous pouvez en ajouter d'autres.` : "Deux ou trois photos de la pièce suffisent : une vue d'ensemble, et les meubles de près. Je m'occupe du reste."}
      </p>
      <input ref={entree} type="file" accept="image/*" multiple className="sr-only" id="photos" onChange={(evenement) => choisir(evenement.target.files)} />
      <label htmlFor="photos" className="mt-4 flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-rouge text-[16px] font-semibold text-white active:bg-rouge-hover">
        <IconeAppareil /> {total > 0 ? "Ajouter des photos" : "Déposer mes photos"}
      </label>
      {total > 0 || locales.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {etat.photos.map((photo) => (
            <li key={photo.id} className="aspect-square overflow-hidden rounded-xl bg-gris-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${racine}/photos/${photo.id}`} alt="Photo déposée" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            </li>
          ))}
          {aEnvoyer.map((photo) => (
            <li key={photo.cle} className="relative aspect-square overflow-hidden rounded-xl bg-gris-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.apercu} alt="" className="h-full w-full object-cover opacity-60" />
              <button
                type="button"
                disabled={photo.etat !== "echec"}
                onClick={() => void envoyer([photo])}
                className={`absolute inset-0 flex items-center justify-center px-1 text-center text-[11.5px] font-medium ${photo.etat === "echec" ? "bg-red-900/70 text-white" : "bg-black/30 text-white"}`}
              >
                {photo.etat === "echec" ? (photo.erreur ?? "Échec — réessayer") : "Envoi…"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Carte>
  );
}

function BlocSouhaits({ etat, appeler }: { etat: Etat; appeler: <T>(chemin: string, init?: RequestInit) => Promise<T> }) {
  const [souhaits, setSouhaits] = useState<Souhaits>(etat.souhaits ?? { teintes: [], style: null, propositions: false, precisions: "" });
  const [sauvegarde, setSauvegarde] = useState<"" | "en-cours" | "ok" | "echec">("");
  const minuterie = useRef<number | null>(null);

  // Dernier état connu, hors rendu : deux gestes rapprochés ne s'écrasent pas l'un l'autre.
  const courant = useRef(souhaits);
  function changer(modifier: (avant: Souhaits) => Souhaits) {
    const suite = modifier(courant.current);
    courant.current = suite;
    setSouhaits(suite);
    setSauvegarde("en-cours");
    if (minuterie.current) window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => {
      appeler("/souhaits", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(courant.current) })
        .then(() => setSauvegarde("ok"))
        .catch(() => setSauvegarde("echec"));
    }, 700);
  }

  const puce = (actif: boolean) => `h-11 rounded-full border px-4 text-[14.5px] font-medium transition-colors ${actif ? "border-noir bg-noir text-white" : "border-gris-300 bg-white text-gris-700 active:bg-gris-100"}`;
  const renseigne = souhaits.propositions || souhaits.teintes.length > 0 || Boolean(souhaits.style) || Boolean(souhaits.precisions);
  return (
    <Carte numero="2" titre="Vos envies" fait={renseigne}>
      <button type="button" aria-pressed={souhaits.propositions} onClick={() => changer((avant) => ({ ...avant, propositions: !avant.propositions }))} className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left ${souhaits.propositions ? "border-noir bg-gris-100" : "border-gris-200"}`}>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[14px] ${souhaits.propositions ? "border-noir bg-noir text-white" : "border-gris-400"}`}>{souhaits.propositions ? "✓" : ""}</span>
        <span>
          <span className="block text-[15px] font-medium">Je n&apos;ai pas d&apos;idée précise</span>
          <span className="block text-[13.5px] text-gris-600">Proposez-moi ce qui irait bien chez moi.</span>
        </span>
      </button>
      <p className="mt-4 mb-2 text-[13.5px] font-medium text-gris-600">Teintes qui me plaisent</p>
      <div className="flex flex-wrap gap-2">
        {TEINTES.map((teinte) => {
          const actif = souhaits.teintes.includes(teinte);
          return (
            <button key={teinte} type="button" aria-pressed={actif} className={puce(actif)} onClick={() => changer((avant) => ({ ...avant, teintes: avant.teintes.includes(teinte) ? avant.teintes.filter((t) => t !== teinte) : [...avant.teintes, teinte] }))}>
              {teinte}
            </button>
          );
        })}
      </div>
      <p className="mt-4 mb-2 text-[13.5px] font-medium text-gris-600">Ambiance</p>
      <div className="flex flex-wrap gap-2">
        {STYLES.map((style) => (
          <button key={style} type="button" aria-pressed={souhaits.style === style} className={puce(souhaits.style === style)} onClick={() => changer((avant) => ({ ...avant, style: avant.style === style ? null : style }))}>
            {style}
          </button>
        ))}
      </div>
      <label className="mt-4 block">
        <span className="mb-2 block text-[13.5px] font-medium text-gris-600">Un mot de plus ? (facultatif)</span>
        <textarea
          rows={3}
          maxLength={1000}
          value={souhaits.precisions}
          onChange={(evenement) => changer((avant) => ({ ...avant, precisions: evenement.target.value }))}
          placeholder="Garder les poignées, plan de travail effet pierre…"
          className="w-full rounded-2xl border border-gris-300 bg-white px-4 py-3 text-[16px] placeholder:text-gris-400 focus:border-noir focus:outline-none"
        />
      </label>
      <p className="mt-1 h-5 text-right text-[12.5px] text-gris-500" aria-live="polite">
        {sauvegarde === "en-cours" ? "Enregistrement…" : sauvegarde === "ok" ? "Enregistré ✓" : sauvegarde === "echec" ? "Non enregistré : pas de réseau" : ""}
      </p>
    </Carte>
  );
}

function BlocSimulations({ etat, racine, appeler, onEtat }: { etat: Etat; racine: string; appeler: <T>(chemin: string, init?: RequestInit) => Promise<T>; onEtat: (etat: Etat) => void }) {
  const [agrandie, setAgrandie] = useState<string | null>(null);
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [occupe, setOccupe] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function agir(id: string, geste: "choix" | "commentaire") {
    setOccupe(`${geste}-${id}`);
    setMessage(null);
    try {
      const { espace } = await appeler<{ espace: Etat }>(`/simulations/${id}/${geste}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentaire: commentaires[id] ?? "" }) });
      onEtat(espace);
      setCommentaires((c) => ({ ...c, [id]: "" }));
      setMessage(geste === "choix" ? "C'est noté, merci ! Je prépare votre devis sur cette base." : "Message envoyé à Lucas, merci !");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Réessayez dans un instant.");
    } finally {
      setOccupe(null);
    }
  }

  const choisie = etat.simulations.some((s) => s.choisie);
  return (
    <Carte titre={etat.simulations.length > 1 ? "Vos simulations" : "Votre simulation"}>
      <p className="text-[15px] leading-relaxed text-gris-700">{choisie ? "Vous avez fait votre choix. Vous pouvez encore changer d'avis." : etat.simulations.length > 1 ? "Comparez-les, puis dites-moi laquelle vous plaît." : "Voici ce que donnerait votre pièce. Dites-moi ce que vous en pensez."}</p>
      {message ? <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-[14.5px] text-emerald-800" role="status">{message}</p> : null}
      <ul className="mt-4 space-y-5">
        {etat.simulations.map((simulation) => (
          <li key={simulation.id} className={`overflow-hidden rounded-2xl border ${simulation.choisie ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-gris-200"}`}>
            <button type="button" onClick={() => setAgrandie(simulation.id)} className="block w-full bg-gris-100" aria-label="Agrandir la simulation">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${racine}/simulations/${simulation.id}`} alt={simulation.titre ?? "Simulation de votre pièce"} loading="lazy" referrerPolicy="no-referrer" className="w-full" />
            </button>
            <div className="p-4">
              {simulation.titre ? <p className="font-display text-[17px] font-semibold">{simulation.titre}</p> : null}
              {simulation.description ? <p className="mt-0.5 text-[14.5px] text-gris-600">{simulation.description}</p> : null}
              {simulation.commentaire ? <p className="mt-2 rounded-xl bg-gris-100 px-3 py-2 text-[14px] text-gris-700">Votre message : « {simulation.commentaire} »</p> : null}
              <textarea
                rows={2}
                maxLength={1000}
                value={commentaires[simulation.id] ?? ""}
                onChange={(evenement) => setCommentaires((c) => ({ ...c, [simulation.id]: evenement.target.value }))}
                placeholder="Un commentaire ? (plus clair, autre teinte…)"
                className="mt-3 w-full rounded-2xl border border-gris-300 bg-white px-4 py-3 text-[16px] placeholder:text-gris-400 focus:border-noir focus:outline-none"
              />
              <div className="mt-2 flex gap-2">
                <button type="button" disabled={occupe !== null} onClick={() => void agir(simulation.id, "choix")} className={`h-13 flex-1 rounded-2xl px-4 py-3.5 text-[15.5px] font-semibold disabled:opacity-60 ${simulation.choisie ? "bg-emerald-600 text-white" : "bg-rouge text-white active:bg-rouge-hover"}`}>
                  {occupe === `choix-${simulation.id}` ? "Un instant…" : simulation.choisie ? "✓ Mon choix" : "Je choisis celle-ci"}
                </button>
                {(commentaires[simulation.id] ?? "").trim() ? (
                  <button type="button" disabled={occupe !== null} onClick={() => void agir(simulation.id, "commentaire")} className="rounded-2xl border border-gris-300 px-4 text-[14.5px] font-medium text-gris-700 disabled:opacity-60">
                    Envoyer
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {agrandie ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2" role="dialog" aria-modal="true" onClick={() => setAgrandie(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${racine}/simulations/${agrandie}`} alt="Simulation agrandie" referrerPolicy="no-referrer" className="max-h-full max-w-full rounded-lg" />
          <button type="button" className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 h-11 rounded-full bg-white/15 px-4 text-[14px] font-medium text-white">Fermer</button>
        </div>
      ) : null}
    </Carte>
  );
}

function BlocDevis({ etat, racine, appeler, onEtat }: { etat: Etat; racine: string; appeler: <T>(chemin: string, init?: RequestInit) => Promise<T>; onEtat: (etat: Etat) => void }) {
  const devis = etat.devis!;
  const [coordonnees, setCoordonnees] = useState({ nom: etat.coordonnees.nom, adresse: etat.coordonnees.adresse, codePostal: etat.coordonnees.codePostal, ville: etat.coordonnees.ville, email: etat.coordonnees.email ?? "" });
  const [nom, setNom] = useState(etat.coordonnees.nom);
  const [accepte, setAccepte] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [probleme, setProbleme] = useState<string | null>(null);
  const [copie, setCopie] = useState<string | null>(null);

  async function donnerAccord() {
    setOccupe(true);
    setProbleme(null);
    try {
      if (!etat.coordonnees.completes) await appeler("/coordonnees", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(coordonnees) });
      const { espace } = await appeler<{ espace: Etat }>("/accord", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: devis.id, nom: nom.trim(), accepte }) });
      onEtat(espace);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setProbleme(e instanceof Error ? e.message : "Réessayez dans un instant.");
    } finally {
      setOccupe(false);
    }
  }

  async function copier(libelle: string, valeur: string) {
    try {
      await navigator.clipboard.writeText(valeur.replace(/\s/g, ""));
      setCopie(libelle);
      window.setTimeout(() => setCopie(null), 2000);
    } catch {
      setCopie(null);
    }
  }

  const champ = "h-13 w-full rounded-2xl border border-gris-300 bg-white px-4 py-3.5 text-[16px] placeholder:text-gris-400 focus:border-noir focus:outline-none";

  if (devis.accepte) {
    return (
      <section className="rounded-3xl bg-emerald-600 p-5 text-white shadow-sm">
        <h2 className="font-display text-[22px] leading-tight font-semibold">Merci {etat.prenom || ""}, c&apos;est signé !</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-emerald-50">
          Votre accord sur le devis {devis.numero} ({euros(devis.total)}) est enregistré depuis le {new Date(devis.accepte.le).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}. Je vous appelle pour fixer la date du chantier.
        </p>
        <a href={`${racine}/devis/${devis.id}`} target="_blank" rel="noopener noreferrer" className="mt-4 flex h-12 items-center justify-center rounded-2xl bg-white/15 text-[15px] font-medium">
          Revoir mon devis (PDF)
        </a>
        {devis.acompte > 0 && etat.virement ? (
          <div className="mt-4 rounded-2xl bg-white p-4 text-noir">
            <p className="text-[15px] font-semibold">Acompte de {euros(devis.acompte)} {devis.acomptePct ? `(${devis.acomptePct} %)` : ""}</p>
            <p className="mt-1 text-[13.5px] text-gris-600">Par virement, quand vous voulez — il réserve votre créneau.</p>
            {(
              [
                ["Titulaire", etat.virement.titulaire],
                ["IBAN", etat.virement.iban],
                ["BIC", etat.virement.bic],
                ["Référence", etat.virement.reference],
              ] as const
            ).map(([libelle, valeur]) => (
              <button key={libelle} type="button" onClick={() => void copier(libelle, valeur)} className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl bg-gris-100 px-3.5 py-3 text-left active:bg-gris-200">
                <span className="min-w-0">
                  <span className="block text-[12px] text-gris-600">{libelle}</span>
                  <span className="block truncate text-[14.5px] font-medium tabular-nums">{valeur}</span>
                </span>
                <span className="shrink-0 text-[12.5px] font-medium text-rouge">{copie === libelle ? "Copié ✓" : "Copier"}</span>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-2 ring-rouge/70">
      <p className="text-[12.5px] font-semibold tracking-wide text-rouge uppercase">Votre devis est prêt</p>
      <h2 className="mt-1 font-display text-[21px] leading-tight font-semibold">{devis.objet}</h2>
      <p className="mt-3 font-display text-[34px] leading-none font-semibold tabular-nums">{euros(devis.total)}</p>
      <p className="mt-1.5 text-[13.5px] text-gris-600">
        Devis {devis.numero} · fourni et posé{devis.acompte > 0 ? ` · acompte de ${euros(devis.acompte)} à la commande` : ""}
      </p>
      <a href={`${racine}/devis/${devis.id}`} target="_blank" rel="noopener noreferrer" className="mt-4 flex h-12 items-center justify-center rounded-2xl border border-gris-300 text-[15px] font-medium text-noir active:bg-gris-100">
        Lire le devis (PDF)
      </a>

      {!etat.coordonnees.completes ? (
        <div className="mt-5 space-y-2.5">
          <p className="text-[14.5px] font-medium">Adresse du chantier</p>
          <input className={champ} placeholder="Nom et prénom" autoComplete="name" value={coordonnees.nom} onChange={(e) => { setCoordonnees({ ...coordonnees, nom: e.target.value }); setNom(e.target.value); }} />
          <input className={champ} placeholder="Adresse" autoComplete="street-address" value={coordonnees.adresse} onChange={(e) => setCoordonnees({ ...coordonnees, adresse: e.target.value })} />
          <div className="grid grid-cols-[7.5rem_1fr] gap-2.5">
            <input className={champ} placeholder="Code postal" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={coordonnees.codePostal} onChange={(e) => setCoordonnees({ ...coordonnees, codePostal: e.target.value.replace(/\D/g, "") })} />
            <input className={champ} placeholder="Ville" autoComplete="address-level2" value={coordonnees.ville} onChange={(e) => setCoordonnees({ ...coordonnees, ville: e.target.value })} />
          </div>
          <input className={champ} type="email" placeholder="E-mail (pour recevoir le devis signé)" autoComplete="email" value={coordonnees.email} onChange={(e) => setCoordonnees({ ...coordonnees, email: e.target.value })} />
        </div>
      ) : (
        <label className="mt-5 block">
          <span className="mb-1.5 block text-[14.5px] font-medium">Votre nom</span>
          <input className={champ} autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} />
        </label>
      )}

      <button type="button" aria-pressed={accepte} onClick={() => setAccepte(!accepte)} className="mt-4 flex w-full items-start gap-3 rounded-2xl bg-gris-100 p-3.5 text-left">
        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[14px] ${accepte ? "border-noir bg-noir text-white" : "border-gris-400 bg-white"}`}>{accepte ? "✓" : ""}</span>
        <span className="text-[14px] leading-snug text-gris-700">
          J&apos;ai lu le devis {devis.numero} d&apos;un montant de {euros(devis.total)} et je l&apos;accepte. Mon accord vaut signature.
        </span>
      </button>
      {probleme ? <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-[14px] text-red-800" role="alert">{probleme}</p> : null}
      <button type="button" disabled={!accepte || nom.trim().length < 2 || occupe} onClick={() => void donnerAccord()} className="mt-4 h-15 w-full rounded-2xl bg-rouge py-4 text-[17px] font-semibold text-white active:bg-rouge-hover disabled:bg-gris-300 disabled:text-gris-500">
        {occupe ? "Enregistrement…" : "Bon pour accord"}
      </button>
      <p className="mt-2 text-center text-[12.5px] text-gris-600">Aucun paiement maintenant. Une question ? Appelez-moi, bouton en bas de page.</p>
    </section>
  );
}

function LienInvalide({ erreur, onReessayer }: { erreur: ErreurEspace; onReessayer: () => void }) {
  const expire = erreur.raison === "expire" || erreur.raison === "revoque";
  const reseau = erreur.status === 0 || erreur.status >= 500 || erreur.status === 429;
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gris-100 px-6 text-center text-noir">
      <p className="font-display text-[15px] font-semibold">
        Cover<span className="text-rouge">Swap</span>
      </p>
      <h1 className="mt-6 font-display text-[24px] leading-tight font-semibold">{reseau ? "Impossible d'ouvrir votre espace" : expire ? "Ce lien n'est plus actif" : "Ce lien n'est pas valide"}</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-gris-600">
        {reseau ? erreur.message : expire ? "Pour votre sécurité, les liens ont une durée de vie limitée. Demandez-m'en un nouveau : je vous l'envoie par SMS dans la minute." : "Vérifiez que vous avez ouvert le lien en entier, tel que reçu par SMS. Sinon, appelez-moi : je vous en envoie un nouveau."}
      </p>
      {reseau ? (
        <button type="button" onClick={onReessayer} className="mt-6 h-14 w-full max-w-xs rounded-2xl bg-noir text-[16px] font-semibold text-white">
          Réessayer
        </button>
      ) : null}
      <a href="tel:+33670352869" className={`flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl text-[16px] font-semibold ${reseau ? "mt-3 border border-gris-300 text-noir" : "mt-6 bg-noir text-white"}`}>
        <IconeTelephone /> Appeler Lucas · 06 70 35 28 69
      </a>
    </div>
  );
}

const IconeTelephone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconeAppareil = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);
