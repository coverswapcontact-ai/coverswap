"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

/**
 * Compteur animé SSR-friendly.
 *
 * Le rendu serveur affiche directement la valeur FINALE (`end`). C'est
 * essentiel pour le SEO : Googlebot voit `1 journée`, `5x`, `60 sec`, `100%`
 * dans le HTML source, pas `0`. L'animation client se déclenche seulement
 * après hydratation, quand le compteur entre dans le viewport.
 *
 * Avant ce fix, le HTML SSR contenait `0 journée / 0x / 0 sec / 0%`,
 * ce qui dégradait considérablement la pertinence pour le crawler.
 */
export default React.memo(function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
  duration = 2000,
}: AnimatedCounterProps) {
  // hydrated = false en SSR et lors du premier rendu client.
  // Tant que false, on affiche la valeur finale (visible par Googlebot et lors du flash initial).
  const [hydrated, setHydrated] = useState(false);
  const [count, setCount] = useState(end);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Marque l'hydratation côté client + reset count à 0 pour préparer l'animation
  useEffect(() => {
    setHydrated(true);
    setCount(0);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hydrated]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
});
