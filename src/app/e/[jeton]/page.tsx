import type { Metadata, Viewport } from "next";
import EspaceClient from "@/components/espace/EspaceClient";
import { IMAGE_PARTAGE_ESPACE } from "@/lib/partage";

/**
 * Espace client : la page personnelle et PERMANENTE d'un client (tous ses
 * projets), ouverte par le lien signé qu'il a reçu par SMS. Sans compte ni mot
 * de passe. Jamais indexée, jamais
 * mesurée (voir HorsEspaceClient dans le gabarit), et l'adresse ne fuit pas en
 * « referrer » vers d'autres sites. `?apercu=…` : Lucas regarde depuis le CRM
 * (lecture seule, vérifiée par le CRM).
 */
export const metadata: Metadata = {
  title: "Votre espace CoverSwap",
  description: "Vos projets CoverSwap : photos, simulations, devis, factures.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
  alternates: { canonical: null },
  // L'aperçu du lien envoyé par SMS ou WhatsApp : l'image dessinée pour l'espace (`lib/partage`).
  openGraph: {
    title: "Votre espace CoverSwap",
    description: "Vos projets de rénovation, étape par étape.",
    images: [{ url: IMAGE_PARTAGE_ESPACE.url, width: IMAGE_PARTAGE_ESPACE.largeur, height: IMAGE_PARTAGE_ESPACE.hauteur, alt: IMAGE_PARTAGE_ESPACE.alt }],
  },
  twitter: { card: "summary_large_image", title: "Votre espace CoverSwap", description: "Vos projets de rénovation, étape par étape.", images: [IMAGE_PARTAGE_ESPACE.url] },
};

export const viewport: Viewport = { themeColor: "#F4EDE2", width: "device-width", initialScale: 1, viewportFit: "cover" };

export const dynamic = "force-dynamic";

export default async function PageEspace({ params, searchParams }: { params: Promise<{ jeton: string }>; searchParams: Promise<{ apercu?: string | string[]; p?: string | string[] }> }) {
  const [{ jeton }, recherche] = await Promise.all([params, searchParams]);
  const apercu = typeof recherche.apercu === "string" && /^[A-Za-z0-9_-]{16}$/.test(recherche.apercu) ? recherche.apercu : null;
  // `?p=` : le lien ouvre ce projet-là de son espace (SMS « vos simulations sont prêtes »…).
  const projet = typeof recherche.p === "string" && /^[a-z0-9]{8}$/.test(recherche.p) ? recherche.p : null;
  const base = (process.env.NEXT_PUBLIC_CRM_URL || (process.env.NEXT_PUBLIC_SIMULATE_URL || "https://crm.coverswap.fr/api/simulate").replace(/\/api\/simulate\/?$/, "")).replace(/\/$/, "");
  return <EspaceClient jeton={jeton} baseApi={`${base}/api/espace`} apercu={apercu} projetInitial={projet} />;
}
