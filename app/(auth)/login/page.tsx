"use client";
import Link from "next/link";
import Toast from "@/components/ui/Toast";
import useAuthForm from "@/lib/hooks/useAuthForm";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

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
    "w-full px-3 py-2 border rounded-full focus:outline-none focus:ring focus:border-blue-400";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-gray-800"
        aria-label="Login form"
        data-testid="login-form"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Connexion</h1>
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
          <div className="mb-4 text-red-600 text-sm" role="alert">
            {error}
          </div>
        )}
        <Button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          disabled={loading}
          data-testid="submit-button"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
        <div className="mt-4 text-center">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </form>
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
