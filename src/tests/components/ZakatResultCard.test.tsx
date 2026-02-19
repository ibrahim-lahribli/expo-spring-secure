import { render } from "@testing-library/react-native";
import React from "react";
import { ZakatResultCard } from "../../components/zakat/ZakatResultCard";
import type { ZakatCalculationResult } from "../../lib/zakat-calculation/types";

describe("ZakatResultCard", () => {
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
    expect(getByText("250.00")).toBeTruthy();
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

    expect(getByText("15000.00")).toBeTruthy();
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

    expect(getByText("7140.00")).toBeTruthy();
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
