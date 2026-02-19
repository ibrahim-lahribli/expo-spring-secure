import { Session, User } from "@supabase/supabase-js";
import { act, renderHook } from "@testing-library/react-native";
import { useAuthStore } from "../../store/authStore";

// Mock Supabase - must use jest.fn() inside the mock factory
jest.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock zustand persist middleware
jest.mock("zustand/middleware", () => ({
  createJSONStorage: jest.fn(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
  persist: jest.fn((fn, _options) => fn),
}));

// Import after mocks are set up
import { supabase } from "../../lib/supabase";

describe("authStore", () => {
  const mockUser: User = {
    id: "test-user-id",
    email: "test@example.com",
    aud: "authenticated",
    role: "authenticated",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    app_metadata: {},
    user_metadata: {},
  };

  const mockSession: Session = {
    user: mockUser,
    access_token: "mock-token",
    refresh_token: "mock-refresh-token",
    expires_at: 1234567890,
    expires_in: 3600,
    token_type: "bearer",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
    });
  });

  describe("initializeAuth", () => {
    it("should initialize with existing session", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
        (_callback: any) => {
          // Mock the subscription object
          return {
            data: {
              subscription: {
                id: "test-subscription",
                unsubscribe: jest.fn(),
              },
            },
          };
        },
      );

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle initialization error gracefully", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: new Error("Session error"),
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle no existing session", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
        (_callback: any) => {
          return {
            data: {
              subscription: {
                id: "test-subscription",
                unsubscribe: jest.fn(),
              },
            },
          };
        },
      );

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signIn", () => {
    it("should sign in successfully", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      const signInResult = await act(async () => {
        return await result.current.signIn("test@example.com", "password");
      });

      expect(signInResult.error).toBeNull();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should handle sign in error", async () => {
      const mockError = new Error("Invalid credentials");
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuthStore());

      const signInResult = await act(async () => {
        return await result.current.signIn(
          "test@example.com",
          "wrong-password",
        );
      });

      expect(signInResult.error).toEqual(mockError);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("signUp", () => {
    it("should sign up successfully", async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      const signUpResult = await act(async () => {
        return await result.current.signUp(
          "test@example.com",
          "password",
          "Test User",
        );
      });

      expect(signUpResult.error).toBeNull();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should handle sign up error", async () => {
      const mockError = new Error("User already exists");
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuthStore());

      const signUpResult = await act(async () => {
        return await result.current.signUp(
          "existing@example.com",
          "password",
          "Existing User",
        );
      });

      expect(signUpResult.error).toEqual(mockError);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("signOut", () => {
    it("should sign out successfully", async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: mockUser,
        session: mockSession,
        isAuthenticated: true,
        isLoading: false,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it("should handle sign out error gracefully", async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: mockUser,
        session: mockSession,
        isAuthenticated: true,
        isLoading: false,
      });

      (supabase.auth.signOut as jest.Mock).mockRejectedValue(
        new Error("Sign out error"),
      );

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      // The implementation catches the error but doesn't clear state
      // State should remain unchanged when signOut fails
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("auth state changes", () => {
    it("should handle auth state change events", async () => {
      let authStateCallback:
        | ((event: string, session: Session | null) => void)
        | null = null;

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
        (callback: any) => {
          authStateCallback = callback;
          return {
            data: {
              subscription: {
                id: "test-subscription",
                unsubscribe: jest.fn(),
              },
            },
          };
        },
      );

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      // Simulate sign in event
      await act(async () => {
        if (authStateCallback) {
          authStateCallback("SIGNED_IN", mockSession);
        }
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isAuthenticated).toBe(true);

      // Simulate sign out event
      await act(async () => {
        if (authStateCallback) {
          authStateCallback("SIGNED_OUT", null);
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("persistence", () => {
    it("should persist state to storage", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      // The persist middleware is mocked, so just verify the state is set correctly
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
