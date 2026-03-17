import { resolveLineItemDetailRows } from "../../features/history/detailRows";
import { formatHistoryIsoDate } from "../../features/history/dateFormatting";
import type { DetailedHistoryLineItem } from "../../features/history/types";

const t = (key: string) => `tr:${key}`;

describe("history detail row localization", () => {
  it("renders structured detail rows using current locale translations", () => {
    const item: DetailedHistoryLineItem = {
      id: "line-1",
      category: "livestock",
      totalZakat: 0,
      totalWealth: 0,
      detailRows: [
        { kind: "type", livestockType: "camels" },
        { kind: "owned", count: 30 },
        { kind: "due", dueItems: [{ kind: "sheep", count: 1 }] },
      ],
    };

    const lines = resolveLineItemDetailRows({
      lineItem: item,
      currency: "MAD",
      t,
    });

    expect(lines).toEqual([
      "tr:detailedCalculator.history.type: tr:detailedCalculator.livestock.types.camels",
      "tr:detailedCalculator.history.owned: 30",
      "tr:detailedCalculator.history.due: 1 tr:livestock.dueItem.sheep",
    ]);
  });

  it("best-effort re-localizes legacy labels and omits legacy due-status row when meta exists", () => {
    const item: DetailedHistoryLineItem = {
      id: "line-2",
      category: "salary",
      totalZakat: 10,
      totalWealth: 1000,
      details: [
        "Mode: Annuel",
        "Nisab: MAD 7,140.00",
        "Statut d'exigibilite: Date du hawl manquante / inconnue",
      ],
      meta: {
        obligationMode: "hawl_required",
        dueNow: false,
        debtAdjustable: true,
      },
    };

    const lines = resolveLineItemDetailRows({
      lineItem: item,
      currency: "MAD",
      t,
    });

    expect(lines).toEqual([
      "tr:detailedCalculator.history.mode: tr:detailedCalculator.modes.annual",
      "tr:detailedCalculator.history.nisab: MAD 7,140.00",
    ]);
  });

  it("keeps unknown legacy lines unchanged", () => {
    const item: DetailedHistoryLineItem = {
      id: "line-3",
      category: "salary",
      totalZakat: 10,
      totalWealth: 1000,
      details: ["Unmapped Label: Some value"],
    };

    const lines = resolveLineItemDetailRows({
      lineItem: item,
      currency: "MAD",
      t,
    });

    expect(lines).toEqual(["Unmapped Label: Some value"]);
  });

  it("formats legacy hawl/event date values with the active locale", () => {
    const item: DetailedHistoryLineItem = {
      id: "line-4",
      category: "salary",
      totalZakat: 10,
      totalWealth: 1000,
      details: [
        "Hawl due date: 2026-12-21",
        "Event date: 2026-08-01",
      ],
    };

    const lines = resolveLineItemDetailRows({
      lineItem: item,
      currency: "MAD",
      t,
      locale: "fr",
    });

    expect(lines).toEqual([
      `tr:history.groupedRows.hawlDueDate: ${formatHistoryIsoDate("2026-12-21", "fr")}`,
      `tr:history.groupedRows.eventDate: ${formatHistoryIsoDate("2026-08-01", "fr")}`,
    ]);
  });

  it("maps legacy event-missing unknown due-status to event-based localized text", () => {
    const item: DetailedHistoryLineItem = {
      id: "line-5",
      category: "produce",
      totalZakat: 0,
      totalWealth: 0,
      details: ["Due status: Event date missing / unknown"],
    };

    const lines = resolveLineItemDetailRows({
      lineItem: item,
      currency: "MAD",
      t,
    });

    expect(lines).toEqual([
      "tr:history.groupedRows.dueStatus: tr:history.groupedRows.unknownEvent",
    ]);
  });
});
