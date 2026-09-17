"use client";

import { ouvrirChoixCookies } from "@/lib/cookies";

/** Lien du pied de page : rouvre le bandeau pour modifier ses choix de cookies. */
export default function BoutonCookies({ className }: { className?: string }) {
  return (
    <button type="button" onClick={ouvrirChoixCookies} className={className}>
      Gérer les cookies
    </button>
  );
}
