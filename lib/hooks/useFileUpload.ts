import { useState } from 'react'
import { CVFormData } from '@/types'

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export interface FileUploadState {
  uploadedFile: File | null
  isDragOver: boolean
  errors: Record<string, string>
}

export const useFileUpload = (onDataParsed?: (data: CVFormData) => void) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [parsedData, setParsedData] = useState<CVFormData | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // File validation
  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (file.size > MAX_FILE_SIZE) {
      return 'Le fichier ne doit pas dépasser 10MB'
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'Seuls les fichiers PDF, TXT et DOC sont acceptés'
    }
    
    return null
  }

  // Parse file with API
  const parseFile = async (file: File): Promise<boolean> => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/parser', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setErrors({ file: result.error || 'Erreur lors du parsing du fichier' })
        return false
      }
      
      if (result.success && result.parsedData) {
        setParsedData(result.parsedData)
        console.log('Parsing successful, source:', result.source)
        
        // Auto-fill form if callback provided
        if (onDataParsed) {
          onDataParsed(result.parsedData)
        }
        
        return true
      } else {
        setErrors({ file: 'Erreur lors de l\'extraction des données' })
        return false
      }
    } catch (error) {
      console.error('Parse error:', error)
      setErrors({ file: 'Erreur de connexion au serveur' })
      return false
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = async (file: File) => {
    const error = validateFile(file)
    if (error) {
      setErrors({ file: error })
      return
    }
    
    setUploadedFile(file)
    setErrors({ ...errors, file: '' })
    
    // Auto-parse le fichier après sélection
    await parseFile(file)
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
    setParsedData(null)
    setErrors({ ...errors, file: '' })
  }

  const setFileError = (error: string) => {
    setErrors({ ...errors, file: error })
  }

  return {
    uploadedFile,
    isDragOver,
    errors,
    parsedData,
    isUploading,
    setParsedData,
    setIsDragOver,
    handleDrop,
    handleFileInput,
    removeFile,
    setFileError,
    parseFile
  }
} 