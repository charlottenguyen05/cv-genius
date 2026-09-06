import React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

const footerLinks = {
  Navigation: [
    { label: "Accueil", href: "/" },
    { label: "Créer un CV", href: "/create" },
    { label: "Mon espace", href: "/dashboard" },
    { label: "Connexion", href: "/login" },
    { label: "Inscription", href: "/register" },
  ],
  Fonctionnalités: [
    { label: "Saisie IA", href: "/create" },
    { label: "Gérer mes CVs", href: "/dashboard" },
    { label: "Export PDF", href: "/create" },
    { label: "Templates ATS", href: "/create" },
    { label: "Autres", href: "/" },
  ],
  Support: [
    { label: "FAQ", href: "/" },
    { label: "Documentation", href: "/" },
    { label: "Communauté", href: "/" },
    { label: "Centre d'aide", href: "/" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">

        {/* ── Top grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black text-gray-900 tracking-tight">
                CV <span className="text-primary-500">Genius</span>
              </span>
            </Link>

            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-[220px]">
              Transformez vos expériences en CV professionnel grâce à l&apos;intelligence
              artificielle Gemini.
            </p>

            {/* Newsletter */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 text-sm text-black placeholder-gray-400 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition min-w-0"
                aria-label="Email newsletter"
              />
              <button
                className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
                type="button"
              >
                S&apos;abonner
              </button>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-bold text-gray-900 mb-4 tracking-tight">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 hover:translate-x-0.5 inline-block transition-all duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ───────────────────────────── */}
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400">
            ©2025 CV Genius. Tous droits réservés
          </p>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Conditions d&apos;utilisation
            </Link>
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
