"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import useUserStatus from "@/lib/hooks/useUserStatus";
import { signOut } from "@/lib/supabase/client";

export default function Header() {
  const { user, isLoading } = useUserStatus();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    /* Outer strip — transparent, just for sticky positioning */
    <header className="sticky top-0 z-40 flex justify-center px-4 py-3 bg-transparent">
      {/*
        Inner pill — matches Hirslams reference:
        white background, border, rounded-full, shadow
        flex: logo | centre links | right buttons
      */}
      <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-full shadow-md px-5 py-2.5 flex items-center justify-between">

        {/* ── Logo (left) ──────────────────────────────── */}
        <Link
          href="/"
          className="flex items-center gap-2 group flex-shrink-0"
          data-testid="logo-link"
        >
          <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black text-gray-900 tracking-tight">
            CV <span className="text-primary-500">Genius</span>
          </span>
        </Link>

        {/* ── Centre navigation links ───────────────────── */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${pathname === "/"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            data-testid="home-link"
            aria-label="Accueil"
          >
            <Home className="w-4 h-4" />
          </Link>

          <Link
            href="/create"
            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${pathname === "/create"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            data-testid="create-center-link"
          >
            Créer mon CV
          </Link>

          <Link
            href="/dashboard"
            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${pathname === "/dashboard"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            data-testid="dashboard-center-link"
          >
            Mon espace
          </Link>
        </nav>

        {/* ── Right: Auth buttons ───────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLoading ? (
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-full" />
              <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-full" />
            </div>
          ) : user ? (
            <>
              {/* <Link
                href="/create"
                className="hidden sm:inline-flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 active:scale-95"
                data-testid="create-link"
              >
                Créer mon CV
              </Link> */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-sm rounded-full border border-gray-200 bg-white hover:bg-gray-50 px-5 py-2 font-medium text-gray-700hidden sm:inline-flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 active:scale-95"
                data-testid="signout-button"
              >
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-dark text-white text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 hover:bg-gray-800 active:scale-95"
                data-testid="login-link"
              >
                Connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
