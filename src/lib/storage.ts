import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StateStorage } from "zustand/middleware";

export const ssrSafeStorage: StateStorage = {
  getItem: async (name: string) => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(name);
      }
      return await AsyncStorage.getItem(name);
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
