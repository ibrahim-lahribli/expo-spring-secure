import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { useQuickCalculationDraftStore } from "../../store/quickCalculationDraftStore";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    const React = require("react");
    React.useEffect(() => effect(), [effect]);
  },
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "quickCalculator.title": "Quick Calculate",
        "quickCalculator.fields.cash.title": "Cash & Bank Balance",
        "quickCalculator.fields.cash.description": "Include cash at home and in all bank accounts.",
        "quickCalculator.fields.gold.title": "Gold & Silver Value",
        "quickCalculator.fields.gold.description": "Current market value of your jewelry or coins.",
        "quickCalculator.fields.debt.title": "Short-term Debts",
        "quickCalculator.fields.debt.description": "Money you owe and must pay soon.",
        "quickCalculator.calculate": "Calculate Zakat",
        "quickCalculator.placeholder": "0",
        "quickCalculator.validation.positiveNumber": "Please enter a positive number.",
      };
      return translations[key] || key;
    },
  }),
}));

import { QuickCalculatorForm } from "../../components/zakat/QuickCalculatorForm";

describe("QuickCalculatorForm", () => {
  beforeEach(() => {
    mockPush.mockClear();
    useQuickCalculationDraftStore.getState().clearDraft();
  });

  it("renders form labels and calculate button", () => {
    const { getByText, getAllByPlaceholderText } = render(<QuickCalculatorForm />);

    expect(getByText("Cash & Bank Balance")).toBeTruthy();
    expect(getByText("Gold & Silver Value")).toBeTruthy();
    expect(getByText("Short-term Debts")).toBeTruthy();
    expect(getByText("Calculate Zakat")).toBeTruthy();
    expect(getAllByPlaceholderText("0")).toHaveLength(3);
  });

  it("shows debt validation error for negative debt and does not navigate", () => {
    const { getByText, getAllByPlaceholderText } = render(<QuickCalculatorForm />);
    const textInputs = getAllByPlaceholderText("0");

    fireEvent.changeText(textInputs[2], "-500");
    fireEvent.press(getByText("Calculate Zakat"));

    expect(getByText("! Please enter a positive number.")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to result page with computed values", () => {
    const { getByText, getAllByPlaceholderText } = render(<QuickCalculatorForm />);
    const textInputs = getAllByPlaceholderText("0");

    fireEvent.changeText(textInputs[0], "10000");
    fireEvent.changeText(textInputs[1], "5000");
    fireEvent.changeText(textInputs[2], "2000");
    fireEvent.press(getByText("Calculate Zakat"));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/calculate/result",
        params: expect.objectContaining({
          totalWealth: "13000",
          debt: "2000",
        }),
      }),
    );
  });

  it("restores saved inputs when returning from edit inputs", () => {
    useQuickCalculationDraftStore.getState().setDraft({
      cash: "10000",
      goldValue: "5000",
      debt: "2000",
    });

    const { getAllByDisplayValue } = render(<QuickCalculatorForm />);

    expect(getAllByDisplayValue("10000")).toHaveLength(1);
    expect(getAllByDisplayValue("5000")).toHaveLength(1);
    expect(getAllByDisplayValue("2000")).toHaveLength(1);
    expect(useQuickCalculationDraftStore.getState().draft).toBeNull();
  });
});
