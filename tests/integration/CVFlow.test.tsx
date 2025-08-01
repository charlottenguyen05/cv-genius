import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "@/app/dashboard/page";
import { getCurrentUser, supabase } from "@/lib/supabase/client";
import { CVFormData } from "@/types";
import { act } from "react";

// Mock des dépendances externes
const mockRouterPush = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  getCurrentUser: jest.fn(),
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock global fetch pour intercepter les appels API
const mockFetch = jest.fn();
global.fetch = mockFetch;


const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;  // Create temporary URL for file object
global.URL.revokeObjectURL = mockRevokeObjectURL;  // Clean up the temporary URL to file object to free memory

describe("CV Flow Integration Test", () => {
  const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  // Données de test simulant un CV parsé
  const mockParsedData: CVFormData = {
    personalInfo: {
      name: "Nguyen Ngoc Linh Nhi",
      email: "nguyen.nhi@example.com",
      phone: "+33 6 12 34 56 78",
      location: "Paris, France",
      linkedin: "linkedin.com/in/nguyen-nhi",
      website: "github.com/nguyen-nhi",
    },
    experiences: [
      {
        id: "exp-1",
        company: "Tech Corp",
        position: "Développeur Full Stack",
        location: "Paris",
        startDate: "2022-01",
        endDate: "2024-01",
        description: "Développement d'applications web avec React et Node.js",
        isCurrentPosition: false,
      }
    ],
    education: [
      {
        id: "edu-1",
        institution: "Université de Technologie",
        degree: "Master",
        field: "Informatique",
        startDate: "2019-09",
        endDate: "2021-06",
        description: "Spécialisation en développement web",
      },
    ],
    skills: [
      {
        id: "skill-1",
        name: "React",
        category: "technical",
        level: "advanced",
      }
    ],
    languages: [
      {
        id: "lang-1",
        name: "Français",
        level: "native",
      }
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockCreateObjectURL.mockReturnValue("blob:mock-url");
    
    // Mock Supabase auth session
    (mockSupabase.auth.getSession as jest.MockedFunction<typeof mockSupabase.auth.getSession>).mockResolvedValue({
      data: {
        session: {
          user: {
            id: "123",
            email: "test@example.com",
          },
          access_token: "mock-token",
        },
      },
      error: null,
    } as any);
  });

  it("should open modal when generate button is clicked with valid data", async () => {
    mockGetCurrentUser.mockResolvedValue({
      user: {
        id: "123",
        email: "test@example.com",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: "2023-01-01T00:00:00.000Z",
      },
      error: null,
    } as any);

    const user = userEvent.setup();
    render(<DashboardPage />);

  
    await act(async () => {
      await user.type(screen.getByTestId("name-input"), "Test User");
      await user.type(screen.getByTestId("email-input"), "test@example.com");
    });


    const generateButton = screen.getByTestId("generate-cv-button");
    expect(generateButton).not.toBeDisabled();

    await act(async () => {
      await user.click(generateButton);
    });

   
    await waitFor(
      () => {
        expect(screen.getByTestId("cv-generation-modal")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

 
  it("should handle file parsing errors gracefully", async () => {
    // SETUP : Mock d'erreur de parsing
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/parser") {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () =>
            Promise.resolve({
              success: false,
              error: "Seuls les fichiers PDF sont supportés",
            }),
        } as Response);
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const user = userEvent.setup();
    render(<DashboardPage />);

    // Simuler l'upload d'un fichier non-PDF
    const mockFile = new File(["fake content"], "document.txt", {
      type: "text/plain",
    });

    const fileInput = screen.getByTestId("file-input");
    await act(async () => {
      await user.upload(fileInput, mockFile);
    });

    // Vérifier que l'erreur est affichée
    await waitFor(() => {
      expect(
        screen.getByText(/Seuls les fichiers PDF sont supportés/i)
      ).toBeInTheDocument();
    });

    // Vérifier que les champs ne sont pas auto-remplies
    expect(screen.getByTestId("name-input")).toHaveValue("");
    expect(screen.getByTestId("email-input")).toHaveValue("");
  });


  it("should handle Gemini API errors gracefully", async () => {
    // SETUP : Parsing réussi mais erreur Gemini
    mockGetCurrentUser.mockResolvedValue({
      user: {
        id: "123",
        email: "nguyen.nhi@example.com",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: "2023-01-01T00:00:00.000Z",
      },
      error: null,
    } as any);

    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/parser") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              parsedData: mockParsedData,
            }),
        } as Response);
      }

      if (url === "/api/cv/complete-improve") {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () =>
            Promise.resolve({
              success: false,
              error: "Erreur lors de l'amélioration du CV",
              details: "API Gemini temporairement indisponible",
            }),
        } as Response);
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const user = userEvent.setup();
    render(<DashboardPage />);

    // Upload et parsing réussi
    const mockFile = new File(["fake pdf content"], "CV_test.pdf", {
      type: "application/pdf",
    });

    const fileInput = screen.getByTestId("file-input");
    await act(async () => {
      await user.upload(fileInput, mockFile);
    });

    // Attendre l'auto-remplissage
    await waitFor(() => {
      expect(screen.getByTestId("name-input")).toHaveValue(
        "Nguyen Ngoc Linh Nhi"
      );
    });

    // Vérifier que le bouton est activé avant de cliquer
    const generateButton = screen.getByTestId("generate-cv-button");
    await waitFor(() => {
      expect(generateButton).not.toBeDisabled();
    });

    // Vérifier que les données requises sont présentes
    expect(screen.getByTestId("name-input")).toHaveValue(
      "Nguyen Ngoc Linh Nhi"
    );
    expect(screen.getByTestId("email-input")).toHaveValue(
      "nguyen.nhi@example.com"
    );

    // Tenter la génération avec Gemini - soumettre le formulaire
    const form = screen.getByTestId("dashboard-content");
    await act(async () => {
      await user.click(generateButton);
      fireEvent.submit(form);
    });

    // Vérifier que le modal s'ouvre
    await waitFor(
      () => {
        expect(screen.getByTestId("cv-generation-modal")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Attendre que l'erreur Gemini soit affichée dans le modal
    await waitFor(
      () => {
        expect(screen.getByTestId("cv-generation-error")).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Vérifier que l'erreur contient le bon message
    expect(screen.getByTestId("cv-generation-error")).toHaveTextContent(
      "Erreur lors de l'amélioration du CV"
    );

    // Vérifier qu'il y a un bouton pour réessayer
    expect(screen.getByTestId("cv-generation-retry")).toBeInTheDocument();

    console.log("✅ Test : Modal ouvert avec gestion d'erreur Gemini!");
  });

 
  it("should prevent submission with incomplete data", async () => {
    mockGetCurrentUser.mockResolvedValue({
      user: {
        id: "123",
        email: "nguyen.nhi@example.com",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: "2023-01-01T00:00:00.000Z",
      },
      error: null,
    } as any);

    const user = userEvent.setup();
    render(<DashboardPage />);

    // Tentative de soumission sans données
    const generateButton = screen.getByTestId("generate-cv-button");
    expect(generateButton).toBeDisabled();

    // Remplir seulement le nom
    await act(async () => {
      await user.type(screen.getByTestId("name-input"), "Nguyen Nhi");
    });

    expect(generateButton).toBeDisabled();

    // Ajouter l'email
    await act(async () => {
      await user.type(
        screen.getByTestId("email-input"),
        "nguyen.nhi@example.com"
      );
    });

    expect(generateButton).not.toBeDisabled();
  });
});
