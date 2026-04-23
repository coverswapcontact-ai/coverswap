"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/simulation", label: "Simulation IA" },
  {
    href: "#realisations",
    label: "Réalisations",
    external: true,
    submenu: [
      { href: "https://www.instagram.com/cover.swap/", label: "Instagram", icon: "instagram" },
      { href: "https://www.tiktok.com/@cover.swap", label: "TikTok", icon: "tiktok" },
    ],
  },
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
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

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

    {/* ═══ HEADER BAR ═══ */}
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled && !mobileOpen
          ? "bg-noir/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-3"
          : mobileOpen
          ? "bg-noir py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container-custom flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group relative z-50">
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
                    {link.submenu.map((sub) => {
                      const isExternal = sub.href.startsWith("http");
                      const icon = "icon" in sub ? (sub as { icon?: string }).icon : undefined;
                      return isExternal ? (
                        <a
                          key={sub.href}
                          href={sub.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gris-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                          {icon === "instagram" && (
                            <svg className="w-4 h-4 text-pink-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                          )}
                          {icon === "tiktok" && (
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.73a8.19 8.19 0 004.77 1.52V6.79a4.85 4.85 0 01-1-.1z"/></svg>
                          )}
                          {sub.label}
                          <svg className="w-3 h-3 text-gris-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      ) : (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block px-4 py-2.5 text-sm text-gris-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
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
          Simuler mon projet
        </Link>

        {/* Mobile burger — z-50 pour rester au-dessus du menu overlay */}
        <button
          onClick={() => { setMobileOpen(!mobileOpen); setOpenSubmenu(null); }}
          className="lg:hidden relative z-50 w-10 h-10 flex items-center justify-center"
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
    </header>

    {/* ═══ MOBILE MENU — EN DEHORS DU HEADER pour éviter le bug backdrop-filter ═══ */}
    <div
      className={`lg:hidden fixed inset-0 bg-noir z-[45] transition-all duration-300 ${
        mobileOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      }`}
    >
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6 overflow-y-auto">
        {navLinks.map((link) =>
          link.submenu ? (
            <div key={link.href} className="text-center">
              <button
                onClick={() => setOpenSubmenu(openSubmenu === link.href ? null : link.href)}
                aria-haspopup="true"
                aria-expanded={openSubmenu === link.href}
                className="text-2xl font-display font-bold text-white flex items-center gap-2"
              >
                {link.label}
                <svg
                  className={`w-5 h-5 transition-transform ${openSubmenu === link.href ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openSubmenu === link.href && (
                <div className="mt-3 space-y-2">
                  {link.submenu.map((sub) => {
                    const isExternal = sub.href.startsWith("http");
                    return isExternal ? (
                      <a
                        key={sub.href}
                        href={sub.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-2 text-lg text-gris-400 hover:text-rouge transition-colors"
                      >
                        {sub.label}
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    ) : (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileOpen(false)}
                        className="block text-lg text-gris-400 hover:text-rouge transition-colors"
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
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
          Simuler mon projet
        </Link>
      </div>
    </div>
    </>
  );
}
