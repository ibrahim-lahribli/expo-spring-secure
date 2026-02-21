import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ssrSafeStorage } from "../lib/storage";
import type { NisabMethod } from "../lib/zakat-calculation";

const DEFAULT_NISAB_METHOD: NisabMethod = "silver";
const DEFAULT_SILVER_PRICE_PER_GRAM = 12;
const DEFAULT_GOLD_PRICE_PER_GRAM = 800;
const DEFAULT_NISAB_OVERRIDE = 0;

function toNonNegativeNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

interface NisabSettingsState {
  nisabMethod: NisabMethod;
  silverPricePerGram: number;
  goldPricePerGram: number;
  nisabOverride: number;
  setNisabMethod: (value: NisabMethod) => void;
  setSilverPricePerGram: (value: number) => void;
  setGoldPricePerGram: (value: number) => void;
  setNisabOverride: (value: number) => void;
  hydrateFrom: (
    partial: Partial<
      Pick<
        NisabSettingsState,
        | "nisabMethod"
        | "silverPricePerGram"
        | "goldPricePerGram"
        | "nisabOverride"
      >
    >,
  ) => void;
  reset: () => void;
}

export const useNisabSettingsStore = create<NisabSettingsState>()(
  persist(
    (set) => ({
      nisabMethod: DEFAULT_NISAB_METHOD,
      silverPricePerGram: DEFAULT_SILVER_PRICE_PER_GRAM,
      goldPricePerGram: DEFAULT_GOLD_PRICE_PER_GRAM,
      nisabOverride: DEFAULT_NISAB_OVERRIDE,
      setNisabMethod: (value) => set({ nisabMethod: value }),
      setSilverPricePerGram: (value) =>
        set({ silverPricePerGram: toNonNegativeNumber(value) }),
      setGoldPricePerGram: (value) =>
        set({ goldPricePerGram: toNonNegativeNumber(value) }),
      setNisabOverride: (value) => set({ nisabOverride: toNonNegativeNumber(value) }),
      hydrateFrom: (partial) =>
        set((state) => ({
          nisabMethod: partial.nisabMethod ?? state.nisabMethod,
          silverPricePerGram:
            partial.silverPricePerGram === undefined
              ? state.silverPricePerGram
              : toNonNegativeNumber(partial.silverPricePerGram),
          goldPricePerGram:
            partial.goldPricePerGram === undefined
              ? state.goldPricePerGram
              : toNonNegativeNumber(partial.goldPricePerGram),
          nisabOverride:
            partial.nisabOverride === undefined
              ? state.nisabOverride
              : toNonNegativeNumber(partial.nisabOverride),
        })),
      reset: () =>
        set({
          nisabMethod: DEFAULT_NISAB_METHOD,
          silverPricePerGram: DEFAULT_SILVER_PRICE_PER_GRAM,
          goldPricePerGram: DEFAULT_GOLD_PRICE_PER_GRAM,
          nisabOverride: DEFAULT_NISAB_OVERRIDE,
        }),
    }),
    {
      name: "nisab-settings",
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        nisabMethod: state.nisabMethod,
        silverPricePerGram: state.silverPricePerGram,
        goldPricePerGram: state.goldPricePerGram,
        nisabOverride: state.nisabOverride,
      }),
    },
  ),
);
