"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DevisForm from "@/components/DevisForm";

/** Le formulaire de contact, avec la référence catalogue passée dans l'URL (?ref=…). */
function FormulaireAvecReference() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");
  return <DevisForm source="coverswap.fr/contact" reference={refParam || undefined} />;
}

export default function FormulaireContact() {
  return (
    <Suspense fallback={<DevisForm source="coverswap.fr/contact" />}>
      <FormulaireAvecReference />
    </Suspense>
  );
}
