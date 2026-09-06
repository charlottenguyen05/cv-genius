"use client";
import { useState } from "react";
import useAuthForm from "@/lib/hooks/useAuthForm";
import Toast from "@/components/ui/Toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";


export default function RegisterPage() {
  const router = useRouter();
  const [confirmPassword, setConfirmPassword] = useState("");
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleSubmit,
    showToast,
  } = useAuthForm("register");

  const handleRedirect = () => {
    router.push("/dashboard");
  }

  const INPUT_CLASSES =
    "w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white transition-all duration-200 text-gray-900 placeholder:text-gray-400";

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-tint relative overflow-hidden py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <p className="section-label">// Inscription //</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-2">
            Créer un compte
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Rejoignez des centaines de professionnels
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-gray-800"
          aria-label="Register form"
          data-testid="register-form"
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
              autoComplete="new-password"
              required
              className={INPUT_CLASSES}
              value={password}
              placeholder="Votre mot de passe"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              data-testid="password-input"
            />
            {/* Indicateur de force du mot de passe */}
            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-xs font-semibold text-gray-500 mb-2">
                Exigences du mot de passe :
              </div>
              <ul className="space-y-1 text-xs">
                <li className={password.length >= 8 ? "text-primary-600" : "text-gray-400"}>
                  {password.length >= 8 ? "✓" : "○"} Au moins 8 caractères
                </li>
                <li className={/[A-Z]/.test(password) ? "text-primary-600" : "text-gray-400"}>
                  {/[A-Z]/.test(password) ? "✓" : "○"} Une majuscule
                </li>
                <li className={/[a-z]/.test(password) ? "text-primary-600" : "text-gray-400"}>
                  {/[a-z]/.test(password) ? "✓" : "○"} Une minuscule
                </li>
                <li className={/\d/.test(password) ? "text-primary-600" : "text-gray-400"}>
                  {/\d/.test(password) ? "✓" : "○"} Un chiffre
                </li>
              </ul>
            </div>
          </div>
          {error && (
            <div
              className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm"
              role="alert"
              data-testid="password-alert"
            >
              {error}
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              className={INPUT_CLASSES}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre mot de passe"
              data-testid="cfpassword-input"
            />
            {confirmPassword && password !== confirmPassword && (
              <div
                className="text-red-500 text-xs mt-1.5"
                data-testid="password-not-equivalent-alert"
              >
                Les mots de passe ne correspondent pas
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3 text-base justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || password !== confirmPassword}
            data-testid="submit-button"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center text-sm">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-800 font-semibold transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </form>
      </div>

      {showToast && (
        <Toast
          data-testid="successful-register-toast"
          message="Compte créé avec succès ! Veuillez-vous confirmer votre email. Vous
          pouvez désormais vous connecter."
          onClose={handleRedirect}
        />
      )}
    </div>
  );
}


