// /api/cv/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
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
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Page margins and dimensions
  const margins = {
    left: 20,
    right: 20,
    top: 20,
    bottom: 20,
  };

  const maxLineLength = 100; // Maximum characters per line

  let currentY = margins.top;
  const lineHeight = 5; // Base line height
  const sectionSpacing = lineHeight; // Double spacing between sections

  // Font sizes
  const fontSize = {
    name: 16,
    section: 12,
    content: 10,
    small: 9,
  };

  // Add custom font support if needed (using default fonts for simplicity)
  doc.setFont("helvetica");

  // Helper function to wrap text to max line length
  const wrapText = (
    text: string,
    maxLength: number = maxLineLength
  ): string[] => {
    if (!text || text.length <= maxLength) return [text || ""];

    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  };

  // Helper function to add text with automatic wrapping
  const addWrappedText = (
    text: string,
    x: number,
    y: number,
    fontSize: number,
    isBold: boolean = false
  ): number => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");

    const lines = wrapText(text, maxLineLength);
    let currentYPos = y;

    for (const line of lines) {
      doc.text(line, x, currentYPos);
      currentYPos += lineHeight;
    }

    return currentYPos;
  };

  // Helper function to create bullet points from text with \n
  const addBulletPoints = (
    text: string,
    x: number,
    y: number,
    fontSize: number
  ): number => {
    if (!text) return y;

    const bulletPoints = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let currentYPos = y;

    for (const point of bulletPoints) {
      const bulletText = `• ${point}`;
      currentYPos = addWrappedText(bulletText, x, currentYPos, fontSize);
    }

    return currentYPos;
  };

  // Helper function to add section header
  const addSectionHeader = (title: string, y: number): number => {
    doc.setFontSize(fontSize.section);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margins.left, y);

    // Add underline
    const textWidth = doc.getTextWidth(title.toUpperCase());
    doc.line(margins.left, y + 1, margins.left + textWidth, y + 1);

    return y + lineHeight + 2;
  };

  // 1. PERSONAL INFO SECTION
  const personalInfo = cvData.personalInfo;

  // Name (large, bold)
  doc.setFontSize(fontSize.name);
  doc.setFont("helvetica", "bold");
  doc.text(personalInfo.name || "", margins.left, currentY);
  currentY += lineHeight;

  // Contact information (smaller, on multiple lines if needed)
  doc.setFontSize(fontSize.content);
  doc.setFont("helvetica", "normal");

  const contactInfo = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
    personalInfo.website,
  ]
    .filter((info) => info && info.trim())
    .join(" | ");

  currentY = addWrappedText(
    contactInfo,
    margins.left,
    currentY,
    fontSize.content
  );
  currentY += sectionSpacing;

  // 2. EXPERIENCE SECTION
  if (cvData.experiences && cvData.experiences.length > 0) {
    const experienceTitle =
      cvData.experiences.length > 1
        ? "EXPÉRIENCES PROFESSIONNELLES"
        : "EXPÉRIENCE PROFESSIONNELLE";
    currentY = addSectionHeader(experienceTitle, currentY);

    for (const exp of cvData.experiences) {
      if (!exp.company || !exp.position) continue;

      // Company and position
      const expHeader = `${exp.position} - ${exp.company}`;
      currentY = addWrappedText(
        expHeader,
        margins.left,
        currentY,
        fontSize.content,
        true
      );

      // Date and location
      const dateLocation = [
        exp.startDate,
        exp.endDate || (exp.isCurrentPosition ? "Présent" : ""),
        exp.location,
      ]
        .filter((info) => info && info.trim())
        .join(" | ");

      if (dateLocation) {
        currentY = addWrappedText(
          dateLocation,
          margins.left,
          currentY,
          fontSize.small
        );
      }

      // Description with bullet points
      if (exp.description) {
        currentY = addBulletPoints(
          exp.description,
          margins.left + 5,
          currentY,
          fontSize.content
        );
      }

      currentY += lineHeight; // Space between experiences
    }

    currentY += sectionSpacing;
  }

  // 3. EDUCATION SECTION
  if (cvData.education && cvData.education.length > 0) {
    const educationTitle =
      cvData.education.length > 1 ? "FORMATIONS" : "FORMATION";
    currentY = addSectionHeader(educationTitle, currentY);

    for (const edu of cvData.education) {
      if (!edu.institution || !edu.degree) continue;

      // Degree and institution
      const eduHeader = `${edu.degree} - ${edu.institution}`;
      currentY = addWrappedText(
        eduHeader,
        margins.left,
        currentY,
        fontSize.content,
        true
      );

      // Field, dates
      const eduDetails = [edu.field, edu.startDate, edu.endDate]
        .filter((info) => info && info.trim())
        .join(" | ");

      if (eduDetails) {
        currentY = addWrappedText(
          eduDetails,
          margins.left,
          currentY,
          fontSize.small
        );
      }

      // Description with bullet points if available
      if (edu.description) {
        currentY = addBulletPoints(
          edu.description,
          margins.left + 5,
          currentY,
          fontSize.content
        );
      }

      currentY += lineHeight; // Space between education entries
    }

    currentY += sectionSpacing;
  }

  /**
   * Helper function: Groups skills by category from the form data.
   */
  const groupByCat = (skills?: CVFormData["skills"]) => {
    if (!skills) return [];
    const skillMap = skills.reduce((map, s) => {
      // Use "Compétences Techniques" or "Autres" as default categories
      const cat =
        s.category === "technical"
          ? "Compétences Techniques"
          : s.category || "Autres";
      map.set(cat, [...(map.get(cat) || []), s.name!]);
      return map;
    }, new Map<string, string[]>());

    return Array.from(skillMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cat, list]) => ({ cat: cat.toUpperCase(), list }));
  };

  // 4. SKILLS SECTION
  if (cvData.skills && cvData.skills.length > 0) {
    currentY = addSectionHeader("COMPÉTENCES", currentY);

    const skillsByCategory = groupByCat(cvData.skills);

    for (const { cat, list } of skillsByCategory) {
      // Category name
      currentY = addWrappedText(
        cat + ":",
        margins.left,
        currentY,
        fontSize.content,
        true
      );

      // Skills list
      const skillsText = list.join(", ");
      currentY = addWrappedText(
        skillsText,
        margins.left + 5,
        currentY,
        fontSize.content
      );
      currentY += lineHeight; // Space between categories
    }

    currentY += sectionSpacing;
  }

  // 5. LANGUAGES SECTION
  if (cvData.languages && cvData.languages.length > 0) {
    currentY = addSectionHeader("LANGUES", currentY);

    for (const lang of cvData.languages) {
      if (!lang.name) continue;

      const langText = `${lang.name}${lang.level ? ` (${lang.level})` : ""}`;
      currentY = addWrappedText(
        langText,
        margins.left,
        currentY,
        fontSize.content
      );
    }
  }

  // Convert to buffer
  const pdfData = doc.output("arraybuffer");
  return Buffer.from(pdfData);
}
