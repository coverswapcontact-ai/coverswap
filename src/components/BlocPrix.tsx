import { PRIX_PLAGE, UNITE_PRIX, euros } from "@/lib/offre-legere";
import { chargerTarifs, type IdFamilleTarifs, type SousPartieTarif, type TarifsSite, type UniteTarif } from "@/lib/tarifs-site";

/**
 * Les prix (site 3.0, lot B6 ; énoncé, § C.1 : « tels quels, jamais inventés ») : les tarifs publics du CRM
 * (`chargerTarifs`, relus au plus une fois par heure), famille par famille, chaque sous-partie à son prix et à son unité
 * — une sous-partie sans prix (`null`) n'est pas montrée, une famille sans aucun prix dit « Sur devis ». Si le CRM ne
 * répond pas : la plage au mètre linéaire d'`offre.ts` seule (relecture des lots B et C : les fourchettes par pièce
 * d'`offre.ts` contredisaient les tarifs du CRM — une fourchette chiffrée pour une salle de bain que le CRM met « Sur
 * devis » —, plus aucune page ne les affiche).
 * Aucun chiffre écrit ici. Montants en chiffres alignés (`tabular-nums`). Partagé : l'accueil (lot B6), puis les pages
 * de prestation et le blog (lots C). `ContenuPrix` est pur (testé) ; `BlocPrix` lit le CRM. Composants serveur.
 *
 * Lot C1 : `familles` restreint aux familles d'une page (la cuisine sur `/prestations/cuisine`) ; `sansIntro` quand la
 * page dit déjà comment on facture. `tarifDeLaFamille` : le même tarif en une ligne (les avant / après en ambiance de
 * `/realisations`).
 */
export const NOMS_FAMILLES_PRIX: Readonly<Record<IdFamilleTarifs, string>> = { CUISINE: "Cuisine", SDB: "Salle de bain", MEUBLES: "Meubles", PRO: "Professionnels" };

const SUFFIXES: Readonly<Record<UniteTarif, string>> = { ml: "/ml", jour: " par jour", forfait: " le forfait" };

/** Le prix et son unité : « … €/ml », « … € par jour », « … € le forfait » ; rien sans prix. */
export function prixAffiche(s: Pick<SousPartieTarif, "prixUnitaire" | "unite">): string | null {
  return s.prixUnitaire === null ? null : `${euros(s.prixUnitaire)}${SUFFIXES[s.unite] ?? ""}`;
}

/** Les familles du CRM (celles de `familles`, si la liste est donnée), chacune avec ses seules sous-parties qui ont un prix. */
export function lignesPrix(tarifs: TarifsSite, familles?: readonly IdFamilleTarifs[]): { id: IdFamilleTarifs; nom: string; lignes: { libelle: string; prix: string }[] }[] {
  return tarifs.familles.filter((f) => !familles || familles.includes(f.id)).map((f) => ({
    id: f.id,
    nom: NOMS_FAMILLES_PRIX[f.id] ?? f.id,
    lignes: f.sousParties.flatMap((s) => {
      const prix = prixAffiche(s);
      return prix ? [{ libelle: s.libelle, prix }] : [];
    }),
  }));
}

/**
 * Le tarif d'une famille en une ligne, lu au CRM : « <prix> €/ml » (un seul prix), « dès <prix> €/ml » (plusieurs : le
 * plus bas, à l'unité du premier prix publié) ; `null` quand le CRM n'en publie aucun (« Sur devis ») ; sans le CRM, la
 * plage au mètre linéaire. Jamais une fourchette par pièce écrite à la main.
 */
export function tarifDeLaFamille(tarifs: TarifsSite | null, famille: IdFamilleTarifs): string | null {
  if (!tarifs) return PRIX_PLAGE;
  const publies = (tarifs.familles.find((f) => f.id === famille)?.sousParties ?? []).filter((s): s is SousPartieTarif & { prixUnitaire: number } => s.prixUnitaire !== null);
  if (publies.length === 0) return null;
  const memeUnite = publies.filter((s) => s.unite === publies[0].unite);
  const plusBas = memeUnite.reduce((a, b) => (b.prixUnitaire < a.prixUnitaire ? b : a));
  const unSeul = publies.every((s) => s.unite === plusBas.unite && s.prixUnitaire === plusBas.prixUnitaire);
  return `${unSeul ? "" : "dès "}${prixAffiche(plusBas)}`;
}

/** Sans le CRM : ce qui remplace le détail par pièce (aucun chiffre). */
export const REPLI_PAR_PIECE = "Le détail par pièce se fait au devis, sur vos photos ou après une visite.";

const LIGNE = "flex items-baseline justify-between gap-4 border-t border-trait py-2.5 text-[15.5px]";
const MONTANT = "font-sans font-semibold whitespace-nowrap tabular-nums text-encre";

export function ContenuPrix({ tarifs, familles, sansIntro = false, className }: { tarifs: TarifsSite | null; familles?: readonly IdFamilleTarifs[]; sansIntro?: boolean; className?: string }) {
  return (
    <div className={className}>
      {sansIntro ? null : (
        <p className="texte-2 max-w-xl">
          Fourni et posé, au {UNITE_PRIX}. Le devis, gratuit, fixe le chiffre exact selon les découpes et l&apos;accès.
        </p>
      )}
      {tarifs ? (
        <div className={`${sansIntro ? "" : "mt-6 "}grid gap-x-10 gap-y-8${familles?.length === 1 ? "" : " sm:grid-cols-2"}`}>
          {lignesPrix(tarifs, familles).map((f) => (
            <div key={f.id}>
              <h3 className="font-display text-[22px] leading-tight font-semibold text-encre">{f.nom}</h3>
              {f.lignes.length > 0 ? (
                <dl className="mt-2">
                  {f.lignes.map((l) => (
                    <div key={l.libelle} className={LIGNE}>
                      <dt className="text-encre-2">{l.libelle}</dt>
                      <dd className={MONTANT}>{l.prix}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 border-t border-trait py-2.5 text-[15.5px] text-encre-2">Sur devis, après une visite ou sur vos photos.</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={`${sansIntro ? "" : "mt-6 "}max-w-xl`}>
          <dl>
            <div className={LIGNE}>
              <dt className="text-encre-2">Au mètre linéaire</dt>
              <dd className={MONTANT}>{PRIX_PLAGE}</dd>
            </div>
          </dl>
          <p className="border-t border-trait py-2.5 text-[15.5px] text-encre-2">{REPLI_PAR_PIECE}</p>
        </div>
      )}
    </div>
  );
}

export async function BlocPrix({ familles, sansIntro, className }: { familles?: readonly IdFamilleTarifs[]; sansIntro?: boolean; className?: string }) {
  return <ContenuPrix tarifs={await chargerTarifs()} familles={familles} sansIntro={sansIntro} className={className} />;
}
