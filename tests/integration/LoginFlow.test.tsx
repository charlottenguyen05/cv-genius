/**
 * TEST D'INTÉGRATION : LoginFlow
 *
 * DIFFÉRENCE AVEC LES TESTS UNITAIRES :
 * - Test unitaire : teste UNE fonction isolée avec des mocks
 * - Test d'intégration : teste l'INTERACTION entre plusieurs composants/modules
 *
 * CE TEST VÉRIFIE :
 * - L'intégration entre LoginPage (composant) et useAuthForm (hook)
 * - L'interaction avec l'API Supabase (mockée)
 * - Le flux utilisateur complet de A à Z
 * - La gestion d'état partagée entre les composants
 */

// On importe React Testing Library pour les tests d'intégration React
import { render, screen, waitFor } from "@testing-library/react";
// userEvent simule des interactions utilisateur plus réalistes que fireEvent
import userEvent from "@testing-library/user-event";
// On importe le composant qu'on va tester (pas isolé, mais dans son contexte)
import LoginPage from "@/app/(auth)/login/page";
import { signIn } from "@/lib/supabase/client";

const mockRouterPush = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

describe("Login Flow Integration Test", () => {
  // On type le mock pour avoir l'autocomplétion TypeScript
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

  /**
   * TEST D'INTÉGRATION COMPLET : Connexion réussie
   *
   * POURQUOI CE TEST EST UN TEST D'INTÉGRATION :
   * 1. Il teste LoginPage + useAuthForm + signIn qui travaillent ensemble
   * 2. Il vérifie le flux de données entre ces composants
   * 3. Il simule une interaction utilisateur réelle du début à la fin
   * 4. Il vérifie que la communication entre les modules fonctionne
   */
  it("should handle complete login flow with successful authentication", async () => {
    // SETUP : On configure le comportement de notre mock avec un délai
    // On utilise une Promise qui se résout après un court délai pour tester l'état loading
    mockSignIn.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              user: {
                id: "123",
                email: "nguyen.nhi@example.com",
                app_metadata: {},
                user_metadata: {},
                aud: "authenticated",
                created_at: "2023-01-01T00:00:00.000Z",
              },
              session: {},
            },
            error: null,
          } as any);
        }, 100); // 100ms de délai pour simuler un appel réseau
      });
    });

    // SETUP USER EVENT : On initialise userEvent pour des interactions réalistes
    // userEvent simule mieux les vrais comportements utilisateur (focus, blur, etc.)
    const user = userEvent.setup();

    // RENDER : On rend le composant complet (pas isolé comme en test unitaire)
    // Ici on teste LoginPage avec tous ses hooks et dépendances
    render(<LoginPage />);

    // ÉTAPE 1: VÉRIFICATION DU RENDU INITIAL
    // On vérifie que tous les éléments sont présents
    // Ceci teste l'intégration entre JSX et les hooks d'état
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-input")).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();

    // VÉRIFICATION DE L'ÉTAT INITIAL : Le bouton ne doit pas être en loading
    // Ceci teste que useAuthForm initialise correctement son état
    expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    expect(screen.getByTestId("submit-button")).toHaveTextContent(
      "Se connecter"
    );

    // ÉTAPE 2: SIMULATION DE LA SAISIE UTILISATEUR
    // On saisit l'email : ceci teste l'intégration entre l'input et le state du hook
    await user.type(
      screen.getByTestId("email-input"),
      "nguyen.nhi@example.com"
    );

    // On saisit le mot de passe : ceci teste la gestion d'état pour un second champ
    await user.type(screen.getByTestId("password-input"), "motdepasse123");

    // VÉRIFICATION DES VALEURS : On vérifie que les valeurs sont bien mises à jour
    // Ceci confirme que l'intégration entre inputs et hooks fonctionne
    expect(screen.getByTestId("email-input")).toHaveValue(
      "nguyen.nhi@example.com"
    );
    expect(screen.getByTestId("password-input")).toHaveValue("motdepasse123");

    // ÉTAPE 3: SIMULATION DE LA SOUMISSION
    // On clique sur le bouton submit : ceci déclenche toute la chaîne d'intégration
    await user.click(screen.getByTestId("submit-button"));

    // ÉTAPE 4: VÉRIFICATION DE L'ÉTAT LOADING
    // Button state changes after async handleSubmit function starts so need waitFor
    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).toBeDisabled();
      expect(screen.getByTestId("submit-button")).toHaveTextContent(
        "Connexion..."
      );
    });

    // VÉRIFICATION DE L'APPEL API : On vérifie que signIn a été appelé avec les bons paramètres
    // Ceci teste l'intégration entre useAuthForm et le client Supabase
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith(
      "nguyen.nhi@example.com",
      "motdepasse123"
    );

    // ÉTAPE 5: ATTENDRE LA RÉSOLUTION DE LA PROMESSE
    // waitFor attend que l'état asynchrone se mette à jour après succès
    // Ceci teste que l'intégration gère bien les opérations asynchrones
    await waitFor(() => {
      // Le toast doit apparaître : ceci teste l'intégration entre useAuthForm et le composant Toast
      expect(
        screen.getByText("Connexion réussie. Redirection vers votre espace.")
      ).toBeInTheDocument();
    });

    // VÉRIFICATION FINALE : Le bouton doit être reactivé après succès
    // Ceci confirme que tout le cycle d'état fonctionne correctement
    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
      expect(screen.getByTestId("submit-button")).toHaveTextContent(
        "Se connecter"
      );
    });

    await user.click(screen.getByRole("button", { name: /close/i }));

    // Test if the page is redirect to /dashboard
    await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledTimes(1);
        expect(mockRouterPush).toHaveBeenCalledWith("/dashboard");
      });
    });

  /**
   * TEST D'INTÉGRATION : Gestion d'erreur
   *
   * POURQUOI TESTER LES ERREURS EN INTÉGRATION :
   * - Vérifie que les erreurs remontent correctement dans la chaîne
   * - Teste l'affichage d'erreur dans l'UI
   * - Vérifie que l'état se remet correctement après erreur
   */
  it("should handle authentication errors and display error message", async () => {
    // SETUP : On configure le mock pour retourner une erreur avec délai
    mockSignIn.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: { user: null, session: null },
            error: {
              message: "Email ou mot de passe incorrect",
              code: "invalid_credentials",
              status: 400,
              __isAuthError: true,
              name: "AuthError",
            },
          } as any);
        }, 50); // Délai plus court pour les tests d'erreur
      });
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    // SIMULATION DU FLUX AVEC ERREUR
    await user.type(
      screen.getByTestId("email-input"),
      "nguyen.wrong@example.com"
    );

    await user.type(screen.getByTestId("password-input"), "wrongpassword");
    await user.click(screen.getByTestId("submit-button"));

    // VÉRIFICATION DE L'APPEL API (même en cas d'erreur)
    expect(mockSignIn).toHaveBeenCalledWith(
      "nguyen.wrong@example.com",
      "wrongpassword"
    );

    // ATTENDRE L'AFFICHAGE DE L'ERREUR
    // Ceci teste l'intégration de la gestion d'erreur dans l'UI
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText("Email ou mot de passe incorrect")
      ).toBeInTheDocument();
    });

    // VÉRIFICATION QUE L'ÉTAT SE REMET CORRECTEMENT
    // Le bouton doit être reactivé même après erreur
    expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    expect(screen.getByTestId("submit-button")).toHaveTextContent(
      "Se connecter"
    );

    // VÉRIFICATION QUE LE TOAST N'APPARAÎT PAS EN CAS D'ERREUR
    // Ceci teste que l'intégration gère bien les différents scénarios
    expect(
      screen.queryByText("Connexion réussie. Redirection vers votre espace.")
    ).not.toBeInTheDocument();
  });

  /**
   * TEST D'INTÉGRATION : Validation des champs requis
   *
   * POURQUOI CE TEST EST IMPORTANT :
   * - Teste l'intégration entre la validation HTML5 et React
   * - Vérifie que la soumission ne se fait pas sans données valides
   * - Teste le comportement du navigateur avec notre composant
   */
  it("should prevent submission with empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // TENTATIVE DE SOUMISSION SANS DONNÉES
    // Les champs sont requis (required), donc le navigateur doit empêcher la soumission
    await user.click(screen.getByTestId("submit-button"));

    // VÉRIFICATION QUE L'API N'EST PAS APPELÉE
    // Ceci confirme que la validation côté client fonctionne avant l'appel API
    expect(mockSignIn).not.toHaveBeenCalled();

    // VÉRIFICATION QUE L'ÉTAT RESTE NORMAL
    // Le composant ne doit pas entrer en état de loading si la validation échoue
    expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    expect(screen.getByTestId("submit-button")).toHaveTextContent(
      "Se connecter"
    );
  });
});

/**
 * RÉSUMÉ DES CONCEPTS DE TESTS D'INTÉGRATION DÉMONTRÉS :
 *
 * 1. PORTÉE PLUS LARGE : On teste plusieurs composants qui travaillent ensemble
 *
 * 2. MOCKING STRATÉGIQUE : On mock seulement les dépendances externes (API, router)
 *    mais on laisse les composants internes travailler ensemble
 *
 * 3. FLUX COMPLETS : On teste des scénarios utilisateur du début à la fin
 *
 * 4. ÉTATS ASYNCHRONES : On utilise waitFor pour les opérations async
 *
 * 5. INTERACTIONS RÉALISTES : userEvent pour simuler de vraies interactions
 *
 * 6. VÉRIFICATIONS MULTIPLES : On vérifie l'UI, les appels API, et les états
 *
 * QUAND ÉCRIRE UN TEST D'INTÉGRATION :
 * - Quand plusieurs composants doivent travailler ensemble
 * - Pour tester des flux utilisateur importants
 * - Quand la logique traverse plusieurs couches (UI → Hook → API)
 * - Pour vérifier que les contrats entre modules sont respectés
 *
 * COMMENT IDENTIFIER CE QUI DOIT ÊTRE TESTÉ EN INTÉGRATION :
 * - Suivez le flux de données dans votre application
 * - Identifiez les points d'interaction entre composants
 * - Listez les scénarios utilisateur critiques
 * - Cherchez les endroits où les bugs peuvent survenir entre les modules
 */
