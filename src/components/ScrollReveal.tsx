"use client";

import { useEffect, useRef, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale" | "fade";
  className?: string;
  threshold?: number;
}

export default function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
  threshold = 0.12,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Slight delay before applying transition-delay so initial state is set
          const timer = setTimeout(() => {
            el.style.transitionDelay = `${delay}s`;
            el.classList.add("revealed");
          }, 20);
          observer.disconnect();
          return () => clearTimeout(timer);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);

  const dirClass = {
    up: "reveal reveal-up",
    left: "reveal reveal-left",
    right: "reveal reveal-right",
    scale: "reveal reveal-scale",
    fade: "reveal reveal-fade",
  }[direction];

  return (
    <div ref={ref} className={`${dirClass} ${className}`}>
      {children}
    </div>
  );
}
