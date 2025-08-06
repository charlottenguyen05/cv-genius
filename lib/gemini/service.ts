import { GoogleGenAI } from "@google/genai";
import type { CVFormData } from "@/types";

/**
 * Service pour interagir avec l'API Gemini de Google
 */
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // L'API key est automatiquement récupérée de la variable d'environnement GEMINI_API_KEY
    this.ai = new GoogleGenAI({});
  }

  /**
   * Améliore un CV complet - FLOW PRINCIPAL
   * Prend un JSON de CV et retourne un JSON amélioré
   */
  async improveCompleteCV(cvData: CVFormData): Promise<CVFormData> {
    const masterPrompt = `Tu es un expert en rédaction de CV professionnel. Tu dois améliorer le CV fourni en respectant EXACTEMENT la structure JSON demandée.

RÈGLES ABSOLUES :
1. Tu DOIS retourner UNIQUEMENT un JSON valide, rien d'autre
2. GARDE EXACTEMENT la même structure que l'exemple ci-dessous
3. TOUS les champs obligatoires doivent être présents
4. Si une section est vide dans l'entrée, retourne un tableau vide []
5. N'ajoute AUCUN commentaire, AUCUN texte d'explication
6. Assure-toi que tous les IDs sont préservés ou générés de façon unique
7. Maximum 3 catégories différentes dans la section "skills"

AMÉLIORATIONS À APPORTER :
- Utilise des verbes d'action puissants (développé, optimisé, dirigé, etc.)
- Quantifie les résultats quand possible (%, montants, durées)
- Professionnalise le langage
- Optimise pour les ATS (mots-clés pertinents)
- Adapte au marché français
- Description pour "experiences" et "education" en 3-4 points clés séparées par seulement un retour à la ligne

STRUCTURE JSON OBLIGATOIRE :
{
  "personalInfo": {
    "name": "string",
    "email": "string", 
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "website": "string"
  },
  "experiences": [
    {
      "id": "string",
      "company": "string",
      "position": "string", 
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string",
      "isCurrentPosition": false
    }
  ],
  "education": [
    {
      "id": "string",
      "institution": "string",
      "degree": "string",
      "field": "string", 
      "startDate": "string",
      "endDate": "string",
      "description": "string"
    }
  ],
  "skills": [
    {
      "id": "string",
      "name": "string",
      "level": "string",
      "category": "string"
    }
  ],
  "languages": [
    {
      "id": "string", 
      "name": "string",
      "level": "string"
    }
  ]
}

CV À AMÉLIORER :
${JSON.stringify(cvData, null, 2)}

RETOURNE UNIQUEMENT LE JSON AMÉLIORÉ (aucun autre texte) :`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: masterPrompt,
      });

      // response.text : content of the response send back by Gemini
      if (!response.text) {
        throw new Error("Aucun contenu généré par Gemini");
      }

      let improvedCV: CVFormData;
      try {
        // Parse le JSON directement
        improvedCV = JSON.parse(response.text.trim());
      } catch (parseError) {
        console.error("Erreur de parsing JSON, tentative de nettoyage:", parseError);

        // Fallback: nettoie le contenu au cas où il y aurait du texte supplémentaire
        let content = response.text.trim();
        
        // Supprime les éventuels ```json et ``` 
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        
        const jsonStart = content.indexOf("{");
        const jsonEnd = content.lastIndexOf("}") + 1;

        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          content = content.substring(jsonStart, jsonEnd);
          try {
            improvedCV = JSON.parse(content);
          } catch (fallbackError) {
            console.error("Impossible de parser le JSON après nettoyage:", fallbackError);
            throw new Error(`Impossible de parser le JSON retourné par Gemini. Contenu: ${content.substring(0, 200)}...`);
          }
        } else {
          throw new Error(`Aucun JSON valide trouvé dans la réponse. Contenu: ${content.substring(0, 200)}...`);
        }
      }

      // Validation de la structure
      const validatedCV = this.validateAndFixCVStructure(improvedCV, cvData);
      
      return validatedCV;
    } catch (error) {
      console.error("Erreur lors de l'amélioration du CV:", error);
      throw new Error(
        "Impossible d'améliorer le CV: " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  }

  /**
   * Valide et corrige la structure du CV retourné par Gemini
   */
  private validateAndFixCVStructure(improvedCV: any, originalCV: CVFormData): CVFormData {
    // Assure que toutes les propriétés principales existent
    const fixed: CVFormData = {
      personalInfo: {
        name: improvedCV.personalInfo?.name || originalCV.personalInfo?.name || "",
        email: improvedCV.personalInfo?.email || originalCV.personalInfo?.email || "",
        phone: improvedCV.personalInfo?.phone || originalCV.personalInfo?.phone || "",
        location: improvedCV.personalInfo?.location || originalCV.personalInfo?.location || "",
        linkedin: improvedCV.personalInfo?.linkedin || originalCV.personalInfo?.linkedin || "",
        website: improvedCV.personalInfo?.website || originalCV.personalInfo?.website || "",
      },
      experiences: Array.isArray(improvedCV.experiences) ? improvedCV.experiences.map((exp: any, index: number) => ({
        id: exp.id || `exp-${Date.now()}-${index}`,
        company: exp.company || "",
        position: exp.position || "",
        location: exp.location || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate || "",
        description: exp.description || "",
        isCurrentPosition: Boolean(exp.isCurrentPosition),
      })) : [],
      education: Array.isArray(improvedCV.education) ? improvedCV.education.map((edu: any, index: number) => ({
        id: edu.id || `edu-${Date.now()}-${index}`,
        institution: edu.institution || "",
        degree: edu.degree || "",
        field: edu.field || "",
        startDate: edu.startDate || "",
        endDate: edu.endDate || "",
        description: edu.description || "",
      })) : [],
      skills: Array.isArray(improvedCV.skills) ? improvedCV.skills.map((skill: any, index: number) => ({
        id: skill.id || `skill-${Date.now()}-${index}`,
        name: skill.name || "",
        level: skill.level || "intermediate",
        category: skill.category || "other",
      })) : [],
      languages: Array.isArray(improvedCV.languages) ? improvedCV.languages.map((lang: any, index: number) => ({
        id: lang.id || `lang-${Date.now()}-${index}`,
        name: lang.name || "",
        level: lang.level || "B1",
      })) : [],
    };

    return fixed;
  }

  /**
   * Améliore du contenu spécifique (section par section)
   */
  async improveCVFormData(rawContent: string, section: string): Promise<string> {
    const prompt = `En tant qu'expert en rédaction de CV, réécris le contenu suivant pour le rendre plus professionnel, percutant et adapté au marché du travail français.

Section: ${section}
Contenu original:
${rawContent}

Instructions:
- Utilise un langage professionnel et des verbes d'action
- Quantifie les résultats quand c'est possible
- Adapte le contenu aux standards français
- Garde la même structure mais améliore la formulation
- Sois concis et impactant

Contenu amélioré:`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (!response.text) {
        throw new Error("Aucun contenu généré par Gemini");
      }

      return response.text.trim();
    } catch (error) {
      console.error("Erreur lors de l'amélioration du contenu:", error);
      throw new Error(
        "Impossible d'améliorer le contenu: " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  }

  /**
   * Génère une description professionnelle à partir de mots-clés
   */
  async generateFromKeywords(
    keywords: string[],
    jobTitle: string
  ): Promise<string> {
    const prompt = `Génère une description professionnelle pour un poste de "${jobTitle}" en utilisant ces mots-clés:
${keywords.join(", ")}

La description doit être:
- Professionnelle et percutante
- Adaptée au marché français
- Entre 2-4 lignes
- Utiliser des verbes d'action
- Quantifier quand possible

Description:`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (!response.text) {
        throw new Error("Aucun contenu généré par Gemini");
      }
      return response.text.trim();
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      throw new Error(
        "Impossible de générer la description: " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  }
}

// Instance par défaut
export const geminiService = new GeminiService();

// Helper pour les API routes
export const createGeminiService = () => {
  return new GeminiService();
};
