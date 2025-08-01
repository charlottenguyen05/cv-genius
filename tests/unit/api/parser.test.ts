import { NextRequest } from "next/server";
import { POST } from "@/app/api/parser/route";
import { spawn } from "child_process";
import { writeFile, unlink, access, mkdir } from "fs/promises";
import { EventEmitter } from "events";

// Mock dependencies
jest.mock("child_process");
jest.mock("fs/promises");

const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockedWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockedUnlink = unlink as jest.MockedFunction<typeof unlink>;
const mockedAccess = access as jest.MockedFunction<typeof access>;
const mockedMkdir = mkdir as jest.MockedFunction<typeof mkdir>;

describe("/api/parser Route Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST endpoint", () => {
    const createMockFile = (options: {
      name?: string;
      type?: string;
      size?: number;
    } = {}) => {
      const mockFile = {
        name: options.name || "test.pdf",
        type: options.type || "application/pdf",
        size: options.size || 1024,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(options.size || 1024)),
      };
      
      return mockFile as unknown as File;
    };

    const createMockRequest = (file?: File) => {
      const mockFormData = {
        get: jest.fn().mockReturnValue(file),
      };

      return {
        formData: jest.fn().mockResolvedValue(mockFormData),
      } as unknown as NextRequest;
    };

    const createMockPythonProcess = () => {
      const mockProcess = new EventEmitter();
      (mockProcess as any).stdout = new EventEmitter();
      (mockProcess as any).stderr = new EventEmitter();
      (mockProcess as any).kill = jest.fn();
      return mockProcess;
    };

    it("should successfully parse a valid PDF file", async () => {
      const file = createMockFile();
      const request = createMockRequest(file);
      
      // Mock file operations
      mockedAccess.mockResolvedValue(undefined);
      mockedWriteFile.mockResolvedValue(undefined);
      mockedUnlink.mockResolvedValue(undefined);

      // Mock Python process
      const mockProcess = createMockPythonProcess();
      mockedSpawn.mockReturnValue(mockProcess as any);

      // Mock successful Python execution
      const mockParsedData = {
        personalInfo: {
          name: "John Doe",
          email: "john@example.com",
          phone: "+1234567890",
          location: "Paris, France",
        },
        experiences: [
          {
            id: "exp-1",
            company: "Tech Corp",
            position: "Developer",
            startDate: "2020-01",
            endDate: "2023-01",
            description: "Developed applications",
          },
        ],
        education: [],
        skills: [],
        languages: [],
      };

      const responsePromise = POST(request);

      // Simulate Python process success
      setTimeout(() => {
        (mockProcess as any).stdout.emit("data", JSON.stringify(mockParsedData));
        mockProcess.emit("close", 0);
      }, 10);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.parsedData.personalInfo.name).toBe("John Doe");
      expect(mockedWriteFile).toHaveBeenCalled();
      expect(mockedUnlink).toHaveBeenCalled();
    });

    it("should return error when no file is provided", async () => {
      const request = createMockRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Aucun fichier fourni");
    });

    it("should return error for non-PDF file types", async () => {
      const file = createMockFile({ type: "text/plain" });
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Seuls les fichiers PDF sont supportés");
    });

    it("should return error for files larger than 10MB", async () => {
      const file = createMockFile({ size: 11 * 1024 * 1024 }); // 11MB
      const request = createMockRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Le fichier ne doit pas dépasser 10MB");
    });

    it("should create tmp directory if it doesn't exist", async () => {
      const file = createMockFile();
      const request = createMockRequest(file);

      // Mock directory doesn't exist
      mockedAccess.mockRejectedValue(new Error("Directory not found"));
      mockedMkdir.mockResolvedValue(undefined);
      mockedWriteFile.mockResolvedValue(undefined);
      mockedUnlink.mockResolvedValue(undefined);

      const mockProcess = createMockPythonProcess();
      mockedSpawn.mockReturnValue(mockProcess as any);

      const responsePromise = POST(request);

      setTimeout(() => {
        (mockProcess as any).stdout.emit("data", JSON.stringify({ personalInfo: {} }));
        mockProcess.emit("close", 0);
      }, 10);

      const response = await responsePromise;

      expect(response.status).toBe(200);
      expect(mockedMkdir).toHaveBeenCalledWith(
        expect.stringContaining("tmp"),
        { recursive: true }
      );
    });

    it("should handle tmp directory creation failure", async () => {
      const file = createMockFile();
      const request = createMockRequest(file);

      mockedAccess.mockRejectedValue(new Error("Directory not found"));
      mockedMkdir.mockRejectedValue(new Error("Permission denied"));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Erreur lors de la creation de tmp directoire");
    });

    it("should handle file write errors", async () => {
      const file = createMockFile();
      const request = createMockRequest(file);

      mockedAccess.mockResolvedValue(undefined);
      mockedWriteFile.mockRejectedValue(new Error("Write failed"));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Erreur lors de la sauvegarde du fichier");
    });

    it("should handle Python process spawn errors with fallback", async () => {
      const file = createMockFile();
      const request = createMockRequest(file);

      mockedAccess.mockResolvedValue(undefined);
      mockedWriteFile.mockResolvedValue(undefined);
      mockedUnlink.mockResolvedValue(undefined);

      // First spawn fails (venv), second succeeds (fallback)
      const mockFallbackProcess = createMockPythonProcess();
      mockedSpawn
        .mockImplementationOnce(() => {
          const failedProcess = createMockPythonProcess();
          setTimeout(() => failedProcess.emit("error", new Error("Venv failed")), 10);
          return failedProcess as any;
        })
        .mockImplementationOnce(() => mockFallbackProcess as any);

      const responsePromise = POST(request);

      setTimeout(() => {
        (mockFallbackProcess as any).stdout.emit("data", JSON.stringify({ personalInfo: {} }));
        mockFallbackProcess.emit("close", 0);
      }, 50);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockedSpawn).toHaveBeenCalledTimes(2);
    });

    it("should handle complete Python failure", async () => {
      const file = createMockFile();
      const request = createMockRequest(file);

      mockedAccess.mockResolvedValue(undefined);
      mockedWriteFile.mockResolvedValue(undefined);
      mockedUnlink.mockResolvedValue(undefined);

      const mockProcess = createMockPythonProcess();
      mockedSpawn.mockImplementation(() => {
        const failedProcess = createMockPythonProcess();
        setTimeout(() => failedProcess.emit("error", new Error("Python failed")), 10);
        return failedProcess as any;
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.details).toContain("Python indisponible");
    });

    it("should handle Python process non-zero exit code", async () => {
      const file = createMockFile();
      const request = createMockRequest(file);

      mockedAccess.mockResolvedValue(undefined);
      mockedWriteFile.mockResolvedValue(undefined);
      mockedUnlink.mockResolvedValue(undefined);

      const mockProcess = createMockPythonProcess();
      mockedSpawn.mockReturnValue(mockProcess as any);

      const responsePromise = POST(request);

      setTimeout(() => {
        (mockProcess as any).stderr.emit("data", "Python error occurred");
        mockProcess.emit("close", 1);
      }, 10);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.details).toContain("Script Python échoué");
    });

    it("should handle invalid JSON from Python script", async () => {
      const file = createMockFile();
      const request = createMockRequest(file);

      mockedAccess.mockResolvedValue(undefined);
      mockedWriteFile.mockResolvedValue(undefined);
      mockedUnlink.mockResolvedValue(undefined);

      const mockProcess = createMockPythonProcess();
      mockedSpawn.mockReturnValue(mockProcess as any);

      const responsePromise = POST(request);

      setTimeout(() => {
        (mockProcess as any).stdout.emit("data", "invalid json");
        mockProcess.emit("close", 0);
      }, 10);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.details).toContain("Erreur de parsing JSON");
    });

    it("should handle temp file cleanup failure gracefully", async () => {
      const file = createMockFile();
      const request = createMockRequest(file);

      mockedAccess.mockResolvedValue(undefined);
      mockedWriteFile.mockResolvedValue(undefined);
      mockedUnlink.mockRejectedValue(new Error("Cleanup failed"));

      const mockProcess = createMockPythonProcess();
      mockedSpawn.mockReturnValue(mockProcess as any);

      const responsePromise = POST(request);

      setTimeout(() => {
        (mockProcess as any).stdout.emit("data", JSON.stringify({ personalInfo: {} }));
        mockProcess.emit("close", 0);
      }, 10);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should warn but not fail
    });

    it("should format parsed data correctly with missing fields", async () => {
      const file = createMockFile();
      const request = createMockRequest(file);

      mockedAccess.mockResolvedValue(undefined);
      mockedWriteFile.mockResolvedValue(undefined);
      mockedUnlink.mockResolvedValue(undefined);

      const mockProcess = createMockPythonProcess();
      mockedSpawn.mockReturnValue(mockProcess as any);

      // Mock incomplete data
      const incompleteData = {
        personalInfo: { name: "John" },
        experiences: [{ company: "Tech Corp" }],
        education: [{}],
        skills: [{ name: "JavaScript" }],
        // Missing languages
      };

      const responsePromise = POST(request);

      setTimeout(() => {
        (mockProcess as any).stdout.emit("data", JSON.stringify(incompleteData));
        mockProcess.emit("close", 0);
      }, 10);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Check default values are applied
      const { parsedData } = data;
      expect(parsedData.personalInfo.email).toBe("");
      expect(parsedData.experiences[0].position).toBe("");
      expect(parsedData.education[0].institution).toBe("");
      expect(parsedData.skills[0].category).toBe("other");
      expect(parsedData.languages).toEqual([]);
    });

    it("should handle completely empty parsed data", async () => {
      const file = createMockFile();
      const request = createMockRequest(file);

      mockedAccess.mockResolvedValue(undefined);
      mockedWriteFile.mockResolvedValue(undefined);
      mockedUnlink.mockResolvedValue(undefined);

      const mockProcess = createMockPythonProcess();
      mockedSpawn.mockReturnValue(mockProcess as any);

      const responsePromise = POST(request);

      setTimeout(() => {
        (mockProcess as any).stdout.emit("data", JSON.stringify({}));
        mockProcess.emit("close", 0);
      }, 10);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.parsedData.personalInfo.name).toBe("");
      expect(data.parsedData.experiences).toEqual([]);
      expect(data.parsedData.education).toEqual([]);
      expect(data.parsedData.skills).toEqual([]);
      expect(data.parsedData.languages).toEqual([]);
    });

    it("should handle general errors in POST", async () => {
      const request = {
        formData: jest.fn().mockRejectedValue(new Error("Request failed")),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Erreur interne lors du parsing du CV");
      expect(data.details).toBe("Request failed");
    });
  });
}); 