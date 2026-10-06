/**
 * Squelettes de chargement du simulateur (mission 15, partie 4) : des blocs
 * de la taille finale, dans le gris du fond, avec une pulsation lente (coupée
 * par prefers-reduced-motion). Ils réservent la place : rien ne saute quand
 * le contenu arrive.
 */
export function Squelette({ className, ratio }: { className?: string; ratio?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-[var(--rayon-sm)] bg-fond-2 motion-reduce:animate-none ${className ?? ""}`} style={ratio ? { aspectRatio: ratio } : undefined} />;
}

/**
 * La grille des échantillons du présentoir de /matieres (site 3.0, lot D2 ; mission 16 : les grandes tuiles) :
 * 2 colonnes au téléphone (le cartel a la place de son nom), 3 dès 640 px, 5 dès 1 024 px. Partagée par la vraie grille
 * et son squelette, pour que rien ne saute quand le catalogue arrive.
 */
export const GRILLE_ECHANTILLONS = "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5 lg:gap-y-10";

/**
 * Une grille de tuiles carrées (catalogue en chargement). `grand` : celle du présentoir de /matieres, à la taille de
 * ses échantillons (vignette carrée, puis le cartel : le nom de 19 px, la ligne « RÉF · famille · finition » de 12 px,
 * souvent sur deux lignes).
 */
export function SqueletteTuiles({ nombre = 9, grand = false }: { nombre?: number; grand?: boolean }) {
  if (grand) {
    return (
      <ul className={GRILLE_ECHANTILLONS} aria-hidden>
        {Array.from({ length: nombre }, (_, i) => (
          <li key={i}>
            <div className="overflow-hidden rounded-[var(--rayon-sm)]">
              <Squelette ratio="1 / 1" />
            </div>
            <div className="mt-3 flex h-[24px] items-center pl-[15px]">
              <Squelette className="h-4 w-2/3" />
            </div>
            <div className="mt-1 flex h-[34px] flex-col justify-center gap-2 pl-[15px]">
              <Squelette className="h-2.5 w-5/6" />
              <Squelette className="h-2.5 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid grid-cols-3 gap-x-2.5 gap-y-3" aria-hidden>
      {Array.from({ length: nombre }, (_, i) => (
        <li key={i}>
          <Squelette ratio="1 / 1" />
          <Squelette className="mt-1.5 h-3.5 w-3/4" />
        </li>
      ))}
    </ul>
  );
}
