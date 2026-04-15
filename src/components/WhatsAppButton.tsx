"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Bouton flottant WhatsApp — discret, apparaît après scroll.
 * Se décale quand le bandeau cookies est visible.
 */
export default function WhatsAppButton() {
  const phone = "33670352869";
  const message = encodeURIComponent(
    "Bonjour Lucas, je viens du site CoverSwap et je souhaite plus d'informations sur mon projet."
  );
  const href = `https://wa.me/${phone}?text=${message}`;

  const [bannerVisible, setBannerVisible] = useState(false);
  const [visible, setVisible] = useState(false);

  /* Visibilité cookies */
  useEffect(() => {
    const check = () => {
      setBannerVisible(!localStorage.getItem("cookie-consent"));
    };
    check();
    window.addEventListener("storage", check);
    window.addEventListener("cookie-consent-change", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("cookie-consent-change", check);
    };
  }, []);

  /* Apparition après scroll au-delà du hero (≈ 600px) */
  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter CoverSwap sur WhatsApp"
      onClick={() => track("whatsapp_clicked", { location: "floating_button" })}
      className={`fixed right-4 sm:right-6 z-40 group transition-all duration-500 ease-out ${
        bannerVisible ? "bottom-28 sm:bottom-24" : "bottom-6"
      } ${visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}
    >
      {/* Bouton principal — plus petit, sans pulse, shadow douce */}
      <span className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#25D366]/90 hover:bg-[#25D366] backdrop-blur-sm shadow-[0_4px_16px_rgba(37,211,102,0.25)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.4)] hover:scale-105 transition-all duration-300">
        <svg
          viewBox="0 0 32 32"
          className="w-5 h-5 sm:w-6 sm:h-6 text-white"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.2-.73.2-1.088 0-.258-1.848-1.163-2.05-1.42zm-2.75 8.405c-5.523 0-10-4.477-10-10 0-5.522 4.477-10 10-10s10 4.478 10 10c0 5.523-4.477 10-10 10zm0-22.18C9.71 3.43 4.29 8.85 4.29 15.5c0 2.119.55 4.165 1.591 5.965L4.22 27.7l6.4-1.646a12.42 12.42 0 0 0 5.74 1.43h.005C23.01 27.483 28.43 22.063 28.43 15.41c0-3.22-1.254-6.248-3.528-8.524a11.996 11.996 0 0 0-8.542-3.535z" />
        </svg>
      </span>

      {/* Tooltip desktop uniquement */}
      <span className="hidden sm:block absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap bg-noir/90 backdrop-blur-sm border border-white/10 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
        Discuter sur WhatsApp
      </span>
    </a>
  );
}
