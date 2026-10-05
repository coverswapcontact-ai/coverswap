import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ENTREES_MENU, LIEN_SIMULER } from "@/lib/navigation";
import MenuMobile from "./MenuMobile";

/**
 * L'en-tête du site (mission 16 ; site 3.0, lot B5) : un seul composant, deux rendus.
 *  - le site : le lien d'évitement « Aller au contenu » (visible au clavier
 *    seulement, premier arrêt de la page) ; le logo à gauche ; à droite, à
 *    partir de 1 024 px, les cinq entrées du menu (`lib/navigation`) en petites
 *    capitales à l'encre, et « Simuler ma pièce » ; en dessous, « Simuler ma
 *    pièce » et le bouton « Menu » qui ouvre une feuille (cinq entrées en
 *    capitales ne tiennent pas avec le logo et le lien à 768 px). « Simuler ma
 *    pièce » est un lien rouge (lot B2 : le rouge des actions), pas un bouton :
 *    le bouton principal de l'écran reste celui de la page (un seul par écran) ;
 *    il dit d'où il vient (`?depuis=entete`). Collé en haut (`sticky`, pas
 *    `fixed`), 60 px, le papier et son grain (`.papier`), un filet d'encre
 *    dessous, sans ombre ni verre, sans sous-menu ;
 *  - `compact` (le simulateur) : le logo et « Accueil », dans le flux.
 * Composant serveur : seul le menu du téléphone est client.
 */

/** Le lien du logo : son nom accessible est le texte visible « CoverSwap » (pas d'aria-label divergent). */
function LienLogo() {
  return (
    <Link href="/" className="inline-flex min-h-[44px] shrink-0 items-center rounded-[var(--rayon-sm)]">
      <Logo />
    </Link>
  );
}

/**
 * Le lien « Simuler ma pièce » : le rouge sur le papier (5,62:1), en gras ; plus sombre et souligné au survol. Sous
 * 640 px, 14 px sans la flèche : avec le logo et « Menu », il tient sur une ligne dès 360 px (mesuré au lot B5).
 */
const LIEN_ROUGE = "inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-[var(--rayon-sm)] px-1 text-[14px] font-bold sm:px-1.5 sm:text-[15px] whitespace-nowrap text-accent underline-offset-4 transition-colors duration-[var(--duree-courte)] hover:text-accent-survol hover:underline";

/** Une entrée du menu : petites capitales espacées à l'encre (15,42:1), soulignées au survol, cible de 44 px. */
const ENTREE_MENU = "inline-flex min-h-[44px] items-center rounded-[var(--rayon-sm)] px-3 text-[13px] font-semibold tracking-[0.08em] whitespace-nowrap text-encre uppercase underline-offset-[6px] transition-colors duration-[var(--duree-courte)] hover:underline";

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
      <header className="papier sticky top-0 z-50 border-b border-encre">
        <div className="mx-auto flex h-[60px] w-full max-w-6xl items-center justify-between gap-1.5 px-4 md:px-6">
          <LienLogo />
          <div className="flex items-center gap-1 sm:gap-3 lg:gap-6">
            <nav aria-label="Menu principal" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {ENTREES_MENU.map((entree) => (
                  <li key={entree.href}>
                    <Link href={entree.href} className={ENTREE_MENU}>
                      {entree.libelle}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <Link href={LIEN_SIMULER.href} className={LIEN_ROUGE}>
              {LIEN_SIMULER.libelle}
              <span aria-hidden className="hidden sm:inline">
                →
              </span>
            </Link>
            <MenuMobile />
          </div>
        </div>
      </header>
    </>
  );
}
