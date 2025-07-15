'use client'

import React from 'react'
import { useFileUpload } from '@/lib/hooks/useFileUpload'
import { useCVForm } from '@/lib/hooks/useCVForm'
import FileUploadSection from '@/components/dashboard/FileUploadSection'
import CVFormSections from '@/components/dashboard/CVFormSections'

export default function DashboardPage() {
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
    handleSubmit,
    showToast,
    setShowToast,
    error,
    showCard,
    setShowCard
  } = useCVForm()

  // File upload functionality with auto-integration
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
    setFileError
  } = useFileUpload(loadParsedData) // Auto-fill form when data is parsed

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Créer votre CV professionnel
          </h1>
          <p className="text-lg text-gray-600">
            Téléchargez votre CV existant pour pré-remplir automatiquement le formulaire, ou remplissez-le manuellement
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">
              🤖 Nouveau flow automatique
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Une fois le formulaire complété, cliquez sur "Générer le CV" pour obtenir automatiquement votre CV amélioré par IA en PDF.
            </p>
          </div>
          {parsedData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                ✅ Fichier analysé avec succès ! Les données ont été automatiquement pré-remplies dans le formulaire.
              </p>
              <p className="text-green-600 text-sm mt-1">
                Vérifiez et modifiez les informations ci-dessous selon vos besoins, puis générez votre CV amélioré.
              </p>
            </div>
          )}
        </div>

                 {/* File Upload Section */}
         <FileUploadSection
           uploadedFile={uploadedFile}
           isDragOver={isDragOver}
           errors={errors}
           setIsDragOver={setIsDragOver}
           handleDrop={handleDrop}
           handleFileInput={handleFileInput}
           removeFile={removeFile}
           isUploading={isUploading}
           parsedData={parsedData}
         />

        {/* CV Form Sections */}
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

        {/* Submit Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Générer votre CV amélioré
              </h3>
              <p className="text-sm text-gray-600">
                Votre CV sera automatiquement amélioré par IA et téléchargé en PDF
              </p>
              {!formData.personalInfo.name && (
                <p className="text-sm text-orange-600 mt-1">
                  ⚠️ Remplissez au minimum votre nom et email pour continuer
                </p>
              )}
            </div>
            <button
              onClick={() => handleSubmit(null, () => {})}
              disabled={isSubmitting || !formData.personalInfo.name || !formData.personalInfo.email}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Génération...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Générer le CV
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
