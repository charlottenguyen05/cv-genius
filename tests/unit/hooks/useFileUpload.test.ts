import { renderHook, waitFor } from "@testing-library/react";
import { useFileUpload, MAX_FILE_SIZE } from "@/lib/hooks/useFileUpload";
import { CVFormData } from "@/types";
import { act } from "react";

// Mock fetch globally
global.fetch = jest.fn();

describe("useFileUpload", () => {

  const createMockFile = (
    name: string = "test.pdf",
    type: string = "application/pdf",
    size: number = 1024
  ): File => {
    const file = new File(["test content"], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  const createMockCVData = (): CVFormData => ({
    personalInfo: {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
    },
    experiences: [
      {
        company: "Tech Corp",
        position: "Developer",
        startDate: "2020-01",
        endDate: "2023-01",
        description: "Developed web applications",
      },
    ],
    education: [
      {
        institution: "University",
        degree: "Computer Science",
        startDate: "2016",
        endDate: "2020",
      },
    ],
    skills: [{ name: "JavaScript" }, { name: "React" }, { name: "Node.js" }],
    languages: [{ name: "English" }, { name: "French" }],
  });

  const mockSuccessResponse = (data = createMockCVData()) => ({
    ok: true,
    json: async () => ({ success: true, parsedData: data, source: "pdf" }),
  });

  const mockErrorResponse = (error = "Server error") => ({
    ok: false,
    status: 500,
    statusText: "Internal Server Error",
    json: async () => ({ error }),
  });

  describe("Initial State", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => useFileUpload());

      expect(result.current.uploadedFile).toBeNull();
      expect(result.current.isDragOver).toBe(false);
      expect(result.current.errors).toEqual({});
      expect(result.current.parsedData).toBeNull();
      expect(result.current.isUploading).toBe(false);
    });
  });

  describe("File Validation", () => {
    it("should accept valid PDF and TXT files", async () => {
      const { result } = renderHook(() => useFileUpload());
      (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse());

      await act(() => result.current.handleFileSelect(createMockFile()));

      expect(result.current.errors).toEqual({});
      expect(result.current.uploadedFile).toBeTruthy();
    });

    it("should reject files that are too large", async () => {
      const { result } = renderHook(() => useFileUpload());
      const largeFile = createMockFile(
        "large.pdf",
        "application/pdf",
        MAX_FILE_SIZE + 1
      );

      await act(() => result.current.handleFileSelect(largeFile));

      expect(result.current.errors.file).toBe(
        "Le fichier ne doit pas dépasser 10MB"
      );
      expect(result.current.uploadedFile).toBeNull();
    });

    it("should reject files with invalid types", async () => {
      const { result } = renderHook(() => useFileUpload());
      const invalidFile = createMockFile("test.doc", "application/msword");

      await act(() => result.current.handleFileSelect(invalidFile));

      expect(result.current.errors.file).toBe(
        "Seuls les fichiers PDF et TXT sont acceptés"
      );
      expect(result.current.uploadedFile).toBeNull();
    });
  });

  describe("File Parsing", () => {
    it("should successfully parse file and call onDataParsed callback", async () => {
      const onDataParsed = jest.fn();
      const { result } = renderHook(() => useFileUpload(onDataParsed));
      const mockData = createMockCVData();
      (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse(mockData));  // return MockResponse object

      await act(() => result.current.handleFileSelect(createMockFile()));

      expect(result.current.parsedData).toEqual(mockData);
      expect(onDataParsed).toHaveBeenCalledWith(mockData);
      expect(result.current.isUploading).toBe(false);
    });

    it("should handle API errors", async () => {
      const { result } = renderHook(() => useFileUpload());
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockErrorResponse("Custom error")
      );

      await act(() => result.current.handleFileSelect(createMockFile()));

      expect(result.current.errors.file).toBe("Custom error");
      expect(result.current.parsedData).toBeNull();
    });

    it("should handle network errors", async () => {
      const { result } = renderHook(() => useFileUpload());
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      await act(() => result.current.handleFileSelect(createMockFile()));

      expect(result.current.errors.file).toBe(
        "Erreur de connexion au serveur. Vérifiez votre connexion internet."
      );
    });

    it("should handle unsuccessful parsing response", async () => {
      const { result } = renderHook(() => useFileUpload());
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, parsedData: null }),
      });

      await act(() => result.current.handleFileSelect(createMockFile()));

      expect(result.current.errors.file).toBe(
        "Erreur lors de l'extraction des données du CV"
      );
    });
  });

  describe("Drag and Drop", () => {
    it("should handle file drop", async () => {
      const { result } = renderHook(() => useFileUpload());
      (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse());

      const mockDragEvent = {
        preventDefault: jest.fn(),
        dataTransfer: { files: [createMockFile()] },
      } as unknown as React.DragEvent;

      act(() => result.current.setIsDragOver(true));
      act(() => result.current.handleDrop(mockDragEvent));

      expect(mockDragEvent.preventDefault).toHaveBeenCalled();
      expect(result.current.isDragOver).toBe(false);
      expect(result.current.uploadedFile).toBeTruthy();
    });
  });

  describe("File Input", () => {
    it("should handle file input change", async () => {
      const { result } = renderHook(() => useFileUpload());
      (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse());

      const mockInputEvent = {
        target: { files: [createMockFile()], value: "test-value" },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => result.current.handleFileInput(mockInputEvent));

      expect(result.current.uploadedFile).toBeTruthy();
      expect(mockInputEvent.target.value).toBe("");
    });

    it("should handle empty file input", () => {
      const { result } = renderHook(() => useFileUpload());

      const mockInputEvent = {
        target: { files: null, value: "" },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => result.current.handleFileInput(mockInputEvent));

      expect(result.current.uploadedFile).toBeNull();
    });
  });

  describe("File Operations", () => {
    it("should remove file and reset state", async () => {
      const { result } = renderHook(() => useFileUpload());
      (fetch as jest.Mock).mockResolvedValueOnce(mockSuccessResponse());

      await act(async () => result.current.handleFileSelect(createMockFile()));
      act(() => result.current.removeFile());

      expect(result.current.uploadedFile).toBeNull();
      expect(result.current.parsedData).toBeNull();
      expect(result.current.errors).toEqual({});
      expect(result.current.isUploading).toBe(false);
    });

    it("should set file error manually", () => {
      const { result } = renderHook(() => useFileUpload());
      const errorMessage = "Custom error message";

      act(() => result.current.setFileError(errorMessage));

      expect(result.current.errors.file).toBe(errorMessage);
    });
  });

  describe("Loading States", () => {
    it("should set isUploading during parsing", async () => {
      const { result } = renderHook(() => useFileUpload());

      let resolvePromise: (value: any) => void;
      // Make the internal resolve function to become external function resolvePromise
      // Call resolvePromise(resolvedValue) will resolve successfully the promise
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;  // pending state
      });

      (fetch as jest.Mock).mockReturnValueOnce(mockPromise);

      // await act (async() => await ...) use for asynchronous function, wait until the function is resolved
      // act (() => ...) use for synchronous function
      act(() => {
        // parseFile is asynchronous function but we don't use await here 
        // because we DON'T want to wait until the fetch (inside parseFile) is resolved
        // This will leave the parseFile function still in pending state
        // so we can check the isUploading state is true
        result.current.parseFile(createMockFile());  
      });

      // Wait until the expect is true
      await waitFor(() => expect(result.current.isUploading).toBe(true));

      resolvePromise!(mockSuccessResponse());

      await waitFor(() => expect(result.current.isUploading).toBe(false));
    });
  });
});
