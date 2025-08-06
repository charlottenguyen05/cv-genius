import { supabase } from "@/lib/supabase/client";
import { CVFormData } from "@/types";
import {
  CVGenerationError,
  GenerationResult,
  GenerationStepId,
} from "@/types/cvGeneration";

class CVGenerationService {
  public cleanup: (() => void) | null = null;

  private async getAuthHeaders() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
    };
  }

  /**
   * Validates CV data before generation
   */
  validateCVData(cvData: CVFormData): { isValid: boolean; error?: string } {
    if (!cvData.personalInfo?.name || !cvData.personalInfo?.email) {
      return {
        isValid: false,
        error: "Nom et email requis pour générer le CV",
      };
    }

    return { isValid: true };
  }

  /**
   * Improve CV content using AI
   */
  async improveCV(
    cvData: CVFormData
  ): Promise<{ success: boolean; improvedCV?: CVFormData; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch("/api/cv/complete-improve", {
        method: "POST",
        headers,
        body: JSON.stringify({ formData: cvData }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de l'amélioration IA");
      }

      console.log("Amelioration CV response:", JSON.stringify(result, null, 2));

      return {
        success: true,
        improvedCV: result.improvedCV,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Generate PDF from improved CV data
   */
  async generatePDF(improvedCVData: CVFormData): Promise<GenerationResult> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch("/api/cv/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ cvData: improvedCVData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la génération PDF");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la génération PDF");
      }

      return {
        success: true,
        resumeId: result.resumeId,
        filename: result.filename || "cv.pdf",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la génération PDF",
      };
    }
  }

  /**
   * Simulate AI streaming effect for user feedback
   */
  simulateAIStreaming(
    text: string,
    updateAiResponse: (response: string) => void
  ): () => void {
    const words = text.split(" ");
    let currentIndex = 0;
    let accumulatedText = "";

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        accumulatedText += (currentIndex === 0 ? "" : " ") + words[currentIndex];
        updateAiResponse(accumulatedText);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 200); // Faster streaming for better UX

    this.cleanup = () => clearInterval(interval);
    return this.cleanup;
  }

  /**
   * Generate stream text for AI improvement step
   */
  getAIStreamText(cvData: CVFormData): string {
    return (
      `Amélioration du profil professionnel de ${cvData.personalInfo.name}. ` +
      `Optimisation des descriptions d'expériences, renforcement des compétences clés, ` +
      `adaptation du vocabulaire pour les systèmes ATS, quantification des réalisations...`
    );
  }

  /** Helper function to create CVGenerationError objects */
  createCVGenerationError(
    message: string,
    options?: {
      code?: string;
      step?: GenerationStepId;
      details?: string;
      error?: Error;
    }
  ): CVGenerationError {
    return {
      message,
      code: options?.code || options?.error?.name || "UNKNOWN_ERROR",
      step: options?.step,
      details: options?.details || options?.error?.stack,
      timestamp: new Date(),
    };
  }

  /**
   * Cleanup any ongoing processes
   */
  stopStreaming(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}

export const cvGenerationService = new CVGenerationService();
