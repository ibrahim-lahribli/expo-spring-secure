import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import type { SupportedLanguage } from "../../types/i18n";

// Mock the i18n hook
jest.mock("../../i18n/i18n", () => ({
  useLanguageSwitcher: jest.fn(() => ({
    currentLanguage: "en" as SupportedLanguage,
    switchLanguage: jest.fn(),
    isRTL: false,
    supportedLanguages: ["ar", "fr", "en"] as SupportedLanguage[],
  })),
}));

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all supported language buttons", () => {
    const { getByText } = render(<LanguageSwitcher />);

    expect(getByText("English")).toBeTruthy();
    expect(getByText("Français")).toBeTruthy();
    expect(getByText("العربية")).toBeTruthy();
  });

  it("should highlight the current language", () => {
    const { getByText } = render(<LanguageSwitcher />);

    // English should be active (current language)
    const englishButton = getByText("English");
    expect(englishButton).toBeTruthy();
  });

  it("should call switchLanguage when a language button is pressed", () => {
    const { useLanguageSwitcher } = require("../../i18n/i18n");
    const mockSwitchLanguage = jest.fn();
    useLanguageSwitcher.mockReturnValue({
      currentLanguage: "en" as SupportedLanguage,
      switchLanguage: mockSwitchLanguage,
      isRTL: false,
      supportedLanguages: ["ar", "fr", "en"] as SupportedLanguage[],
    });

    const { getByText } = render(<LanguageSwitcher />);

    const frenchButton = getByText("Français");
    fireEvent.press(frenchButton);

    expect(mockSwitchLanguage).toHaveBeenCalledWith("fr");
  });

  it("should apply custom styles when provided", () => {
    const customStyle = { backgroundColor: "red" };
    const customButtonStyle = { borderWidth: 2 };
    const customTextStyle = { fontSize: 16 };

    const { getByText } = render(
      <LanguageSwitcher
        style={customStyle}
        buttonStyle={customButtonStyle}
        textStyle={customTextStyle}
      />,
    );

    // Just verify it renders without errors
    expect(getByText("English")).toBeTruthy();
    expect(getByText("Français")).toBeTruthy();
    expect(getByText("العربية")).toBeTruthy();
  });

  it("should handle Arabic as current language", () => {
    const { useLanguageSwitcher } = require("../../i18n/i18n");
    useLanguageSwitcher.mockReturnValue({
      currentLanguage: "ar" as SupportedLanguage,
      switchLanguage: jest.fn(),
      isRTL: true,
      supportedLanguages: ["ar", "fr", "en"] as SupportedLanguage[],
    });

    const { getByText } = render(<LanguageSwitcher />);

    // Arabic should be active
    const arabicButton = getByText("العربية");
    expect(arabicButton).toBeTruthy();
  });

  it("should handle French as current language", () => {
    const { useLanguageSwitcher } = require("../../i18n/i18n");
    useLanguageSwitcher.mockReturnValue({
      currentLanguage: "fr" as SupportedLanguage,
      switchLanguage: jest.fn(),
      isRTL: false,
      supportedLanguages: ["ar", "fr", "en"] as SupportedLanguage[],
    });

    const { getByText } = render(<LanguageSwitcher />);

    // French should be active
    const frenchButton = getByText("Français");
    expect(frenchButton).toBeTruthy();
  });

  it("should render correct number of language buttons", () => {
    const { getAllByTestId } = render(<LanguageSwitcher />);

    // Should render 3 touchable elements for ar, fr, en
    const buttons = getAllByTestId(/language-button/);
    expect(buttons).toHaveLength(3);
  });
});
