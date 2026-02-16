import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface LiabilityItem {
  id: string;
  amount: number;
  note?: string;
  createdAt: string; // ISO string for Zustand persistence compatibility
}

interface DebtsState {
  liabilitiesItems: LiabilityItem[];
  liabilitiesTotal: number;
  addLiability: (amount: number, note?: string) => void;
  updateLiability: (
    id: string,
    patch: Partial<Omit<LiabilityItem, "id" | "createdAt">>,
  ) => void;
  removeLiability: (id: string) => void;
  clearAll: () => void;
}

const calculateTotal = (items: LiabilityItem[]): number => {
  return items.reduce((sum, item) => sum + item.amount, 0);
};

export const useDebtsStore = create<DebtsState>()(
  persist(
    (set, get) => ({
      liabilitiesItems: [],
      liabilitiesTotal: 0,

      addLiability: (amount: number, note?: string) => {
        const newItem: LiabilityItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          amount: Math.abs(amount),
          note: note?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        const newItems = [...get().liabilitiesItems, newItem];

        set({
          liabilitiesItems: newItems,
          liabilitiesTotal: calculateTotal(newItems),
        });
      },

      updateLiability: (
        id: string,
        patch: Partial<Omit<LiabilityItem, "id" | "createdAt">>,
      ) => {
        const newItems = get().liabilitiesItems.map((item) => {
          if (item.id !== id) return item;

          const updatedItem: LiabilityItem = { ...item };

          if (patch.amount !== undefined) {
            updatedItem.amount = Math.abs(patch.amount);
          }

          if (patch.note !== undefined) {
            updatedItem.note = patch.note?.trim() || undefined;
          }

          return updatedItem;
        });

        set({
          liabilitiesItems: newItems,
          liabilitiesTotal: calculateTotal(newItems),
        });
      },

      removeLiability: (id: string) => {
        const newItems = get().liabilitiesItems.filter((item) => item.id !== id);

        set({
          liabilitiesItems: newItems,
          liabilitiesTotal: calculateTotal(newItems),
        });
      },

      clearAll: () => {
        set({
          liabilitiesItems: [],
          liabilitiesTotal: 0,
        });
      },
    }),
    {
      name: "debts-storage",
      storage: createJSONStorage(() => {
        return {
          getItem: async (name: string) => {
            if (typeof window === "undefined") {
              return null;
            }
            try {
              if (typeof localStorage !== "undefined") {
                return localStorage.getItem(name);
              } else {
                return await AsyncStorage.getItem(name);
              }
            } catch (error) {
              console.error("Error getting item from storage:", error);
              return null;
            }
          },
          setItem: async (name: string, value: string) => {
            if (typeof window === "undefined") {
              return;
            }
            try {
              if (typeof localStorage !== "undefined") {
                localStorage.setItem(name, value);
              } else {
                await AsyncStorage.setItem(name, value);
              }
            } catch (error) {
              console.error("Error setting item in storage:", error);
            }
          },
          removeItem: async (name: string) => {
            if (typeof window === "undefined") {
              return;
            }
            try {
              if (typeof localStorage !== "undefined") {
                localStorage.removeItem(name);
              } else {
                await AsyncStorage.removeItem(name);
              }
            } catch (error) {
              console.error("Error removing item from storage:", error);
            }
          },
        };
      }),
      partialize: (state) => ({
        liabilitiesItems: state.liabilitiesItems,
        liabilitiesTotal: state.liabilitiesTotal,
      }),
    },
  ),
);
