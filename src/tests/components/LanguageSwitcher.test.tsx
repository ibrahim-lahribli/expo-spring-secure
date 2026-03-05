import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import type { SupportedLanguage } from "../../types/i18n";

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

  it("renders all supported language buttons", () => {
    const { getByText } = render(<LanguageSwitcher />);

    expect(getByText("English")).toBeTruthy();
    expect(getByText("Français")).toBeTruthy();
    expect(getByText("العربية")).toBeTruthy();
  });

  it("highlights the current language", () => {
    const { getByText } = render(<LanguageSwitcher />);

    expect(getByText("English")).toBeTruthy();
  });

  it("calls switchLanguage when a language button is pressed", () => {
    const { useLanguageSwitcher } = require("../../i18n/i18n");
    const mockSwitchLanguage = jest.fn();
    useLanguageSwitcher.mockReturnValue({
      currentLanguage: "en" as SupportedLanguage,
      switchLanguage: mockSwitchLanguage,
      isRTL: false,
      supportedLanguages: ["ar", "fr", "en"] as SupportedLanguage[],
    });

    const { getByText } = render(<LanguageSwitcher />);
    fireEvent.press(getByText("Français"));

    expect(mockSwitchLanguage).toHaveBeenCalledWith("fr");
  });

  it("applies custom styles when provided", () => {
    const { getByText } = render(
      <LanguageSwitcher
        style={{ backgroundColor: "red" }}
        buttonStyle={{ borderWidth: 2 }}
        textStyle={{ fontSize: 16 }}
      />,
    );

    expect(getByText("English")).toBeTruthy();
    expect(getByText("Français")).toBeTruthy();
    expect(getByText("العربية")).toBeTruthy();
  });

  it("handles Arabic as current language", () => {
    const { useLanguageSwitcher } = require("../../i18n/i18n");
    useLanguageSwitcher.mockReturnValue({
      currentLanguage: "ar" as SupportedLanguage,
      switchLanguage: jest.fn(),
      isRTL: true,
      supportedLanguages: ["ar", "fr", "en"] as SupportedLanguage[],
    });

    const { getByText } = render(<LanguageSwitcher />);
    expect(getByText("العربية")).toBeTruthy();
  });

  it("handles French as current language", () => {
    const { useLanguageSwitcher } = require("../../i18n/i18n");
    useLanguageSwitcher.mockReturnValue({
      currentLanguage: "fr" as SupportedLanguage,
      switchLanguage: jest.fn(),
      isRTL: false,
      supportedLanguages: ["ar", "fr", "en"] as SupportedLanguage[],
    });

    const { getByText } = render(<LanguageSwitcher />);
    expect(getByText("Français")).toBeTruthy();
  });

  it("renders the correct number of language buttons", () => {
    const { getAllByTestId } = render(<LanguageSwitcher />);
    expect(getAllByTestId(/language-button/)).toHaveLength(3);
  });
});
