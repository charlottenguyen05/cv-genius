"use client";

import React from "react";
import { FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import useUserStatus from "@/lib/hooks/useUserStatus";
import { signOut } from "@/lib/supabase/client";

export default function Header() {
  const { user, isLoading } = useUserStatus();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="border-b bg-white backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">CV Genius</h1>
          </Link>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="animate-pulse">Chargement...</div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="btn-secondary"
                  data-testid="dashboard-link"
                >
                  Mon espace
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  data-testid="signout-button"
                >
                  Déconnexion
                </Button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-secondary text-sm px-4 py-2 rounded-full"
                  data-testid="login-link"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm px-4 py-2 rounded-full"
                  data-testid="register-link"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
