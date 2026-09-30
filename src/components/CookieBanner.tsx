"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bouton } from "@/components/simulation/Bouton";
import { EVENEMENT_OUVERTURE, FINALITES, enregistrerChoixCookies, lireChoixCookies, type ChoixCookies } from "@/lib/cookies";

/**
 * Bandeau cookies : finalités listées, refus aussi simple que l'accord,
 * réglage finalité par finalité, et réouverture à tout moment (lien
 * « Gérer les cookies » du pied de page). Rien de non nécessaire n'est déposé
 * tant que le visiteur n'a pas choisi.
 */
export default function CookieBanner() {
  // Mission 15 (partie 4) : sur le simulateur, le bandeau ne se pose pas tout seul sur le parcours ; « Gérer les cookies » (pied de page) le rouvre.
  const discret = usePathname() === "/simulateur";
  const [visible, setVisible] = useState(false);
  const [detail, setDetail] = useState(false);
  const [choix, setChoix] = useState<Pick<ChoixCookies, "audience" | "publicite">>({ audience: false, publicite: false });

  useEffect(() => {
    const ouvrir = () => {
      const existant = lireChoixCookies();
      setChoix({ audience: existant?.audience ?? false, publicite: existant?.publicite ?? false });
      setDetail(!!existant);
      setVisible(true);
    };
    const existant = lireChoixCookies();
    if (!discret && (!existant || existant.version < 2)) {
      // Lecture d'un état externe (localStorage) après le montage, inconnu côté serveur.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
    window.addEventListener(EVENEMENT_OUVERTURE, ouvrir);
    return () => window.removeEventListener(EVENEMENT_OUVERTURE, ouvrir);
  }, [discret]);

  const valider = (valeurs: Pick<ChoixCookies, "audience" | "publicite">) => {
    enregistrerChoixCookies(valeurs);
    setVisible(false);
    setDetail(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-trait bg-fond px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pt-5" role="dialog" aria-modal="false" aria-labelledby="cookies-titre">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="space-y-1">
          <p id="cookies-titre" className="text-[15px] font-semibold text-encre">
            Vos choix de cookies
          </p>
          <p className="texte-2">
            Le site fonctionne sans cookie non nécessaire. Avec votre accord, nous mesurons l&apos;audience et l&apos;efficacité de nos
            campagnes. Vous pouvez refuser, choisir finalité par finalité, et changer d&apos;avis à tout moment.{" "}
            <Link href="/politique-confidentialite" className="text-encre underline underline-offset-4">
              En savoir plus
            </Link>
          </p>
        </div>

        {detail && (
          <ul className="space-y-3">
            {FINALITES.map((finalite) => (
              <li key={finalite.cle} className="flex items-start gap-3">
                <input
                  id={`cookies-${finalite.cle}`}
                  type="checkbox"
                  checked={choix[finalite.cle]}
                  onChange={(e) => setChoix({ ...choix, [finalite.cle]: e.target.checked })}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-trait accent-[var(--color-encre)]"
                />
                <label htmlFor={`cookies-${finalite.cle}`} className="cursor-pointer text-[14.5px]">
                  <span className="block font-medium text-encre">{finalite.libelle}</span>
                  <span className="block text-encre-2">{finalite.detail}</span>
                </label>
              </li>
            ))}
            <li className="text-[14.5px] text-encre-2">
              <span className="block font-medium text-encre">Nécessaires (toujours actifs)</span>
              Mémorisation de ce choix, protection des formulaires contre les robots.
            </li>
          </ul>
        )}

        {/* Refuser est aussi simple qu'accepter : deux boutons de même poids. */}
        <div className="flex flex-wrap items-center gap-3">
          <Bouton variante="secondaire" onClick={() => valider({ audience: false, publicite: false })}>
            Tout refuser
          </Bouton>
          <Bouton variante="secondaire" onClick={() => valider({ audience: true, publicite: true })}>
            Tout accepter
          </Bouton>
          {detail ? (
            <Bouton variante="discret" onClick={() => valider(choix)}>
              Enregistrer mes choix
            </Bouton>
          ) : (
            <Bouton variante="discret" onClick={() => setDetail(true)}>
              Personnaliser
            </Bouton>
          )}
        </div>
      </div>
    </div>
  );
}
