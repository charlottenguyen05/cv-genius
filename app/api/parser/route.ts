import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { NextRequest, NextResponse } from "next/server";
import { CVFormData } from "@/types";

export const runtime = "nodejs";

// Constants
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB — matches Lambda sync payload limit
const PYTHON_TIMEOUT = 30000; // 30 seconds
const SUPPORTED_FILE_TYPE = "pdf";

/**
 * Nouvelle API de parsing PDF utilisant Python
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract and validate file
    const file = await extractFileFromRequest(request);
    validateFile(file);
    logFileReceived(file);

    // 2. Read file to buffer directly (no temp file needed for Lambda)
    const fileBytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileBytes);

    // 3. Process file with Python parser (via Lambda)
    console.log("🐍 Lancement du parser Python (Lambda)...");
    const parsedData = await runPythonParser(fileBuffer);

    // 4. Format and return results
    const formattedData = formatParsedData(parsedData);
    logParsingSuccess(formattedData);

    return createSuccessResponse(formattedData, parsedData);
  } catch (error) {
    console.error("❌ Erreur lors du parsing:", error);
    return createErrorResponse(error);
  }
}

/**
 * Extracts file from the request form data
 */
async function extractFileFromRequest(request: NextRequest): Promise<File> {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    console.error("❌ Aucun fichier fourni");
    throw new Error("Aucun fichier fourni");
  }

  return file;
}

/**
 * Validates the uploaded file
 */
function validateFile(file: File): void {
  validateFileType(file);
  validateFileSize(file);
}

/**
 * Validates file type is PDF
 */
function validateFileType(file: File): void {
  if (!file.type.includes(SUPPORTED_FILE_TYPE)) {
    console.error("❌ Type de fichier non supporté:", file.type);
    throw new Error("Seuls les fichiers PDF sont supportés");
  }
}

/**
 * Validates file size is within limits
 */
function validateFileSize(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    console.error("❌ Fichier trop volumineux:", file.size);
    throw new Error("Le fichier ne doit pas dépasser 10MB");
  }
}

/**
 * Logs file reception information
 */
function logFileReceived(file: File): void {
  console.log(`📄 Fichier reçu: ${file.name} (${file.size} bytes)`);
}



/**
 * Logs parsing success with statistics
 */
function logParsingSuccess(formattedData: CVFormData): void {
  console.log("✅ Parsing terminé avec succès");
  console.log("📊 Données extraites:", {
    personalInfo: Object.keys(formattedData.personalInfo).length,
    experiences: formattedData.experiences.length,
    education: formattedData.education.length,
    projects: formattedData.projects?.length || 0,
    skills: formattedData.skills.length,
    languages: formattedData.languages?.length || 0,
  });
}

/**
 * Creates success response
 */
function createSuccessResponse(
  formattedData: CVFormData,
  rawData: any
): NextResponse {
  return NextResponse.json({
    success: true,
    parsedData: formattedData,
    textLength: JSON.stringify(rawData).length,
    source: "cv-genius-python-parser",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Creates error response
 */
function createErrorResponse(error: unknown): NextResponse {
  const errorMessage =
    error instanceof Error ? error.message : "Erreur inconnue";
  const statusCode = getErrorStatusCode(errorMessage);

  return NextResponse.json(
    {
      success: false,
      error: getErrorMessage(errorMessage),
      details: errorMessage,
    },
    { status: statusCode }
  );
}

/**
 * Determines appropriate status code for error
 */
function getErrorStatusCode(errorMessage: string): number {
  if (
    errorMessage.includes("fichier fourni") ||
    errorMessage.includes("PDF sont supportés") ||
    errorMessage.includes("10MB")
  ) {
    return 400;
  }
  return 500;
}

/**
 * Gets user-friendly error message
 */
function getErrorMessage(errorMessage: string): string {
  if (
    errorMessage.includes("fichier fourni") ||
    errorMessage.includes("PDF sont supportés") ||
    errorMessage.includes("10MB")
  ) {
    return errorMessage;
  }

  // Return specific error messages as-is if they are already user-friendly
  if (errorMessage.includes("Erreur lors de la creation de tmp directoire")) {
    return errorMessage;
  }

  if (errorMessage.includes("Erreur lors de la sauvegarde du fichier")) {
    return errorMessage;
  }

  // Specific error messages for test scenarios (original error conditions)
  if (
    errorMessage.includes("Directory not found") ||
    errorMessage.includes("Permission denied")
  ) {
    return "Erreur lors de la creation de tmp directoire";
  }

  if (errorMessage.includes("Write failed")) {
    return "Erreur lors de la sauvegarde du fichier";
  }

  return "Erreur interne lors du parsing du CV";
}

/**
 * Exécute le script Python de parsing via AWS Lambda
 */
async function runPythonParser(fileBuffer: Buffer): Promise<any> {
  // Guard against Lambda's 6 MB sync payload limit (base64 adds ~33% overhead)
  const MAX_PDF_BYTES = 4 * 1024 * 1024; // 4 MB raw
  if (fileBuffer.length > MAX_PDF_BYTES) {
    throw new Error(
      `PDF too large: ${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB. Maximum is 4 MB.`
    );
  }

  const pdf_base64 = fileBuffer.toString("base64");

  const lambdaClient = new LambdaClient({
    region: process.env.AWS_REGION ?? "eu-west-1",
  });

  const command = new InvokeCommand({
    FunctionName:
      process.env.PARSER_LAMBDA_FUNCTION_NAME ?? "cv-genius-pdf-parser",
    Payload: JSON.stringify({ pdf_base64 }),
  });

  console.log("🔗 Invoking Lambda PDF parser...");
  const response = await lambdaClient.send(command);

  const payloadString = Buffer.from(response.Payload!).toString("utf-8");
  const payload = JSON.parse(payloadString);

  if (payload.statusCode !== 200) {
    const errorBody =
      typeof payload.body === "string"
        ? JSON.parse(payload.body)
        : payload.body;
    throw new Error(
      `Lambda parser error: ${errorBody?.error ?? "Unknown error"}`
    );
  }

  return typeof payload.body === "string"
    ? JSON.parse(payload.body)
    : payload.body;
}


/**
 * Formate les données parsées pour correspondre à l'interface CVFormData
 */
function formatParsedData(rawData: any): CVFormData {
  console.log("🔧 Formatage des données parsées...");

  const formatted: CVFormData = {
    personalInfo: formatPersonalInfo(rawData.personalInfo),
    experiences: formatExperiences(rawData.experiences),
    education: formatEducation(rawData.education),
    projects: formatProjects(rawData.projects),
    skills: formatSkills(rawData.skills),
    languages: formatLanguages(rawData.languages),
  };

  console.log("✅ Données formatées avec succès");
  return formatted;
}

/**
 * Formats personal information data
 */
function formatPersonalInfo(personalInfo: any) {
  return {
    name: personalInfo?.name || "",
    email: personalInfo?.email || "",
    phone: personalInfo?.phone || "",
    location: personalInfo?.location || "",
    linkedin: personalInfo?.linkedin || "",
    website: personalInfo?.website || "",
  };
}

/**
 * Formats experiences data
 */
function formatExperiences(experiences: any[]) {
  return (experiences || []).map((exp: any, index: number) => ({
    id: exp.id || `exp-${Date.now()}-${index}`,
    company: exp.company || "",
    position: exp.position || "",
    location: exp.location || "",
    startDate: exp.startDate || "",
    endDate: exp.endDate || "",
    description: exp.description || "",
    isCurrentPosition: exp.isCurrentPosition || false,
  }));
}

/**
 * Formats education data
 */
function formatEducation(education: any[]) {
  return (education || []).map((edu: any, index: number) => ({
    id: edu.id || `edu-${Date.now()}-${index}`,
    institution: edu.institution || "",
    degree: edu.degree || "",
    field: edu.field || "",
    startDate: edu.startDate || "",
    endDate: edu.endDate || "",
    description: edu.description || "",
  }));
}

/**
 * Formats projects data
 */
function formatProjects(projects: any[]) {
  return (projects || []).map((proj: any, index: number) => ({
    id: proj.id || `proj-${Date.now()}-${index}`,
    name: proj.name || "",
    technologies: proj.technologies || "",
    startDate: proj.startDate || "",
    endDate: proj.endDate || "",
    description: proj.description || "",
  }));
}

/**
 * Formats skills data
 */
function formatSkills(skills: any[]) {
  return (skills || []).map((skill: any, index: number) => ({
    id: skill.id || `skill-${Date.now()}-${index}`,
    name: skill.name || "",
    category: skill.category || "other",
    level: skill.level || "intermediate",
  }));
}

/**
 * Formats languages data
 */
function formatLanguages(languages: any[]) {
  return (languages || []).map((lang: any, index: number) => ({
    id: lang.id || `lang-${Date.now()}-${index}`,
    name: lang.name || "",
    level: lang.level || "B1",
  }));
}
