"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import AuthPopUp from "@/components/ui/AuthPopUp";
import CVGenerationModal from "@/components/ui/CVGenerationModal";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { useCVForm } from "@/lib/hooks/useCVForm";
import FileUploadSection from "@/components/dashboard/FileUploadSection";
import CVFormSections from "@/components/dashboard/CVFormSections";

export default function DashboardPage() {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // CV form functionality
  const {
    formData,
    isSubmitting,
    updatePersonalInfo,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addSkill,
    updateSkill,
    removeSkill,
    addLanguage,
    updateLanguage,
    removeLanguage,
    loadParsedData,
    showToast,
    setShowToast,
    error,
    showCard,
    setShowCard,
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
    removeFile
  } = useFileUpload(loadParsedData);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.personalInfo.name || !formData.personalInfo.email) {
      setShowToast(true);
      return;
    }
    
    // Ouvrir le modal au lieu d'appeler directement l'API
    setIsModalOpen(true);
  };

  // Fonction appelée quand la génération est terminée
  const handleGenerationComplete = (pdfBlob: Blob, filename: string) => {
    // Télécharger automatiquement le PDF
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Afficher le toast de succès
    setShowToast(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" data-testid="dashboard-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-8">
            <div className="mb-8" data-testid="dashboard-header">
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="dashboard-title">
                Améliorer votre CV avec l'IA
              </h1>
              <p className="text-gray-600" data-testid="dashboard-subtitle">
                Téléchargez votre CV et complétez les informations pour
                l'améliorer avec l'intelligence artificielle.
              </p>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg" data-testid="info-banner">
                <p className="text-blue-800 font-medium" data-testid="info-banner-title">
                  🤖 Nouveau flow avec modal en temps réel
                </p>
                <p className="text-blue-600 text-sm mt-1" data-testid="info-banner-description">
                  Une fois le formulaire complété, cliquez sur "Générer le CV"
                  pour voir l'amélioration par IA en temps réel dans un modal interactif.
                </p>
              </div>
              {parsedData && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="parsing-success-banner">
                  <p className="text-green-800 font-medium" data-testid="parsing-success-title">
                    ✅ CV analysé avec succès
                  </p>
                  <p className="text-green-600 text-sm mt-1" data-testid="parsing-success-description">
                    Les données de votre CV ont été extraites et pré-remplies
                    dans le formulaire. Vous pouvez les modifier avant de
                    générer la version améliorée.
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="space-y-8" data-testid="dashboard-content">
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

              {/* Sections du CV */}
              <div data-testid="cv-form-wrapper">
                <CVFormSections
                  formData={formData}
                  updatePersonalInfo={updatePersonalInfo}
                  addExperience={addExperience}
                  updateExperience={updateExperience}
                  removeExperience={removeExperience}
                  addEducation={addEducation}
                  updateEducation={updateEducation}
                  removeEducation={removeEducation}
                  addSkill={addSkill}
                  updateSkill={updateSkill}
                  removeSkill={removeSkill}
                  addLanguage={addLanguage}
                  updateLanguage={updateLanguage}
                  removeLanguage={removeLanguage}
                />
              </div>

              {/* Bouton de génération */}
              <div className="flex justify-center pt-8" data-testid="submit-section">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.personalInfo.name || !formData.personalInfo.email}
                  className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="generate-cv-button"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" data-testid="loading-spinner"></div>
                      <span data-testid="loading-text">Génération en cours...</span>
                    </>
                  ) : (
                    <span data-testid="generate-text">🚀 Générer le CV avec IA</span>
                  )}
                </Button>
              </div>

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
        cvData={formData}
      />

      {/* Toast de succès */}
      {showToast && (
        <Toast
          message="CV généré avec succès et téléchargé automatiquement!"
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
      <AuthPopUp isOpen={showCard} onClose={() => setShowCard(false)} />
    </div>
  );
}
