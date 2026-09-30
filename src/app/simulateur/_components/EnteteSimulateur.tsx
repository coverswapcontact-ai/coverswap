import Link from "next/link";
import { Logo } from "@/components/espace/Illustrations";

/**
 * L'en-tête du simulateur (mission 15, partie 4) : le logo et un retour vers
 * l'accueil, rien d'autre — l'en-tête fixe du site et son menu sont masqués
 * sur cette page (`HorsSimulateur`). Dans le flux (pas fixe) : rien ne
 * recouvre le parcours, et la zone sûre de l'iPhone est respectée.
 */
export function EnteteSimulateur() {
  return (
    <header className="pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4">
        <Link href="/" aria-label="CoverSwap, retour à l'accueil" className="inline-flex min-h-[44px] items-center rounded-[var(--rayon-sm)]">
          <Logo />
        </Link>
        <Link href="/" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[var(--rayon-sm)] px-2 text-[14.5px] font-medium text-encre-2 transition-colors duration-[var(--duree-courte)] hover:text-encre">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
          Accueil
        </Link>
      </div>
    </header>
  );
}
