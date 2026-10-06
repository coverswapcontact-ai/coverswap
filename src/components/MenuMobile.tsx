"use client";

import { useState } from "react";
import Link from "@/components/LienSite";
import { Feuille, useLiensDeFeuille } from "@/components/simulation/Feuille";
import { Lien } from "@/components/simulation/Lien";
import { ENTREES_MENU, LIEN_CONTACT, LIEN_SIMULER } from "@/lib/navigation";

/**
 * Le menu du téléphone (mission 16 ; site 3.0, lot B5, au style de l'en-tête) :
 * un bouton « Menu » de 44 px en petites capitales qui ouvre une feuille
 * (Échap, glisser vers le bas et le geste retour la ferment) avec les cinq
 * entrées et le contact, en petites capitales entre des filets d'encre (l'espace
 * client est au pied de page, pas au menu : énoncé § 5), et, en bas, le bouton
 * principal « Simuler ma pièce » (`depuis=entete`, comme le lien de l'en-tête).
 * Masqué à partir de 1 024 px : l'en-tête montre alors les entrées. Un lien
 * ferme la feuille puis navigue (`useLiensDeFeuille`) : sans cela, le retour
 * d'historique de la feuille annulerait la navigation.
 */
const ENTREES = [...ENTREES_MENU, LIEN_CONTACT];
const LIEN = "flex min-h-[56px] items-center border-b border-encre text-[15px] font-semibold tracking-[0.08em] text-encre uppercase";

export default function MenuMobile() {
  const [ouvert, setOuvert] = useState(false);
  const fermer = () => setOuvert(false);
  const aller = useLiensDeFeuille(ouvert, fermer);
  return (
    <>
      <button type="button" aria-haspopup="dialog" aria-expanded={ouvert} onClick={() => setOuvert(true)} className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--rayon-sm)] px-0.5 text-[12px] font-semibold tracking-[0.08em] text-encre uppercase sm:px-1.5 sm:text-[13px] lg:hidden">
        Menu
      </button>
      <Feuille
        ouverte={ouvert}
        onFermer={fermer}
        titre="Menu"
        pied={
          <Lien href={LIEN_SIMULER.href} onClick={aller(LIEN_SIMULER.href)} plein>
            {LIEN_SIMULER.libelle}
          </Lien>
        }
      >
        <nav aria-label="Menu principal">
          <ul className="border-t border-encre">
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
