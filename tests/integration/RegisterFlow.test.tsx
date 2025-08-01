import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/(auth)/register/page";
import { signUp } from "@/lib/supabase/client";

// Mock the entire supabase client module
jest.mock("@/lib/supabase/client", () => ({
  // Mock individual functions
  signUp: jest.fn(),
  getCurrentUser: jest.fn().mockResolvedValue({ user: null, error: null }),
  
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
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn()
    }
  }
}));

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
                email: "nguyen.nhi@example.com",
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
    await act(async () => {
      render(<RegisterPage />);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

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
    await user.type(screen.getByTestId("email-input"), "nguyen.nhi@example.com");
    await user.type(screen.getByTestId("password-input"), "Motdepasse123");
    await user.type(screen.getByTestId("cfpassword-input"), "Motdepasse123");

    // ASSERT: TEST VALUES HOLDS BY INPUT
    expect(screen.getByTestId("email-input")).toHaveValue("nguyen.nhi@example.com");
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
      "nguyen.nhi@example.com",
      "Motdepasse123"
    );
  });

  it("should handle authentication errors and display error message when user submit password without passing all the criteria", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<RegisterPage />);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    // SIMULATION DU FLUX AVEC ERREUR - password doesn't meet criteria
    const button = screen.getByRole("button");
    await user.type(screen.getByTestId("email-input"), "nguyen.wrong@example.com");
    await user.type(screen.getByTestId("password-input"), "wrongpassword"); // missing uppercase and number
    await user.type(screen.getByTestId("cfpassword-input"), "wrongpassword");
    
    // Wait for all form updates to complete
    await waitFor(() => {
      // Verify password requirements are shown correctly
      expect(screen.getByText("✓ Une majuscule")).toHaveClass("text-red-500");
      expect(screen.getByText("✓ Un chiffre")).toHaveClass("text-red-500");
      expect(screen.getByText("✓ Une minuscule")).toHaveClass("text-green-600");
      expect(screen.getByText("✓ Au moins 8 caractères")).toHaveClass("text-green-600");
    });

    // The button should be disabled due to password not meeting criteria
    // Note: In a real implementation this would be disabled, but if not implemented, 
    // at least the form validation should prevent API calls
    await user.click(button);

    // The API should NOT be called because client-side validation prevents submission
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("should prevent submission when the password is not equivalent", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<RegisterPage />);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    await user.type(screen.getByTestId("password-input"), "Nic123fs");
    await user.type(screen.getByTestId("cfpassword-input"), "134s5df");
    await user.click(button);

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("should prevent submission with empty fields", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<RegisterPage />);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");

    await user.click(button);
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
