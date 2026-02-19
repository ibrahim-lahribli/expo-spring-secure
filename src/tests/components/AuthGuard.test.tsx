import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { AuthGuard } from "../../components/AuthGuard";
import { useAuthStore } from "../../store/authStore";

// Mock the auth store
jest.mock("../../store/authStore", () => ({
  useAuthStore: jest.fn(),
}));

// Mock expo-router
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe("AuthGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show ActivityIndicator when isLoading is true", () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const { queryByText } = render(
      <AuthGuard>
        <Text>Protected Content</Text>
      </AuthGuard>,
    );

    // Children should not be rendered
    expect(queryByText("Protected Content")).toBeNull();
  });

  it("should call router.replace with /auth/login when isLoading is false and isAuthenticated is false", async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <AuthGuard>
        <Text>Protected Content</Text>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("should render children when isLoading is false and isAuthenticated is true", () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    const { getByText } = render(
      <AuthGuard>
        <Text>Protected Content</Text>
      </AuthGuard>,
    );

    expect(getByText("Protected Content")).toBeTruthy();
  });

  it("should not redirect when authenticated", async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <AuthGuard>
        <Text>Protected Content</Text>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
