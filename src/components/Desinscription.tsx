"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Bouton } from "@/components/simulation/Bouton";
import { SITE } from "@/lib/constants";

/**
 * La page de désinscription : l'adresse, un bouton, et c'est fait — pour
 * toujours. Les messages liés à un projet en cours (devis, espace, paiement)
 * ne sont pas des relances : ils continuent. Mission 16 : le logo et le
 * bouton communs du site (`Logo`, `Bouton`), les jetons de couleur et de rayon.
 */
export default function Desinscription({ base, lien }: { base: string; lien: { e: string; j: string; adresse: string } | null }) {
  const [etat, setEtat] = useState<"attente" | "envoi" | "fait" | "erreur">("attente");
  const [erreur, setErreur] = useState<string | null>(null);

  async function confirmer() {
    if (!lien) return;
    setEtat("envoi");
    setErreur(null);
    try {
      const reponse = await fetch(`${base}/api/site/desinscription`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ e: lien.e, j: lien.j }) });
      if (!reponse.ok) {
        const corps = (await reponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(corps?.error || "La désinscription n'a pas abouti.");
      }
      setEtat("fait");
    } catch (x) {
      setErreur(x instanceof Error && x.message !== "Failed to fetch" ? x.message : "Connexion impossible : vérifiez votre réseau, puis réessayez.");
      setEtat("erreur");
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-fond px-4 py-12 text-encre sm:items-center">
      <div className="w-full max-w-[480px] rounded-[var(--rayon-md)] border border-trait bg-white px-6 py-7 sm:px-7">
        <Logo />

        {!lien ? (
          <div className="mt-6 space-y-3 text-[17px] leading-relaxed">
            <h1 className="text-[19px] font-semibold">Ce lien est incomplet</h1>
            <p>
              Écrivez-nous à{" "}
              <a href={`mailto:${SITE.email}?subject=D%C3%A9sinscription`} className="font-medium text-accent-texte underline underline-offset-2">
                {SITE.email}
              </a>
              &nbsp;: nous retirons votre adresse de nos relances.
            </p>
          </div>
        ) : etat === "fait" ? (
          <div className="mt-6 space-y-3 text-[17px] leading-relaxed" role="status">
            <h1 className="text-[19px] font-semibold">C&apos;est fait</h1>
            <p>
              <span className="font-medium break-all">{lien.adresse}</span> ne recevra plus nos relances par e-mail. C&apos;est définitif.
            </p>
            <p className="text-[15px] text-encre-2">Si vous avez un projet en cours avec nous, les messages qui le concernent (votre devis, votre espace) continuent de vous parvenir.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4 text-[17px] leading-relaxed">
            <h1 className="text-[19px] font-semibold">Ne plus recevoir nos relances</h1>
            <p>
              Adresse&nbsp;: <span className="font-medium break-all">{lien.adresse}</span>
            </p>
            <Bouton plein occupe={etat === "envoi"} libelleOccupe="Un instant…" onClick={() => void confirmer()}>
              Me désinscrire
            </Bouton>
            {erreur ? (
              <p className="text-[15px] text-accent-texte" role="alert">
                {erreur}
              </p>
            ) : null}
            <p className="text-[14px] text-encre-2">Les messages liés à un projet en cours (votre devis, votre espace) ne sont pas des relances&nbsp;: ils continuent.</p>
          </div>
        )}

        <p className="mt-7 border-t border-trait pt-4 text-[13px] text-encre-2">
          CoverSwap · {SITE.phone}
        </p>
      </div>
    </div>
  );
}
