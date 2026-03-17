import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import HistoryScreen from "../../app/(public)/history/index";
import { formatHistoryDateTime } from "../../features/history/dateFormatting";
import type { HistoryEntry } from "../../features/history/types";

const mockGetGuestHistoryEntries = jest.fn();
const mockDeleteGuestHistoryEntry = jest.fn();
let mockLanguage: "en" | "fr" | "ar" = "en";

jest.mock("../../features/history/storage", () => ({
  getGuestHistoryEntries: (...args: unknown[]) => mockGetGuestHistoryEntries(...args),
  deleteGuestHistoryEntry: (...args: unknown[]) => mockDeleteGuestHistoryEntry(...args),
}));

jest.mock("react-native-paper", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");
  const actual = jest.requireActual("react-native-paper");

  const DialogBase = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
  DialogBase.Title = ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>;
  DialogBase.Content = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
  DialogBase.Actions = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;

  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Dialog: DialogBase,
    Button: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    const enCommon = require("../../i18n/locales/en/common.json") as Record<string, unknown>;
    const frCommon = require("../../i18n/locales/fr/common.json") as Record<string, unknown>;
    const arCommon = require("../../i18n/locales/ar/common.json") as Record<string, unknown>;
    const resources = { en: enCommon, fr: frCommon, ar: arCommon } as const;

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
    id: "history-list-entry-1",
    flowType: "detailed",
    createdAt: "2026-03-17T03:40:00.000Z",
    updatedAt: "2026-03-17T03:40:00.000Z",
    totalZakat: 0,
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
      calculationContext: {
        calculationDate: "2026-03-17",
      },
      combinedTotal: 0,
      lineItems: [
        {
          id: "line-1",
          category: "salary",
          totalZakat: 0,
          totalWealth: 4000,
          detailRows: [{ kind: "mode", mode: "annual" }],
        },
      ],
    },
  };
}

describe("HistoryScreen", () => {
  beforeEach(() => {
    mockLanguage = "en";
    mockGetGuestHistoryEntries.mockReset();
    mockDeleteGuestHistoryEntry.mockReset();
  });

  it("renders French history label and locale-aware date formatting", async () => {
    mockLanguage = "fr";
    const entry = buildEntry();
    const frCommon = require("../../i18n/locales/fr/common.json") as {
      history: { zakatDue: string };
    };
    mockGetGuestHistoryEntries.mockResolvedValue([entry]);

    const { getByText } = render(<HistoryScreen />);

    await waitFor(() => {
      expect(getByText(frCommon.history.zakatDue)).toBeTruthy();
      expect(getByText(formatHistoryDateTime(entry.createdAt, "fr"))).toBeTruthy();
    });
  });
});

