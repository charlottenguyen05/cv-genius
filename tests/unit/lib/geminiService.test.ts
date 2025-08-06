import { GeminiService, geminiService } from "@/lib/gemini/service";
import { GoogleGenAI } from "@google/genai";
import type { CVFormData } from "@/types";

// Mock the Google GenAI library
jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn(),
}));

describe("GeminiService", () => {
  let mockGenAI: any;
  let mockModels: any;
  let service: GeminiService;

  // Test data
  const mockCVData: CVFormData = {
    personalInfo: {
      name: "John Doe",
      email: "john@example.com",
      phone: "+33123456789",
      location: "Paris, France",
      linkedin: "https://linkedin.com/in/johndoe",
      website: "https://johndoe.com",
    },
    experiences: [
      {
        id: "exp-1",
        company: "Tech Corp",
        position: "Developer",
        location: "Paris",
        startDate: "2020-01",
        endDate: "2023-12",
        description: "Worked on web applications",
        isCurrentPosition: false,
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "University of Paris",
        degree: "Master",
        field: "Computer Science",
        startDate: "2018-09",
        endDate: "2020-06",
        description: "Focus on software engineering",
      },
    ],
    skills: [
      {
        id: "skill-1",
        name: "JavaScript",
        level: "advanced",
        category: "technical",
      },
    ],
    languages: [
      {
        id: "lang-1",
        name: "French",
        level: "native",
      },
    ],
  };

  const improvedCVResponse = {
    personalInfo: {
      name: "John Doe",
      email: "john@example.com",
      phone: "+33123456789",
      location: "Paris, France",
      linkedin: "https://linkedin.com/in/johndoe",
      website: "https://johndoe.com",
    },
    experiences: [
      {
        id: "exp-1",
        company: "Tech Corp",
        position: "Développeur Full-Stack Senior",
        location: "Paris",
        startDate: "2020-01",
        endDate: "2023-12",
        description:
          "Développé et optimisé 15+ applications web, améliorant les performances de 40%",
        isCurrentPosition: false,
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "Université de Paris",
        degree: "Master en Informatique",
        field: "Génie Logiciel",
        startDate: "2018-09",
        endDate: "2020-06",
        description:
          "Spécialisation en ingénierie logicielle et architecture système",
      },
    ],
    skills: [
      {
        id: "skill-1",
        name: "JavaScript",
        level: "expert",
        category: "technical",
      },
    ],
    languages: [
      {
        id: "lang-1",
        name: "Français",
        level: "native",
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockModels = {
      generateContent: jest.fn(),
    };

    mockGenAI = {
      models: mockModels,
    };

    (GoogleGenAI as jest.Mock).mockReturnValue(mockGenAI);
    service = new GeminiService();
  });

  describe("constructor", () => {
    it("should initialize GoogleGenAI instance", () => {
      expect(GoogleGenAI).toHaveBeenCalledWith({});
    });
  });

  describe("improveCompleteCV", () => {
    it("should improve CV successfully with valid JSON response", async () => {
      mockModels.generateContent.mockResolvedValue({
        text: JSON.stringify(improvedCVResponse),
      });

      const result = await service.improveCompleteCV(mockCVData);

      expect(mockModels.generateContent).toHaveBeenCalledWith({
        model: "gemini-2.5-flash",
        contents: expect.stringContaining(
          "Tu es un expert en rédaction de CV professionnel"
        ),
      });
      expect(result).toEqual(improvedCVResponse);
    });

    it("should handle JSON wrapped in markdown code blocks", async () => {
      const wrappedResponse = `\`\`\`json
${JSON.stringify(improvedCVResponse)}
\`\`\``;

      mockModels.generateContent.mockResolvedValue({
        text: wrappedResponse,
      });

      const result = await service.improveCompleteCV(mockCVData);
      expect(result).toEqual(improvedCVResponse);
    });

    it("should handle JSON with extra text around it", async () => {
      const responseWithExtraText = `Here is the improved CV:
${JSON.stringify(improvedCVResponse)}
This is the final result.`;

      mockModels.generateContent.mockResolvedValue({
        text: responseWithExtraText,
      });

      const result = await service.improveCompleteCV(mockCVData);
      expect(result).toEqual(improvedCVResponse);
    });

    it("should validate and fix missing fields", async () => {
      const incompleteCV = {
        personalInfo: { name: "John Doe" },
        experiences: [{ company: "Tech Corp" }],
      };

      mockModels.generateContent.mockResolvedValue({
        text: JSON.stringify(incompleteCV),
      });

      const result = await service.improveCompleteCV(mockCVData);

      expect(result.personalInfo.name).toBe("John Doe");
      expect(result.personalInfo.email).toBe(mockCVData.personalInfo.email);
      expect(result.experiences[0].id).toBeDefined();
      expect(result.education).toEqual([]);
      expect(result.skills).toEqual([]);
      expect(result.languages).toEqual([]);
    });

    it("should throw error when no content is generated", async () => {
      mockModels.generateContent.mockResolvedValue({
        text: null,
      });

      await expect(service.improveCompleteCV(mockCVData)).rejects.toThrow(
        "Aucun contenu généré par Gemini"
      );
    });

    it("should throw error when JSON is completely invalid", async () => {
      mockModels.generateContent.mockResolvedValue({
        text: "This is not JSON at all",
      });

      await expect(service.improveCompleteCV(mockCVData)).rejects.toThrow(
        "Aucun JSON valide trouvé dans la réponse"
      );
    });

    it("should handle API errors gracefully", async () => {
      mockModels.generateContent.mockRejectedValue(
        new Error("API rate limit exceeded")
      );

      await expect(service.improveCompleteCV(mockCVData)).rejects.toThrow(
        "Impossible d'améliorer le CV: API rate limit exceeded"
      );
    });

    it("should generate unique IDs for missing IDs", async () => {
      const cvWithoutIds = {
        ...improvedCVResponse,
        experiences: [{ ...improvedCVResponse.experiences[0], id: undefined }],
        education: [{ ...improvedCVResponse.education[0], id: undefined }],
        skills: [{ ...improvedCVResponse.skills[0], id: undefined }],
        languages: [{ ...improvedCVResponse.languages[0], id: undefined }],
      };

      mockModels.generateContent.mockResolvedValue({
        text: JSON.stringify(cvWithoutIds),
      });

      const result = await service.improveCompleteCV(mockCVData);

      expect(result.experiences[0].id).toMatch(/exp-\d+-0/);
      expect(result.education?.[0]?.id).toMatch(/edu-\d+-0/);
      expect(result.skills?.[0]?.id).toMatch(/skill-\d+-0/);
      expect(result.languages?.[0]?.id).toMatch(/lang-\d+-0/);
    });
  });

  describe("improveCVFormData", () => {
    it("should improve specific content section successfully", async () => {
      const improvedContent =
        "Développé et optimisé des applications web performantes";
      mockModels.generateContent.mockResolvedValue({
        text: improvedContent,
      });

      const result = await service.improveCVFormData(
        "Worked on web applications",
        "experience"
      );

      expect(mockModels.generateContent).toHaveBeenCalledWith({
        model: "gemini-2.5-flash",
        contents: expect.stringContaining(
          "En tant qu'expert en rédaction de CV"
        ),
      });
      expect(result).toBe(improvedContent);
    });

    it("should handle empty response", async () => {
      mockModels.generateContent.mockResolvedValue({
        text: null,
      });

      await expect(
        service.improveCVFormData("content", "section")
      ).rejects.toThrow("Aucun contenu généré par Gemini");
    });

    it("should handle API errors", async () => {
      mockModels.generateContent.mockRejectedValue(new Error("Network error"));

      await expect(
        service.improveCVFormData("content", "section")
      ).rejects.toThrow("Impossible d'améliorer le contenu: Network error");
    });
  });

  describe("generateFromKeywords", () => {
    it("should generate description from keywords successfully", async () => {
      const generatedDescription =
        "Expert en développement web avec maîtrise de React et Node.js";
      mockModels.generateContent.mockResolvedValue({
        text: generatedDescription,
      });

      const result = await service.generateFromKeywords(
        ["React", "Node.js", "TypeScript"],
        "Développeur Full-Stack"
      );

      expect(mockModels.generateContent).toHaveBeenCalledWith({
        model: "gemini-2.5-flash",
        contents: expect.stringContaining(
          "Génère une description professionnelle"
        ),
      });
      expect(result).toBe(generatedDescription);
    });

    it("should handle empty keywords array", async () => {
      const generatedDescription = "Professionnel expérimenté en développement";
      mockModels.generateContent.mockResolvedValue({
        text: generatedDescription,
      });

      const result = await service.generateFromKeywords([], "Developer");
      expect(result).toBe(generatedDescription);
    });

    it("should handle API errors", async () => {
      mockModels.generateContent.mockRejectedValue(new Error("Quota exceeded"));

      await expect(
        service.generateFromKeywords(["React"], "Developer")
      ).rejects.toThrow("Impossible de générer la description: Quota exceeded");
    });
  });

  describe("exported instances", () => {
    it("should export default instance", () => {
      expect(geminiService).toBeInstanceOf(GeminiService);
    });

    it("should provide factory function", () => {
      const { createGeminiService } = require("@/lib/gemini/service");
      const newInstance = createGeminiService();
      expect(newInstance).toBeInstanceOf(GeminiService);
    });
  });

  describe("validateAndFixCVStructure", () => {
    it("should preserve valid structure", async () => {
      mockModels.generateContent.mockResolvedValue({
        text: JSON.stringify(improvedCVResponse),
      });

      const result = await service.improveCompleteCV(mockCVData);
      expect(result).toEqual(improvedCVResponse);
    });

    it("should handle null/undefined sections", async () => {
      const invalidCV: CVFormData = {
        ...mockCVData,
        languages: [],
      };

      const improvedInvalidCV = {
        ...improvedCVResponse,
        languages: [],
      };

      mockModels.generateContent.mockResolvedValue({
        text: JSON.stringify(improvedInvalidCV),
      });

      const result = await service.improveCompleteCV(invalidCV);

      expect(result.personalInfo).toEqual(improvedInvalidCV.personalInfo);
      expect(result.experiences).toEqual(improvedInvalidCV.experiences);
      expect(result.education).toEqual(improvedInvalidCV.education);
      expect(result.skills).toEqual(improvedInvalidCV.skills);
      expect(result.languages).toEqual([]);
    });

    it("should set default skill levels and categories", async () => {
      const cvWithIncompleteSkills = {
        ...improvedCVResponse,
        skills: [
          { id: "skill-1", name: "JavaScript" }, // missing level and category
          { id: "skill-2", name: "Python", level: "advanced" }, // missing category
        ],
      };

      mockModels.generateContent.mockResolvedValue({
        text: JSON.stringify(cvWithIncompleteSkills),
      });

      const result = await service.improveCompleteCV(mockCVData);

      expect(result.skills[0].level).toBe("intermediate");
      expect(result.skills[0].category).toBe("other");
      expect(result.skills[1].level).toBe("advanced");
      expect(result.skills[1].category).toBe("other");
    });

    it("should set default language levels", async () => {
      const cvWithIncompleteLanguages = {
        ...improvedCVResponse,
        languages: [
          { id: "lang-1", name: "English" }, // missing level
        ],
      };

      mockModels.generateContent.mockResolvedValue({
        text: JSON.stringify(cvWithIncompleteLanguages),
      });

      const result = await service.improveCompleteCV(mockCVData);

      expect(result.languages?.[0]?.level).toBe("B1");
    });
  });
});
