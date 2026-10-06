import Link from "next/link";
import type { ComponentProps } from "react";
import { SANS_PRECHARGEMENT } from "@/lib/prechargement-liens";

/**
 * Le lien interne du site (lot F7) : `next/link`, SANS son préchargement automatique — celui-ci part dès l'hydratation
 * et prenait la bande passante du premier écran. Le préchargement est fait par `PrechargementDiffere` (le gabarit) :
 * au survol, au toucher, au focus, puis les liens visibles après le chargement (`lib/prechargement-liens.ts`).
 *
 * Pas un composant client : une simple fonction autour de `next/link` (aucun composant de plus à hydrater, aucune
 * observation de visibilité par lien). Un `prefetch={false}` écrit dans le code reste « jamais préchargé »
 * (`data-sans-prechargement`). Tous les liens internes passent par ici (perf.test.ts : `next/link` n'est importé
 * qu'ici).
 */
export default function LienSite({ prefetch, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} prefetch={false} {...(prefetch === false ? { [SANS_PRECHARGEMENT]: "" } : {})} />;
}
