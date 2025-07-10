import React from 'react'
import { Upload, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import DeleteButton from '@/components/dashboard/forms/DeleteButton'
import { useFileUpload } from '@/lib/hooks/useFileUpload'

interface FileUploadSectionProps {
  uploadedFile: File | null
  isDragOver: boolean
  errors: Record<string, string>
  setIsDragOver: (isDragOver: boolean) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: () => void
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  uploadedFile,
  isDragOver,
  errors,
  setIsDragOver,
  handleDrop,
  handleFileInput,
  removeFile
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">1. Télécharger votre CV</h2>
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver 
            ? "border-blue-400 bg-blue-50" 
            : uploadedFile 
              ? "border-green-400 bg-green-50" 
              : "border-gray-300 hover:border-gray-400"
        )}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
      >
        {uploadedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <DeleteButton
                onClick={removeFile}
                variant="x"
                size="lg"
                ariaLabel="Supprimer le fichier"
                className="hover:bg-red-100"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Glissez votre CV ici ou cliquez pour sélectionner
              </p>
              <p className="text-sm text-gray-500">
                PDF, TXT ou DOC jusqu'à 10MB
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        )}
      </div>
      
      {errors.file && (
        <p className="text-sm text-red-600">{errors.file}</p>
      )}
    </div>
  )
}

export default FileUploadSection 