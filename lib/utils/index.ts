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

/**
 * Formats a date to French locale
 */
export function formatDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Cleans text by trimming, replacing multiple spaces, and capitalizing first letter
 */
export function cleanText(text: string): string {
  if (!text) return text;
  
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned.length === 0) return cleaned;
  
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Debounces a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
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