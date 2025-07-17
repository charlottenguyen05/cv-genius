import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import useUserStatus from "@/lib/hooks/useUserStatus";
import * as supabaseClient from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

// Mock the entire supabase client module
jest.mock("@/lib/supabase/client", () => ({
  getCurrentUser: jest.fn(),
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
    },
  },
}));

describe("useUserStatus", () => {
  const mockGetCurrentUser = jest.mocked(supabaseClient.getCurrentUser);
  const mockOnAuthStateChange = jest.mocked(
    supabaseClient.supabase.auth.onAuthStateChange
  );

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for onAuthStateChange
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    } as any);
  });

  it("should initialize with loading state", () => {
    mockGetCurrentUser.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useUserStatus());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe("");
  });

  it("should set user when getCurrentUser succeeds", async () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2023-01-01T00:00:00Z",
    } as User;

    mockGetCurrentUser.mockResolvedValue({
      user: mockUser,
      error: null,
    });

    const { result } = renderHook(() => useUserStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBe("");
  });

  it("should set error when getCurrentUser returns error", async () => {
    mockGetCurrentUser.mockResolvedValue({
      user: null,
      error: {
        message: "Authentication failed",
      } as any,
    });

    const { result } = renderHook(() => useUserStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe("Authentication failed");
  });

  it("should handle network errors", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useUserStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(
      "Check your internet connection, something went wrong"
    );
  });

  it("should handle auth state changes", async () => {
    mockGetCurrentUser.mockResolvedValue({
      user: null,
      error: null,
    });

    let authCallback: Function = () => {};
    mockOnAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      } as any;
    });

    const { result } = renderHook(() => useUserStatus());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBe(null);

    // Simulate auth state change
    const newUser = {
      id: "456",
      email: "newuser@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2023-01-01T00:00:00Z",
    };

    act(() => {
      authCallback("SIGNED_IN", { user: newUser });
    });

    expect(result.current.user).toEqual(newUser);
  });

  it("should clean up subscription on unmount", () => {
    const mockUnsubscribe = jest.fn();
    mockGetCurrentUser.mockResolvedValue({
      user: null,
      error: null,
    });

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    } as any);

    const { unmount } = renderHook(() => useUserStatus());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
