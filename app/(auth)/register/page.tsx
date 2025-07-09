"use client";
import { useState } from "react";
import useAuthForm from "@/lib/hooks/useAuthForm";
import Toast from "@/components/ui/Toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const INPUT_CLASSES =
    "w-full px-3 py-2 border rounded-full focus:outline-none focus:ring focus:border-blue-400";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-gray-800"
        aria-label="Register form"
        // 🔧 SUGGESTION: Ajouter data-testid pour les tests E2E
        data-testid="register-form"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Créer un compte</h1>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
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
            // 🔧 SUGGESTION: Ajouter data-testid pour les tests
            data-testid="email-input"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
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
            // 🔧 SUGGESTION: Ajouter validation en temps réel
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            data-testid="password-input"
          />
          {/* Indicateur de force du mot de passe */}
          <div className="mt-2">
            <div className="text-xs text-gray-600">
              Exigences du mot de passe:
            </div>
            <ul className="text-xs text-gray-500 mt-1">
              <li
                className={
                  password.length >= 8 ? "text-green-600" : "text-red-500"
                }
              >
                ✓ Au moins 8 caractères
              </li>
              <li
                className={
                  /[A-Z]/.test(password) ? "text-green-600" : "text-red-500"
                }
              >
                ✓ Une majuscule
              </li>
              <li
                className={
                  /[a-z]/.test(password) ? "text-green-600" : "text-red-500"
                }
              >
                ✓ Une minuscule
              </li>
              <li
                className={
                  /\d/.test(password) ? "text-green-600" : "text-red-500"
                }
              >
                ✓ Un chiffre
              </li>
            </ul>
          </div>
        </div>
        {error && (
          <div className="mb-4 text-red-800" role="alert" data-testid="password-alert">
            {error}
          </div>
        )}

        {/* 🔧 SUGGESTION: Ajouter confirmation de mot de passe */}
        <div className="mb-4">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
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
              className="text-red-500 text-xs mt-1"
              data-testid="password-not-equivalent"
            >
              Les mots de passe ne correspondent pas
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          disabled={loading || password !== confirmPassword}
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>

        <div className="mt-4 text-center text-sm">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Se connecter
          </Link>
        </div>
      </form>
      {showToast && (
        <Toast
          message="Compte créé avec succès ! Veuillez-vous confirmer votre email. Vous
          pouvez désormais vous connecter."
          onClose={() => router.push("/login")}
        />
      )}
    </div>
  );
}
