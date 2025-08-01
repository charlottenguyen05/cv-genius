import { useState } from "react";
import { CVFormData, PersonalInfo, Experience, Education, Skill, Language } from "@/types";

export const useCVForm = () => {
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

  // Additional state properties expected by tests
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showCard, setShowCard] = useState(false);

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

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
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

  const updateEducation = (index: number, field: keyof Education, value: string) => {
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

  const updateLanguage = (index: number, field: keyof Language, value: string) => {
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
      location: parsedData.personalInfo.location || formData.personalInfo.location,
      linkedin: parsedData.personalInfo.linkedin || formData.personalInfo.linkedin,
      website: parsedData.personalInfo.website || formData.personalInfo.website,
    };

    // Use parsed data for experiences, education, skills, languages if available
    setFormData({
      personalInfo: mergedPersonalInfo,
      experiences: parsedData.experiences.length > 0 ? parsedData.experiences : formData.experiences,
      education: parsedData.education.length > 0 ? parsedData.education : formData.education,
      skills: parsedData.skills.length > 0 ? parsedData.skills : formData.skills,
      languages: parsedData.languages && parsedData.languages.length > 0 ? parsedData.languages : formData.languages,
    });

    console.log("Form data updated with parsed data");
  };

  return {
    formData,
    isSubmitting,
    error,
    showToast,
    showCard,
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
    setIsSubmitting,
    setError,
    setShowToast,
    setShowCard,
  };
};
