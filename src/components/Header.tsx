"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/simulation", label: "Simulation IA" },
  { href: "/realisations", label: "Réalisations" },
  {
    href: "/prestations",
    label: "Prestations",
    submenu: [
      { href: "/prestations/cuisine", label: "Cuisine" },
      { href: "/prestations/salle-de-bain", label: "Salle de bain" },
      { href: "/prestations/meubles", label: "Meubles" },
      { href: "/prestations/professionnel", label: "Professionnel" },
      { href: "/prestations/vitrages", label: "Vitrages" },
    ],
  },
  { href: "/revetements", label: "Catalogue" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prestationsOpen, setPrestationsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-rouge focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm">
      Aller au contenu principal
    </a>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-noir/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-rouge rounded-lg transform rotate-45 group-hover:rotate-[225deg] transition-transform duration-700" />
            <span className="absolute inset-0 flex items-center justify-center text-white font-display font-bold text-lg">
              C
            </span>
          </div>
          <div>
            <span className="font-display font-bold text-xl tracking-tight">
              Cover<span className="text-rouge">Swap</span>
            </span>
            <p className="text-[10px] text-gris-400 uppercase tracking-[0.2em] -mt-1 hidden sm:block">
              Rénovation adhésive premium
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) =>
            link.submenu ? (
              <div key={link.href} className="relative group">
                <button
                  aria-haspopup="true"
                  aria-expanded={prestationsOpen}
                  className="px-4 py-2 text-sm font-medium text-gris-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  {link.label}
                  <svg
                    className="w-3.5 h-3.5 transition-transform group-hover:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="bg-noir/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[200px] shadow-2xl">
                    {link.submenu.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="block px-4 py-2.5 text-sm text-gris-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-gris-300 hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-rouge scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            )
          )}
        </nav>

        {/* CTA Desktop */}
        <Link
          href="/simulation"
          className="hidden lg:inline-flex items-center gap-2 bg-rouge text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-all duration-300 hover:bg-rouge-hover hover:shadow-[0_0_20px_rgba(204,0,0,0.4)] hover:scale-105 uppercase tracking-wider"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Simulation gratuite
        </Link>

        {/* Mobile burger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden relative w-10 h-10 flex items-center justify-center"
          aria-label="Menu"
        >
          <div className="space-y-1.5">
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                mobileOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                mobileOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 top-0 bg-noir/98 backdrop-blur-xl z-40 transition-all duration-500 ${
          mobileOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-6 pt-20">
          {navLinks.map((link) =>
            link.submenu ? (
              <div key={link.href} className="text-center">
                <button
                  onClick={() => setPrestationsOpen(!prestationsOpen)}
                  aria-haspopup="true"
                  aria-expanded={prestationsOpen}
                  className="text-2xl font-display font-bold text-white flex items-center gap-2"
                >
                  {link.label}
                  <svg
                    className={`w-5 h-5 transition-transform ${prestationsOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {prestationsOpen && (
                  <div className="mt-3 space-y-2">
                    {link.submenu.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileOpen(false)}
                        className="block text-lg text-gris-400 hover:text-rouge transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-display font-bold text-white hover:text-rouge transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
          <Link
            href="/simulation"
            onClick={() => setMobileOpen(false)}
            className="btn-primary mt-4"
          >
            Simulation gratuite
          </Link>
        </div>
      </div>
    </header>
    </>
  );
}
