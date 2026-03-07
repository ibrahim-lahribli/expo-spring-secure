import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import DetailedCalculateScreen from "../../app/(public)/calculate/detailed";
import { useAppPreferencesStore } from "../../store/appPreferencesStore";
import { useNisabSettingsStore } from "../../store/nisabSettingsStore";

describe("DetailedCalculateScreen", () => {
  beforeEach(() => {
    useAppPreferencesStore.setState({ currency: "MAD" });
    useNisabSettingsStore.setState({
      nisabMethod: "silver",
      silverPricePerGram: 12,
      goldPricePerGram: 800,
      nisabOverride: 0,
    });
  });

  it("hides Nisab settings section", () => {
    const { queryByText } = render(<DetailedCalculateScreen />);
    expect(queryByText("Nisab Settings")).toBeNull();
  });

  it("removes livestock in-kind/cash toggle and shows optional cash estimate input", () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Livestock"));

    expect(queryByText("In-kind")).toBeNull();
    expect(queryByText("Cash")).toBeNull();
    expect(getByPlaceholderText("Livestock cash estimate (MAD) (optional)")).toBeTruthy();
  });

  it("shows grains cash estimate in live preview when price per kg is provided", () => {
    const { getByText, getByPlaceholderText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Grains & Fruits"));
    fireEvent.changeText(getByPlaceholderText("Harvest quantity (kg)"), "5000");
    fireEvent.changeText(getByPlaceholderText("Price per kg (optional)"), "12");

    expect(getByText("Zakat due (cash estimate)")).toBeTruthy();
    expect(getByText("Zakat due (produce)")).toBeTruthy();
  });

  it("shows mixed total inline display for in-kind livestock and produce kg dues", async () => {
    const { getByText, getByPlaceholderText, getAllByText, queryByText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Salaries & Services"));
    fireEvent.changeText(getByPlaceholderText("Monthly services income"), "4000");
    fireEvent.press(getByText("Add This Category"));

    fireEvent.press(getByText("Livestock"));
    fireEvent.changeText(getByPlaceholderText("Owned count"), "30");
    fireEvent.press(getByText("Add This Category"));

    await waitFor(() => {
      expect(getByText("Tap a category below to add it to your zakat calculation.")).toBeTruthy();
    });

    fireEvent.press(getByText("Grains & Fruits"));
    fireEvent.changeText(getByPlaceholderText("Harvest quantity (kg)"), "5000");
    fireEvent.press(getByText("Add This Category"));

    await waitFor(() => {
      expect(getAllByText(/\+ Camels:/).length).toBeGreaterThan(0);
      expect(getAllByText(/500\.00 kg/).length).toBeGreaterThan(0);
      expect(queryByText(/Also due in-kind:/)).toBeNull();
      expect(queryByText(/Also due as produce:/)).toBeNull();
    });
  });
});
