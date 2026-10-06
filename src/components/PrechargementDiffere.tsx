"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MARGE_VISIBLE, SANS_PRECHARGEMENT, adressePrechargeable, attendreLeMoment } from "@/lib/prechargement-liens";

/**
 * Le préchargement des liens internes, une seule fois pour toute la page (site 3.0, lot F7 ; posé par le gabarit).
 * Les liens (`LienSite`) ne préchargent plus d'eux-mêmes : ici, au survol, au toucher ou au focus d'un lien, il est
 * préchargé tout de suite ; les liens visibles le sont à partir du premier geste ou trois secondes après `load`
 * (`lib/prechargement-liens.ts`). Même préchargement que celui de Next (`router.prefetch`), une fois par adresse.
 * Rend `null`.
 */
const dejaPrecharges = new Set<string>();

export default function PrechargementDiffere() {
  const router = useRouter();
  const chemin = usePathname();
  const [libre, setLibre] = useState(false);

  useEffect(() => attendreLeMoment(window, document, () => setLibre(true)), []);

  // L'intention : survol, toucher, focus d'un lien.
  useEffect(() => {
    const surIntention = (e: Event) => {
      const lien = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (lien) precharger(lien, router);
    };
    for (const t of ["pointerover", "touchstart", "focusin"]) document.addEventListener(t, surIntention, { passive: true });
    return () => {
      for (const t of ["pointerover", "touchstart", "focusin"]) document.removeEventListener(t, surIntention);
    };
  }, [router]);

  // Les liens visibles, une fois le moment venu ; ceux qui apparaissent ensuite aussi.
  useEffect(() => {
    if (!libre) return;
    const observes = new WeakSet<Element>();
    const visibilite = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue;
          visibilite.unobserve(e.target);
          precharger(e.target, router);
        }
      },
      { rootMargin: MARGE_VISIBLE },
    );
    const observer = () => {
      for (const a of document.querySelectorAll("a[href]")) {
        if (observes.has(a)) continue;
        observes.add(a);
        visibilite.observe(a);
      }
    };
    observer();
    let attente: number | null = null;
    const mutations = new MutationObserver(() => {
      if (attente === null) attente = window.setTimeout(() => {
        attente = null;
        observer();
      }, 200);
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      visibilite.disconnect();
      mutations.disconnect();
      if (attente !== null) window.clearTimeout(attente);
    };
  }, [libre, chemin, router]);

  return null;
}

function precharger(lien: Element, router: ReturnType<typeof useRouter>) {
  const adresse = adressePrechargeable(
    { href: lien.getAttribute("href"), cible: lien.getAttribute("target"), telechargement: lien.hasAttribute("download"), sansPrechargement: lien.hasAttribute(SANS_PRECHARGEMENT) },
    window.location,
  );
  if (!adresse || dejaPrecharges.has(adresse)) return;
  dejaPrecharges.add(adresse);
  router.prefetch(adresse);
}
