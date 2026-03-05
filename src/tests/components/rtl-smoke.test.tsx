import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { I18nManager, View } from "react-native";
import { AuthGuard } from "../../components/AuthGuard";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { NavigationStack } from "../../components/NavigationStack";

jest.mock("../../i18n/i18n", () => ({
  useLanguageSwitcher: jest.fn(() => ({
    currentLanguage: "ar",
    switchLanguage: jest.fn(),
    isRTL: true,
    supportedLanguages: ["ar", "fr", "en"],
  })),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "languages.en": "English",
        "languages.fr": "Français",
        "languages.ar": "العربية",
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock("../../store/authStore", () => ({
  useAuthStore: () => ({
    session: { user: { id: "1", email: "test@example.com" } },
    isLoading: false,
    isAuthenticated: true,
  }),
}));

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
    I18nManager.forceRTL(true);
    I18nManager.allowRTL(true);
  });

  afterEach(() => {
    I18nManager.forceRTL(false);
    I18nManager.allowRTL(false);
  });

  it("renders LanguageSwitcher correctly in RTL mode", () => {
    const { getByText } = render(<LanguageSwitcher />);

    expect(getByText("English")).toBeTruthy();
    expect(getByText("Français")).toBeTruthy();
    expect(getByText("العربية")).toBeTruthy();
  });

  it("renders AuthGuard correctly in RTL mode", () => {
    const { getByTestId } = render(
      <AuthGuard>
        <View testID="protected-content">Protected Content</View>
      </AuthGuard>,
    );

    expect(getByTestId("protected-content")).toBeTruthy();
  });

  it("renders NavigationStack correctly in RTL mode", () => {
    const { getByTestId } = render(<NavigationStack />);
    expect(getByTestId("stack")).toBeTruthy();
  });

  it("renders Arabic text correctly", () => {
    const { getByText } = render(<LanguageSwitcher />);

    const arabicText = getByText("العربية");
    expect(arabicText).toBeTruthy();
    expect(arabicText.props.style).toContainEqual({ color: "#fff" });
  });

  it("maintains component functionality in RTL mode", () => {
    const { useLanguageSwitcher } = require("../../i18n/i18n");
    const mockSwitchLanguage = jest.fn();

    useLanguageSwitcher.mockReturnValue({
      currentLanguage: "ar",
      switchLanguage: mockSwitchLanguage,
      isRTL: true,
      supportedLanguages: ["ar", "fr", "en"],
    });

    const { getByText } = render(<LanguageSwitcher />);
    fireEvent.press(getByText("English"));

    expect(mockSwitchLanguage).toHaveBeenCalledWith("en");
  });
});
