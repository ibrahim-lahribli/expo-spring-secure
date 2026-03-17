import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import DetailedCalculateScreen from "../../app/(public)/calculate/detailed";
import { formatDateAsIso } from "../../lib/zakat-calculation/detailedCalculationContext";
import type { HistoryEntry } from "../../features/history/types";
import { useAppPreferencesStore } from "../../store/appPreferencesStore";
import { useDetailedHawlSetupDraftStore } from "../../store/detailedHawlSetupDraftStore";
import { useNisabSettingsStore } from "../../store/nisabSettingsStore";

const mockUpsertGuestHistoryEntry = jest.fn();
const mockScheduleHawlDueReminderNotification = jest.fn();

jest.mock("../../features/history/storage", () => ({
  upsertGuestHistoryEntry: (...args: unknown[]) => mockUpsertGuestHistoryEntry(...args),
}));

jest.mock("../../features/reminders/scheduling", () => {
  const actual = jest.requireActual("../../features/reminders/scheduling");
  return {
    ...actual,
    scheduleHawlDueReminderNotification: (...args: unknown[]) =>
      mockScheduleHawlDueReminderNotification(...args),
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    const mockEnCommon = require("../../i18n/locales/en/common.json") as Record<string, unknown>;
    return {
      t: (key: string, options?: Record<string, unknown>) => {
        const normalized = key.includes(":") ? key.split(":")[1] : key;
        const value = normalized.split(".").reduce<unknown>((acc, part) => {
          if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
            return (acc as Record<string, unknown>)[part];
          }
          return undefined;
        }, mockEnCommon);
        const template = typeof value === "string" ? value : key;
        if (!options) return template;
        return template.replace(/\{\{?(\w+)\}?\}/g, (match, token) => {
          if (!(token in options)) return match;
          return String(options[token]);
        });
      },
    };
  },
}));

function pickIsoDate(
  getByTestId: (testID: string) => any,
  triggerTestId: string,
  isoDate: string,
) {
  const [year, month, day] = isoDate.split("-").map(Number);
  fireEvent.press(getByTestId(triggerTestId));
  fireEvent(getByTestId(`${triggerTestId}-modal`), "onConfirm", {
    date: new Date(year, month - 1, day),
  });
}

describe("DetailedCalculateScreen", () => {
  beforeEach(() => {
    const routerModule = require("expo-router") as {
      __routerMock: Record<string, jest.Mock>;
      useLocalSearchParams: jest.Mock;
    };
    routerModule.__routerMock.push.mockReset();
    routerModule.__routerMock.replace.mockReset();
    routerModule.__routerMock.back.mockReset();
    routerModule.__routerMock.navigate.mockReset();
    routerModule.useLocalSearchParams.mockReturnValue({
      hawlTrackingMode: "yearly_zakat_date",
      hawlReferenceDate: "2025-01-01",
      calculationDate: "2026-03-11",
    });
    useDetailedHawlSetupDraftStore.getState().clearDraft();
    mockUpsertGuestHistoryEntry.mockReset();
    mockUpsertGuestHistoryEntry.mockResolvedValue(undefined);
    mockScheduleHawlDueReminderNotification.mockReset();
    mockScheduleHawlDueReminderNotification.mockResolvedValue({
      status: "scheduled",
      scheduledNotificationId: "notif-1",
    });

    useAppPreferencesStore.setState({ currency: "MAD", zakatReminderEnabled: true });
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

  it("shows back-to-setup action on pick step and navigates to setup", () => {
    const routerModule = require("expo-router") as {
      __routerMock: { push: jest.Mock };
    };
    const { getByTestId, getByText } = render(<DetailedCalculateScreen />);

    expect(getByText("Back to setup")).toBeTruthy();
    fireEvent.press(getByTestId("detailed-pick-back-to-setup"));

    expect(routerModule.__routerMock.push).toHaveBeenCalledWith("/(public)/calculate/detailed/setup");
  });

  it("shows hawl setup summary in hero when setup params are present", () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      hawlTrackingMode: "nisab_reached_date",
      hawlReferenceDate: "2026-03-01",
    });
    const expectedDate = new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(2026, 2, 1));

    const { getByText } = render(<DetailedCalculateScreen />);

    expect(getByText("Hawl Setup")).toBeTruthy();
    expect(
      getByText(
        `Tracking mode: I know when my wealth first reached nisab - Reference date: ${expectedDate}`,
      ),
    ).toBeTruthy();
  });

  it("persists route calculationDate into detailed hawl draft context", async () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      hawlTrackingMode: "estimated",
      hawlUseToday: "1",
      calculationDate: "2026-03-11",
    });

    render(<DetailedCalculateScreen />);

    await waitFor(() => {
      expect(useDetailedHawlSetupDraftStore.getState().draft?.calculationDate).toBe("2026-03-11");
    });
  });

  it("falls back to today's date for calculation context when params omit it", async () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      hawlTrackingMode: "estimated",
      hawlUseToday: "1",
    });

    render(<DetailedCalculateScreen />);

    await waitFor(() => {
      expect(useDetailedHawlSetupDraftStore.getState().draft?.calculationDate).toBe(
        formatDateAsIso(new Date()),
      );
    });
  });

  it("stores calculation context date in detailed history payload", async () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      hawlTrackingMode: "estimated",
      hawlUseToday: "1",
      calculationDate: "2026-03-11",
    });
    const { getByText, getByPlaceholderText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Salaries & Services"));
    fireEvent.changeText(getByPlaceholderText("Monthly services income"), "5000");
    fireEvent.press(getByText("Add This Category"));
    fireEvent.press(getByText("Save to History"));

    await waitFor(() => {
      expect(mockUpsertGuestHistoryEntry).toHaveBeenCalledTimes(1);
    });

    const savedEntry = mockUpsertGuestHistoryEntry.mock.calls[0][0] as HistoryEntry;
    if (savedEntry.payload.kind !== "detailed") {
      throw new Error("Expected detailed history payload.");
    }
    expect(savedEntry.payload.calculationContext).toEqual({
      calculationDate: "2026-03-11",
    });
    expect(savedEntry.payload.lineItems[0]?.meta).toMatchObject({
      obligationMode: "hawl_required",
      dueNow: false,
      debtAdjustable: true,
    });
    expect(savedEntry.payload.lineItems[0]?.detailRows).toEqual([
      { kind: "mode", mode: "annual" },
      { kind: "nisab", amount: 7140 },
    ]);
    expect(savedEntry.payload.lineItems[0]?.details).toBeUndefined();
  });

  it("renders category icons as Ionicons instead of broken emoji glyphs", () => {
    const { getByText, queryByText } = render(<DetailedCalculateScreen />);

    expect(getByText("briefcase-outline")).toBeTruthy();
    expect(getByText("paw-outline")).toBeTruthy();
    expect(getByText("receipt-outline")).toBeTruthy();
    expect(queryByText("ðŸ’¼")).toBeNull();
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
    const { getByText, getByPlaceholderText, getAllByText, queryByText, getByTestId } = render(<DetailedCalculateScreen />);

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
    pickIsoDate(getByTestId, "produce-event-date-input", "2026-03-01");
    fireEvent.changeText(getByPlaceholderText("Harvest quantity (kg)"), "5000");
    fireEvent.press(getByText("Add This Category"));

    await waitFor(() => {
      expect(getAllByText(/\+ Camels:/).length).toBeGreaterThan(0);
      expect(getAllByText(/500\.00 kg/).length).toBeGreaterThan(0);
      expect(queryByText(/Also due in-kind:/)).toBeNull();
      expect(queryByText(/Also due as produce:/)).toBeNull();
    });
  });

  it("supports debt inputs and updates existing debt item instead of adding a second one", async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getAllByText("Debt")[0]);
    fireEvent.changeText(getByPlaceholderText("Collectible receivables (current cycle)"), "5000");
    fireEvent.changeText(getByPlaceholderText("Debts currently due by you"), "1000");
    fireEvent.press(getByText("Add This Category"));

    await waitFor(() => {
      expect(getAllByText(/Collectible receivables \(\+\):/).length).toBe(1);
    });

    fireEvent.press(getAllByText("Debt")[0]);
    expect(getByText("Update Debt")).toBeTruthy();
    fireEvent.changeText(getByPlaceholderText("Debts currently due by you"), "2000");
    fireEvent.press(getByText("Update Debt"));

    await waitFor(() => {
      expect(getAllByText(/Collectible receivables \(\+\):/).length).toBe(1);
    });
  });

  it("shows debt adjustment explanation rows and doubtful exclusion note", async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getAllByText("Debt")[0]);
    fireEvent.changeText(getByPlaceholderText("Collectible receivables (current cycle)"), "10000");
    fireEvent.changeText(getByPlaceholderText("Doubtful receivables (record only)"), "5000");
    fireEvent.changeText(getByPlaceholderText("Debts currently due by you"), "7000");
    fireEvent.press(getByText("Add This Category"));

    await waitFor(() => {
      expect(getByText("Debt Adjustment")).toBeTruthy();
      expect(getByText("Debt figures are shown in the Debt Adjustment section below.")).toBeTruthy();
      expect(getAllByText(/Collectible receivables \(\+\):/).length).toBe(1);
      expect(getAllByText(/Debts currently due \(-\):/).length).toBe(1);
      expect(getAllByText(/Doubtful receivables \(excluded\):/).length).toBe(1);
      expect(getAllByText("Doubtful receivables are excluded until they are collected.").length).toBe(1);
    });
  });

  it("shows debt impact badges for applied and not applied categories", () => {
    const { getAllByText } = render(<DetailedCalculateScreen />);

    expect(getAllByText("Debt adjustment applied").length).toBeGreaterThan(0);
    expect(getAllByText("Debt adjustment not applied").length).toBeGreaterThan(0);
  });

  it("shows below-nisab message only when adjusted base drops below nisab", async () => {
    const { getByText, getByPlaceholderText, getAllByText, queryByText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Salaries & Services"));
    fireEvent.changeText(getByPlaceholderText("Monthly services income"), "5000");
    fireEvent.press(getByText("Add This Category"));

    fireEvent.press(getAllByText("Debt")[0]);
    fireEvent.changeText(getByPlaceholderText("Debts currently due by you"), "25000");
    fireEvent.press(getByText("Add This Category"));

    await waitFor(() => {
      expect(getByText("Below nisab after debt adjustment")).toBeTruthy();
    });

    fireEvent.press(getAllByText("Debt")[0]);
    fireEvent.changeText(getByPlaceholderText("Debts currently due by you"), "1000");
    fireEvent.press(getByText("Update Debt"));

    await waitFor(() => {
      expect(queryByText("Below nisab after debt adjustment")).toBeNull();
    });
  });

  it("does not show below-nisab-after-debt message when base is already below nisab", async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Salaries & Services"));
    fireEvent.changeText(getByPlaceholderText("Monthly services income"), "2000");
    fireEvent.press(getByText("Add This Category"));

    fireEvent.press(getByText("Debt"));
    fireEvent.changeText(getByPlaceholderText("Debts currently due by you"), "1000");
    fireEvent.press(getByText("Add This Category"));

    await waitFor(() => {
      expect(queryByText("Below nisab after debt adjustment")).toBeNull();
    });
  });

  it("shows debt helper link and examples in debt form", () => {
    const { getByText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Debt"));

    expect(getByText("Not sure what counts as debt?")).toBeTruthy();
    expect(getByText(/Typical examples:/)).toBeTruthy();
  });

  it("opens debt explanation with an explicit return target to debt form", () => {
    const { getByText } = render(<DetailedCalculateScreen />);
    const routerModule = require("expo-router") as { __routerMock: { push: jest.Mock } };

    fireEvent.press(getByText("Debt"));
    fireEvent.press(getByText("Not sure what counts as debt?"));

    expect(routerModule.__routerMock.push).toHaveBeenCalledWith({
      pathname: "/(public)/zakat-explanations/[slug]",
      params: {
        slug: "debt",
        returnTo: "/(public)/calculate/detailed?openCategory=debt",
      },
    });
  });

  it("reopens directly on debt form when openCategory=debt is provided", () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({ openCategory: "debt" });

    const { getByText } = render(<DetailedCalculateScreen />);

    expect(getByText("Not sure what counts as debt?")).toBeTruthy();
  });

  it("clamps final zakatable base to zero when debts owed exceed collectible receivables", async () => {
    const { getByText, getByPlaceholderText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Debt"));
    fireEvent.changeText(getByPlaceholderText("Collectible receivables (current cycle)"), "1000");
    fireEvent.changeText(getByPlaceholderText("Debts currently due by you"), "10000");
    fireEvent.press(getByText("Add This Category"));

    const zeroDisplay = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);

    await waitFor(() => {
      expect(getByText(`Final zakatable base: ${zeroDisplay}`)).toBeTruthy();
    });
  });

  it("does not include produce (trade mode) in debt-adjustable due-now money pool", async () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Grains & Fruits"));
    pickIsoDate(getByTestId, "produce-event-date-input", "2026-03-01");
    fireEvent.press(getByText("Trade stock"));
    fireEvent.changeText(getByPlaceholderText("Market value"), "20000");
    fireEvent.press(getByText("Add This Category"));

    fireEvent.press(getByText("Debt"));
    fireEvent.changeText(getByPlaceholderText("Collectible receivables (current cycle)"), "1000");
    fireEvent.press(getByText("Add This Category"));

    const expectedBase = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);

    await waitFor(() => {
      expect(getByText(`Final zakatable base: ${expectedBase}`)).toBeTruthy();
    });
  });

  it("includes money-based categories in due-now debt-adjustable pool", async () => {
    const { getByText, getByPlaceholderText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Trade & Business"));
    fireEvent.changeText(getByPlaceholderText("Total value of trade/business assets"), "20000");
    fireEvent.press(getByText("Add This Category"));

    fireEvent.press(getByText("Debt"));
    fireEvent.changeText(getByPlaceholderText("Collectible receivables (current cycle)"), "10000");
    fireEvent.changeText(getByPlaceholderText("Debts currently due by you"), "7000");
    fireEvent.press(getByText("Add This Category"));

    const expectedBase = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(23000);

    await waitFor(() => {
      expect(getByText(`Final zakatable base: ${expectedBase}`)).toBeTruthy();
    });
  });

  it("adds independent non-debt-adjustable cash due to total without debt-adjusting it", async () => {
    const { getByText, getByPlaceholderText, getAllByText, queryByText, getByTestId } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Grains & Fruits"));
    pickIsoDate(getByTestId, "produce-event-date-input", "2026-03-01");
    fireEvent.press(getByText("Trade stock"));
    fireEvent.changeText(getByPlaceholderText("Market value"), "10000");
    fireEvent.press(getByText("Add This Category"));

    fireEvent.press(getAllByText("Debt")[0]);
    fireEvent.changeText(getByPlaceholderText("Debts currently due by you"), "100000");
    fireEvent.press(getByText("Add This Category"));

    const independentDue = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(250);

    await waitFor(() => {
      expect(getByText(`Independent non-debt-adjustable cash due: ${independentDue}`)).toBeTruthy();
      expect(getByText(`Total payable due now: ${independentDue}`)).toBeTruthy();
      expect(queryByText("Below nisab after debt adjustment")).toBeNull();
    });
  });

  it("applies debt only to due-now money categories when mixed due states exist (Case A)", async () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      calculationDate: "2026-03-11",
    });

    const { getByText, getByPlaceholderText, getByTestId } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Salaries & Services"));
    fireEvent.press(getByText("Use custom date for this category"));
    pickIsoDate(getByTestId, "hawl-custom-date-input", "2026-01-01");
    fireEvent.changeText(getByPlaceholderText("Monthly services income"), "5000");
    fireEvent.press(getByText("Add This Category"));

    fireEvent.press(getByText("Trade & Business"));
    fireEvent.press(getByText("Use custom date for this category"));
    pickIsoDate(getByTestId, "hawl-custom-date-input", "2025-01-01");
    fireEvent.changeText(getByPlaceholderText("Total value of trade/business assets"), "20000");
    fireEvent.press(getByText("Add This Category"));

    fireEvent.press(getByText("Debt"));
    fireEvent.changeText(getByPlaceholderText("Debts currently due by you"), "1000");
    fireEvent.press(getByText("Add This Category"));

    const expectedBase = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(19000);

    await waitFor(() => {
      expect(getByText(`Final zakatable base: ${expectedBase}`)).toBeTruthy();
      expect(getByText("Not due yet")).toBeTruthy();
    });
  });

  it("does not let debt create payable zakat when all money categories are not due yet (Case B)", async () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      calculationDate: "2026-03-11",
    });

    const { getByText, getByPlaceholderText, getByTestId } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Salaries & Services"));
    fireEvent.press(getByText("Use custom date for this category"));
    pickIsoDate(getByTestId, "hawl-custom-date-input", "2026-01-01");
    fireEvent.changeText(getByPlaceholderText("Monthly services income"), "5000");
    fireEvent.press(getByText("Add This Category"));

    fireEvent.press(getByText("Trade & Business"));
    fireEvent.press(getByText("Use custom date for this category"));
    pickIsoDate(getByTestId, "hawl-custom-date-input", "2026-01-01");
    fireEvent.changeText(getByPlaceholderText("Total value of trade/business assets"), "20000");
    fireEvent.press(getByText("Add This Category"));

    fireEvent.press(getByText("Debt"));
    fireEvent.changeText(getByPlaceholderText("Collectible receivables (current cycle)"), "10000");
    fireEvent.press(getByText("Add This Category"));

    const zeroDisplay = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);

    await waitFor(() => {
      expect(getByText(`Final zakatable base: ${zeroDisplay}`)).toBeTruthy();
      expect(getByText(`Total payable due now: ${zeroDisplay}`)).toBeTruthy();
      expect(
        getByText(
          "No eligible due-now money pool is present, so debt adjustment does not create a payable amount by itself.",
        ),
      ).toBeTruthy();
    });
  });

  it("marks produce with a future event date as not due yet and excludes it from payable total", async () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      calculationDate: "2026-03-11",
    });
    const { getByText, getByPlaceholderText, getByTestId } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Grains & Fruits"));
    pickIsoDate(getByTestId, "produce-event-date-input", "2026-04-01");
    fireEvent.changeText(getByPlaceholderText("Harvest quantity (kg)"), "5000");
    fireEvent.press(getByText("Add This Category"));

    const zeroDisplay = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);

    await waitFor(() => {
      expect(getByText("Not due yet")).toBeTruthy();
      expect(getByText(`Total Zakat Due`)).toBeTruthy();
      expect(getByText(zeroDisplay)).toBeTruthy();
    });
  });

  it("requires produce event date before adding produce category", async () => {
    const { getByText, getByPlaceholderText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Grains & Fruits"));
    fireEvent.changeText(getByPlaceholderText("Harvest quantity (kg)"), "5000");
    fireEvent.press(getByText("Add This Category"));

    await waitFor(() => {
      expect(getByText("Please provide a valid event date in YYYY-MM-DD format.")).toBeTruthy();
    });
  });

  it("uses event-based unknown wording for produce when event date is missing", () => {
    const { getByText, queryByText } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Grains & Fruits"));

    expect(getByText("Event date missing / unknown")).toBeTruthy();
    expect(queryByText("Hawl date missing / unknown")).toBeNull();
  });

  it("keeps custom hawl date per category when leaving and reopening forms", () => {
    const { getByText, getByTestId } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Salaries & Services"));
    fireEvent.press(getByText("Use custom date for this category"));
    pickIsoDate(getByTestId, "hawl-custom-date-input", "2025-02-01");
    fireEvent.press(getByText("Back to categories"));

    fireEvent.press(getByText("Trade & Business"));
    fireEvent.press(getByText("Use custom date for this category"));
    pickIsoDate(getByTestId, "hawl-custom-date-input", "2025-03-01");
    fireEvent.press(getByText("Back to categories"));

    fireEvent.press(getByText("Salaries & Services"));
    const selectedDate = getByTestId("hawl-custom-date-input-modal").props.date as Date;
    expect(formatDateAsIso(selectedDate)).toBe("2025-02-01");
  });

  it("uses estimated start-today calculation date as inherited session hawl date", () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      hawlTrackingMode: "estimated",
      hawlUseToday: "1",
      calculationDate: "2026-03-11",
    });

    const { getByText } = render(<DetailedCalculateScreen />);
    fireEvent.press(getByText("Salaries & Services"));

    expect(getByText(/Inherited session date:/)).toBeTruthy();
  });

  it("places livestock with incomplete hawl in Not due yet group", async () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      calculationDate: "2026-03-11",
    });
    const { getByText, getByPlaceholderText, queryByText, getByTestId } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Livestock"));
    fireEvent.press(getByText("Use custom date for this category"));
    pickIsoDate(getByTestId, "hawl-custom-date-input", "2026-01-01");
    fireEvent.changeText(getByPlaceholderText("Owned count"), "30");
    fireEvent.press(getByText("Add This Category"));

    await waitFor(() => {
      expect(getByText("Not due yet")).toBeTruthy();
      expect(queryByText("Due now - special categories")).toBeNull();
    });
  });

  it("places livestock with complete hawl in Due now - special categories group", async () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      calculationDate: "2026-03-11",
    });
    const { getByText, getByPlaceholderText, getByTestId } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Livestock"));
    fireEvent.press(getByText("Use custom date for this category"));
    pickIsoDate(getByTestId, "hawl-custom-date-input", "2025-01-01");
    fireEvent.changeText(getByPlaceholderText("Owned count"), "30");
    fireEvent.press(getByText("Add This Category"));

    await waitFor(() => {
      expect(getByText("Due now - special categories")).toBeTruthy();
    });
  });

  it("schedules and persists a hawl reminder when preference is enabled and future due exists", async () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      calculationDate: "2026-03-11",
    });
    const { getByText, getByPlaceholderText, getByTestId } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Salaries & Services"));
    fireEvent.press(getByText("Use custom date for this category"));
    pickIsoDate(getByTestId, "hawl-custom-date-input", "2026-01-01");
    fireEvent.changeText(getByPlaceholderText("Monthly services income"), "5000");
    fireEvent.press(getByText("Add This Category"));

    fireEvent.press(getByText("Save to History"));

    await waitFor(() => {
      expect(mockUpsertGuestHistoryEntry).toHaveBeenCalledTimes(1);
    });

    const savedEntry = mockUpsertGuestHistoryEntry.mock.calls[0][0] as HistoryEntry;
    if (savedEntry.payload.kind !== "detailed") {
      throw new Error("Expected detailed history payload.");
    }
    expect(mockScheduleHawlDueReminderNotification).toHaveBeenCalledTimes(1);
    expect(savedEntry.payload.reminders).toEqual([
      expect.objectContaining({
        historyEntryId: savedEntry.id,
        lineItemId: savedEntry.payload.lineItems[0]?.id,
        type: "hawl_due",
        reminderDate: "2026-12-21",
        scheduledNotificationId: "notif-1",
        enabled: true,
        status: "scheduled",
      }),
    ]);
  });

  it("stores disabled reminder state without scheduling when preference is off", async () => {
    useAppPreferencesStore.setState({ zakatReminderEnabled: false });
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      calculationDate: "2026-03-11",
    });
    const { getByText, getByPlaceholderText, getByTestId } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Salaries & Services"));
    fireEvent.press(getByText("Use custom date for this category"));
    pickIsoDate(getByTestId, "hawl-custom-date-input", "2026-01-01");
    fireEvent.changeText(getByPlaceholderText("Monthly services income"), "5000");
    fireEvent.press(getByText("Add This Category"));
    fireEvent.press(getByText("Save to History"));

    await waitFor(() => {
      expect(mockUpsertGuestHistoryEntry).toHaveBeenCalledTimes(1);
    });

    const savedEntry = mockUpsertGuestHistoryEntry.mock.calls[0][0] as HistoryEntry;
    if (savedEntry.payload.kind !== "detailed") {
      throw new Error("Expected detailed history payload.");
    }
    expect(mockScheduleHawlDueReminderNotification).not.toHaveBeenCalled();
    expect(savedEntry.payload.reminders).toEqual([
      expect.objectContaining({
        historyEntryId: savedEntry.id,
        type: "hawl_due",
        reminderDate: "2026-12-21",
        enabled: false,
        status: "disabled_by_preference",
      }),
    ]);
  });

  it("does not persist reminders when there is no future hawl due date", async () => {
    const routerModule = require("expo-router") as { useLocalSearchParams: jest.Mock };
    routerModule.useLocalSearchParams.mockReturnValue({
      calculationDate: "2026-03-11",
    });
    const { getByText, getByPlaceholderText, getByTestId } = render(<DetailedCalculateScreen />);

    fireEvent.press(getByText("Salaries & Services"));
    fireEvent.press(getByText("Use custom date for this category"));
    pickIsoDate(getByTestId, "hawl-custom-date-input", "2025-01-01");
    fireEvent.changeText(getByPlaceholderText("Monthly services income"), "5000");
    fireEvent.press(getByText("Add This Category"));
    fireEvent.press(getByText("Save to History"));

    await waitFor(() => {
      expect(mockUpsertGuestHistoryEntry).toHaveBeenCalledTimes(1);
    });

    const savedEntry = mockUpsertGuestHistoryEntry.mock.calls[0][0] as HistoryEntry;
    if (savedEntry.payload.kind !== "detailed") {
      throw new Error("Expected detailed history payload.");
    }
    expect(mockScheduleHawlDueReminderNotification).not.toHaveBeenCalled();
    expect(savedEntry.payload.reminders).toBeUndefined();
  });

  it("prevents duplicate save scheduling on repeated taps while save is in flight", async () => {
    let releaseSave!: () => void;
    mockUpsertGuestHistoryEntry.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseSave = () => resolve();
        }),
    );

    const { getByText, getByPlaceholderText, getByTestId } = render(<DetailedCalculateScreen />);
    fireEvent.press(getByText("Salaries & Services"));
    fireEvent.press(getByText("Use custom date for this category"));
    pickIsoDate(getByTestId, "hawl-custom-date-input", "2026-01-01");
    fireEvent.changeText(getByPlaceholderText("Monthly services income"), "5000");
    fireEvent.press(getByText("Add This Category"));

    const saveButton = getByText("Save to History");
    fireEvent.press(saveButton);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockUpsertGuestHistoryEntry).toHaveBeenCalledTimes(1);
      expect(mockScheduleHawlDueReminderNotification).toHaveBeenCalledTimes(1);
    });

    releaseSave();
    await waitFor(() => {
      expect(getByText("Save to History")).toBeTruthy();
    });
  });
});

