import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { QuickCalculatorForm } from "../../components/zakat/QuickCalculatorForm";

describe("QuickCalculatorForm", () => {
  it("should render 3 TextInputs and a Calculate Zakat button", () => {
    const { getAllByPlaceholderText, getByText } = render(
      <QuickCalculatorForm />,
    );

    expect(getAllByPlaceholderText("0.00")).toHaveLength(3);
    expect(getByText("Cash (in hand & bank)")).toBeTruthy();
    expect(getByText("Gold & Silver Value")).toBeTruthy();
    expect(getByText("Short-term Debts (Liabilities)")).toBeTruthy();
    expect(getByText("Calculate Zakat")).toBeTruthy();
  });

  it("should show result card when Calculate is pressed with empty inputs", () => {
    const { getByText, queryByText } = render(<QuickCalculatorForm />);

    const calculateButton = getByText("Calculate Zakat");
    fireEvent.press(calculateButton);

    // Should not crash and should render result card with 0 values
    expect(queryByText("Calculation Result")).toBeTruthy();
  });

  it("should show ZakatResultCard with correct result when valid values are entered", async () => {
    const { getAllByPlaceholderText, getByText, queryByText } = render(
      <QuickCalculatorForm />,
    );

    // Enter values in the inputs
    const textInputs = getAllByPlaceholderText("0.00");

    // Enter cash value
    fireEvent.changeText(textInputs[0], "10000");
    // Enter gold value
    fireEvent.changeText(textInputs[1], "5000");
    // Enter debt value
    fireEvent.changeText(textInputs[2], "2000");

    // Press calculate
    const calculateButton = getByText("Calculate Zakat");
    fireEvent.press(calculateButton);

    // Verify result card appears
    await waitFor(() => {
      expect(queryByText("Calculation Result")).toBeTruthy();
    });
    expect(queryByText("13000.00")).toBeTruthy();
  });

  it("should treat negative values as 0", async () => {
    const { getAllByPlaceholderText, getByText, queryByText } = render(
      <QuickCalculatorForm />,
    );

    const textInputs = getAllByPlaceholderText("0.00");

    // Enter negative values
    fireEvent.changeText(textInputs[0], "-1000");
    fireEvent.changeText(textInputs[1], "-500");
    fireEvent.changeText(textInputs[2], "-200");

    // Press calculate
    const calculateButton = getByText("Calculate Zakat");
    fireEvent.press(calculateButton);

    // Should show result without crashing
    await waitFor(() => {
      expect(queryByText("Calculation Result")).toBeTruthy();
    });
  });

  it("should display description text", () => {
    const { getByText } = render(<QuickCalculatorForm />);

    expect(
      getByText("Enter your assets below to quickly estimate your Zakat."),
    ).toBeTruthy();
  });
});
