import { useState } from 'react'
import { CVFormData } from '@/types'

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export interface FileUploadState {
  uploadedFile: File | null
  isDragOver: boolean
  errors: Record<string, string>
  isUploading: boolean
  parsedData: CVFormData | null
}

export const useFileUpload = (onDataParsed?: (data: CVFormData) => void) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [parsedData, setParsedData] = useState<CVFormData | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Validation simplifiée du fichier
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['application/pdf', 'text/plain']
    
    if (file.size > MAX_FILE_SIZE) {
      return 'Le fichier ne doit pas dépasser 10MB'
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'Seuls les fichiers PDF et TXT sont acceptés'
    }
    
    return null
  }

  // Parse du fichier avec la nouvelle API
  const parseFile = async (file: File): Promise<boolean> => {
    setIsUploading(true)
    setErrors({})
    
    try {
      console.log('🔄 Début du parsing pour:', file.name)
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/parser', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        const errorMessage = result.error || `Erreur ${response.status}: ${response.statusText}`
        setErrors({ file: errorMessage })
        console.error('❌ Erreur parsing:', errorMessage)
        return false
      }
      
      if (result.success && result.parsedData) {
        console.log('✅ Parsing réussi! Source:', result.source)
        console.log('📊 Données extraites:', {
          nom: result.parsedData.personalInfo?.name,
          email: result.parsedData.personalInfo?.email,
          experiences: result.parsedData.experiences?.length || 0,
          education: result.parsedData.education?.length || 0,
          skills: result.parsedData.skills?.length || 0,
          languages: result.parsedData.languages?.length || 0
        })
        
        setParsedData(result.parsedData)
        
        // Auto-remplir le formulaire si callback fourni
        if (onDataParsed) {
          onDataParsed(result.parsedData)
        }
        
        return true
      } else {
        setErrors({ file: 'Erreur lors de l\'extraction des données du CV' })
        return false
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error)
      setErrors({ file: 'Erreur de connexion au serveur. Vérifiez votre connexion internet.' })
      return false
    } finally {
      setIsUploading(false)
    }
  }

  // Gestion de la sélection de fichier
  const handleFileSelect = async (file: File) => {
    console.log('📁 Fichier sélectionné:', { name: file.name, size: file.size, type: file.type })
    
    // Validation
    const error = validateFile(file)
    if (error) {
      setErrors({ file: error })
      console.warn('⚠️ Fichier invalide:', error)
      return
    }
    
    // Réinitialiser les erreurs et données précédentes
    setErrors({})
    setParsedData(null)
    setUploadedFile(file)
    
    // Lancer le parsing automatiquement
    const success = await parseFile(file)
    
    if (!success) {
      console.warn('⚠️ Le parsing a échoué pour:', file.name)
    }
  }

  // Gestion du drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // Gestion de l'input file
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
    // Reset l'input pour permettre la re-sélection du même fichier
    e.target.value = ''
  }

  // Supprimer le fichier
  const removeFile = () => {
    console.log('🗑️ Suppression du fichier')
    setUploadedFile(null)
    setParsedData(null)
    setErrors({})
    setIsUploading(false)
  }

  // Définir une erreur manuellement
  const setFileError = (error: string) => {
    setErrors({ ...errors, file: error })
  }

  return {
    // État
    uploadedFile,
    isDragOver,
    errors,
    parsedData,
    isUploading,
    
    // Setters
    setIsDragOver,
    setParsedData,
    setFileError,
    
    // Actions
    handleDrop,
    handleFileInput,
    removeFile,
    parseFile,
    handleFileSelect
  }
} 