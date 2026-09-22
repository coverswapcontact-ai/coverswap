"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DevisForm from "@/components/DevisForm";
import type { FamillePrestation } from "@/lib/prestations";

/** Le formulaire de contact, avec la référence catalogue passée dans l'URL (?ref=…). */
function FormulaireAvecReference({ familles }: { familles?: FamillePrestation[] }) {
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");
  return <DevisForm source="coverswap.fr/contact" reference={refParam || undefined} familles={familles} />;
}

export default function FormulaireContact({ familles }: { familles?: FamillePrestation[] }) {
  return (
    <Suspense fallback={<DevisForm source="coverswap.fr/contact" familles={familles} />}>
      <FormulaireAvecReference familles={familles} />
    </Suspense>
  );
}
