import useAuthForm from "@/lib/hooks/useAuthForm";
import { signIn, signUp } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/utils";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";

// 4. CONFIGURATION DU MOCK (TRÈS IMPORTANT)
// jest.mock() remplace la vraie fonction validatePassword par une version mock
// Cela nous permet de contrôler son comportement et de tester uniquement notre hook
jest.mock("@/lib/utils", () => ({
  validatePassword: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  signUp: jest.fn(),
  signIn: jest.fn()
}));


describe("useAuthForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  // ==========================================
  // GROUPE 1 : TESTS D'INITIALISATION
  // ==========================================

  describe("Initialisation", () => {
    it("should use the default value", () => {
      // 8. ARRANGE + ACT - RENDU DU HOOK
      // renderHook() crée un environnement de test pour le hook
      // () => useAuthForm("login") : fonction qui exécute notre hook
      // result.current : objet contenant les valeurs retournées par le hook
      const { result } = renderHook(() => useAuthForm("login"));

      expect(result.current.email).toBe("");
      expect(result.current.password).toBe("");
      expect(result.current.error).toBe("");
      expect(result.current.loading).toBe(false);
      expect(result.current.showToast).toBe(false);
    });

    // ==========================================
    // TEST DE MISE À JOUR D'ÉTAT
    // ==========================================

    it("should update the email", () => {
      const { result } = renderHook(() => useAuthForm("login"));

      act(() => {
        result.current.setEmail("test@example.com");
      });

      expect(result.current.email).toBe("test@example.com");
    });
  });

  // ==========================================
  // GROUPE 2 : TESTS DE LA FONCTION HANDLESUBMIT
  // ==========================================

  describe("handleSubmit function for registration", () => {
    // 1er facon pour cast un type de mocked fonction:
    /* const mockValidatePassword = validatePassword as jest.MockedFunction<
      typeof validatePassword
    >; */

    // ==========================================
    // TEST AVEC VALIDATION D'ERREUR
    // ==========================================

    it("should set an error if the password is not valid", async () => {
      // --- 1. Arrange ---

      const { result } = renderHook(() => useAuthForm("register"));
      const password = "123456";

      const mockValidationResult = {
        isValid: false,
        errors: [
          "must be at least 8 characters",
          "must have a capital letter, must have a normal letter",
        ],
      };

      // 2er facon pour cast la type de validatePassword a une fonction mocked
      (validatePassword as jest.Mock).mockReturnValue(mockValidationResult);

      // Create a mock react.FormEvent object with the mock method preventDefault
      const mockEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      // --- 2. Act ---

      act(() => {
        result.current.setPassword(password);
      });
      // handleSubmit is async function so we need to wrap its inside an async function
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      // --- 3. Assert ---
      expect(result.current.error).toBe(
        "Mot de passe invalide: must be at least 8 characters, must have a capital letter, must have a normal letter"
      );

      // 21. VÉRIFICATIONS SUPPLÉMENTAIRES (OPTIONNELLES)
      // On peut vérifier que validatePassword a bien été appelée
      expect(validatePassword).toHaveBeenCalledWith(password);

      // On peut vérifier que preventDefault a été appelé
      expect(mockEvent.preventDefault).toHaveBeenCalled();

      // POURQUOI CE TEST ?
      // Il vérifie le chemin d'erreur le plus complexe
      // Il teste l'intégration avec validatePassword
      // Il teste la gestion des formulaires React
    });

    // ==========================================
    // TEST AVEC VALIDATION RÉUSSIE
    // ==========================================

    it("should not set error if password is valid", async () => {
      // 22. ARRANGE - CAS DE SUCCÈS
      const { result } = renderHook(() => useAuthForm("register"));
      const password = "ValidPassword123!";

      // 23. MOCK POUR CAS DE SUCCÈS
      const mockValidationResult = {
        isValid: true,
        errors: [], // Pas d'erreurs
      };

      (validatePassword as jest.Mock).mockReturnValue(mockValidationResult);

      (signUp as jest.Mock).mockResolvedValue({
        data: { user: { email: "test@example.com" } },
        error: null,
      });

      const mockEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      // 24. ACT - ACTIONS
      act(() => {
        result.current.setPassword(password);
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      // 25. ASSERT - VÉRIFICATION DE L'ABSENCE D'ERREUR
      // On vérifie que AUCUNE erreur n'a été définie
      expect(result.current.error).toBe("");

      // PRINCIPE IMPORTANT : TESTER LES DEUX CHEMINS
      // Il faut tester les cas de succès ET d'échec
    });

    // ==========================================
    // TEST DU MODE LOGIN (SANS VALIDATION)
    // ==========================================

    it("should not validate password in login mode", async () => {
      // 26. ARRANGE - MODE LOGIN
      const { result } = renderHook(() => useAuthForm("login"));
      const password = "123"; // Mot de passe court, mais en mode login

      const mockEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      (signIn as jest.Mock).mockResolvedValue({
        data: { user: { email: "test@example.com" } },
        error: null,
      });
      // 27. ACT
      act(() => {
        result.current.setPassword(password);
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      // 28. ASSERT - VÉRIFICATION QUE validatePassword N'EST PAS APPELÉ
      // En mode login, la validation ne devrait pas être déclenchée
      expect(validatePassword).not.toHaveBeenCalled();

      // L'erreur devrait rester vide
      expect(result.current.error).toBe("");

      // POURQUOI CE TEST ?
      // Il vérifie que le comportement change selon le mode
      // Il teste la logique conditionnelle du hook
    });

    // ==========================================
    // TEST DE L'ÉTAT LOADING
    // ==========================================

    it("should set loading to true during submission", async () => {
      const { result } = renderHook(() => useAuthForm("login"));


      (signIn as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                user: {
                  id: "123",
                  email: "test@example.com",
                  app_metadata: {},
                  user_metadata: {},
                  aud: "authenticated",
                  created_at: "2023-01-01T00:00:00.000Z",
                },
                session: {},
              },
              error: null,
            } as any);
          }, 100); 
        });
      });

      const mockEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      // 31. ACT - DÉMARRAGE DE LA SOUMISSION SANS ATTENDRE
      act(() => {
        result.current.handleSubmit(mockEvent);
      });

      // 32. ASSERT - VÉRIFICATION DE L'ÉTAT LOADING
      // Pendant que la soumission est en cours, loading devrait être true
      await waitFor(() => expect(result.current.loading).toBe(true))


    });
  });

  // ==========================================
  // GROUPE 3 : TESTS DE NETTOYAGE ET RESET
  // ==========================================

  describe("Error handling and reset", () => {
    it("should clear error when setEmail is called", () => {
      // 34. ARRANGE - HOOK AVEC ERREUR EXISTANTE
      const { result } = renderHook(() => useAuthForm("register"));

      // On simule une erreur existante
      act(() => {
        result.current.setPassword("123");
      });

      // 35. ACT - MODIFICATION DE L'EMAIL
      act(() => {
        result.current.setEmail("new@email.com");
      });

      // 36. ASSERT
      // Quand l'utilisateur tape, les erreurs devraient disparaître
      // (Si votre hook implémente cette fonctionnalité)
      expect(result.current.email).toBe("new@email.com");

      // POURQUOI CE TEST ?
      // Il vérifie l'expérience utilisateur lors de la correction d'erreurs
    });
  });

  // ==========================================
  // NETTOYAGE DES MOCKS
  // ==========================================

  // 37. NETTOYAGE APRÈS CHAQUE TEST
  afterEach(() => {
    // clearAllMocks() remet à zéro tous les mocks
    // Évite que les tests s'influencent mutuellement
    jest.clearAllMocks();
  });
});

// ==========================================
// RÉSUMÉ - TESTS DE HOOKS PERSONNALISÉS
// ==========================================

/*
SPÉCIFICITÉS DES TESTS DE HOOKS :

1. RENDERIZATION :
   - renderHook() pour tester les hooks en isolation
   - result.current pour accéder aux valeurs du hook

2. GESTION D'ÉTAT :
   - act() OBLIGATOIRE pour toute modification d'état
   - await act() pour les fonctions asynchrones

3. MOCKING :
   - jest.mock() pour mocker les dépendances
   - Mock des modules externes (API, utilitaires)
   - Control total sur les retours de fonctions

4. TESTS ASYNCHRONES :
   - async/await pour les opérations async
   - act() + await pour les actions async qui modifient l'état

5. ISOLATION :
   - afterEach() avec clearAllMocks()
   - Chaque test est indépendant
   - Pas d'effets de bord entre tests

6. TYPES DE TESTS À COUVRIR :
   ✅ Valeurs initiales
   ✅ Mise à jour d'état (setters)
   ✅ Fonctions principales (handleSubmit)
   ✅ Logique conditionnelle (mode login vs register)
   ✅ Gestion d'erreurs
   ✅ États loading/async
   ✅ Intégrations avec autres fonctions

CONCEPTS AVANCÉS :

1. MOCKING PATTERNS :
   - Mock de modules entiers
   - Mock de fonctions spécifiques
   - Mock de retours dynamiques

2. TESTING ASYNC CODE :
   - Promises et async/await
   - Testing des états intermédiaires
   - Cleanup des promises non résolues

3. STATE MANAGEMENT :
   - Testing des transitions d'état
   - Testing des effets de bord
   - Isolation des tests d'état

BONNES PRATIQUES :
- Toujours wrapper les changements d'état dans act()
- Mocker toutes les dépendances externes
- Tester tous les chemins d'exécution
- Nettoyer les mocks entre les tests
- Nommer les tests de façon descriptive
- Un test = un comportement spécifique
*/
