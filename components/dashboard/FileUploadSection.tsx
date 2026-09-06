import React from 'react'
import { Upload, FileText, Loader2, CheckCircle, User, Mail, Phone, Briefcase, GraduationCap, FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils'
import DeleteButton from '@/components/ui/DeleteButton'
import { CVFormData } from '@/types'

interface FileUploadSectionProps {
  uploadedFile: File | null
  isDragOver: boolean
  errors: Record<string, string>
  setIsDragOver: (isDragOver: boolean) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: () => void
  isUploading?: boolean
  parsedData?: CVFormData | null
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  uploadedFile,
  isDragOver,
  errors,
  setIsDragOver,
  handleDrop,
  handleFileInput,
  removeFile,
  isUploading = false,
  parsedData = null
}) => {
  return (
    <div className="space-y-6" data-testid="file-upload-section">
      <h2 className="text-xl font-bold text-gray-900 tracking-tight">1. Télécharger votre CV</h2>
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors",
          isDragOver 
            ? "border-primary-400 bg-primary-50" 
            : uploadedFile 
              ? "border-primary-400 bg-primary-50" 
              : "border-gray-200 hover:border-primary-300 bg-gray-50/50"
        )}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        data-testid="file-upload-zone"
      >
        {uploadedFile ? (
          <div className="space-y-4" data-testid="uploaded-file-display">
            <div className="flex items-center justify-center space-x-3">
              <FileText className="h-8 w-8 text-primary-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900" data-testid="uploaded-file-name">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500" data-testid="file-size">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <DeleteButton
                onClick={removeFile}
                variant="x"
                size="lg"
                ariaLabel="Supprimer le fichier"
                className="hover:bg-red-100"
                data-testid="remove-file-button"
              />
            </div>
            
            {/* État de chargement */}
            {isUploading && (
              <div className="flex items-center justify-center space-x-2 text-primary-600" data-testid="parsing-progress">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Analyse du CV en cours...</span>
              </div>
            )}
            
            {/* Succès du parsing */}
            {!isUploading && parsedData && (
              <div className="flex items-center justify-center space-x-2 text-primary-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">CV analysé avec succès!</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4" data-testid="file-upload-prompt">
            <Upload className="mx-auto h-12 w-12 text-primary-400" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Glissez votre CV ici ou cliquez pour sélectionner
              </p>
              <p className="text-sm text-gray-400">
                PDF ou TXT jusqu&apos;à 10MB
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
              data-testid="file-input"
            />
          </div>
        )}
      </div>
      
      {/* Affichage des erreurs */}
      {errors.file && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="file-error">
          <p className="text-sm text-red-600 font-medium">❌ {errors.file}</p>
        </div>
      )}
      
      {/* Affichage des données extraites */}
      {!isUploading && parsedData && !errors.file && (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6" data-testid="parsed-data-display">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-bold text-primary-800">Informations extraites</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Informations personnelles */}
            <div className="space-y-2" data-testid="parsed-personal-info">
              <h4 className="font-medium text-primary-700 flex items-center">
                <User className="h-4 w-4 mr-1" />
                Informations personnelles
              </h4>
              <div className="pl-5 space-y-1 text-primary-600">
                {parsedData.personalInfo?.name && (
                  <p data-testid="parsed-name">👤 {parsedData.personalInfo.name}</p>
                )}
                {parsedData.personalInfo?.email && (
                  <p className="flex items-center" data-testid="parsed-email">
                    <Mail className="h-3 w-3 mr-1" />
                    {parsedData.personalInfo.email}
                  </p>
                )}
                {parsedData.personalInfo?.phone && (
                  <p className="flex items-center" data-testid="parsed-phone">
                    <Phone className="h-3 w-3 mr-1" />
                    {parsedData.personalInfo.phone}
                  </p>
                )}
                {parsedData.personalInfo?.linkedin && (
                  <p data-testid="parsed-linkedin">🔗 LinkedIn</p>
                )}
                {parsedData.personalInfo?.website && (
                  <p data-testid="parsed-website">🌐 Site web</p>
                )}
              </div>
            </div>
            
            {/* Résumé des sections */}
            <div className="space-y-2" data-testid="parsed-sections-summary">
              <h4 className="font-medium text-primary-700">Sections détectées</h4>
              <div className="pl-0 space-y-1 text-primary-600">
                {(parsedData.experiences?.length || 0) > 0 && (
                  <p className="flex items-center" data-testid="parsed-experiences-count">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {parsedData.experiences?.length} expérience(s)
                  </p>
                )}
                {(parsedData.education?.length || 0) > 0 && (
                  <p className="flex items-center" data-testid="parsed-education-count">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {parsedData.education?.length} formation(s)
                  </p>
                )}
                {(parsedData.projects?.length || 0) > 0 && (
                  <p className="flex items-center" data-testid="parsed-projects-count">
                    <FolderKanban className="h-3 w-3 mr-1" />
                    {parsedData.projects?.length} projet(s)
                  </p>
                )}
                {(parsedData.skills?.length || 0) > 0 && (
                  <p data-testid="parsed-skills-count">🛠️ {parsedData.skills?.length} compétence(s)</p>
                )}
                {(parsedData.languages?.length || 0) > 0 && (
                  <p data-testid="parsed-languages-count">🗣️ {parsedData.languages?.length} langue(s)</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-primary-100 rounded-xl text-sm text-primary-700">
            💡 <strong>Conseil :</strong> Vérifiez et corrigez les informations ci-dessous avant de générer votre CV.
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploadSection 