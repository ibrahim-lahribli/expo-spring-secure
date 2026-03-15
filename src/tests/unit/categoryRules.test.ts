import { CATEGORY_RULES } from "../../lib/zakat-calculation/category-rules";

describe("CATEGORY_RULES", () => {
  it("defines all detailed categories with expected obligation/debt behavior", () => {
    expect(CATEGORY_RULES).toEqual({
      salary: { obligationMode: "hawl_required", debtAdjustable: true },
      trade_sector: { obligationMode: "hawl_required", debtAdjustable: true },
      industrial_sector: { obligationMode: "hawl_required", debtAdjustable: true },
      agri_other: { obligationMode: "hawl_required", debtAdjustable: true },
      livestock: { obligationMode: "hawl_required", debtAdjustable: false },
      produce: { obligationMode: "event_based", debtAdjustable: false },
      debt: { obligationMode: "adjustment", debtAdjustable: false },
    });
  });
});
