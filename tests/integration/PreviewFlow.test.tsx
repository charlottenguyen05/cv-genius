/**
 * TEST D'INTÉGRATION : PreviewFlow
 *
 * DIFFÉRENCE AVEC LES TESTS UNITAIRES :
 * - Test unitaire : teste UNE fonction isolée avec des mocks
 * - Test d'intégration : teste l'INTERACTION entre plusieurs composants/modules
 *
 * CE TEST VÉRIFIE :
 * - L'intégration entre PreviewPage (composant) et useUserStatus (hook)
 * - L'interaction avec l'API Supabase (mockée) pour récupérer les CVs
 * - Le flux utilisateur complet de A à Z (authentification → chargement → affichage)
 * - La gestion d'état partagée entre les composants
 * - L'autorisation d'accès aux CVs
 */

import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import PreviewPage from "@/app/preview/[id]/page";
import { getResumeById, getCurrentUser, getPdfPublicUrl } from "@/lib/supabase/client";

const mockRouterPush = jest.fn();
const mockParams = { id: "resume-123" };

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
  useParams: () => mockParams,
}));

// Mock the entire supabase client module
jest.mock("@/lib/supabase/client", () => ({
  getCurrentUser: jest.fn(),
  getResumeById: jest.fn(),
  getPdfPublicUrl: jest.fn(),
  
  // Mock the supabase object with auth methods
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn()
          }
        }
      })),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    }
  }
}));

describe("Preview Flow Integration Test", () => {
  const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
  const mockGetResumeById = getResumeById as jest.MockedFunction<typeof getResumeById>;
  const mockGetPdfPublicUrl = getPdfPublicUrl as jest.MockedFunction<typeof getPdfPublicUrl>;

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2023-01-01T00:00:00.000Z",
  };

  const mockResume = {
    id: "resume-123",
    user_id: "user-123",
    title: "CV Développeur Frontend",
    generated_content: "cv-files/resume-123.pdf",
    created_at: "2023-12-01T11:30:00.000Z"
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockClear();
    // Ensure params has the default ID for each test
    (mockParams as any).id = "resume-123";
  });

  /**
   * TEST D'INTÉGRATION COMPLET : Chargement et affichage réussi du CV
   *
   * POURQUOI CE TEST EST UN TEST D'INTÉGRATION :
   * 1. Il teste PreviewPage + useUserStatus + API calls qui travaillent ensemble
   * 2. Il vérifie le flux de données entre ces composants
   * 3. Il simule une interaction utilisateur réelle du début à la fin
   * 4. Il vérifie que la communication entre les modules fonctionne
   */
  it("should load and display resume successfully for authenticated user", async () => {
    // SETUP : Configuration des mocks pour un flux réussi
    mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null });
    mockGetResumeById.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockResume), 100);
      });
    });
    mockGetPdfPublicUrl.mockReturnValue("https://example.com/cv-files/resume-123.pdf");

    const user = userEvent.setup();

    // RENDER : Rendu du composant complet avec ses dépendances
    await act(async () => {
      render(<PreviewPage />);
    });

    // ÉTAPE 1: VÉRIFICATION DE L'ÉTAT DE CHARGEMENT INITIAL
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
    expect(screen.getByText("Chargement du CV...")).toBeInTheDocument();

    // ÉTAPE 2: ATTENDRE LA RÉSOLUTION DES APPELS API
    await waitFor(() => {
      expect(screen.getByTestId("preview-page")).toBeInTheDocument();
    });

    // VÉRIFICATION DES APPELS API
    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
    expect(mockGetResumeById).toHaveBeenCalledTimes(1);
    expect(mockGetResumeById).toHaveBeenCalledWith("resume-123");
    expect(mockGetPdfPublicUrl).toHaveBeenCalledTimes(1);
    expect(mockGetPdfPublicUrl).toHaveBeenCalledWith("cv-files/resume-123.pdf");

    // ÉTAPE 3: VÉRIFICATION DE L'INTERFACE UTILISATEUR
    expect(screen.getByTestId("resume-title")).toHaveTextContent("Votre CV Améliorée");
    expect(screen.getByTestId("resume-date")).toHaveTextContent(
      "Généré le 1 décembre 2023 à 11:30"
    );
    expect(screen.getByTestId("back-button")).toBeInTheDocument();
    expect(screen.getByTestId("download-button")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "src",
      "https://example.com/cv-files/resume-123.pdf#toolbar=1&navpanes=0&scrollbar=1"
    );

    // ÉTAPE 4: TEST DES INTERACTIONS UTILISATEUR
    // Test du bouton retour
    await user.click(screen.getByTestId("back-button"));
    expect(mockRouterPush).toHaveBeenCalledWith("/dashboard");

    // Reset mock pour tester le téléchargement
    mockRouterPush.mockClear();

    // Test du bouton téléchargement (on vérifie que la fonction est appelée)
    // Note: Le téléchargement crée un élément DOM temporaire, ce qui est difficile à tester
    // directement, mais on peut vérifier que le bouton est cliquable
    const downloadButton = screen.getByTestId("download-button");
    expect(downloadButton).toBeEnabled();
    await user.click(downloadButton);
    // Le téléchargement devrait fonctionner sans erreur
  });

  /**
   * TEST D'INTÉGRATION : Redirection si utilisateur non authentifié
   */
  it("should redirect to login when user is not authenticated", async () => {
    // SETUP : Utilisateur non authentifié
    mockGetCurrentUser.mockResolvedValue({ user: null, error: null });

    await act(async () => {
      render(<PreviewPage />);
    });

    // VÉRIFICATION DE LA REDIRECTION
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/login");
    });
  });

  /**
   * TEST D'INTÉGRATION : Gestion des erreurs d'autorisation
   */
  it("should display error when user tries to access unauthorized resume", async () => {
    // SETUP : Utilisateur authentifié mais CV appartenant à un autre utilisateur
    const unauthorizedResume = {
      ...mockResume,
      user_id: "other-user-456" // CV appartenant à un autre utilisateur
    };

    mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null });
    mockGetResumeById.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(unauthorizedResume), 100);
      });
    });

    await act(async () => {
      render(<PreviewPage />);
    });

    // ATTENDRE LE CHARGEMENT
    await waitFor(() => {
      expect(screen.getByTestId("error-state")).toBeInTheDocument();
    });

    // VÉRIFICATION DU MESSAGE D'ERREUR
    expect(screen.getByText("Vous n'avez pas l'autorisation d'accéder à ce CV")).toBeInTheDocument();
    expect(screen.getByText("Retour au dashboard")).toBeInTheDocument();

    // TEST DU BOUTON RETOUR DANS L'ÉTAT D'ERREUR
    const user = userEvent.setup();
    await user.click(screen.getByText("Retour au dashboard"));
    expect(mockRouterPush).toHaveBeenCalledWith("/dashboard");
  });

  /**
   * TEST D'INTÉGRATION : Gestion des erreurs API
   */
  it("should handle API errors gracefully", async () => {
    // SETUP : Erreur lors de la récupération du CV
    mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null });
    mockGetResumeById.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Network error")), 100);
      });
    });

    await act(async () => {
      render(<PreviewPage />);
    });

    // ATTENDRE L'AFFICHAGE DE L'ERREUR
    await waitFor(() => {
      expect(screen.getByTestId("error-state")).toBeInTheDocument();
    });

    // VÉRIFICATION DU MESSAGE D'ERREUR
    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(screen.getByText("Retour au dashboard")).toBeInTheDocument();
  });

  /**
   * TEST D'INTÉGRATION : Gestion des paramètres d'URL invalides
   */
  it("should handle empty resume ID parameter", async () => {
    // SETUP : ID vide dans les paramètres
    (mockParams as any).id = "";

    mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null });

    await act(async () => {
      render(<PreviewPage />);
    });

    // VÉRIFICATION : Le composant reste dans l'état de chargement
    // car loadResume() retourne tôt avec un resumeId vide
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
    expect(screen.getByText("Chargement du CV...")).toBeInTheDocument();
    
    // Vérifier que l'API n'est pas appelée avec un ID vide
    expect(mockGetResumeById).not.toHaveBeenCalled();
    
    // Le composant devrait rester dans cet état
    await waitFor(() => {
      expect(screen.getByTestId("loading-state")).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  /**
   * TEST D'INTÉGRATION : État de chargement du PDF
   */
  it("should show PDF loading state when PDF URL is not available", async () => {
    // SETUP : Résumé chargé mais URL PDF non disponible immédiatement
    mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null });
    mockGetResumeById.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockResume), 100);
      });
    });
    mockGetPdfPublicUrl.mockReturnValue(""); // URL vide

    await act(async () => {
      render(<PreviewPage />);
    });

    // ATTENDRE LE CHARGEMENT DU RÉSUMÉ
    await waitFor(() => {
      expect(screen.getByTestId("preview-page")).toBeInTheDocument();
    }, { timeout: 2000 });

    // VÉRIFICATION DE L'ÉTAT DE CHARGEMENT DU PDF
    expect(screen.getByTestId("pdf-loading")).toBeInTheDocument();
    expect(screen.getByText("Chargement du PDF...")).toBeInTheDocument();
  });

  /**
   * TEST D'INTÉGRATION : Actions secondaires dans le footer
   */
  it("should handle secondary actions in the preview footer", async () => {
    // SETUP : Configuration normale
    mockGetCurrentUser.mockResolvedValue({ user: mockUser, error: null });
    mockGetResumeById.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockResume), 100);
      });
    });
    mockGetPdfPublicUrl.mockReturnValue("https://example.com/cv-files/resume-123.pdf");

    const user = userEvent.setup();

    await act(async () => {
      render(<PreviewPage />);
    });

    // ATTENDRE LE CHARGEMENT COMPLET
    await waitFor(() => {
      expect(screen.getByTestId("preview-actions")).toBeInTheDocument();
    }, { timeout: 2000 });

    // TEST DES ACTIONS SECONDAIRES
    const createNewButton = screen.getByText("Créer un nouveau CV");
    const downloadSecondaryButton = screen.getByText("Télécharger ce CV");

    expect(createNewButton).toBeInTheDocument();
    expect(downloadSecondaryButton).toBeInTheDocument();

    // Test du bouton "Créer un nouveau CV"
    await user.click(createNewButton);
    expect(mockRouterPush).toHaveBeenCalledWith("/dashboard");
  });
});

/**
 * RÉSUMÉ DES CONCEPTS DE TESTS D'INTÉGRATION DÉMONTRÉS :
 *
 * 1. PORTÉE PLUS LARGE : On teste PreviewPage avec useUserStatus et les API calls
 *
 * 2. MOCKING STRATÉGIQUE : On mock les dépendances externes (API, router, params)
 *    mais on laisse les composants internes travailler ensemble
 *
 * 3. FLUX COMPLETS : On teste des scénarios utilisateur réalistes :
 *    - Authentification → Chargement → Affichage
 *    - Gestion des autorisations
 *    - Gestion des erreurs
 *    - Interactions utilisateur
 *
 * 4. ÉTATS ASYNCHRONES : Utilisation de waitFor pour les opérations async
 *
 * 5. INTERACTIONS RÉALISTES : userEvent pour simuler de vraies interactions
 *
 * 6. VÉRIFICATIONS MULTIPLES : UI, appels API, états, navigation
 *
 * SPÉCIFICITÉS DU TEST PREVIEW :
 * - Test d'autorisation (user_id matching)
 * - Test des états de chargement multiples (page + PDF)
 * - Test des interactions de téléchargement
 * - Test de la navigation entre pages
 * - Test de la gestion des paramètres d'URL
 */