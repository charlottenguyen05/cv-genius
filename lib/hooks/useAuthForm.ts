"use client";
import { useState } from "react";
import { signIn, signUp } from "../supabase/client";
import { validatePassword } from "../utils";
import { UseAuthFormReturn } from "@/types";

export default function useAuthForm(
  mode: "login" | "register"
): UseAuthFormReturn {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const authFunction = mode === "login" ? signIn : signUp;

  const handleSubmit = async (e: React.FormEvent) => {
    let passwordError = false;
    e.preventDefault();
    setError("");
    setLoading(true);
    if (mode === "register") {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setError(
          `Mot de passe invalide: ${passwordValidation.errors.join(", ")}`
        );
        passwordError = true;
        setLoading(false);
      }
      setShowToast(true);
    }
    if (!passwordError) {
      try {
        const { error: authError } = await authFunction(email, password);
        if (authError) {
          setError(authError.message);
        } else {
          setShowToast(true);
        }
      } catch (e) {
        setError("Erreur de connexion. Vérifiez votre connexion internet.");
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleSubmit,
    showToast,
    setShowToast,
  };
}
