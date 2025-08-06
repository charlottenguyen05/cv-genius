/**
 * Utilitaires génériques pour l'application CV Genius
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Fonction utilitaire pour combiner les classes CSS avec Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumber: /\d/,
};

export function validatePassword(password: string) {
  const errors = [];
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push("Au moins 8 caractères");
  }
  if (!PASSWORD_REQUIREMENTS.hasUpperCase.test(password)) {
    errors.push("Au moins une majuscule");
  }
  if (!PASSWORD_REQUIREMENTS.hasLowerCase.test(password)) {
    errors.push("Au moins une minuscule");
  }
  if (!PASSWORD_REQUIREMENTS.hasNumber.test(password)) {
    errors.push("Au moins un chiffre");
  }
  return { isValid: errors.length === 0, errors };
}