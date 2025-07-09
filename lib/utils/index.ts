/**
 * Utilitaires génériques pour l'application CV Genius
 */

/**
 * Fonction utilitaire pour combiner les classes CSS avec Tailwind
 * TODO: Installer clsx et tailwind-merge puis décommenter
 */
export function cn(...inputs: string[]) {
  return inputs.filter(Boolean).join(' ')
}

/**
 * Formater une date en français
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Valider un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}


/**
 * Nettoyer et formater du texte
 */
export function cleanText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

/**
 * Générer un ID unique simple
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Débounce une fonction
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
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