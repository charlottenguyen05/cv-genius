import { supabase } from "@/lib/supabase/client";
import { CVContent } from "@/types";

class CVGenerationService {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`
      })
    };
  }

  async improveCV(cvData: CVContent): Promise<{ success: boolean; improvedCV?: CVContent; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch('/api/cv/complete-improve', {
        method: 'POST',
        headers,
        body: JSON.stringify({ formData: cvData }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'amélioration IA');
      }

      return {
        success: true,
        improvedCV: result.improvedCV,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async generatePDF(improvedCVData: CVContent) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch('/api/cv/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ cvData: improvedCVData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la génération PDF');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la génération PDF');
      }

      return {
        success: true,
        resumeId: result.resumeId,
        filename: result.filename || 'cv.pdf',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la génération PDF',
      };
    }
  }

  validateCVData(cvData: CVContent): { isValid: boolean; error?: string } {
    if (!cvData.personalInfo?.name || !cvData.personalInfo?.email) {
      return {
        isValid: false,
        error: 'Nom et email requis pour générer le CV',
      };
    }

    return { isValid: true };
  }
}

export const cvGenerationService = new CVGenerationService(); 