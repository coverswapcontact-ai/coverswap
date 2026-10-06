import Link from "next/link";
import { ENTREPRISE } from "@/lib/entreprise";
import { LIENS_PIED } from "@/lib/navigation";

/**
 * Le pied de page (mission 16 ; site 3.0, lot B5 : en ton encre) : trois
 * rangées, en texte, sans icône ni bande de couleur. (1) une question ? le
 * téléphone et l'e-mail (depuis `lib/entreprise`, jamais en dur) ; (2) les
 * liens ; (3) la ligne légale (mission 16, partie 6 : plus de bandeau cookies,
 * donc plus de bouton pour les gérer : le site n'en dépose aucun de mesure).
 * Les adresses viennent de `lib/navigation` (les mêmes que l'en-tête et le
 * menu). Sur l'encre (`ton-encre`, sans grain) : le texte principal au papier
 * (15,42:1), les liens et le secondaire en `sur-encre-2` (6,69:1), jamais le
 * gris chaud (2,92:1), le focus au papier (globals.css), les filets au papier
 * à 20 %. Composant serveur.
 */
const RESEAUX = [
  { href: ENTREPRISE.reseaux.instagram, libelle: "Instagram" },
  { href: ENTREPRISE.reseaux.facebook, libelle: "Facebook" },
  { href: ENTREPRISE.reseaux.tiktok, libelle: "TikTok" },
];

const LIEN = "inline-flex min-h-[44px] min-w-[44px] items-center text-sur-encre-2 underline-offset-4 transition-colors duration-[var(--duree-courte)] hover:text-fond hover:underline";
/** Le téléphone et l'e-mail : au papier, soulignés au survol. */
const CONTACT = "inline-flex min-h-[44px] items-center text-[17px] font-medium text-fond underline-offset-4 hover:underline";

export default function PiedDePage() {
  return (
    <footer id="pied-de-page" className="ton-encre bg-encre px-4 text-fond md:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-1 border-b border-fond/20 py-8 sm:flex-row sm:items-center sm:gap-6">
          <p className="font-display text-[22px] leading-tight font-semibold text-fond">Une question ?</p>
          <a href={`tel:${ENTREPRISE.telephoneInternational}`} className={CONTACT}>
            {ENTREPRISE.telephone}
          </a>
          <a href={`mailto:${ENTREPRISE.email}`} className={CONTACT}>
            {ENTREPRISE.email}
          </a>
        </div>

        <nav aria-label="Pied de page" className="border-b border-fond/20 py-6">
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
          <p className="text-sur-encre-2">&copy; {new Date().getFullYear()} {ENTREPRISE.nom}</p>
          <Link href="/mentions-legales" className={LIEN}>
            Mentions légales
          </Link>
          <Link href="/politique-confidentialite" className={LIEN}>
            Politique de confidentialité
          </Link>
          <Link href="/cgv" className={LIEN}>
            CGV
          </Link>
        </div>
      </div>
    </footer>
  );
}
