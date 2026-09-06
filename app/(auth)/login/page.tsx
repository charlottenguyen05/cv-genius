"use client";
import Link from "next/link";
import Toast from "@/components/ui/Toast";
import useAuthForm from "@/lib/hooks/useAuthForm";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleSubmit,
    showToast,
  } = useAuthForm("login");

  const INPUT_CLASSES =
    "w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white transition-all duration-200 text-gray-900 placeholder:text-gray-400";

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-tint relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <p className="section-label">// Connexion //</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-2">
            Bon retour !
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Connectez-vous pour accéder à vos CVs
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-gray-800"
          aria-label="Login form"
          data-testid="login-form"
        >
          <div className="mb-5">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className={INPUT_CLASSES}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              data-testid="email-input"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className={INPUT_CLASSES}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              data-testid="password-input"
            />
          </div>
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm" role="alert">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="btn-primary w-full py-3 text-base justify-center disabled:opacity-50"
            disabled={loading}
            data-testid="submit-button"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>

          <div className="mt-4 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <span className="text-sm text-gray-500">Pas encore de compte ? </span>
            <Link
              href="/register"
              className="text-sm text-primary-600 hover:text-primary-800 font-semibold transition-colors"
            >
              Créer un compte
            </Link>
          </div>
        </form>
      </div>

      {showToast && (
        <Toast
          data-testid="successful-login-toast"
          message="Connexion réussie. Redirection vers votre espace."
          onClose={() => router.push("/dashboard")}
        />
      )}
    </div>
  );
}
