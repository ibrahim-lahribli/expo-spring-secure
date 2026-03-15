import { useDetailedHawlSetupDraftStore } from "../../store/detailedHawlSetupDraftStore";

describe("detailedHawlSetupDraftStore", () => {
  beforeEach(() => {
    useDetailedHawlSetupDraftStore.getState().clearDraft();
  });

  it("sets and clears draft", () => {
    useDetailedHawlSetupDraftStore.getState().setDraft({
      trackingMode: "yearly_zakat_date",
      referenceDate: "2026-03-10",
      calculationDate: "2026-03-10",
      saveAsDefault: true,
    });

    expect(useDetailedHawlSetupDraftStore.getState().draft).toEqual({
      trackingMode: "yearly_zakat_date",
      referenceDate: "2026-03-10",
      calculationDate: "2026-03-10",
      saveAsDefault: true,
    });

    useDetailedHawlSetupDraftStore.getState().clearDraft();
    expect(useDetailedHawlSetupDraftStore.getState().draft).toBeNull();
  });

  it("consumes draft once", () => {
    useDetailedHawlSetupDraftStore.getState().setDraft({
      trackingMode: "estimated",
      calculationDate: "2026-03-14",
      useToday: true,
    });

    const consumed = useDetailedHawlSetupDraftStore.getState().consumeDraft();
    expect(consumed).toEqual({
      trackingMode: "estimated",
      calculationDate: "2026-03-14",
      useToday: true,
    });
    expect(useDetailedHawlSetupDraftStore.getState().draft).toBeNull();
  });
});
