"use client";

import { useRef, useState } from "react";
import { ErreurEspace, MESSAGE_APERCU, type Client, type Etat } from "./api";
import { IconeCoche, IconePersonne } from "./Illustrations";
import { Annonce, BoutonPrincipal, Carte, EnteteEtape, FOCUS, cx } from "./ui";

/**
 * « Vérifiez vos coordonnées » (mission 6) : prénom, nom, e-mail, téléphone
 * (les siens), l'adresse de CE projet (un client peut avoir plusieurs biens).
 * Tout est prérempli ; il complète ce qui manque, corrige ce qui est faux.
 * Jamais bloquant : photos, projet et simulations se font sans. Ce qu'il
 * enregistre va sur son devis et sa facture.
 */

type Adresse = { libelle: string; adresse: string; codePostal: string; ville: string };
type Coord = Etat["coordonnees"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const chiffres = (v: string) => v.replace(/\D/g, "");
const telephoneOk = (v: string) => !v.trim() || chiffres(v).length >= 9;

/** Ce qu'il reste à compléter, en mots (le CRM le dit ; repli pour un état d'avant). */
export function manqueCoordonnees(c: Coord): string[] {
  if (c.manque) return c.manque;
  return c.completes ? [] : ["l'adresse du chantier"];
}

/**
 * Dans la barre du projet, visible partout : orange « À compléter » tant qu'il
 * manque quelque chose, verte (coche) seulement quand tout est complet. Courte,
 * pour laisser la place au nom du projet sur un petit iPhone.
 */
export function PastilleCoordonnees({ etat, onOuvrir, actif }: { etat: Etat; onOuvrir: () => void; actif: boolean }) {
  const complet = etat.coordonnees.completes;
  return (
    <button
      type="button"
      onClick={onOuvrir}
      aria-current={actif ? "page" : undefined}
      aria-label={complet ? "Mes coordonnées : complètes" : "Mes coordonnées : à compléter"}
      title="Mes coordonnées"
      className={cx(
        "ml-auto flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[13.5px] font-semibold whitespace-nowrap",
        complet ? "border-[#BFDCCB] bg-[#E7F3EC] text-[#17563A]" : "border-[#F0C98A] bg-[#FFF4E0] text-[#8A4B00]",
        FOCUS
      )}
    >
      <IconePersonne taille={16} />
      {complet ? (
        <span aria-hidden className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1F7A4D] text-white">
          <IconeCoche taille={10} />
        </span>
      ) : (
        <>
          <span aria-hidden className="h-2 w-2 rounded-full bg-[#E08A00]" />
          À compléter
        </>
      )}
    </button>
  );
}

const CLE_RAPPEL = "coverswap:rappel-coordonnees";

/**
 * Rappel doux, aux moments clés (simulation validée, devis ouvert) : une
 * phrase et un bouton, qu'il peut écarter pour la visite. Rien s'il est complet.
 */
export function RappelCoordonnees({ etat, onOuvrir, moment }: { etat: Etat; onOuvrir: () => void; moment: "simulation" | "devis" }) {
  const [ecarte, setEcarte] = useState(() => {
    try {
      return window.sessionStorage.getItem(`${CLE_RAPPEL}:${etat.code ?? ""}:${moment}`) === "1";
    } catch {
      return false;
    }
  });
  if (etat.coordonnees.completes || ecarte) return null;
  const manque = manqueCoordonnees(etat.coordonnees);
  return (
    <div role="note" className="flex items-start gap-3 rounded-2xl border border-[#F0C98A] bg-[#FFF8EC] px-4 py-3">
      <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#E08A00]" />
      <div className="min-w-0 flex-1">
        <p className="text-[15.5px] leading-snug text-[#3F3B36]">
          {moment === "devis" ? "Pour que votre devis soit à votre nom et à la bonne adresse" : "Pour préparer votre devis à votre nom et à la bonne adresse"}, vérifiez vos coordonnées
          {manque.length ? ` (il manque ${manque.join(", ")})` : ""}.
        </p>
        <button type="button" onClick={onOuvrir} className={cx("mt-1.5 min-h-[40px] text-[15.5px] font-semibold text-[#1A1A1A] underline decoration-[#BDB8B0] underline-offset-4", FOCUS)}>
          Vérifier mes coordonnées
        </button>
      </div>
      <button
        type="button"
        aria-label="Plus tard"
        onClick={() => {
          setEcarte(true);
          try {
            window.sessionStorage.setItem(`${CLE_RAPPEL}:${etat.code ?? ""}:${moment}`, "1");
          } catch {
            // navigation privée : le rappel reviendra, sans gêner
          }
        }}
        className={cx("-mt-1 -mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[20px] text-[#8A857E] active:bg-[#F2EADB]", FOCUS)}
      >
        ×
      </button>
    </div>
  );
}

/** L'écran « Vos coordonnées », dans le projet. */
export function MesCoordonnees({ etat, client, onEtat, onRetour }: { etat: Etat; client: Client; onEtat: (etat: Etat) => void; onRetour: () => void }) {
  const c = etat.coordonnees;
  const [saisie, setSaisie] = useState({
    prenom: c.prenom ?? (c.nom.split(" ")[0] || ""),
    nomFamille: c.nomFamille ?? c.nom.split(" ").slice(1).join(" "),
    email: c.email ?? "",
    telephone: c.telephone ?? "",
    adresse: c.adresse,
    codePostal: c.codePostal,
    ville: c.ville,
  });
  const [suggestions, setSuggestions] = useState<Adresse[]>([]);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<{ ton: "succes" | "erreur"; texte: string } | null>(null);
  const recherche = useRef<number | null>(null);
  const [vu, setVu] = useState<Record<string, boolean>>({});

  const erreurs = {
    email: saisie.email.trim() && !EMAIL.test(saisie.email.trim()) ? "Cette adresse ne semble pas complète (exemple : prenom.nom@gmail.com)." : null,
    telephone: !telephoneOk(saisie.telephone) ? "Il manque des chiffres (exemple : 06 12 34 56 78)." : null,
    codePostal: saisie.codePostal && !/^\d{5}$/.test(saisie.codePostal) ? "Cinq chiffres." : null,
  };
  const valide = !erreurs.email && !erreurs.telephone && !erreurs.codePostal;
  const changement = (Object.keys(saisie) as (keyof typeof saisie)[]).some((k) => saisie[k].trim() !== ((k === "prenom" ? (c.prenom ?? "") : k === "nomFamille" ? (c.nomFamille ?? "") : k === "email" ? (c.email ?? "") : k === "telephone" ? (c.telephone ?? "") : c[k]) ?? "").trim());

  function chercherAdresse(texte: string) {
    setSaisie((s) => ({ ...s, adresse: texte }));
    if (recherche.current) window.clearTimeout(recherche.current);
    if (texte.trim().length < 5) return setSuggestions([]);
    recherche.current = window.setTimeout(() => {
      void client
        .appeler<{ adresses: Adresse[] }>(`/adresse?q=${encodeURIComponent(texte)}`)
        .then(({ adresses }) => setSuggestions(adresses.filter((a) => a.adresse)))
        .catch(() => setSuggestions([]));
    }, 250);
  }

  async function enregistrer() {
    if (client.apercu) return setMessage({ ton: "erreur", texte: MESSAGE_APERCU });
    setVu({ email: true, telephone: true, codePostal: true });
    if (!valide) return;
    setOccupe(true);
    setMessage(null);
    try {
      const r = await client.envoyerJson<{ espace?: Etat }>("/coordonnees", "PUT", {
        prenom: saisie.prenom.trim(),
        nomFamille: saisie.nomFamille.trim(),
        email: saisie.email.trim(),
        telephone: saisie.telephone.trim(),
        adresse: saisie.adresse.trim(),
        codePostal: saisie.codePostal.trim(),
        ville: saisie.ville.trim(),
      });
      if (r.espace) onEtat(r.espace);
      const complet = r.espace?.coordonnees.completes;
      setMessage({ ton: "succes", texte: complet ? "C'est enregistré : votre devis et votre facture reprendront ces coordonnées." : "C'est enregistré. Vous pourrez compléter le reste quand vous voulez." });
    } catch (e) {
      setMessage({ ton: "erreur", texte: e instanceof ErreurEspace && e.status === 0 ? "Pas de réseau : rien n'est perdu, réessayez dès son retour." : e instanceof Error ? e.message : "Réessayez dans un instant." });
    } finally {
      setOccupe(false);
    }
  }

  const champ = (erreur: string | null) =>
    cx("min-h-[54px] w-full rounded-2xl border bg-white px-4 text-[17px] text-[#1A1A1A] placeholder:text-[#8A857E] focus:outline-none", erreur ? "border-[#C0392B] focus:border-[#C0392B]" : "border-[#D3CFC8] focus:border-[#1A1A1A]");
  const etiquette = "mb-1.5 block text-[15px] font-semibold text-[#1A1A1A]";
  const manque = manqueCoordonnees(c);

  return (
    <div className="space-y-5">
      <EnteteEtape
        titre="Vos coordonnées"
        phrase={c.completes ? "Tout est complet. Elles figureront sur votre devis et votre facture." : `Vérifiez-les : elles figureront sur votre devis et votre facture.${manque.length ? ` Il manque ${manque.join(", ")}.` : ""} Rien ne presse : vous pouvez continuer votre projet sans.`}
      />

      <Carte className="space-y-4">
        <p className="text-[14.5px] font-semibold tracking-[0.02em] text-[#6B665F] uppercase">Vous</p>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="block min-w-0">
            <span className={etiquette}>Prénom</span>
            <input className={champ(null)} autoComplete="given-name" value={saisie.prenom} onChange={(e) => setSaisie({ ...saisie, prenom: e.target.value })} />
          </label>
          <label className="block min-w-0">
            <span className={etiquette}>Nom</span>
            <input className={champ(null)} autoComplete="family-name" value={saisie.nomFamille} onChange={(e) => setSaisie({ ...saisie, nomFamille: e.target.value })} />
          </label>
        </div>
        <label className="block">
          <span className={etiquette}>E-mail</span>
          <input className={champ(vu.email ? erreurs.email : null)} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="prenom.nom@gmail.com" value={saisie.email} onChange={(e) => setSaisie({ ...saisie, email: e.target.value })} onBlur={() => setVu({ ...vu, email: true })} aria-invalid={Boolean(vu.email && erreurs.email)} />
          {vu.email && erreurs.email ? <span className="mt-1 block px-1 text-[14px] text-[#A5281B]">{erreurs.email}</span> : null}
        </label>
        <label className="block">
          <span className={etiquette}>Téléphone</span>
          <input className={champ(vu.telephone ? erreurs.telephone : null)} type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" value={saisie.telephone} onChange={(e) => setSaisie({ ...saisie, telephone: e.target.value })} onBlur={() => setVu({ ...vu, telephone: true })} aria-invalid={Boolean(vu.telephone && erreurs.telephone)} />
          {vu.telephone && erreurs.telephone ? <span className="mt-1 block px-1 text-[14px] text-[#A5281B]">{erreurs.telephone}</span> : <span className="mt-1 block px-1 text-[14px] leading-snug text-[#5F5A53]">C&apos;est lui qui protège votre espace.</span>}
        </label>
      </Carte>

      <Carte className="space-y-4">
        <p className="text-[14.5px] font-semibold tracking-[0.02em] text-[#6B665F] uppercase">L&apos;adresse de ce projet</p>
        <div className="relative">
          <label className="block">
            <span className={etiquette}>Numéro et rue</span>
            <input className={champ(null)} autoComplete="street-address" placeholder="12 rue des Lilas" value={saisie.adresse} onChange={(e) => chercherAdresse(e.target.value)} aria-autocomplete="list" />
          </label>
          {suggestions.length > 0 ? (
            <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-2xl border border-[#D3CFC8] bg-white shadow-lg" role="listbox" aria-label="Adresses proposées">
              {suggestions.map((s) => (
                <li key={s.libelle}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      setSaisie((x) => ({ ...x, adresse: s.adresse, codePostal: s.codePostal, ville: s.ville }));
                      setSuggestions([]);
                    }}
                    className="block min-h-[52px] w-full px-4 py-2 text-left text-[16px] text-[#1A1A1A] active:bg-[#F2F0EC]"
                  >
                    {s.libelle}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="grid grid-cols-[7.5rem_1fr] gap-2.5">
          <label className="block min-w-0">
            <span className={etiquette}>Code postal</span>
            <input className={champ(vu.codePostal ? erreurs.codePostal : null)} inputMode="numeric" autoComplete="postal-code" maxLength={5} value={saisie.codePostal} onChange={(e) => setSaisie({ ...saisie, codePostal: chiffres(e.target.value) })} onBlur={() => setVu({ ...vu, codePostal: true })} />
          </label>
          <label className="block min-w-0">
            <span className={etiquette}>Ville</span>
            <input className={champ(null)} autoComplete="address-level2" value={saisie.ville} onChange={(e) => setSaisie({ ...saisie, ville: e.target.value })} />
          </label>
        </div>
        {vu.codePostal && erreurs.codePostal ? <p className="-mt-2 px-1 text-[14px] text-[#A5281B]">Code postal : {erreurs.codePostal.toLowerCase()}</p> : null}
      </Carte>

      {message ? <Annonce ton={message.ton}>{message.texte}</Annonce> : null}
      <BoutonPrincipal onClick={() => void enregistrer()} disabled={occupe || !changement}>
        {occupe ? "Enregistrement…" : "Enregistrer"}
      </BoutonPrincipal>
      <button type="button" onClick={onRetour} className={cx("mx-auto block min-h-[44px] px-2 text-[15.5px] font-medium text-[#4F4A44] underline decoration-[#BDB8B0] underline-offset-4", FOCUS)}>
        Revenir à mon projet
      </button>
    </div>
  );
}
