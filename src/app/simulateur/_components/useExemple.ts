"use client";

import { useState } from "react";
import type { ExempleSimulateur } from "@/lib/exemples-simulateur";
import { fichierExemple, type ExempleCharge } from "@/lib/simulateur/photo";

/**
 * « Essayer d'autres matières sur cette pièce » (site 3.0, lot E3) : le seul endroit où une pièce d'exemple quitte
 * la bibliothèque. L'avant en pleine taille (`exemple.fichier`, une image du site, jamais le CRM) est lu, devient un
 * fichier JPEG (`fichierExemple`), puis passe par `onFichier` — le chemin d'une photo de visiteur : préparation,
 * analyse, `limite-abus.ts`, Turnstile et quotas à la génération. Rien avant ce geste : choisir un exemple ne fait
 * qu'afficher ses deux après (`ExemplesPhoto`).
 */
export function useExemple(onFichier: (file: File, exemple: ExempleCharge) => void) {
  const [charge, setCharge] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const essayer = async (exemple: ExempleSimulateur) => {
    setErreur(null);
    setCharge(exemple.id);
    try {
      const reponse = await fetch(exemple.fichier);
      if (!reponse.ok) throw new Error(String(reponse.status));
      onFichier(fichierExemple(await reponse.blob(), exemple.id), { id: exemple.id, piece: exemple.piece });
    } catch {
      setErreur("La pièce d'exemple n'a pas pu être chargée : vérifiez la connexion et réessayez.");
    } finally {
      setCharge(null);
    }
  };

  return { essayer, charge, erreur };
}
