import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import LoginScreen from "../../app/auth/login";

// Mock the auth store
const mockSignIn = jest.fn();
jest.mock("../../store/authStore", () => ({
  useAuthStore: jest.fn(() => ({
    signIn: mockSignIn,
    isLoading: false,
  })),
}));

// Mock expo-router
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "auth:signInToAccount": "Sign In to Your Account",
        "auth:login": "Login",
        "auth:email": "Email",
        "auth:password": "Password",
        "auth:loginFailed": "Login failed",
        "auth:invalidCredentials": "Invalid login credentials",
        "auth:emailNotConfirmed": "Email not confirmed",
        "auth:tooManyAttempts": "Too many attempts",
        "auth:dontHaveAccount": "Don't have an account?",
        "auth:signup": "Sign Up",
        error: "Error",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock Alert
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Alert.alert = jest.fn();
  return RN;
});

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show email validation error for invalid email format", async () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(
      <LoginScreen />,
    );

    const emailInput = getByPlaceholderText("Email");
    fireEvent.changeText(emailInput, "invalid-email");

    // Trigger form submission to show validation error
    const loginButton = getByTestId("login-button");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText("Invalid email address")).toBeTruthy();
    });
  });

  it("should show password validation error for short password", async () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(
      <LoginScreen />,
    );

    const passwordInput = getByPlaceholderText("Password");
    fireEvent.changeText(passwordInput, "12345");

    // Trigger form submission to show validation error
    const loginButton = getByTestId("login-button");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText("Password must be at least 6 characters")).toBeTruthy();
    });
  });

  it("should call signIn with email and password on valid submit", async () => {
    mockSignIn.mockResolvedValueOnce({ error: null });

    const { getByPlaceholderText, getByText, getByTestId } = render(
      <LoginScreen />,
    );

    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");

    const loginButton = getByTestId("login-button");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });
  });

  it("should call router.replace('/') on successful login", async () => {
    mockSignIn.mockResolvedValueOnce({ error: null });

    const { getByPlaceholderText, getByText, getByTestId } = render(
      <LoginScreen />,
    );

    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");

    const loginButton = getByTestId("login-button");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("should show alert on signIn error", async () => {
    const { Alert } = require("react-native");
    mockSignIn.mockResolvedValueOnce({
      error: { message: "Invalid login credentials" },
    });

    const { getByPlaceholderText, getByText, getByTestId } = render(
      <LoginScreen />,
    );

    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "wrongpassword");

    const loginButton = getByTestId("login-button");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  it("should render title and subtitle", () => {
    const { getByText, getAllByText } = render(<LoginScreen />);

    expect(getByText("Sign In to Your Account")).toBeTruthy();
    expect(getAllByText("Login")).toBeTruthy();
  });
});
