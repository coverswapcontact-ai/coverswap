"use client";

import { useState } from "react";
import Link from "next/link";
import { Feuille, useLiensDeFeuille } from "@/components/simulation/Feuille";
import { ENTREES_MENU, LIEN_CONTACT } from "@/lib/navigation";

/**
 * Le menu du téléphone (mission 16) : un bouton « Menu » de 44 px qui ouvre
 * une feuille (Échap, glisser vers le bas et le geste retour la ferment) avec
 * les quatre entrées et le contact (l'espace client est au pied de page, pas
 * au menu : énoncé § 5). Masqué à partir de 768 px : l'en-tête montre alors
 * les entrées. Un lien ferme la feuille puis navigue (`useLiensDeFeuille`) :
 * sans cela, le retour d'historique de la feuille annulerait la navigation.
 */
const ENTREES = [...ENTREES_MENU, LIEN_CONTACT];
const LIEN = "flex min-h-[56px] items-center border-b border-trait text-[18px] font-medium text-encre";

export default function MenuMobile() {
  const [ouvert, setOuvert] = useState(false);
  const fermer = () => setOuvert(false);
  const aller = useLiensDeFeuille(ouvert, fermer);
  return (
    <>
      <button type="button" aria-haspopup="dialog" aria-expanded={ouvert} onClick={() => setOuvert(true)} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--rayon-sm)] px-2 text-[15px] font-medium text-encre md:hidden">
        Menu
      </button>
      <Feuille ouverte={ouvert} onFermer={fermer} titre="Menu">
        <nav aria-label="Menu principal">
          <ul>
            {ENTREES.map((entree) => (
              <li key={entree.href}>
                <Link href={entree.href} onClick={aller(entree.href)} className={LIEN}>
                  {entree.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Feuille>
    </>
  );
}
