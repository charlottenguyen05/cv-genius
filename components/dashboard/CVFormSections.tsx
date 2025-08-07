import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import InputField from "@/components/dashboard/forms/InputField";
import TextAreaField from "@/components/dashboard/forms/TextAreaField";
import SelectField from "@/components/dashboard/forms/SelectField";
import DeleteButton from "@/components/ui/DeleteButton";
import { CVFormData, Experience, Education, Skill, Language } from "@/types";

interface ExperienceHandlers {
  add: () => void;
  update: (
    index: number,
    field: keyof Experience,
    value: string | boolean
  ) => void;
  remove: (index: number) => void;
}

interface EducationHandlers {
  add: () => void;
  update: (index: number, field: keyof Education, value: string) => void;
  remove: (index: number) => void;
}

interface SkillHandlers {
  add: () => void;
  update: (index: number, field: keyof Skill, value: string) => void;
  remove: (index: number) => void;
}

interface LanguageHandlers {
  add: () => void;
  update: (index: number, field: keyof Language, value: string) => void;
  remove: (index: number) => void;
}

interface CVFormSectionsProps {
  formData: CVFormData;
  updatePersonalInfo: (
    field: keyof CVFormData["personalInfo"],
    value: string
  ) => void;
  experienceHandlers: ExperienceHandlers;
  educationHandlers: EducationHandlers;
  skillHandlers: SkillHandlers;
  languageHandlers: LanguageHandlers;
}

const CVFormSections: React.FC<CVFormSectionsProps> = ({
  formData,
  updatePersonalInfo,
  experienceHandlers,
  educationHandlers,
  skillHandlers,
  languageHandlers,
}) => {
  return (
    <>
      {/* Personal Information Section */}
      <div className="space-y-6" data-testid="cv-form">
        <h2 className="text-xl font-semibold text-gray-900">
          2. Informations personnelles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Nom complet"
            name="name"
            value={formData.personalInfo.name || ""}
            onChange={(value) => updatePersonalInfo("name", value)}
            placeholder="John Doe"
            required
            data-testid="name-input"
          />
          <InputField
            label="Email"
            name="email"
            type="email"
            value={formData.personalInfo.email || ""}
            onChange={(value) => updatePersonalInfo("email", value)}
            placeholder="john.doe@example.com"
            required
            data-testid="email-input"
          />
          <InputField
            label="Téléphone"
            name="phone"
            type="tel"
            value={formData.personalInfo.phone || ""}
            onChange={(value) => updatePersonalInfo("phone", value)}
            placeholder="+33 1 23 45 67 89"
            data-testid="phone-input"
          />
          <InputField
            label="Localisation"
            name="location"
            value={formData.personalInfo.location || ""}
            onChange={(value) => updatePersonalInfo("location", value)}
            placeholder="Paris, France"
            data-testid="location-input"
          />
          <InputField
            label="LinkedIn"
            name="linkedin"
            type="url"
            value={formData.personalInfo.linkedin || ""}
            onChange={(value) => updatePersonalInfo("linkedin", value)}
            placeholder="https://linkedin.com/in/johndoe"
            data-testid="linkedin-input"
          />
          <InputField
            label="Site web"
            name="website"
            type="url"
            value={formData.personalInfo.website || ""}
            onChange={(value) => updatePersonalInfo("website", value)}
            placeholder="https://johndoe.com"
            data-testid="website-input"
          />
        </div>
      </div>

      {/* Experience Section */}
      <div className="space-y-6 mt-4" data-testid="experiences-section">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            3. Expériences professionnelles
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={experienceHandlers.add}
            className="flex items-center space-x-2"
            data-testid="add-experience-button"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une expérience</span>
          </Button>
        </div>

        {formData.experiences.map((experience, index) => (
          <div
            key={experience.id || index}
            className="p-6 border border-gray-200 rounded-lg space-y-4"
            data-testid={`experience-${index}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Expérience {index + 1}
              </h3>
              <DeleteButton
                onClick={() => experienceHandlers.remove(index)}
                variant="trash"
                size="md"
                ariaLabel="Supprimer cette expériences professionnelles"
                data-testid={`remove-experience-${index}`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Entreprise"
                name={`experience-company-${index}`}
                value={experience.company || ""}
                onChange={(value) =>
                  experienceHandlers.update(index, "company", value)
                }
                placeholder="Nom de l'entreprise"
                required
                data-testid={`experience-${index}-company`}
              />
              <InputField
                label="Poste"
                name={`experience-position-${index}`}
                value={experience.position || ""}
                onChange={(value) =>
                  experienceHandlers.update(index, "position", value)
                }
                placeholder="Intitulé du poste"
                required
                data-testid={`experience-${index}-position`}
              />
              <InputField
                label="Localisation"
                name={`experience-location-${index}`}
                value={experience.location || ""}
                onChange={(value) =>
                  experienceHandlers.update(index, "location", value)
                }
                placeholder="Ville, Pays"
                data-testid={`experience-${index}-location`}
              />
              <InputField
                label="Date de début"
                name={`experience-startDate-${index}`}
                type="month"
                value={experience.startDate || ""}
                onChange={(value) =>
                  experienceHandlers.update(index, "startDate", value)
                }
                placeholder="02/2025"
                required
                data-testid={`experience-${index}-startDate`}
              />
              <InputField
                label="Date de fin"
                name={`experience-endDate-${index}`}
                type="month"
                value={experience.endDate || ""}
                onChange={(value) =>
                  experienceHandlers.update(index, "endDate", value)
                }
                placeholder={
                  experience.isCurrentPosition ? "Poste actuel" : "05/2025"
                }
                data-testid={`experience-${index}-endDate`}
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`experience-current-${index}`}
                  checked={experience.isCurrentPosition || false}
                  onChange={(e) =>
                    experienceHandlers.update(
                      index,
                      "isCurrentPosition",
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  data-testid={`experience-${index}-current`}
                />
                <label
                  htmlFor={`experience-current-${index}`}
                  className="text-sm text-gray-700"
                >
                  Poste actuel
                </label>
              </div>
            </div>

            <TextAreaField
              label="Description"
              name={`experience-description-${index}`}
              value={experience.description || ""}
              onChange={(value) =>
                experienceHandlers.update(index, "description", value)
              }
              placeholder="Décrivez vos responsabilités et réalisations..."
              rows={4}
              data-testid={`experience-${index}-description`}
            />
          </div>
        ))}
      </div>

      {/* Education Section */}
      <div className="space-y-6 mt-4" data-testid="education-section">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">4. Formation</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={educationHandlers.add}
            className="flex items-center space-x-2"
            data-testid="add-education-button"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une formation</span>
          </Button>
        </div>

        {formData.education.map((education, index) => (
          <div
            key={education.id || index}
            className="p-6 border border-gray-200 rounded-lg space-y-4"
            data-testid={`education-${index}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Formation {index + 1}
              </h3>
              <DeleteButton
                onClick={() => educationHandlers.remove(index)}
                variant="trash"
                size="md"
                ariaLabel="Supprimer cette formation"
                data-testid={`remove-education-${index}`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Établissement"
                name={`education-institution-${index}`}
                value={education.institution || ""}
                onChange={(value) =>
                  educationHandlers.update(index, "institution", value)
                }
                placeholder="Nom de l'établissement"
                required
                data-testid={`education-${index}-school`}
              />
              <InputField
                label="Diplôme"
                name={`education-degree-${index}`}
                value={education.degree || ""}
                onChange={(value) =>
                  educationHandlers.update(index, "degree", value)
                }
                placeholder="Master, Licence, etc."
                required
                data-testid={`education-${index}-degree`}
              />
              <InputField
                label="Domaine d'étude"
                name={`education-field-${index}`}
                value={education.field || ""}
                onChange={(value) =>
                  educationHandlers.update(index, "field", value)
                }
                placeholder="Informatique, Marketing, etc."
                data-testid={`education-${index}-field`}
              />
              <InputField
                label="Date de début"
                name={`education-startDate-${index}`}
                type="month"
                value={education.startDate || ""}
                onChange={(value) =>
                  educationHandlers.update(index, "startDate", value)
                }
                placeholder="02/2025"
                required
                data-testid={`education-${index}-startDate`}
              />
              <InputField
                label="Date de fin"
                name={`education-endDate-${index}`}
                type="month"
                value={education.endDate || ""}
                onChange={(value) =>
                  educationHandlers.update(index, "endDate", value)
                }
                placeholder="05/2025"
                data-testid={`education-${index}-endDate`}
              />
            </div>

            <TextAreaField
              label="Description"
              name={`education-description-${index}`}
              value={education.description || ""}
              onChange={(value) =>
                educationHandlers.update(index, "description", value)
              }
              placeholder="Projets importants, mentions, etc."
              rows={3}
              data-testid={`education-${index}-description`}
            />
          </div>
        ))}
      </div>

      {/* Skills Section */}
      <div className="space-y-6 mt-4" data-testid="skills-section">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            5. Compétences
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={skillHandlers.add}
            className="flex items-center space-x-2"
            data-testid="add-skill-button"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une compétence</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formData.skills.map((skill, index) => (
            <div
              key={skill.id || index}
              className="p-4 border border-gray-200 rounded-lg space-y-3"
              data-testid={`skill-${index}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Compétence {index + 1}
                </span>
                <DeleteButton
                  onClick={() => skillHandlers.remove(index)}
                  variant="trash"
                  size="md"
                  ariaLabel="Supprimer cette compétence"
                  data-testid={`remove-skill-${index}`}
                />
              </div>

              <InputField
                label="Nom"
                name={`skill-name-${index}`}
                value={skill.name || ""}
                onChange={(value) => skillHandlers.update(index, "name", value)}
                placeholder="JavaScript, Leadership, etc."
                required
                data-testid={`skill-${index}-name`}
              />

              <SelectField
                label="Catégorie"
                name={`skill-category-${index}`}
                value={skill.category || "technical"}
                onChange={(value) =>
                  skillHandlers.update(index, "category", value)
                }
                options={[
                  { value: "technical", label: "Technique" },
                  { value: "soft", label: "Soft skills" },
                  { value: "language", label: "Langue" },
                  { value: "other", label: "Autre" },
                ]}
                required
                data-testid={`skill-${index}-category`}
              />

              <SelectField
                label="Niveau"
                name={`skill-level-${index}`}
                value={skill.level || "intermediate"}
                onChange={(value) =>
                  skillHandlers.update(index, "level", value)
                }
                options={[
                  { value: "beginner", label: "Débutant" },
                  { value: "intermediate", label: "Intermédiaire" },
                  { value: "advanced", label: "Avancé" },
                  { value: "expert", label: "Expert" },
                ]}
                required
                data-testid={`skill-${index}-level`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Languages Section */}
      <div className="space-y-6 mt-4" data-testid="languages-section">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">6. Langues</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={languageHandlers.add}
            className="flex items-center space-x-2"
            data-testid="add-language-button"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une langue</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(formData.languages || []).map((language, index) => (
            <div
              key={language.id || index}
              className="p-4 border border-gray-200 rounded-lg space-y-3"
              data-testid={`language-${index}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Langue {index + 1}
                </span>
                <DeleteButton
                  onClick={() => languageHandlers.remove(index)}
                  variant="trash"
                  size="md"
                  ariaLabel="Supprimer cette langue"
                  data-testid={`remove-language-${index}`}
                />
              </div>

              <InputField
                label="Langue"
                name={`language-name-${index}`}
                value={language.name || ""}
                onChange={(value) =>
                  languageHandlers.update(index, "name", value)
                }
                placeholder="Français, Anglais, etc."
                required
                data-testid={`language-${index}-name`}
              />

              <SelectField
                label="Niveau"
                name={`language-level-${index}`}
                value={language.level || "B1"}
                onChange={(value) =>
                  languageHandlers.update(index, "level", value)
                }
                options={[
                  { value: "A1", label: "A1 - Débutant" },
                  { value: "A2", label: "A2 - Élémentaire" },
                  { value: "B1", label: "B1 - Intermédiaire" },
                  { value: "B2", label: "B2 - Intermédiaire avancé" },
                  { value: "C1", label: "C1 - Avancé" },
                  { value: "C2", label: "C2 - Maîtrise" },
                  { value: "native", label: "Langue maternelle" },
                ]}
                required
                data-testid={`language-${index}-level`}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CVFormSections;
