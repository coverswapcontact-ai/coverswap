/**
 * Squelettes de chargement du simulateur (mission 15, partie 4) : des blocs
 * de la taille finale, dans le gris du fond, avec une pulsation lente (coupée
 * par prefers-reduced-motion). Ils réservent la place : rien ne saute quand
 * le contenu arrive.
 */
export function Squelette({ className, ratio }: { className?: string; ratio?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-[var(--rayon-sm)] bg-fond-2 motion-reduce:animate-none ${className ?? ""}`} style={ratio ? { aspectRatio: ratio } : undefined} />;
}

/** Une grille de tuiles carrées (catalogue en chargement). */
export function SqueletteTuiles({ nombre = 9 }: { nombre?: number }) {
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
