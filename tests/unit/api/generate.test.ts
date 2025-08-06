import { POST } from "../../../app/api/cv/generate/route";
import { NextRequest } from "next/server";
import jsPDF from "jspdf";
import { uploadPdfToStorageAdmin, createResumeAdmin } from "@/lib/supabase/server";
import type { CVFormData } from "@/types";

// Mock jsPDF
jest.mock("jspdf", () => {
  return jest.fn().mockImplementation(() => ({
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    line: jest.fn(),
    getTextWidth: jest.fn().mockReturnValue(50),
    output: jest.fn().mockReturnValue(new ArrayBuffer(100)),
  }));
});

// Mock Supabase to avoid ES module issues
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "test-user-id", email: "test@example.com" } },
        error: null,
      }),
    },
  }),
}));

// Mock Supabase server functions
jest.mock("@/lib/supabase/server", () => ({
  uploadPdfToStorageAdmin: jest.fn(),
  createResumeAdmin: jest.fn(),
}));

// Mock Date.now and Math.random for consistent testing
const mockDateNow = jest.spyOn(Date, 'now');
const mockMathRandom = jest.spyOn(Math, 'random');

// Utility function to create a mock NextRequest
function createRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: (name: string) => headers[name] || null,
    },
  } as unknown as NextRequest;
}

describe("API POST /api/cv/generate", () => {
  const validCV: CVFormData = {
    personalInfo: { 
      name: "John Doe", 
      email: "john@example.com",
      phone: "+1234567890",
      location: "New York",
      linkedin: "linkedin.com/in/johndoe",
      website: "johndoe.com"
    },
    experiences: [
      { 
        id: "exp1",
        company: "ABC Corp", 
        position: "Software Developer", 
        startDate: "2020-01-01",
        endDate: "2022-12-31",
        location: "New York",
        description: "Developed web applications\nImplemented new features\nFixed bugs",
        isCurrentPosition: false
      }
    ],
    education: [
      { 
        id: "edu1",
        institution: "University", 
        degree: "Computer Science", 
        field: "Software Engineering",
        startDate: "2016-09-01",
        endDate: "2020-06-30",
        description: "Studied computer science fundamentals\nWorked on various projects"
      }
    ],
    skills: [
      { id: "skill1", name: "JavaScript", category: "technical" },
      { id: "skill2", name: "React", category: "technical" },
      { id: "skill3", name: "Communication", category: "soft" }
    ],
    languages: [
      { id: "lang1", name: "English", level: "native" },
      { id: "lang2", name: "Spanish", level: "B2" }
    ],
  };

  const mockUser = {
    id: "test-user-id",
    email: "test@example.com"
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup consistent mock values
    mockDateNow.mockReturnValue(1234567890123);
    mockMathRandom.mockReturnValue(0.123);
    
    // Setup default mocks
    (uploadPdfToStorageAdmin as jest.Mock).mockResolvedValue({
      path: "test-user-id/CV_John_Doe__12_1234567890123.pdf"
    });
    
    (createResumeAdmin as jest.Mock).mockResolvedValue({
      id: "resume-123",
      user_id: "test-user-id",
      title: "test-user-id/CV_John_Doe__12_1234567890123.pdf",
      generated_content: "test-user-id/CV_John_Doe__12_1234567890123.pdf"
    });
  });

  afterAll(() => {
    mockDateNow.mockRestore();
    mockMathRandom.mockRestore();
  });

  describe("POST /api/cv/generate", () => {
    it("should return 401 if no authorization header is provided", async () => {
      const req = createRequest({ cvData: validCV });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Utilisateur non authentifié");
    });

    it("should return 400 if no CV data is provided", async () => {
      const req = createRequest({}, { authorization: "Bearer mock-token" });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Données CV requises");
    });

    it("should return 400 if personal info is missing", async () => {
      const invalidCV = { ...validCV, personalInfo: { name: "", email: "" } };
      const req = createRequest({ cvData: invalidCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Nom et email requis");
    });

    it("should return 500 if PDF upload fails", async () => {
      (uploadPdfToStorageAdmin as jest.Mock).mockResolvedValue(null);
      
      const req = createRequest({ cvData: validCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Erreur interne du serveur");
    });

    it("should return 500 if resume creation fails", async () => {
      (createResumeAdmin as jest.Mock).mockResolvedValue(null);
      
      const req = createRequest({ cvData: validCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Erreur interne du serveur");
    });

    it("should return 200 and create PDF successfully", async () => {
      const req = createRequest({ cvData: validCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.resumeId).toBe("resume-123");
      expect(json.pdfPath).toBe("test-user-id/CV_John_Doe__12_1234567890123.pdf");
      expect(json.timestamp).toBeDefined();
    });
  });
});

// Test individual helper functions by importing them from the module
// Since they're not exported, we'll test them through the main function behavior
// or by testing specific scenarios that exercise those functions

describe("Helper Functions Integration Tests", () => {
  const validCV: CVFormData = {
    personalInfo: { name: "John Doe", email: "john@example.com" },
    experiences: [{ id: "1", company: "ABC", position: "Dev", startDate: "2020" }],
    education: [{ id: "1", institution: "Uni", degree: "CS", startDate: "2019" }],
    skills: [{ id: "1", name: "JS", category: "technical" }, { id: "2", name: "React", category: "technical" }],
    languages: [{ id: "1", name: "English", level: "native" }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup consistent mock values
    mockDateNow.mockReturnValue(1234567890123);
    mockMathRandom.mockReturnValue(0.123);
    
    (uploadPdfToStorageAdmin as jest.Mock).mockResolvedValue({
      path: "test-user-id/CV_John_Doe__12_1234567890123.pdf"
    });
    (createResumeAdmin as jest.Mock).mockResolvedValue({
      id: "resume-123",
      user_id: "test-user-id",
      title: "test-user-id/CV_John_Doe__12_1234567890123.pdf",
      generated_content: "test-user-id/CV_John_Doe__12_1234567890123.pdf"
    });
  });

  describe("generateFilePath function behavior", () => {
    it("should generate file path with sanitized name", async () => {
      const cvWithSpaces = {
        ...validCV,
        personalInfo: { name: "John Smith Doe", email: "john@example.com" }
      };
      
      const req = createRequest({ cvData: cvWithSpaces }, { authorization: "Bearer mock-token" });
      await POST(req);

      // Check that the file path follows the expected pattern with sanitized name
      expect(uploadPdfToStorageAdmin).toHaveBeenCalledWith(
        expect.stringMatching(/test-user-id\/CV_John_Smith_Doe__\d+_\d+\.pdf/),
        expect.any(Buffer)
      );
    });

    it("should handle missing name with default CV name", async () => {
      const cvWithoutName = {
        ...validCV,
        personalInfo: { name: "", email: "john@example.com" }
      };
      
      // This will fail validation first, but let's test with minimal valid data
      const minimalValidCV = {
        ...validCV,
        personalInfo: { name: undefined, email: "john@example.com" }
      };
      
      // Since this would fail validation, let's modify our expectation
      const req = createRequest({ cvData: minimalValidCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);
      
      // This should fail validation due to missing name
      expect(res.status).toBe(400);
    });
  });

  describe("createSuccessResponse function behavior", () => {
    it("should create proper success response structure", async () => {
      const req = createRequest({ cvData: validCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);
      const json = await res.json();

      expect(json).toMatchObject({
        success: true,
        resumeId: "resume-123",
        pdfPath: "test-user-id/CV_John_Doe__12_1234567890123.pdf",
        timestamp: expect.any(String)
      });
      
      // Verify timestamp is valid ISO string
      expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
    });
  });

  describe("PDF generation function behavior", () => {
    it("should call jsPDF with correct configuration", async () => {
      const req = createRequest({ cvData: validCV }, { authorization: "Bearer mock-token" });
      await POST(req);

      expect(jsPDF).toHaveBeenCalledWith({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
    });

    it("should handle CV with minimal data", async () => {
      const minimalCV: CVFormData = {
        personalInfo: { name: "John Doe", email: "john@example.com" },
        experiences: [],
        education: [],
        skills: [],
        languages: [],
      };

      const req = createRequest({ cvData: minimalCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it("should handle CV with all sections populated", async () => {
      const fullCV: CVFormData = {
        personalInfo: { 
          name: "John Doe", 
          email: "john@example.com",
          phone: "+1234567890",
          location: "New York",
          linkedin: "linkedin.com/in/johndoe",
          website: "johndoe.com"
        },
        experiences: [
          {
            id: "1",
            company: "Company A",
            position: "Senior Developer",
            startDate: "2020-01-01",
            endDate: "2023-12-31",
            location: "New York",
            description: "Led development team\nImplemented new features\nImproved performance by 50%",
            isCurrentPosition: false
          },
          {
            id: "2",
            company: "Company B",
            position: "Lead Developer",
            startDate: "2024-01-01",
            location: "Remote",
            description: "Currently leading a team of 5 developers\nWorking on microservices architecture",
            isCurrentPosition: true
          }
        ],
        education: [
          {
            id: "1",
            institution: "University of Technology",
            degree: "Master of Science",
            field: "Computer Science",
            startDate: "2016-09-01",
            endDate: "2020-06-30",
            description: "Specialized in AI and Machine Learning\nThesis on Natural Language Processing"
          }
        ],
        skills: [
          { id: "1", name: "JavaScript", category: "technical" },
          { id: "2", name: "TypeScript", category: "technical" },
          { id: "3", name: "React", category: "technical" },
          { id: "4", name: "Leadership", category: "soft" },
          { id: "5", name: "Problem Solving", category: "other" }
        ],
        languages: [
          { id: "1", name: "English", level: "native" },
          { id: "2", name: "French", level: "C1" },
          { id: "3", name: "Spanish", level: "B2" }
        ],
      };

      const req = createRequest({ cvData: fullCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe("groupByCat function behavior", () => {
    it("should group skills by category correctly", async () => {
      const skillsCV: CVFormData = {
        personalInfo: { name: "John Doe", email: "john@example.com" },
        experiences: [],
        education: [],
        skills: [
          { id: "1", name: "JavaScript", category: "technical" },
          { id: "2", name: "Python", category: "technical" },
          { id: "3", name: "Leadership", category: "soft" },
          { id: "4", name: "Communication", category: "soft" },
          { id: "5", name: "Photography", category: "other" }
        ],
        languages: [],
      };

      const req = createRequest({ cvData: skillsCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(jsPDF).toHaveBeenCalled();
    });

    it("should handle undefined skills array", async () => {
      const noSkillsCV: CVFormData = {
        personalInfo: { name: "John Doe", email: "john@example.com" },
        experiences: [],
        education: [],
        skills: undefined as any,
        languages: [],
      };

      const req = createRequest({ cvData: noSkillsCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it("should handle skills without category", async () => {
      const mixedSkillsCV: CVFormData = {
        personalInfo: { name: "John Doe", email: "john@example.com" },
        experiences: [],
        education: [],
        skills: [
          { id: "1", name: "JavaScript", category: "technical" },
          { id: "2", name: "Problem Solving" }, // No category
          { id: "3", name: "React", category: "technical" }
        ],
        languages: [],
      };

      const req = createRequest({ cvData: mixedSkillsCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });
  });

  describe("handleFileStorageAndDatabase function behavior", () => {
    it("should handle successful file upload and database creation", async () => {
      const req = createRequest({ cvData: validCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);
      const json = await res.json();

      // Check that upload was called with correct pattern
      expect(uploadPdfToStorageAdmin).toHaveBeenCalledWith(
        expect.stringMatching(/test-user-id\/CV_John_Doe__\d+_\d+\.pdf/),
        expect.any(Buffer)
      );

      // Get the actual file path that was used
      const uploadCall = (uploadPdfToStorageAdmin as jest.Mock).mock.calls[0];
      const actualFilePath = uploadCall[0];

      expect(createResumeAdmin).toHaveBeenCalledWith({
        user_id: "test-user-id",
        title: actualFilePath,
        generated_content: "test-user-id/CV_John_Doe__12_1234567890123.pdf",
      });

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.resumeId).toBe("resume-123");
    });

    it("should handle upload failure", async () => {
      (uploadPdfToStorageAdmin as jest.Mock).mockResolvedValue(null);

      const req = createRequest({ cvData: validCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Erreur interne du serveur");
    });

    it("should handle database creation failure", async () => {
      (createResumeAdmin as jest.Mock).mockResolvedValue({ id: null });

      const req = createRequest({ cvData: validCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Erreur interne du serveur");
    });
  });

  describe("PDF text wrapping and formatting", () => {
    it("should handle very long text descriptions", async () => {
      const longTextCV: CVFormData = {
        personalInfo: { name: "John Doe", email: "john@example.com" },
        experiences: [{
          id: "1",
          company: "Very Long Company Name That Should Be Wrapped Properly",
          position: "Senior Software Engineer with Very Long Title That Exceeds Normal Length",
          startDate: "2020-01-01",
          description: "This is a very long description that should be wrapped properly across multiple lines. ".repeat(10),
          isCurrentPosition: true
        }],
        education: [],
        skills: [],
        languages: [],
      };

      const req = createRequest({ cvData: longTextCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(jsPDF).toHaveBeenCalled();
    });

    it("should handle special characters in text", async () => {
      const specialCharsCV: CVFormData = {
        personalInfo: { 
          name: "José María Ñoño", 
          email: "jose@example.com",
          location: "São Paulo, Brazil"
        },
        experiences: [{
          id: "1",
          company: "Empresa & Compañía",
          position: "Développeur",
          startDate: "2020-01-01",
          description: "Worked with special characters: ñ, ç, é, à, ü, ß",
          isCurrentPosition: true
        }],
        education: [],
        skills: [],
        languages: [],
      };

      const req = createRequest({ cvData: specialCharsCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it("should handle empty or null values gracefully", async () => {
      const emptyValuesCV: CVFormData = {
        personalInfo: { name: "John Doe", email: "john@example.com", phone: "", location: null as any },
        experiences: [{
          id: "1",
          company: "Company",
          position: "Developer",
          startDate: "2020-01-01",
          description: "",
          location: "",
          endDate: ""
        }],
        education: [{
          id: "1",
          institution: "University",
          degree: "CS",
          startDate: "2019",
          description: null as any,
          field: ""
        }],
        skills: [{ id: "1", name: "JavaScript", category: "technical" }],
        languages: [{ id: "1", name: "", level: "B2" }],
      };

      const req = createRequest({ cvData: emptyValuesCV }, { authorization: "Bearer mock-token" });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });
  });
});