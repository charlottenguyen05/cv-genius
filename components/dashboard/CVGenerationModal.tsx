"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Brain,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface CVGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (pdfBlob: Blob, filename: string, resumeId?: string) => void;
  cvData: any;
}

interface GenerationStep {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "error";
  icon: React.ReactNode;
  details?: string;
}

export default function CVGenerationModal({
  isOpen,
  onClose,
  onComplete,
  cvData,
}: CVGenerationModalProps) {
  const router = useRouter();
  const [steps, setSteps] = useState<GenerationStep[]>([
    {
      id: "validation",
      label: "Validation des données",
      status: "pending",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "ai-improvement",
      label: "Amélioration par IA",
      status: "pending",
      icon: <Brain className="w-5 h-5" />,
    },
    {
      id: "pdf-generation",
      label: "Génération PDF",
      status: "pending",
      icon: <Download className="w-5 h-5" />,
    },
  ]);

  const [aiResponse, setAiResponse] = useState<string>("");
  const [currentAiStep, setCurrentAiStep] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [resumeId, setResumeId] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState(false);

  // Fonction pour mettre à jour le statut d'une étape
  const updateStepStatus = (
    stepId: string,
    status: GenerationStep["status"],
    details?: string
  ) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status, details } : step
      )
    );
  };

  // Simulation du streaming de l'IA pour le debug
  const simulateAIStreaming = (text: string) => {
    const words = text.split(" ");
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setAiResponse(
          (prev) => prev + (currentIndex === 0 ? "" : " ") + words[currentIndex]
        );
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  };

  // Fonction séparée pour la génération PDF
  const generatePDF = async (improvedCVData: any) => {
    // Étape 3: Génération PDF
    updateStepStatus("pdf-generation", "running");
    setCurrentAiStep("Génération du PDF professionnel...");

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    const pdfResponse = await fetch("/api/cv/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Pass the authorization header
        ...(session?.access_token && {
          "Authorization": `Bearer ${session.access_token}`
        })
      },
      body: JSON.stringify({ cvData: improvedCVData }),
    });

    if (!pdfResponse.ok) {
      const errorData = await pdfResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Erreur lors de la génération PDF");
    }

    // Récupération du résultat
    const result = await pdfResponse.json();
    if (!result.success) {
      throw new Error(result.error || "Erreur lors de la génération PDF");
    }

    setResumeId(result.resumeId);
    updateStepStatus("pdf-generation", "completed", "PDF généré avec succès");
    setCurrentAiStep("✅ CV généré avec succès !");
    setIsCompleted(true);

    // Call onComplete callback with resume ID
    console.log('CVGenerationModal: About to call onComplete callback', { 
      hasOnComplete: !!onComplete, 
      resumeId: result.resumeId, 
      filename: result.filename 
    });
    
    if (onComplete) {
      onComplete(new Blob(), result.filename || 'cv.pdf', result.resumeId);
      console.log('CVGenerationModal: onComplete callback called successfully');
    } else {
      console.log('CVGenerationModal: No onComplete callback provided');
    }
  };

  // Fonction principale de génération
  const startGeneration = async () => {
    if (!cvData || isGenerating) return;

    setIsGenerating(true);
    setError("");
    setAiResponse("");
    setIsCompleted(false);

    try {
      // Étape 1: Validation
      updateStepStatus("validation", "running");
      setCurrentAiStep("Vérification des données du CV...");

      if (!cvData.personalInfo?.name || !cvData.personalInfo?.email) {
        throw new Error("Nom et email requis pour générer le CV");
      }

      updateStepStatus(
        "validation",
        "completed",
        "Données validées avec succès"
      );

      // Étape 2: Amélioration IA
      updateStepStatus("ai-improvement", "running");
      setCurrentAiStep("Connexion à Gemini AI...");

      // Simulation du streaming pour l'affichage
      const cleanup = simulateAIStreaming(
        `Amélioration du profil professionnel de ${cvData.personalInfo.name}. ` +
          `Optimisation des descriptions d'expériences, renforcement des compétences clés, ` +
          `adaptation du vocabulaire pour les systèmes ATS, quantification des réalisations...`
      );

      // Appel réel à l'API
      setCurrentAiStep("Amélioration du contenu par IA...");
      const { data: { session } } = await supabase.auth.getSession();
      const aiResponse = await fetch("/api/cv/complete-improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Pass the authorization header
          ...(session?.access_token && {
            "Authorization": `Bearer ${session.access_token}`
          })
        },
        body: JSON.stringify({ formData: cvData }),
      });

      const aiResult = await aiResponse.json();
      if (!aiResult.success) {
        throw new Error(aiResult.error || "Erreur lors de l'amélioration IA");
      }

      console.log(
        "Amelioration CV response:",
        JSON.stringify(aiResult, null, 2)
      );

      cleanup();
      updateStepStatus("ai-improvement", "completed", "CV amélioré par l'IA");

      // Appel de la fonction séparée pour générer le PDF
      await generatePDF(aiResult.improvedCV);

    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");

      // Marquer l'étape courante en erreur
      const currentStep = steps.find((step) => step.status === "running");
      if (currentStep) {
        updateStepStatus(
          currentStep.id,
          "error",
          error instanceof Error ? error.message : "Erreur inconnue"
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Navigate to preview page
  const handlePreview = () => {
    if (resumeId) {
      router.push(`/preview/${resumeId}`);
      onClose();
    }
  };

  // Démarrer la génération quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && cvData && !isGenerating) {
      startGeneration();
    }
  }, [isOpen, cvData]);

  // Reset quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setSteps((prev) =>
        prev.map((step) => ({ ...step, status: "pending", details: undefined }))
      );
      setAiResponse("");
      setCurrentAiStep("");
      setIsGenerating(false);
      setError("");
      setResumeId("");
      setIsCompleted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStepIcon = (step: GenerationStep) => {
    switch (step.status) {
      case "running":
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
        );
    }
  };

  const getStepTextColor = (status: GenerationStep["status"]) => {
    switch (status) {
      case "running":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div
      data-testid="cv-generation-modal"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div
          data-testid="cv-generation-modal-header"
          className="flex items-center justify-between p-6 border-b"
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Génération de votre CV
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isCompleted ? "Génération terminée!" : "Amélioration par IA en cours..."}
            </p>
          </div>
          <Button
            data-testid="cv-generation-modal-close"
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-none"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Steps Progress */}
          <div className="space-y-4 mb-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                data-testid={`cv-generation-step-${step.id}`}
                className="flex items-start space-x-3"
              >
                <div className="flex-shrink-0 mt-1">{getStepIcon(step)}</div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-medium ${getStepTextColor(step.status)}`}
                  >
                    {step.label}
                  </div>
                  {step.details && (
                    <div className="text-sm text-gray-600 mt-1">
                      {step.details}
                    </div>
                  )}
                </div>
                {step.status === "running" && (
                  <div className="text-sm text-blue-600 font-medium">
                    En cours...
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Success Actions */}
          {isCompleted && resumeId && (
            <div
              data-testid="cv-generation-success-actions"
              className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4"
            >
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-700 font-medium">
                  CV généré avec succès !
                </span>
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={handlePreview}
                  className="flex items-center space-x-3 px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-300 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  data-testid="preview-cv-button"
                >
                  <Eye className="w-6 h-6" />
                  <span>Voir le CV</span>
                </Button>
              </div>
            </div>
          )}

          {/* Current AI Step */}
          {currentAiStep && !isCompleted && (
            <div
              data-testid="cv-generation-current-ai-step"
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
            >
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">
                  {currentAiStep}
                </span>
              </div>
            </div>
          )}

          {/* AI Response Stream */}
          {aiResponse && !isCompleted && (
            <div
              data-testid="cv-generation-ai-response"
              className="bg-gray-50 border rounded-lg p-4 mb-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">
                  Amélioration IA en temps réel:
                </span>
              </div>
              <div className="text-sm text-gray-600 leading-relaxed">
                {aiResponse}
                {isGenerating &&
                  steps.find((s) => s.id === "ai-improvement")?.status ===
                    "running" && (
                    <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1"></span>
                  )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div
              data-testid="cv-generation-error"
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  Erreur lors de la génération
                </span>
              </div>
              <div className="text-sm text-red-600 mt-1">{error}</div>
              <button
                data-testid="cv-generation-retry"
                onClick={startGeneration}
                className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          data-testid="cv-generation-modal-footer"
          className="bg-gray-50 px-6 py-4 border-t"
        >
          <div className="flex items-center justify-between">
            <div
              data-testid="cv-generation-status"
              className="text-sm text-gray-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Génération en cours...
                </>
              ) : error ? (
                "Génération échouée"
              ) : isCompleted ? (
                "✅ Génération terminée avec succès!"
              ) : (
                "En attente..."
              )}
            </div>
            <div className="text-sm text-gray-500">Powered by Gemini AI</div>
          </div>
        </div>
      </div>
    </div>
  );
}
