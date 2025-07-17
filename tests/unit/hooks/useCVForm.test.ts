// useCVForm.test.ts
import { renderHook } from "@testing-library/react";
import { useCVForm } from "@/lib/hooks/useCVForm";
import { act } from "react";
import { getCurrentUser } from "@/lib/supabase/client";

jest.mock("@/lib/supabase/client", () => ({
  getCurrentUser: jest.fn(),
}));


describe("useCVForm", () => {
  const originalDateNow = Date.now;
  const mockNow = 1_700_000_000_000;

  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentUser as jest.Mock).mockResolvedValue({
      user: { id: "u1" },
      error: null,
    });
    Date.now = jest.fn(() => mockNow);
  });

  afterAll(() => {
    Date.now = originalDateNow;
  });

  it("initial state", () => {
    const { result } = renderHook(() => useCVForm());
    expect(result.current.formData).toEqual({
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
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBe("");
    expect(result.current.showToast).toBe(false);
    expect(result.current.showCard).toBe(false);
  });

  it("updatePersonalInfo", () => {
    const { result } = renderHook(() => useCVForm());
    act(() => result.current.updatePersonalInfo("name", "John"));
    expect(result.current.formData.personalInfo.name).toBe("John");
  });

  it("add / update / remove experience", () => {
    const { result } = renderHook(() => useCVForm());

    act(() => result.current.addExperience());
    expect(result.current.formData.experiences).toHaveLength(1);
    expect(result.current.formData.experiences[0].id).toBe(String(mockNow));

    act(() => result.current.updateExperience(0, "company", "ACME"));
    expect(result.current.formData.experiences[0].company).toBe("ACME");

    act(() => result.current.removeExperience(0));
    expect(result.current.formData.experiences).toHaveLength(0);
  });

  it("add / update / remove education", () => {
    const { result } = renderHook(() => useCVForm());
    act(() => result.current.addEducation());
    act(() => result.current.updateEducation(0, "institution", "MIT"));
    expect(result.current.formData.education[0].institution).toBe("MIT");
    act(() => result.current.removeEducation(0));
    expect(result.current.formData.education).toHaveLength(0);
  });

  it("add / update / remove skill & language", () => {
    const { result } = renderHook(() => useCVForm());

    act(() => result.current.addSkill());
    act(() => result.current.updateSkill(0, "name", "React"));
    expect(result.current.formData.skills[0].name).toBe("React");
    act(() => result.current.removeSkill(0));
    expect(result.current.formData.skills).toHaveLength(0);

    act(() => result.current.addLanguage());
    act(() => result.current.updateLanguage(0, "name", "French"));
    expect(result.current.formData.languages?.[0].name).toBe("French");
    act(() => result.current.removeLanguage(0));
    expect(result.current.formData.languages).toHaveLength(0);
  });

  it("loadParsedData merges correctly", () => {
    const { result } = renderHook(() => useCVForm());

    // Existing name stays if parsed is empty
    act(() => result.current.updatePersonalInfo("name", "Existing"));
    const parsed = {
      personalInfo: {
        name: "",
        email: "new@mail.com",
        phone: "",
        location: "",
        linkedin: "",
        website: "",
      },
      experiences: [
        {
          id: "1",
          company: "X",
          position: "",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
          isCurrentPosition: false,
        },
      ],
      education: [],
      skills: [],
      languages: [],
    };

    act(() => result.current.loadParsedData(parsed as any));
    expect(result.current.formData.personalInfo.name).toBe("Existing");
    expect(result.current.formData.personalInfo.email).toBe("new@mail.com");
    expect(result.current.formData.experiences).toHaveLength(1);
  });

  it("handleSubmitComplete returns improvedCV on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        improvedCV: { personalInfo: { name: "John", email: "john@gmail.com" } },
      }),
    }) as unknown as jest.Mock;

    const { result } = renderHook(() => useCVForm());

    act(() => {
      result.current.updatePersonalInfo("name", "John");
    });
    act(() => {
      result.current.updatePersonalInfo("email", "john@gmail.com");
    });

    let returnedValue: any;
    await act(async () => {
      returnedValue = await result.current.handleSubmitComplete();
    });

    expect(returnedValue).toEqual({
      personalInfo: { name: "John", email: "john@gmail.com" },
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it("handleSubmitComplete fail when email is not provided", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        improvedCV: { personalInfo: { name: "John", email: "john@gmail.com" } },
      }),
    }) as unknown as jest.Mock;

    const { result } = renderHook(() => useCVForm());

    act(() => {
      result.current.updatePersonalInfo("name", "John");
    });
    await act(async () => {
      await result.current.handleSubmitComplete();
    });
    expect(result.current.error).toBe("L'email est requis pour générer le CV");
    expect(result.current.showToast).toBe(true);
  });

  it("handleSubmitComplete fail when user is not authenticated", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      user: null,
      error: "user not authenticated",
    });

    const { result } = renderHook(() => useCVForm());
    act(() => {
      result.current.updatePersonalInfo("name", "John");
      result.current.updatePersonalInfo("email", "john@gmail.com");
    });

    await act(async () => {
      await result.current.handleSubmitComplete();
    });

    expect(result.current.showCard).toBe(true);
  });

  it("handleSubmitComplete fail when user is not authenticated", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      user: { id: 123 },
      error: { message: "user not found" },
    });

    const { result } = renderHook(() => useCVForm());
    act(() => {
      result.current.updatePersonalInfo("name", "John");
      result.current.updatePersonalInfo("email", "john@gmail.com");
    });

    await act(async () => {
      await result.current.handleSubmitComplete();
    });

    expect(result.current.error).toEqual(
      "Erreur d'authentification: user not found"
    );
    expect(result.current.showToast).toBe(true);
  });

  it("callGeneratePDF: error path sets toast", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "boom" }),
    });

    const { result } = renderHook(() => useCVForm());
    await act(async () => {
      await result.current.callGeneratePDF(result.current.formData as any);
    });

    expect(result.current.showToast).toBe(true);
    expect(result.current.error).toMatch(/génération du CV/i);
  });
});
