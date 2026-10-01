import Link from "next/link";
import type { MatiereCalque } from "./CalqueMatieres";
import { lienMatiere } from "./CalqueMatieres";

/**
 * Sous une photo d'ambiance (mission 19) :
 *  - sur téléphone, la légende des points numérotés (« 1 Sage Green RM20 · 2 Legno I14 · 3 Statuary White NE31 »),
 *    chaque matière en lien vers /matieres ;
 *  - partout, la mention honnête « Image d'ambiance · teintes réelles du catalogue » (vraie grâce au relevé des
 *    teintes du 01/10/2026) et le lien « Essayer cette composition chez moi », qui ouvre le simulateur avec les
 *    références déjà posées zone par zone.
 * Composant serveur.
 */
export const MENTION_TEINTES = "Image d'ambiance · teintes réelles du catalogue";

/** `sansListe` : la page montre déjà la composition numérotée (/inspirations) ; ne reste que la mention et le lien. */
export function LegendeMatieres({ matieres, lienComposition, className, sansListe = false }: { matieres: readonly MatiereCalque[]; /** Absent : pas de lien (la page Pro n'envoie pas au simulateur). */ lienComposition?: string; className?: string; sansListe?: boolean }) {
  return (
    <div className={`mt-2.5 text-[13.5px] leading-snug text-encre-2${className ? ` ${className}` : ""}`}>
      {sansListe ? null : (
        <ol className="flex flex-wrap gap-x-1.5 gap-y-1 md:hidden" aria-label="Matières de la photo">
          {matieres.map((m, i) => (
            <li key={m.ref + m.surface} className="inline-flex items-baseline">
              {i > 0 ? (
                <span aria-hidden className="mr-1.5">
                  ·
                </span>
              ) : null}
              <a href={lienMatiere(m.ref)} className="underline-offset-2 hover:underline">
                <span className="font-semibold text-encre">{i + 1}</span> {m.nom} {m.ref}
              </a>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 md:mt-0">
        <span>{MENTION_TEINTES}</span>
        {lienComposition ? (
          <Link href={lienComposition} className="inline-flex min-h-[44px] items-center font-medium text-encre underline underline-offset-4 md:min-h-0">
          Essayer cette composition chez moi
        </Link>
        ) : null}
      </p>
    </div>
  );
}
