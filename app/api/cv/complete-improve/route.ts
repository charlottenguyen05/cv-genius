import { NextRequest, NextResponse } from "next/server";
import { geminiService } from "@/lib/gemini/service";
import type { CVFormData } from "@/types";

/**
 * API pour améliorer un CV complet avec Gemini
 * Prend un CV JSON et retourne un CV amélioré JSON
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Récupération des données du CV
    const body = await request.json();
    const { formData: cvData }: { formData: CVFormData } = body;

    if (!cvData) {
      console.error("❌ Aucune donnée CV fournie");
      return NextResponse.json(
        { success: false, error: "Données CV requises" },
        { status: 400 }
      );
    }

    // 2. Validation des données essentielles
    if (!cvData.personalInfo?.name || !cvData.personalInfo?.email) {
      console.error("❌ Informations personnelles incomplètes");
      return NextResponse.json(
        { success: false, error: "Nom et email requis" },
        { status: 400 }
      );
    }

    console.log("📊 Données CV reçues pour amélioration:", {
      personalInfo: Object.keys(cvData.personalInfo).length,
      experiences: cvData.experiences?.length || 0,
      education: cvData.education?.length || 0,
      skills: cvData.skills?.length || 0,
      languages: cvData.languages?.length || 0,
    });

    // 3. Amélioration du CV avec Gemini
    console.log("🤖 Amélioration du CV avec Gemini...");
    let improvedCV: CVFormData;

    try {
      improvedCV = await geminiService.improveCompleteCV(cvData);
      console.log("✅ CV amélioré par Gemini avec succès");
    } catch (geminiError) {
      console.error("❌ Erreur Gemini:", geminiError);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de l'amélioration du CV",
          details:
            geminiError instanceof Error
              ? geminiError.message
              : "Erreur inconnue",
        },
        { status: 500 }
      );
    }

    // 4. Validation de la réponse améliorée
    if (
      !improvedCV.personalInfo ||
      !improvedCV.experiences ||
      !improvedCV.education ||
      !improvedCV.skills
    ) {
      console.error("❌ Structure JSON invalide retournée par Gemini");
      return NextResponse.json(
        {
          success: false,
          error: "Structure JSON invalide retournée par l'IA",
        },
        { status: 500 }
      );
    }

    console.log("✅ Amélioration terminée avec succès!");
    console.log("📊 Données améliorées:", {
      personalInfo: Object.keys(improvedCV.personalInfo).length,
      experiences: improvedCV.experiences?.length || 0,
      education: improvedCV.education?.length || 0,
      skills: improvedCV.skills?.length || 0,
      languages: improvedCV.languages?.length || 0,
    });

    // 5. Retourne le CV amélioré
    return NextResponse.json({
      success: true,
      improvedCV,
      timestamp: new Date().toISOString(),
      source: "cv-genius-gemini-improvement",
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'amélioration du CV:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne lors de l'amélioration du CV",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
