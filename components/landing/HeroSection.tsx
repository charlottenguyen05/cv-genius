"use client";

import Link from "next/link";
import { Play, Sparkles, FileText } from "lucide-react";
import useUserStatus from "@/lib/hooks/useUserStatus";

/* ── Floating profile cards — positioned well outside the title zone ── */
const floatingCards = [
  {
    id: "card-1",
    name: "Marie Dupont",
    role: "Ingénieure Logiciel",
    initials: "MD",
    color: "bg-blue-100 text-blue-700",
    /* top-left, well above the headline */
    style: { top: "14%", left: "3%" },
    animation: "animate-float",
  },
  {
    id: "card-2",
    name: "Paul Renard",
    role: "Product Designer",
    initials: "PR",
    color: "bg-purple-100 text-purple-700",
    /* bottom-left, well below the buttons */
    style: { bottom: "16%", left: "3%" },
    animation: "animate-float-slow",
  },
  {
    id: "card-3",
    name: "Amina Kone",
    role: "Chef de Projet",
    initials: "AK",
    color: "bg-amber-100 text-amber-700",
    /* top-right, well above the headline */
    style: { top: "14%", right: "3%" },
    animation: "animate-float-delayed",
  },
  {
    id: "card-4",
    name: "Lucas Martin",
    role: "Responsable RH",
    initials: "LM",
    color: "bg-green-100 text-green-700",
    /* bottom-right, well below the buttons */
    style: { bottom: "16%", right: "3%" },
    animation: "animate-float",
  },
];

export default function HeroSection() {
  const { user } = useUserStatus();

  return (
    <section className="relative min-h-[88vh] flex flex-col items-center justify-center overflow-hidden bg-white pt-10 pb-6">
      {/* ── Soft radial green glow in center ───── */}
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      {/* ── Subtle grid overlay ─────────────────── */}
      <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />

      {/* ── Floating profile cards (desktop only) ── */}
      <div className="hidden lg:block">
        {floatingCards.map((card) => (
          <div
            key={card.id}
            className={`profile-card absolute ${card.animation} z-10`}
            style={card.style}
            data-testid={card.id}
          >
            {/* Avatar circle */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${card.color}`}
            >
              {card.initials}
            </div>
            {/* Name + role */}
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {card.name}
              </p>
              <p className="text-xs text-gray-500">{card.role}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main hero content ────────────────────── */}
      <div className="relative z-20 max-w-3xl mx-auto text-center px-4">
        {/* Headline */}
        <h1
          className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6"
          data-testid="hero-heading"
        >
          Créez le CV Parfait
          <br />
          Avec{" "}
          <span className="text-shimmer">l&apos;Intelligence</span>
          <br />
          <span className="text-gray-400 font-extrabold">Artificielle</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
          Saisissez vos expériences en vrac, notre IA les transforme en CV
          professionnel optimisé pour les recruteurs et les systèmes ATS.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {user ? (
            <Link
              href="/create"
              className="btn-primary text-base px-8 py-3.5"
              data-testid="start-building-cta"
            >
              <FileText className="w-4 h-4 mr-2" />
              Commencer mon CV
            </Link>
          ) : (
            <Link
              href="/register"
              className="btn-primary text-base px-8 py-3.5"
              data-testid="get-started-cta"
            >
              Commencer gratuitement
            </Link>
          )}
          <Link
            href="/create"
            className="btn-dark text-base px-8 py-3.5"
            data-testid="demo-link"
          >
            <Play className="w-4 h-4 mr-2 fill-white" />
            Voir la démo
          </Link>
        </div>

        {/* Social proof strip */}
        <div className="mt-10 flex items-center justify-center gap-2.5 text-sm text-gray-400">
          <div className="flex -space-x-2">
            {[
              { initials: "MD", color: "bg-blue-100 text-blue-700" },
              { initials: "PR", color: "bg-purple-100 text-purple-700" },
              { initials: "AK", color: "bg-amber-100 text-amber-700" },
              { initials: "LM", color: "bg-green-100 text-green-700" },
            ].map((a, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-full ${a.color} border-2 border-white flex items-center justify-center text-[9px] font-bold`}
              >
                {a.initials}
              </div>
            ))}
          </div>
          <span>
            Rejoignez{" "}
            <strong className="text-gray-700">100+</strong> professionnels qui
            nous font confiance
          </span>
        </div>
      </div>
    </section>
  );
}
