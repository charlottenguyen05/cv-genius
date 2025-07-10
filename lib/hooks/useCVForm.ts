import { useState } from 'react'
import { CVFormData, PersonalInfo, Experience, Education, Skill, Language } from '@/types'
import { getCurrentUser } from '../supabase/client'

export const useCVForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState<CVFormData>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: ''
    },
    experiences: [],
    education: [],
    skills: [],
    languages: []
  })

  // Personal Info handlers
  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setFormData({
      ...formData,
      personalInfo: {
        ...formData.personalInfo,
        [field]: value
      }
    })
  }

  // Experience handlers
  const addExperience = () => {
    const newExperience: Partial<Experience> = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      isCurrentPosition: false
    }
    setFormData({
      ...formData,
      experiences: [...formData.experiences, newExperience]
    })
  }

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
    const updatedExperiences = [...formData.experiences]
    updatedExperiences[index] = {
      ...updatedExperiences[index],
      [field]: value
    }
    setFormData({
      ...formData,
      experiences: updatedExperiences
    })
  }

  const removeExperience = (index: number) => {
    setFormData({
      ...formData,
      experiences: formData.experiences.filter((_, i) => i !== index)
    })
  }

  // Education handlers
  const addEducation = () => {
    const newEducation: Partial<Education> = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      description: ''
    }
    setFormData({
      ...formData,
      education: [...formData.education, newEducation]
    })
  }

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updatedEducation = [...formData.education]
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value
    }
    setFormData({
      ...formData,
      education: updatedEducation
    })
  }

  const removeEducation = (index: number) => {
    setFormData({
      ...formData,
      education: formData.education.filter((_, i) => i !== index)
    })
  }

  // Skills handlers
  const addSkill = () => {
    const newSkill: Partial<Skill> = {
      id: Date.now().toString(),
      name: '',
      category: 'technical',
      level: 'intermediate'
    }
    setFormData({
      ...formData,
      skills: [...formData.skills, newSkill]
    })
  }

  const updateSkill = (index: number, field: keyof Skill, value: string) => {
    const updatedSkills = [...formData.skills]
    updatedSkills[index] = {
      ...updatedSkills[index],
      [field]: value
    }
    setFormData({
      ...formData,
      skills: updatedSkills
    })
  }

  const removeSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    })
  }

  // Language handlers
  const addLanguage = () => {
    const newLanguage: Partial<Language> = {
      id: Date.now().toString(),
      name: '',
      level: 'B1'
    }
    setFormData({
      ...formData,
      languages: [...(formData.languages || []), newLanguage]
    })
  }

  const updateLanguage = (index: number, field: keyof Language, value: string) => {
    const updatedLanguages = [...(formData.languages || [])]
    updatedLanguages[index] = {
      ...updatedLanguages[index],
      [field]: value
    }
    setFormData({
      ...formData,
      languages: updatedLanguages
    })
  }

  const removeLanguage = (index: number) => {
    setFormData({
      ...formData,
      languages: formData.languages?.filter((_, i) => i !== index) || []
    })
  }

  // Form submission
  const handleSubmit = async (uploadedFile: File | null, setFileError: (error: string) => void) => {
    if (!uploadedFile) {
      setFileError('Veuillez sélectionner un fichier')
      return
    }

    // Clear previous errors
    setError('')
    setShowToast(false)

    // Check if user is authenticated
    try {
      const {user, error: authError} = await getCurrentUser()
      
      if (!user) {
        setShowCard(true)
        return
      }

      if (authError) {
        setError(`Erreur d'authentification: ${authError.message}`)
        setShowToast(true)
        return
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion inattendue'
      setError(`Erreur lors de la vérification de l'authentification: ${errorMessage}`)
      setShowToast(true)
      return
    }

    setIsSubmitting(true)
    
    try {
      // TODO: Implement file upload and CV enhancement with Gemini API
      console.log('File:', uploadedFile)
      console.log('CV Data:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // TODO: Replace with actual success handling (no toast for success as requested)
      console.log('CV amélioration réussie!')
      
    } catch (error) {
      console.error('Error enhancing CV:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'amélioration du CV'
      setError(`Erreur lors de l'amélioration du CV: ${errorMessage}`)
      setShowToast(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
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
    handleSubmit,
    showToast,
    setShowToast,
    error,
    showCard,
    setShowCard
  }
} 