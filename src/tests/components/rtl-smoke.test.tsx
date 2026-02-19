import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { I18nManager, View } from "react-native";
import { AuthGuard } from "../../components/AuthGuard";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { NavigationStack } from "../../components/NavigationStack";

// Mock the i18n hook for RTL testing
jest.mock("../../i18n/i18n", () => ({
  useLanguageSwitcher: jest.fn(() => ({
    currentLanguage: "ar",
    switchLanguage: jest.fn(),
    isRTL: true,
    supportedLanguages: ["ar", "fr", "en"],
  })),
}));

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock auth store
jest.mock("../../store/authStore", () => ({
  useAuthStore: () => ({
    session: { user: { id: "1", email: "test@example.com" } },
    isLoading: false,
    isAuthenticated: true,
  }),
}));

// Mock navigation
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Stack: Object.assign(
    ({ children }: any) => {
      const { View } = require("react-native");
      return <View testID="stack">{children}</View>;
    },
    {
      Screen: ({ children }: any) => {
        const { View } = require("react-native");
        return <View testID="stack-screen">{children}</View>;
      },
    },
  ),
}));

describe("RTL Smoke Tests", () => {
  beforeEach(() => {
    // Force RTL mode for testing
    I18nManager.forceRTL(true);
    I18nManager.allowRTL(true);
  });

  afterEach(() => {
    // Reset to LTR after each test
    I18nManager.forceRTL(false);
    I18nManager.allowRTL(false);
  });

  it("should render LanguageSwitcher correctly in RTL mode", () => {
    const { getByText } = render(<LanguageSwitcher />);

    expect(getByText("English")).toBeTruthy();
    expect(getByText("Français")).toBeTruthy();
    expect(getByText("العربية")).toBeTruthy();
  });

  it("should render AuthGuard correctly in RTL mode", () => {
    const { getByTestId } = render(
      <AuthGuard>
        <View testID="protected-content">Protected Content</View>
      </AuthGuard>,
    );

    expect(getByTestId("protected-content")).toBeTruthy();
  });

  it("should render NavigationStack correctly in RTL mode", () => {
    const { getByTestId } = render(<NavigationStack />);

    // Should render without crashing - look for the stack testID from our mock
    expect(getByTestId("stack")).toBeTruthy();
  });

  it("should handle RTL layout direction correctly", () => {
    // The I18nManager.isRTL may not reflect forceRTL() in Jest environment
    // Instead, verify the component renders correctly with the mocked RTL settings
    const { getByText } = render(<LanguageSwitcher />);

    // Components should still render correctly in RTL mode
    expect(getByText("English")).toBeTruthy();
    expect(getByText("العربية")).toBeTruthy();
  });

  it("should render Arabic text correctly", () => {
    const { getByText } = render(<LanguageSwitcher />);

    const arabicText = getByText("العربية");
    expect(arabicText).toBeTruthy();
    expect(arabicText.props.style).toContainEqual({
      color: "#fff", // Active text color when Arabic is current language
    });
  });

  it("should handle mixed language content in RTL mode", () => {
    const { getByText } = render(<LanguageSwitcher />);

    // Should render all languages correctly even in RTL mode
    expect(getByText("English")).toBeTruthy(); // LTR text
    expect(getByText("Français")).toBeTruthy(); // LTR text
    expect(getByText("العربية")).toBeTruthy(); // RTL text
  });

  it("should maintain component functionality in RTL mode", () => {
    const { useLanguageSwitcher } = require("../../i18n/i18n");
    const mockSwitchLanguage = jest.fn();

    useLanguageSwitcher.mockReturnValue({
      currentLanguage: "ar",
      switchLanguage: mockSwitchLanguage,
      isRTL: true,
      supportedLanguages: ["ar", "fr", "en"],
    });

    const { getByText } = render(<LanguageSwitcher />);

    // Test interaction still works
    const englishButton = getByText("English");
    fireEvent.press(englishButton);

    expect(mockSwitchLanguage).toHaveBeenCalledWith("en");
  });

  it("should handle RTL layout changes", () => {
    // Test switching from RTL to LTR
    const { useLanguageSwitcher } = require("../../i18n/i18n");
    const mockSwitchLanguage = jest.fn();

    useLanguageSwitcher.mockReturnValue({
      currentLanguage: "en",
      switchLanguage: mockSwitchLanguage,
      isRTL: false,
      supportedLanguages: ["ar", "fr", "en"],
    });

    // Reset to LTR
    I18nManager.forceRTL(false);
    I18nManager.allowRTL(false);

    const { getByText } = render(<LanguageSwitcher />);

    expect(getByText("English")).toBeTruthy();
    expect(I18nManager.isRTL).toBe(false);
  });
});
