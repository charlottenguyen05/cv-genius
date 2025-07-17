import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "@/components/layout/Header";
import useUserStatus from "@/lib/hooks/useUserStatus";
import { signOut } from "@/lib/supabase/client";

jest.mock('@/lib/supabase/client', () => ({
  signOut: jest.fn(),
}));
jest.mock("@/lib/hooks/useUserStatus");

// Mock Next.js router to track navigation calls
const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Create typed mock functions for better type safety and autocompletion
const mockedUseUserStatus = useUserStatus as jest.Mock;
const mockedSignOut = signOut as jest.Mock;


describe("Header Component", () => {

  // TEST CASE 1: Loading State
  it("should display a loading indicator while fetching user status", () => {
    // Arrange: Simulate the loading state
    mockedUseUserStatus.mockReturnValue({
      user: null,
      isLoading: true,
    });

    // Act: Render the component
    render(<Header />);

    // Assert: Check for the loading text
    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  // TEST CASE 2: Logged-Out State
  it("should display login and register links when user is not authenticated", () => {
    // Arrange: Simulate a logged-out user
    mockedUseUserStatus.mockReturnValue({
      user: null,
      isLoading: false,
    });

    // Act: Render the component
    render(<Header />);

    // Assert: Check for guest-specific links and ensure user-specific links are absent
    expect(screen.getByTestId("login-link")).toBeInTheDocument();
    expect(screen.getByTestId("register-link")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("signout-button")).not.toBeInTheDocument();
  });

  // TEST CASE 3: Logged-In State & Logout Flow
  describe("when a user is authenticated", () => {
    beforeEach(() => {
      // Arrange: Simulate a logged-in user for all tests in this block
      mockedUseUserStatus.mockReturnValue({
        user: { id: "user-123", email: "test@example.com" },
        isLoading: false,
        error: null,
      });
      
      mockedSignOut.mockResolvedValue({ error: null });
    });

    it("should display the dashboard link and logout button", () => {
      // Act: Render the component
      render(<Header />);

      // Assert: Check for user-specific links and ensure guest links are absent
      expect(screen.getByTestId("dashboard-link")).toBeInTheDocument();
      expect(screen.getByTestId("signout-button")).toBeInTheDocument();
      expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
      expect(screen.queryByTestId("register-link")).not.toBeInTheDocument();
    });

    it('should call signOut and redirect to "/" on logout button click', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<Header />);

      // Act: Simulate user clicking the logout button
      const logoutButton = screen.getByTestId("signout-button");
      await user.click(logoutButton);

      // Assert: Verify that the entire logout flow works as expected
      await waitFor(() => {
        // 1. Check if the signOut function was called
        expect(mockedSignOut).toHaveBeenCalledTimes(1);
        // 2. Check if the user was redirected to the homepage
        expect(mockRouterPush).toHaveBeenCalledWith("/");
      });
    });
  });
});
