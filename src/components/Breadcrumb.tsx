import Link from "next/link";

export interface BreadcrumbItem {
  /** Texte affiché */
  label: string;
  /** URL relative (omettre pour le dernier item = page courante) */
  href?: string;
}

/**
 * Breadcrumb UI accessible — à utiliser au-dessus du <h1> de chaque page interne.
 *
 * Fonctionne en tandem avec <BreadcrumbSchema /> (JSON-LD) :
 *  - Le composant React rend la version visible
 *  - BreadcrumbSchema rend la version data structurée pour Google
 *
 * Bonnes pratiques SEO + a11y :
 *  - <nav aria-label="Fil d'Ariane">
 *  - Le dernier item est en <span aria-current="page"> (pas un lien)
 *  - Séparateurs visuels par CSS (pas dans le DOM logique)
 */
export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-gris-400 mb-8"
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={`${item.label}-${idx}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-white" aria-current={isLast ? "page" : undefined}>
                {item.label}
              </span>
            )}
            {!isLast && <span className="text-gris-600" aria-hidden="true">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
