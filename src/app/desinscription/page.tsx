import type { Metadata, Viewport } from "next";
import Desinscription from "@/components/Desinscription";

/**
 * Désinscription des relances par e-mail (séquences du CRM). Le lien porte
 * l'adresse et un jeton signé par le CRM : la page n'est jamais indexée ni
 * mesurée (voir HorsEspaceClient dans le gabarit), et rien ne se fait à
 * l'ouverture — un logiciel qui « prévisualise » les liens d'un mail ne doit
 * pas désinscrire à la place de la personne. Un clic suffit.
 */
export const metadata: Metadata = {
  title: "Désinscription",
  description: "Ne plus recevoir les relances par e-mail de CoverSwap.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
  alternates: { canonical: null },
};

export const viewport: Viewport = { themeColor: "#F5F4F1", width: "device-width", initialScale: 1 };

export const dynamic = "force-dynamic";

function adresseDuLien(e: string | null): string | null {
  if (!e || !/^[A-Za-z0-9_-]{4,400}$/.test(e)) return null;
  const adresse = Buffer.from(e, "base64url").toString("utf8").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresse) ? adresse : null;
}

export default async function PageDesinscription({ searchParams }: { searchParams: Promise<{ e?: string | string[]; j?: string | string[] }> }) {
  const recherche = await searchParams;
  const e = typeof recherche.e === "string" ? recherche.e : null;
  const j = typeof recherche.j === "string" && /^[A-Za-z0-9_-]{10,64}$/.test(recherche.j) ? recherche.j : null;
  const adresse = adresseDuLien(e);
  const base = (process.env.NEXT_PUBLIC_CRM_URL || (process.env.NEXT_PUBLIC_SIMULATE_URL || "https://crm.coverswap.fr/api/simulate").replace(/\/api\/simulate\/?$/, "")).replace(/\/$/, "");
  return <Desinscription base={base} lien={adresse && e && j ? { e, j, adresse } : null} />;
}
