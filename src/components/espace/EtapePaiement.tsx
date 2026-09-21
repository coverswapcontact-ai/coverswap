"use client";

import { useState } from "react";
import { dateLongue, euros, type Client, type Etat } from "./api";
import { IconeCoche } from "./Illustrations";
import { Annonce, BoutonPrincipal, BoutonSecondaire, Carte, EnteteEtape, Surtitre, cx, useCopie } from "./ui";

/**
 * Onglet Paiement : ce qui est dû, quand, et comment. Aujourd'hui l'acompte
 * (virement, IBAN à copier en un geste, référence) et le solde à la fin du
 * chantier ; l'onglet accueillera ensuite le règlement du solde et le paiement
 * en plusieurs fois. La carte bancaire a sa place, prête : elle s'affiche le
 * jour où elle est activée côté CRM. Puis ce qui va se passer.
 */
export function EtapePaiement({ etat, client, onApres }: { etat: Etat; client: Client; onApres?: () => void }) {
  const [copie, copier, echecCopie] = useCopie();
  const [carte, setCarte] = useState<string | null>(null);
  const acompte = etat.acompte;
  const date = etat.chantier?.date ?? null;
  const solde = etat.devis ? Math.max(0, etat.devis.total - (acompte?.montant ?? etat.devis.acompte ?? 0)) : null;

  return (
    <div className="space-y-5">
      <EnteteEtape
        titre="Paiement"
        phrase={acompte && !acompte.complet ? `Merci${etat.prenom ? ` ${etat.prenom}` : ""}, c'est signé\u00a0! Il reste l'acompte, qui réserve votre date.` : "Tout est en ordre de votre côté. Voici la suite."}
      />

      {acompte || solde ? (
        <Carte className="p-0">
          <h2 className="px-5 pt-4 pb-1 text-[13px] font-semibold tracking-[0.08em] text-[#6B665F] uppercase">Vos paiements</h2>
          <ul className="divide-y divide-[#EEEBE6]">
            {acompte ? (
              <li className="flex items-center justify-between gap-3 px-5 py-3.5">
                <span>
                  <span className="block text-[16px] font-semibold text-[#1A1A1A]">Acompte</span>
                  <span className="block text-[14px] text-[#5F5A53]">{etat.devis?.acomptePct ? `${etat.devis.acomptePct}\u00a0% du devis, ` : ""}à la commande</span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-[19px] font-semibold text-[#1A1A1A] tabular-nums">{euros(acompte.montant)}</span>
                  <span className={cx("block text-[13.5px] font-semibold", acompte.complet ? "text-[#1F6B45]" : "text-[#B00000]")}>{acompte.complet ? "Reçu ✓" : acompte.recu > 0 ? `Reste ${euros(acompte.montant - acompte.recu)}` : "À régler"}</span>
                </span>
              </li>
            ) : null}
            {solde ? (
              <li className="flex items-center justify-between gap-3 px-5 py-3.5">
                <span>
                  <span className="block text-[16px] font-semibold text-[#1A1A1A]">Solde</span>
                  <span className="block text-[14px] text-[#5F5A53]">à la fin du chantier</span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-[19px] font-semibold text-[#1A1A1A] tabular-nums">{euros(solde)}</span>
                  <span className="block text-[13.5px] text-[#5F5A53]">Plus tard</span>
                </span>
              </li>
            ) : null}
          </ul>
        </Carte>
      ) : null}

      {acompte && !acompte.complet ? (
        <Carte className="space-y-4">
          <div>
            <Surtitre ton="rouge">Acompte à régler</Surtitre>
            <p className="mt-1 font-display text-[36px] leading-none font-semibold text-[#1A1A1A] tabular-nums">{euros(acompte.montant - acompte.recu)}</p>
            <p className="mt-1.5 text-[15px] text-[#4F4A44]">Par virement, quand vous voulez. Le solde se règle à la fin du chantier.</p>
          </div>
          {etat.virement ? (
            <>
              <BoutonPrincipal onClick={() => void copier("iban", etat.virement!.iban.replace(/\s/g, ""))}>{copie === "iban" ? "IBAN copié ✓" : "Copier l'IBAN"}</BoutonPrincipal>
              {echecCopie ? <Annonce ton="erreur">Votre téléphone n&apos;a pas voulu copier. Recopiez-le depuis la liste ci-dessous, ou appelez-nous.</Annonce> : null}
              <dl className="divide-y divide-[#EEEBE6] rounded-2xl border border-[#E6E3DD]">
                {(
                  [
                    ["Titulaire", etat.virement.titulaire, "titulaire"],
                    ["IBAN", etat.virement.iban, "iban"],
                    ["BIC", etat.virement.bic, "bic"],
                    ["Référence à indiquer", etat.virement.reference, "reference"],
                  ] as const
                ).map(([libelle, valeur, cle]) => (
                  <div key={cle} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <dt className="text-[13px] text-[#6B665F]">{libelle}</dt>
                      <dd className="text-[16px] font-medium text-[#1A1A1A] tabular-nums select-all">
                        {/* Un groupe de l'IBAN ne se coupe jamais en deux : la ligne passe entre les groupes. */}
                        {valeur.split(" ").map((groupe, i) => (
                          <span key={i} className="inline-block whitespace-nowrap">
                            {groupe}
                            &nbsp;
                          </span>
                        ))}
                      </dd>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copier(cle, cle === "iban" ? valeur.replace(/\s/g, "") : valeur)}
                      className={cx("min-h-[44px] shrink-0 rounded-xl px-3 text-[15px] font-semibold", copie === cle ? "text-[#1F6B45]" : echecCopie === cle ? "text-[#8F1D12]" : "text-[#B00000]")}
                    >
                      {copie === cle ? "Copié ✓" : echecCopie === cle ? "Impossible" : "Copier"}
                    </button>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <Annonce>Les coordonnées bancaires arrivent ici très vite. Une question d&apos;ici là&nbsp;: appelez-nous.</Annonce>
          )}
          {etat.paiementCarte ? (
            <div className="space-y-2">
              <BoutonSecondaire
                onClick={() =>
                  void client
                    .envoyerJson<{ url?: string }>("/paiement-carte", "POST", {})
                    .then((r) => (r.url ? window.location.assign(r.url) : setCarte("Le paiement par carte arrive bientôt\u00a0: utilisez le virement pour l'instant.")))
                    .catch((e: unknown) => setCarte(e instanceof Error && e.message ? e.message : "Le paiement par carte n'est pas encore ouvert\u00a0: utilisez le virement pour l'instant."))
                }
              >
                Payer l&apos;acompte par carte
              </BoutonSecondaire>
              {carte ? <Annonce>{carte}</Annonce> : null}
            </div>
          ) : null}
        </Carte>
      ) : acompte?.complet ? (
        <Annonce ton="succes">
          <strong className="font-semibold">Acompte bien reçu</strong> ({euros(acompte.recu)}), merci. Votre date est réservée.
        </Annonce>
      ) : null}

      <Carte>
        <Surtitre>Et ensuite&nbsp;?</Surtitre>
        <ol className="mt-3 space-y-4">
          {[
            { titre: date ? `Rendez-vous le ${dateLongue(date)}` : "CoverSwap vous appelle pour fixer la date", texte: date ? "C'est noté de notre côté. Une question d'ici là\u00a0: appelez-nous." : "Dans les jours qui viennent, pour choisir ensemble un jour qui vous arrange.", fait: Boolean(date) },
            { titre: "Avant notre passage", texte: "Videz les meubles que l'on recouvre et dégagez le plan de travail. Pas besoin de démonter quoi que ce soit\u00a0: nous nous en occupons.", fait: false },
            { titre: "Le jour J", texte: "Une cuisine se pose en général en une journée\u00a0; nous vous confirmons la durée en fixant la date. Pas de séchage, pas de gravats\u00a0: la pièce est utilisable le soir même.", fait: false },
            { titre: "Après", texte: "Un nettoyage courant suffit à l'entretien. Le solde se règle à la fin du chantier.", fait: false },
          ].map((etape, i) => (
            <li key={etape.titre} className="flex gap-3">
              <span className={cx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-[15px] font-semibold", etape.fait ? "bg-[#1F7A4D] text-white" : "bg-[#F1EFEA] text-[#1A1A1A]")}>{etape.fait ? <IconeCoche /> : i + 1}</span>
              <span>
                <span className="block text-[16.5px] font-semibold text-[#1A1A1A]">{etape.titre}</span>
                <span className="mt-0.5 block text-[15.5px] leading-relaxed text-[#4F4A44]">{etape.texte}</span>
              </span>
            </li>
          ))}
        </ol>
      </Carte>
      {onApres ? <BoutonPrincipal onClick={onApres}>Voir les photos du résultat</BoutonPrincipal> : null}
    </div>
  );
}

/** Après le chantier : les photos « après », et l'avis du client (publié seulement s'il l'accepte). */
export function ApresChantier({ etat, client, onEtat }: { etat: Etat; client: Client; onEtat: (etat: Etat) => void }) {
  const [note, setNote] = useState(0);
  const [texte, setTexte] = useState("");
  // Publier un avis demande un accord donné, pas une case cochée d'avance.
  const [publication, setPublication] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [probleme, setProbleme] = useState<string | null>(null);
  const avis = etat.apres?.avis ?? null;
  const photos = etat.apres?.photos ?? [];

  async function envoyer() {
    setOccupe(true);
    setProbleme(null);
    try {
      const { espace } = await client.envoyerJson<{ espace: Etat }>("/avis", "POST", { note, texte, publication });
      onEtat(espace);
    } catch (e) {
      setProbleme(e instanceof Error ? e.message : "Réessayez dans un instant.");
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className="space-y-5">
      <EnteteEtape titre={!etat.typeProjet || etat.typeProjet === "CUISINE" ? "Votre nouvelle cuisine" : "Le résultat"} phrase="Merci de nous avoir fait confiance. Voici les photos du résultat." />
      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {photos.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-2xl bg-[#ECEAE5]">
              {/* eslint-disable-next-line @next/next/no-img-element -- photo privée servie par le CRM */}
              <img src={client.url(`/photos/${p.id}`)} alt="Après le chantier" className="aspect-square w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
            </li>
          ))}
        </ul>
      ) : null}
      <Carte className="space-y-4">
        <Surtitre>Votre avis compte</Surtitre>
        {avis ? (
          <Annonce ton="succes">Merci pour votre avis ({avis.note}/5)&nbsp;!</Annonce>
        ) : (
          <>
            <div className="flex justify-between" role="radiogroup" aria-label="Votre note">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={note === n} aria-label={`${n} sur 5`} onClick={() => setNote(n)} className="flex h-14 w-14 items-center justify-center text-[38px] leading-none">
                  <span className={n <= note ? "text-[#CC0000]" : "text-[#D3CFC8]"}>★</span>
                </button>
              ))}
            </div>
            <textarea rows={4} maxLength={2000} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Ce que vous avez aimé, ce que nous pouvons améliorer…" className="w-full rounded-2xl border border-[#D3CFC8] px-4 py-3 text-[17px] focus:border-[#1A1A1A] focus:outline-none" aria-label="Votre avis" />
            <button type="button" role="checkbox" aria-checked={publication} aria-label="J'accepte que mon avis soit publié sur coverswap.fr, avec mon prénom et ma ville" onClick={() => setPublication(!publication)} className="flex w-full items-start gap-3 text-left">
              <span aria-hidden className={cx("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-[13px] font-bold", publication ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#8A857E]")}>
                {publication ? "✓" : ""}
              </span>
              <span className="text-[15px] leading-snug text-[#3F3B36]">J&apos;accepte que mon avis soit publié sur coverswap.fr, avec mon prénom et ma ville.</span>
            </button>
            {probleme ? <Annonce ton="erreur">{probleme}</Annonce> : null}
            <BoutonPrincipal disabled={note === 0 || occupe} onClick={() => void envoyer()}>
              {occupe ? "Envoi…" : "Envoyer mon avis"}
            </BoutonPrincipal>
          </>
        )}
      </Carte>
    </div>
  );
}
