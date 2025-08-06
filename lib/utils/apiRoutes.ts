import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { CVFormData } from "@/types";

/**
 * Authenticated user data
 */
export interface AuthenticatedUser {
  id: string;
  email?: string;
}

/**
 * Parsed and validated CV request data
 */
export interface ValidatedCVRequest {
  user: AuthenticatedUser;
  cvData: CVFormData;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

/**
 * Authenticates user using authorization header
 */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser> {
  console.log("👤 Getting current user...");
  
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    console.log("Auth failed:", authError?.message || "No user (unauthenticated)");
    throw new Error("UNAUTHORIZED");
  }

  return {
    id: user.id,
    email: user.email,
  };
}

/**
 * Parses and validates CV data from request body
 */
export async function parseAndValidateCVData(request: NextRequest): Promise<CVFormData> {
  console.log("📥 Parsing request body...");
  
  const body = await request.json();
  
  // Handle both possible request formats
  const cvData: CVFormData = body.cvData || body.formData;
  
  if (!cvData) {
    throw new Error("CV_DATA_MISSING");
  }

  // Validate essential data
  if (!cvData.personalInfo?.name || !cvData.personalInfo?.email) {
    console.log("❌ Validation failed: Missing name or email");
    console.log("Name:", cvData?.personalInfo?.name);
    console.log("Email:", cvData?.personalInfo?.email);
    throw new Error("VALIDATION_FAILED");
  }

  console.log("✅ Request parsed and validated successfully");
  console.log("📋 CV Data received:", {
    name: cvData.personalInfo.name,
    email: cvData.personalInfo.email,
    experiencesCount: cvData.experiences?.length || 0,
    educationCount: cvData.education?.length || 0,
    skillsCount: cvData.skills?.length || 0,
    languagesCount: cvData.languages?.length || 0,
  });

  return cvData;
}

/**
 * Combines authentication and CV data parsing
 */
export async function parseAndValidateCVRequest(request: NextRequest): Promise<ValidatedCVRequest> {
  const user = await authenticateUser(request);
  const cvData = await parseAndValidateCVData(request);
  
  return { user, cvData };
}

/**
 * Creates standardized error responses
 */
export function createErrorResponse(error: unknown, status: number = 500): NextResponse {
  if (error instanceof Error) {
    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json(
          { success: false, error: "Utilisateur non authentifié" },
          { status: 401 }
        );
      case "CV_DATA_MISSING":
        return NextResponse.json(
          { success: false, error: "Données CV requises" },
          { status: 400 }
        );
      case "VALIDATION_FAILED":
        return NextResponse.json(
          { success: false, error: "Nom et email requis" },
          { status: 400 }
        );
      case "GEMINI_IMPROVEMENT_FAILED":
        return NextResponse.json(
          {
            success: false,
            error: "Erreur lors de l'amélioration du CV",
            details: "Service d'amélioration temporairement indisponible",
          },
          { status: 500 }
        );
      case "INVALID_IMPROVED_CV_STRUCTURE":
        return NextResponse.json(
          {
            success: false,
            error: "Structure JSON invalide retournée par l'IA",
          },
          { status: 500 }
        );
      default:
        console.error("❌ Unexpected error:", error.message);
        return NextResponse.json(
          {
            success: false,
            error: "Erreur interne du serveur",
            details: error.message,
          },
          { status }
        );
    }
  }

  console.error("❌ Unknown error:", error);
  return NextResponse.json(
    {
      success: false,
      error: "Erreur interne du serveur",
      details: "Erreur inconnue",
    },
    { status }
  );
}

/**
 * Logs CV data summary for debugging
 */
export function logCVDataSummary(cvData: CVFormData, action: string = "received"): void {
  console.log(`📊 CV Data ${action}:`, {
    personalInfo: Object.keys(cvData.personalInfo || {}).length,
    experiences: cvData.experiences?.length || 0,
    education: cvData.education?.length || 0,
    skills: cvData.skills?.length || 0,
    languages: cvData.languages?.length || 0,
  });
}