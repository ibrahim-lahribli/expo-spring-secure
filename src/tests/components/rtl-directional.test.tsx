import { render } from "@testing-library/react-native";
import React from "react";
import { I18nManager, StyleSheet } from "react-native";
import LoginScreen from "../../app/auth/login";
import DetailedSetupScreen from "../../app/(public)/calculate/detailed/setup";
import { ListRow } from "../../components/ui";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: "ar" },
  }),
}));

jest.mock("../../store/authStore", () => ({
  useAuthStore: () => ({
    signIn: jest.fn(),
    isLoading: false,
    user: null,
  }),
}));

describe("RTL Directional UI", () => {
  beforeEach(() => {
    (I18nManager as { isRTL: boolean }).isRTL = true;
    I18nManager.forceRTL(true);
    I18nManager.allowRTL(true);
  });

  afterEach(() => {
    (I18nManager as { isRTL: boolean }).isRTL = false;
    I18nManager.forceRTL(false);
    I18nManager.allowRTL(false);
  });

  it("uses left chevron in shared ListRow under RTL", () => {
    const { getByText } = render(<ListRow title="Row" onPress={() => undefined} />);
    expect(getByText("chevron-left")).toBeTruthy();
  });

  it("renders setup radio rows in row-reverse under RTL", () => {
    const { getByTestId } = render(<DetailedSetupScreen />);
    const radio = getByTestId("tracking-mode-yearly");
    const flattened = StyleSheet.flatten(radio.props.style);
    expect(flattened.flexDirection).toBe("row-reverse");
  });

  it("renders auth back icon as arrow-forward under RTL", () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText("arrow-forward")).toBeTruthy();
  });
});
