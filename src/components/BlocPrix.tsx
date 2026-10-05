import { FOURCHETTES, PRIX_PLAGE, UNITE_PRIX, euros, fourchette } from "@/lib/offre-legere";
import { chargerTarifs, type IdFamilleTarifs, type SousPartieTarif, type TarifsSite, type UniteTarif } from "@/lib/tarifs-site";

/**
 * Les prix (site 3.0, lot B6 ; énoncé, § C.1 : « tels quels, jamais inventés ») : les tarifs publics du CRM
 * (`chargerTarifs`, relus au plus une fois par heure), famille par famille, chaque sous-partie à son prix et à son unité
 * — une sous-partie sans prix (`null`) n'est pas montrée, une famille sans aucun prix dit « Sur devis ». Si le CRM ne
 * répond pas, le repli documenté de `tarifs-site.ts` : la plage au mètre linéaire et les fourchettes d'`offre.ts`.
 * Aucun chiffre écrit ici. Montants en chiffres alignés (`tabular-nums`). Partagé : l'accueil (lot B6), puis les pages
 * de prestation et le blog (lots C). `ContenuPrix` est pur (testé) ; `BlocPrix` lit le CRM. Composants serveur.
 */
export const NOMS_FAMILLES_PRIX: Readonly<Record<IdFamilleTarifs, string>> = { CUISINE: "Cuisine", SDB: "Salle de bain", MEUBLES: "Meubles", PRO: "Professionnels" };

const SUFFIXES: Readonly<Record<UniteTarif, string>> = { ml: "/ml", jour: " par jour", forfait: " le forfait" };

/** Le prix et son unité : « … €/ml », « … € par jour », « … € le forfait » ; rien sans prix. */
export function prixAffiche(s: Pick<SousPartieTarif, "prixUnitaire" | "unite">): string | null {
  return s.prixUnitaire === null ? null : `${euros(s.prixUnitaire)}${SUFFIXES[s.unite] ?? ""}`;
}

/** Les familles du CRM, chacune avec ses seules sous-parties qui ont un prix. */
export function lignesPrix(tarifs: TarifsSite): { id: IdFamilleTarifs; nom: string; lignes: { libelle: string; prix: string }[] }[] {
  return tarifs.familles.map((f) => ({
    id: f.id,
    nom: NOMS_FAMILLES_PRIX[f.id] ?? f.id,
    lignes: f.sousParties.flatMap((s) => {
      const prix = prixAffiche(s);
      return prix ? [{ libelle: s.libelle, prix }] : [];
    }),
  }));
}

const LIGNE = "flex items-baseline justify-between gap-4 border-t border-trait py-2.5 text-[15.5px]";
const MONTANT = "font-sans font-semibold whitespace-nowrap tabular-nums text-encre";

export function ContenuPrix({ tarifs, className }: { tarifs: TarifsSite | null; className?: string }) {
  return (
    <div className={className}>
      <p className="texte-2 max-w-xl">
        Fourni et posé, au {UNITE_PRIX}. Le devis, gratuit, fixe le chiffre exact selon les découpes et l&apos;accès.
      </p>
      {tarifs ? (
        <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {lignesPrix(tarifs).map((f) => (
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
        <dl className="mt-6 max-w-xl">
          <div className={LIGNE}>
            <dt className="text-encre-2">Au mètre linéaire</dt>
            <dd className={MONTANT}>{PRIX_PLAGE}</dd>
          </div>
          {(Object.keys(FOURCHETTES) as (keyof typeof FOURCHETTES)[]).map((cle) => (
            <div key={cle} className={LIGNE}>
              <dt className="text-encre-2">{FOURCHETTES[cle].libelle.charAt(0).toUpperCase() + FOURCHETTES[cle].libelle.slice(1)}</dt>
              <dd className={MONTANT}>{fourchette(cle)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export async function BlocPrix({ className }: { className?: string }) {
  return <ContenuPrix tarifs={await chargerTarifs()} className={className} />;
}
