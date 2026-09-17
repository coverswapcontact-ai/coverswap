"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EVENEMENT_OUVERTURE, FINALITES, enregistrerChoixCookies, lireChoixCookies, type ChoixCookies } from "@/lib/cookies";

/**
 * Bandeau cookies : finalités listées, refus aussi simple que l'accord,
 * réglage finalité par finalité, et réouverture à tout moment (lien
 * « Gérer les cookies » du pied de page). Rien de non nécessaire n'est déposé
 * tant que le visiteur n'a pas choisi.
 */
export default function CookieBanner() {
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
    if (!existant || existant.version < 2) {
      // Lecture d'un état externe (localStorage) après le montage, inconnu côté serveur.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
    window.addEventListener(EVENEMENT_OUVERTURE, ouvrir);
    return () => window.removeEventListener(EVENEMENT_OUVERTURE, ouvrir);
  }, []);

  const valider = (valeurs: Pick<ChoixCookies, "audience" | "publicite">) => {
    enregistrerChoixCookies(valeurs);
    setVisible(false);
    setDetail(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50" role="dialog" aria-modal="false" aria-labelledby="cookies-titre" style={{ animation: "slideUp 0.4s ease-out" }}>
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <div className="bg-noir/95 backdrop-blur-md border-t border-white/10 px-4 py-4 sm:py-5">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="space-y-1">
            <p id="cookies-titre" className="text-sm font-semibold text-white">
              Vos choix de cookies
            </p>
            <p className="text-sm text-gris-300">
              Le site fonctionne sans cookie non nécessaire. Avec votre accord, nous mesurons l&apos;audience et l&apos;efficacité de nos
              campagnes. Vous pouvez refuser, choisir finalité par finalité, et changer d&apos;avis à tout moment.{" "}
              <Link href="/politique-confidentialite" className="underline text-gris-200 hover:text-white transition-colors">
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
                    className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-white/5 accent-rouge"
                  />
                  <label htmlFor={`cookies-${finalite.cle}`} className="text-sm cursor-pointer">
                    <span className="block font-medium text-white">{finalite.libelle}</span>
                    <span className="block text-gris-400">{finalite.detail}</span>
                  </label>
                </li>
              ))}
              <li className="text-sm text-gris-500">
                <span className="block font-medium text-gris-300">Nécessaires (toujours actifs)</span>
                Mémorisation de ce choix, protection des formulaires contre les robots.
              </li>
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => valider({ audience: false, publicite: false })} className="btn-secondary text-sm px-4 py-2">
              Tout refuser
            </button>
            {detail ? (
              <button type="button" onClick={() => valider(choix)} className="btn-secondary text-sm px-4 py-2">
                Enregistrer mes choix
              </button>
            ) : (
              <button type="button" onClick={() => setDetail(true)} className="btn-secondary text-sm px-4 py-2">
                Personnaliser
              </button>
            )}
            <button type="button" onClick={() => valider({ audience: true, publicite: true })} className="btn-primary text-sm px-4 py-2">
              Tout accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
