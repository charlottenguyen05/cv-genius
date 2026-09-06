// /api/cv/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generatePDFBuffer } from '@/lib/resume-template/pdf-compiler';
import { CVFormData } from "@/types";
import {
  uploadPdfToStorageAdmin,
  createResumeAdmin,
} from "@/lib/supabase/server";
import {
  parseAndValidateCVRequest,
  createErrorResponse,
  AuthenticatedUser,
} from "@/lib/utils/apiRoutes";

/**
 * Main POST handler for CV generation
 */
export async function POST(req: NextRequest) {
  console.log("🚀 Starting CV generation API call");

  try {
    // 1. Parse and validate request
    const { user, cvData } = await parseAndValidateCVRequest(req);

    // 2. Generate PDF
    const pdfBuffer = await generatePDF(cvData);

    // 3. Handle file storage and database
    const { resumeId, pdfPath } = await handleFileStorageAndDatabase(
      user,
      cvData,
      pdfBuffer
    );

    // 4. Create success response
    const response = createSuccessResponse(resumeId, pdfPath);

    console.log("🎉 API call completed successfully, response:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 ERROR in CV generation API:");
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error("Full error object:", error);

    return createErrorResponse(error, 500);
  }
}

/**
 * Handles file upload to storage and database record creation
 */
async function handleFileStorageAndDatabase(
  user: AuthenticatedUser,
  cvData: CVFormData,
  pdfBuffer: Buffer
): Promise<{ resumeId: string; pdfPath: string }> {
  console.log("📄 PDF generated successfully, buffer size:", pdfBuffer.length);

  // Generate unique file path
  const filePath = generateFilePath(user.id, cvData.personalInfo.name);
  console.log("📁 Generated file path:", filePath);

  // Upload PDF buffer to Supabase storage
  console.log("☁️ Starting Supabase storage upload...");
  const uploadData = await uploadPdfToStorageAdmin(filePath, pdfBuffer);

  if (!uploadData?.path) {
    throw new Error("Failed to upload PDF to storage");
  }

  // Create resume record in database
  console.log("💾 Creating resume record in database...");
  const resumeData = {
    user_id: user.id,
    title: filePath,
    generated_content: uploadData.path,
    display_name: cvData.personalInfo.name || null,
    language: cvData.outputLanguage || null,
  };
  console.log("💾 Resume data to insert:", resumeData);

  const resume = await createResumeAdmin(resumeData);
  console.log("✅ Resume created successfully:", resume);

  // Verify resume creation
  if (!resume?.id) {
    console.error("❌ Resume created but no ID returned:", resume);
    throw new Error("Resume created but no ID returned from database");
  }

  return {
    resumeId: resume.id,
    pdfPath: uploadData.path,
  };
}

/**
 * Generates a unique file path for the PDF
 */
function generateFilePath(userId: string, name?: string): string {
  const sanitizedName = name?.replace(/\s+/g, "_") || "CV";
  const randomSuffix = Math.floor(Math.random() * 100);
  const timestamp = Date.now();

  return `${userId}/CV_${sanitizedName}__${randomSuffix}_${timestamp}.pdf`;
}

/**
 * Creates a success response object
 */
function createSuccessResponse(resumeId: string, pdfPath: string) {
  return {
    success: true,
    resumeId,
    pdfPath,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Main PDF generation function
 */
async function generatePDF(cvData: CVFormData): Promise<Buffer> {
  return generatePDFBuffer(cvData);
}
