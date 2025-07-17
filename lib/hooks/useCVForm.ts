import { useState } from "react";
import {
  CVFormData,
  PersonalInfo,
  Experience,
  Education,
  Skill,
  Language,
} from "@/types";
import { getCurrentUser } from "../supabase/client";

export const useCVForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<CVFormData>({
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      website: "",
    },
    experiences: [],
    education: [],
    skills: [],
    languages: [],
  });

  // Personal Info handlers
  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  // Experience handlers
  const addExperience = () => {
    const newExperience: Partial<Experience> = {
      id: Date.now().toString(),
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
      isCurrentPosition: false,
    };
    setFormData({
      ...formData,
      experiences: [...formData.experiences, newExperience],
    });
  };

  const updateExperience = (
    index: number,
    field: keyof Experience,
    value: string | boolean
  ) => {
    const updatedExperiences = [...formData.experiences];
    updatedExperiences[index] = {
      ...updatedExperiences[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      experiences: updatedExperiences,
    });
  };

  const removeExperience = (index: number) => {
    setFormData({
      ...formData,
      experiences: formData.experiences.filter((_, i) => i !== index),
    });
  };

  // Education handlers
  const addEducation = () => {
    const newEducation: Partial<Education> = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    setFormData({
      ...formData,
      education: [...formData.education, newEducation],
    });
  };

  const updateEducation = (
    index: number,
    field: keyof Education,
    value: string
  ) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      education: updatedEducation,
    });
  };

  const removeEducation = (index: number) => {
    setFormData({
      ...formData,
      education: formData.education.filter((_, i) => i !== index),
    });
  };

  // Skill handlers
  const addSkill = () => {
    const newSkill: Partial<Skill> = {
      id: Date.now().toString(),
      name: "",
      category: "technical",
      level: "intermediate",
    };
    setFormData({
      ...formData,
      skills: [...formData.skills, newSkill],
    });
  };

  const updateSkill = (index: number, field: keyof Skill, value: string) => {
    const updatedSkills = [...formData.skills];
    updatedSkills[index] = {
      ...updatedSkills[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      skills: updatedSkills,
    });
  };

  const removeSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  // Language handlers
  const addLanguage = () => {
    const newLanguage: Partial<Language> = {
      id: Date.now().toString(),
      name: "",
      level: "B1",
    };
    setFormData({
      ...formData,
      languages: [...(formData.languages || []), newLanguage],
    });
  };

  const updateLanguage = (
    index: number,
    field: keyof Language,
    value: string
  ) => {
    const updatedLanguages = [...(formData.languages || [])];
    updatedLanguages[index] = {
      ...updatedLanguages[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      languages: updatedLanguages,
    });
  };

  const removeLanguage = (index: number) => {
    setFormData({
      ...formData,
      languages: formData.languages?.filter((_, i) => i !== index) || [],
    });
  };

  // Load parsed data from the parser API
  const loadParsedData = (parsedData: CVFormData) => {
    console.log("Loading parsed data into form:", parsedData);

    // Merge personal info, keeping existing data if parser data is empty
    const mergedPersonalInfo = {
      name: parsedData.personalInfo.name || formData.personalInfo.name,
      email: parsedData.personalInfo.email || formData.personalInfo.email,
      phone: parsedData.personalInfo.phone || formData.personalInfo.phone,
      location:
        parsedData.personalInfo.location || formData.personalInfo.location,
      linkedin:
        parsedData.personalInfo.linkedin || formData.personalInfo.linkedin,
      website: parsedData.personalInfo.website || formData.personalInfo.website,
    };

    // Use parsed data for experiences, education, skills, languages if available
    setFormData({
      personalInfo: mergedPersonalInfo,
      experiences:
        parsedData.experiences.length > 0
          ? parsedData.experiences
          : formData.experiences,
      education:
        parsedData.education.length > 0
          ? parsedData.education
          : formData.education,
      skills:
        parsedData.skills.length > 0 ? parsedData.skills : formData.skills,
      languages:
        parsedData.languages && parsedData.languages.length > 0
          ? parsedData.languages
          : formData.languages,
    });

    console.log("Form data updated with parsed data");
  };

  const handleSubmitComplete = async () => {
    // Clear previous errors
    setError("");
    setShowToast(false);
    setIsSubmitting(true);

    // Validation des données minimum requises
    if (!formData.personalInfo.name) {
      setError("Le nom est requis pour générer le CV");
      setShowToast(true);
      return;
    }

    if (!formData.personalInfo.email) {
      setError("L'email est requis pour générer le CV");
      setShowToast(true);
      return;
    }

    // Check if user is authenticated
    try {
      const { user, error: authError } = await getCurrentUser();

      if (!user) {
        setShowCard(true);
        return;
      }

      if (authError) {
        setError(`Erreur d'authentification: ${authError.message}`);
        setShowToast(true);
        return;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur de connexion inattendue";
      setError(
        `Erreur lors de la vérification de l'authentification: ${errorMessage}`
      );
      setShowToast(true);
      return;
    }

    // Call the /api/cv/complete-improve/route.ts

    try {
      console.log("🚀 Amélioration complète du CV avec Gemini...");
      const response = await fetch("/api/cv/complete-improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ formData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("[handleSubmitComplete] ERREUR");
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const json = await response.json();
      console.log(
        "[handleSubmitComplete] API response:",
        JSON.stringify(json, null, 2)
      );

      if (json.success && json.improvedCV) {
        console.log(`json improved return in handleSubmitCV${json.improvedCV}`);
        return json.improvedCV;
      } else {
        console.error("[handleSubmitComplete] API error:", json.error);
        throw new Error(json.error || "Erreur lors de l'amélioration du CV");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur de l'amelioration inconnue";
      console.error("❌ Erreur lors de l'amelioration du CV:", errorMessage);
      setError(`Erreur lors de l'amelioration du CV: ${errorMessage}`);
      setShowToast(true);
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const callGeneratePDF = async (cvData: CVFormData) => {
    try {
      console.log("🚀 Lancement de la génération CV...");
      console.log("📊 Données CV:", formData);

      // Appel de l'API de génération CV complète
      const response = await fetch("/api/cv/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cvData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      // Vérifier si la réponse est un PDF
      const contentType = response.headers.get("content-type");
      if (contentType === "application/pdf") {
        // Téléchargement automatique du PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Récupérer le nom du fichier depuis les headers
        const contentDisposition = response.headers.get("content-disposition");
        const fileName = contentDisposition
          ? contentDisposition.split('filename="')[1]?.split('"')[0]
          : `CV_${formData.personalInfo.name?.replace(/\s+/g, "_")}_${
              new Date().toISOString().split("T")[0]
            }.pdf`;

        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        // Nettoyage
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        console.log("✅ CV généré et téléchargé avec succès!");

        // Pas de toast de succès comme demandé - juste le téléchargement
      } else {
        throw new Error("Format de réponse inattendu");
      }
    } catch (error) {
      // console.error("❌ Erreur lors de la génération du CV:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur inconnue lors de la génération du CV";
      setError(`Erreur lors de la génération du CV: ${errorMessage}`);
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    loadParsedData,
    handleSubmitComplete,
    callGeneratePDF,
    showToast,
    setShowToast,
    error,
    showCard,
    setShowCard,
  };
};
