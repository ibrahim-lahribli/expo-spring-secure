import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Platform } from "react-native";
import DetailedSetupScreen from "../../app/(public)/calculate/detailed/setup";
import { useDetailedHawlSetupDraftStore } from "../../store/detailedHawlSetupDraftStore";

let mockCurrentLanguage: "en" | "fr" = "en";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dictionaries: Record<"en" | "fr", Record<string, string>> = {
        en: {
          next: "Next",
          "detailedSetup.validation.trackingModeRequired":
            "Please choose how you track your zakat year.",
          "detailedSetup.form.webDateHint":
            "Web tip: enter date as YYYY-MM-DD (example: 2026-03-17) if the picker is unavailable.",
        },
        fr: {
          next: "Suivant",
          "detailedSetup.form.webDateHint":
            "Astuce web : saisissez la date au format YYYY-MM-DD (ex. 2026-03-17) si le calendrier est indisponible.",
          "detailedSetup.validation.trackingModeRequired":
            "Veuillez choisir comment vous suivez votre année de zakat.",
        },
      };
      return dictionaries[mockCurrentLanguage][key] ?? key;
    },
    i18n: { resolvedLanguage: mockCurrentLanguage },
  }),
}));

describe("DetailedSetupScreen", () => {
  const originalPlatformOS = Platform.OS;

  afterAll(() => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: originalPlatformOS,
    });
  });

  beforeEach(() => {
    const routerModule = require("expo-router") as {
      __routerMock: Record<string, jest.Mock>;
    };
    routerModule.__routerMock.push.mockReset();
    mockCurrentLanguage = "en";
    useDetailedHawlSetupDraftStore.getState().clearDraft();
  });

  it("keeps validation error visible and re-translates it when language changes", () => {
    mockCurrentLanguage = "fr";
    const { getByTestId, getByText, rerender } = render(<DetailedSetupScreen />);

    fireEvent.press(getByTestId("detailed-setup-next"));
    expect(
      getByText("Veuillez choisir comment vous suivez votre année de zakat."),
    ).toBeTruthy();

    mockCurrentLanguage = "en";
    rerender(<DetailedSetupScreen />);

    expect(
      getByText("Please choose how you track your zakat year."),
    ).toBeTruthy();
  });

  it("navigates to detailed calculate with setup params via push", () => {
    const routerModule = require("expo-router") as {
      __routerMock: { push: jest.Mock };
    };
    const { getByTestId } = render(<DetailedSetupScreen />);

    fireEvent.press(getByTestId("tracking-mode-estimated"));
    fireEvent.press(getByTestId("estimated-option-today"));
    fireEvent.press(getByTestId("detailed-setup-next"));

    expect(routerModule.__routerMock.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(public)/calculate/detailed",
        params: expect.objectContaining({
          calculationDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          hawlTrackingMode: "estimated",
          hawlUseToday: "1",
        }),
      }),
    );
  });

  it("stores selected yearly reference date via the paper date picker", () => {
    const routerModule = require("expo-router") as {
      __routerMock: { push: jest.Mock };
    };
    const { getByTestId } = render(<DetailedSetupScreen />);

    fireEvent.press(getByTestId("tracking-mode-yearly"));
    fireEvent.press(getByTestId("reference-date-input"));
    fireEvent(getByTestId("reference-date-input-modal"), "onConfirm", {
      date: new Date(2026, 2, 14),
    });
    fireEvent.press(getByTestId("detailed-setup-next"));

    expect(routerModule.__routerMock.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(public)/calculate/detailed",
        params: expect.objectContaining({
          hawlTrackingMode: "yearly_zakat_date",
          hawlReferenceDate: "2026-03-14",
        }),
      }),
    );
  });

  it("shows web date helper text when selecting a reference-date option on web", () => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: "web",
    });

    const { getByTestId, getByText } = render(<DetailedSetupScreen />);

    fireEvent.press(getByTestId("tracking-mode-yearly"));

    expect(
      getByText(
        "Web tip: enter date as YYYY-MM-DD (example: 2026-03-17) if the picker is unavailable.",
      ),
    ).toBeTruthy();
  });
});
