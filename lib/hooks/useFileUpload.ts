import { useState } from 'react'

export interface FileUploadState {
  uploadedFile: File | null
  isDragOver: boolean
  errors: Record<string, string>
}

export const useFileUpload = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (file.size > maxSize) {
      return 'Le fichier ne doit pas dépasser 10MB'
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'Seuls les fichiers PDF, TXT et DOC sont acceptés'
    }
    
    return null
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      setErrors({ file: error })
      return
    }
    
    setUploadedFile(file)
    setErrors({ ...errors, file: '' })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setErrors({ ...errors, file: '' })
  }

  const setFileError = (error: string) => {
    setErrors({ ...errors, file: error })
  }

  return {
    uploadedFile,
    isDragOver,
    errors,
    setIsDragOver,
    handleDrop,
    handleFileInput,
    removeFile,
    setFileError
  }
} 