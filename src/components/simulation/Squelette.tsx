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
 * La grille des grandes tuiles de la page Matières (mission 16, partie 5) : 3 colonnes, 5 à partir de 768 px. Partagée
 * par la vraie grille et son squelette, pour que rien ne saute quand le catalogue arrive.
 */
export const GRILLE_TUILES_GRANDES = "grid grid-cols-3 gap-x-3 gap-y-5 md:grid-cols-5 md:gap-x-5 md:gap-y-7";

/**
 * Une grille de tuiles carrées (catalogue en chargement). `grand` : celle de la page Matières, à la taille des tuiles
 * `TuileFilm taille="grand"` (vignette carrée, libellé de 13 px puis nom de 15 px, chacun sur sa ligne).
 */
export function SqueletteTuiles({ nombre = 9, grand = false }: { nombre?: number; grand?: boolean }) {
  if (grand) {
    return (
      <ul className={GRILLE_TUILES_GRANDES} aria-hidden>
        {Array.from({ length: nombre }, (_, i) => (
          <li key={i}>
            <div className="overflow-hidden rounded-[var(--rayon-md)]">
              <Squelette ratio="1 / 1" />
            </div>
            <div className="mt-2.5 flex h-[19.5px] items-center">
              <Squelette className="h-3 w-1/2" />
            </div>
            <div className="flex h-[22.5px] items-center">
              <Squelette className="h-3.5 w-3/4" />
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
