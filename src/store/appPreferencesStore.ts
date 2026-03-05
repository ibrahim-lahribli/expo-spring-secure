import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ssrSafeStorage } from "../lib/storage";

export type NisabMethodPreference = "gold" | "silver" | "auto";
export type NisabPricesSource = "manual" | "market" | "fatwa";
export type DatePreference = "hijri" | "gregorian";
export type ThemePreference = "system" | "light" | "dark";
export type SupportedCurrency = "MAD" | "USD" | "EUR";

interface AppPreferencesState {
  nisabMethodPreference: NisabMethodPreference;
  nisabPricesSource: NisabPricesSource;
  currency: SupportedCurrency;
  datePreference: DatePreference;
  zakatReminderEnabled: boolean;
  theme: ThemePreference;
  marketPricesLastUpdatedAt: string | null;
  setNisabMethodPreference: (value: NisabMethodPreference) => void;
  setNisabPricesSource: (value: NisabPricesSource) => void;
  setCurrency: (value: SupportedCurrency) => void;
  setDatePreference: (value: DatePreference) => void;
  setZakatReminderEnabled: (value: boolean) => void;
  setTheme: (value: ThemePreference) => void;
  setMarketPricesLastUpdatedAt: (value: string | null) => void;
}

export const useAppPreferencesStore = create<AppPreferencesState>()(
  persist(
    (set) => ({
      nisabMethodPreference: "silver",
      nisabPricesSource: "manual",
      currency: "MAD",
      datePreference: "gregorian",
      zakatReminderEnabled: false,
      theme: "system",
      marketPricesLastUpdatedAt: null,
      setNisabMethodPreference: (value) => set({ nisabMethodPreference: value }),
      setNisabPricesSource: (value) => set({ nisabPricesSource: value }),
      setCurrency: (value) => set({ currency: value }),
      setDatePreference: (value) => set({ datePreference: value }),
      setZakatReminderEnabled: (value) => set({ zakatReminderEnabled: value }),
      setTheme: (value) => set({ theme: value }),
      setMarketPricesLastUpdatedAt: (value) =>
        set({ marketPricesLastUpdatedAt: value }),
    }),
    {
      name: "app-preferences",
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        nisabMethodPreference: state.nisabMethodPreference,
        nisabPricesSource: state.nisabPricesSource,
        currency: state.currency,
        datePreference: state.datePreference,
        zakatReminderEnabled: state.zakatReminderEnabled,
        theme: state.theme,
        marketPricesLastUpdatedAt: state.marketPricesLastUpdatedAt,
      }),
    },
  ),
);

