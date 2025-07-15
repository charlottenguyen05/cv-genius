import { GoogleGenAI } from "@google/genai";
import { CVFormData } from '@/types'

/**
 * Service pour interagir avec l'API Gemini de Google
 * Utilise la nouvelle librairie @google/genai
 */
export class GeminiService {
  private ai: GoogleGenAI

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || ''
    if (!key) {
      throw new Error('Gemini API key is required')
    }
    this.ai = new GoogleGenAI({ apiKey: key })
  }

  /**
   * Améliore un CV complet - FLOW PRINCIPAL
   * Prend un JSON de CV et retourne un JSON amélioré
   */
  async improveCompleteCV(cvData: CVFormData): Promise<CVFormData> {
    const masterPrompt = `Tu es un expert en rédaction de CV et en optimisation professionnelle. Tu vas améliorer ce CV en appliquant les meilleures techniques de rédaction de CV modernes.

INSTRUCTIONS CRITIQUES :
- Tu DOIS retourner UNIQUEMENT un JSON valide contenant le CV amélioré
- AUCUN texte d'introduction, AUCUN commentaire, AUCUN "Voici votre CV amélioré"
- GARDE EXACTEMENT la même structure JSON
- Améliore SEULEMENT le contenu, PAS la structure
- Utilise des verbes d'action puissants
- Quantifie les réalisations quand possible
- Optimise pour les ATS (Applicant Tracking Systems)
- Adapte au marché français
- Rends chaque phrase plus percutante et professionnelle

CV À AMÉLIORER :
${JSON.stringify(cvData, null, 2)}

RETOURNE UNIQUEMENT LE JSON AMÉLIORÉ :`

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: masterPrompt,
      })
      
      // Récupère le texte de la réponse
      if (!response.text) {
        throw new Error('Aucun contenu généré par Gemini')
      }
      let content = response.text.trim()
      
      // Nettoie la réponse pour extraire seulement le JSON
      const jsonStart = content.indexOf('{')
      const jsonEnd = content.lastIndexOf('}') + 1
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        content = content.substring(jsonStart, jsonEnd)
      }
      
      // Parse et valide le JSON
      const improvedCV = JSON.parse(content)
      
      // Validation basique de la structure
      if (!improvedCV.personalInfo || !improvedCV.experiences || !improvedCV.education || !improvedCV.skills) {
        throw new Error('Structure JSON invalide retournée par Gemini')
      }
      
      return improvedCV as CVFormData
    } catch (error) {
      console.error('Erreur lors de l\'amélioration du CV:', error)
      throw new Error('Impossible d\'améliorer le CV: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
  }

  /**
   * Améliore du contenu spécifique (section par section)
   */
  async improveCVContent(rawContent: string, section: string): Promise<string> {
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

Contenu amélioré:`

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
      })
      
      if (!response.text) {
        throw new Error('Aucun contenu généré par Gemini')
      }
      return response.text.trim()
    } catch (error) {
      console.error('Erreur lors de l\'amélioration du contenu:', error)
      throw new Error('Impossible d\'améliorer le contenu: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
  }

  /**
   * Génère une description professionnelle à partir de mots-clés
   */
  async generateFromKeywords(keywords: string[], jobTitle: string): Promise<string> {
    const prompt = `Génère une description professionnelle pour un poste de "${jobTitle}" en utilisant ces mots-clés:
${keywords.join(', ')}

La description doit être:
- Professionnelle et percutante
- Adaptée au marché français
- Entre 2-4 lignes
- Utiliser des verbes d'action
- Quantifier quand possible

Description:`

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
      })
      
      if (!response.text) {
        throw new Error('Aucun contenu généré par Gemini')
      }
      return response.text.trim()
    } catch (error) {
      console.error('Erreur lors de la génération:', error)
      throw new Error('Impossible de générer la description: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
  }

  /**
   * Génère du contenu général (fonction utilitaire)
   */
  async generateContent(prompt: string, model: string = "gemini-2.0-flash-exp"): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
      })
      
      if (!response.text) {
        throw new Error('Aucun contenu généré par Gemini')
      }
      return response.text.trim()
    } catch (error) {
      console.error('Erreur lors de la génération de contenu:', error)
      throw new Error('Impossible de générer le contenu: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
  }
}

// Instance par défaut
export const geminiService = new GeminiService()

// Helper pour les API routes
export const createGeminiService = (apiKey?: string) => {
  return new GeminiService(apiKey)
} 