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
            Téléchargez votre CV existant ou remplissez le formulaire manuellement
          </p>
          {parsedData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                ✅ Fichier analysé avec succès ! Les données ont été automatiquement pré-remplies dans le formulaire.
              </p>
              <p className="text-green-600 text-sm mt-1">
                Vérifiez et modifiez les informations ci-dessous selon vos besoins.
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
                Créez la version finale de votre CV professionnel
              </p>
            </div>
            <button
              onClick={() => handleSubmit(uploadedFile, setFileError)}
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Génération...' : 'Générer le CV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
