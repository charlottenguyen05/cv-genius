"use client";

import React from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Brain,
  Eye,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "../ui/Button";
import { GenerationStep, CVGenerationModalProps } from "@/types/cvGeneration";
import { useCVGeneration } from "@/lib/hooks/useCVGeneration";

export default function CVGenerationModal({
  isOpen,
  onClose,
  onComplete,
  cvData,
}: CVGenerationModalProps) {
  // Use the custom hook for all state management and business logic
  const {
    steps,
    aiResponse,
    currentAiStep,
    isGenerating,
    error,
    resumeId,
    isCompleted,
    startGeneration,
    handlePreview,
  } = useCVGeneration({
    isOpen,
    cvData,
    onComplete,
    onClose,
  });

  if (!isOpen) return null;

  const getStepIcon = (step: GenerationStep) => {
    // First check status-based icons
    switch (step.status) {
      case "running":
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        // Return default icon based on step type
        switch (step.id) {
          case "validation":
            return <FileText className="w-5 h-5 text-gray-400" />;
          case "ai-improvement":
            return <Brain className="w-5 h-5 text-gray-400" />;
          case "pdf-generation":
            return <Download className="w-5 h-5 text-gray-400" />;
          default:
            return (
              <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
            );
        }
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
              {isCompleted
                ? "Génération terminée!"
                : "Amélioration par IA en cours..."}
            </p>
          </div>
          <button
            data-testid="cv-generation-modal-close"
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-none"
          >
            <X className="w-6 h-6" />
          </button>
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
              <div className="text-sm text-red-600 mt-1">{error.message}</div>
              {error.step && (
                <div className="text-xs text-red-500 mt-1">
                  Étape: {error.step}
                </div>
              )}
              {error.code && (
                <div className="text-xs text-red-500 mt-1">
                  Code: {error.code}
                </div>
              )}
              <Button
                data-testid="cv-generation-retry"
                onClick={startGeneration}
                className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
              >
                Réessayer
              </Button>
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
