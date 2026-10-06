import Link from "@/components/LienSite";
import { TuileFilm } from "@/components/simulation/TuileFilm";
import { familleDuCartel, libelleFinition } from "@/lib/cartel";
import { cheminMatiere } from "@/lib/familles-matieres";
import { urlVignette } from "@/lib/simulateur/generation-client";
import type { ReferenceRendu, Selection } from "@/lib/simulateur/reprise";

/**
 * Le cartel de la composition (site 3.0, lot E4), sous le rendu : chaque film posé, avec sa zone, sa vignette, son nom
 * et sa référence réels (`TuileFilm`, ceux que le CRM a rendus), sa famille et sa finition quand la sélection les
 * connaît, et le lien de sa fiche (`cheminMatiere` : `/matieres/<famille>/<REF>`, sinon le présentoir ouvert sur elle).
 * Dessous, « Recevoir ces échantillons chez moi » : un lien secondaire vers la demande (`#demande`) qui y coche la case
 * des échantillons (`onEchantillons`) ; absent une fois la demande envoyée. Rien ne part d'ici.
 */
export function CartelComposition({ references, selections, onEchantillons }: { references: readonly ReferenceRendu[]; selections: Readonly<Record<string, Selection | null>>; onEchantillons?: () => void }) {
  if (references.length === 0) return null;
  return (
    <section aria-labelledby="titre-composition" className="space-y-3">
      <h3 id="titre-composition" className="font-display text-[20px] leading-tight font-semibold text-encre">
        La composition
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2" aria-label="Films utilisés">
        {references.map((r) => {
          // La sélection de la zone ne vaut que si c'est bien ce film (un rendu plus ancien peut en porter un autre).
          const sel = selections[r.zone];
          const connue = sel && sel.ref === r.ref ? sel : null;
          const precisions = connue ? [connue.famille ? familleDuCartel(connue.famille) : null, connue.finition ? libelleFinition(connue.finition) : null].filter(Boolean).join(" · ") : "";
          return (
            <li key={r.zone}>
              <Link href={cheminMatiere(r.ref, connue?.famille)} prefetch={false} className="group block rounded-[var(--rayon-sm)] border border-trait bg-white p-2.5 transition-colors duration-[var(--duree-courte)] hover:border-encre">
                <TuileFilm ref={r.ref} nom={r.nom} libelle={r.libelle} vignette={urlVignette(r.ref)} taille="md" />
                <span className="mt-2 flex items-center justify-between gap-3">
                  <span className="cartel text-encre-2">{precisions}</span>
                  <span className="text-[13.5px] whitespace-nowrap text-encre underline underline-offset-4 group-hover:text-encre-2">Voir la fiche</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {onEchantillons ? (
        <a href="#demande" onClick={onEchantillons} className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-encre underline underline-offset-4 hover:text-encre-2">
          Recevoir ces échantillons chez moi
        </a>
      ) : null}
    </section>
  );
}
