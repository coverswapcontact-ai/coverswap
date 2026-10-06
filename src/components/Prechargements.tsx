"use client";

import { preload } from "react-dom";
import type { PrechargementImage } from "@/components/accueil/etudes";

/**
 * Le préchargement de l'image du premier écran (le LCP) — site 3.0, lot F6. Un composant CLIENT, et c'est tout son
 * rôle : rendu par le serveur, `preload` pose `<link rel="preload" as="image" … fetchpriority="high">` dans le `<head>`
 * du HTML de LA page ; mais un appel à `preload` (ou un `<img>` non différé, ou un `<link rel="preload">`) écrit dans un
 * composant serveur devient un indice `HL` de la charge RSC, que le routeur de Next exécute dès qu'il PRÉCHARGE la page
 * depuis un lien visible — le logo mène à « / » sur toutes les pages : chacune téléchargeait l'« avant » de l'accueil
 * (lots C1 et C2, mesuré au lot F6). Ici, la charge RSC ne porte qu'une référence au composant et sa liste : rien ne
 * part tant que la page n'est pas affichée. Pages : l'accueil, les prestations et /pro (l'« avant » du curseur
 * d'ouverture, `prechargementsOuverture`), la fiche d'une matière (l'échantillon du CRM).
 */
export function Prechargements({ liste }: { liste: readonly PrechargementImage[] }) {
  for (const p of liste) preload(p.href, p.options);
  return null;
}
