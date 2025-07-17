import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, unlink, access, mkdir } from "fs/promises";
import { join } from "path";
import { CVFormData } from "@/types";

export const runtime = "nodejs";

/**
 * Nouvelle API de parsing PDF utilisant Python
 * Remplace complètement l'ancien système
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Récupération du fichier
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("❌ Aucun fichier fourni");
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // 2. Validation du type de fichier
    if (!file.type.includes("pdf")) {
      console.error("❌ Type de fichier non supporté:", file.type);
      return NextResponse.json(
        { success: false, error: "Seuls les fichiers PDF sont supportés" },
        { status: 400 }
      );
    }

    // 3. Validation de la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error("❌ Fichier trop volumineux:", file.size);
      return NextResponse.json(
        { success: false, error: "Le fichier ne doit pas dépasser 10MB" },
        { status: 400 }
      );
    }

    console.log(`📄 Fichier reçu: ${file.name} (${file.size} bytes)`);

    // 4. Sauvegarde temporaire du fichier
    const fileBytes = await file.arrayBuffer();
    const buffer = Buffer.from(fileBytes);

    const tempFileName = `temp_cv_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}.pdf`;
    const tempFilePath = join(process.cwd(), "tmp", tempFileName);
    const tmpPath = join(process.cwd(), "tmp");

    // Création du dossier tmp si nécessaire
    try {
      // Check if the tmp folder already exists
      await access(tmpPath);
      console.log("✅ tmp folder already exists");
    } catch (error) {
      // If the folder doesn't exist, create it
      try {
        await mkdir(tmpPath, { recursive: true });
        console.log("✅ tmp folder created successfully");
      } catch (mkdirError) {
        console.error("❌ Error creating tmp folder:", mkdirError);
        return NextResponse.json(
          { success: false, error: "Erreur lors de la creation de tmp directoire" },
          { status: 500 }
        );
      }
    }

    try {
      await writeFile(tempFilePath, buffer);
      console.log(`📁 Fichier temporaire créé: ${tempFilePath}`);
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde temporaire:", error);
      return NextResponse.json(
        { success: false, error: "Erreur lors de la sauvegarde du fichier" },
        { status: 500 }
      );
    }

    // 5. Appel du script Python de parsing
    console.log("🐍 Lancement du parser Python...");
    const parsedData = await runPythonParser(tempFilePath);

    // 6. Nettoyage du fichier temporaire
    try {
      await unlink(tempFilePath);
      console.log("🗑️ Fichier temporaire supprimé");
    } catch (error) {
      console.warn("⚠️ Impossible de supprimer le fichier temporaire:", error);
    }

    // 7. Validation et formatage des données
    const formattedData = formatParsedData(parsedData);

    console.log("✅ Parsing terminé avec succès");
    console.log("📊 Données extraites:", {
      personalInfo: Object.keys(formattedData.personalInfo).length,
      experiences: formattedData.experiences.length,
      education: formattedData.education.length,
      skills: formattedData.skills.length,
      languages: formattedData.languages?.length || 0,
    });

    return NextResponse.json({
      success: true,
      parsedData: formattedData,
      textLength: JSON.stringify(parsedData).length,
      source: "cv-genius-python-parser",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors du parsing:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne lors du parsing du CV",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * Exécute le script Python de parsing
 */
async function runPythonParser(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = join(process.cwd(), "scripts", "pdf_parser.py");

    // Utiliser le parser amélioré
    const improvedScript = join(
      process.cwd(),
      "scripts",
      "pdf_parser_improved.py"
    );
    const venvPython = join(process.cwd(), "venv", "bin", "python");

    console.log(`🐍 Exécution: ${venvPython} ${improvedScript} ${filePath}`);

    const pythonProcess = spawn(venvPython, [improvedScript, filePath], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: process.cwd(),
      env: {
        ...process.env,
        PYTHONPATH: join(
          process.cwd(),
          "venv",
          "lib",
          "python3.12",
          "site-packages"
        ),
      },
    });

    let stdout = "";
    let stderr = "";

    // Collecte des données de sortie
    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Gestion de la fin du processus
    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          // Parse la sortie JSON du script Python
          const result = JSON.parse(stdout);
          console.log("✅ Script Python terminé avec succès");
          resolve(result);
        } catch (parseError) {
          console.error("❌ Erreur lors du parsing JSON:", parseError);
          console.error("📤 Sortie brute du script:", stdout);
          reject(new Error(`Erreur de parsing JSON: ${parseError}`));
        }
      } else {
        console.error(`❌ Script Python terminé avec le code ${code}`);
        console.error("📤 Erreur stderr:", stderr);
        reject(new Error(`Script Python échoué (code ${code}): ${stderr}`));
      }
    });

    // Gestion des erreurs du processus
    pythonProcess.on("error", (error) => {
      console.error(
        "❌ Erreur lors du lancement du script Python (venv):",
        error
      );
      console.log("🔄 Tentative avec python3 système...");

      // Fallback avec python3 système
      try {
        const fallbackProcess = spawn("python3", [improvedScript, filePath], {
          stdio: ["pipe", "pipe", "pipe"],
          cwd: process.cwd(),
        });

        let fallbackStdout = "";
        let fallbackStderr = "";

        fallbackProcess.stdout.on("data", (data) => {
          fallbackStdout += data.toString();
        });

        fallbackProcess.stderr.on("data", (data) => {
          fallbackStderr += data.toString();
        });

        fallbackProcess.on("close", (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(fallbackStdout);
              console.log("✅ Fallback Python3 réussi");
              resolve(result);
            } catch (parseError) {
              reject(
                new Error(`Erreur de parsing JSON (fallback): ${parseError}`)
              );
            }
          } else {
            reject(
              new Error(
                `Échec complet Python (code ${code}): ${fallbackStderr}`
              )
            );
          }
        });

        fallbackProcess.on("error", (fallbackError) => {
          reject(
            new Error(
              `Python indisponible (venv: ${error.message}, système: ${fallbackError.message})`
            )
          );
        });
      } catch (fallbackError) {
        reject(new Error(`Impossible de lancer Python: ${error.message}`));
      }
    });

    // Timeout de sécurité (30 secondes)
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error("Timeout: Le parsing a pris trop de temps"));
    }, 30000);
  });
}

/**
 * Formate les données parsées pour correspondre à l'interface CVFormData
 */
function formatParsedData(rawData: any): CVFormData {
  console.log("🔧 Formatage des données parsées...");

  // Assure que toutes les propriétés existent et sont du bon type
  const formatted: CVFormData = {
    personalInfo: {
      name: rawData.personalInfo?.name || "",
      email: rawData.personalInfo?.email || "",
      phone: rawData.personalInfo?.phone || "",
      location: rawData.personalInfo?.location || "",
      linkedin: rawData.personalInfo?.linkedin || "",
      website: rawData.personalInfo?.website || "",
    },
    experiences: (rawData.experiences || []).map((exp: any, index: number) => ({
      id: exp.id || `exp-${Date.now()}-${index}`,
      company: exp.company || "",
      position: exp.position || "",
      location: exp.location || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      description: exp.description || "",
      isCurrentPosition: exp.isCurrentPosition || false,
    })),
    education: (rawData.education || []).map((edu: any, index: number) => ({
      id: edu.id || `edu-${Date.now()}-${index}`,
      institution: edu.institution || "",
      degree: edu.degree || "",
      field: edu.field || "",
      startDate: edu.startDate || "",
      endDate: edu.endDate || "",
      description: edu.description || "",
    })),
    skills: (rawData.skills || []).map((skill: any, index: number) => ({
      id: skill.id || `skill-${Date.now()}-${index}`,
      name: skill.name || "",
      category: skill.category || "other",
      level: skill.level || "intermediate",
    })),
    languages: (rawData.languages || []).map((lang: any, index: number) => ({
      id: lang.id || `lang-${Date.now()}-${index}`,
      name: lang.name || "",
      level: lang.level || "B1",
    })),
  };

  console.log("✅ Données formatées avec succès");
  return formatted;
}

/**
 * Endpoint de test pour vérifier le bon fonctionnement
 */
export async function GET() {
  return NextResponse.json({
    message: "CV Genius PDF Parser API",
    version: "2.0.0",
    status: "active",
    supportedFormats: ["application/pdf"],
    maxFileSize: "10MB",
    features: [
      "Extraction d'informations personnelles",
      "Analyse des expériences professionnelles",
      "Extraction de la formation",
      "Détection des compétences techniques",
      "Reconnaissance des langues",
    ],
    timestamp: new Date().toISOString(),
  });
}
