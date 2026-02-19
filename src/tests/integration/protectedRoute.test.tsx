import { render } from "@testing-library/react-native";
import React from "react";
import ProtectedLayout from "../../app/(protected)/_layout";
import { useAuthStore } from "../../store/authStore";

// Mock Expo Router
jest.mock("expo-router", () => ({
  Redirect: jest.fn(({ href }) => {
    const { View } = require("react-native");
    return <View testID={`redirect-${href}`} />;
  }),
  Stack: Object.assign(
    ({ children, screenOptions }: any) => {
      const { View } = require("react-native");
      return (
        <View testID="stack" screenOptions={screenOptions}>
          {children}
        </View>
      );
    },
    {
      Screen: ({ children }: any) => {
        const { View } = require("react-native");
        return <View testID="stack-screen">{children}</View>;
      },
    },
  ),
}));

// Mock auth store
jest.mock("../../store/authStore", () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

describe("Protected Route Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading indicator when auth is loading", () => {
      mockUseAuthStore.mockReturnValue({
        session: null,
        isLoading: true,
        isAuthenticated: false,
        user: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(<ProtectedLayout />);

      expect(getByTestId("activity-indicator")).toBeTruthy();
    });

    it("should render ActivityIndicator with correct props", () => {
      mockUseAuthStore.mockReturnValue({
        session: null,
        isLoading: true,
        isAuthenticated: false,
        user: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(<ProtectedLayout />);
      const activityIndicator = getByTestId("activity-indicator");

      expect(activityIndicator.props.size).toBe("large");
    });
  });

  describe("Unauthenticated State", () => {
    it("should redirect to login when not authenticated", () => {
      mockUseAuthStore.mockReturnValue({
        session: null,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(<ProtectedLayout />);

      expect(getByTestId("redirect-/auth/login")).toBeTruthy();
    });

    it("should not render Stack when not authenticated", () => {
      mockUseAuthStore.mockReturnValue({
        session: null,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { queryByTestId } = render(<ProtectedLayout />);

      expect(queryByTestId("stack")).toBeNull();
    });
  });

  describe("Authenticated State", () => {
    const mockSession = {
      user: {
        id: "test-user-id",
        email: "test@example.com",
        aud: "authenticated",
        role: "authenticated",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        app_metadata: {},
        user_metadata: {},
      },
      access_token: "mock-token",
      refresh_token: "mock-refresh-token",
      expires_at: 1234567890,
      expires_in: 3600,
      token_type: "bearer",
    };

    it("should render Stack when authenticated", () => {
      mockUseAuthStore.mockReturnValue({
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        user: mockSession.user,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(<ProtectedLayout />);

      expect(getByTestId("stack")).toBeTruthy();
    });

    it("should not redirect when authenticated", () => {
      mockUseAuthStore.mockReturnValue({
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        user: mockSession.user,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { queryByTestId } = render(<ProtectedLayout />);

      expect(queryByTestId("redirect-/auth/login")).toBeNull();
    });

    it("should render Stack with correct screen options", () => {
      mockUseAuthStore.mockReturnValue({
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        user: mockSession.user,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(<ProtectedLayout />);

      const stack = getByTestId("stack");
      expect(stack.props.screenOptions).toEqual({ headerShown: false });
    });

    it("should include account screen in Stack", () => {
      mockUseAuthStore.mockReturnValue({
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        user: mockSession.user,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(<ProtectedLayout />);

      expect(getByTestId("stack-screen")).toBeTruthy();
    });
  });

  describe("State Transitions", () => {
    it("should handle transition from loading to unauthenticated", async () => {
      // Start with loading state
      mockUseAuthStore.mockReturnValueOnce({
        session: null,
        isLoading: true,
        isAuthenticated: false,
        user: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId, rerender } = render(<ProtectedLayout />);

      // Should show loading initially
      expect(getByTestId("activity-indicator")).toBeTruthy();

      // Transition to unauthenticated
      mockUseAuthStore.mockReturnValue({
        session: null,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      rerender(<ProtectedLayout />);

      // Should redirect to login
      expect(getByTestId("redirect-/auth/login")).toBeTruthy();
    });

    it("should handle transition from loading to authenticated", async () => {
      const mockSession = {
        user: {
          id: "test-user-id",
          email: "test@example.com",
          aud: "authenticated",
          role: "authenticated",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
          app_metadata: {},
          user_metadata: {},
        },
        access_token: "mock-token",
        refresh_token: "mock-refresh-token",
        expires_at: 1234567890,
        expires_in: 3600,
        token_type: "bearer",
      };

      // Start with loading state
      mockUseAuthStore.mockReturnValueOnce({
        session: null,
        isLoading: true,
        isAuthenticated: false,
        user: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId, rerender } = render(<ProtectedLayout />);

      // Should show loading initially
      expect(getByTestId("activity-indicator")).toBeTruthy();

      // Transition to authenticated
      mockUseAuthStore.mockReturnValue({
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        user: mockSession.user,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      rerender(<ProtectedLayout />);

      // Should render stack
      expect(getByTestId("stack")).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("should handle session with null user", () => {
      const sessionWithNullUser = {
        user: null,
        access_token: "mock-token",
        refresh_token: "mock-refresh-token",
        expires_at: 1234567890,
        expires_in: 3600,
        token_type: "bearer",
      };

      mockUseAuthStore.mockReturnValue({
        session: sessionWithNullUser,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(<ProtectedLayout />);

      // The component renders Stack when session object exists, even if user is null
      // This is because the check is `if (!session)` not `if (!session?.user)`
      expect(getByTestId("stack")).toBeTruthy();
    });

    it("should handle undefined session", () => {
      mockUseAuthStore.mockReturnValue({
        session: undefined,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(<ProtectedLayout />);

      // Should redirect since session is undefined
      expect(getByTestId("redirect-/auth/login")).toBeTruthy();
    });
  });
});
