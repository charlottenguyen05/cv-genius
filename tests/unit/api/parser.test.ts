import { POST } from "../../../app/api/parser/route";
import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { writeFile, unlink, access, mkdir } from "fs/promises";

// Mock fs/promises
const mockWriteFile = jest.fn();
const mockUnlink = jest.fn();
const mockAccess = jest.fn();
const mockMkdir = jest.fn();

jest.mock("fs/promises", () => ({
  writeFile: mockWriteFile,
  unlink: mockUnlink,
  access: mockAccess,
  mkdir: mockMkdir,
}));

// Mock child_process
jest.mock("child_process");
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

// Mock Date.now and Math.random for consistent file naming
const mockDateNow = jest.spyOn(Date, "now");
const mockMathRandom = jest.spyOn(Math, "random");

/**
 * Helper function to create a NextRequest with FormData
 */
function createRequestWithFile(
  fileName: string = "test-cv.pdf",
  fileSize: number = 1000,
  fileType: string = "application/pdf",
  fileContent: string = "mock-pdf-content"
): NextRequest {
  const file = new File([fileContent], fileName, { type: fileType });
  Object.defineProperty(file, "size", { value: fileSize });

  // Add arrayBuffer method for the mock
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => Buffer.from(fileContent).buffer,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  const formData = new FormData();
  formData.append("file", file);

  return {
    formData: async () => formData,
  } as unknown as NextRequest;
}

/**
 * Helper function to create a NextRequest without a file
 */
function createRequestWithoutFile(): NextRequest {
  const formData = new FormData();
  return {
    formData: async () => formData,
  } as unknown as NextRequest;
}

/**
 * Helper function to create mock successful Python process
 */
function createMockSuccessfulPythonProcess(outputData: any) {
  const mockProcess = {
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn(),
    kill: jest.fn(),
  };

  // Set up the mock to immediately call callbacks with success
  mockProcess.stdout.on.mockImplementation((event, callback) => {
    if (event === "data") {
      setTimeout(() => callback(Buffer.from(JSON.stringify(outputData))), 0);
    }
  });

  mockProcess.on.mockImplementation((event, callback) => {
    if (event === "close") {
      setTimeout(() => callback(0), 10); // Success exit code
    }
  });

  return mockProcess;
}

/**
 * Helper function to create mock failed Python process
 */
function createMockFailedPythonProcess(errorMessage: string = "Python error") {
  const mockProcess = {
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn(),
    kill: jest.fn(),
  };

  mockProcess.stderr.on.mockImplementation((event, callback) => {
    if (event === "data") {
      setTimeout(() => callback(Buffer.from(errorMessage)), 0);
    }
  });

  mockProcess.on.mockImplementation((event, callback) => {
    if (event === "close") {
      setTimeout(() => callback(1), 10); // Error exit code
    }
  });

  return mockProcess;
}

describe("API POST /api/parser", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup consistent mock values
    mockDateNow.mockReturnValue(1234567890123);
    mockMathRandom.mockReturnValue(0.123456789);

    // Default fs mocks
    mockAccess.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue("");
  });

  afterAll(() => {
    mockDateNow.mockRestore();
    mockMathRandom.mockRestore();
  });

  describe("File Validation", () => {
    it("should return 400 if no file is provided", async () => {
      const req = createRequestWithoutFile();
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe("Aucun fichier fourni");
    });

    it("should return 400 if file is not PDF", async () => {
      const req = createRequestWithFile("test.txt", 1000, "text/plain");
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe("Seuls les fichiers PDF sont supportés");
    });

    it("should return 400 if file exceeds size limit", async () => {
      const req = createRequestWithFile("large.pdf", 11 * 1024 * 1024); // 11MB
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe("Le fichier ne doit pas dépasser 10MB");
    });
  });

  describe("Successful Parsing", () => {
    it("should successfully parse PDF and return formatted data", async () => {
      const mockParsedData = {
        personalInfo: {
          name: "John Doe",
          email: "john@example.com",
          phone: "+33123456789",
          location: "Paris",
          linkedin: "https://linkedin.com/in/johndoe",
          website: "https://johndoe.com",
        },
        experiences: [
          {
            id: "exp-1",
            company: "Tech Corp",
            position: "Software Engineer",
            location: "Paris",
            startDate: "2020",
            endDate: "2023",
            description: "Developed web applications",
            isCurrentPosition: false,
          },
        ],
        education: [
          {
            id: "edu-1",
            institution: "INSA Toulouse",
            degree: "Engineering Degree",
            field: "Computer Science",
            startDate: "2016",
            endDate: "2020",
            description: "Computer science studies",
          },
        ],
        skills: [
          {
            id: "skill-1",
            name: "JavaScript",
            category: "technical",
            level: "intermediate",
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

      const mockProcess = createMockSuccessfulPythonProcess(mockParsedData);
      mockSpawn.mockReturnValue(mockProcess as any);

      const req = createRequestWithFile();
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.parsedData).toBeDefined();
      expect(json.parsedData.personalInfo.name).toBe("John Doe");
      expect(json.parsedData.experiences).toHaveLength(1);
      expect(json.parsedData.education).toHaveLength(1);
      expect(json.parsedData.skills).toHaveLength(1);
      expect(json.parsedData.languages).toHaveLength(1);
      expect(json.source).toBe("cv-genius-python-parser");
      expect(json.timestamp).toBeDefined();
    });

    it("should handle empty parsed data", async () => {
      const emptyData = {
        personalInfo: {},
        experiences: [],
        education: [],
        skills: [],
        languages: [],
      };

      const mockProcess = createMockSuccessfulPythonProcess(emptyData);
      mockSpawn.mockReturnValue(mockProcess as any);

      const req = createRequestWithFile();
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.parsedData.personalInfo.name).toBe("");
      expect(json.parsedData.experiences).toEqual([]);
      expect(json.parsedData.education).toEqual([]);
      expect(json.parsedData.skills).toEqual([]);
      expect(json.parsedData.languages).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should handle Python process failure", async () => {
      const mockProcess = createMockFailedPythonProcess("Python script error");
      mockSpawn.mockReturnValue(mockProcess as any);

      const req = createRequestWithFile();
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toBe("Erreur interne lors du parsing du CV");
    });

    it("should handle file write error", async () => {
      mockWriteFile.mockRejectedValue(new Error("Write failed"));

      const req = createRequestWithFile();
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toBe("Erreur interne lors du parsing du CV");
    });

    it("should handle invalid JSON from Python", async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn(),
      };

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === "data") {
          setTimeout(() => callback(Buffer.from("Invalid JSON")), 0);
        }
      });

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === "close") {
          setTimeout(() => callback(0), 10);
        }
      });

      mockSpawn.mockReturnValue(mockProcess as any);

      const req = createRequestWithFile();
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toBe("Erreur interne lors du parsing du CV");
    });
  });

  describe("Data Formatting", () => {
    it("should format parsed data with missing fields", async () => {
      const incompleteData = {
        personalInfo: { name: "John" }, // Missing email
        experiences: [{ company: "Corp" }], // Missing required fields
        education: [],
        skills: [{ name: "JS" }], // Missing category
        languages: null, // Missing languages
      };

      const mockProcess = createMockSuccessfulPythonProcess(incompleteData);
      mockSpawn.mockReturnValue(mockProcess as any);

      const req = createRequestWithFile();
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);

      // Verify formatting with defaults
      expect(json.parsedData.personalInfo.email).toBe("");
      expect(json.parsedData.experiences[0].position).toBe("");
      expect(json.parsedData.skills[0].category).toBe("other");
      expect(json.parsedData.languages).toEqual([]);
    });
  });
});
