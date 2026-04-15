"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Reset scroll en haut à chaque changement de route.
 * Désactive aussi la scroll-restoration automatique du navigateur
 * qui peut replacer l'utilisateur en bas de page (bug courant App Router).
 *
 * Respecte les ancres (#section) : si un hash est présent, on ne force pas.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* Désactive la scroll-restoration native (une fois au mount) */
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  /* Scroll top sur changement de route ou de query */
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Respecte une ancre dans l'URL
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, searchParams]);

  return null;
}
