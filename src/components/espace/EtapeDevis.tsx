"use client";

import { useEffect, useRef, useState } from "react";
import { dateCourte, dateLongue, euros, type Client, type Etat } from "./api";
import { Signature, type SignatureRef } from "./Signature";
import { Annonce, BoutonPrincipal, Carte, EnteteEtape, Surtitre, cx } from "./ui";

/**
 * Étape 4 — le devis, lisible sur un téléphone : ce qui est inclus, le prix,
 * l'acompte, les conditions (celles du PDF, mot pour mot). L'adresse du
 * chantier et l'e-mail ne sont demandés qu'ici, s'ils manquent, avec la saisie
 * assistée de l'adresse. Puis le bon pour accord : une case, une signature au
 * doigt si le client le souhaite, un bouton.
 */

type Adresse = { libelle: string; adresse: string; codePostal: string; ville: string };

const UNITES: Record<string, string> = { ml: "m", jour: "jour", forfait: "forfait" };
const quantite = (q: number, unite: string) => (unite === "forfait" ? "Forfait" : `${String(Math.round(q * 100) / 100).replace(".", ",")} ${UNITES[unite] ?? unite}${unite === "jour" && q > 1 ? "s" : ""}`);

export function EtapeDevis({ etat, client, onEtat, onRetour, onSuite }: { etat: Etat; client: Client; onEtat: (etat: Etat) => void; onRetour: () => void; onSuite: () => void }) {
  const devis = etat.devis!;
  const apercu = Boolean(client.apercu);
  const [coord, setCoord] = useState({ nom: etat.coordonnees.nom || "", adresse: etat.coordonnees.adresse, codePostal: etat.coordonnees.codePostal, ville: etat.coordonnees.ville, email: etat.coordonnees.email ?? "" });
  const [nom, setNom] = useState(etat.coordonnees.nom || "");
  const [accepte, setAccepte] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [probleme, setProbleme] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Adresse[]>([]);
  const signature = useRef<SignatureRef>(null);
  const recherche = useRef<number | null>(null);
  const aCompleter = !etat.coordonnees.completes;

  // Il a ouvert son devis : compté une fois par visite (Lucas sait qu'il le lit, et combien de fois).
  useEffect(() => {
    if (!apercu) void client.envoyerJson(`/devis/${devis.id}/consultation`, "POST", {}).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devis.id]);

  function chercherAdresse(saisie: string) {
    setCoord((c) => ({ ...c, adresse: saisie }));
    if (recherche.current) window.clearTimeout(recherche.current);
    if (saisie.trim().length < 5) return setSuggestions([]);
    recherche.current = window.setTimeout(() => {
      void client
        .appeler<{ adresses: Adresse[] }>(`/adresse?q=${encodeURIComponent(saisie)}`)
        .then(({ adresses }) => setSuggestions(adresses.filter((a) => a.adresse)))
        .catch(() => setSuggestions([]));
    }, 250);
  }

  async function donnerAccord() {
    setOccupe(true);
    setProbleme(null);
    try {
      if (aCompleter) await client.envoyerJson("/coordonnees", "PUT", { ...coord, nom: nom.trim() || coord.nom });
      const { espace } = await client.envoyerJson<{ espace: Etat }>("/accord", "POST", { documentId: devis.id, nom: nom.trim(), accepte, signature: signature.current?.image() ?? undefined });
      onEtat(espace);
      window.scrollTo({ top: 0, behavior: "smooth" });
      onSuite();
    } catch (e) {
      setProbleme(e instanceof Error ? e.message : "Réessayez dans un instant.");
    } finally {
      setOccupe(false);
    }
  }

  const champ = "min-h-[54px] w-full rounded-2xl border border-[#D3CFC8] bg-white px-4 text-[17px] text-[#1A1A1A] placeholder:text-[#8A857E] focus:border-[#1A1A1A] focus:outline-none";
  // L'e-mail est demandé, jamais exigé : sans lui, le devis signé reste ici. S'il est écrit, il doit être lisible.
  const emailOk = !coord.email.trim() || /.+@.+\..+/.test(coord.email.trim());
  const coordonneesOk = !aCompleter || (coord.adresse.trim().length >= 3 && /^\d{5}$/.test(coord.codePostal) && coord.ville.trim() && emailOk);
  const pret = accepte && nom.trim().length >= 2 && coordonneesOk && !apercu;
  // Ce qui manque encore, dit en clair sous le bouton : un bouton grisé sans explication bloque.
  const manques = [
    nom.trim().length < 2 ? "indiquer votre nom" : null,
    aCompleter && coord.adresse.trim().length < 3 ? "indiquer le numéro et la rue du chantier" : null,
    aCompleter && !/^\d{5}$/.test(coord.codePostal) ? "indiquer le code postal" : null,
    aCompleter && !coord.ville.trim() ? "indiquer la ville" : null,
    aCompleter && !emailOk ? "corriger votre e-mail (ou le laisser vide)" : null,
    !accepte ? "cocher la case «\u00a0J'accepte\u00a0»" : null,
  ].filter((m): m is string => m !== null);
  const resteAFaire = manques.length > 1 ? `${manques.slice(0, -1).join(", ")} et ${manques[manques.length - 1]}` : manques[0];

  return (
    <div className="space-y-5">
      <EnteteEtape titre="Votre devis" phrase={devis.accepte ? `Accepté le ${dateCourte(devis.accepte.le)}. Merci\u00a0!` : "Tout est là, lisible ici. Prenez votre temps\u00a0: une question, appelez-moi."} onRetour={onRetour} />

      <Carte className="space-y-4">
        <div>
          <Surtitre>Devis n° {devis.numero}</Surtitre>
          <h2 className="mt-1 font-display text-[22px] leading-tight font-semibold text-[#1A1A1A]">{devis.objet}</h2>
          <p className="mt-1 text-[14.5px] text-[#5F5A53]">
            Émis le {dateCourte(devis.emisLe)} · valable jusqu&apos;au {dateCourte(devis.valableJusquau)}
          </p>
        </div>
        <ul className="divide-y divide-[#EEEBE6] border-y border-[#EEEBE6]">
          {devis.lignes.map((ligne, i) =>
            ligne.type === "SECTION" ? (
              <li key={i} className="pt-3 pb-1.5 text-[13px] font-semibold tracking-[0.06em] text-[#6B665F] uppercase">
                {ligne.libelle}
              </li>
            ) : (
              <li key={i} className="flex items-start justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block text-[16px] leading-snug font-semibold text-[#1A1A1A]">{ligne.designation}</span>
                  {ligne.detail ? <span className="mt-0.5 block text-[14.5px] leading-snug text-[#5F5A53]">{ligne.detail}</span> : null}
                  <span className="mt-1 block text-[14px] text-[#6B665F] tabular-nums">
                    {quantite(ligne.quantite, ligne.unite)}
                    {ligne.unite !== "forfait" ? ` × ${euros(ligne.prixUnitaire)}` : ""}
                  </span>
                </span>
                <span className="shrink-0 font-display text-[17px] font-semibold text-[#1A1A1A] tabular-nums">{euros(ligne.total)}</span>
              </li>
            )
          )}
        </ul>
        <div className="flex items-end justify-between gap-3">
          <span className="text-[16px] font-semibold text-[#1A1A1A]">Total, fourni et posé</span>
          <span className="font-display text-[34px] leading-none font-semibold text-[#1A1A1A] tabular-nums">{euros(devis.total)}</span>
        </div>
        <p className="text-right text-[13px] text-[#6B665F]">{devis.mentionTva}</p>
        {devis.acompte > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-[#F6F5F2] p-3">
              <span className="block text-[13.5px] text-[#5F5A53]">À la commande</span>
              <span className="block font-display text-[20px] font-semibold text-[#1A1A1A] tabular-nums">{euros(devis.acompte)}</span>
              <span className="block text-[13px] text-[#5F5A53]">acompte {devis.acomptePct ? `de ${devis.acomptePct}\u00a0%` : ""}</span>
            </div>
            <div className="rounded-2xl bg-[#F6F5F2] p-3">
              <span className="block text-[13.5px] text-[#5F5A53]">À la fin du chantier</span>
              <span className="block font-display text-[20px] font-semibold text-[#1A1A1A] tabular-nums">{euros(devis.solde)}</span>
              <span className="block text-[13px] text-[#5F5A53]">le solde</span>
            </div>
          </div>
        ) : null}
        <ul className="space-y-1.5 text-[14.5px] leading-snug text-[#3F3B36]">
          {devis.conditions.map((c) => (
            <li key={c} className="flex gap-2">
              <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-[#CC0000]" />
              {c}
            </li>
          ))}
        </ul>
        <a href={client.url(`/${devis.pdf}`)} target="_blank" rel="noopener noreferrer" className="flex min-h-[52px] items-center justify-center rounded-2xl border border-[#D3CFC8] text-[16px] font-medium text-[#1A1A1A] active:bg-[#F2F0EC]">
          Voir le devis en PDF
        </a>
      </Carte>

      {devis.accepte ? (
        <Carte className="border-[#1F7A4D] bg-[#F3FAF6]">
          <Surtitre ton="vert">Bon pour accord donné</Surtitre>
          <p className="mt-1.5 text-[16px] leading-relaxed text-[#17563A]">
            Par {devis.accepte.nom}, le {dateLongue(devis.accepte.le)}. {etat.acompte && !etat.acompte.complet ? "Dernière étape\u00a0: l'acompte." : ""}
          </p>
          <BoutonPrincipal className="mt-3" onClick={onSuite}>
            {etat.acompte && !etat.acompte.complet ? "Régler l'acompte" : "La suite"}
          </BoutonPrincipal>
        </Carte>
      ) : (
        <Carte className="space-y-4">
          <div>
            <Surtitre ton="rouge">Donner mon accord</Surtitre>
            <p className="mt-1 text-[15.5px] leading-relaxed text-[#3F3B36]">Aucun paiement maintenant. L&apos;acompte se règle ensuite, par virement.</p>
          </div>

          {aCompleter ? (
            <fieldset className="space-y-2.5">
              <legend className="text-[16px] font-semibold text-[#1A1A1A]">L&apos;adresse du chantier</legend>
              <input className={champ} placeholder="Nom et prénom" autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} aria-label="Nom et prénom" />
              <div className="relative">
                <input className={champ} placeholder="Numéro et rue" autoComplete="street-address" value={coord.adresse} onChange={(e) => chercherAdresse(e.target.value)} aria-label="Adresse" aria-autocomplete="list" />
                {suggestions.length > 0 ? (
                  <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-2xl border border-[#D3CFC8] bg-white shadow-lg" role="listbox">
                    {suggestions.map((s) => (
                      <li key={s.libelle}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={false}
                          onClick={() => {
                            setCoord((c) => ({ ...c, adresse: s.adresse, codePostal: s.codePostal, ville: s.ville }));
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
                <input className={champ} placeholder="Code postal" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={coord.codePostal} onChange={(e) => setCoord({ ...coord, codePostal: e.target.value.replace(/\D/g, "") })} aria-label="Code postal" />
                <input className={champ} placeholder="Ville" autoComplete="address-level2" value={coord.ville} onChange={(e) => setCoord({ ...coord, ville: e.target.value })} aria-label="Ville" />
              </div>
              <input className={champ} type="email" inputMode="email" placeholder="E-mail (facultatif)" autoComplete="email" value={coord.email} onChange={(e) => setCoord({ ...coord, email: e.target.value })} aria-label="E-mail, facultatif&nbsp;: pour recevoir une copie du devis signé" />
              <p className="-mt-1 px-1 text-[14px] leading-snug text-[#5F5A53]">Pour recevoir une copie du devis signé. Sans e-mail, il reste ici, dans votre espace.</p>
            </fieldset>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-[16px] font-semibold text-[#1A1A1A]">Votre nom</span>
              <input className={champ} autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} />
            </label>
          )}

          <button type="button" role="checkbox" aria-checked={accepte} aria-label={`J'accepte le devis n° ${devis.numero} d'un montant de ${euros(devis.total)}. Mon accord vaut signature.`} onClick={() => setAccepte(!accepte)} className={cx("flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left", accepte ? "border-[#1A1A1A] bg-[#FAF9F7]" : "border-[#E2DFD9]")}>
            <span aria-hidden className={cx("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-[16px] font-bold", accepte ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#8A857E] bg-white")}>
              {accepte ? "✓" : ""}
            </span>
            <span className="text-[16px] leading-snug text-[#1A1A1A]">
              J&apos;accepte le devis n° {devis.numero} d&apos;un montant de <strong className="font-semibold">{euros(devis.total)}</strong>. Mon accord vaut signature.
            </span>
          </button>

          <div>
            <p className="mb-2 text-[15px] text-[#3F3B36]">Votre signature (facultative)</p>
            <Signature ref={signature} />
          </div>

          {probleme ? <Annonce ton="erreur">{probleme}</Annonce> : null}
          <BoutonPrincipal disabled={!pret || occupe} onClick={() => void donnerAccord()}>
            {occupe ? "Enregistrement…" : "Bon pour accord"}
          </BoutonPrincipal>
          {!apercu && resteAFaire ? (
            <p className="text-center text-[15px] leading-snug font-medium text-[#8A2A00]" aria-live="polite">
              Pour valider, il reste à {resteAFaire}.
            </p>
          ) : null}
          <p className="text-center text-[13.5px] leading-relaxed text-[#6B665F]">La date, l&apos;heure et votre accord sont enregistrés comme preuve. Votre devis reste ici, à relire quand vous voulez.</p>
        </Carte>
      )}
    </div>
  );
}
