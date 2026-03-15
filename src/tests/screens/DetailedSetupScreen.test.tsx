import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
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
        },
        fr: {
          next: "Suivant",
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
});
