import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import HistoryDetailsScreen from "../../app/(public)/history/[id]";
import { formatHistoryIsoDate } from "../../features/history/dateFormatting";
import type { HistoryEntry } from "../../features/history/types";

const mockGetGuestHistoryEntryById = jest.fn();
let mockLanguage: "en" | "fr" = "en";

jest.mock("../../features/history/storage", () => ({
  getGuestHistoryEntryById: (...args: unknown[]) => mockGetGuestHistoryEntryById(...args),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    const enCommon = require("../../i18n/locales/en/common.json") as Record<string, unknown>;
    const frCommon = require("../../i18n/locales/fr/common.json") as Record<string, unknown>;
    const resources = { en: enCommon, fr: frCommon } as const;

    const t = (key: string, options?: Record<string, unknown>) => {
      const normalized = key.includes(":") ? key.split(":")[1] : key;
      const value = normalized.split(".").reduce<unknown>((acc, part) => {
        if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
          return (acc as Record<string, unknown>)[part];
        }
        return undefined;
      }, resources[mockLanguage]);

      const template = typeof value === "string" ? value : key;
      if (!options) return template;
      return template.replace(/\{(\w+)\}/g, (_, token) =>
        token in options ? String(options[token]) : `{${token}}`,
      );
    };

    return {
      t,
      i18n: {
        resolvedLanguage: mockLanguage,
        language: mockLanguage,
      },
    };
  },
}));

function buildEntry(): HistoryEntry {
  return {
    id: "history-entry-1",
    flowType: "detailed",
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-10T09:00:00.000Z",
    totalZakat: 125,
    currency: "MAD",
    nisabSnapshot: {
      method: "silver",
      silverPricePerGram: 12,
      goldPricePerGram: 800,
      override: null,
    },
    summary: {
      categoriesUsed: ["salary"],
      itemCount: 1,
    },
    payload: {
      kind: "detailed",
      combinedTotal: 125,
      calculationContext: {
        calculationDate: "2026-03-10",
      },
      lineItems: [
        {
          id: "line-1",
          category: "salary",
          label: "Saved English Label",
          totalZakat: 125,
          totalWealth: 5000,
          detailRows: [{ kind: "mode", mode: "annual" }],
          details: ["Stale Saved Detail"],
          meta: {
            obligationMode: "hawl_required",
            hawlStartDate: "2025-12-31",
            hawlDueDate: "2026-12-21",
            dueNow: false,
            debtAdjustable: true,
          },
        },
      ],
    },
  };
}

describe("HistoryDetailsScreen", () => {
  beforeEach(() => {
    mockLanguage = "en";
    mockGetGuestHistoryEntryById.mockReset();

    const routerModule = require("expo-router") as {
      useLocalSearchParams: jest.Mock;
    };
    routerModule.useLocalSearchParams.mockReturnValue({ id: "history-entry-1" });
  });

  it("re-localizes category chips and line-item titles from ids after language switch", async () => {
    mockGetGuestHistoryEntryById.mockResolvedValue(buildEntry());

    const { getAllByText, queryByText, rerender } = render(<HistoryDetailsScreen />);

    await waitFor(() => {
      expect(getAllByText("Salaries & Services").length).toBeGreaterThan(0);
    });
    expect(queryByText("Saved English Label")).toBeNull();
    expect(queryByText("Stale Saved Detail")).toBeNull();

    mockLanguage = "fr";
    rerender(<HistoryDetailsScreen />);

    await waitFor(() => {
      expect(getAllByText("Salaires et Services").length).toBeGreaterThan(0);
    });
    expect(queryByText("Saved English Label")).toBeNull();
    expect(queryByText("Stale Saved Detail")).toBeNull();
  });

  it("shows scheduled reminder status in history detail", async () => {
    const entry = buildEntry();
    if (entry.payload.kind !== "detailed") {
      throw new Error("Expected detailed entry");
    }
    entry.payload.reminders = [
      {
        id: "rem-1",
        historyEntryId: entry.id,
        lineItemId: "line-1",
        type: "hawl_due",
        reminderDate: "2026-12-21",
        scheduledNotificationId: "notif-1",
        enabled: true,
        status: "scheduled",
      },
    ];
    mockGetGuestHistoryEntryById.mockResolvedValue(entry);

    const { getByText } = render(<HistoryDetailsScreen />);

    await waitFor(() => {
      const expectedReminderDate = formatHistoryIsoDate("2026-12-21", "en");
      const expectedCalculationDate = formatHistoryIsoDate("2026-03-10", "en");
      expect(getByText("Reminder scheduled")).toBeTruthy();
      expect(getByText(`Next reminder date: ${expectedReminderDate}`)).toBeTruthy();
      expect(getByText("Calculation date")).toBeTruthy();
      expect(getByText(expectedCalculationDate)).toBeTruthy();
    });
  });

  it("formats grouped hawl/event metadata dates with the current locale", async () => {
    const entry = buildEntry();
    if (entry.payload.kind !== "detailed") {
      throw new Error("Expected detailed entry");
    }
    entry.payload.lineItems[0].meta = {
      obligationMode: "event_based",
      eventDate: "2026-08-01",
      dueNow: false,
      debtAdjustable: false,
    };
    mockGetGuestHistoryEntryById.mockResolvedValue(entry);

    const { getByText } = render(<HistoryDetailsScreen />);

    await waitFor(() => {
      const expectedEventDate = formatHistoryIsoDate("2026-08-01", "en");
      expect(getByText(`Event date: ${expectedEventDate}`)).toBeTruthy();
    });
  });

  it("uses event-based unknown wording for missing produce event date", async () => {
    const entry = buildEntry();
    if (entry.payload.kind !== "detailed") {
      throw new Error("Expected detailed entry");
    }
    entry.payload.lineItems[0].meta = {
      obligationMode: "event_based",
      dueNow: false,
      debtAdjustable: false,
    };
    mockGetGuestHistoryEntryById.mockResolvedValue(entry);

    const { getByText, queryByText } = render(<HistoryDetailsScreen />);

    await waitFor(() => {
      expect(getByText("Due status: Event date missing / unknown")).toBeTruthy();
      expect(queryByText("Due status: Hawl date missing / unknown")).toBeNull();
    });
  });

  it("shows no-upcoming reminder state when no reminder is scheduled", async () => {
    const entry = buildEntry();
    if (entry.payload.kind !== "detailed") {
      throw new Error("Expected detailed entry");
    }
    entry.payload.lineItems[0].meta = {
      obligationMode: "hawl_required",
      hawlStartDate: "2024-01-01",
      hawlDueDate: "2024-12-21",
      dueNow: true,
      debtAdjustable: true,
    };
    mockGetGuestHistoryEntryById.mockResolvedValue(entry);

    const { getByText } = render(<HistoryDetailsScreen />);

    await waitFor(() => {
      expect(getByText("No upcoming due reminder")).toBeTruthy();
    });
  });
});
