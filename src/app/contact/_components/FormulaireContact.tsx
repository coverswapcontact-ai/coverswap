"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DevisForm from "@/components/DevisForm";
import type { FamillePrestation } from "@/lib/prestations";
import { messageVisite } from "@/lib/visite";

/**
 * Le formulaire de contact, avec la référence catalogue passée dans l'URL (?ref=…). Site 3.0 (lots D3, D4) : avec
 * `visite=1` (« La voir en vrai chez moi » d'une fiche ou d'une famille), le message est prérempli (`messageVisite`).
 */
function FormulaireAvecReference({ familles }: { familles?: FamillePrestation[] }) {
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");
  const message = messageVisite(new URLSearchParams(searchParams.toString()));
  return <DevisForm key={message ?? ""} source="coverswap.fr/contact" reference={refParam || undefined} familles={familles} messageInitial={message ?? undefined} />;
}

export default function FormulaireContact({ familles }: { familles?: FamillePrestation[] }) {
  return (
    <Suspense fallback={<DevisForm source="coverswap.fr/contact" familles={familles} />}>
      <FormulaireAvecReference familles={familles} />
    </Suspense>
  );
}
