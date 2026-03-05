import { render } from "@testing-library/react-native";
import React from "react";
import { ZakatResultCard } from "../../components/zakat/ZakatResultCard";
import { formatMoney } from "../../lib/currency";
import type { ZakatCalculationResult } from "../../lib/zakat-calculation/types";
import { useAppPreferencesStore } from "../../store/appPreferencesStore";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      const translations: Record<string, string> = {
        "quickResult.summaryTitle": "Calculation Result",
        "quickResult.rows.totalWealth": "Total Wealth:",
        "quickResult.rows.nisabThreshold": "Nisab Threshold:",
        "quickResult.rows.zakatDue": "Zakat Due:",
        "quickResult.notDueNotice": "Your wealth is below the Nisab threshold, so no Zakat is due at this time.",
      };
      if (key === "quickResult.howCalculated") {
        return `How this was calculated: ${options?.explanation ?? ""}`;
      }
      return translations[key] || key;
    },
  }),
}));

describe("ZakatResultCard", () => {
  beforeEach(() => {
    useAppPreferencesStore.setState({ currency: "MAD" });
  });

  it("should render nothing when result is null", () => {
    const { queryByText } = render(<ZakatResultCard result={null} />);

    expect(queryByText("Calculation Result")).toBeNull();
  });

  it("should display totalZakat formatted when hasZakatDue is true", () => {
    const result: ZakatCalculationResult = {
      nisab: 7140,
      totalWealth: 10000,
      totalZakat: 250,
      hasZakatDue: true,
      breakdown: {},
    };

    const { getByText } = render(<ZakatResultCard result={result} />);

    expect(getByText("Calculation Result")).toBeTruthy();
    expect(getByText(formatMoney(250, "MAD"))).toBeTruthy();
  });

  it("should show 'below Nisab threshold' message when hasZakatDue is false", () => {
    const result: ZakatCalculationResult = {
      nisab: 7140,
      totalWealth: 5000,
      totalZakat: 0,
      hasZakatDue: false,
      breakdown: {},
    };

    const { getByText } = render(<ZakatResultCard result={result} />);

    expect(
      getByText(
        "Your wealth is below the Nisab threshold, so no Zakat is due at this time.",
      ),
    ).toBeTruthy();
  });

  it("should render correct totalWealth value", () => {
    const result: ZakatCalculationResult = {
      nisab: 7140,
      totalWealth: 15000,
      totalZakat: 375,
      hasZakatDue: true,
      breakdown: {},
    };

    const { getByText } = render(<ZakatResultCard result={result} />);

    expect(getByText(formatMoney(15000, "MAD"))).toBeTruthy();
  });

  it("should render correct nisab value", () => {
    const result: ZakatCalculationResult = {
      nisab: 7140,
      totalWealth: 15000,
      totalZakat: 375,
      hasZakatDue: true,
      breakdown: {},
    };

    const { getByText } = render(<ZakatResultCard result={result} />);

    expect(getByText(formatMoney(7140, "MAD"))).toBeTruthy();
  });

  it("should display all expected labels", () => {
    const result: ZakatCalculationResult = {
      nisab: 7140,
      totalWealth: 15000,
      totalZakat: 375,
      hasZakatDue: true,
      breakdown: {},
    };

    const { getByText } = render(<ZakatResultCard result={result} />);

    expect(getByText("Total Wealth:")).toBeTruthy();
    expect(getByText("Nisab Threshold:")).toBeTruthy();
    expect(getByText("Zakat Due:")).toBeTruthy();
  });
});
