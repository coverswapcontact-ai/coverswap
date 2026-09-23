"use client";

import { useEffect, useState } from "react";
import { dateCourte, ErreurEspace, euros, MESSAGE_APERCU, type Client, type Compte, type Etat, type IdFamille, type MessageClient, type ProjetCarte, type Reponse } from "./api";
import { CatalogueTeintes, vignette } from "./CatalogueTeintes";
import { AvantApres } from "./AvantApres";
import { DessinFamille, IconeCoeur, IconeDevis, IconePlus, IconeTelephone } from "./Illustrations";
import { Annonce, BoutonPrincipal, BoutonSecondaire, Carte, EnteteEtape, Surtitre, cx, FOCUS } from "./ui";

/**
 * L'espace du client AU-DESSUS de ses projets (mission 5) : la confirmation du
 * téléphone après 90 jours sans visite, l'accueil « Mes projets », le nouveau
 * projet, ses documents de tous les projets, le catalogue et ses favoris, le
 * contact ; et la consultation d'un projet terminé (ou non réalisé), qui se
 * relit sans se modifier. Une chose par écran, en grand.
 */

const TONS_PASTILLE: Record<ProjetCarte["pastille"], string> = {
  A_VOUS: "bg-[#FDECEC] text-[#9E1A1A]",
  COVERSWAP: "bg-[#EEF0F7] text-[#2F3D6B]",
  EN_COURS: "bg-[#FFF4DB] text-[#6B4A00]",
  TERMINE: "bg-[#E7F3EC] text-[#17563A]",
  NON_REALISE: "bg-[#F1EFEA] text-[#5F5A53]",
};

/* ── Confirmation du téléphone ─────────────────────────────────────── */

export function EcranConfirmation({ compte, client, onReponse }: { compte: Compte; client: Client; onReponse: (r: Reponse) => void }) {
  const [chiffres, setChiffres] = useState("");
  const [message, setMessage] = useState<{ ton: "erreur" | "info"; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [bloque, setBloque] = useState(false);

  async function confirmer() {
    if (!/^\d{4}$/.test(chiffres)) return setMessage({ ton: "erreur", texte: "Tapez les 4 derniers chiffres de votre numéro de téléphone." });
    setOccupe(true);
    setMessage(null);
    try {
      onReponse(await client.envoyerJson<Reponse>("/confirmation", "POST", { chiffres }));
    } catch (e) {
      const erreur = e instanceof ErreurEspace ? e : null;
      if (erreur?.raison === "bloque") setBloque(true);
      setMessage({ ton: "erreur", texte: erreur?.message ?? "Réessayez dans un instant." });
      setChiffres("");
    } finally {
      setOccupe(false);
    }
  }

  return (
    <section aria-labelledby="titre-confirmation" className="space-y-6 py-6">
      <div>
        <p className="text-[17px] text-[#5F5A53]">{compte.prenom ? `Bonjour ${compte.prenom},` : "Bonjour,"}</p>
        <h1 id="titre-confirmation" className="mt-1.5 font-display text-[29px] leading-[1.13] font-semibold tracking-tight text-balance text-[#1A1A1A]">
          Pour votre sécurité, confirmez que c&apos;est bien vous.
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[#4F4A44]">Vous n&apos;êtes pas venu depuis un moment. Tapez les <strong>4 derniers chiffres</strong> du numéro de téléphone que vous nous avez donné.</p>
      </div>
      <label className="block">
        <span className="sr-only">Les 4 derniers chiffres de votre téléphone</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={4}
          value={chiffres}
          disabled={bloque}
          onChange={(e) => setChiffres(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onKeyDown={(e) => e.key === "Enter" && void confirmer()}
          placeholder="• • • •"
          className="min-h-[64px] w-full rounded-2xl border-2 border-[#D3CFC8] bg-white text-center font-display text-[32px] tracking-[0.5em] text-[#1A1A1A] placeholder:text-[#BDB8B0] focus:border-[#1A1A1A] focus:outline-none disabled:opacity-50"
        />
      </label>
      {message ? <Annonce ton={message.ton}>{message.texte}</Annonce> : null}
      {client.apercu ? <Annonce>{MESSAGE_APERCU}</Annonce> : null}
      <BoutonPrincipal onClick={() => void confirmer()} disabled={occupe || bloque || chiffres.length !== 4}>
        {occupe ? "Vérification…" : "Ouvrir mon espace"}
      </BoutonPrincipal>
      <a href={`tel:${compte.marque.telephoneLien}`} className={cx("flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-[#D3CFC8] bg-white text-[16px] font-medium text-[#1A1A1A]", FOCUS)}>
        <IconeTelephone /> Un souci&nbsp;? Appeler CoverSwap
      </a>
      <p className="px-1 text-center text-[14px] leading-relaxed text-[#6B665F]">Vos factures et vos paiements ne s&apos;affichent qu&apos;une fois cette vérification faite.</p>
    </section>
  );
}

/* ── Mes projets ───────────────────────────────────────────────────── */

function CarteProjet({ projet, onOuvrir }: { projet: ProjetCarte; onOuvrir: () => void }) {
  const famille = (projet.familles[0]?.id ?? "") as IdFamille | "";
  return (
    <li>
      <button type="button" onClick={onOuvrir} className={cx("flex w-full items-center gap-3 rounded-[22px] border border-[#E6E3DD] bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(26,26,26,0.04)] active:bg-[#F6F5F2]", FOCUS)}>
        <DessinFamille famille={famille} className="h-16 w-20 shrink-0 rounded-xl bg-[#F7F6F3] p-1" />
        <span className="min-w-0 flex-1">
          <span className="block line-clamp-2 text-[18px] leading-snug font-semibold text-[#1A1A1A]">{projet.nom}</span>
          {/* Ses familles, quand son nom ne les dit pas déjà (« La salle de bain du haut » : oui ; « Cuisine et mobilier » : non). */}
          {projet.familles.length && !projet.familles.every((f) => projet.nom.toLowerCase().includes(f.libelle.toLowerCase())) ? <span className="block truncate text-[14.5px] text-[#5F5A53]">{projet.familles.map((f) => f.libelle).join(", ")}</span> : null}
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cx("rounded-full px-2.5 py-0.5 text-[13.5px] font-semibold", TONS_PASTILLE[projet.pastille])}>{projet.libellePastille}</span>
            {projet.prochaine ? <span className="text-[14.5px] text-[#3F3B36]">{projet.prochaine}</span> : null}
          </span>
        </span>
        <span aria-hidden className="text-[22px] text-[#8A857E]">›</span>
      </button>
    </li>
  );
}

export function MesProjets({ compte, onOuvrir, onNouveau, onCatalogue, onDocuments, onContact }: { compte: Compte; onOuvrir: (code: string) => void; onNouveau: () => void; onCatalogue: () => void; onDocuments: () => void; onContact: () => void }) {
  const enCours = compte.projets.filter((p) => !p.fige);
  const passes = compte.projets.filter((p) => p.fige);
  return (
    <div className="space-y-6 pt-2">
      <div>
        <p className="text-[17px] text-[#5F5A53]">{compte.prenom ? `Bonjour ${compte.prenom},` : "Bonjour,"}</p>
        <h1 className="mt-1 font-display text-[29px] leading-[1.12] font-semibold tracking-tight text-[#1A1A1A]">Mes projets</h1>
      </div>

      {enCours.length ? (
        <ul className="space-y-2.5" aria-label="Projets en cours">
          {enCours.map((p) => (
            <CarteProjet key={p.code} projet={p} onOuvrir={() => onOuvrir(p.code)} />
          ))}
        </ul>
      ) : (
        <Carte>
          <p className="text-[16.5px] leading-relaxed text-[#3F3B36]">Aucun projet en cours. Une autre pièce, un meuble à rafraîchir&nbsp;? Ouvrez un nouveau projet&nbsp;: CoverSwap vous rappelle.</p>
        </Carte>
      )}

      <BoutonPrincipal onClick={onNouveau}>
        <IconePlus /> Nouveau projet
      </BoutonPrincipal>

      {passes.length ? (
        <section aria-labelledby="titre-passes" className="space-y-2.5">
          <h2 id="titre-passes" className="px-1">
            <Surtitre>Projets passés</Surtitre>
          </h2>
          <ul className="space-y-2.5">
            {passes.map((p) => (
              <CarteProjet key={p.code} projet={p} onOuvrir={() => onOuvrir(p.code)} />
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-label="Votre espace" className="grid grid-cols-3 gap-2">
        {[
          { libelle: "Catalogue", aide: "Toutes les teintes", onClick: onCatalogue, icone: <IconeCoeur taille={22} /> },
          { libelle: "Documents", aide: compte.documents.length ? `${compte.documents.length} document${compte.documents.length > 1 ? "s" : ""}` : "Devis, factures", onClick: onDocuments, icone: <IconeDevis taille={22} /> },
          { libelle: "Contact", aide: compte.reponsesNonVues ? `${compte.reponsesNonVues} réponse${compte.reponsesNonVues > 1 ? "s" : ""} à lire` : "Appeler, écrire", onClick: onContact, icone: <IconeTelephone taille={22} /> },
        ].map((e) => (
          <button key={e.libelle} type="button" onClick={e.onClick} className={cx("flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#E6E3DD] bg-white px-2 text-center active:bg-[#F6F5F2]", FOCUS)}>
            <span className="text-[#CC0000]" aria-hidden>
              {e.icone}
            </span>
            <span className="text-[16px] font-semibold text-[#1A1A1A]">{e.libelle}</span>
            <span className="text-[13px] leading-tight text-[#5F5A53]">{e.aide}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ── Nouveau projet ────────────────────────────────────────────────── */

export function NouveauProjet({ compte, client, onReponse, onAnnuler }: { compte: Compte; client: Client; onReponse: (r: Reponse) => void; onAnnuler: () => void }) {
  const [nom, setNom] = useState("");
  const [familles, setFamilles] = useState<IdFamille[]>([]);
  const [message, setMessage] = useState<{ ton: "erreur" | "info" | "succes"; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const place = compte.nouveauProjet;

  async function demander() {
    setOccupe(true);
    try {
      onReponse(await client.envoyerJson<Reponse>("/projets/demande", "POST", {}));
      setMessage({ ton: "succes", texte: "Demande envoyée : CoverSwap vous rappelle très vite." });
    } catch (e) {
      setMessage({ ton: "erreur", texte: e instanceof Error ? e.message : "Réessayez dans un instant." });
    } finally {
      setOccupe(false);
    }
  }

  async function creer() {
    if (client.apercu) return setMessage({ ton: "info", texte: MESSAGE_APERCU });
    if (familles.length === 0) return setMessage({ ton: "erreur", texte: "Touchez ce que vous voulez rénover." });
    const nomFinal = nom.trim() || compte.prestations.familles.filter((f) => familles.includes(f.id)).map((f) => f.libelle).join(", ");
    setOccupe(true);
    setMessage(null);
    try {
      onReponse(await client.envoyerJson<Reponse>("/projets", "POST", { nom: nomFinal, familles }));
    } catch (e) {
      setMessage({ ton: "erreur", texte: e instanceof Error ? e.message : "Réessayez dans un instant." });
    } finally {
      setOccupe(false);
    }
  }

  // Deux projets en cours : le suivant se demande à CoverSwap (un geste), il ne se crée pas.
  if (!place.possible) {
    return (
      <div className="space-y-5">
        <EnteteEtape titre="Nouveau projet" phrase={`Vous avez déjà ${place.enCours} projets en cours. Pour en ouvrir un de plus, demandez-le à CoverSwap : c'est rapide.`} />
        {place.demandeLe || message?.ton === "succes" ? (
          <Annonce ton="succes">Demande envoyée{place.demandeLe ? ` le ${dateCourte(place.demandeLe)}` : ""}&nbsp;: CoverSwap vous rappelle très vite.</Annonce>
        ) : (
          <BoutonPrincipal onClick={() => void demander()} disabled={occupe || Boolean(client.apercu)}>
            {occupe ? "Envoi…" : "Demander à CoverSwap"}
          </BoutonPrincipal>
        )}
        {message && message.ton !== "succes" ? <Annonce ton={message.ton === "erreur" ? "erreur" : "info"}>{message.texte}</Annonce> : null}
        <a href={`tel:${compte.marque.telephoneLien}`} className={cx("flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-[#D3CFC8] bg-white text-[16px] font-medium text-[#1A1A1A]", FOCUS)}>
          <IconeTelephone /> Ou appeler CoverSwap
        </a>
        <BoutonSecondaire onClick={onAnnuler}>Retour à mes projets</BoutonSecondaire>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EnteteEtape titre="Nouveau projet" phrase="Deux gestes : ce que vous voulez rénover, et un nom pour vous y retrouver." />
      <section aria-labelledby="titre-nouveau-familles" className="space-y-2.5">
        <h2 id="titre-nouveau-familles" className="px-1 text-[18px] font-semibold text-[#1A1A1A]">
          Ce que vous voulez rénover
        </h2>
        <ul className="grid grid-cols-2 gap-2.5">
          {compte.prestations.familles.map((f) => {
            const coche = familles.includes(f.id);
            return (
              <li key={f.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={coche}
                  onClick={() => {
                    setMessage(null);
                    setFamilles((l) => (l.includes(f.id) ? l.filter((x) => x !== f.id) : [...l, f.id]));
                  }}
                  className={cx("relative flex w-full flex-col items-start gap-2 rounded-2xl border-2 bg-white p-3 text-left", coche ? "border-[#1A1A1A] bg-[#FAF9F7]" : "border-[#E2DFD9] active:bg-[#F6F5F2]", FOCUS)}
                >
                  <DessinFamille famille={f.id} className="w-full rounded-lg bg-[#F7F6F3] p-1" />
                  <span className="text-[17px] leading-snug font-semibold text-[#1A1A1A]">{f.libelle}</span>
                  <span aria-hidden className={cx("absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[13px] font-bold", coche ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#BDB8B0] bg-white")}>
                    {coche ? "✓" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <label className="block space-y-2">
        <span className="block px-1 text-[18px] font-semibold text-[#1A1A1A]">Son nom</span>
        <span className="block px-1 text-[15px] text-[#5F5A53]">Facultatif. Par exemple&nbsp;: «&nbsp;La salle de bain du haut&nbsp;», «&nbsp;Le dressing de la chambre&nbsp;».</span>
        <input value={nom} maxLength={60} onChange={(e) => setNom(e.target.value)} placeholder="Le nom de votre projet" className="min-h-[56px] w-full rounded-2xl border border-[#D3CFC8] bg-white px-4 text-[17px] text-[#1A1A1A] placeholder:text-[#8A857E] focus:border-[#1A1A1A] focus:outline-none" />
      </label>
      {message ? <Annonce ton={message.ton === "erreur" ? "erreur" : message.ton === "succes" ? "succes" : "info"}>{message.texte}</Annonce> : null}
      <BoutonPrincipal onClick={() => void creer()} disabled={occupe}>
        {occupe ? "Un instant…" : "Créer mon projet"}
      </BoutonPrincipal>
      <BoutonSecondaire onClick={onAnnuler}>Annuler</BoutonSecondaire>
      <p className="px-1 text-center text-[14px] leading-relaxed text-[#6B665F]">Ensuite&nbsp;: vos photos, puis votre projet. CoverSwap est prévenu et vous rappelle.</p>
    </div>
  );
}

/* ── Mes documents ─────────────────────────────────────────────────── */

const TYPES: Record<string, string> = { DEVIS: "Devis", FACTURE: "Facture", AVOIR: "Avoir" };

export function MesDocuments({ compte, client }: { compte: Compte; client: Client }) {
  return (
    <div className="space-y-5">
      <EnteteEtape titre="Mes documents" phrase={compte.documents.length ? "Tous vos devis et factures, tous projets confondus. Touchez pour ouvrir." : "Vos devis et factures s'afficheront ici."} />
      {compte.documents.length ? (
        <ul className="space-y-2.5">
          {compte.documents.map((d) => {
            const contenu = (
              <>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1EFEA] text-[#1A1A1A]" aria-hidden>
                  <IconeDevis taille={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] leading-snug font-semibold text-[#1A1A1A]">
                    {TYPES[d.type] ?? d.type} {d.numero}
                  </span>
                  <span className="block truncate text-[14.5px] text-[#5F5A53]">
                    {d.projet} · {dateCourte(d.le)}
                  </span>
                  <span className="mt-1 block text-[15px] text-[#3F3B36]">
                    <strong className="font-semibold tabular-nums">{euros(d.montant)}</strong> · {d.statut}
                  </span>
                </span>
              </>
            );
            return (
              <li key={d.id}>
                {d.pdf ? (
                  <a href={client.url(`/${d.pdf}`)} target="_blank" rel="noopener noreferrer" className={cx("flex items-center gap-3 rounded-[22px] border border-[#E6E3DD] bg-white p-3.5 active:bg-[#F6F5F2]", FOCUS)}>
                    {contenu}
                    <span className="text-[14px] font-semibold text-[#CC0000]">Ouvrir</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 rounded-[22px] border border-[#E6E3DD] bg-white p-3.5">
                    {contenu}
                    <span className="max-w-[88px] text-right text-[13px] leading-tight text-[#6B665F]">PDF sur demande</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      {compte.documents.some((d) => !d.pdf) ? <p className="px-1 text-[14px] leading-relaxed text-[#6B665F]">Un document établi avant votre espace n&apos;a pas de PDF ici&nbsp;: demandez-le à CoverSwap, nous vous l&apos;envoyons.</p> : null}
    </div>
  );
}

/* ── Contact ───────────────────────────────────────────────────────── */

export function Contact({ compte, client }: { compte: Compte; client: Client }) {
  const [texte, setTexte] = useState("");
  const [etat, setEtat] = useState<{ ton: "erreur" | "succes" | "info"; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [envoyes, setEnvoyes] = useState<MessageClient[]>([]);
  const messages = [...(compte.messages ?? []), ...envoyes];

  // Il ouvre Contact : les réponses de CoverSwap sont vues (jamais en aperçu).
  useEffect(() => {
    if (client.apercu || !compte.reponsesNonVues) return;
    void client.envoyerJson("/messages/vus", "POST", {}).catch(() => undefined);
  }, [client, compte.reponsesNonVues]);

  async function envoyer() {
    if (client.apercu) return setEtat({ ton: "info", texte: MESSAGE_APERCU });
    if (texte.trim().length < 2) return setEtat({ ton: "erreur", texte: "Écrivez votre message." });
    setOccupe(true);
    try {
      await client.envoyerJson("/message", "POST", { texte });
      setEnvoyes((liste) => [...liste, { id: `local-${Date.now()}`, le: new Date().toISOString(), auteur: "CLIENT", texte: texte.trim(), projet: null, vue: true }]);
      setTexte("");
      setEtat({ ton: "succes", texte: "Message envoyé : CoverSwap vous répond vite, ici, par téléphone ou par e-mail." });
    } catch (e) {
      setEtat({ ton: "erreur", texte: e instanceof ErreurEspace && e.status === 0 ? "Pas de réseau : votre message n'est pas parti. Réessayez dans un moment." : e instanceof Error ? e.message : "Réessayez dans un instant." });
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className="space-y-5">
      <EnteteEtape titre="Contact" phrase="Une question, un changement, une date ? CoverSwap vous répond." />
      <a href={`tel:${compte.marque.telephoneLien}`} className={cx("flex min-h-[64px] items-center justify-center gap-2.5 rounded-2xl bg-[#CC0000] px-5 text-[18px] font-semibold text-white active:bg-[#A80000]", FOCUS)}>
        <IconeTelephone taille={20} /> Appeler · {compte.marque.telephone}
      </a>
      {messages.length ? (
        <section aria-labelledby="titre-echanges" className="space-y-2">
          <h2 id="titre-echanges" className="px-1">
            <Surtitre>Vos échanges</Surtitre>
          </h2>
          <ol className="space-y-2">
            {messages.map((m) => (
              <li key={m.id} className={cx("max-w-[92%] rounded-[20px] px-4 py-3", m.auteur === "COVERSWAP" ? "mr-auto border border-[#E6E3DD] bg-white" : "ml-auto bg-[#F1EFEA]")}>
                <p className="text-[13px] text-[#6B665F]">
                  {m.auteur === "COVERSWAP" ? "CoverSwap" : "Vous"} · {dateCourte(m.le)}
                  {m.projet ? ` · ${m.projet}` : ""}
                  {m.auteur === "COVERSWAP" && !m.vue ? <span className="ml-1.5 rounded-full bg-[#FDECEC] px-2 py-0.5 text-[12px] font-semibold text-[#9E1A1A]">Nouveau</span> : null}
                </p>
                <p className="mt-1 whitespace-pre-line text-[16.5px] leading-relaxed text-[#1A1A1A]">{m.texte}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <Carte className="space-y-3">
        <label htmlFor="message-coverswap" className="block">
          <span className="block text-[18px] font-semibold text-[#1A1A1A]">Écrire à CoverSwap</span>
          <span className="block text-[15px] text-[#5F5A53]">Votre message arrive directement dans votre dossier.</span>
        </label>
        <textarea id="message-coverswap" rows={5} maxLength={2000} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Votre message…" className="w-full rounded-2xl border border-[#D3CFC8] bg-white px-4 py-3 text-[17px] leading-relaxed text-[#1A1A1A] placeholder:text-[#8A857E] focus:border-[#1A1A1A] focus:outline-none" />
        {etat ? <Annonce ton={etat.ton === "erreur" ? "erreur" : etat.ton === "succes" ? "succes" : "info"}>{etat.texte}</Annonce> : null}
        <BoutonPrincipal onClick={() => void envoyer()} disabled={occupe}>
          {occupe ? "Envoi…" : "Envoyer mon message"}
        </BoutonPrincipal>
      </Carte>
      {compte.marque.email ? (
        <p className="px-1 text-center text-[15px] text-[#5F5A53]">
          Par e-mail&nbsp;:{" "}
          <a href={`mailto:${compte.marque.email}`} className="font-semibold text-[#1A1A1A] underline decoration-[#BDB8B0] underline-offset-2">
            {compte.marque.email}
          </a>
        </p>
      ) : null}
    </div>
  );
}

/* ── Le catalogue et ses favoris ───────────────────────────────────── */

export function CataloguePage({ compte, client, favoris, onFavori }: { compte: Compte; client: Client; favoris: string[]; onFavori: (ref: string) => void }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="space-y-5">
      <EnteteEtape titre="Le catalogue" phrase="Toutes les teintes Cover Styl'. Touchez le cœur pour garder celles qui vous plaisent : elles vous suivent dans tous vos projets." />
      <BoutonPrincipal onClick={() => setOuvert(true)}>Parcourir les teintes</BoutonPrincipal>
      <Carte>
        <Surtitre>Mes favoris</Surtitre>
        {favoris.length ? (
          <ul className="mt-3 grid grid-cols-4 gap-2">
            {favoris.map((ref) => (
              <li key={ref}>
                {/* eslint-disable-next-line @next/next/no-img-element -- vignette servie par le CRM */}
                <img src={vignette(client, ref)} alt={`Teinte ${ref}`} className="aspect-square w-full rounded-lg object-cover ring-1 ring-black/10" loading="lazy" referrerPolicy="no-referrer" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[15.5px] leading-relaxed text-[#5F5A53]">Pas encore de favori. Ouvrez le catalogue et touchez le cœur d&apos;une teinte.</p>
        )}
      </Carte>
      <CatalogueTeintes ouvert={ouvert} onFermer={() => setOuvert(false)} zone="" consultation choisie={null} favoris={favoris} onFavori={onFavori} client={client} onChoisir={() => setOuvert(false)} />
      <span className="sr-only">{compte.prenom}</span>
    </div>
  );
}

/* ── Un projet terminé (ou non réalisé) : il se consulte ───────────── */

export function ProjetConsultation({ etat, client }: { etat: Etat; client: Client }) {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const termine = etat.fige === "TERMINE";
  const validee = etat.simulations.filter((s) => s.choisie);
  const autres = etat.simulations.filter((s) => !s.choisie);
  const simulationOuverte = etat.simulations.find((s) => s.id === ouverte) ?? null;
  return (
    <div className="space-y-5">
      <EnteteEtape
        titre={etat.nomProjet ?? etat.projet}
        phrase={termine ? "Projet terminé. Merci de votre confiance ! Tout y est gardé : vos photos, vos simulations, vos documents." : "Ce projet n'a pas été réalisé. Il reste ici, à consulter."}
        avant={<span className={cx("inline-block rounded-full px-3 py-1 text-[14px] font-semibold", termine ? "bg-[#E7F3EC] text-[#17563A]" : "bg-[#F1EFEA] text-[#5F5A53]")}>{termine ? "Terminé" : "Non réalisé"}</span>}
      />
      {etat.apres?.photos.length ? (
        <Carte>
          <Surtitre ton="vert">Le résultat</Surtitre>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {etat.apres.photos.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-2xl bg-[#ECEAE5]">
                {/* eslint-disable-next-line @next/next/no-img-element -- photo privée servie par le CRM */}
                <img src={client.url(`/photos/${p.id}`)} alt="Après le chantier" className="aspect-square w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
              </li>
            ))}
          </ul>
        </Carte>
      ) : null}
      {validee.length ? (
        <Carte className="space-y-3">
          <Surtitre>La simulation validée</Surtitre>
          {validee.map((s) => (
            <button key={s.id} type="button" onClick={() => setOuverte(s.id)} className={cx("block w-full overflow-hidden rounded-2xl", FOCUS)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- image servie par le CRM */}
              <img src={client.url(`/simulations/${s.id}`)} alt={s.titre ?? "Simulation validée"} className="aspect-[4/3] w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
            </button>
          ))}
        </Carte>
      ) : null}
      {autres.length ? (
        <Carte>
          <Surtitre>Ses simulations</Surtitre>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {autres.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => setOuverte(s.id)} className={cx("block w-full overflow-hidden rounded-xl", FOCUS)}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- image servie par le CRM */}
                  <img src={client.url(`/simulations/${s.id}`)} alt={s.titre ?? "Simulation"} className="aspect-square w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                </button>
              </li>
            ))}
          </ul>
        </Carte>
      ) : null}
      {etat.photos.length ? (
        <Carte>
          <Surtitre>Vos photos avant</Surtitre>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {etat.photos.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-xl bg-[#ECEAE5]">
                {/* eslint-disable-next-line @next/next/no-img-element -- photo privée servie par le CRM */}
                <img src={client.url(`/photos/${p.id}`)} alt="Avant" className="aspect-square w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
              </li>
            ))}
          </ul>
        </Carte>
      ) : null}
      {etat.devis ? (
        <Carte className="space-y-1.5">
          <Surtitre>Le devis</Surtitre>
          <p className="text-[17px] font-semibold text-[#1A1A1A]">
            Devis {etat.devis.numero} · <span className="tabular-nums">{euros(etat.devis.total)}</span>
          </p>
          {etat.devis.accepte ? <p className="text-[15px] text-[#1F6B45]">Signé le {dateCourte(etat.devis.accepte.le)}</p> : null}
          {etat.devis.pdf ? (
            <a href={client.url(`/${etat.devis.pdf}`)} target="_blank" rel="noopener noreferrer" className="inline-block pt-1 text-[15.5px] font-semibold text-[#CC0000] underline underline-offset-4">
              Ouvrir le devis (PDF)
            </a>
          ) : null}
          <p className="pt-1 text-[14px] text-[#6B665F]">Vos factures sont dans «&nbsp;Mes documents&nbsp;».</p>
        </Carte>
      ) : null}
      {etat.apres?.avis ? (
        <Carte>
          <Surtitre>Votre avis</Surtitre>
          <p className="mt-2 text-[22px] text-[#CC0000]" aria-label={`${etat.apres.avis.note} sur 5`}>
            {"★".repeat(etat.apres.avis.note)}
            <span className="text-[#D3CFC8]">{"★".repeat(5 - etat.apres.avis.note)}</span>
          </p>
          {etat.apres.avis.texte ? <p className="mt-1 text-[16px] leading-relaxed whitespace-pre-wrap text-[#1A1A1A]">« {etat.apres.avis.texte} »</p> : null}
        </Carte>
      ) : null}
      {simulationOuverte ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#111]" role="dialog" aria-modal="true" aria-label={simulationOuverte.titre ?? "Simulation"}>
          <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
            <span className="truncate text-[16px] font-semibold text-white">{simulationOuverte.titre ?? "Simulation"}</span>
            <button type="button" onClick={() => setOuverte(null)} className={cx("min-h-[44px] rounded-full bg-white/15 px-4 text-[15px] font-semibold text-white", FOCUS)}>
              Fermer
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center px-2">
            {simulationOuverte.avant ? (
              <AvantApres avant={client.url(`/simulations/${simulationOuverte.id}/avant`)} apres={client.url(`/simulations/${simulationOuverte.id}`)} alt={simulationOuverte.titre ?? "Simulation"} className="w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- image servie par le CRM
              <img src={client.url(`/simulations/${simulationOuverte.id}`)} alt="" className="max-h-full w-full object-contain" referrerPolicy="no-referrer" />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
