"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import AuthPopUp from "@/components/ui/AuthPopUp";
import CVGenerationModal from "@/components/dashboard/CVGenerationModal";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { useCVForm } from "@/lib/hooks/useCVForm";
import FileUploadSection from "@/components/dashboard/FileUploadSection";
import LanguageSelector from "@/components/dashboard/LanguageSelector";
import CVFormSections from "@/components/dashboard/CVFormSections";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import {
  storeCVFormData,
  getCVFormData,
  clearCVFormData,
} from "@/lib/utils/localStorage";

export default function CreatePage() {
  const router = useRouter();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCard, setShowCard] = useState(false);

  // Language state
  const [outputLanguage, setOutputLanguage] = useState<'fr' | 'en'>('fr');

  // CV generation state
  const [generatedCvId, setGeneratedCvId] = useState<string | null>(null);
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);

  // CV form functionality
  const {
    formData,
    updatePersonalInfo,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addProject,
    updateProject,
    removeProject,
    addSkill,
    updateSkill,
    removeSkill,
    addLanguage,
    updateLanguage,
    removeLanguage,
    loadParsedData,
  } = useCVForm();

  // File upload functionality
  const {
    uploadedFile,
    isDragOver,
    errors,
    parsedData,
    isUploading,
    setIsDragOver,
    handleDrop,
    handleFileInput,
    removeFile,
  } = useFileUpload(loadParsedData);

  // Restore form data from localStorage on component mount (after authentication)
  useEffect(() => {
    const storedData = getCVFormData();
    if (storedData) {
      console.log("Restoring form data from localStorage after authentication");
      loadParsedData(storedData);
      clearCVFormData(); // Clear after restoration
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.personalInfo.name || !formData.personalInfo.email) {
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      // User is not authenticated, store form data and show auth popup
      storeCVFormData(formData);
      setShowCard(true);
      setIsSubmitting(false);
      return;
    }

    // User is authenticated, proceed with CV generation
    setIsModalOpen(true);
    setIsSubmitting(false);
  };

  // Fonction appelée quand la génération est terminée
  const handleGenerationComplete = (
    pdfBlob: Blob,
    filename: string,
    resumeId?: string
  ) => {
    console.log("handleGenerationComplete called with:", {
      filename,
      resumeId,
      hasPdfBlob: pdfBlob.size > 0,
    });

    if (resumeId) {
      setGeneratedCvId(resumeId);
      setIsGenerationComplete(true);
      console.log("Generation complete state updated:", {
        generatedCvId: resumeId,
        isGenerationComplete: true,
      });
    }

    // Afficher le toast de succès
    setShowToast(true);
  };

  return (
    <div className="min-h-screen bg-surface-tint relative overflow-hidden py-8" data-testid="dashboard-page">
      {/* Background decoration */}
      <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
          <div className="px-6 py-8">
            <div className="mb-8" data-testid="dashboard-header">
              <p className="section-label mb-2">// Créer un CV //</p>
              <h1
                className="text-3xl font-black text-gray-900 tracking-tight mb-2"
                data-testid="dashboard-title"
              >
                Améliorer votre CV avec l&apos;IA
              </h1>
              <p className="text-gray-500" data-testid="dashboard-subtitle">
                Téléchargez votre CV et complétez les informations pour
                l&apos;améliorer avec l&apos;intelligence artificielle.
              </p>
              {parsedData && (
                <div
                  className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-2xl"
                  data-testid="parsing-success-banner"
                >
                  <p
                    className="text-primary-800 font-semibold"
                    data-testid="parsing-success-title"
                  >
                    ✅ CV analysé avec succès
                  </p>
                  <p
                    className="text-primary-600 text-sm mt-1"
                    data-testid="parsing-success-description"
                  >
                    Les données de votre CV ont été extraites et pré-remplies
                    dans le formulaire. Vous pouvez les modifier avant de
                    générer la version améliorée.
                  </p>
                </div>
              )}
            </div>

            <form
              onSubmit={onSubmit}
              className="space-y-8"
              data-testid="dashboard-content"
            >
              {/* Section Upload */}
              <FileUploadSection
                uploadedFile={uploadedFile}
                isDragOver={isDragOver}
                errors={errors}
                isUploading={isUploading}
                setIsDragOver={setIsDragOver}
                handleDrop={handleDrop}
                handleFileInput={handleFileInput}
                removeFile={removeFile}
              />

              {/* Sélecteur de Langue */}
              <LanguageSelector
                value={outputLanguage}
                onChange={setOutputLanguage}
              />

              {/* Sections du CV */}
              <div data-testid="cv-form-wrapper">
                <CVFormSections
                  formData={formData}
                  updatePersonalInfo={updatePersonalInfo}
                  experienceHandlers={{
                    add: addExperience,
                    update: updateExperience,
                    remove: removeExperience,
                  }}
                  educationHandlers={{
                    add: addEducation,
                    update: updateEducation,
                    remove: removeEducation,
                  }}
                  projectHandlers={{
                    add: addProject,
                    update: updateProject,
                    remove: removeProject,
                  }}
                  skillHandlers={{
                    add: addSkill,
                    update: updateSkill,
                    remove: removeSkill,
                  }}
                  languageHandlers={{
                    add: addLanguage,
                    update: updateLanguage,
                    remove: removeLanguage,
                  }}
                />
              </div>

              {/* Bouton de génération */}
              <div
                className="flex justify-center pt-8"
                data-testid="submit-section"
              >
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.personalInfo.name ||
                    !formData.personalInfo.email
                  }
                  className="btn-primary text-lg px-10 py-4 gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  data-testid="generate-cv-button"
                >
                  {isSubmitting ? (
                    <>
                      <div
                        className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                        data-testid="loading-spinner"
                      ></div>
                      <span data-testid="loading-text">
                        Génération en cours...
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span data-testid="generate-text">
                        Générer le CV avec IA
                      </span>
                    </>
                  )}
                </Button>
              </div>

              {/* Section de prévisualisation après génération */}
              {isGenerationComplete && generatedCvId && (
                <div
                  className={`mt-8 p-6 bg-primary-50 border border-primary-200 rounded-3xl ${isModalOpen ? "opacity-75" : ""
                    }`}
                  data-testid="generation-success-section"
                >
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">✅</span>
                      </div>
                      <h3 className="text-xl font-bold text-primary-800 mb-2">
                        CV généré avec succès !
                      </h3>
                      <p className="text-primary-700 mb-4">
                        Votre CV a été créé et est prêt à être consulté !
                      </p>
                      <Button
                        onClick={() => router.push(`/preview/${generatedCvId}`)}
                        className="btn-primary px-6 py-3"
                        data-testid="view-cv-button"
                      >
                        Voir le CV
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Message d'information */}
              <div className="text-center" data-testid="submit-requirements">
                <p className="text-sm text-gray-500">
                  Minimum requis: <strong>nom</strong> et <strong>email</strong>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Plus vous fournissez d'informations, meilleur sera le résultat
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de génération */}
      <CVGenerationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleGenerationComplete}
        cvData={{ ...formData, outputLanguage }}
      />

      {/* Toast de succès */}
      {showToast && (
        <Toast
          message="CV généré avec succès!"
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Toast d'erreur */}
      {error && (
        <Toast
          message={error}
          type="error"
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Pop-up d'authentification */}
      <AuthPopUp
        isOpen={showCard}
        onClose={() => setShowCard(false)}
        formData={formData}
      />
    </div>
  );
}
