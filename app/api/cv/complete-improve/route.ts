import { NextRequest, NextResponse } from "next/server";
import { geminiService } from "@/lib/gemini/service";
import type { CVFormData } from "@/types";
import { parseAndValidateCVRequest, createErrorResponse, logCVDataSummary } from "@/lib/utils/apiRoutes";

// Tell Vercel/AWS Lambda this function may take up to 60 seconds
// (Gemini AI calls can take 15-30s for large CVs)
export const maxDuration = 60;

/**
 * API pour améliorer un CV complet avec Gemini
 * Prend un CV JSON et retourne un CV amélioré JSON
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request
    const { cvData } = await parseAndValidateCVRequest(request);
    
    logCVDataSummary(cvData, "reçues pour amélioration");

    // 2. Improve CV with Gemini
    const improvedCV = await improveCVWithGemini(cvData);

    // 3. Validate improved CV structure
    validateImprovedCV(improvedCV);

    // 4. Create success response
    const response = createImprovementSuccessResponse(improvedCV);
    
    console.log("✅ Amélioration terminée avec succès!");
    logCVDataSummary(improvedCV, "améliorées");
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Erreur lors de l'amélioration du CV:", error);
    return createErrorResponse(error, 500);
  }
}

/**
 * Improves CV data using Gemini service
 */
async function improveCVWithGemini(cvData: CVFormData): Promise<CVFormData> {
  console.log("🤖 Amélioration du CV avec Gemini...");
  
  try {
    const improvedCV = await geminiService.improveCompleteCV(cvData);
    console.log("✅ CV amélioré par Gemini avec succès");
    return improvedCV;
  } catch (geminiError) {
    console.error("❌ Erreur Gemini:", geminiError);
    throw new Error("GEMINI_IMPROVEMENT_FAILED");
  }
}

/**
 * Validates the improved CV structure
 */
function validateImprovedCV(improvedCV: CVFormData): void {
  if (!improvedCV.personalInfo || !improvedCV.experiences || !improvedCV.education || !improvedCV.skills) {
    console.error("❌ Structure JSON invalide retournée par Gemini");
    throw new Error("INVALID_IMPROVED_CV_STRUCTURE");
  }
}

/**
 * Creates a success response for CV improvement
 */
function createImprovementSuccessResponse(improvedCV: CVFormData) {
  return {
    success: true,
    improvedCV,
    timestamp: new Date().toISOString(),
    source: "cv-genius-gemini-improvement",
  };
}
