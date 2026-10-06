"use client";

import { useState } from "react";
import { dateCourte, dateLongue, euros, type Client, type Etat, type LignePaiement, type Paiement } from "./api";
import { IconeCoche } from "./Illustrations";
import { Annonce, BoutonPrincipal, BoutonSecondaire, Carte, EnteteEtape, Surtitre, cx, useCopie } from "./ui";

/**
 * Onglet Paiement : ce qui est dû, ce qui est payé, quand et comment — lu sur
 * les données RÉELLES du dossier (le devis signé, repris ou non, et les
 * encaissements saisis par CoverSwap). Le devis signé, sa date, son total ;
 * l'acompte : « payé le … par virement », ou « à régler » avec le RIB ; le
 * solde, dû à la fin des travaux, avec le RIB ; et « Réglé, merci » quand tout
 * est encaissé. Un paiement annulé côté CoverSwap (chèque rejeté) remet la
 * ligne « à régler » à la visite suivante. L'onglet accueillera plus tard le
 * paiement en plusieurs fois et la carte bancaire (prête : elle s'affiche le
 * jour où elle est activée côté CRM). Puis ce qui va se passer.
 */
const MOYENS: Record<string, string> = { VIREMENT: "virement", CHEQUE: "chèque", ESPECES: "espèces", CARTE: "carte bancaire", AUTRE: "" };

function etatLigne(ligne: LignePaiement, plusTard: string): { texte: string; ton: "vert" | "rouge" | "gris" } {
  if (ligne.statut === "PAYE") {
    const moyen = ligne.moyen ? MOYENS[ligne.moyen] : "";
    return { texte: `Payé${ligne.payeLe ? ` le ${dateCourte(ligne.payeLe)}` : ""}${moyen ? ` par ${moyen}` : ""} ✓`, ton: "vert" };
  }
  if (ligne.statut === "PARTIEL") return { texte: `${euros(ligne.recu)} reçus, reste ${euros(ligne.montant - ligne.recu)}`, ton: "rouge" };
  return plusTard ? { texte: plusTard, ton: "gris" } : { texte: "À régler", ton: "rouge" };
}

export function EtapePaiement({ etat, client, onApres }: { etat: Etat; client: Client; onApres?: () => void }) {
  const [copie, copier, echecCopie] = useCopie();
  const [carte, setCarte] = useState<string | null>(null);
  const date = etat.chantier?.date ?? null;
  // Un CRM pas encore à jour ne donne que l'acompte : on en déduit le reste, sans date ni moyen.
  const p: Paiement | null =
    etat.paiement ??
    (etat.devis
      ? (() => {
          const total = etat.devis.total;
          const du = etat.acompte?.montant ?? etat.devis.acompte ?? 0;
          const recu = etat.acompte?.recu ?? 0;
          const ligne = (montant: number, r: number): LignePaiement => ({ montant, recu: Math.max(0, Math.min(montant, r)), statut: montant > 0 && r >= montant - 0.5 ? "PAYE" : r > 0 ? "PARTIEL" : "A_REGLER", payeLe: null, moyen: null });
          return { devisNumero: etat.devis.numero, signeLe: etat.devis.accepte?.le ?? null, total, recu, reste: Math.max(0, total - recu), acompte: du > 0 ? { ...ligne(du, recu), pct: etat.devis.acomptePct } : null, solde: ligne(total - du, recu - du), encaissements: [], regle: total > 0 && recu >= total - 0.5 };
        })()
      : null);
  const acompteDu = p?.acompte && p.acompte.statut !== "PAYE" ? p.acompte.montant - p.acompte.recu : 0;
  const chantierFait = ["TERMINE"].includes(etat.etape);
  // Ce qu'il y a à régler MAINTENANT : l'acompte d'abord ; le solde une fois le chantier terminé.
  const aRegler = p && !p.regle ? (acompteDu > 0 ? { quoi: "Acompte", montant: acompteDu, phrase: "Par virement, quand vous voulez. Il réserve votre date ; le solde se règle à la fin des travaux." } : chantierFait && p.solde.statut !== "PAYE" ? { quoi: "Solde", montant: p.solde.montant - p.solde.recu, phrase: "Le chantier est terminé : le solde se règle par virement, avec les coordonnées ci-dessous." } : null) : null;

  const rib = etat.virement ? (
    <>
      <dl className="divide-y divide-trait rounded-2xl border border-trait">
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
              <dt className="text-[13px] text-encre-2">{libelle}</dt>
              <dd className="text-[16px] font-medium text-encre tabular-nums select-all">
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
              className={cx("min-h-[44px] shrink-0 rounded-xl px-3 text-[15px] font-semibold", copie === cle ? "text-succes" : echecCopie === cle ? "text-alerte-texte" : "text-encre underline underline-offset-4")}
            >
              {copie === cle ? "Copié ✓" : echecCopie === cle ? "Impossible" : "Copier"}
            </button>
          </div>
        ))}
      </dl>
    </>
  ) : (
    <Annonce>Les coordonnées bancaires arrivent ici très vite. Une question d&apos;ici là&nbsp;: appelez-nous.</Annonce>
  );

  return (
    <div className="space-y-5">
      <EnteteEtape
        titre="Paiement"
        phrase={p?.regle ? "Tout est réglé. Merci de votre confiance\u00a0!" : acompteDu > 0 ? `Merci${etat.prenom ? ` ${etat.prenom}` : ""}, c'est signé\u00a0! Il reste l'acompte, qui réserve votre date.` : "Tout est en ordre de votre côté. Voici où vous en êtes."}
      />

      {p ? (
        <Carte className="p-0">
          <div className="px-5 pt-4 pb-3">
            <Surtitre>Devis n° {p.devisNumero}</Surtitre>
            <p className="mt-1 flex items-end justify-between gap-3">
              <span className="text-[15.5px] text-encre">{p.signeLe ? `Signé le ${dateLongue(p.signeLe)}` : "Signé"}</span>
              <span className="font-sans text-[26px] leading-none font-semibold text-encre tabular-nums">{euros(p.total)}</span>
            </p>
          </div>
          <ul className="divide-y divide-trait border-t border-trait">
            {p.acompte ? <LigneDePaiement titre="Acompte" aide={`${p.acompte.pct ? `${p.acompte.pct}\u00a0% du devis, ` : ""}à la commande`} ligne={p.acompte} etat={etatLigne(p.acompte, "")} /> : null}
            <LigneDePaiement titre={p.acompte ? "Solde" : "Montant"} aide="le reste du devis" ligne={p.solde} etat={etatLigne(p.solde, chantierFait ? "" : "Dû à la fin des travaux")} />
          </ul>
        </Carte>
      ) : null}

      {p?.regle ? (
        <Carte className="border-succes bg-succes-fond text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-succes text-blanc" aria-hidden>
            <IconeCoche taille={20} />
          </span>
          <p className="mt-3 font-display text-[24px] leading-tight font-semibold text-succes">Réglé, merci&nbsp;!</p>
          <p className="mt-1 text-[15.5px] text-succes">Nous avons bien reçu <span className="tabular-nums">{euros(p.recu)}</span>. Il ne reste rien à payer.</p>
        </Carte>
      ) : aRegler ? (
        <Carte className="space-y-4">
          <div>
            <Surtitre ton="fort">{aRegler.quoi} à régler</Surtitre>
            <p className="mt-1 font-sans text-[36px] leading-none font-semibold text-encre tabular-nums">{euros(aRegler.montant)}</p>
            <p className="mt-1.5 text-[15px] text-encre-2">{aRegler.phrase}</p>
          </div>
          {etat.virement ? <BoutonPrincipal onClick={() => void copier("iban", etat.virement!.iban.replace(/\s/g, ""))}>{copie === "iban" ? "IBAN copié ✓" : "Copier l'IBAN"}</BoutonPrincipal> : null}
          {echecCopie ? <Annonce ton="erreur">Votre téléphone n&apos;a pas voulu copier. Recopiez-le depuis la liste ci-dessous, ou appelez-nous.</Annonce> : null}
          {rib}
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
                Payer par carte
              </BoutonSecondaire>
              {carte ? <Annonce>{carte}</Annonce> : null}
            </div>
          ) : null}
        </Carte>
      ) : p ? (
        <>
          {p.acompte?.statut === "PAYE" ? (
            <Annonce ton="succes">
              <strong className="font-semibold">Acompte bien reçu</strong> (<span className="tabular-nums">{euros(p.acompte.montant)}</span>), merci. Votre date est réservée.
            </Annonce>
          ) : null}
          {p.solde.statut !== "PAYE" ? (
            <Carte className="space-y-3">
              <div>
                <Surtitre>Le solde, à la fin des travaux</Surtitre>
                <p className="mt-1 font-sans text-[28px] leading-none font-semibold text-encre tabular-nums">{euros(p.solde.montant - p.solde.recu)}</p>
                <p className="mt-1.5 text-[15px] text-encre-2">Rien à payer pour l&apos;instant. Le moment venu, par virement avec ces coordonnées&nbsp;:</p>
              </div>
              {rib}
            </Carte>
          ) : null}
        </>
      ) : null}

      <Carte>
        <Surtitre>Et ensuite&nbsp;?</Surtitre>
        <ol className="mt-3 space-y-4">
          {[
            { titre: date ? `Rendez-vous le ${dateLongue(date)}` : "CoverSwap vous appelle pour fixer la date", texte: date ? "C'est noté de notre côté. Une question d'ici là\u00a0: appelez-nous." : "Dans les jours qui viennent, pour choisir ensemble un jour qui vous arrange.", fait: Boolean(date) },
            { titre: "Avant notre passage", texte: "Videz les meubles que l'on recouvre et dégagez le plan de travail. Pas besoin de démonter quoi que ce soit\u00a0: nous nous en occupons.", fait: false },
            { titre: "Le jour J", texte: "Une cuisine ou une salle de bain se pose en général en une journée\u00a0; nous vous confirmons la durée en fixant la date. Pas de séchage, pas de gravats\u00a0: la pièce est utilisable le soir même.", fait: false },
            { titre: "Après", texte: "Un nettoyage courant suffit à l'entretien. Le solde se règle à la fin du chantier.", fait: false },
          ].map((etape, i) => (
            <li key={etape.titre} className="flex gap-3">
              <span className={cx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-[15px] font-semibold", etape.fait ? "bg-succes text-blanc" : "bg-fond-2 text-encre")}>{etape.fait ? <IconeCoche /> : i + 1}</span>
              <span>
                <span className="block text-[16.5px] font-semibold text-encre">{etape.titre}</span>
                <span className="mt-0.5 block text-[15.5px] leading-relaxed text-encre-2">{etape.texte}</span>
              </span>
            </li>
          ))}
        </ol>
      </Carte>
      {onApres ? <BoutonPrincipal onClick={onApres}>Voir les photos du résultat</BoutonPrincipal> : null}
    </div>
  );
}

function LigneDePaiement({ titre, aide, ligne, etat }: { titre: string; aide: string; ligne: LignePaiement; etat: { texte: string; ton: "vert" | "rouge" | "gris" } }) {
  // Deux lignes : le titre et le montant, puis l'état en toutes lettres (« Payé le 18 septembre par virement ») sur toute la largeur.
  return (
    <li className="px-5 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3">
          <span aria-hidden className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", ligne.statut === "PAYE" ? "bg-succes text-blanc" : "border-2 border-trait")}>
            {ligne.statut === "PAYE" ? <IconeCoche taille={12} /> : null}
          </span>
          <span className="text-[16.5px] font-semibold text-encre">{titre}</span>
        </span>
        <span className="shrink-0 font-sans text-[20px] font-semibold text-encre tabular-nums">{euros(ligne.montant)}</span>
      </div>
      <p className="mt-1 pl-10 text-[14.5px] leading-snug">
        <span className={cx("font-semibold tabular-nums", etat.ton === "vert" ? "text-succes" : etat.ton === "rouge" ? "text-alerte-texte" : "text-encre")}>{etat.texte}</span>
        <span className="text-encre-2"> · {aide}</span>
      </p>
    </li>
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
      <EnteteEtape titre={etat.familles?.length === 1 && etat.familles[0] === "CUISINE" ? "Votre nouvelle cuisine" : etat.familles?.length === 1 && etat.familles[0] === "SDB" ? "Votre nouvelle salle de bain" : "Le résultat"} phrase="Merci de nous avoir fait confiance. Voici les photos du résultat." />
      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {photos.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-2xl bg-fond-2">
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
                  <span className={n <= note ? "text-encre" : "text-trait"}>★</span>
                </button>
              ))}
            </div>
            <textarea rows={4} maxLength={2000} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Ce que vous avez aimé, ce que nous pouvons améliorer…" className="w-full rounded-2xl border border-trait px-4 py-3 text-[17px] focus:border-encre focus:outline-none" aria-label="Votre avis" />
            <button type="button" role="checkbox" aria-checked={publication} aria-label="J'accepte que mon avis soit publié sur coverswap.fr, avec mon prénom et ma ville" onClick={() => setPublication(!publication)} className="flex w-full items-start gap-3 text-left">
              <span aria-hidden className={cx("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-[13px] font-bold", publication ? "border-encre bg-encre text-blanc" : "border-encre-2")}>
                {publication ? "✓" : ""}
              </span>
              <span className="text-[15px] leading-snug text-encre">J&apos;accepte que mon avis soit publié sur coverswap.fr, avec mon prénom et ma ville.</span>
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
