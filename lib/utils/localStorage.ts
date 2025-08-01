/**
 * Utility functions for managing CV form data persistence in localStorage
 * Used for authentication flow to preserve user input across login/register
 */

import { CVFormData } from "@/types";

const CV_FORM_STORAGE_KEY = "cv_genius_pending_form_data";

/**
 * Store CV form data in localStorage
 */
export const storeCVFormData = (formData: CVFormData): void => {
  try {
    const dataToStore = {
      formData,
      timestamp: Date.now(),
    };
    localStorage.setItem(CV_FORM_STORAGE_KEY, JSON.stringify(dataToStore));
    console.log("CV form data stored in localStorage");
  } catch (error) {
    console.error("Failed to store CV form data:", error);
  }
};

/**
 * Retrieve CV form data from localStorage
 */
export const getCVFormData = (): CVFormData | null => {
  try {
    const stored = localStorage.getItem(CV_FORM_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Check if data is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - parsed.timestamp > maxAge) {
      localStorage.removeItem(CV_FORM_STORAGE_KEY);
      return null;
    }

    console.log("CV form data retrieved from localStorage");
    return parsed.formData;
  } catch (error) {
    console.error("Failed to retrieve CV form data:", error);
    return null;
  }
};

/**
 * Clear CV form data from localStorage
 */
export const clearCVFormData = (): void => {
  try {
    localStorage.removeItem(CV_FORM_STORAGE_KEY);
    console.log("CV form data cleared from localStorage");
  } catch (error) {
    console.error("Failed to clear CV form data:", error);
  }
};

/**
 * Check if there is stored CV form data
 */
export const hasCVFormData = (): boolean => {
  try {
    const stored = localStorage.getItem(CV_FORM_STORAGE_KEY);
    return stored !== null;
  } catch (error) {
    console.error("Failed to check for CV form data:", error);
    return false;
  }
};
