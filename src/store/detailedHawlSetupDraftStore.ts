import { create } from "zustand";

export type HawlTrackingMode =
  | "yearly_zakat_date"
  | "nisab_reached_date"
  | "estimated";

export type DetailedHawlSetupDraft = {
  trackingMode: HawlTrackingMode | null;
  referenceDate?: string;
  calculationDate?: string;
  useToday?: boolean;
  saveAsDefault?: boolean;
};

interface DetailedHawlSetupDraftState {
  draft: DetailedHawlSetupDraft | null;
  setDraft: (draft: DetailedHawlSetupDraft) => void;
  clearDraft: () => void;
  consumeDraft: () => DetailedHawlSetupDraft | null;
}

export const useDetailedHawlSetupDraftStore = create<DetailedHawlSetupDraftState>()((set, get) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
  consumeDraft: () => {
    const draft = get().draft;
    if (draft) {
      set({ draft: null });
    }
    return draft;
  },
}));
