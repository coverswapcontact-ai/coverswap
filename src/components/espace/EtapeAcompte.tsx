"use client";

import { useState } from "react";
import { dateLongue, euros, type Client, type Etat } from "./api";
import { IconeCoche } from "./Illustrations";
import { Annonce, BoutonPrincipal, BoutonSecondaire, Carte, EnteteEtape, Surtitre, cx, useCopie } from "./ui";

/**
 * Étape 5 — l'acompte et la suite. Le montant, le RIB avec l'IBAN à copier en
 * un geste, la référence à mettre dans le virement. Le paiement par carte a sa
 * place, prête : elle s'affiche le jour où Lucas l'active. Puis ce qui va se
 * passer : l'appel pour la date, ce qu'il faut préparer, la durée.
 */
export function EtapeAcompte({ etat, onRetour, client }: { etat: Etat; client: Client; onRetour: () => void }) {
  const [copie, copier] = useCopie();
  const [carte, setCarte] = useState<string | null>(null);
  const acompte = etat.acompte;
  const date = etat.chantier?.date ?? null;

  return (
    <div className="space-y-5">
      <EnteteEtape
        titre={etat.devis?.accepte ? `Merci${etat.prenom ? ` ${etat.prenom}` : ""}, c'est signé !` : "L'acompte et la suite"}
        phrase={acompte && !acompte.complet ? "Il ne reste qu'une chose à faire : l'acompte, qui réserve votre date." : "Tout est en ordre de votre côté. Voici la suite."}
        onRetour={onRetour}
      />

      {acompte ? (
        acompte.complet ? (
          <Annonce ton="succes">
            <strong className="font-semibold">Acompte bien reçu</strong> ({euros(acompte.recu)}), merci. Votre date est réservée.
          </Annonce>
        ) : (
          <Carte className="space-y-4">
            <div>
              <Surtitre ton="rouge">Acompte à régler</Surtitre>
              <p className="mt-1 font-display text-[36px] leading-none font-semibold text-[#1A1A1A] tabular-nums">{euros(acompte.montant - acompte.recu)}</p>
              <p className="mt-1.5 text-[15px] text-[#4F4A44]">
                {etat.devis?.acomptePct ? `${etat.devis.acomptePct} % du devis, ` : ""}par virement, quand vous voulez. Le solde se règle à la fin du chantier.
              </p>
            </div>
            {etat.virement ? (
              <>
                <BoutonPrincipal onClick={() => void copier("iban", etat.virement!.iban.replace(/\s/g, ""))}>{copie === "iban" ? "IBAN copié ✓" : "Copier l'IBAN"}</BoutonPrincipal>
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
                        <dd className="text-[16px] font-medium text-[#1A1A1A] tabular-nums">
                          {/* Un groupe de l'IBAN ne se coupe jamais en deux : la ligne passe entre les groupes. */}
                          {valeur.split(" ").map((groupe, i) => (
                            <span key={i} className="inline-block whitespace-nowrap">
                              {groupe}
                              &nbsp;
                            </span>
                          ))}
                        </dd>
                      </div>
                      <button type="button" onClick={() => void copier(cle, cle === "iban" ? valeur.replace(/\s/g, "") : valeur)} className={cx("min-h-[44px] shrink-0 rounded-xl px-3 text-[15px] font-semibold", copie === cle ? "text-[#1F6B45]" : "text-[#B00000]")}>
                        {copie === cle ? "Copié ✓" : "Copier"}
                      </button>
                    </div>
                  ))}
                </dl>
              </>
            ) : null}
            {etat.paiementCarte ? (
              <div className="space-y-2">
                <BoutonSecondaire
                  onClick={() =>
                    void client
                      .envoyerJson<{ url?: string }>("/paiement-carte", "POST", {})
                      .then((r) => (r.url ? window.location.assign(r.url) : setCarte("Le paiement par carte arrive bientôt : utilisez le virement pour l'instant.")))
                      .catch(() => setCarte("Le paiement par carte n'est pas encore ouvert : utilisez le virement pour l'instant."))
                  }
                >
                  Payer l&apos;acompte par carte
                </BoutonSecondaire>
                {carte ? <Annonce>{carte}</Annonce> : null}
              </div>
            ) : null}
          </Carte>
        )
      ) : null}

      <Carte>
        <Surtitre>Et ensuite ?</Surtitre>
        <ol className="mt-3 space-y-4">
          {[
            { titre: date ? `Rendez-vous le ${dateLongue(date)}` : "Je vous appelle pour fixer la date", texte: date ? "C'est noté de mon côté. Une question d'ici là : appelez-moi." : "Dans les jours qui viennent, pour choisir ensemble un jour qui vous arrange.", fait: Boolean(date) },
            { titre: "Avant mon passage", texte: "Videz les meubles que l'on recouvre et dégagez le plan de travail. Pas besoin de démonter quoi que ce soit : je m'en occupe.", fait: false },
            { titre: "Le jour J", texte: "Une cuisine se pose en général en une journée ; je vous confirme la durée en fixant la date. Pas de séchage, pas de gravats : la pièce est utilisable le soir même.", fait: false },
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
    </div>
  );
}

/** Après le chantier : les photos « après », et l'avis du client (publié seulement s'il l'accepte). */
export function ApresChantier({ etat, client, onEtat, onRetour }: { etat: Etat; client: Client; onEtat: (etat: Etat) => void; onRetour: () => void }) {
  const [note, setNote] = useState(0);
  const [texte, setTexte] = useState("");
  const [publication, setPublication] = useState(true);
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
      <EnteteEtape titre="Votre nouvelle cuisine" phrase="Merci de m'avoir fait confiance. Voici les photos du résultat." onRetour={onRetour} />
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
          <Annonce ton="succes">Merci pour votre avis ({avis.note}/5) !</Annonce>
        ) : (
          <>
            <div className="flex justify-between" role="radiogroup" aria-label="Votre note">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={note === n} aria-label={`${n} sur 5`} onClick={() => setNote(n)} className="flex h-14 w-14 items-center justify-center text-[38px] leading-none">
                  <span className={n <= note ? "text-[#CC0000]" : "text-[#D3CFC8]"}>★</span>
                </button>
              ))}
            </div>
            <textarea rows={4} maxLength={2000} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Ce que vous avez aimé, ce que je peux améliorer…" className="w-full rounded-2xl border border-[#D3CFC8] px-4 py-3 text-[17px] focus:border-[#1A1A1A] focus:outline-none" aria-label="Votre avis" />
            <button type="button" role="checkbox" aria-checked={publication} aria-label="J'accepte que mon avis soit publié sur coverswap.fr, avec mon prénom et ma ville" onClick={() => setPublication(!publication)} className="flex w-full items-start gap-3 text-left">
              <span aria-hidden className={cx("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-[13px] font-bold", publication ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#8A857E]")}>{publication ? "✓" : ""}</span>
              <span className="text-[15px] leading-snug text-[#3F3B36]">J&apos;accepte que mon avis soit publié sur coverswap.fr, avec mon prénom et ma ville.</span>
            </button>
            {probleme ? <Annonce ton="erreur">{probleme}</Annonce> : null}
            <BoutonPrincipal disabled={note === 0 || occupe || Boolean(client.apercu)} onClick={() => void envoyer()}>
              {occupe ? "Envoi…" : "Envoyer mon avis"}
            </BoutonPrincipal>
          </>
        )}
      </Carte>
    </div>
  );
}
