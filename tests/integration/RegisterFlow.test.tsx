import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/(auth)/register/page";
import { signUp } from "@/lib/supabase/client";

jest.mock("@/lib/supabase/client", () => ({
  // On mock la fonction signIn qui sera appelée par useAuthForm
  signUp: jest.fn(),
}));

// jest.mock("@/lib/utils", () => ({
//   validatePassword: jest.fn(),
// }));

describe("Register flow integration test", () => {
  const mockSignUp = signUp as jest.MockedFunction<typeof signUp>;

  it("should handle complete register flow with successful authentication", async () => {
    mockSignUp.mockImplementation(() => {
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
              session: null,
            },
            error: null,
          } as any);
        }, 100);
      });
    });

    const user = userEvent.setup();

    // STEP 1: RENDER + TEST RENDER
    render(<RegisterPage />);

    const button = screen.getByRole("button");
    expect(screen.getByTestId("register-form")).toBeInTheDocument();
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-input")).toBeInTheDocument();
    expect(screen.getByTestId("cfpassword-input")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(button).toBeInTheDocument();
    screen.getAllByRole("listitem").forEach((li) => {
      expect(li).toHaveClass("text-red-500");
    });
    expect(button).toHaveTextContent("Créer mon compte");
    expect(button).toBeEnabled();

    // ACT: SIMULATE USER TYPING
    await user.type(screen.getByTestId("email-input"), "test@example.com");
    await user.type(screen.getByTestId("password-input"), "Motdepasse123");
    await user.type(screen.getByTestId("cfpassword-input"), "Motdepasse123");

    // ASSERT: TEST VALUES HOLDS BY INPUT
    expect(screen.getByTestId("email-input")).toHaveValue("test@example.com");
    expect(screen.getByTestId("password-input")).toHaveValue("Motdepasse123");
    expect(screen.getByTestId("cfpassword-input")).toHaveValue("Motdepasse123");
    screen.getAllByRole("listitem").forEach((li) => {
      expect(li).not.toHaveClass("text-red-500");
    });

    // ACT: SIMULATE USER CLICK SUBMIT BUTTON
    await user.click(button);

    // ASSERT
    // Test intermediate state
    await waitFor(() => {
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Création...");
    });

    // Test final state
    await waitFor(() => {
      expect(
        screen.getByText(
          "Compte créé avec succès ! Veuillez-vous confirmer votre email. Vous pouvez désormais vous connecter."
        )
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(button).toBeEnabled();
      expect(button).toHaveTextContent("Créer mon compte");
    });

    // Test bonus
    expect(mockSignUp).toHaveBeenCalledTimes(1);
    expect(mockSignUp).toHaveBeenCalledWith(
      "test@example.com",
      "Motdepasse123"
    );
  });

  it("should handle authentication errors and display error message when user submit password without passing all the criteria", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    // SIMULATION DU FLUX AVEC ERREUR
    const button = screen.getByRole("button");
    await user.type(screen.getByTestId("email-input"), "wrong@example.com");
    await user.type(screen.getByTestId("password-input"), "wrongpassword");
    await user.type(screen.getByTestId("cfpassword-input"), "wrongpassword");
    await user.click(button);

    // VÉRIFICATION DE L'APPEL API (même en cas d'erreur)
    expect(mockSignUp).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("password-alert")).toHaveTextContent(
        "Mot de passe invalide: Au moins une majuscule, Au moins un chiffre"
      );
    });
    expect(screen.getByText("✓ Une majuscule")).toHaveClass("text-red-500");
    expect(screen.getByText("✓ Un chiffre")).toHaveClass("text-red-500");
    expect(screen.getByText("✓ Une minuscule")).toHaveClass("text-green-600");
    expect(screen.getByText("✓ Au moins 8 caractères")).toHaveClass(
      "text-green-600"
    );

    // VÉRIFICATION QUE LE TOAST N'APPARAÎT PAS EN CAS D'ERREUR
    // Ceci teste que l'intégration gère bien les différents scénarios
    expect(
      screen.queryByText("Connexion réussie. Redirection vers votre espace.")
    ).not.toBeInTheDocument();
  });
  it("should prevent submission when the password is not equivalent", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    const button = screen.getByRole("button");
    await user.type(screen.getByTestId("password-input"), "Nic123fs");
    await user.type(screen.getByTestId("cfpassword-input"), "134s5df");
    await user.click(button);
    expect(screen.getByTestId("password-not-equivalent")).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it("should prevent submission with empty fields", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    const button = screen.getByRole("button");

    await user.click(button);
    expect(mockSignUp).not.toHaveBeenCalled();

    await user.type(screen.getByTestId("email-input"), "wrong@example.com");
    await user.click(button);
    expect(mockSignUp).not.toHaveBeenCalled();

    await user.type(screen.getByTestId("password-input"), "fsdlkfml");
    await user.click(button);
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});
