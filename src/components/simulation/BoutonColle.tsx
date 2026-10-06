"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ATTRIBUT_FEUILLE_OUVERTE, masquerPendantSaisie } from "./saisie";

/**
 * Le bouton principal collé en bas de l'écran (mission 16, extrait de
 * l'écran des matières du simulateur) : `fixed`, au-dessus de la zone de
 * sécurité de l'iPhone (`env(safe-area-inset-bottom)`). Le conteneur de la
 * page réserve la place (`RESERVE_BOUTON_COLLE`, 7 rem, dans
 * `reserve-bouton-colle.ts` : importable par une page serveur) pour que rien
 * ne reste caché dessous.
 *  - `mobileSeulement` : masqué à partir de 768 px (le bouton est dans la page) ;
 *  - `cibles` : identifiants d'éléments de la page ; tant que l'un d'eux est
 *    visible (le bouton de l'ouverture, un module qui a son propre bouton),
 *    le bouton collé est masqué (`IntersectionObserver`). Une cible
 *    introuvable laisse le bouton masqué : l'erreur se voit au premier essai ;
 *  - `masquerSurSaisie` (site 3.0, lot B5 ; l'accueil seulement) : masqué tant
 *    qu'un champ de saisie a le focus (le clavier du téléphone le collerait sur
 *    le formulaire) ou qu'une feuille est ouverte (`data-feuille-ouverte` sur
 *    `<html>`, posé par `verrouillerLaPage`). Le bouton de l'écran des matières
 *    du simulateur ne le prend pas : son action doit rester sous le pouce.
 */
export function BoutonColle({ children, mobileSeulement = false, cibles, masquerSurSaisie = false }: { children: ReactNode; mobileSeulement?: boolean; cibles?: string[]; masquerSurSaisie?: boolean }) {
  const cle = (cibles ?? []).join(" ");
  // Avec des cibles, masqué jusqu'au premier constat de l'observateur (pas d'apparition-éclair en haut de page).
  const [cibleVisible, setCibleVisible] = useState(cle !== "");
  const [enSaisie, setEnSaisie] = useState(false);

  useEffect(() => {
    if (!masquerSurSaisie) return;
    const html = document.documentElement;
    // Au focusout, le focus est déjà sur <body> ; le focusin suivant donne le nouvel élément (même tâche : pas d'éclair).
    const relire = () => setEnSaisie(masquerPendantSaisie(html.hasAttribute(ATTRIBUT_FEUILLE_OUVERTE), document.activeElement as HTMLElement | null));
    document.addEventListener("focusin", relire);
    document.addEventListener("focusout", relire);
    const observateur = new MutationObserver(relire);
    observateur.observe(html, { attributes: true, attributeFilter: [ATTRIBUT_FEUILLE_OUVERTE] });
    return () => {
      document.removeEventListener("focusin", relire);
      document.removeEventListener("focusout", relire);
      observateur.disconnect();
    };
  }, [masquerSurSaisie]);

  useEffect(() => {
    if (!cle) return;
    const elements = cle
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0 || typeof IntersectionObserver === "undefined") return;
    const visibles = new Set<Element>();
    const observateur = new IntersectionObserver((entrees) => {
      for (const entree of entrees) {
        if (entree.isIntersecting) visibles.add(entree.target);
        else visibles.delete(entree.target);
      }
      setCibleVisible(visibles.size > 0);
    });
    for (const el of elements) observateur.observe(el);
    return () => observateur.disconnect();
  }, [cle]);

  if (cibleVisible || enSaisie) return null;

  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-trait bg-fond${mobileSeulement ? " md:hidden" : ""}`}>
      <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{children}</div>
    </div>
  );
}
