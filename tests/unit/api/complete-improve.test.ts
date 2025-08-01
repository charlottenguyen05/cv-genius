import { POST } from "../../../app/api/cv/complete-improve/route";
import { NextRequest } from "next/server";
import { geminiService } from "@/lib/gemini/service";
import type { CVFormData } from "@/types";

// Mock Supabase to avoid ES module issues
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "test-user" } },
        error: null,
      }),
    },
  }),
}));

// ✅ Mock du service Gemini seulement (NextResponse est mocké globalement)
jest.mock("@/lib/gemini/service", () => ({
  geminiService: {
    improveCompleteCV: jest.fn(),
  },
}));

// ✅ Fonction utilitaire pour créer un MockNextRequest objet (NextRequest is now mocked by MockNextRequest)
function createRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: (name: string) => headers[name] || null,
    },
  } as unknown as NextRequest;
}

describe("API POST /api/cv/complete-improve", () => {
  const validCV: CVFormData = {
    personalInfo: { name: "John Doe", email: "john@example.com" },
    experiences: [{ company: "ABC", position: "Dev", startDate: "2020" }],
    education: [{ institution: "Uni", degree: "CS", startDate: "2019" }],
    skills: [{ name: "JS" }, { name: "React" }],
    languages: [{ name: "English" }],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("return 400 if no data is provided", async () => {
    const req = createRequest({}, { authorization: "Bearer mock-token" });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("Données CV requises");
  });

  it("return 400 if personal data is missed", async () => {
    const req = createRequest({ formData: { personalInfo: { name: "" } } }, { authorization: "Bearer mock-token" });
    const res = await POST(req);  // res = MockResponse object
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Nom et email requis");
  });

  it("return 500 if Gemini return error", async () => {
    (geminiService.improveCompleteCV as jest.Mock).mockRejectedValue(
      new Error("Gemini Down")
    );
    const req = createRequest({ formData: validCV }, { authorization: "Bearer mock-token" });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toContain("Erreur lors de l'amélioration");
    expect(json.details).toBe("Gemini Down");
  });

  it("return 500 if Gemini return the invalid JSON response", async () => {
    (geminiService.improveCompleteCV as jest.Mock).mockResolvedValue({
      personalInfo: null,
    });
    const req = createRequest({ formData: validCV }, { authorization: "Bearer mock-token" });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toContain("Structure JSON invalide");
  });

  it("return 200 and the correct CV JSON format", async () => {
    (geminiService.improveCompleteCV as jest.Mock).mockResolvedValue(validCV);
    const req = createRequest({ formData: validCV }, { authorization: "Bearer mock-token" });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.improvedCV.personalInfo.name).toBe("John Doe");
    expect(json.source).toBe("cv-genius-gemini-improvement");
    expect(json.timestamp).toBeDefined();
  });
});
