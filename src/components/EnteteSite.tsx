import Link from "next/link";
import { Logo } from "@/components/espace/Illustrations";
import { Lien } from "@/components/simulation/Lien";
import { ENTREES_MENU, LIEN_SIMULER } from "@/lib/navigation";
import MenuMobile from "./MenuMobile";

/**
 * L'en-tête du site (mission 16) : un seul composant, deux rendus.
 *  - le site : le lien d'évitement « Aller au contenu » (visible au clavier
 *    seulement, premier arrêt de la page) ; le logo à gauche ; à droite, à
 *    partir de 768 px, les quatre entrées du menu (`lib/navigation`) et
 *    « Simuler » ; sur mobile, « Simuler » et un bouton « Menu » qui ouvre une
 *    feuille. « Simuler » est en secondaire : le bouton principal de l'écran
 *    est celui de la page (un seul par écran). Collé en haut (`sticky`, pas
 *    `fixed`), 60 px, un trait dessous, sans ombre ni verre, sans sous-menu ;
 *  - `compact` (le simulateur) : le logo et « Accueil », dans le flux.
 * Composant serveur : seul le menu mobile est client.
 */

/** Le lien du logo : son nom accessible est le texte visible « CoverSwap » (pas d'aria-label divergent). */
function LienLogo() {
  return (
    <Link href="/" className="inline-flex min-h-[44px] items-center rounded-[var(--rayon-sm)]">
      <Logo />
    </Link>
  );
}

export default function EnteteSite({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <header className="pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4">
          <LienLogo />
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

  return (
    <>
      <a href="#main-content" className="fixed top-[calc(0.75rem+env(safe-area-inset-top))] left-3 z-[60] inline-flex min-h-[44px] -translate-y-[200%] items-center rounded-[var(--rayon-sm)] bg-encre px-4 text-[15px] font-medium text-blanc focus:translate-y-0">
        Aller au contenu
      </a>
      <header className="sticky top-0 z-50 border-b border-trait bg-fond">
        <div className="mx-auto flex h-[60px] w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <LienLogo />
          <div className="flex items-center gap-2 md:gap-6">
            <nav aria-label="Menu principal" className="hidden md:block">
              <ul className="flex items-center gap-1">
                {ENTREES_MENU.map((entree) => (
                  <li key={entree.href}>
                    <Link href={entree.href} className="inline-flex min-h-[44px] items-center rounded-[var(--rayon-sm)] px-3 text-[15px] font-medium text-encre-2 transition-colors duration-[var(--duree-courte)] hover:text-encre">
                      {entree.libelle}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <Lien href={LIEN_SIMULER.href} variante="secondaire">
              {LIEN_SIMULER.libelle}
            </Lien>
            <MenuMobile />
          </div>
        </div>
      </header>
    </>
  );
}
