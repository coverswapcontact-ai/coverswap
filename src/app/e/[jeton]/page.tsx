import type { Metadata, Viewport } from "next";
import EspaceClient from "@/components/espace/EspaceClient";

/**
 * Espace client : la page personnelle d'un client, ouverte par le lien signé
 * qu'il a reçu par SMS. Sans compte ni mot de passe. Jamais indexée, jamais
 * mesurée (voir HorsEspaceClient dans le gabarit), et l'adresse ne fuit pas en
 * « referrer » vers d'autres sites.
 */
export const metadata: Metadata = {
  title: "Votre espace projet",
  description: "Votre projet CoverSwap : photos, simulations, devis.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
  alternates: { canonical: null },
  openGraph: { title: "Votre espace projet CoverSwap", description: "Votre projet de rénovation, étape par étape." },
};

export const viewport: Viewport = { themeColor: "#f5f5f5", width: "device-width", initialScale: 1 };

export const dynamic = "force-dynamic";

export default async function PageEspace({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const base = (process.env.NEXT_PUBLIC_CRM_URL || (process.env.NEXT_PUBLIC_SIMULATE_URL || "https://crm.coverswap.fr/api/simulate").replace(/\/api\/simulate\/?$/, "")).replace(/\/$/, "");
  return <EspaceClient jeton={jeton} baseApi={`${base}/api/espace`} />;
}
