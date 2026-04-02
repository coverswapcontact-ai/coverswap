"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const handleRefuse = () => {
    localStorage.setItem("cookie-consent", "refused");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
      style={{
        animation: "slideUp 0.4s ease-out",
      }}
    >
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <div className="bg-noir/95 backdrop-blur-md border-t border-white/10 px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gris-300 text-center sm:text-left">
            Ce site utilise des cookies pour améliorer votre expérience.{" "}
            <Link
              href="/politique-confidentialite"
              className="underline text-gris-200 hover:text-white transition-colors"
            >
              En savoir plus
            </Link>
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRefuse}
              className="btn-secondary text-sm px-4 py-2"
            >
              Refuser
            </button>
            <button
              onClick={handleAccept}
              className="btn-primary text-sm px-4 py-2"
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
