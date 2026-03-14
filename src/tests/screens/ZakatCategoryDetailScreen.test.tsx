import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import ZakatCategoryDetailScreen from "../../app/(public)/zakat-explanations/[slug]";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    i18n: { resolvedLanguage: "en" },
  }),
}));

describe("ZakatCategoryDetailScreen", () => {
  it("uses the explicit returnTo target when provided", () => {
    const routerModule = require("expo-router") as {
      __routerMock: { push: jest.Mock };
      useLocalSearchParams: jest.Mock;
    };
    routerModule.__routerMock.push.mockReset();
    routerModule.useLocalSearchParams.mockReturnValue({
      slug: "debt",
      returnTo: "/(public)/calculate/detailed?openCategory=debt",
    });

    const { getByText } = render(<ZakatCategoryDetailScreen />);
    fireEvent.press(getByText("Calculate this category"));

    expect(routerModule.__routerMock.push).toHaveBeenCalledWith(
      "/(public)/calculate/detailed?openCategory=debt",
    );
  });

  it("uses detailed setup route when returnTo is not provided", () => {
    const routerModule = require("expo-router") as {
      __routerMock: { push: jest.Mock };
      useLocalSearchParams: jest.Mock;
    };
    routerModule.__routerMock.push.mockReset();
    routerModule.useLocalSearchParams.mockReturnValue({
      slug: "debt",
    });

    const { getByText } = render(<ZakatCategoryDetailScreen />);
    fireEvent.press(getByText("Calculate this category"));

    expect(routerModule.__routerMock.push).toHaveBeenCalledWith(
      "/(public)/calculate/detailed/setup",
    );
  });
});
