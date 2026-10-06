import Link from "next/link";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { urlAbsolue } from "@/lib/metadonnees";

export interface BreadcrumbItem {
  /** Texte affiché, et nom de l'élément dans le `BreadcrumbList`. */
  label: string;
  /**
   * Adresse relative de l'élément. Site 3.0 (lot F4) : obligatoire, le dernier compris (la page courante, affichée
   * sans lien) : le balisage en a besoin. Une ancre (`/comment-ca-marche#guides`) reste au lien visible et part du
   * balisage.
   */
  href: string;
}

/** Le `BreadcrumbList` d'un fil : les mêmes éléments, dans le même ordre, en adresses absolues sans ancre. */
export function elementsBalisage(items: readonly BreadcrumbItem[]): { name: string; url: string }[] {
  return items.map((item) => ({ name: item.label, url: urlAbsolue(item.href.replace(/#.*$/, "")) }));
}

/**
 * Le fil d'Ariane (au-dessus du `<h1>` des pages intérieures), visible ET balisé : site 3.0 (lot F4), le composant
 * rend aussi le `BreadcrumbList` (JSON-LD) tiré des mêmes éléments — une seule liste, jamais un balisage qui dirait
 * autre chose que ce qu'on lit.
 *
 * Accessibilité :
 *  - <nav aria-label="Fil d'Ariane">
 *  - Le dernier élément est en <span aria-current="page"> (pas un lien)
 *  - Séparateurs masqués aux lecteurs d'écran
 *  - Mission 16 : chaque lien est une cible de 44 px de haut (hors paragraphe)
 */
export default function Breadcrumb({ items, className = "mb-2" }: { items: BreadcrumbItem[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <>
      <BreadcrumbSchema items={elementsBalisage(items)} />
      <nav aria-label="Fil d'Ariane" className={`${className} flex flex-wrap items-center gap-x-2 text-[14px] text-encre-2`}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <span key={`${item.label}-${idx}`} className="flex min-h-[44px] items-center gap-2">
              {!isLast ? (
                <Link href={item.href} className="inline-flex min-h-[44px] items-center transition-colors duration-[var(--duree-courte)] hover:text-encre">
                  {item.label}
                </Link>
              ) : (
                <span className="text-encre" aria-current="page">
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="text-trait" aria-hidden="true">
                  /
                </span>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
