"use client";

import React, { useEffect, useRef, type ReactNode } from "react";

/**
 * Apparition douce au défilement. Le contenu est VISIBLE sans JavaScript et
 * avant hydratation : la classe `js` posée sur <html> par le script du layout
 * est la seule qui masque, et l'observateur révèle. Aucun texte n'attend le
 * navigateur pour exister.
 */
interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale" | "fade";
  className?: string;
  threshold?: number;
}

export default React.memo(function ScrollReveal({ children, delay = 0, direction = "up", className = "", threshold = 0.12 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("revealed");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}s`;
          el.classList.add("revealed");
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    <div ref={ref} className={`reveal reveal-${direction} ${className}`}>
      {children}
    </div>
  );
});
