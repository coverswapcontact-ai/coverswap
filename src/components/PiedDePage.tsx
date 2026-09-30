import Link from "next/link";
import BoutonCookies from "./BoutonCookies";
import { ENTREPRISE } from "@/lib/entreprise";
import { LIENS_PIED } from "@/lib/navigation";

/**
 * Le pied de page (mission 16) : trois rangées, en texte, sans icône ni
 * bande de couleur. (1) une question ? le téléphone et l'e-mail (depuis
 * `lib/entreprise`, jamais en dur) ; (2) les liens ; (3) la ligne légale et
 * « Gérer les cookies » (tant que le bandeau existe). Les adresses viennent de
 * `lib/navigation` (les mêmes que l'en-tête et le menu). Composant serveur.
 */
const RESEAUX = [
  { href: ENTREPRISE.reseaux.instagram, libelle: "Instagram" },
  { href: ENTREPRISE.reseaux.facebook, libelle: "Facebook" },
  { href: ENTREPRISE.reseaux.tiktok, libelle: "TikTok" },
];

const LIEN = "inline-flex min-h-[44px] items-center text-encre-2 transition-colors duration-[var(--duree-courte)] hover:text-encre";

export default function PiedDePage() {
  return (
    <footer id="pied-de-page" className="border-t border-trait bg-fond-2 px-4 md:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-1 border-b border-trait py-8 sm:flex-row sm:items-center sm:gap-6">
          <p className="texte font-semibold text-encre">Une question ?</p>
          <a href={`tel:${ENTREPRISE.telephoneInternational}`} className="inline-flex min-h-[44px] items-center text-[17px] font-medium text-encre underline-offset-4 hover:underline">
            {ENTREPRISE.telephone}
          </a>
          <a href={`mailto:${ENTREPRISE.email}`} className="inline-flex min-h-[44px] items-center text-[17px] font-medium text-encre underline-offset-4 hover:underline">
            {ENTREPRISE.email}
          </a>
        </div>

        <nav aria-label="Pied de page" className="border-b border-trait py-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
            {LIENS_PIED.map((lien) => (
              <li key={lien.href}>
                <Link href={lien.href} className={LIEN}>
                  {lien.libelle}
                </Link>
              </li>
            ))}
            {RESEAUX.map((reseau) => (
              <li key={reseau.href}>
                <a href={reseau.href} target="_blank" rel="noopener noreferrer" className={LIEN}>
                  {reseau.libelle}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-x-6 gap-y-1 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-[14px] sm:flex-row sm:flex-wrap sm:items-center">
          <p className="text-encre-2">&copy; {new Date().getFullYear()} {ENTREPRISE.nom}</p>
          <Link href="/mentions-legales" className={LIEN}>
            Mentions légales
          </Link>
          <Link href="/politique-confidentialite" className={LIEN}>
            Politique de confidentialité
          </Link>
          <Link href="/cgv" className={LIEN}>
            CGV
          </Link>
          <BoutonCookies className={`${LIEN} text-left`} />
        </div>
      </div>
    </footer>
  );
}
